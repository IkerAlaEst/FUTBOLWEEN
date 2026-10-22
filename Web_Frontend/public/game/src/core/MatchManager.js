/**
 * MatchManager.js — match state machine, score, clock, rules (SPEC §2.10 + §3).
 *
 * AI-MATCH IMPLEMENTATION (replaces the core stub; constructor/state/score/
 * clock/half/update/pause/resume/restart/onBallOut contract unchanged).
 *
 * States: kickoff | inplay | out | goal | freekick | corner | halftime |
 *         fulltime | paused  ('stateChange' emitted on every transition).
 *
 *   - Clock counts up, CFG.MATCH.HALF_MINUTES per half. Halftime swaps
 *     attacking directions (Team.swapSides) and kicks off to the AWAY team;
 *     fulltime emits 'matchEnd' (+ result toast); restart() restores the
 *     original directions and resets everything.
 *   - Goal detection: pitch.inGoal(ball.position) — whole ball over the line
 *     between the posts, only from 'inplay'. Score++, 'goal' (Team OBJECT),
 *     'crowd_goal' sfx + whistle, scorer celebrates, CFG.MATCH.CELEBRATION_SECS
 *     pause, then kickoff to the CONCEDING team.
 *   - Out of bounds: Ball calls onBallOut(pitch.outInfo(...)) — side strings
 *     are converted to Team objects. Throw-in: nearest opponent of the
 *     last-toucher gets the ball at the exit point; corner: ball into the
 *     corner arc, taker auto-selected, AI taker plays a charged cross into
 *     the box; goal-kick: GK from the goal area. Restarts freeze everyone
 *     else briefly (stun) and the AI parks until play resumes.
 *   - Simplified offside (CFG.MATCH.OFFSIDE_ENABLED): on a pass release
 *     (detected via Ball's 'sfx' kick emission) if the intended receiver —
 *     nearest teammate in the pass direction — is beyond the second-last
 *     opponent AND in the attacking half at the moment of the kick: whistle,
 *     "OFFSIDE" toast (+ 'foul' {offside:true} event), freekick to the
 *     opponents from the receiver's spot.
 *   - Fouls: 'foul' events (PlayerController slide tackles, AI tackles) are
 *     verified against FOUL_DANGER_RADIUS of the victim, then become a
 *     freekick: taker placed at the spot, opponents auto-walled ~9.15m toward
 *     goal, everyone else held back, brief freeze; AI taker shoots when in
 *     range else passes; the user takes home-team set pieces.
 *
 * Ball hooks consumed: ball.matchRef (wired here), ball.lastTouch,
 * ball.giveTo(player), ball.reset(x, z).
 */
import * as THREE from 'three';
import { CFG } from '../config.js';
import { events } from './events.js';

const HALF_SECS = () => CFG.MATCH.HALF_MINUTES * 60;
const WALL_DIST = () => CFG.PITCH.CENTER_CIRCLE_R; // 9.15m — the lawful distance

const _v = new THREE.Vector3();
const _spot = new THREE.Vector3();

export class MatchManager {
  /**
   * @param {{teams:{home:import('../entities/Team.js').Team,
   *                 away:import('../entities/Team.js').Team},
   *          ball:import('../world/Ball.js').Ball,
   *          hud:import('../ui/HUD.js').HUD,
   *          pitch:import('../world/Pitch.js').Pitch}} deps
   */
  constructor({ teams, ball, hud, pitch }) {
    this.teams = teams;
    this.ball = ball;
    this.hud = hud;
    this.pitch = pitch;

    /** @type {'kickoff'|'inplay'|'out'|'goal'|'freekick'|'corner'|'halftime'|'fulltime'|'paused'} */
    this.state = 'kickoff';
    this.score = { home: 0, away: 0 };
    this.clock = 0;   // seconds elapsed, counts up across both halves
    this.half = 1;

    this._stateT = 1.2;          // countdown for transient states
    this._kickoffTeam = teams.home;
    this._prevState = 'inplay';
    this._restart = null;        // active set-piece record (see _startRestart)
    this._homeStartDir = teams.home.attacking; // restore on restart()

    // Ball reports boundary exits here.
    ball.matchRef = this;

    // Fouls (slide tackles / AI tackles) -> freekick. Offside payloads are
    // re-entrant from _onKickReleased (already handled there).
    events.on('foul', (p) => this._onFoul(p));
    // Pass-release detection for the offside rule: Ball.kick emits 'sfx'
    // {name:'kick'} synchronously with lastTouch = kicker and the new
    // velocity = the pass direction.
    events.on('sfx', (p) => { if (p && p.name === 'kick') this._onKickReleased(); });

    this._setupKickoff(teams.home);
  }

  // ---------------------------------------------------------------------------
  update(dt) {
    switch (this.state) {
      case 'paused':
      case 'fulltime':
        return; // fully frozen (pause menu / result screen own the UX)

      case 'halftime':
        this._stateT -= dt;
        if (this._stateT <= 0) this._startSecondHalf();
        return;

      case 'kickoff':
        this._stateT -= dt;
        if (this._stateT <= 0) this._setState('inplay');
        return;

      case 'goal':
        this._stateT -= dt;
        if (this._stateT <= 0) this._setupKickoff(this._kickoffTeam);
        return;

      case 'out':
      case 'corner':
      case 'freekick':
        this._updateRestart(dt);
        return;

      case 'inplay':
      default: {
        this.clock += dt;
        this._checkClock();
        if (this.state !== 'inplay') return; // clock event changed the state
        this._checkGoal();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Goals
  // ---------------------------------------------------------------------------
  _checkGoal() {
    if (this.state !== 'inplay') return; // never re-trigger during celebrations
    if (!this.pitch || typeof this.pitch.inGoal !== 'function') return;
    const side = this.pitch.inGoal(this.ball.position); // 'home'|'away'|null
    if (!side) return;

    // `side` is the goal that was scored IN (defended by that side).
    const scorer = side === 'home' ? this.teams.away : this.teams.home;
    this.score[scorer.side] += 1;
    this._kickoffTeam = side === 'home' ? this.teams.home : this.teams.away; // conceding team kicks off

    // scorer attribution: ball.lastTouch is still the scoring kick's player at
    // detection time. An own-goal toucher plays for the conceding team — in
    // that case show only the team name.
    const scorerPlayer = this.ball.lastTouch;
    const scorerLabel = scorerPlayer?.displayName && scorerPlayer.team === scorer
      ? `${scorerPlayer.displayName} — ${scorer.name}`
      : scorer.name;

    events.emit('goal', { team: scorer, scorer: scorerPlayer });
    events.emit('sfx', { name: 'crowd_goal' });
    events.emit('sfx', { name: 'whistle' });
    this.hud?.showGoal?.(scorerLabel);
    for (const p of scorer.players) p.celebrate();

    this._stateT = CFG.MATCH.CELEBRATION_SECS;
    this._setState('goal');
  }

  // ---------------------------------------------------------------------------
  // Clock / halves
  // ---------------------------------------------------------------------------
  _checkClock() {
    const end1 = HALF_SECS();
    const end2 = end1 * 2;
    if (this.half === 1 && this.clock >= end1) {
      events.emit('sfx', { name: 'whistle' });
      events.emit('halfEnd', { half: 1 });
      this.hud?.showToast?.('HALF TIME');
      this._stateT = 3;
      this._setState('halftime');
    } else if (this.half === 2 && this.clock >= end2) {
      events.emit('sfx', { name: 'whistle' });
      events.emit('halfEnd', { half: 2 });
      events.emit('matchEnd', { score: { home: this.score.home, away: this.score.away } });
      const s = this.score;
      this.hud?.showToast?.(`FULL TIME  ${this.teams.home.name} ${s.home} — ${s.away} ${this.teams.away.name}`);
      this._setState('fulltime');
    }
  }

  /** Halftime side swap: mirror both teams, away kicks off the second half. */
  _startSecondHalf() {
    this.half = 2;
    this.teams.home.swapSides();
    this.teams.away.swapSides();
    this._setupKickoff(this.teams.away);
  }

  // ---------------------------------------------------------------------------
  // Out of bounds (called by Ball)
  // ---------------------------------------------------------------------------
  /**
   * @param {{kind:'throwin'|'corner'|'goalkick', team:string}} info
   * info.team is a SIDE STRING ('home'|'away') as returned by pitch.outInfo().
   */
  onBallOut(info) {
    // handle exits from live play AND from a botched restart (ball re-crosses)
    if (this.state === 'goal' || this.state === 'halftime' ||
        this.state === 'fulltime' || this.state === 'paused') return;

    // A ball crossing the goal line INSIDE the frame is a goal, not a corner/
    // goal-kick. pitch.outInfo fires the moment the ball touches the line,
    // while pitch.inGoal requires the WHOLE ball over it (1-2 steps later) —
    // defer those reports so _checkGoal can register the goal first. (Mirrors
    // the polish-branch fix inside outInfo; harmless duplication. A ball over
    // the bar still exits normally; one dying exactly on the line stays live
    // and the GK claim tidies it up.)
    if ((info.kind === 'corner' || info.kind === 'goalkick') &&
        Math.abs(this.ball.position.z) <= CFG.PITCH.GOAL_W / 2 &&
        this.ball.position.y <= CFG.PITCH.GOAL_H) {
      return;
    }

    const team = this.teams[info.team] || this.teams.home; // side string -> Team object
    events.emit('sfx', { name: 'whistle' });

    if (info.kind === 'throwin') this._setupThrowin(team);
    else if (info.kind === 'corner') this._setupCorner(team);
    else this._setupGoalkick(team);
  }

  // ---------------------------------------------------------------------------
  // Restart plumbing
  // ---------------------------------------------------------------------------
  /**
   * Common set-piece bookkeeping. The AI parks (state !== 'inplay') until the
   * ball is put back in play; the taker gets the ball; everyone else is
   * briefly stunned (the "freeze").
   */
  _startRestart(state, kind, team, taker, spot, aiDelay) {
    for (const p of team.players) {
      if (p !== taker) p.stun(Math.max(0.6, aiDelay * 0.8));
    }
    const opp = team.opponent;
    if (opp) for (const p of opp.players) p.stun(Math.max(0.6, aiDelay * 0.8));

    this._restart = {
      kind, team, taker,
      spot: spot.clone ? spot.clone() : new THREE.Vector3(spot.x, 0, spot.z),
      timer: aiDelay, executed: false, maxWait: 6,
    };
    this._stateT = aiDelay;
    this._setState(state);

    // human-controlled teams take their own set pieces (home always; away when P2 is in)
    if (taker && (team === this.teams.home || team.controlled)) {
      team.setControlled(taker);
    }
  }

  _updateRestart(dt) {
    const r = this._restart;
    if (!r) { this._setState('inplay'); return; }

    // ball left the taker (kick taken, or poked away) => play is live
    if (this.ball.owner !== r.taker) {
      this._restart = null;
      this._setState('inplay');
      return;
    }

    // user taker dribbled off with it => live
    const moved = r.taker.position.distanceTo(r.spot);
    if (moved > 2) {
      this._restart = null;
      this._setState('inplay');
      return;
    }

    r.timer -= dt;
    if (r.timer <= 0 && !r.executed) {
      if (r.taker.controlled) {
        // wait for the user — but never stall the match forever
        r.maxWait -= dt;
        if (r.maxWait <= 0) this._executeRestart(r);
      } else {
        this._executeRestart(r);
      }
    }
  }

  /** AI taker puts the ball back in play (per restart kind). */
  _executeRestart(r) {
    r.executed = true;
    const taker = r.taker;
    if (this.ball.owner !== taker) return;
    taker.playKickAnim();
    switch (r.kind) {
      case 'corner': this._cornerCross(r); break;
      case 'freekick': this._freekickTake(r); break;
      case 'goalkick': this._goalkickTake(r); break;
      default: this._shortPass(r); break; // throw-in
    }
    // play resumes on the next update (owner becomes null after the kick)
  }

  // ---------------------------------------------------------------------------
  // Throw-in / corner / goal-kick setups
  // ---------------------------------------------------------------------------
  _setupThrowin(team) {
    const halfL = CFG.PITCH.LENGTH / 2 - 0.6;
    const halfW = CFG.PITCH.WIDTH / 2 - 0.4;
    const x = Math.min(halfL, Math.max(-halfL, this.ball.position.x));
    const z = this.ball.position.z >= 0 ? halfW : -halfW;
    _spot.set(x, 0, z);

    // nearest opponent of the last-toucher (= nearest player of awarded team)
    const taker = team.closestToBall(_spot, team.gk) || team.gk;
    taker.resetTo({ x, y: 0, z: z - Math.sign(z) * 0.35 });
    this.ball.reset(x, z);
    this.ball.giveTo(taker);

    events.emit('outOfBounds', { kind: 'throwin', team });
    this.hud?.showToast?.(`THROW-IN — ${team.name}`);
    this._startRestart('out', 'throwin', team, taker, _spot, 0.9);
  }

  _setupCorner(team) {
    const atk = team.attacking;
    const gx = team.attackGoalX;
    const zSign = this.ball.position.z >= 0 ? 1 : -1;
    const x = gx - atk * 0.6;
    const z = zSign * (CFG.PITCH.WIDTH / 2 - 0.6);
    _spot.set(x, 0, z);

    const taker = team.closestToBall(_spot, team.gk) || team.gk;
    taker.resetTo({ x: x - atk * 0.7, y: 0, z });
    this.ball.reset(x, z);
    this.ball.giveTo(taker);

    // send the FW + most advanced MF into the box for the cross
    let sent = 0;
    for (const p of team.players) {
      if (p === taker || p.role === 'GK' || p.role === 'DF') continue;
      if (sent >= 2) break;
      const bz = sent === 0 ? -3 : 4;
      p.resetTo({ x: gx - atk * (CFG.PITCH.PEN_SPOT * 0.9), y: 0, z: bz });
      sent++;
    }

    events.emit('outOfBounds', { kind: 'corner', team });
    events.emit('corner', { team });
    this.hud?.showToast?.(`CORNER — ${team.name}`);
    this._startRestart('corner', 'corner', team, taker, _spot, 1.1);
  }

  _setupGoalkick(team) {
    const atk = team.attacking;
    const gx = team.ownGoalX;
    const x = gx + atk * (CFG.PITCH.GOALAREA_DEPTH * 0.7);
    const z = this.ball.position.z >= 0 ? 2.5 : -2.5;
    _spot.set(x, 0, z);

    const taker = team.gk;
    taker.resetTo({ x: x - atk * 0.6, y: 0, z });
    this.ball.reset(x, z);
    this.ball.giveTo(taker);

    events.emit('outOfBounds', { kind: 'goalkick', team });
    this.hud?.showToast?.(`GOAL KICK — ${team.name}`);
    this._startRestart('out', 'goalkick', team, taker, _spot, 1.0);
  }

  // ---------------------------------------------------------------------------
  // Restart executions (AI takers)
  // ---------------------------------------------------------------------------

  /** Throw-in / safe restart: pass to the most open nearby teammate. */
  _shortPass(r) {
    const taker = r.taker;
    let best = null, bestScore = -Infinity;
    for (const m of r.team.players) {
      if (m === taker || m.role === 'GK') continue;
      const d = m.position.distanceTo(taker.position);
      if (d < 2 || d > 32) continue;
      let nearestOpp = Infinity;
      for (const o of r.team.opponent.players) {
        const od = o.position.distanceTo(m.position);
        if (od < nearestOpp) nearestOpp = od;
      }
      const fwd = (m.position.x - taker.position.x) * r.team.attacking;
      const score = Math.min(nearestOpp, 10) * 1.4 + fwd * 0.08 - d * 0.05;
      if (score > bestScore) { bestScore = score; best = m; }
    }
    if (best) {
      _v.copy(best.position).addScaledVector(best.velocity, 0.25).sub(taker.position);
      const d = Math.hypot(_v.x, _v.z);
      _v.y = 0;
      _v.normalize();
      const power = Math.min(CFG.KICK.PASS_MAX, Math.max(CFG.KICK.PASS_MIN, d * 1.35));
      this.ball.kick(_v, power);
      if (r.team.controlled) r.team.setControlled(best);
    } else {
      _v.set(r.team.attacking, 0, 0);
      this.ball.kick(_v, CFG.KICK.PASS_MIN + 2);
    }
  }

  /** Corner: charged lob cross aimed into the box (far-side penalty spot). */
  _cornerCross(r) {
    const atk = r.team.attacking;
    const tx = r.team.attackGoalX - atk * (CFG.PITCH.PEN_SPOT * 0.9);
    const tz = (r.spot.z >= 0 ? -1 : 1) * 2.5; // far side of the goal
    _v.set(tx - r.spot.x, 0, tz - r.spot.z);
    const d = Math.hypot(_v.x, _v.z);
    _v.normalize();
    const power = Math.min(CFG.KICK.LOB_MAX, Math.max(CFG.KICK.LOB_MIN, d * 0.72));
    this.ball.kick(_v, power, { lob: CFG.KICK.LOB_HEIGHT + 0.06 });
  }

  /** Free kick: shoot when in range + bearing allows, else a safe pass. */
  _freekickTake(r) {
    const atk = r.team.attacking;
    const goalX = r.team.attackGoalX;
    const dx = goalX - r.spot.x;
    const dist = Math.hypot(dx, r.spot.z);
    const bearing = Math.abs(Math.atan2(r.spot.z, Math.max(1, dx * atk)));

    if (dist < CFG.AI.SHOT_RANGE && bearing < CFG.AI.SHOT_ANGLE + 0.15) {
      // over/around the wall toward the far corner
      const farZ = (r.spot.z >= 0 ? -1 : 1) * (CFG.PITCH.GOAL_W / 2 - 0.5);
      _v.set(goalX - r.spot.x, 0, farZ - r.spot.z).normalize();
      const power = Math.min(CFG.KICK.SHOT_MAX, Math.max(CFG.KICK.SHOT_MIN + 6, dist * 1.15));
      this.ball.kick(_v, power, { lob: dist > 18 ? 0.3 : 0.12 }); // lift over the wall
      return;
    }
    this._shortPass(r);
  }

  /** Goal kick: GK launches it upfield to the most advanced open teammate. */
  _goalkickTake(r) {
    const taker = r.taker;
    let best = null, bestScore = -Infinity;
    for (const m of r.team.players) {
      if (m === taker) continue;
      let nearestOpp = Infinity;
      for (const o of r.team.opponent.players) {
        const od = o.position.distanceTo(m.position);
        if (od < nearestOpp) nearestOpp = od;
      }
      const score = m.position.x * r.team.attacking + Math.min(nearestOpp, 12) * 1.5;
      if (score > bestScore) { bestScore = score; best = m; }
    }
    if (best) {
      _v.copy(best.position).sub(taker.position);
      const d = Math.hypot(_v.x, _v.z);
      _v.y = 0;
      _v.normalize();
      const power = Math.min(CFG.KICK.LOB_MAX, Math.max(CFG.KICK.LOB_MIN, d * 0.62));
      this.ball.kick(_v, power, { lob: CFG.KICK.LOB_HEIGHT });
    } else {
      _v.set(r.team.attacking, 0, 0.2);
      this.ball.kick(_v, CFG.KICK.LOB_MAX * 0.8, { lob: CFG.KICK.LOB_HEIGHT });
    }
  }

  // ---------------------------------------------------------------------------
  // Fouls
  // ---------------------------------------------------------------------------
  _onFoul(payload) {
    if (!payload || payload.offside) return; // offside handled in _onKickReleased
    if (this.state !== 'inplay') return;
    const fouling = payload.team;
    const victimTeam = fouling && fouling.opponent ? fouling.opponent
      : (fouling === this.teams.home ? this.teams.away : this.teams.home);
    if (!victimTeam || !payload.pos) return;

    // only a genuine foul near a victim becomes a free kick
    const victim = victimTeam.closestToBall(payload.pos);
    if (!victim) return;
    const d = victim.position.distanceTo(payload.pos);
    if (d > CFG.AI.FOUL_DANGER_RADIUS + 0.6) return; // advantage / too far: play on

    events.emit('sfx', { name: 'whistle' });
    this.hud?.showToast?.(`FOUL — FREE KICK ${victimTeam.name}`);
    this._setupFreekick(victimTeam, payload.pos);
  }

  /**
   * Free kick at `pos` for `team`: taker on the spot, opponents in a wall
   * ~9.15m toward their goal, everyone else held at a lawful distance.
   */
  _setupFreekick(team, pos) {
    const halfL = CFG.PITCH.LENGTH / 2 - 0.8;
    const halfW = CFG.PITCH.WIDTH / 2 - 0.8;
    const x = Math.min(halfL, Math.max(-halfL, pos.x));
    const z = Math.min(halfW, Math.max(-halfW, pos.z));
    _spot.set(x, 0, z);

    const taker = team.closestToBall(_spot, team.gk) || team.gk;
    const atk = team.attacking;
    taker.resetTo({ x: x - atk * 0.7, y: 0, z });
    this.ball.reset(x, z);
    this.ball.giveTo(taker);

    // --- defensive wall between the ball and the goal, ~9.15m out ---
    const opp = team.opponent;
    if (opp) {
      const goalX = team.attackGoalX;
      _v.set(goalX - x, 0, -z);
      const gd = Math.max(0.001, _v.length());
      _v.divideScalar(gd); // unit vector ball -> goal center
      const wallD = Math.min(WALL_DIST(), gd * 0.55);
      const wx = x + _v.x * wallD;
      const wz = z + _v.z * wallD;

      // up to 3 nearest opponents (non-GK) form the wall, side by side
      const cands = [];
      for (const p of opp.players) {
        if (p === opp.gk) continue;
        cands.push([Math.hypot(p.position.x - wx, p.position.z - wz), p]);
      }
      cands.sort((a, b) => a[0] - b[0]);
      const wallCount = Math.min(3, cands.length);
      const perpX = -_v.z, perpZ = _v.x;
      for (let i = 0; i < wallCount; i++) {
        const off = (i - (wallCount - 1) / 2) * 0.62;
        cands[i][1].resetTo({ x: wx + perpX * off, y: 0, z: wz + perpZ * off });
      }
      // everyone else (non-wall, non-GK) must retreat to a lawful distance
      for (let i = wallCount; i < cands.length; i++) {
        const p = cands[i][1];
        const dx = p.position.x - x, dz = p.position.z - z;
        const d = Math.hypot(dx, dz);
        if (d < WALL_DIST() + 0.4 && d > 1e-3) {
          const s = (WALL_DIST() + 0.4) / d;
          p.resetTo({ x: x + dx * s, y: 0, z: z + dz * s });
        }
      }
    }

    events.emit('freekick', { team, pos: _spot.clone() });
    this._startRestart('freekick', 'freekick', team, taker, _spot, 1.2);
  }

  // ---------------------------------------------------------------------------
  // Offside (simplified, SPEC §3)
  // ---------------------------------------------------------------------------
  /** Called synchronously from Ball.kick via the 'sfx' kick event. */
  _onKickReleased() {
    if (!CFG.MATCH.OFFSIDE_ENABLED) return;
    if (this.state !== 'inplay') return; // set pieces are exempt here

    const kicker = this.ball.lastTouch;
    if (!kicker || !kicker.team) return;
    const team = kicker.team;
    const opp = team.opponent;
    if (!opp) return;
    const atk = team.attacking;

    // pass direction = the ball's fresh velocity (horizontal)
    const vx = this.ball.velocity.x, vz = this.ball.velocity.z;
    const vlen = Math.hypot(vx, vz);
    if (vlen < 3) return; // dribble touches, not a pass
    const ux = vx / vlen, uz = vz / vlen;

    // intended receiver: best-aligned teammate in the pass direction
    let receiver = null, bestScore = -Infinity;
    for (const m of team.players) {
      if (m === kicker || m.role === 'GK') continue;
      const dx = m.position.x - kicker.position.x;
      const dz = m.position.z - kicker.position.z;
      const d = Math.hypot(dx, dz);
      if (d < 3) continue;
      const align = (dx * ux + dz * uz) / d;
      if (align < 0.72) continue;
      const score = align * 2 - d * 0.01;
      if (score > bestScore) { bestScore = score; receiver = m; }
    }
    if (!receiver) return;

    // must be in the attacking half at the moment of the kick
    if (receiver.position.x * atk <= 0) return;

    // must be BEYOND the second-last opponent (small grace for level)
    let m1 = -Infinity, m2 = -Infinity;
    for (const o of opp.players) {
      const key = o.position.x * atk;
      if (key > m1) { m2 = m1; m1 = key; }
      else if (key > m2) { m2 = key; }
    }
    if (receiver.position.x * atk <= m2 + 0.3) return; // onside

    // ---- OFFSIDE ---- (toast AFTER the 'foul' emit so a HUD that auto-
    // toasts fouls is overwritten by the OFFSIDE message)
    events.emit('sfx', { name: 'whistle' });
    events.emit('foul', { team, pos: receiver.position.clone(), offside: true });
    this.hud?.showToast?.('OFFSIDE');
    this._setupFreekick(opp, receiver.position);
  }

  // ---------------------------------------------------------------------------
  // Kickoff / state helpers
  // ---------------------------------------------------------------------------
  _setupKickoff(team) {
    this._kickoffTeam = team;
    this._restart = null;
    this.teams.home.resetToFormation();
    this.teams.away.resetToFormation();
    this.ball.reset(0, 0);
    // kicking team's FW starts with the ball at the center spot
    const taker = team.players[team.players.length - 1];
    this.ball.giveTo(taker);
    if (team === this.teams.home || team.controlled) team.setControlled(taker);
    this._stateT = 1.2;
    this._setState('kickoff');
    events.emit('kickoff', { team });
  }

  _setState(state) {
    if (this.state === state) return;
    this.state = state;
    events.emit('stateChange', { state });
  }

  pause() {
    if (this.state === 'paused' || this.state === 'fulltime') return;
    this._prevState = this.state;
    this._setState('paused');
  }

  resume() {
    if (this.state !== 'paused') return;
    this._setState(this._prevState || 'inplay');
  }

  /** Full reset: score, clock, half, original directions, fresh home kickoff. */
  restart() {
    this.score.home = 0;
    this.score.away = 0;
    this.clock = 0;
    this.half = 1;
    // restore the kickoff directions from match start (undoes halftime swap)
    if (this.teams.home.attacking !== this._homeStartDir) {
      this.teams.home.swapSides();
      this.teams.away.swapSides();
    }
    this._setupKickoff(this.teams.home);
  }
}

export default MatchManager;
