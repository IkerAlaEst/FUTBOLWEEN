/**
 * InputManager.js — unified gamepad + keyboard/mouse input (SPEC §2.3).
 *
 * Two local-player slots:
 *   slot 0 (P1 / home) — first gamepad OR keyboard/mouse fallback
 *   slot 1 (P2 / away) — second gamepad only (idle when absent)
 *
 * - Polls navigator.getGamepads() EVERY update() (W3C pads are per-frame snapshots).
 * - Pads are assigned sticky to slots on connect (first free slot); disconnect
 *   frees that slot without stealing the other player's pad.
 * - Xbox mapping per W3C "standard" layout (see README §2):
 *     axes[0..1] left stick (Y inverted), axes[2..3] right stick,
 *     buttons[0]=A [1]=B [2]=X [3]=Y [4]=LB [5]=RB [6]=LT [7]=RT [8]=Back
 *     [9]=Start (pause) [12..15]=D-pad up/down/left/right.
 *   Button semantics: A=sprint(held)+through(tap), B=shoot(charge), X=pass(charge),
 *   Y=lob, LB=switch, RB=skill, RT=sprint, LT=finesse, Start=pause, D-pad=camera.
 * - Keyboard/mouse fallback (P1 only): WASD move, mouse aim, LMB shoot (hold=charge),
 *   RMB or J pass, K lob, Space through, Shift sprint, Ctrl finesse, E skill,
 *   Q switch, arrows dpad, Esc/Enter pause, ⌘F/Ctrl+F toggle fullscreen.
 * - Sticks are deadzoned (CFG.INPUT.DEADZONE) then radially re-normalized.
 * - usingGamepad auto-switches for P1 only: first real pad-0 input => true,
 *   first keyboard/mouse input => false.
 * - vibrate() rumbles every connected pad; vibrateSlot(i, ...) targets one.
 *
 * Allocation note: each slot double-buffers its InputState — zero GC churn.
 * Consumers must read state synchronously after update().
 */
import { CFG } from '../config.js';

/** Radial deadzone + renormalization. Writes into `out` {x, y}. */
function radialNormalize(x, y, dz, out) {
  const m = Math.hypot(x, y);
  if (m < dz || m === 0) { out.x = 0; out.y = 0; return out; }
  const n = Math.min(1, (m - dz) / (1 - dz)) / m;
  out.x = x * n;
  out.y = y * n;
  return out;
}

/** One virtual action button with edge + hold tracking. */
class ActionButton {
  constructor() { this.down = false; this.pressed = false; this.released = false; this.heldSecs = 0; this._downAt = 0; }
  /** Feed the current raw `down` each poll; computes edges + hold time. */
  feed(down, nowMs) {
    this.pressed = down && !this.down;
    this.released = !down && this.down;
    if (this.pressed) this._downAt = nowMs;
    // On the release frame heldSecs still reports the final hold duration,
    // so charge-release logic can read it from the same snapshot.
    this.heldSecs = (down || this.released) && this._downAt > 0 ? (nowMs - this._downAt) / 1000 : 0;
    this.down = down;
  }
  reset() { this.down = this.pressed = this.released = false; this.heldSecs = 0; this._downAt = 0; }
}

/** Build a fresh InputState shell (SPEC §2.3). */
function makeState() {
  return {
    move: { x: 0, y: 0 },
    aim: { x: 0, y: 0 },
    sprint: false, finesse: false, skill: false,
    pass: { pressed: false, released: false, heldSecs: 0 },
    lob: { pressed: false, released: false, heldSecs: 0 },
    shoot: { pressed: false, released: false, heldSecs: 0 },
    through: { pressed: false },
    switchPlayer: { pressed: false },
    dpad: { up: false, down: false, left: false, right: false },
    anyInput: false,
  };
}

/** Per-slot edge detectors + double-buffered state. */
function makeSlot() {
  return {
    states: [makeState(), makeState()],
    cur: 0,
    pass: new ActionButton(),
    lob: new ActionButton(),
    shoot: new ActionButton(),
    through: new ActionButton(),
    switch: new ActionButton(),
    pause: new ActionButton(),
    prevDpad: { up: false, down: false, left: false, right: false },
  };
}

function writeIdle(S) {
  S.move.x = S.move.y = 0;
  S.aim.x = S.aim.y = 0;
  S.sprint = S.finesse = S.skill = false;
  S.pass.pressed = S.pass.released = false; S.pass.heldSecs = 0;
  S.lob.pressed = S.lob.released = false; S.lob.heldSecs = 0;
  S.shoot.pressed = S.shoot.released = false; S.shoot.heldSecs = 0;
  S.through.pressed = false;
  S.switchPlayer.pressed = false;
  S.dpad.up = S.dpad.down = S.dpad.left = S.dpad.right = false;
  S.anyInput = false;
}

export class InputManager {
  /**
   * @param {HTMLElement} domElement element that owns the mouse (renderer canvas
   *        or its container). Keyboard is listened on window.
   */
  constructor(domElement) {
    this.domElement = domElement || document.body;

    /** Edge-triggered pause callback (Start / Esc / Enter). Assign from main.js. */
    this.onPausePressed = null;
    /**
     * Gamepad connect/disconnect callback:
     * (connected:boolean, name:string, slot:0|1).
     */
    this.onGamepadChange = null;
    /**
     * Optional: returns the controlled player's position in CSS pixels
     * {x, y} so mouse aim can be computed as "direction from player".
     * Assigned by main.js; defaults to screen center when null.
     */
    this.aimRefProvider = null;

    /** @type {boolean} P1 auto-detected input source */
    this.usingGamepad = false;

    /** Sticky gamepad index per slot (null = empty). */
    this._padIndex = [null, null];

    this._slots = [makeSlot(), makeSlot()];

    // Raw keyboard state (event.code -> true while held) — P1 only.
    this._keys = new Set();
    this._mouse = { x: innerWidth / 2, y: innerHeight / 2, lmb: false, rmb: false };
    this._kbDirty = false; // set on any kb/mouse activity => flip P1 to keyboard mode
    // Tap edges captured in event listeners so presses shorter than one frame
    // are never missed (gamepad can't do this — it is poll-only by design).
    this._tap = { pass: 0, lob: 0, shoot: 0, through: 0, switch: 0, pause: 0, dup: 0, ddown: 0, dleft: 0, dright: 0 };

    this._bindEvents();
  }

  // ---------------------------------------------------------------------------
  // Event wiring
  // ---------------------------------------------------------------------------
  _bindEvents() {
    window.addEventListener('gamepadconnected', (e) => {
      const slot = this._assignPad(e.gamepad.index);
      if (slot >= 0) this.onGamepadChange?.(true, e.gamepad.id || 'Gamepad', slot);
    });
    window.addEventListener('gamepaddisconnected', (e) => {
      const slot = this._releasePad(e.gamepad.index);
      if (slot >= 0) this.onGamepadChange?.(false, e.gamepad.id || 'Gamepad', slot);
    });

    window.addEventListener('keydown', (e) => {
      // ⌘F / Ctrl+F — toggle browser fullscreen (blocks page Find).
      if ((e.metaKey || e.ctrlKey) && e.code === 'KeyF') {
        e.preventDefault();
        if (!e.repeat) this._toggleFullscreen();
        return;
      }
      // Ignore auto-repeat for edge semantics; ignore when typing in a field.
      if (e.repeat) return;
      this._keys.add(e.code);
      this._kbDirty = true;
      // capture sub-frame taps as edges
      switch (e.code) {
        case 'KeyJ': this._tap.pass = 1; break;
        case 'KeyK': this._tap.lob = 1; break;
        case 'KeyL': this._tap.shoot = 1; break;
        case 'Space': this._tap.through = 1; break;
        case 'KeyQ': this._tap.switch = 1; break;
        case 'Escape': case 'Enter': this._tap.pause = 1; break;
        case 'ArrowUp': this._tap.dup = 1; break;
        case 'ArrowDown': this._tap.ddown = 1; break;
        case 'ArrowLeft': this._tap.dleft = 1; break;
        case 'ArrowRight': this._tap.dright = 1; break;
      }
      // Stop page scroll / quick-find stealing our controls.
      if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this._keys.delete(e.code));
    window.addEventListener('blur', () => this._clearAll()); // avoid stuck keys

    const el = this.domElement;
    el.addEventListener('contextmenu', (e) => e.preventDefault()); // RMB = pass
    window.addEventListener('mousemove', (e) => {
      this._mouse.x = e.clientX; this._mouse.y = e.clientY;
    });
    el.addEventListener('mousedown', (e) => {
      if (e.button === 0) { this._mouse.lmb = true; this._tap.shoot = 1; }
      if (e.button === 2) { this._mouse.rmb = true; this._tap.pass = 1; }
      this._kbDirty = true;
    });
    // mouseup on window so releases outside the canvas never stick.
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this._mouse.lmb = false;
      if (e.button === 2) this._mouse.rmb = false;
    });
  }

  _clearAll() {
    this._keys.clear();
    this._mouse.lmb = this._mouse.rmb = false;
    for (const key in this._tap) this._tap[key] = 0;
    for (const slot of this._slots) {
      for (const b of [slot.pass, slot.lob, slot.shoot, slot.through, slot.switch, slot.pause]) b.reset();
    }
  }

  /** Enter / exit Fullscreen API on the document element. */
  _toggleFullscreen() {
    const doc = document;
    const el = doc.documentElement;
    if (doc.fullscreenElement) {
      doc.exitFullscreen?.().catch(() => { /* user denied / unsupported */ });
      return;
    }
    el.requestFullscreen?.().catch(() => { /* user denied / unsupported */ });
  }

  // ---------------------------------------------------------------------------
  // Public API (SPEC §2.3 + dual-slot extensions)
  // ---------------------------------------------------------------------------

  /** P1 InputState snapshot (backward-compatible). */
  get state() { return this.getState(0); }

  /** P2 InputState snapshot (idle when no second pad). */
  get stateP2() { return this.getState(1); }

  /** @param {0|1} slot */
  getState(slot) {
    const s = this._slots[slot] || this._slots[0];
    return s.states[s.cur];
  }

  /** True when a gamepad is assigned to the slot. */
  hasPad(slot) { return this._padIndex[slot] !== null; }

  /** Number of assigned pads (0..2). */
  get padCount() {
    return (this._padIndex[0] !== null ? 1 : 0) + (this._padIndex[1] !== null ? 1 : 0);
  }

  /** Display name for the pad in `slot`, or null. */
  padName(slot) {
    const pad = this._padAt(slot);
    return pad ? (pad.id || 'Gamepad') : null;
  }

  /** Poll everything. Call EVERY render frame (and at each fixed-step batch). */
  update() {
    const now = performance.now();
    this._syncPads();

    const pad0 = this._padAt(0);
    const pad1 = this._padAt(1);
    const pad0Active = pad0 ? this._padActivity(pad0) : false;

    // --- P1 source auto-switch ---
    if (pad0Active && !this.usingGamepad) this.usingGamepad = true;
    else if (this._kbDirty && !pad0Active) this.usingGamepad = false;
    this._kbDirty = false;

    this._fillSlot(0, now, this.usingGamepad ? pad0 : null, !this.usingGamepad);
    // Keyboard taps are consumed inside the keyboard path; drop leftovers when
    // P1 is on a pad so a later mode-switch doesn't replay a stale edge.
    if (this.usingGamepad) {
      for (const key in this._tap) this._tap[key] = 0;
    }
    this._fillSlot(1, now, pad1, false);

    // Pause from either pad's Start/Back, or P1 keyboard Esc/Enter.
    if (this._slots[0].pause.pressed || this._slots[1].pause.pressed) {
      this.onPausePressed?.();
    }
  }

  /**
   * Rumble every connected gamepad. Safe no-op on keyboard / unsupported pads.
   * @param {number} strong 0..1 low-frequency motor
   * @param {number} weak   0..1 high-frequency motor
   * @param {number} ms     duration in milliseconds
   */
  vibrate(strong, weak, ms) {
    this.vibrateSlot(0, strong, weak, ms);
    this.vibrateSlot(1, strong, weak, ms);
  }

  /** Rumble a single slot's pad. */
  vibrateSlot(slot, strong, weak, ms) {
    const idx = this._padIndex[slot];
    if (idx === null || !navigator.getGamepads) return;
    try {
      const pad = navigator.getGamepads()[idx];
      const act = pad && pad.vibrationActuator;
      if (!act || typeof act.playEffect !== 'function') return;
      const p = act.playEffect('dual-rumble', {
        duration: Math.max(1, ms | 0),
        strongMagnitude: Math.min(1, Math.max(0, strong)),
        weakMagnitude: Math.min(1, Math.max(0, weak)),
      });
      if (p && typeof p.catch === 'function') p.catch(() => { /* haptics rejected */ });
    } catch (_) { /* no haptics available — ignore */ }
  }

  // ---------------------------------------------------------------------------
  // Slot fill / pad assignment
  // ---------------------------------------------------------------------------

  /**
   * Rewrite one slot's double-buffered state from a pad and/or keyboard.
   * @param {0|1} slotIndex
   * @param {number} now
   * @param {Gamepad|null} pad
   * @param {boolean} useKeyboard  only meaningful for slot 0
   */
  _fillSlot(slotIndex, now, pad, useKeyboard) {
    const slot = this._slots[slotIndex];
    const S = slot.states[slot.cur ^= 1];
    const dz = CFG.INPUT.DEADZONE;

    if (!pad && !useKeyboard) {
      // keep edge detectors cold so a late connect doesn't fake a press
      for (const b of [slot.pass, slot.lob, slot.shoot, slot.through, slot.switch, slot.pause]) {
        b.feed(false, now);
      }
      slot.prevDpad.up = slot.prevDpad.down = slot.prevDpad.left = slot.prevDpad.right = false;
      writeIdle(S);
      return;
    }

    // --- sticks / move / aim ---
    if (pad) {
      radialNormalize(pad.axes[0] || 0, -(pad.axes[1] || 0), dz, S.move);
      radialNormalize(pad.axes[2] || 0, -(pad.axes[3] || 0), dz, S.aim);
    } else {
      const k = this._keys;
      const mx = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0);
      const my = (k.has('KeyW') ? 1 : 0) - (k.has('KeyS') ? 1 : 0);
      radialNormalize(mx, my, 0, S.move);
      this._mouseAim(S.aim);
    }

    // --- raw button levels ---
    const b = (i) => !!(pad && pad.buttons[i] && pad.buttons[i].pressed);
    const bVal = (i) => (pad && pad.buttons[i] ? pad.buttons[i].value : 0);
    let pass, lob, shoot, through, sw, sprint, finesse, skill, pause, dp;
    if (pad) {
      pass = b(2);                       // X
      lob = b(3);                        // Y
      shoot = b(1);                      // B
      through = b(0);                    // A (tap => through; held => sprint)
      sw = b(4);                         // LB
      skill = b(5);                      // RB
      finesse = b(6) || bVal(6) > 0.4;   // LT (analog)
      sprint = b(0) || b(7) || bVal(7) > 0.4; // A held OR RT
      pause = b(9) || b(8);              // Start (Back as secondary)
      dp = { up: b(12), down: b(13), left: b(14), right: b(15) };
    } else {
      const k = this._keys, m = this._mouse, t = this._tap;
      pass = m.rmb || k.has('KeyJ') || !!t.pass;
      lob = k.has('KeyK') || !!t.lob;
      shoot = m.lmb || k.has('KeyL') || !!t.shoot;
      through = k.has('Space') || !!t.through;
      sw = k.has('KeyQ') || !!t.switch;
      skill = k.has('KeyE');
      finesse = k.has('ControlLeft') || k.has('ControlRight');
      sprint = k.has('ShiftLeft') || k.has('ShiftRight');
      pause = k.has('Escape') || k.has('Enter') || !!t.pause;
      dp = {
        up: k.has('ArrowUp') || !!t.dup, down: k.has('ArrowDown') || !!t.ddown,
        left: k.has('ArrowLeft') || !!t.dleft, right: k.has('ArrowRight') || !!t.dright,
      };
      // tap edges are single-use: consumed by this poll (P1 keyboard only)
      for (const key in this._tap) this._tap[key] = 0;
    }

    // --- edge detection + hold timing ---
    slot.pass.feed(pass, now);
    slot.lob.feed(lob, now);
    slot.shoot.feed(shoot, now);
    slot.through.feed(through, now);
    slot.switch.feed(sw, now);
    slot.pause.feed(pause, now);

    S.pass.pressed = slot.pass.pressed; S.pass.released = slot.pass.released; S.pass.heldSecs = slot.pass.heldSecs;
    S.lob.pressed = slot.lob.pressed; S.lob.released = slot.lob.released; S.lob.heldSecs = slot.lob.heldSecs;
    S.shoot.pressed = slot.shoot.pressed; S.shoot.released = slot.shoot.released; S.shoot.heldSecs = slot.shoot.heldSecs;
    S.through.pressed = slot.through.pressed;
    S.switchPlayer.pressed = slot.switch.pressed;
    S.sprint = sprint; S.finesse = finesse; S.skill = skill;

    // dpad: edge-triggered (true only on the press frame) for mode toggling.
    S.dpad.up = dp.up && !slot.prevDpad.up;
    S.dpad.down = dp.down && !slot.prevDpad.down;
    S.dpad.left = dp.left && !slot.prevDpad.left;
    S.dpad.right = dp.right && !slot.prevDpad.right;
    slot.prevDpad.up = dp.up; slot.prevDpad.down = dp.down;
    slot.prevDpad.left = dp.left; slot.prevDpad.right = dp.right;

    S.anyInput = !!(pad && this._padActivity(pad)) || S.move.x !== 0 || S.move.y !== 0 ||
      pass || lob || shoot || through || sw || skill || finesse || sprint ||
      dp.up || dp.down || dp.left || dp.right;
  }

  /** Assign pad index to the first free slot; return slot or -1 if both full / already known. */
  _assignPad(index) {
    if (this._padIndex[0] === index) return 0;
    if (this._padIndex[1] === index) return 1;
    if (this._padIndex[0] === null) { this._padIndex[0] = index; return 0; }
    if (this._padIndex[1] === null) { this._padIndex[1] = index; return 1; }
    return -1;
  }

  /** Free the slot holding this pad index; return slot or -1. */
  _releasePad(index) {
    if (this._padIndex[0] === index) { this._padIndex[0] = null; return 0; }
    if (this._padIndex[1] === index) { this._padIndex[1] = null; return 1; }
    return -1;
  }

  /**
   * Reconcile sticky slots with the live getGamepads() list (covers pads that
   * were already connected before listeners were bound).
   */
  _syncPads() {
    if (!navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    for (let s = 0; s < 2; s++) {
      const idx = this._padIndex[s];
      if (idx === null) continue;
      const p = pads[idx];
      if (!p || !p.connected) this._padIndex[s] = null;
    }
    for (let i = 0; i < pads.length; i++) {
      const p = pads[i];
      if (p && p.connected) this._assignPad(p.index);
    }
  }

  _padAt(slot) {
    const idx = this._padIndex[slot];
    if (idx === null || !navigator.getGamepads) return null;
    const p = navigator.getGamepads()[idx];
    return p && p.connected ? p : null;
  }

  /** True if the pad has any meaningful activity this poll (for auto-switch). */
  _padActivity(pad) {
    const dz = CFG.INPUT.DEADZONE;
    for (let i = 0; i < pad.buttons.length; i++) {
      if (pad.buttons[i] && pad.buttons[i].pressed) return true;
    }
    for (let i = 0; i < pad.axes.length; i++) {
      if (Math.abs(pad.axes[i]) > dz + 0.05) return true;
    }
    return false;
  }

  /** Mouse aim = normalized direction from player screen pos to the cursor. */
  _mouseAim(out) {
    const ref = this.aimRefProvider ? this.aimRefProvider()
      : { x: innerWidth / 2, y: innerHeight / 2 };
    const dx = this._mouse.x - ref.x;
    const dy = -(this._mouse.y - ref.y); // screen Y down => aim Y up
    const dist = Math.hypot(dx, dy);
    const DEAD_PX = 20, FULL_PX = 140;
    if (dist < DEAD_PX) { out.x = 0; out.y = 0; return; }
    const mag = Math.min(1, (dist - DEAD_PX) / (FULL_PX - DEAD_PX));
    out.x = (dx / dist) * mag;
    out.y = (dy / dist) * mag;
  }
}

export default InputManager;
