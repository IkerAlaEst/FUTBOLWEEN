/**
 * Ball.js — BallPhysics (SPEC §2.5).
 *
 * Free-ball physics (all per fixed step dt):
 *   - gravity            v.y += GRAVITY*dt
 *   - quadratic air drag a = -AIR_DRAG*|v|*v
 *   - Magnus curve       a += MAGNUS * (spin × v)   (spin decays exponentially)
 *   - ground bounce      y-vel flip * RESTITUTION, small horizontal scuff
 *   - rolling friction   v_xz *= pow(ROLL_FRICTION, dt*120) while on ground
 *   - stop epsilon       horizontal speed < STOP_EPS on ground => full stop
 *
 * Collisions:
 *   - goal posts/crossbar: sphere-vs-cylinder (vertical posts, horizontal bar),
 *     reflect velocity with RESTITUTION, spin zeroed on post hit (pings 'crowd_ooh').
 *   - net region (Pitch.netRegion): hard damp + clamp inside net, pitch.pulseNet(side).
 *   - players: soft push-out + velocity absorb; auto-possess when the ball is free,
 *     slow (<= POSSESS_MAX_SPEED), low and inside POSSESS_RADIUS. Rumble on hard
 *     contact with the user-controlled player.
 *
 * Possession (sticky): when owned, the ball is glued slightly ahead of the owner's
 * facing (bigger touch offset while sprinting) and inherits owner velocity.
 *
 * Out-of-play: the ball NEVER leaves silently. Each frame it asks pitch.outInfo()
 * (when wired) and reports a genuine boundary exit once via matchRef.onBallOut(info).
 * Goal detection is MatchManager's job (it polls pitch.inGoal). Without a matchRef
 * the ball simply clamps at the boundary so nothing escapes the world.
 *
 * Wiring (assigned by main.js, all optional-but-expected):
 *   ball.pitch    Pitch      — goals colliders, outInfo, netRegion, pulseNet
 *   ball.matchRef MatchManager — receives onBallOut(info)
 *   ball.players  Player[]   — for soft collision + possession
 *   ball.lastTouch Player|null — maintained by kick/tryPossess (rules attribution)
 */
import * as THREE from 'three';
import { CFG } from '../config.js';
import { events } from '../core/events.js';

// Module-level temps — no per-frame allocations in the hot loop.
const _acc = new THREE.Vector3();
const _drag = new THREE.Vector3();
const _mag = new THREE.Vector3();
const _n = new THREE.Vector3();
const _closest = new THREE.Vector3();
const _rollAxis = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

export class Ball {
  /**
   * Classic white ball with dark pentagon panels drawn once into a canvas
   * (equirectangular for SphereGeometry UVs). Shared across constructions.
   */
  static _makePanelTexture() {
    if (Ball._panelTex) return Ball._panelTex;
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 128;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#f5f5f0';
    ctx.fillRect(0, 0, 256, 128);

    const pentagon = (cx, cy, r, rot) => {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = rot + (i / 5) * Math.PI * 2;
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    };

    ctx.fillStyle = '#1c1c22';
    // staggered rows; duplicates at x±256 keep the horizontal seam clean
    const rows = [
      { y: 26, n: 4, r: 11, rot: 0.3 },
      { y: 64, n: 4, r: 13, rot: 0.9 },
      { y: 102, n: 4, r: 11, rot: 0.5 },
    ];
    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri];
      for (let i = 0; i < row.n; i++) {
        const x = ((i + (ri % 2) * 0.5) / row.n) * 256;
        pentagon(x, row.y, row.r, row.rot + i);
        pentagon(x + 256, row.y, row.r, row.rot + i);
        pentagon(x - 256, row.y, row.r, row.rot + i);
      }
    }

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    Ball._panelTex = tex;
    return tex;
  }

  constructor(scene) {
    const R = CFG.BALL.RADIUS;

    // --- visual: white ball, procedural dark panel texture (rotation reads) ---
    const geo = new THREE.SphereGeometry(R, 24, 18);
    const mat = new THREE.MeshStandardMaterial({
      map: Ball._makePanelTexture(), roughness: 0.55, metalness: 0.0,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.castShadow = true;
    scene.add(this.mesh);

    /** @type {THREE.Vector3} alias of mesh.position (center of ball, y >= R) */
    this.position = this.mesh.position;
    this.position.set(0, R, 0);

    this.velocity = new THREE.Vector3();
    this.spin = new THREE.Vector3();      // Magnus spin; ~0.3 units = visible bend
    /** @type {import('../entities/Player.js').Player|null} sticky possessor */
    this.owner = null;
    /** @type {import('../entities/Player.js').Player|null} last player to touch/kick */
    this.lastTouch = null;

    // External wiring (see header).
    this.pitch = null;
    this.matchRef = null;
    /** @type {Array} players for collision/possession (assigned by main.js) */
    this.players = [];

    this._outLatched = false;   // report each boundary exit only once
    this._inNet = null;         // 'home'|'away'|null net occupancy state
    this._rumbleCooldown = 0;   // throttle collision rumble
    this._lastKicker = null;    // can't re-possess own kick during the grace window
    this._repossessT = 0;
  }

  // ---------------------------------------------------------------------------
  // Public API (SPEC §2.5)
  // ---------------------------------------------------------------------------

  /** True when the free ball is moving faster than the stop epsilon. */
  isMoving() {
    return !this.owner && this.velocity.lengthSq() > CFG.BALL.STOP_EPS * CFG.BALL.STOP_EPS;
  }

  /**
   * Release the ball with velocity `dir * power`.
   * @param {THREE.Vector3} dir direction (horizontal part is normalized)
   * @param {number} power m/s
   * @param {{lob?: number, spinVec?: THREE.Vector3|null}} [opts]
   *        lob: vertical velocity = power * lob (use CFG.KICK.LOB_HEIGHT);
   *        spinVec: Magnus spin vector (side spin around +y curves shots).
   */
  kick(dir, power, { lob = 0, spinVec = null } = {}) {
    if (this.owner) this.lastTouch = this.owner;
    this._lastKicker = this.owner;
    this._repossessT = 0.25; // grace: kicker can't instantly re-glue their own kick
    this.owner = null;
    _n.set(dir.x, 0, dir.z);
    if (_n.lengthSq() < 1e-6) _n.set(1, 0, 0); else _n.normalize();
    this.velocity.set(_n.x * power, power * lob, _n.z * power);
    if (spinVec) this.spin.copy(spinVec); else this.spin.set(0, 0, 0);
    this._outLatched = false;
    this._inNet = null;
    events.emit('sfx', { name: 'kick' });
  }

  /**
   * Attach the ball to `player` if close & slow enough. Returns success.
   * Steals (player != current owner) require a tighter radius so dribbling
   * isn't auto-pickpocketed; tackles call this right after a won challenge.
   */
  tryPossess(player) {
    if (!player) return false;
    if (this.owner === player) return true;
    if (player === this._lastKicker && this._repossessT > 0) return false;
    const steal = this.owner && this.owner !== player;
    const maxDist = CFG.PLAYER.POSSESS_RADIUS * (steal ? 0.65 : 1.0);
    const dx = this.position.x - player.position.x;
    const dz = this.position.z - player.position.z;
    if (dx * dx + dz * dz > maxDist * maxDist) return false;
    if (this.position.y > 1.1) return false;                       // can't trap a high ball
    if (this.velocity.length() > CFG.PLAYER.POSSESS_MAX_SPEED) return false;
    this.owner = player;
    this.lastTouch = player;
    this.velocity.set(0, 0, 0);
    this.spin.set(0, 0, 0);
    this._outLatched = false;
    return true;
  }

  /** Drop possession (ball keeps its current velocity). */
  release() { this.owner = null; }

  /** Teleport to kickoff/restart spot, dead. */
  reset(x = 0, z = 0) {
    this.owner = null;
    this.position.set(x, CFG.BALL.RADIUS, z);
    this.velocity.set(0, 0, 0);
    this.spin.set(0, 0, 0);
    this._outLatched = false;
    this._inNet = null;
    this._lastKicker = null;
    this._repossessT = 0;
  }

  /** Place the ball at `player`'s feet and hand them possession (restarts). */
  giveTo(player) {
    this.owner = player;
    this.lastTouch = player;
    this.velocity.set(0, 0, 0);
    this.spin.set(0, 0, 0);
    this._outLatched = false;
    this._inNet = null;
    this._lastKicker = null;
    this._repossessT = 0;
    this._glueToOwner(); // snap immediately
  }

  // ---------------------------------------------------------------------------
  // Per-step update
  // ---------------------------------------------------------------------------
  update(dt) {
    if (this._rumbleCooldown > 0) this._rumbleCooldown -= dt;
    if (this._repossessT > 0) this._repossessT -= dt;

    if (this.owner) {
      this._glueToOwner();
    } else {
      this._integrate(dt);
      this._collidePosts();
      this._collideNet(dt);
      this._collidePlayers();
      this._checkBoundaries();
    }
    this._rollVisual(dt);
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  /** Sticky dribble glue: ball rides just ahead of the owner's facing. */
  _glueToOwner() {
    const o = this.owner;
    // bigger touch when sprinting => ball pushed further ahead (knock-on)
    const touch = o.isSprinting ? 1.05 : 0.62;
    this.position.x = o.position.x + o.facing.x * touch;
    this.position.z = o.position.z + o.facing.z * touch;
    // never carried silently out of play: clamp inside the lines while owned
    // (players clamp themselves at 0.4m; the touch may reach a little wider)
    const hx = CFG.PITCH.LENGTH / 2 - 0.05, hz = CFG.PITCH.WIDTH / 2 - 0.05;
    this.position.x = Math.min(hx, Math.max(-hx, this.position.x));
    this.position.z = Math.min(hz, Math.max(-hz, this.position.z));
    this.position.y = CFG.BALL.RADIUS;
    this.velocity.copy(o.velocity);
    this.lastTouch = o;
  }

  _integrate(dt) {
    const B = CFG.BALL;
    const v = this.velocity;

    // gravity
    v.y += B.GRAVITY * dt;

    // quadratic air drag: a = -k*|v|*v
    const speed = v.length();
    if (speed > 1e-5) {
      _drag.copy(v).multiplyScalar(-B.AIR_DRAG * speed * dt);
      v.add(_drag);
    }

    // Magnus: a = MAGNUS * (spin × v); spin decays
    if (this.spin.lengthSq() > 1e-6) {
      _mag.crossVectors(this.spin, v).multiplyScalar(B.MAGNUS * dt);
      v.add(_mag);
      this.spin.multiplyScalar(Math.exp(-B.SPIN_DECAY * dt));
    }

    this.position.addScaledVector(v, dt);

    // ground contact
    const R = B.RESTITUTION;
    if (this.position.y <= CFG.BALL.RADIUS) {
      this.position.y = CFG.BALL.RADIUS;
      if (v.y < 0) {
        const impact = -v.y;
        v.y = impact * R;
        if (v.y < 1.0) v.y = 0;          // settle instead of micro-bouncing
        // scuff horizontal pace + spin on REAL bounces only — applying this to
        // the per-step micro-contact would murder every rolling ball
        if (impact > 1.5) {
          v.x *= 0.85; v.z *= 0.85;
          this.spin.multiplyScalar(0.6);
        }
      }
      // rolling friction (per-frame multiplier normalized to 120fps) + stop eps
      const f = Math.pow(B.ROLL_FRICTION, dt * 120);
      v.x *= f; v.z *= f;
      if (v.y === 0 && Math.hypot(v.x, v.z) < B.STOP_EPS) { v.x = 0; v.z = 0; }
    }
  }

  /** Sphere vs goal-post/crossbar cylinders (colliders come from pitch.goals). */
  _collidePosts() {
    if (!this.pitch || !this.pitch.goals) return;
    const R = CFG.BALL.RADIUS;
    const p = this.position;
    const goals = this.pitch.goals;
    for (const side of ['home', 'away']) {
      const g = goals[side];
      if (!g) continue;
      // cheap reject: only test when near this goal mouth
      if (Math.abs(p.x - g.line) > 3) continue;
      for (let i = 0; i < g.posts.length; i++) {
        const c = g.posts[i];
        if (c.type === 'post') {
          // vertical cylinder at (c.x, c.z), y in [c.y0, c.y1]
          const dx = p.x - c.x, dz = p.z - c.z;
          if (p.y < c.y0 - R || p.y > c.y1 + R) continue;
          const d2 = dx * dx + dz * dz, minD = c.r + R;
          if (d2 >= minD * minD || d2 < 1e-9) continue;
          const d = Math.sqrt(d2);
          _n.set(dx / d, 0, dz / d);
          p.x = c.x + _n.x * minD; p.z = c.z + _n.z * minD;
          const vn = this.velocity.x * _n.x + this.velocity.z * _n.z;
          if (vn < 0) {
            this.velocity.x -= (1 + CFG.BALL.RESTITUTION) * vn * _n.x;
            this.velocity.z -= (1 + CFG.BALL.RESTITUTION) * vn * _n.z;
            this._postPing();
          }
        } else {
          // 'bar': horizontal cylinder along z at (c.x, c.y), z in [c.z0, c.z1]
          const zc = Math.min(c.z1, Math.max(c.z0, p.z));
          _closest.set(c.x, c.y, zc);
          _n.subVectors(p, _closest);
          const d2 = _n.lengthSq(), minD = c.r + R;
          if (d2 >= minD * minD || d2 < 1e-9) continue;
          const d = Math.sqrt(d2);
          _n.divideScalar(d);
          p.copy(_closest).addScaledVector(_n, minD);
          const vn = this.velocity.dot(_n);
          if (vn < 0) {
            this.velocity.addScaledVector(_n, -(1 + CFG.BALL.RESTITUTION) * vn);
            this._postPing();
          }
        }
      }
    }
  }

  _postPing() {
    this.spin.set(0, 0, 0); // dead spin off the woodwork
    if (this.velocity.length() > 6) events.emit('sfx', { name: 'crowd_ooh' });
  }

  /** Net contact: damp hard, keep the ball inside the net, pulse once on entry. */
  _collideNet(dt) {
    if (!this.pitch || typeof this.pitch.netRegion !== 'function') return;
    const side = this.pitch.netRegion(this.position);
    if (side) {
      // strong exponential damping => ball dies into the net
      this.velocity.multiplyScalar(Math.pow(0.02, dt));
      if (this._inNet !== side) {
        this._inNet = side;
        this.pitch.pulseNet?.(side);
      }
      // hard clamp inside the net box so nothing tunnels through
      const g = this.pitch.goals[side];
      const backX = g.line + g.dir * CFG.PITCH.GOAL_DEPTH;
      const minX = Math.min(g.line, backX) + CFG.BALL.RADIUS;
      const maxX = Math.max(g.line, backX) - CFG.BALL.RADIUS;
      this.position.x = Math.min(maxX, Math.max(minX, this.position.x));
      const halfW = CFG.PITCH.GOAL_W / 2 - CFG.BALL.RADIUS;
      this.position.z = Math.min(halfW, Math.max(-halfW, this.position.z));
      this.position.y = Math.min(CFG.PITCH.GOAL_H, Math.max(CFG.BALL.RADIUS, this.position.y));
    } else if (this._inNet) {
      this._inNet = null;
    }
  }

  /** Soft player push (collision radius) + sticky possession (POSSESS_RADIUS). */
  _collidePlayers() {
    const R = CFG.BALL.RADIUS;
    const p = this.position;
    const minD = CFG.PLAYER.RADIUS + R;                 // hard collision shell
    const possD2 = CFG.PLAYER.POSSESS_RADIUS * CFG.PLAYER.POSSESS_RADIUS;
    let best = null, bestD2 = Infinity;
    for (let i = 0; i < this.players.length; i++) {
      const pl = this.players[i];
      if (!pl || pl === this.owner) continue;
      const dx = p.x - pl.position.x, dz = p.z - pl.position.z;
      const d2 = dx * dx + dz * dz;
      // nearest possession candidate anywhere inside POSSESS_RADIUS
      // (the recent kicker is skipped during the repossess grace window)
      if (d2 < possD2 && d2 < bestD2 && p.y <= 1.1 &&
          !(pl === this._lastKicker && this._repossessT > 0)) { bestD2 = d2; best = pl; }
      if (d2 >= minD * minD || p.y > CFG.PLAYER.HEIGHT) continue;
      const d = Math.max(1e-4, Math.sqrt(d2));
      // push the ball out of the player's capsule (soft)
      _n.set(dx / d, 0, dz / d);
      p.x = pl.position.x + _n.x * minD;
      p.z = pl.position.z + _n.z * minD;
      const vn = this.velocity.x * _n.x + this.velocity.z * _n.z;
      if (vn < 0) {
        // absorb most of the inbound pace (soft body, not a wall)
        this.velocity.x -= 1.3 * vn * _n.x;
        this.velocity.z -= 1.3 * vn * _n.z;
        if (pl.controlled && -vn > 2.5 && this._rumbleCooldown <= 0) {
          this._rumbleCooldown = 0.3;
          const r = CFG.INPUT.RUMBLE_COLLIDE;
          events.emit('rumble', { strong: r[0], weak: r[1], ms: r[2] });
        }
      }
    }
    if (best) this.tryPossess(best);
  }

  /** Report genuine boundary exits to the MatchManager (never silent). */
  _checkBoundaries() {
    const halfL = CFG.PITCH.LENGTH / 2, halfW = CFG.PITCH.WIDTH / 2;
    const p = this.position;
    const out = Math.abs(p.x) > halfL || Math.abs(p.z) > halfW;

    if (!out) { this._outLatched = false; return; }
    if (this._outLatched) return;

    const info = this.pitch && typeof this.pitch.outInfo === 'function'
      ? this.pitch.outInfo(p, this.lastTouch ? this.lastTouch.team.side : null)
      : null;
    if (!info) return; // inside a goal mouth (goal detection is MatchManager's)

    this._outLatched = true;
    if (this.matchRef && typeof this.matchRef.onBallOut === 'function') {
      this.matchRef.onBallOut(info);
    } else {
      // no referee wired: clamp the ball just inside play so it never escapes
      p.x = Math.min(halfL - 0.3, Math.max(-halfL + 0.3, p.x));
      p.z = Math.min(halfW - 0.3, Math.max(-halfW + 0.3, p.z));
      this.velocity.multiplyScalar(0.2);
    }
  }

  /** Cosmetic roll/spin of the mesh (no gameplay effect). */
  _rollVisual(dt) {
    const speed = Math.hypot(this.velocity.x, this.velocity.z);
    if (speed > 0.05) {
      _rollAxis.set(this.velocity.z, 0, -this.velocity.x).normalize();
      this.mesh.rotateOnWorldAxis(_rollAxis, (speed / CFG.BALL.RADIUS) * dt * 0.6);
    }
  }
}

export default Ball;
