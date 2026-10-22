/**
 * AIController.js — team brain (SPEC §2.8).
 *
 * AI-MATCH IMPLEMENTATION (replaces the core stub; constructor/update/freeze
 * contract unchanged). Per-player FSM:
 *
 *   GK               goal-line positioning (GK_LINE_OFFSET, tracks ball angle),
 *                    shot prediction + dive (GK_DIVE_SPEED), box claims, and
 *                    distribution (lob upfield ~1s after a claim).
 *   CHASE_BALL       only the nearest 1-2 players ever chase; loose balls are
 *                    intercepted (predicted point), an enemy carrier is pressed
 *                    and tackled (TACKLE_RADIUS / TACKLE_SUCCESS / fouls).
 *   MARK             defenders/midfielders without a chase assignment pick the
 *                    nearest unmarked opponent and stand goal-side (MARK_DIST).
 *   DEFEND_POSITION  weighted formation shape: home shifted toward the ball,
 *                    defensive line holding ~8-12m behind the ball line.
 *   SUPPORT          (we have the ball) shape pushes up: home shifted toward
 *                    the ball + role-based forward push, clamped onside.
 *   MAKE_RUN         the FW (and an advanced MF) runs the channel toward goal,
 *                    clamped to the second-last opponent (stays onside).
 *
 * Possessor decisions re-evaluate every CFG.AI.REACTION seconds:
 *   1. SHOOT when dist < SHOT_RANGE and the bearing to goal center <
 *      SHOT_ANGLE — aimed at the far corner, occasional finesse (Magnus spin).
 *   2. PASS to the most open teammate: score = forwardness + openness
 *      (distance of nearest opponent) - lane risk (an opponent within
 *      PASS_LANE_CHECK perpendicular distance of the pass segment blocks it).
 *      Teammates already beyond the second-last opponent (offside) are avoided.
 *   3. otherwise DRIBBLE toward goal/space, steering around opponents and
 *      refusing to dribble into 2+ defenders.
 *
 * The controller parks itself while MatchManager.state !== 'inplay' (via the
 * 'stateChange' event) so restarts belong to the referee; freeze(secs) adds a
 * manual hold on top (kickoff wiring in main.js). The user's controlled
 * player (team.controlled) is never AI-driven.
 *
 * Debugging: this.states (Map player -> FSM string) is exposed for tests.
 */
import * as THREE from 'three';
import { CFG } from '../config.js';
import { events } from '../core/events.js';

// Module-level temps — zero per-frame allocation.
const _v = new THREE.Vector3();
const _dir = { x: 0, y: 0 };
const _zero = { x: 0, y: 0 };
const _spin = new THREE.Vector3();
const _markPool = []; // reused marking pool (nulled entries = claimed)

const HALF_L = () => CFG.PITCH.LENGTH / 2;
const HALF_W = () => CFG.PITCH.WIDTH / 2;

export class AIController {
  /**
   * @param {import('./Team.js').Team} team
   * @param {import('../world/Ball.js').Ball} ball
   * @param {import('./Team.js').Team} opponentTeam
   */
  constructor(team, ball, opponentTeam) {
    this.team = team;
    this.ball = ball;
    this.opponentTeam = opponentTeam;

    this._freezeT = 0;
    this._matchState = 'kickoff';
    /** FSM state per player (debug/testing). @type {Map<object, string>} */
    this.states = new Map();

    this._decisionT = 0;        // possessor decision countdown
    this._prevOwner = null;     // owner transition tracking
    this._looseT = 99;          // time since the ball became loose
    this._gkDiveT = 0;          // active GK dive time
    this._gkDiveDir = new THREE.Vector3();
    this._gkHoldT = 0;          // claim -> distribution delay
    this._tackleCd = new Map(); // player -> cooldown
    this._assign = new Map();   // player -> {state, tx, tz, sprint, speed, press, mark}

    events.on('stateChange', ({ state }) => { this._matchState = state; });
  }

  /** Briefly halt all AI movement (restarts). */
  freeze(secs) { this._freezeT = Math.max(this._freezeT, secs); }

  // ---------------------------------------------------------------------------
  update(dt) {
    const team = this.team, ball = this.ball;

    // parked: restart states belong to the MatchManager; freeze is manual
    if (this._freezeT > 0) {
      this._freezeT -= dt;
      this._holdAll(dt);
      return;
    }
    if (this._matchState !== 'inplay') {
      this._holdAll(dt);
      return;
    }

    const owner = ball.owner;
    const ours = !!(owner && owner.team === team);
    const theirs = !!(owner && owner.team === this.opponentTeam);

    // loose-ball reaction delay (CFG.AI.REACTION before responding)
    if (!owner) {
      if (this._prevOwner) this._looseT = 0;
      this._looseT += dt;
    } else {
      this._looseT = 99;
    }
    // auto-switch the user to a teammate who just won the ball (home only)
    if (owner && owner !== this._prevOwner && owner.team === team &&
        team.controlled && !owner.controlled && owner.role !== 'GK') {
      team.setControlled(owner);
    }
    this._prevOwner = owner;

    this._assignRoles(ours, theirs);

    for (const p of team.players) {
      if (p.controlled) continue; // user drives this one

      if (p.role === 'GK') { this._updateGK(p, dt); continue; }

      if (owner === p) { this._updatePossessor(p, dt); continue; }

      const a = this._assign.get(p);
      if (!a) { p.move(_zero, false, dt); continue; }
      this.states.set(p, a.state);

      // pressing defender: tackle when in range of the carrier
      if (a.state === 'CHASE_BALL' && theirs && a.press) {
        this._tryTackle(p);
      }
      this._moveToward(p, a.tx, a.tz, a.speed, a.sprint, dt);
    }

    // tackle cooldowns
    for (const [pl, cd] of this._tackleCd) {
      if (cd > 0) this._tackleCd.set(pl, cd - dt);
    }
  }

  /** Decelerate everyone (except the user-controlled player) to a standstill. */
  _holdAll(dt) {
    for (const p of this.team.players) {
      if (!p.controlled) p.move(_zero, false, dt);
    }
  }

  // ---------------------------------------------------------------------------
  // Role assignment (team-level, once per step)
  // ---------------------------------------------------------------------------
  _assignRoles(ours, theirs) {
    const team = this.team, opp = this.opponentTeam, ball = this.ball;
    const atk = team.attacking;
    const A = CFG.AI;
    this._assign.clear();

    // --- pick chasers: nearest 1-2 non-GK, non-controlled players ---
    const owner = ball.owner;
    const wantChasers = theirs ? 2 : (!owner && this._looseT >= A.REACTION ? 2 : 0);
    if (wantChasers) {
      // intercept point for a loose ball = current pos + a beat of velocity
      const ix = owner ? ball.position.x : ball.position.x + ball.velocity.x * 0.25;
      const iz = owner ? ball.position.z : ball.position.z + ball.velocity.z * 0.25;
      // allocation-free two-nearest scan
      let n1 = null, n2 = null, d1 = Infinity, d2 = Infinity;
      for (const p of team.players) {
        if (p.role === 'GK' || p.controlled) continue;
        const dx = p.position.x - ix, dz = p.position.z - iz;
        const d = dx * dx + dz * dz;
        if (d < d1) { d2 = d1; n2 = n1; d1 = d; n1 = p; }
        else if (d < d2) { d2 = d; n2 = p; }
      }
      const ballSlow = ball.velocity.lengthSq() < 4;
      if (n1) {
        const dist1 = Math.sqrt(d1);
        // loose balls: chase inside the radius; a dead ball is always fetched
        if (owner || dist1 <= A.CHASE_RADIUS * 1.6 || ballSlow) {
          this._assign.set(n1, {
            state: 'CHASE_BALL', tx: ix, tz: iz,
            speed: 1, sprint: dist1 > 6 && dist1 < 30, press: theirs,
          });
          if (n2 && wantChasers > 1) {
            const dist2 = Math.sqrt(d2);
            if (dist2 <= A.CHASE_RADIUS) {
              this._assign.set(n2, {
                state: 'CHASE_BALL', tx: ix, tz: iz,
                speed: 0.9, sprint: dist2 > 8, press: false,
              });
            }
          }
        }
      }
    }

    // --- marking pool: opponents worth covering (our half / near the ball) ---
    // (module-level reused array; entries nulled as they are claimed)
    _markPool.length = 0;
    if (theirs || !owner) {
      for (const o of opp.players) {
        if (o.role === 'GK') continue;
        const ourHalf = (o.position.x * atk) < 12;
        const nearBall = o.position.distanceToSquared(ball.position) < 20 * 20;
        if (ourHalf || nearBall) _markPool.push(o);
      }
    }

    // --- everyone else: shape roles ---
    const onsideKey = this._secondLastOpponentKey(); // in (x * atk) space
    for (const p of team.players) {
      if (p.role === 'GK' || p.controlled || this._assign.has(p)) continue;
      if (owner === p) continue;

      // marker assignment: nearest unmarked opponent (DF first, then MF)
      if (_markPool.length && (p.role === 'DF' || p.role === 'MF')) {
        let bi = -1, bd2 = Infinity;
        for (let i = 0; i < _markPool.length; i++) {
          if (!_markPool[i]) continue;
          const d2 = p.position.distanceToSquared(_markPool[i].position);
          if (d2 < bd2) { bd2 = d2; bi = i; }
        }
        if (bi >= 0 && bd2 < 14 * 14) {
          const mark = _markPool[bi];
          _markPool[bi] = null; // claimed — no double-marking
          // stand goal-side of the mark at MARK_DIST
          const gx = team.ownGoalX;
          _v.set(mark.position.x - gx, 0, mark.position.z);
          const L = Math.max(0.001, _v.length());
          this._assign.set(p, {
            state: 'MARK',
            tx: mark.position.x + (_v.x / L) * A.MARK_DIST,
            tz: mark.position.z + (_v.z / L) * A.MARK_DIST,
            speed: 0.85, sprint: bd2 > 64,
          });
          continue;
        }
      }

      if (ours) {
        if (p.role === 'FW' || (p.role === 'MF' && this._mostAdvancedMF() === p)) {
          // MAKE_RUN: run the channel, clamped onside
          const runKey = Math.min(
            (p.position.x + atk * 12) * atk,
            onsideKey - 1.2,
            (HALF_L() - 4)
          );
          this._assign.set(p, {
            state: 'MAKE_RUN',
            tx: runKey * atk,
            tz: p.home.z * 0.6,
            speed: 1, sprint: true,
          });
        } else {
          // SUPPORT: shifted shape + forward push, clamped onside for MF/FW
          const w = p.role === 'DF' ? 0.22 : 0.34;
          const push = p.role === 'DF' ? 2 : 5;
          let tx = p.home.x + (ball.position.x - p.home.x) * w + atk * push;
          const key = tx * atk;
          const maxKey = Math.min(onsideKey - 1.0, HALF_L() - 3);
          if (p.role !== 'DF' && key > maxKey) tx = maxKey * atk;
          const tz = p.home.z + (ball.position.z - p.home.z) * w * 0.8;
          this._assign.set(p, {
            state: 'SUPPORT', tx, tz,
            speed: 0.7, sprint: false,
          });
        }
      } else {
        // DEFEND_POSITION: weighted shape; DF line holds ~10m behind the ball
        const w = p.role === 'DF' ? 0.16 : p.role === 'MF' ? 0.3 : 0.34;
        let tx = p.home.x + (ball.position.x - p.home.x) * w;
        let tz = p.home.z + (ball.position.z - p.home.z) * w * 0.8;
        if (p.role === 'DF') {
          const lineX = ball.position.x - atk * 10;          // ~10m behind ball
          const deepest = team.ownGoalX + atk * 5;           // but not into the net
          // clamp into [deepest, lineX] (in attack-relative space)
          let key = tx * atk;
          const hiKey = lineX * atk;                          // max (toward attack)
          const loKey = deepest * atk;                        // min (toward own goal)
          key = Math.min(key, hiKey);
          if (key < loKey) key = Math.max(loKey, hiKey - 4);  // ball in our box: drop
          tx = key * atk;
          tz = tz * 0.6 + ball.position.z * 0.16;
        } else {
          tx -= atk * 2; // midfielders drop a touch when defending
        }
        this._assign.set(p, {
          state: 'DEFEND_POSITION', tx, tz,
          speed: 0.65, sprint: false,
        });
      }
    }
  }

  /** The MF with the most advanced position (attack-relative), or null. */
  _mostAdvancedMF() {
    const atk = this.team.attacking;
    let best = null, bestKey = -Infinity;
    for (const p of this.team.players) {
      if (p.role !== 'MF' || p.controlled) continue;
      const key = p.position.x * atk;
      if (key > bestKey) { bestKey = key; best = p; }
    }
    return best;
  }

  /** x*attacking of the second-last opponent (offside line incl. their GK). */
  _secondLastOpponentKey() {
    const atk = this.team.attacking;
    let m1 = -Infinity, m2 = -Infinity;
    for (const o of this.opponentTeam.players) {
      const key = o.position.x * atk;
      if (key > m1) { m2 = m1; m1 = key; }
      else if (key > m2) { m2 = key; }
    }
    return m2 === -Infinity ? HALF_L() : m2;
  }

  // ---------------------------------------------------------------------------
  // Possessor
  // ---------------------------------------------------------------------------
  _updatePossessor(p, dt) {
    if (p.stunned) { p.move(_zero, false, dt); return; }
    this.states.set(p, 'SUPPORT'); // on the ball = focal support point

    const A = CFG.AI;
    this._decisionT -= dt;

    // under pressure (2+ opponents close)? force an early decision
    const pressure = this._opponentsWithin(p.position, 3.2);
    if (this._decisionT <= 0 || pressure >= 2) {
      this._decisionT = A.REACTION;
      if (this._tryShoot(p)) return;
      if (this._tryPass(p)) return;
    }
    this._dribble(p, dt);
  }

  /** Count opponents within `r` metres of `pos`. */
  _opponentsWithin(pos, r) {
    let n = 0;
    const r2 = r * r;
    for (const o of this.opponentTeam.players) {
      if (o.position.distanceToSquared(pos) < r2) n++;
    }
    return n;
  }

  /** SHOOT when in range with a clean enough bearing. Aims at the far corner. */
  _tryShoot(p) {
    const atk = this.team.attacking;
    const goalX = this.team.attackGoalX;
    const dx = goalX - p.position.x;
    const dist = Math.hypot(dx, p.position.z);
    if (dist >= CFG.AI.SHOT_RANGE) return false;
    const bearing = Math.abs(Math.atan2(p.position.z, Math.max(1, dx * atk)));
    if (bearing >= CFG.AI.SHOT_ANGLE) return false;

    // aim at the far corner (opposite side of the goal from the shooter)
    const farZ = (p.position.z >= 0 ? -1 : 1) * (CFG.PITCH.GOAL_W / 2 - 0.55);
    _v.set(goalX - p.position.x, 0, farZ - p.position.z).normalize();
    const power = Math.min(CFG.KICK.SHOT_MAX, Math.max(CFG.KICK.SHOT_MIN + 4, dist * 1.2));
    // occasional finesse: side spin bending back toward the far corner
    let spin = null;
    if (Math.random() < 0.3) {
      const curveSign = -Math.sign(farZ - p.position.z) * atk; // spin.y sign
      _spin.set(0, 0.5 * curveSign, 0);
      spin = _spin;
    }
    p.playKickAnim();
    this.ball.kick(_v, power, { lob: 0.08 + Math.random() * 0.08, spinVec: spin });
    return true;
  }

  /**
   * PASS to the most open teammate.
   * score = forwardness + openness - lane risk (lane blocked when any opponent
   * sits within CFG.AI.PASS_LANE_CHECK perpendicular distance of the segment).
   */
  _tryPass(p) {
    const atk = this.team.attacking;
    const opp = this.opponentTeam;
    let best = null, bestScore = 1.2; // threshold: below this, keep dribbling
    const onsideKey = this._secondLastOpponentKey(); // don't feed offside runners

    for (const m of this.team.players) {
      if (m === p) continue;
      const dx = m.position.x - p.position.x;
      const dz = m.position.z - p.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 3) continue;

      const forwardness = dx * atk;
      // openness = distance of the nearest opponent to the receiver
      let nearestOpp = Infinity;
      for (const o of opp.players) {
        const d = o.position.distanceTo(m.position);
        if (d < nearestOpp) nearestOpp = d;
      }
      // lane risk: perpendicular distance of any opponent to the segment
      let laneBlocked = false;
      const inv = 1 / Math.max(0.001, dist);
      const ux = dx * inv, uz = dz * inv;
      for (const o of opp.players) {
        const ox = o.position.x - p.position.x;
        const oz = o.position.z - p.position.z;
        const t = ox * ux + oz * uz;
        if (t < 1 || t > dist - 1) continue;
        const perp = Math.abs(ox * uz - oz * ux);
        if (perp < CFG.AI.PASS_LANE_CHECK * 0.5) { laneBlocked = true; break; }
      }

      let score = forwardness * 0.12 + Math.min(nearestOpp, 12) * 0.55 - dist * 0.045;
      if (laneBlocked) score -= 9;
      if (m.role === 'GK') score -= 6;          // back-pass to GK = last resort
      // a teammate already beyond the second-last opponent is offside — avoid
      if (m.position.x * atk > onsideKey + 0.3 && m.position.x * atk > 0) score -= 12;
      if (score > bestScore) { bestScore = score; best = m; }
    }

    if (!best) return false;

    _v.copy(best.position).addScaledVector(best.velocity, 0.25).sub(p.position);
    const dist = Math.hypot(_v.x, _v.z);
    _v.y = 0;
    _v.normalize();
    const power = Math.min(CFG.KICK.PASS_MAX, Math.max(CFG.KICK.PASS_MIN, dist * 1.35));
    p.playKickAnim();
    this.ball.kick(_v, power);
    // FIFA-style: hand the user the receiver (no-op for the pure-AI team)
    if (this.team.controlled && best.role !== 'GK') this.team.setControlled(best);
    return true;
  }

  /** Dribble toward goal/space, steering around opponents (never into 2+). */
  _dribble(p, dt) {
    const atk = this.team.attacking;
    const goalX = this.team.attackGoalX;

    // base direction: toward goal center
    let gx = goalX - p.position.x;
    let gz = -p.position.z;
    const gd = Math.max(0.001, Math.hypot(gx, gz));
    gx /= gd; gz /= gd;

    // avoidance + "don't dribble into 2+ opponents"
    let lat = 0, ahead = 0;
    for (const o of this.opponentTeam.players) {
      const ox = o.position.x - p.position.x;
      const oz = o.position.z - p.position.z;
      const d = Math.hypot(ox, oz);
      if (d > 5) continue;
      const dot = ox * gx + oz * gz;
      if (dot > 0) {
        ahead++;
        // steer sideways away from the defender (perpendicular to goal dir)
        const side = (gx * oz - gz * ox) >= 0 ? -1 : 1;
        lat += side * (5 - d) * 0.3;
      }
    }

    if (ahead >= 2) {
      // boxed in: hold up / shield while the decision timer finds a pass
      p.move(_zero, false, dt);
      return;
    }

    // compose final direction: goal-ward + lateral avoidance
    _dir.x = gx + (-gz) * lat * 0.6;
    _dir.y = gz + (gx) * lat * 0.6;
    const m = Math.hypot(_dir.x, _dir.y);
    if (m > 1e-4) { _dir.x /= m; _dir.y /= m; }
    const openField = this._opponentsWithin(p.position, 9) === 0;
    p.move(_dir, openField, dt);
  }

  // ---------------------------------------------------------------------------
  // Tackling (pressing defender)
  // ---------------------------------------------------------------------------
  _tryTackle(p) {
    const cd = this._tackleCd.get(p) || 0;
    if (cd > 0) return;
    const carrier = this.ball.owner;
    if (!carrier || carrier.team !== this.opponentTeam) return;
    const d = p.position.distanceTo(carrier.position);
    if (d > CFG.AI.TACKLE_RADIUS) return;

    this._tackleCd.set(p, 1.4);
    p.playTackleAnim();
    events.emit('sfx', { name: 'tackle' });

    if (Math.random() < CFG.AI.TACKLE_SUCCESS) {
      this.ball.giveTo(p); // clean win
    } else {
      p.stun(0.5); // beaten by the dribbler
      // clumsy challenges near the victim are fouls -> MatchManager awards FK
      if (d <= CFG.AI.FOUL_DANGER_RADIUS && Math.random() < 0.5) {
        carrier.stun(0.5);
        events.emit('foul', { team: this.team, pos: p.position.clone() });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Goalkeeper
  // ---------------------------------------------------------------------------
  _updateGK(gk, dt) {
    const A = CFG.AI, P = CFG.PITCH;
    const atk = this.team.attacking;
    const goalX = this.team.ownGoalX;
    const ball = this.ball;
    this.states.set(gk, 'GK');

    // --- we have the ball (claim / handoff): distribute after ~1s ---
    if (ball.owner === gk) {
      this._gkHoldT += dt;
      gk.move(_zero, false, dt);
      if (this._gkHoldT >= 1.0) {
        this._gkHoldT = 0;
        this._gkDistribute(gk);
      }
      return;
    }
    this._gkHoldT = 0;

    // --- active dive: ride the lunge out ---
    if (this._gkDiveT > 0) {
      this._gkDiveT -= dt;
      gk.velocity.copy(this._gkDiveDir).multiplyScalar(A.GK_DIVE_SPEED);
      gk.position.addScaledVector(gk.velocity, dt);
      this._clampToPitch(gk);
      return;
    }

    // --- shot prediction: ball crossing our goal plane inside the frame? ---
    if (!ball.owner && this._predictGoalThreat(gk)) return; // dive triggered inside

    // --- claim slow balls in the box ---
    if (!ball.owner && this._gkCanClaim(gk)) {
      this._moveToward(gk, ball.position.x, ball.position.z, 1, true, dt);
      return;
    }

    // --- base positioning: on the line (GK_LINE_OFFSET), tracking ball angle ---
    const distBall = Math.hypot(ball.position.x - goalX, ball.position.z);
    // step out to narrow the angle when the ball gets close
    const advance = Math.min(3, Math.max(0, (22 - distBall) * 0.14));
    const tx = goalX + atk * (A.GK_LINE_OFFSET + advance);
    const zTrack = ball.position.z * Math.min(0.55, 8 / Math.max(8, distBall));
    const tz = Math.max(-P.GOAL_W / 2 + 0.3, Math.min(P.GOAL_W / 2 - 0.3, zTrack));
    this._moveToward(gk, tx, tz, 0.85, false, dt);
  }

  /**
   * If the free ball is a shot crossing our goal plane inside the frame within
   * ~0.8s, trigger a dive (lunge at GK_DIVE_SPEED toward the intercept point).
   * @returns {boolean} true when a dive started.
   */
  _predictGoalThreat(gk) {
    const ball = this.ball;
    const atk = this.team.attacking;
    const goalX = this.team.ownGoalX;
    const inward = -atk; // velocity sign that moves toward our goal
    const vx = ball.velocity.x;
    if (vx * inward <= 1) return false; // not coming at us

    const t = (goalX + atk * 0.4 - ball.position.x) / vx;
    if (t <= 0 || t > 0.8) return false;
    const zc = ball.position.z + ball.velocity.z * t;
    // height at the line; the ground plane keeps low balls rolling, so clamp
    // the pure-projectile estimate at ball height (low drives stay saveable)
    let yc = ball.position.y + ball.velocity.y * t + 0.5 * CFG.BALL.GRAVITY * t * t;
    if (yc < CFG.BALL.RADIUS) yc = CFG.BALL.RADIUS;
    if (Math.abs(zc) > CFG.PITCH.GOAL_W / 2 + 0.5 || yc > CFG.PITCH.GOAL_H + 0.3) {
      return false; // wide / over
    }

    // dive at the intercept point on the GK line; dive time scales with the
    // distance so the keeper arrives AT the ball line instead of overshooting
    const tx = goalX + atk * CFG.AI.GK_LINE_OFFSET;
    const tz = Math.max(-CFG.PITCH.GOAL_W / 2, Math.min(CFG.PITCH.GOAL_W / 2, zc));
    this._gkDiveDir.set(tx - gk.position.x, 0, tz - gk.position.z);
    if (this._gkDiveDir.lengthSq() < 1e-6) this._gkDiveDir.set(inward, 0, 0);
    const dist = this._gkDiveDir.length();
    this._gkDiveDir.normalize();
    this._gkDiveT = Math.min(0.5, Math.max(0.12, dist / CFG.AI.GK_DIVE_SPEED));
    gk.playTackleAnim(); // low lunge visual doubles as a dive
    gk.facing.copy(this._gkDiveDir);
    return true;
  }

  /** GK may come collect a slow free ball inside (or near) the penalty box. */
  _gkCanClaim(gk) {
    const ball = this.ball;
    if (ball.position.y > 1.1) return false;
    if (ball.velocity.length() > 5) return false;
    const atk = this.team.attacking;
    const intoPitch = (ball.position.x - this.team.ownGoalX) * atk;
    if (intoPitch < -0.5 || intoPitch > CFG.PITCH.BOX_DEPTH + 2) return false;
    if (Math.abs(ball.position.z) > CFG.PITCH.BOX_W / 2) return false;
    // don't rush out into a striker who is already on it
    for (const o of this.opponentTeam.players) {
      if (o.position.distanceToSquared(ball.position) < 2.5 * 2.5) {
        const gkD = gk.position.distanceTo(ball.position);
        if (o.position.distanceTo(ball.position) < gkD) return false;
      }
    }
    return true;
  }

  /** Lob the ball upfield to the most advanced open teammate. */
  _gkDistribute(gk) {
    const atk = this.team.attacking;
    let best = null, bestScore = -Infinity;
    for (const m of this.team.players) {
      if (m === gk) continue;
      let nearestOpp = Infinity;
      for (const o of this.opponentTeam.players) {
        const d = o.position.distanceTo(m.position);
        if (d < nearestOpp) nearestOpp = d;
      }
      const score = m.position.x * atk + Math.min(nearestOpp, 12) * 1.5 + (m.role === 'FW' ? 8 : 0);
      if (score > bestScore) { bestScore = score; best = m; }
    }
    gk.playKickAnim();
    if (best) {
      _v.copy(best.position).addScaledVector(best.velocity, 0.4).sub(gk.position);
      const dist = Math.hypot(_v.x, _v.z);
      _v.y = 0;
      _v.normalize();
      const power = Math.min(CFG.KICK.LOB_MAX, Math.max(CFG.KICK.LOB_MIN, dist * 0.62));
      this.ball.kick(_v, power, { lob: CFG.KICK.LOB_HEIGHT });
    } else {
      _v.set(atk, 0, 0.15);
      this.ball.kick(_v, CFG.KICK.LOB_MAX * 0.8, { lob: CFG.KICK.LOB_HEIGHT });
    }
  }

  // ---------------------------------------------------------------------------
  // Movement helpers
  // ---------------------------------------------------------------------------

  /** Move toward a point; stop when close. speed 0..1 of jog, sprint flag. */
  _moveToward(p, x, z, speed, sprint, dt) {
    const dx = x - p.position.x, dz = z - p.position.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.6) { p.move(_zero, false, dt); return; }
    const s = Math.min(1, speed);
    _dir.x = (dx / d) * s;
    _dir.y = (dz / d) * s;
    p.move(_dir, sprint && d > 3, dt);
  }

  _clampToPitch(p) {
    const hx = HALF_L() - 0.4, hz = HALF_W() - 0.4;
    p.position.x = Math.min(hx, Math.max(-hx, p.position.x));
    p.position.z = Math.min(hz, Math.max(-hz, p.position.z));
    p.position.y = 0;
  }
}

export default AIController;
