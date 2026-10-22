/**
 * Team.js — squad creation, formation coords, player switching (SPEC §2.6).
 *
 * AI-MATCH IMPLEMENTATION (replaces the core stub; public API unchanged):
 *   players (players[0] is GK), formation (Vector3[] kickoff homes),
 *   resetToFormation(), closestToBall(ballPos, exclude?), setControlled(player),
 *   controlled, autoSwitch(ballPos), plus additive side/opponent/attachBall/gk.
 *
 * Squad: 7v7 per SPEC §3 — GK + 2 DF + 3 MF + 1 FW in a 4-4-2-derived shape,
 * written for attacking = +1 (own goal at -x) and mirrored by `attacking`
 * (a team's own goal sits at -attacking * LENGTH/2).
 *
 * autoSwitch(ballPos) scores every candidate as:
 *   score = -distance                       (closest wins by default)
 *           + 3.0 * closing-speed-cosine    (prefer players moving toward it)
 *           + small upfield bonus           (prefer players ahead of play)
 *           + hysteresis for current holder (prevents control flapping)
 * The GK is never auto-selected UNLESS the ball is inside our own penalty box
 * (desperate hoof/claim situation); a manual setControlled(gk) always works.
 *
 * swapSides() mirrors the whole team for the second half (halftime side swap):
 * attacking flips sign and every formation/player home is mirrored in x.
 */
import * as THREE from 'three';
import { CFG } from '../config.js';
import { events } from '../core/events.js';
import { Player } from './Player.js';

// role + default shirt number + home as fractions of pitch (x: of LENGTH,
// z: of WIDTH), written for attacking = +1 (own goal at -x). Mirrored by
// multiplying x. A team config `squad` array (see entities/teams.js) overrides
// num and adds a display name per slot, index-matched (GK first, FW last).
const SQUAD = [
  { role: 'GK', num: 1, x: -0.46, z: 0.0 },
  { role: 'DF', num: 2, x: -0.27, z: -0.16 },
  { role: 'DF', num: 3, x: -0.27, z: 0.16 },
  { role: 'MF', num: 4, x: -0.11, z: -0.22 },
  { role: 'MF', num: 5, x: -0.14, z: 0.0 },
  { role: 'MF', num: 6, x: -0.11, z: 0.22 },
  { role: 'FW', num: 7, x: -0.025, z: 0.0 }, // kickoff taker, just off the center spot
];

// module temp
const _toBall = new THREE.Vector3();

export class Team {
  /**
   * @param {THREE.Scene} scene
   * @param {{name:string, color:number, colorAlt?:number, attacking:1|-1,
   *          side?:'home'|'away', shortName?:string, squad?:Array,
   *          shortsColor?:number, socksColor?:number, gkColor?:number,
   *          gkShortsColor?:number, kitStyle?:string}} opts
   */
  constructor(scene, { name, color, colorAlt, attacking, side = 'home', shortName,
                       squad, shortsColor, socksColor, gkColor, gkShortsColor, kitStyle }) {
    this.name = name;
    this.shortName = shortName ?? name;
    this.color = color;
    this.colorAlt = colorAlt ?? new THREE.Color(color).multiplyScalar(0.55).getHex();
    // kit fields read by PlayerModel.applyKit (all optional, sane fallbacks there)
    this.shortsColor = shortsColor;
    this.socksColor = socksColor;
    this.gkColor = gkColor;
    this.gkShortsColor = gkShortsColor;
    this.kitStyle = kitStyle ?? 'solid';
    this.attacking = attacking >= 0 ? 1 : -1;
    this.side = side;
    /** @type {Team|null} */
    this.opponent = null;

    const L = CFG.PITCH.LENGTH, W = CFG.PITCH.WIDTH;
    /** @type {Player[]} */
    this.players = [];
    /** @type {THREE.Vector3[]} kickoff homes, mirrored by attacking */
    this.formation = [];

    for (let i = 0; i < SQUAD.length; i++) {
      const s = SQUAD[i];
      const info = squad?.[i] ?? {};
      const home = new THREE.Vector3(s.x * this.attacking * L, 0, s.z * W);
      this.formation.push(home);
      this.players.push(new Player(scene, {
        team: this, number: info.num ?? s.num, role: s.role, home, name: info.name ?? null,
      }));
    }

    /** @type {Player|null} user-controlled player (highlight ring) */
    this.controlled = null;
  }

  /** Wire the ball so Player.hasBall works (called once by main.js). */
  attachBall(ball) {
    for (const p of this.players) p.ball = ball;
  }

  /** GK convenience accessor (players[0] per contract). */
  get gk() { return this.players[0]; }

  /** x of the goal line this team DEFENDS. */
  get ownGoalX() { return -this.attacking * CFG.PITCH.LENGTH / 2; }

  /** x of the goal line this team ATTACKS. */
  get attackGoalX() { return this.attacking * CFG.PITCH.LENGTH / 2; }

  /** Teleport everyone back to kickoff homes and stop them. */
  resetToFormation() {
    for (let i = 0; i < this.players.length; i++) {
      this.players[i].resetTo(this.formation[i]);
    }
  }

  /**
   * Halftime side swap: flip attacking direction and mirror every home
   * (formation slot + Player.home) in x. Positions are NOT changed here —
   * MatchManager calls resetToFormation() afterwards.
   */
  swapSides() {
    this.attacking = -this.attacking;
    for (let i = 0; i < this.formation.length; i++) {
      this.formation[i].x = -this.formation[i].x;
      this.players[i].home.x = -this.players[i].home.x;
    }
  }

  /**
   * Nearest player to a position.
   * @param {THREE.Vector3} ballPos
   * @param {Player|Player[]|null} [exclude] player(s) to skip
   */
  closestToBall(ballPos, exclude = null) {
    let best = null, bestD2 = Infinity;
    for (const p of this.players) {
      if (exclude && (p === exclude || (Array.isArray(exclude) && exclude.includes(p)))) continue;
      const d2 = p.position.distanceToSquared(ballPos);
      if (d2 < bestD2) { bestD2 = d2; best = p; }
    }
    return best;
  }

  /** Mark `player` as user-controlled (highlight ring + event). */
  setControlled(player) {
    if (!player || this.controlled === player) return;
    if (this.controlled) {
      this.controlled.controlled = false;
      this.controlled.setHighlight(false);
    }
    this.controlled = player;
    player.controlled = true;
    player.setHighlight(true);
    events.emit('controlledPlayerChanged', { player, team: this });
  }

  /** Release human control so AI drives the whole squad (P2 disconnect). */
  clearControlled() {
    if (!this.controlled) return;
    this.controlled.controlled = false;
    this.controlled.setHighlight(false);
    this.controlled = null;
    events.emit('controlledPlayerChanged', { player: null, team: this });
  }

  /**
   * Pick the best switch candidate for a loose/looming ball: closest player
   * that is moving toward it / ahead of play. Never picks the GK unless the
   * ball is inside our own penalty box. Emits 'controlledPlayerChanged'
   * via setControlled.
   * @param {THREE.Vector3} ballPos
   */
  autoSwitch(ballPos) {
    const cur = this.controlled;
    const inOwnBox = this._inOwnBox(ballPos);

    let best = null, bestScore = -Infinity;
    let curScore = -Infinity;
    for (const p of this.players) {
      if (p === this.gk && !inOwnBox) continue; // GK only when ball in our box
      const d = p.position.distanceTo(ballPos);

      // closing cosine: is the player moving toward the ball right now?
      let closing = 0;
      const sp = Math.hypot(p.velocity.x, p.velocity.z);
      if (sp > 0.5 && d > 0.2) {
        _toBall.set(ballPos.x - p.position.x, 0, ballPos.z - p.position.z).divideScalar(d);
        closing = (p.velocity.x * _toBall.x + p.velocity.z * _toBall.z) / sp; // -1..1
      }
      // ahead of play: small bonus for being upfield of the ball (passing option)
      const ahead = (p.position.x - ballPos.x) * this.attacking * 0.04;

      const score = -d + closing * 3 + ahead;
      if (p === cur) curScore = score + 1.5; // hysteresis: stick unless clearly beaten
      if (score > bestScore) { bestScore = score; best = p; }
    }

    if (!best || best === cur) return;
    if (cur && cur !== this.gk && bestScore < curScore) return;
    this.setControlled(best);
  }

  /** True when `pos` is inside this team's own penalty box (roughly). */
  _inOwnBox(pos) {
    const gx = this.ownGoalX;
    const intoPitch = (pos.x - gx) * this.attacking; // >0 toward midfield
    return intoPitch >= -1 && intoPitch <= CFG.PITCH.BOX_DEPTH &&
           Math.abs(pos.z) <= CFG.PITCH.BOX_W / 2;
  }
}

export default Team;
