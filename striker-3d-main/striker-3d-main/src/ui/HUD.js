/**
 * HUD.js — POLISH (SPEC §2.12).
 *
 * Complete match HUD, framework-free DOM inside the #hud root (styling lives
 * in index.html + inline styles; animations are CSS keyframes from index.html):
 *   - scoreboard (top center): team color chips + names, score, up-counting
 *     clock (MM:SS) and half indicator;
 *   - stamina bars: P1/home bottom-left; P2/away bottom-right (above minimap)
 *     when two-controller mode is active;
 *   - shot/pass power meter: floating vertical bar projected next to the
 *     charging player via cameraRig.toScreen (reached through the
 *     window.__STRIKER__ debug handle when present; falls back to a fixed
 *     bottom-center bar), driven by 'shotCharged' {power01, player} events;
 *   - minimap (bottom right, 200x130 canvas): pitch outline, dots for both
 *     teams, ball dot, rings for each human-controlled player;
 *   - toasts (GOAL! has its own big center animation; OFFSIDE / FOUL —
 *     FREE KICK / HALF TIME / FULL TIME flow through showToast; HUD also
 *     listens to 'foul' events itself);
 *   - gamepad banner (+ P1/P2 slot) + dismissible button-mapping cheat sheet;
 *   - pause menu: Resume (wired to this.onResume by main.js) / Restart
 *     (location.reload()) / controls list.
 *
 * Contract kept: new HUD(rootEl), update(dt, {match, teams, ball}),
 * showGoal(teamName), showToast(text), showPause(on),
 * showGamepad(connected, name, slot?), setTwoPlayer(on), updateMinimap(...),
 * onResume callback.
 */
import { CFG } from '../config.js';
import { events } from '../core/events.js';

const PAD_MAP = [
  ['A', 'Sprint (hold) / Through ball (tap)'],
  ['B', 'Shoot (hold to charge)'],
  ['X', 'Pass (hold to charge)'],
  ['Y', 'Lob / Cross'],
  ['LB', 'Switch player'],
  ['RB', 'Skill move modifier'],
  ['RT', 'Sprint'],
  ['LT', 'Finesse shot'],
  ['Start', 'Pause'],
  ['D-pad', 'Camera: up broadcast / right behind / down tactical'],
];

const KB_MAP = [
  ['WASD', 'Move'], ['Mouse', 'Aim'], ['LMB', 'Shoot (hold to charge)'],
  ['RMB / J', 'Pass'], ['K', 'Lob / Cross'], ['Space', 'Through ball'],
  ['Shift', 'Sprint'], ['Ctrl', 'Finesse'], ['E', 'Skill move'],
  ['Q', 'Switch player'], ['Arrows', 'Camera modes'], ['Esc / Enter', 'Pause'],
];

export class HUD {
  /** @param {HTMLElement} rootEl the #hud overlay root from index.html */
  constructor(rootEl) {
    this.root = rootEl;
    /** Called when the pause overlay's Resume button is clicked (main wires). */
    this.onResume = null;

    this._twoPlayer = false;

    this._buildScoreboard();
    this._buildStamina();
    this._buildPowerMeter();
    this._buildMinimap();
    this._buildToasts();
    this._buildGoalOverlay();
    this._buildPauseMenu();
    this._buildGamepadUI();

    // shot/pass charge meter (tracks which player is charging for placement)
    events.on('shotCharged', ({ power01, player }) => {
      this._powerPlayer = power01 > 0 ? (player || null) : null;
      this._setPower(power01);
    });
    // surface fouls even if the MatchManager variant doesn't toast them itself
    // (offside payloads carry their own OFFSIDE toast from MatchManager)
    events.on('foul', (p) => { if (!p?.offside) this.showToast('FOUL — FREE KICK'); });

    this._lastScoreStr = '';
    this._lastClockStr = '';
    this._scr = { x: 0, y: 0 }; // reused toScreen output (no per-frame alloc)
    this._powerPlayer = null;
  }

  // ---------------------------------------------------------------------------
  // Builders
  // ---------------------------------------------------------------------------

  _panel(css) {
    const d = document.createElement('div');
    d.className = 'hud-panel';
    d.style.cssText = `position:absolute;${css}`;
    this.root.append(d);
    return d;
  }

  _buildScoreboard() {
    this._score = this._panel('top:12px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:10px;padding:8px 16px;font-size:17px;letter-spacing:1px;white-space:nowrap;');
    const chip = () => {
      const c = document.createElement('span');
      c.className = 'hud-chip';
      return c;
    };
    this._chipHome = chip();
    this._chipAway = chip();
    this._nameHome = document.createElement('span');
    this._nameAway = document.createElement('span');
    this._scoreText = document.createElement('span');
    this._scoreText.style.cssText = 'font-size:20px;font-weight:700;min-width:64px;text-align:center;';
    this._clock = document.createElement('span');
    this._clock.style.cssText = 'opacity:0.85;margin-left:6px;padding-left:10px;border-left:1px solid rgba(255,255,255,0.18);';
    this._half = document.createElement('span');
    this._half.className = 'hud-halfchip';
    this._score.append(this._chipHome, this._nameHome, this._scoreText, this._chipAway, this._nameAway, this._clock, this._half);
  }

  _buildStamina() {
    const make = (css, label) => {
      const stam = this._panel(css);
      const lab = document.createElement('div');
      lab.style.cssText = 'font-size:10px;opacity:0.7;letter-spacing:2px;margin-bottom:4px;';
      lab.textContent = label;
      const bg = document.createElement('div');
      bg.style.cssText = 'height:8px;background:rgba(255,255,255,0.12);border-radius:4px;overflow:hidden;';
      const bar = document.createElement('div');
      bar.style.cssText = 'height:100%;width:100%;background:#7bd88a;border-radius:4px;';
      bg.append(bar);
      stam.append(lab, bg);
      return { root: stam, label: lab, bar, pct: -1 };
    };
    this._stamHome = make('bottom:16px;left:16px;padding:8px 12px;width:190px;', 'P1 STAMINA');
    // sits above the minimap when P2 is active
    this._stamAway = make('bottom:160px;right:16px;padding:8px 12px;width:190px;', 'P2 STAMINA');
    this._stamAway.root.style.display = 'none';
    // legacy aliases (tests / older call sites)
    this._stamLabel = this._stamHome.label;
    this._stamBar = this._stamHome.bar;
    this._stamPct = -1;
  }

  _buildPowerMeter() {
    // floating vertical bar; positioned near the controlled player every frame
    const wrap = document.createElement('div');
    wrap.className = 'hud-power';
    wrap.style.display = 'none';
    const fill = document.createElement('div');
    fill.className = 'hud-power-fill';
    wrap.append(fill);
    this.root.append(wrap);
    this._power = wrap;
    this._powerFill = fill;
    this._power01 = 0;
  }

  _buildMinimap() {
    const panel = this._panel('bottom:16px;right:16px;padding:8px;');
    this._mapW = 200; this._mapH = 130;
    this._map = document.createElement('canvas');
    this._map.width = this._mapW; this._map.height = this._mapH;
    this._map.style.display = 'block';
    panel.append(this._map);
    this._mapCtx = this._map.getContext('2d');
    // static pitch line-work rendered once into an offscreen canvas
    this._mapStatic = document.createElement('canvas');
    this._mapStatic.width = this._mapW; this._mapStatic.height = this._mapH;
    this._renderMinimapStatic();
  }

  _buildToasts() {
    this._toasts = document.createElement('div');
    this._toasts.className = 'hud-toasts';
    this.root.append(this._toasts);
    this._lastToast = { text: '', t: -10 };
  }

  _buildGoalOverlay() {
    const goal = document.createElement('div');
    goal.className = 'hud-goal';
    goal.style.display = 'none';
    this._goalText = document.createElement('div');
    this._goalText.className = 'hud-goal-text';
    this._goalText.textContent = 'GOAL!';
    this._goalSub = document.createElement('div');
    this._goalSub.className = 'hud-goal-sub';
    goal.append(this._goalText, this._goalSub);
    this.root.append(goal);
    this._goal = goal;
    this._goalTimer = 0;
  }

  _buildPauseMenu() {
    const p = document.createElement('div');
    p.className = 'hud-overlay';
    p.style.display = 'none';

    const title = document.createElement('div');
    title.style.cssText = 'font-size:42px;letter-spacing:10px;margin-bottom:6px;';
    title.textContent = 'PAUSED';

    const btns = document.createElement('div');
    btns.style.cssText = 'display:flex;gap:12px;margin:10px 0 18px;';
    const resume = document.createElement('button');
    resume.className = 'hud-btn';
    resume.textContent = 'RESUME';
    resume.addEventListener('click', () => this.onResume?.());
    const restart = document.createElement('button');
    restart.className = 'hud-btn';
    restart.textContent = 'RESTART';
    restart.addEventListener('click', () => location.reload());
    btns.append(resume, restart);

    const list = document.createElement('div');
    list.style.cssText = 'font-size:12px;opacity:0.75;line-height:1.9;text-align:center;';
    list.innerHTML =
      'Move: WASD / Left stick &nbsp;&nbsp; Aim: Mouse / Right stick<br>' +
      'Shoot: LMB / B &nbsp;&nbsp; Pass: RMB or J / X &nbsp;&nbsp; Lob: K / Y &nbsp;&nbsp; Through: Space / A<br>' +
      'Sprint: Shift / RT &nbsp;&nbsp; Finesse: Ctrl / LT &nbsp;&nbsp; Skill: E / RB &nbsp;&nbsp; Switch: Q / LB<br>' +
      'Camera: Arrows / D-pad &nbsp;&nbsp; Pause: Esc / Start';

    p.append(title, btns, list);
    this.root.append(p);
    this._pause = p;
  }

  _buildGamepadUI() {
    // transient banner
    this._pad = this._panel('top:12px;right:12px;padding:8px 14px;font-size:13px;opacity:0;transition:opacity 0.3s;max-width:340px;');
    this._padTimer = 0;

    // dismissible mapping cheat sheet
    const sheet = document.createElement('div');
    sheet.className = 'hud-sheet';
    sheet.style.display = 'none';
    const head = document.createElement('div');
    head.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;';
    const htitle = document.createElement('div');
    htitle.style.cssText = 'font-size:12px;letter-spacing:2px;opacity:0.8;';
    htitle.textContent = 'CONTROLLER MAPPING';
    const close = document.createElement('button');
    close.className = 'hud-btn hud-sheet-close';
    close.textContent = '✕';
    close.addEventListener('click', () => { sheet.style.display = 'none'; this._sheetTimer = 0; });
    head.append(htitle, close);
    const grid = document.createElement('div');
    grid.className = 'hud-sheet-grid';
    for (const [btn, action] of PAD_MAP) {
      const b = document.createElement('span');
      b.className = 'hud-padbtn';
      b.textContent = btn;
      const a = document.createElement('span');
      a.style.opacity = '0.85';
      a.textContent = action;
      grid.append(b, a);
    }
    sheet.append(head, grid);
    this.root.append(sheet);
    this._sheet = sheet;
    this._sheetTimer = 0;
  }

  // ---------------------------------------------------------------------------
  // Per-frame refresh
  // ---------------------------------------------------------------------------

  /**
   * @param {number} dt render-frame delta
   * @param {{match: import('../core/MatchManager.js').MatchManager,
   *          teams: {home: import('../entities/Team.js').Team, away: import('../entities/Team.js').Team},
   *          ball: import('../world/Ball.js').Ball}} deps
   */
  update(dt, { match, teams, ball }) {
    // ---- scoreboard (write only on change; avoids layout thrash) ----
    const s = match.score;
    const homeLabel = teams.home.shortName ?? teams.home.name;
    const awayLabel = teams.away.shortName ?? teams.away.name;
    const scoreStr = `${homeLabel}|${s.home}|${s.away}|${awayLabel}`;
    if (scoreStr !== this._lastScoreStr) {
      this._lastScoreStr = scoreStr;
      this._nameHome.textContent = homeLabel;
      this._nameAway.textContent = awayLabel;
      this._scoreText.textContent = `${s.home} — ${s.away}`;
      this._chipHome.style.background = this._css(teams.home.color);
      this._chipAway.style.background = this._css(teams.away.color);
    }
    const total = Math.max(0, Math.floor(match.clock));
    const clockStr = `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}|${match.half}`;
    if (clockStr !== this._lastClockStr) {
      this._lastClockStr = clockStr;
      this._clock.textContent = clockStr.split('|')[0];
      this._half.textContent = match.half === 1 ? '1H' : '2H';
    }

    // ---- stamina of human-controlled players ----
    this._refreshStamina(this._stamHome, teams.home.controlled, 'P1');
    if (this._twoPlayer) {
      this._refreshStamina(this._stamAway, teams.away.controlled, 'P2');
    }

    // ---- power meter follows the player currently charging ----
    if (this._power01 > 0) {
      this._placePowerMeter(this._powerPlayer || teams.home.controlled);
    }

    // ---- fade timers ----
    if (this._goalTimer > 0) {
      this._goalTimer -= dt;
      if (this._goalTimer <= 0) this._goal.style.display = 'none';
    }
    if (this._padTimer > 0) {
      this._padTimer -= dt;
      if (this._padTimer <= 0) this._pad.style.opacity = '0';
    }
    if (this._sheetTimer > 0) {
      this._sheetTimer -= dt;
      if (this._sheetTimer <= 0) this._sheet.style.display = 'none';
    }

    this.updateMinimap(dt, { match, teams, ball });
  }

  // ---------------------------------------------------------------------------
  // Stamina / two-player
  // ---------------------------------------------------------------------------

  /** Show/hide the P2 stamina bar (called from main when pad 2 joins/leaves). */
  setTwoPlayer(on) {
    this._twoPlayer = !!on;
    this._stamAway.root.style.display = this._twoPlayer ? 'block' : 'none';
  }

  _refreshStamina(ui, cp, prefix) {
    const pct = cp ? Math.round((cp.stamina / CFG.PLAYER.STAMINA_MAX) * 100) : 100;
    const label = cp
      ? `${prefix} — ${cp.displayName ? `${cp.displayName} ` : ''}#${cp.number}`
      : `${prefix} STAMINA`;
    if (pct !== ui.pct || label !== ui.label.textContent) {
      ui.pct = pct;
      ui.bar.style.width = `${pct}%`;
      ui.bar.style.background = pct > 55 ? '#7bd88a' : pct > 25 ? '#e2b93b' : '#e06c5a';
      ui.label.textContent = label;
    }
  }

  // ---------------------------------------------------------------------------
  // Power meter
  // ---------------------------------------------------------------------------

  _setPower(power01) {
    this._power01 = power01 > 0 ? Math.min(1, power01) : 0;
    if (this._power01 > 0) {
      this._power.style.display = 'block';
      this._powerFill.style.height = `${Math.round(this._power01 * 100)}%`;
      this._powerFill.style.background =
        this._power01 < 0.5 ? '#7bd88a' : this._power01 < 0.8 ? '#e2b93b' : '#e06c5a';
    } else {
      this._power.style.display = 'none';
      this._powerPlayer = null;
    }
  }

  /** Project the meter next to the controlled player (fallback: bottom center). */
  _placePowerMeter(cp) {
    const rig = window.__STRIKER__?.cameraRig;
    if (rig && cp) {
      rig.toScreen(cp.position, this._scr);
      if (Number.isFinite(this._scr.x) && this._scr.visible !== false) {
        this._power.style.left = `${this._scr.x + 22}px`;
        this._power.style.top = `${this._scr.y - 96}px`;
        this._power.style.bottom = 'auto';
        this._power.style.transform = 'none';
        return;
      }
    }
    // fallback: fixed bottom-center slot
    this._power.style.left = '50%';
    this._power.style.top = 'auto';
    this._power.style.bottom = '70px';
    this._power.style.transform = 'translateX(-50%)';
  }

  // ---------------------------------------------------------------------------
  // Minimap
  // ---------------------------------------------------------------------------

  _renderMinimapStatic() {
    const ctx = this._mapStatic.getContext('2d');
    const P = CFG.PITCH;
    const m = 6;
    const s = Math.min((this._mapW - m * 2) / P.LENGTH, (this._mapH - m * 2) / P.WIDTH);
    const pw = P.LENGTH * s, ph = P.WIDTH * s;
    const ox = (this._mapW - pw) / 2, oy = (this._mapH - ph) / 2;
    this._mapXfm = { s, ox, oy };

    ctx.fillStyle = 'rgba(38,74,40,0.9)';
    ctx.fillRect(ox, oy, pw, ph);
    ctx.strokeStyle = 'rgba(240,240,235,0.75)';
    ctx.lineWidth = 1;
    ctx.strokeRect(ox + 0.5, oy + 0.5, pw - 1, ph - 1);
    // halfway + center circle
    ctx.beginPath(); ctx.moveTo(ox + pw / 2, oy); ctx.lineTo(ox + pw / 2, oy + ph); ctx.stroke();
    ctx.beginPath(); ctx.arc(ox + pw / 2, oy + ph / 2, P.CENTER_CIRCLE_R * s, 0, Math.PI * 2); ctx.stroke();
    // boxes
    for (const dir of [-1, 1]) {
      const gx = ox + pw / 2 + dir * pw / 2;
      const bw = P.BOX_DEPTH * s, bh = P.BOX_W * s;
      ctx.strokeRect(Math.min(gx, gx - dir * bw), oy + (ph - bh) / 2, bw, bh);
      const gw = P.GOALAREA_DEPTH * s, gh = P.GOALAREA_W * s;
      ctx.strokeRect(Math.min(gx, gx - dir * gw), oy + (ph - gh) / 2, gw, gh);
    }
  }

  /** Real minimap: team dots, ball dot, controlled-player ring. */
  updateMinimap(dt, { teams, ball }) {
    const ctx = this._mapCtx;
    const { s, ox, oy } = this._mapXfm;
    ctx.clearRect(0, 0, this._mapW, this._mapH);
    ctx.drawImage(this._mapStatic, 0, 0);

    const px = (wx) => ox + (wx + CFG.PITCH.LENGTH / 2) * s;
    const pz = (wz) => oy + (wz + CFG.PITCH.WIDTH / 2) * s;

    for (const side of ['home', 'away']) {
      const team = teams[side];
      if (!team) continue;
      ctx.fillStyle = this._css(team.color);
      for (const p of team.players) {
        ctx.beginPath();
        ctx.arc(px(p.position.x), pz(p.position.z), 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // human-controlled player rings (P1 gold, P2 cyan)
    const rings = [
      [teams.home?.controlled, '#fff176'],
      [teams.away?.controlled, '#7ec8ff'],
    ];
    for (const [cp, color] of rings) {
      if (!cp) continue;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(px(cp.position.x), pz(cp.position.z), 4.4, 0, Math.PI * 2);
      ctx.stroke();
    }
    // ball
    ctx.fillStyle = '#f5f5f0';
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(px(ball.position.x), pz(ball.position.z), 2.8, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  }

  // ---------------------------------------------------------------------------
  // Overlays / contract API
  // ---------------------------------------------------------------------------

  /** Big animated GOAL! overlay (auto-hides with the celebration). */
  showGoal(teamName) {
    this._goalSub.textContent = teamName || '';
    this._goal.style.display = 'flex';
    // retrigger the CSS animation
    this._goalText.classList.remove('hud-goal-anim');
    void this._goalText.offsetWidth;
    this._goalText.classList.add('hud-goal-anim');
    this._goalTimer = Math.max(1, CFG.MATCH.CELEBRATION_SECS - 0.5);
  }

  /** Transient center toast (OFFSIDE / FOUL — FREE KICK / HALF TIME / ...). */
  showToast(text) {
    const now = performance.now() / 1000;
    // dedupe: the same call can arrive via an event AND a direct hud call
    if (text === this._lastToast.text && now - this._lastToast.t < 1.2) return;
    this._lastToast = { text, t: now };

    while (this._toasts.children.length >= 3) this._toasts.firstChild.remove();
    const el = document.createElement('div');
    el.className = 'hud-toast';
    el.textContent = text;
    this._toasts.append(el);
    setTimeout(() => { el.classList.add('hud-toast-out'); }, 2200);
    setTimeout(() => { el.remove(); }, 2600);
  }

  /** Pause menu on/off. */
  showPause(on) { this._pause.style.display = on ? 'flex' : 'none'; }

  /**
   * Gamepad connect/disconnect banner (+ mapping cheat sheet on connect).
   * @param {boolean} connected
   * @param {string} name
   * @param {0|1} [slot]  0 = P1 Argentina, 1 = P2 Spain
   */
  showGamepad(connected, name, slot = 0) {
    const who = slot === 1 ? 'P2 (Spain)' : 'P1 (Argentina)';
    this._pad.textContent = connected
      ? `${who} controller connected: ${name}`
      : `${who} controller disconnected: ${name}`;
    this._pad.style.opacity = '1';
    this._padTimer = connected ? 5 : 4;
    if (connected) {
      this._sheet.style.display = 'block';
      this._sheetTimer = 16; // auto-tuck away; the ✕ button dismisses sooner
    } else if (slot === 0) {
      this._sheet.style.display = 'none';
      this._sheetTimer = 0;
    }
  }

  /** #rrggbb from a numeric THREE color. */
  _css(color) { return `#${(color >>> 0).toString(16).padStart(6, '0').slice(-6)}`; }
}

export default HUD;
