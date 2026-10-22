/**
 * Player.js — footballer visuals + movement physics (SPEC §2.4).
 *
 * Visual: THREE.Group rooted at the feet (mesh.position.y = 0). When the
 * shared GLB template is loaded (PlayerModel.loadPlayerModel, awaited by
 * main.js) each player is a SkeletonUtils clone with team kit materials and a
 * THREE.AnimationMixer driving the Quaternius clips. If the GLB failed to
 * load, the original procedural build (team-colored torso box, head sphere,
 * swinging limb boxes) is used so the game still runs. A highlight ring under
 * the player marks the user-controlled one (setHighlight).
 *
 * Movement: move(dir, sprint, dt) accelerates velocity toward dir * speed, where
 * speed = lerp(WALK, JOG, |dir|) (* SPRINT_MULT while sprinting & stamina > 0).
 * Facing slerps toward the travel direction at TURN_LERP. Position clamps to the
 * pitch. Stamina drains on sprint, regens otherwise.
 *
 * Procedural animation FSM (updateAnim): idle | jog | sprint | dribble |
 * kick | tackle | celebrate. Legs/arms swing with amplitude/frequency driven by
 * actual speed; kick/tackle/celebrate are timed poses triggered via
 * playKickAnim()/playTackleAnim()/celebrate().
 *
 * Extra public fields used by other core modules (additive, not in SPEC):
 *   facing: THREE.Vector3  unit ground vector the player looks along
 *   isSprinting: bool      set by move(); Ball uses it for knock-on touches
 *   stunned: bool          true while stun() timer runs (fake-shot hook)
 *   ball: Ball|null        wired by Team.attachBall(); backs the hasBall getter
 */
import * as THREE from 'three';
import { CFG } from '../config.js';
import { getPlayerModel, clonePlayerRig, applyKit } from './PlayerModel.js';

// Module-level temps (no per-frame allocations).
const _targetVel = new THREE.Vector3();

const SKIN = 0xd9a06b;

// FSM mode -> GLB clip key (PlayerModel strips the 'HumanArmature|Man_' prefix)
const GLB_CLIP = {
  idle: 'Idle',
  jog: 'Run',      // Walk at jog speeds looks slidey; Run + timeScale tracks pace
  sprint: 'Run',
  dribble: 'Run',
  walk: 'Walk',
  kick: 'Punch',   // no dedicated kick clip in the set
  tackle: 'Punch',
  celebrate: 'Jump',
};

export class Player {
  /**
   * @param {THREE.Scene} scene
   * @param {{team: object, number: number, role: 'GK'|'DF'|'MF'|'FW',
   *          home: THREE.Vector3, name?: string}} opts
   */
  constructor(scene, { team, number, role, home, name = null }) {
    this.team = team;
    this.number = number;
    this.role = role;
    /** @type {string|null} real-name display label (HUD / goal overlay) */
    this.displayName = name;
    /** @type {THREE.Vector3} kickoff/formation home position */
    this.home = home.clone();

    this.velocity = new THREE.Vector3();
    this.facing = new THREE.Vector3(team.attacking >= 0 ? 1 : -1, 0, 0);
    this.stamina = CFG.PLAYER.STAMINA_MAX;
    this.controlled = false;
    this.isSprinting = false;
    /** @type {import('../world/Ball.js').Ball|null} wired post-construction */
    this.ball = null;

    this._stunT = 0;
    this._kickT = 0;
    this._tackleT = 0;
    this._celebrateT = 0;
    this._phase = Math.random() * Math.PI * 2; // desync crowd of swing cycles
    this._animMode = 'idle';

    this._build(scene);
    this.position.copy(home);
  }

  /** mesh.position IS the player position (feet on the ground plane, y=0). */
  get hasBall() { return !!(this.ball && this.ball.owner === this); }
  get stunned() { return this._stunT > 0; }

  // ---------------------------------------------------------------------------
  // Visual construction
  // ---------------------------------------------------------------------------
  _build(scene) {
    const P = CFG.PLAYER;
    this.mesh = new THREE.Group();
    this._body = new THREE.Group();      // bobs/tilts as one unit
    this.mesh.add(this._body);

    /** @type {THREE.AnimationMixer|null} set by the GLB build only */
    this._mixer = null;

    if (getPlayerModel()) this._buildGLB();
    else this._buildProcedural();

    this._body.traverse((o) => { if (o.isMesh) o.castShadow = true; });

    // highlight ring (controlled player marker)
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(P.RADIUS + 0.08, P.RADIUS + 0.22, 28),
      new THREE.MeshBasicMaterial({ color: 0xfff176, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.03;
    ring.visible = false;
    this._ring = ring;
    this.mesh.add(ring);

    this.mesh.rotation.y = Math.atan2(this.facing.x, this.facing.z);
    scene.add(this.mesh);
  }

  /**
   * GLB visual: clone the shared Quaternius rig (faces local +Z, feet at y=0,
   * height normalized by PlayerModel), tint the kit, wire an AnimationMixer.
   */
  _buildGLB() {
    const template = getPlayerModel();
    const rig = clonePlayerRig();
    applyKit(rig, this.team, this.role);
    this._body.add(rig);

    this._mixer = new THREE.AnimationMixer(rig);
    /** @type {Object<string, THREE.AnimationAction>} lazily-built per clip key */
    this._actions = {};
    this._clips = template.clips;
    this._activeAction = null;
    this._activeClipKey = null;
    this._lastGlbMode = null;
  }

  /** Original procedural build — fallback when the GLB is unavailable. */
  _buildProcedural() {
    const jersey = new THREE.MeshStandardMaterial({ color: this.role === 'GK' ? this.team.colorAlt : this.team.color, roughness: 0.85 });
    const shorts = new THREE.MeshStandardMaterial({ color: this.team.colorAlt, roughness: 0.9 });
    const skin = new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.9 });

    // torso (jersey)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.55, 0.26), jersey);
    torso.position.y = 1.12;
    // shorts
    const hip = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.28), shorts);
    hip.position.y = 0.82;
    // head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), skin);
    head.position.y = 1.6;
    this._body.add(torso, hip, head);

    // limbs: pivot groups at hip/shoulder, geometry hangs below the pivot
    const mkLimb = (w, len, mat, px, py) => {
      const pivot = new THREE.Group();
      pivot.position.set(px, py, 0);
      const box = new THREE.Mesh(new THREE.BoxGeometry(w, len, w), mat);
      box.position.y = -len / 2;
      pivot.add(box);
      this._body.add(pivot);
      return pivot;
    };
    this._legL = mkLimb(0.14, 0.78, shorts, -0.12, 0.78);
    this._legR = mkLimb(0.14, 0.78, shorts, 0.12, 0.78);
    this._armL = mkLimb(0.11, 0.55, jersey, -0.28, 1.36);
    this._armR = mkLimb(0.11, 0.55, jersey, 0.28, 1.36);
  }

  /** @returns {THREE.Vector3} feet position (alias of mesh.position). */
  get position() { return this.mesh.position; }

  // ---------------------------------------------------------------------------
  // Movement (called once per fixed step by controller/AI)
  // ---------------------------------------------------------------------------

  /**
   * Accelerate toward `dir * speed`.
   * @param {{x:number, y:number}} dir desired WORLD direction; dir.x->world X,
   *        dir.y->world Z, magnitude 0..1 (0 = decelerate to stop).
   * @param {boolean} sprint hold to sprint (drains stamina)
   */
  move(dir, sprint, dt) {
    const P = CFG.PLAYER;
    let rawMag = Math.hypot(dir.x, dir.y);
    if (this._stunT > 0 || this._tackleT > 0) { rawMag = 0; } // stunned/sliding: no steering
    const mag = Math.min(1, rawMag);

    // target speed: lerp walk->jog by stick magnitude, sprint multiplier on top
    let speed = mag <= 0 ? 0 : P.WALK + (P.JOG - P.WALK) * mag;
    this.isSprinting = !!(sprint && mag > 0.1 && this.stamina > 0.5);
    if (this.isSprinting) {
      speed *= P.SPRINT_MULT;
      this.stamina = Math.max(0, this.stamina - P.STAMINA_DRAIN * dt);
    } else {
      this.stamina = Math.min(P.STAMINA_MAX, this.stamina + P.STAMINA_REGEN * dt);
    }

    if (rawMag > 1e-4) {
      const inv = speed / rawMag; // normalize dir, scale by target speed
      _targetVel.set(dir.x * inv, 0, dir.y * inv);
    } else {
      _targetVel.set(0, 0, 0);
    }

    // exponential-ish approach toward target velocity (ACCEL is m/s^2)
    const k = Math.min(1, (P.ACCEL * dt) / Math.max(0.001, _targetVel.distanceTo(this.velocity)));
    this.velocity.lerp(_targetVel, k);
    if (this.velocity.lengthSq() < 1e-4 && mag === 0) this.velocity.set(0, 0, 0);

    this.position.addScaledVector(this.velocity, dt);

    // never leave the pitch (ball rules handle the ball)
    const hx = CFG.PITCH.LENGTH / 2 - 0.4, hz = CFG.PITCH.WIDTH / 2 - 0.4;
    this.position.x = Math.min(hx, Math.max(-hx, this.position.x));
    this.position.z = Math.min(hz, Math.max(-hz, this.position.z));
    this.position.y = 0;

    // facing slerp toward travel direction
    if (mag > 0.05) {
      const target = Math.atan2(_targetVel.x, _targetVel.z);
      const cur = Math.atan2(this.facing.x, this.facing.z);
      let diff = target - cur;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const a = cur + diff * Math.min(1, P.TURN_LERP * dt);
      this.facing.set(Math.sin(a), 0, Math.cos(a));
      this.mesh.rotation.y = a;
    }
  }

  /** Instant stop (tackles, restarts). */
  stop() { this.velocity.set(0, 0, 0); }

  /** Teleport back to an explicit position with zero velocity (formations). */
  resetTo(pos) {
    this.position.set(pos.x, 0, pos.z);
    this.velocity.set(0, 0, 0);
    this._stunT = this._kickT = this._tackleT = this._celebrateT = 0;
    this.facing.set(this.team.attacking >= 0 ? 1 : -1, 0, 0);
    this.mesh.rotation.y = Math.atan2(this.facing.x, this.facing.z);
  }

  /** Brief stun (fake-shot hook / tackled). */
  stun(secs) { this._stunT = Math.max(this._stunT, secs); }

  // ---------------------------------------------------------------------------
  // Animation
  // ---------------------------------------------------------------------------
  playKickAnim() { this._kickT = 0.32; }
  playTackleAnim() { this._tackleT = 0.6; }
  celebrate() { this._celebrateT = 2.6; }

  setHighlight(on) { this._ring.visible = !!on; }

  /** Procedural animation FSM — call once per RENDER frame (visual only). */
  updateAnim(dt) {
    if (this._stunT > 0) this._stunT -= dt;
    const speed = Math.hypot(this.velocity.x, this.velocity.z);
    const speed01 = Math.min(1, speed / (CFG.PLAYER.JOG * CFG.PLAYER.SPRINT_MULT));

    if (this._kickT > 0) this._animMode = 'kick';
    else if (this._tackleT > 0) this._animMode = 'tackle';
    else if (this._celebrateT > 0) this._animMode = 'celebrate';
    else if (speed01 < 0.06) this._animMode = 'idle';
    else if (this.hasBall) this._animMode = 'dribble';
    else if (this.isSprinting) this._animMode = 'sprint';
    else this._animMode = 'jog';

    if (this._mixer) { this._updateAnimGLB(dt, speed, speed01); return; }

    switch (this._animMode) {
      case 'kick': {
        this._kickT -= dt;
        // quick right-leg swing: back then through
        const t = 1 - Math.max(0, this._kickT) / 0.32;
        this._legR.rotation.x = t < 0.4 ? -1.1 * (t / 0.4) : -1.1 + 2.3 * ((t - 0.4) / 0.6);
        this._armL.rotation.x = -0.9; this._armR.rotation.x = 0.7;
        this._body.rotation.x = 0.12;
        break;
      }
      case 'tackle': {
        this._tackleT -= dt;
        // low slide: body pitched forward, one leg extended
        this._body.rotation.x = -0.85;
        this._body.position.y = -0.35;
        this._legR.rotation.x = -1.3;
        this._legL.rotation.x = 0.4;
        this._armL.rotation.x = -0.6; this._armR.rotation.x = -0.6;
        break;
      }
      case 'celebrate': {
        this._celebrateT -= dt;
        const t = this._celebrateT;
        this._body.position.y = Math.abs(Math.sin(t * 6)) * 0.35;
        this._armL.rotation.x = -2.7; this._armR.rotation.x = -2.7;
        this._legL.rotation.x = this._legR.rotation.x = 0;
        break;
      }
      default: {
        // locomotion: swing frequency/amplitude scale with speed
        const amp = this._animMode === 'idle' ? 0.05
          : speed01 * (this._animMode === 'sprint' ? 1.05 : this._animMode === 'dribble' ? 0.55 : 0.85);
        this._phase += dt * (3 + speed * 1.7);
        const s = Math.sin(this._phase) * amp;
        this._legL.rotation.x = s;
        this._legR.rotation.x = -s;
        this._armL.rotation.x = -s * 0.8;
        this._armR.rotation.x = s * 0.8;
        this._body.rotation.x = this._animMode === 'sprint' ? 0.22 : 0.08 * speed01;
        this._body.position.y = Math.abs(Math.sin(this._phase)) * 0.05 * speed01;
      }
    }

    // relax timed poses back to neutral as they expire
    if (this._animMode !== 'tackle' && this._body.position.y < 0) this._body.position.y *= 0.8;
    if (this._animMode !== 'tackle' && this._animMode !== 'kick' && this._body.rotation.x !== 0 && this._animMode === 'idle') this._body.rotation.x *= 0.8;
  }

  /**
   * GLB animation path: cross-fade the clip mapped from the FSM mode, scale
   * locomotion playback to actual speed, and layer a small procedural body
   * pitch for tackles (the clip set has no slide animation).
   */
  _updateAnimGLB(dt, speed, speed01) {
    if (this._kickT > 0) this._kickT -= dt;
    if (this._tackleT > 0) this._tackleT -= dt;
    if (this._celebrateT > 0) this._celebrateT -= dt;

    const mode = this._animMode;
    // slow off-ball movement reads better on the Walk clip
    const clipKey = (mode === 'jog' && speed01 < 0.4) ? GLB_CLIP.walk : GLB_CLIP[mode] || GLB_CLIP.idle;
    const action = this._getAction(clipKey);
    const oneShot = mode === 'kick' || mode === 'tackle';

    // retrigger when the clip changes OR a one-shot mode re-enters (kick and
    // tackle share the Punch clip, so the clip key alone can't tell them apart)
    if (action && (clipKey !== this._activeClipKey || (oneShot && mode !== this._lastGlbMode))) {
      action.reset();
      action.setLoop(oneShot ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
      action.clampWhenFinished = oneShot;
      if (this._activeAction && this._activeAction !== action) this._activeAction.fadeOut(0.15);
      action.fadeIn(0.15).play();
      this._activeAction = action;
      this._activeClipKey = clipKey;
    }
    this._lastGlbMode = mode;

    if (this._activeAction) {
      // locomotion clips track real pace; one-shots play at natural speed
      if (clipKey === 'Run') this._activeAction.timeScale = Math.max(0.6, speed / CFG.PLAYER.JOG);
      else if (clipKey === 'Walk') this._activeAction.timeScale = Math.max(0.6, speed / CFG.PLAYER.WALK);
      else if (clipKey === 'Punch') this._activeAction.timeScale = 2.2; // 0.92s clip vs ~0.4s kick window
      else this._activeAction.timeScale = 1;
    }

    // tackle: pitch the whole body into a low slide on top of the clip
    if (mode === 'tackle') {
      this._body.rotation.x = Math.max(-0.85, this._body.rotation.x - dt * 7);
      this._body.position.y = Math.max(-0.3, this._body.position.y - dt * 2.4);
    } else {
      this._body.rotation.x *= Math.max(0, 1 - dt * 10);
      if (this._body.position.y < 0) this._body.position.y *= Math.max(0, 1 - dt * 10);
    }

    this._mixer.update(dt);
  }

  /** Lazily build (and cache) the AnimationAction for a clip key. */
  _getAction(clipKey) {
    let action = this._actions[clipKey];
    if (!action) {
      const clip = this._clips[clipKey];
      if (!clip) return null;
      action = this._mixer.clipAction(clip);
      this._actions[clipKey] = action;
    }
    return action;
  }
}

export default Player;
