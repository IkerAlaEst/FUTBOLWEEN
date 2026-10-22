/**
 * CameraRig.js — broadcast / behind / tactical camera (SPEC §2.9).
 *
 * Modes (switched by main.js from dpad input: up=broadcast, right=behind,
 * down=tactical):
 *   broadcast : elevated side-on TV view following the ball with exponential
 *               lag; zoom factor interpolates CFG.CAM.ZOOM_MIN..ZOOM_MAX with
 *               player spread and pushes in (ZOOM_MIN) when the ball is near a
 *               goal (nearGoal flag, computed by main via GOAL_ZOOM_RADIUS).
 *   behind    : low chase cam behind the controlled player looking upfield.
 *               main.js assigns `rig.player` (kept in sync with
 *               'controlledPlayerChanged').
 *   tactical  : near top-down overview. Keeps a deliberate z-tilt so the
 *               camera's ground-projected forward vector never degenerates
 *               (PlayerController relies on it for camera-relative movement).
 *
 * All position/look-at motion is smoothed with k = 1 - exp(-LERP*dt).
 */
import * as THREE from 'three';
import { CFG } from '../config.js';

// Module-level temps.
const _desired = new THREE.Vector3();
const _lookDesired = new THREE.Vector3();
const _proj = new THREE.Vector3();

export class CameraRig {
  /** @param {THREE.PerspectiveCamera} camera */
  constructor(camera) {
    this.camera = camera;
    /** @type {'broadcast'|'behind'|'tactical'} */
    this.mode = 'broadcast';
    /** @type {import('../entities/Player.js').Player|null} for 'behind' mode */
    this.player = null;

    this._pos = new THREE.Vector3(0, CFG.CAM.HEIGHT, CFG.CAM.DIST);
    this._look = new THREE.Vector3(0, 0, 0);
    this._zoom = 1; // smoothed zoom factor
    camera.position.copy(this._pos);
    camera.lookAt(this._look);
  }

  /** Change mode (invalid values ignored). */
  setMode(mode) {
    if (mode === 'broadcast' || mode === 'behind' || mode === 'tactical') this.mode = mode;
  }

  /**
   * @param {number} dt render-frame delta
   * @param {THREE.Vector3} focus ball position
   * @param {number} spread 0..1 player spread across the pitch
   * @param {boolean} nearGoal ball inside CFG.CAM.GOAL_ZOOM_RADIUS of a goal
   */
  update(dt, focus, spread = 0.5, nearGoal = false) {
    const C = CFG.CAM;
    const k = 1 - Math.exp(-C.LERP * dt);

    if (this.mode === 'behind' && this.player) {
      const p = this.player;
      _desired.copy(p.position).addScaledVector(p.facing, -C.BEHIND_DIST);
      _desired.y = C.BEHIND_HEIGHT;
      _lookDesired.copy(p.position).addScaledVector(p.facing, 9);
      _lookDesired.y = 1;
    } else if (this.mode === 'tactical') {
      _desired.set(focus.x * 0.25, C.TACTICAL_HEIGHT, focus.z * 0.25 + 10);
      _lookDesired.set(focus.x * 0.25, 0, focus.z * 0.25);
    } else {
      // broadcast (also the fallback when 'behind' has no player)
      const targetZoom = nearGoal ? C.ZOOM_MIN : C.ZOOM_MIN + (C.ZOOM_MAX - C.ZOOM_MIN) * Math.min(1, Math.max(0, spread));
      this._zoom += (targetZoom - this._zoom) * k;
      _desired.set(
        focus.x * 0.85,
        C.HEIGHT * this._zoom,
        focus.z * 0.45 + C.DIST * this._zoom
      );
      _lookDesired.set(focus.x, 0, focus.z * 0.8);
    }

    this._pos.lerp(_desired, k);
    this._look.lerp(_lookDesired, k);
    this.camera.position.copy(this._pos);
    this.camera.lookAt(this._look);
  }

  /**
   * Project a world position to CSS pixels (used by InputManager's
   * aimRefProvider for mouse aim). Writes {x, y} into `out`.
   */
  toScreen(pos, out) {
    _proj.copy(pos).project(this.camera);
    out.x = (_proj.x + 1) / 2 * innerWidth;
    out.y = (1 - _proj.y) / 2 * innerHeight;
    return out;
  }
}

export default CameraRig;
