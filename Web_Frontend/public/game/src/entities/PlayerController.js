/**
 * PlayerController.js — user-controlled player logic (SPEC §2.7).
 *
 * Responsibilities:
 *   - camera-relative movement: input.state.move is screen-space (x=right, y=up);
 *     it is projected through the camera's ground-plane basis so "up" always
 *     moves away from the camera, in every camera mode.
 *   - pass / lob / shoot charging: while a kick button is held (and the ball is
 *     kickable), power01 = min(1, heldSecs / CFG.KICK.CHARGE_TIME) is emitted as
 *     'shotCharged' EVERY frame; on release the kick fires with power lerped
 *     between the CFG.KICK MIN..MAX range. Aim = right-stick/mouse direction if
 *     its magnitude > 0.2, otherwise the player's facing.
 *   - through ball (A tap / Space): leads the best forward teammate by
 *     CFG.KICK.THROUGH_LEAD seconds of their current velocity.
 *   - finesse (LT/Ctrl): shots get side spin around +y => Magnus curve.
 *   - skill moves (RB/E held + aim flick): step-over (speed burst + ball nudge),
 *     fake shot (while charging: cancels the charge and stuns nearby opponents),
 *     sprint-dribble big touch (while sprinting: knocks the ball ahead to chase).
 *   - defending: shoot button without the ball = sliding tackle (lunge); a ball
 *     (or its owner) inside CFG.AI.TACKLE_RADIUS at contact is won, an opponent
 *     inside FOUL_DANGER_RADIUS on a whiff concedes a 'foul' event.
 *   - LB/Q => team.autoSwitch(ball.position).
 *
 * Passes/through balls auto-switch control to the receiver (FIFA-style).
 */
import * as THREE from 'three';
import { CFG } from '../config.js';
import { events } from '../core/events.js';

// Module-level temps — zero per-frame allocation.
const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _move = { x: 0, y: 0 };
const _aim = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _spin = new THREE.Vector3();
const _lead = new THREE.Vector3();
const _zero = { x: 0, y: 0 };

export class PlayerController {
  /**
   * @param {import('./Team.js').Team} team  the user's team
   * @param {import('../world/Ball.js').Ball} ball
   * @param {import('../input/InputManager.js').InputManager} input
   * @param {import('../core/CameraRig.js').CameraRig} cameraRig
   * @param {{slot?: 0|1}} [opts]  input slot: 0 = P1/home, 1 = P2/away
   */
  constructor(team, ball, input, cameraRig, opts = {}) {
    this.team = team;
    this.ball = ball;
    this.input = input;
    this.cameraRig = cameraRig;
    this.slot = opts.slot ?? 0;

    this._charging = null;      // 'pass' | 'lob' | 'shoot' | null
    this._chargePower = 0;      // last emitted power01
    this._prevAimMag = 0;       // for aim-flick detection
    this._skillCd = 0;
    this._tackleCd = 0;
    this._tackleT = 0;          // active slide time remaining
    this._prevSkill = false;
    // camera ground basis (persisted so degenerate frames keep last valid)
    this._fx = 0; this._fz = -1; this._rx = 1; this._rz = 0;
  }

  // ---------------------------------------------------------------------------
  update(dt) {
    const p = this.team.controlled;
    if (!p) return;
    const S = this.input.getState(this.slot);

    if (this._skillCd > 0) this._skillCd -= dt;
    if (this._tackleCd > 0) this._tackleCd -= dt;

    this._updateBasis();
    const hasBall = this.ball.owner === p;

    // ---- active slide tackle: no steering, contact check at the end ----
    if (this._tackleT > 0) {
      this._tackleT -= dt;
      p.move(_zero, false, dt); // glide/decelerate through the slide
      if (this._tackleT <= 0) this._resolveTackle(p);
      return;                   // no other actions mid-slide
    }

    // ---- movement (slowed while charging a kick, FIFA-style) ----
    _move.x = S.move.x; _move.y = S.move.y;
    if (this._charging) { _move.x *= 0.55; _move.y *= 0.55; }
    const wx = this._rx * _move.x + this._fx * _move.y;
    const wz = this._rz * _move.x + this._fz * _move.y;
    _move.x = wx; _move.y = wz;
    p.move(_move, S.sprint && !this._charging, dt);

    // ---- player switching ----
    if (S.switchPlayer.pressed) this.team.autoSwitch(this.ball.position);

    // ---- kick charging ----
    this._updateCharge(p, S, hasBall, dt);

    // ---- through ball (tap) ----
    if (S.through.pressed && hasBall) this._throughBall(p, S);

    // ---- skill moves (modifier + aim flick) ----
    this._updateSkill(p, S, hasBall);

    // ---- defending: slide tackle ----
    if (S.shoot.pressed && !hasBall && this.ball.owner?.team !== this.team && this._tackleCd <= 0) {
      this._startTackle(p, S);
    }
  }

  // ---------------------------------------------------------------------------
  // Camera basis + aim
  // ---------------------------------------------------------------------------

  /** Refresh the camera ground-plane basis (screen x->right, y->forward). */
  _updateBasis() {
    const cam = this.cameraRig && this.cameraRig.camera;
    if (!cam) return;
    cam.getWorldDirection(_fwd);
    _fwd.y = 0;
    if (_fwd.lengthSq() < 0.01) return; // top-down degenerate: keep last basis
    _fwd.normalize();
    _right.crossVectors(_fwd, _up);     // screen-right in world space
    this._fx = _fwd.x; this._fz = _fwd.z;
    this._rx = _right.x; this._rz = _right.z;
  }

  /** World-space aim: right stick / mouse if magnitude > 0.2, else facing. */
  _aimDir(p, S, out) {
    const mag = Math.hypot(S.aim.x, S.aim.y);
    if (mag > 0.2) {
      // screen-space aim -> world via the camera ground basis, then normalize
      out.set(
        this._rx * S.aim.x + this._fx * S.aim.y,
        0,
        this._rz * S.aim.x + this._fz * S.aim.y
      ).normalize();
    } else {
      out.copy(p.facing);
    }
    return out;
  }

  // ---------------------------------------------------------------------------
  // Charging + kicks
  // ---------------------------------------------------------------------------

  _kickable(p) {
    if (this.ball.owner === p) return true;
    if (this.ball.owner) return false; // someone else has it
    const d = p.position.distanceTo(this.ball.position);
    return d <= CFG.PLAYER.KICK_RANGE * 1.3;
  }

  _updateCharge(p, S, hasBall, dt) {
    // pick up a new charge on press (only when the ball is ours/loose+close)
    if (!this._charging) {
      if (S.pass.pressed && this._kickable(p)) this._charging = 'pass';
      else if (S.lob.pressed && this._kickable(p)) this._charging = 'lob';
      else if (S.shoot.pressed && this._kickable(p)) this._charging = 'shoot';
    }

    if (!this._charging) return;

    const btn = S[this._charging]; // S.pass / S.lob / S.shoot
    if (btn.released) {
      const kind = this._charging;
      const power01 = Math.min(1, btn.heldSecs / CFG.KICK.CHARGE_TIME);
      this._charging = null;
      this._emitCharge(0);
      if (this._kickable(p)) this._executeKick(p, S, kind, power01);
      return;
    }

    // still held: stream power to the HUD every frame
    this._emitCharge(Math.min(1, btn.heldSecs / CFG.KICK.CHARGE_TIME));
  }

  _emitCharge(power01) {
    this._chargePower = power01;
    events.emit('shotCharged', { power01, player: this.team.controlled, slot: this.slot });
  }

  _executeKick(p, S, kind, power01) {
    const K = CFG.KICK;
    this._aimDir(p, S, _aim);
    p.playKickAnim();

    if (kind === 'shoot') {
      let power = K.SHOT_MIN + (K.SHOT_MAX - K.SHOT_MIN) * power01;
      _dir.copy(_aim);
      if (S.finesse) {
        // side spin around +y => Magnus curve toward the aimed side
        const side = S.aim.x >= 0 ? 1 : -1;
        _spin.set(0, 0.5 * side, 0);
        power *= 0.92; // finesse trades a little pace
      } else {
        _spin.set(0, 0, 0);
      }
      // shots rise with charge: vy = power * lobFraction
      this.ball.kick(_dir, power, {
        lob: 0.10 + power01 * 0.12,
        spinVec: _spin.lengthSq() ? _spin : null,
      });
      return;
    }

    if (kind === 'lob') {
      const power = K.LOB_MIN + (K.LOB_MAX - K.LOB_MIN) * power01;
      const mate = this._bestTeammateInCone(p, _aim, 0.5);
      if (mate) _lead.copy(mate.position).addScaledVector(mate.velocity, 0.4).sub(p.position).setY(0).normalize();
      else _lead.copy(_aim);
      this.ball.kick(_lead, power, { lob: K.LOB_HEIGHT });
      if (mate && mate !== p) this.team.setControlled(mate);
      return;
    }

    // 'pass': directional with teammate auto-assist inside a ~28° cone
    let power = K.PASS_MIN + (K.PASS_MAX - K.PASS_MIN) * power01;
    const mate = this._bestTeammateInCone(p, _aim, 0.5);
    if (mate) {
      _lead.copy(mate.position).addScaledVector(mate.velocity, 0.25).sub(p.position);
      const dist = _lead.length();
      _lead.setY(0).normalize();
      // assist: guarantee enough pace to actually reach the receiver
      power = Math.max(power, Math.min(K.PASS_MAX, dist * 1.35));
      this.ball.kick(_lead, power);
      if (mate !== p) this.team.setControlled(mate);
    } else {
      this.ball.kick(_aim, power);
    }
  }

  /** Through ball: lead the best forward option into space. */
  _throughBall(p, S) {
    const K = CFG.KICK;
    this._aimDir(p, S, _aim);
    let best = null, bestScore = -1;
    for (const m of this.team.players) {
      if (m === p || m.role === 'GK') continue;
      _dir.copy(m.position).sub(p.position).setY(0);
      const dist = _dir.length();
      if (dist < 2) continue;
      _dir.divideScalar(dist);
      const align = _dir.dot(_aim);
      if (align < 0.25) continue;               // must be roughly in the aimed half
      const forwardness = m.position.x * this.team.attacking; // prefer upfield
      const score = align * 2 + forwardness * 0.02 - dist * 0.01;
      if (score > bestScore) { bestScore = score; best = m; }
    }
    p.playKickAnim();
    if (best) {
      // lead the runner by THROUGH_LEAD seconds of their velocity + a push into space
      _lead.copy(best.position)
        .addScaledVector(best.velocity, K.THROUGH_LEAD)
        .addScaledVector(_aim, K.THROUGH_LEAD * 2.5)
        .sub(p.position);
      const dist = _lead.length();
      _lead.setY(0).normalize();
      const power = Math.min(K.PASS_MAX + 4, Math.max(K.PASS_MIN, dist * 1.5));
      this.ball.kick(_lead, power);
      this.team.setControlled(best);
    } else {
      // no option: poke it into the aimed channel
      this.ball.kick(_aim, K.PASS_MIN + 4);
    }
  }

  /** Best teammate within `cone` radians of `aim` (dot threshold), or null. */
  _bestTeammateInCone(p, aim, cone) {
    let best = null, bestDot = Math.cos(cone);
    for (const m of this.team.players) {
      if (m === p) continue;
      _dir.copy(m.position).sub(p.position).setY(0);
      const d = _dir.length();
      if (d < 1.5) continue;
      _dir.divideScalar(d);
      const dot = _dir.dot(aim);
      if (dot > bestDot) { bestDot = dot; best = m; }
    }
    return best;
  }

  // ---------------------------------------------------------------------------
  // Skill moves
  // ---------------------------------------------------------------------------
  _updateSkill(p, S, hasBall) {
    const aimMag = Math.hypot(S.aim.x, S.aim.y);
    const flick = aimMag > 0.7 && this._prevAimMag < 0.4;
    this._prevAimMag = aimMag;
    const skillTapped = S.skill && !this._prevSkill; // local edge (InputState.skill is a level)
    this._prevSkill = S.skill;

    if (!S.skill || this._skillCd > 0) return;

    // fake shot: skill tapped (or flicked) while charging => cancel the charge
    // and stagger nearby opponents
    if (this._charging && (skillTapped || flick)) {
      this._charging = null;
      this._emitCharge(0);
      p.playKickAnim(); // sells the fake
      const opp = this.team.opponent;
      if (opp) {
        for (const o of opp.players) {
          if (o.position.distanceToSquared(p.position) < 9) o.stun(0.45);
        }
      }
      this._skillCd = 1.0;
      return;
    }

    if (!flick || !hasBall) return;
    this._aimDir(p, S, _aim);

    if (S.sprint) {
      // sprint-dribble big touch: knock it ahead and chase
      this.ball.kick(_aim, 7);
      this._skillCd = 0.8;
    } else {
      // step-over: burst of pace + ball nudge (possession kept via glue)
      p.velocity.addScaledVector(_aim, 5.5);
      this.ball.position.addScaledVector(_aim, 0.5);
      this._skillCd = 0.9;
    }
  }

  // ---------------------------------------------------------------------------
  // Defending
  // ---------------------------------------------------------------------------
  _startTackle(p, S) {
    this._aimDir(p, S, _aim);
    p.velocity.copy(_aim).multiplyScalar(9); // lunge
    p.playTackleAnim();
    this._tackleT = 0.3;
    this._tackleCd = 1.1;
    events.emit('sfx', { name: 'tackle' });
    const r = CFG.INPUT.RUMBLE_TACKLE;
    events.emit('rumble', { strong: r[0], weak: r[1], ms: r[2] });
  }

  /** Contact resolution at the end of the slide (see header). */
  _resolveTackle(p) {
    const A = CFG.AI;
    const ballDist = p.position.distanceTo(this.ball.position);
    const ownerOpp = this.ball.owner && this.ball.owner.team !== this.team;

    if ((ownerOpp && this.ball.owner.position.distanceTo(p.position) <= A.TACKLE_RADIUS) ||
        (!this.ball.owner && ballDist <= A.TACKLE_RADIUS)) {
      this.ball.giveTo(p); // clean win
      return;
    }
    // whiffed: foul only if an opponent was caught in the danger zone
    const opp = this.team.opponent;
    if (opp) {
      for (const o of opp.players) {
        if (o.position.distanceToSquared(p.position) <= A.FOUL_DANGER_RADIUS * A.FOUL_DANGER_RADIUS) {
          o.stun(0.5);
          events.emit('foul', { team: this.team, pos: p.position.clone() });
          return;
        }
      }
    }
  }
}

export default PlayerController;
