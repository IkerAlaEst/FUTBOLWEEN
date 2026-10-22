/**
 * AudioManager.js — POLISH (SPEC §2.13).
 *
 * 100% synthesized WebAudio — no audio files. Design:
 *   - the AudioContext is created (or resumed) ONLY on the first user gesture
 *     (pointerdown / keydown / any gamepad button, polled briefly) so autoplay
 *     policy can never break boot, and every public path is wrapped — this
 *     class never throws, it just stays silent when audio is unavailable;
 *   - master gain + gentle compressor;
 *   - crowd ambience: looped brown-noise buffer through a lowpass with a slow
 *     LFO on the gain; swells driven by 'crowd_goal' (big swell + whistle-ish
 *     cheer burst) and 'crowd_ooh' (short swell, near misses / post pings);
 *   - whistle: 2.2 kHz square + bandpassed noise with a ~30 Hz tremolo
 *     (pea-whistle trill); short variant for kickoff/foul, long double-blow
 *     for full time ('whistle_long', triggered by 'matchEnd' or a
 *     {name:'whistle', long:true} sfx payload);
 *   - kick thump: low sine burst whose pitch/gain scale with payload power
 *     ({power01} 0..1 or {power} m/s, both optional);
 *   - tackle thud: filtered noise burst + 55 Hz body;
 *   - goal sting (on the 'goal' event): small rising two-note brass-ish stab
 *     on top of the crowd swell.
 *
 * Contract kept: constructor() subscribes to 'sfx' + 'goal' itself; the rest
 * of the game only talks to audio via events.emit('sfx', {name, ...}).
 */
import { events } from '../core/events.js';
import { CFG } from '../config.js';

// minimum seconds between two plays of the same name (event doubles are common:
// e.g. MatchManager emits BOTH 'goal' and sfx 'crowd_goal' for one goal)
const COOLDOWN = { kick: 0.06, whistle: 0.3, crowd_goal: 0.8, crowd_ooh: 0.5, tackle: 0.12, whistle_long: 0.5, sting: 0.8 };
const CROWD_BASE = 0.055;

export class AudioManager {
  constructor() {
    /** @type {AudioContext|null} created lazily on first user gesture */
    this._ctx = null;
    this._master = null;      // master GainNode
    this._bus = null;         // post-compressor effects bus
    this._crowdGain = null;   // ambience gain (swells ride on this)
    this._noise = null;       // shared 2s white-noise buffer
    this._cool = Object.create(null); // name -> ctx.currentTime of next allowed play
    this._whistles = new Set();       // active whistle voices (long blow stops shorts)

    // Contract: subscribes to sfx + goal events itself.
    events.on('sfx', (e) => this._safe(() => this._onSfx(e)));
    events.on('goal', () => this._safe(() => { this._play('crowd_goal'); this._play('sting'); }));
    events.on('matchEnd', () => this._safe(() => this._play('whistle_long')));

    this._armUnlock();
  }

  // ---------------------------------------------------------------------------
  // Unlock (autoplay policy): pointer / key / gamepad-button first gesture
  // ---------------------------------------------------------------------------
  _armUnlock() {
    const unlock = () => {
      this._ensureContext();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);

    // gamepad buttons fire no DOM events — poll until the context exists
    const poll = () => {
      if (this._ctx) return; // done
      try {
        const pads = navigator.getGamepads?.() || [];
        for (const p of pads) {
          if (p && p.buttons.some((b) => b.pressed)) { unlock(); break; }
        }
      } catch (_) { /* getGamepads unavailable — pointer/key still arm us */ }
      requestAnimationFrame(poll);
    };
    requestAnimationFrame(poll);
  }

  /** Create/resume the AudioContext + build the graph. Safe to call any time. */
  _ensureContext() {
    if (this._ctx) {
      if (this._ctx.state === 'suspended') this._ctx.resume().catch(() => {});
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      this._ctx = ctx;

      this._master = ctx.createGain();
      this._master.gain.value = 0.5;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 4;
      this._bus = ctx.createGain();
      this._master.connect(comp);
      comp.connect(this._bus);
      this._bus.connect(ctx.destination);

      // shared 2s white-noise buffer (crowd / whistle / tackle all reuse it)
      const len = ctx.sampleRate * 2;
      this._noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const nd = this._noise.getChannelData(0);
      for (let i = 0; i < len; i++) nd[i] = Math.random() * 2 - 1;

      this._startCrowd();
    } catch (_) {
      this._ctx = null; // audio unavailable — the game continues silently
    }
  }

  // ---------------------------------------------------------------------------
  // Crowd ambience: looped brown noise, lowpass, slow LFO breathing
  // ---------------------------------------------------------------------------
  _startCrowd() {
    const ctx = this._ctx;
    // brown-ish noise: integrate white noise (leaky) into a 4s loop
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = last * 3.2;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    this._crowdGain = ctx.createGain();
    this._crowdGain.gain.value = CROWD_BASE;
    // slow LFO so the crowd "breathes"
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 0.018;
    lfo.connect(lfoDepth);
    lfoDepth.connect(this._crowdGain.gain);
    src.connect(lp);
    lp.connect(this._crowdGain);
    this._crowdGain.connect(this._master);
    src.start();
    lfo.start();
  }

  /** Ride the ambience gain: fast attack up to `peak`, slow release home. */
  _crowdSwell(peak, attack, release) {
    if (!this._crowdGain) return;
    const g = this._crowdGain.gain, t = this._ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(Math.max(g.value, CROWD_BASE), t);
    g.linearRampToValueAtTime(peak, t + attack);
    g.exponentialRampToValueAtTime(CROWD_BASE, t + attack + release);
  }

  /** Cheering burst: bandpassed noise sweeping up (whistle-ish wash). */
  _cheerBurst(f0, f1, peak, dur) {
    const ctx = this._ctx, t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this._noise;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(f0, t);
    bp.frequency.linearRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp); bp.connect(g); g.connect(this._master);
    src.start(t);
    src.stop(t + dur + 0.1);
  }

  // ---------------------------------------------------------------------------
  // Whistle: 2.2 kHz square + noise, ~30 Hz tremolo = pea-whistle trill
  // ---------------------------------------------------------------------------
  _blowWhistle(when, dur) {
    const ctx = this._ctx;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, when);
    out.gain.exponentialRampToValueAtTime(0.3, when + 0.03);
    out.gain.setValueAtTime(0.3, when + dur - 0.05);
    out.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    out.connect(this._master);

    // carrier with tremolo
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 2200;
    const tremGain = ctx.createGain();
    tremGain.gain.value = 0.65;
    const trem = ctx.createOscillator();
    trem.frequency.value = 30;
    const tremDepth = ctx.createGain();
    tremDepth.gain.value = 0.35;
    trem.connect(tremDepth);
    tremDepth.connect(tremGain.gain);
    osc.connect(tremGain);
    tremGain.connect(out);

    // breathy edge
    const noise = ctx.createBufferSource();
    noise.buffer = this._noise;
    noise.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2300;
    bp.Q.value = 5;
    const ng = ctx.createGain();
    ng.gain.value = 0.06;
    noise.connect(bp); bp.connect(ng); ng.connect(out);

    osc.start(when); trem.start(when); noise.start(when);
    const stopAt = when + dur + 0.05;
    osc.stop(stopAt); trem.stop(stopAt); noise.stop(stopAt);
    const voice = { stop: () => { try { osc.stop(); trem.stop(); noise.stop(); } catch (_) {} } };
    this._whistles.add(voice);
    setTimeout(() => this._whistles.delete(voice), (stopAt - ctx.currentTime + 0.1) * 1000);
  }

  /** Short blow (kickoff/foul/throw-in) or the long full-time double blow. */
  _whistle(long) {
    if (long) {
      // a long blast silences any short blow in flight
      for (const v of this._whistles) v.stop();
      this._whistles.clear();
      const t = this._ctx.currentTime + 0.02;
      this._blowWhistle(t, 0.45);
      this._blowWhistle(t + 0.62, 0.95);
    } else {
      this._blowWhistle(this._ctx.currentTime + 0.01, 0.38);
    }
  }

  // ---------------------------------------------------------------------------
  // Kick thump / tackle thud / goal sting
  // ---------------------------------------------------------------------------
  _kick(power01) {
    const ctx = this._ctx, t = ctx.currentTime;
    const p = Math.max(0, Math.min(1, power01 ?? 0.5));
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95 + 45 * p, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.11);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.28 + 0.34 * p, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    osc.connect(g); g.connect(this._master);
    osc.start(t); osc.stop(t + 0.16);

    // leather click
    const click = ctx.createBufferSource();
    click.buffer = this._noise;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1600;
    const cg = ctx.createGain();
    cg.gain.setValueAtTime(0.05 + 0.05 * p, t);
    cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    click.connect(hp); hp.connect(cg); cg.connect(this._master);
    click.start(t); click.stop(t + 0.05);
  }

  _tackle() {
    const ctx = this._ctx, t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this._noise;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 260;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    src.connect(lp); lp.connect(g); g.connect(this._master);
    src.start(t); src.stop(t + 0.18);

    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(58, t);
    osc.frequency.exponentialRampToValueAtTime(36, t + 0.1);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.26, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.connect(og); og.connect(this._master);
    osc.start(t); osc.stop(t + 0.14);
  }

  /** Small rising two-note stab over the goal crowd swell. */
  _goalSting() {
    const ctx = this._ctx, t = ctx.currentTime;
    const notes = [[392.0, 0], [523.25, 0.14]]; // G4 -> C5
    for (const [freq, dt] of notes) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1600;
      const g = ctx.createGain();
      const t0 = t + dt;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.16, t0 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55);
      osc.connect(lp); lp.connect(g); g.connect(this._master);
      osc.start(t0); osc.stop(t0 + 0.6);
    }
  }

  // ---------------------------------------------------------------------------
  // Dispatch
  // ---------------------------------------------------------------------------

  _onSfx(e) {
    if (!e || !e.name) return;
    if (e.name === 'whistle' && e.long) return this._play('whistle_long');
    this._play(e.name, e);
  }

  /**
   * Play a named effect: 'kick' | 'whistle' | 'whistle_long' | 'crowd_goal' |
   * 'crowd_ooh' | 'tackle' | 'sting'. Never throws; silent until unlocked.
   */
  _play(name, payload) {
    if (!this._ctx || !name) return;
    if (this._ctx.state === 'suspended') { this._ctx.resume().catch(() => {}); return; }
    const now = this._ctx.currentTime;
    if (now < (this._cool[name] || 0)) return; // cooldown (event doubles)
    this._cool[name] = now + (COOLDOWN[name] ?? 0.1);

    switch (name) {
      case 'kick': {
        let p = payload?.power01;
        if (p == null && typeof payload?.power === 'number') p = payload.power / CFG.KICK.SHOT_MAX;
        this._kick(p);
        break;
      }
      case 'whistle': this._whistle(false); break;
      case 'whistle_long': this._whistle(true); break;
      case 'crowd_goal':
        this._crowdSwell(0.34, 0.22, 4.2);
        this._cheerBurst(900, 1900, 0.22, 2.4);
        break;
      case 'crowd_ooh':
        this._crowdSwell(0.2, 0.08, 1.1);
        this._cheerBurst(700, 320, 0.16, 0.8);
        break;
      case 'tackle': this._tackle(); break;
      case 'sting': this._goalSting(); break;
      default: break; // unknown names are ignored by design
    }
  }

  _safe(fn) {
    try { fn(); } catch (_) { /* audio must never break the game loop */ }
  }
}

export default AudioManager;
