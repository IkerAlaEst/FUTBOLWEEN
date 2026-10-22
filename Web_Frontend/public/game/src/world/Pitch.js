/**
 * Pitch.js — POLISH (SPEC §2.11).
 *
 * Full presentation pitch built on the untouched core gameplay contract:
 *   - ground plane sized to CFG.PITCH + apron, with a 2048px canvas texture:
 *     alternating mown stripes (light/dark bands across the width), subtle
 *     organic blotches + per-pixel grain so it never looks flat, regulation
 *     markings in correct proportion (touchlines, halfway line, center circle
 *     r=9.15 + spot, penalty boxes 16.5m, goal areas 5.5m, penalty spots 11m
 *     + arcs, corner arcs), and a soft vignette darkening the apron;
 *   - goals at ±x: white post/crossbar cylinders (+ back stanchions) merged
 *     into one mesh per goal; collider data exposed in the EXACT `goals`
 *     structure the core Ball consumes (`goals.home` at -x, `dir` points
 *     from the goal line INTO the net — convention kept);
 *   - nets: semi-transparent canvas-mesh (back + sides + roof merged into ONE
 *     geometry per goal) with a cheap per-vertex spring wobble — pulseNet(side,
 *     strength?) injects velocity, update(dt) advances/decays the springs;
 *   - corner flags (merged, 2 draw calls total);
 *   - rules geometry kept from core: inGoal(pos) -> 'home'|'away'|null
 *     (the side whose goal was scored in), outInfo(pos, lastTouchSide) ->
 *     null|{kind, team}, netRegion(pos) -> 'home'|'away'|null. ONE deliberate
 *     fix inside outInfo: a ball already over the goal line INSIDE the mouth
 *     is a pending goal, never a corner/goal-kick (see CORE RACE FIX below).
 *
 * Draw calls added by this file: ground 1 + goal frames 2 + nets 2 + flags 2
 * = 7 (core Ball reads colliders from `goals`, never from meshes).
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CFG } from '../config.js';

// Net spring tuning (visual only — no gameplay effect).
const NET_SPRING_K = 90;    // spring stiffness (1/s²)
const NET_SPRING_C = 8;     // damping (1/s)
const NET_MAX_PUSH = 0.85;  // metres the net may billow into the goal
const NET_CELL = 0.35;      // net rope-grid cell size in metres (UV density)

export class Pitch {
  constructor(scene) {
    const P = CFG.PITCH;
    this.scene = scene;
    const halfL = P.LENGTH / 2, halfW = P.WIDTH / 2;

    // ------------------------------------------------------------------ ground
    const marginX = 6, marginZ = 5;
    const tex = this._makeTexture(marginX, marginZ);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(P.LENGTH + marginX * 2, P.WIDTH + marginZ * 2),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.94, metalness: 0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    this.ground = ground;

    // -------------------------------------------------- shared net rope texture
    this._netTexture = this._makeNetTexture();

    // ------------------------------------------------------------------- goals
    this.goals = {};
    this._nets = {};
    for (const side of ['home', 'away']) {
      const dir = side === 'home' ? -1 : 1;
      const line = dir * halfL;
      this._buildGoalFrame(scene, side, line, dir);
      this._buildNet(scene, side, line, dir);

      // SPEC §2.11 collider data consumed by Ball._collidePosts() — EXACT shape.
      this.goals[side] = {
        line,                 // x of the goal line
        dir,                  // direction from the line INTO the net
        posts: [
          { type: 'post', x: line, z: -P.GOAL_W / 2, r: P.POST_R, y0: 0, y1: P.GOAL_H },
          { type: 'post', x: line, z: P.GOAL_W / 2, r: P.POST_R, y0: 0, y1: P.GOAL_H },
          { type: 'bar', x: line, y: P.GOAL_H, z0: -P.GOAL_W / 2, z1: P.GOAL_W / 2, r: P.POST_R },
        ],
      };
    }

    this._buildCornerFlags(scene, halfL, halfW);
  }

  // ---------------------------------------------------------------------------
  // Rules geometry (contract — semantics identical to the tested core stub)
  // ---------------------------------------------------------------------------

  /** 'home'|'away' when the WHOLE ball is over the line between posts, else null. */
  inGoal(pos) {
    const P = CFG.PITCH, R = CFG.BALL.RADIUS;
    if (Math.abs(pos.z) > P.GOAL_W / 2 || pos.y > P.GOAL_H) return null;
    if (pos.x < -P.LENGTH / 2 - R * 0.5) return 'home';
    if (pos.x > P.LENGTH / 2 + R * 0.5) return 'away';
    return null;
  }

  /**
   * null when in play, else {kind:'throwin'|'corner'|'goalkick', team} where
   * team is the SIDE STRING ('home'|'away') awarded the restart.
   * @param {THREE.Vector3} pos
   * @param {'home'|'away'|null} [lastTouchSide] for corner/goal-kick attribution
   */
  outInfo(pos, lastTouchSide = null) {
    const P = CFG.PITCH;
    if (this.inGoal(pos)) return null; // that's a goal, not an exit
    const overX = Math.abs(pos.x) > P.LENGTH / 2;
    const overZ = Math.abs(pos.z) > P.WIDTH / 2;
    // CORE RACE FIX: the ball can be past the goal line but not yet "fully
    // over" (inGoal needs an extra half-radius). In that one-step window the
    // core stub awarded a corner/goal-kick, eating ~2/3 of hard shots before
    // MatchManager could score them. A ball over the line INSIDE the goal
    // mouth is always a pending goal -> never an exit. (Outside the mouth the
    // corner/goal-kick semantics are byte-identical to core.)
    if (overX && !overZ && Math.abs(pos.z) <= P.GOAL_W / 2 && pos.y <= P.GOAL_H) return null;
    if (!overX && !overZ) return null;

    if (overZ && !overX) {
      // touchline: possession goes to the team that did NOT touch it last
      return { kind: 'throwin', team: lastTouchSide === 'home' ? 'away' : 'home' };
    }
    // goal line (outside the goal mouth)
    const crossedHomeLine = pos.x < 0;
    const defender = crossedHomeLine ? 'home' : 'away';
    const attacker = crossedHomeLine ? 'away' : 'home';
    return lastTouchSide === defender
      ? { kind: 'corner', team: attacker }
      : { kind: 'goalkick', team: defender };
  }

  /**
   * Ball-net region helper for Ball: 'home'|'away' when the ball is inside a
   * net box (fully past the line, between the posts, under the bar).
   */
  netRegion(pos) {
    const P = CFG.PITCH, R = CFG.BALL.RADIUS;
    if (Math.abs(pos.z) > P.GOAL_W / 2 || pos.y > P.GOAL_H + 0.2) return null;
    if (pos.x < -P.LENGTH / 2 - R && pos.x > -P.LENGTH / 2 - P.GOAL_DEPTH - 0.5) return 'home';
    if (pos.x > P.LENGTH / 2 + R && pos.x < P.LENGTH / 2 + P.GOAL_DEPTH + 0.5) return 'away';
    return null;
  }

  // ---------------------------------------------------------------------------
  // Net wobble (per-vertex springs along the goal's `dir` axis)
  // ---------------------------------------------------------------------------

  /**
   * Kick the net on ball contact. `strength` scales the impulse (Ball calls
   * pulseNet(side) with no strength — treated as a full hit).
   */
  pulseNet(side, strength = 1) {
    const st = this._nets[side];
    if (!st) return;
    const s = Math.max(0.1, Math.min(2, strength));
    for (let i = 0; i < st.vel.length; i++) {
      st.vel[i] += 4.4 * s * st.weight[i] * st.jitter[i];
    }
    st.active = true;
    // brief visibility flash so the contact reads at broadcast distance
    st.flash = Math.min(0.3, 0.12 * s + 0.08);
  }

  /** Advance net spring physics (main.js calls this every render frame). */
  update(dt) {
    for (const side of ['home', 'away']) {
      const st = this._nets[side];
      if (!st || !st.active) continue;
      const pos = st.mesh.geometry.attributes.position;
      const arr = pos.array, base = st.base, off = st.offset, vel = st.vel;
      let energy = 0;
      for (let i = 0; i < off.length; i++) {
        // damped spring toward the rest shape
        vel[i] += (-NET_SPRING_K * off[i] - NET_SPRING_C * vel[i]) * dt;
        off[i] += vel[i] * dt;
        if (off[i] > NET_MAX_PUSH) { off[i] = NET_MAX_PUSH; vel[i] = 0; }
        else if (off[i] < -0.25) { off[i] = -0.25; vel[i] = 0; }
        const e = Math.abs(off[i]) + Math.abs(vel[i]) * 0.1;
        if (e > energy) energy = e;
        // displacement runs along the goal's into-net axis (+ slight settle sag)
        arr[i * 3] = base[i * 3] + st.dir * off[i];
        arr[i * 3 + 1] = base[i * 3 + 1] - Math.abs(off[i]) * 0.12 * st.weight[i];
      }
      pos.needsUpdate = true;
      if (st.flash > 0) {
        st.flash = Math.max(0, st.flash - dt * 0.6);
        st.mesh.material.opacity = st.baseOpacity + st.flash;
      }
      if (energy < 0.002 && st.flash <= 0) { // sleep: stop touching the buffer
        st.active = false;
        st.mesh.material.opacity = st.baseOpacity;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Goal frame: posts + crossbar + back stanchions, merged into one mesh
  // ---------------------------------------------------------------------------
  _buildGoalFrame(scene, side, line, dir) {
    const P = CFG.PITCH;
    const parts = [];

    for (const zs of [-1, 1]) {
      const post = new THREE.CylinderGeometry(P.POST_R, P.POST_R, P.GOAL_H + P.POST_R * 2, 12);
      post.translate(line, P.GOAL_H / 2, zs * P.GOAL_W / 2);
      parts.push(post);
    }
    const bar = new THREE.CylinderGeometry(P.POST_R, P.POST_R, P.GOAL_W + P.POST_R * 2, 12);
    bar.rotateX(Math.PI / 2); // cylinder axis -> z
    bar.translate(line, P.GOAL_H, 0);
    parts.push(bar);

    // sloped back stanchions (bar ends -> ground behind the net)
    const v = new THREE.Vector3(dir * P.GOAL_DEPTH, -P.GOAL_H, 0);
    const len = v.length();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize());
    for (const zs of [-1, 1]) {
      const s = new THREE.CylinderGeometry(0.035, 0.035, len, 8);
      s.applyQuaternion(q);
      s.translate(line + dir * P.GOAL_DEPTH / 2, P.GOAL_H / 2, zs * P.GOAL_W / 2);
      parts.push(s);
    }

    const frame = new THREE.Mesh(
      mergeGeometries(parts),
      new THREE.MeshStandardMaterial({ color: 0xf4f4f2, roughness: 0.35, metalness: 0.05 })
    );
    frame.castShadow = true;
    scene.add(frame);
  }

  // ---------------------------------------------------------------------------
  // Net: back + roof + two sides merged into ONE mesh with spring-wobble data
  // ---------------------------------------------------------------------------
  _buildNet(scene, side, line, dir) {
    const P = CFG.PITCH;
    const geos = [];
    const scaleUV = (g, wM, hM) => { // one texture tile per NET_CELL metres
      const uv = g.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * wM / NET_CELL, uv.getY(i) * hM / NET_CELL);
    };

    const back = new THREE.PlaneGeometry(P.GOAL_W, P.GOAL_H, 12, 6);
    scaleUV(back, P.GOAL_W, P.GOAL_H);
    back.rotateY(Math.PI / 2);
    back.translate(line + dir * P.GOAL_DEPTH, P.GOAL_H / 2, 0);
    geos.push(back);

    const roof = new THREE.PlaneGeometry(P.GOAL_DEPTH, P.GOAL_W, 4, 10);
    scaleUV(roof, P.GOAL_DEPTH, P.GOAL_W);
    roof.rotateX(-Math.PI / 2);
    roof.translate(line + dir * P.GOAL_DEPTH / 2, P.GOAL_H, 0);
    geos.push(roof);

    for (const zs of [-1, 1]) {
      const sideNet = new THREE.PlaneGeometry(P.GOAL_DEPTH, P.GOAL_H, 4, 6);
      scaleUV(sideNet, P.GOAL_DEPTH, P.GOAL_H);
      sideNet.translate(line + dir * P.GOAL_DEPTH / 2, P.GOAL_H / 2, zs * P.GOAL_W / 2);
      geos.push(sideNet);
    }

    const geo = mergeGeometries(geos);
    const baseOpacity = 0.55;
    const mat = new THREE.MeshBasicMaterial({
      map: this._netTexture, color: 0xe8e8e4, transparent: true, opacity: baseOpacity,
      side: THREE.DoubleSide, depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    // per-vertex spring state; mouth vertices (x == line) stay anchored
    const n = geo.attributes.position.count;
    const arr = geo.attributes.position.array;
    const weight = new Float32Array(n);
    const jitter = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const behind = (arr[i * 3] - line) * dir; // metres behind the goal line
      weight[i] = Math.max(0, Math.min(1, behind / P.GOAL_DEPTH));
      const h = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      jitter[i] = 0.72 + 0.55 * (h - Math.floor(h)); // deterministic per-vertex variety
    }
    this._nets[side] = {
      mesh, dir,
      base: new Float32Array(arr),       // rest pose
      offset: new Float32Array(n),       // spring displacement along `dir`
      vel: new Float32Array(n),
      weight, jitter,
      active: false, flash: 0, baseOpacity,
    };
  }

  // ---------------------------------------------------------------------------
  // Corner flags: 4 poles merged (1 call) + 4 pennants merged (1 call)
  // ---------------------------------------------------------------------------
  _buildCornerFlags(scene, halfL, halfW) {
    const poleGeos = [], flagGeos = [];
    for (const xs of [-1, 1]) {
      for (const zs of [-1, 1]) {
        const pole = new THREE.CylinderGeometry(0.02, 0.02, 1.5, 6);
        pole.translate(xs * halfL, 0.75, zs * halfW);
        poleGeos.push(pole);
        const flag = new THREE.PlaneGeometry(0.42, 0.26);
        // pennant streams toward -z/+z alternately so pairs look natural
        flag.rotateY(zs > 0 ? Math.PI : 0);
        flag.translate(xs * halfL + 0.21 * (zs > 0 ? -1 : 1), 1.36, zs * halfW);
        flagGeos.push(flag);
      }
    }
    const poles = new THREE.Mesh(
      mergeGeometries(poleGeos),
      new THREE.MeshStandardMaterial({ color: 0xe8c93c, roughness: 0.6 })
    );
    const flags = new THREE.Mesh(
      mergeGeometries(flagGeos),
      new THREE.MeshStandardMaterial({ color: 0xc8552e, roughness: 0.8, side: THREE.DoubleSide })
    );
    scene.add(poles, flags);
  }

  // ---------------------------------------------------------------------------
  // Net rope texture: tiny transparent tile with a pale grid (repeat-wrapped)
  // ---------------------------------------------------------------------------
  _makeNetTexture() {
    const cv = document.createElement('canvas');
    cv.width = 16; cv.height = 16;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, 16, 16);
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(0.8, 0.8, 14.4, 14.4);
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // ---------------------------------------------------------------------------
  // Pitch texture (2048px): mown stripes + grain + regulation markings + vignette
  // ---------------------------------------------------------------------------
  _makeTexture(marginX, marginZ) {
    const P = CFG.PITCH;
    const W = 2048;
    const H = Math.round(W * (P.WIDTH + marginZ * 2) / (P.LENGTH + marginX * 2));
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    const sx = W / (P.LENGTH + marginX * 2);   // px per metre (x)
    const sz = H / (P.WIDTH + marginZ * 2);    // == sx (proportional canvas)
    const ox = marginX * sx, oz = marginZ * sz; // pitch-corner offset in px

    // ---- alternating mown stripes: horizontal bands (constant-z rows) ----
    const bands = 16;
    for (let i = 0; i < bands; i++) {
      const y0 = Math.floor((i / bands) * H);
      const y1 = Math.ceil(((i + 1) / bands) * H);
      // subtle per-band mow-direction sheen (lighter toward one touchline)
      const g = ctx.createLinearGradient(0, y0, W, y0);
      if (i % 2) { g.addColorStop(0, '#4e9a51'); g.addColorStop(1, '#51a055'); }
      else { g.addColorStop(0, '#448c47'); g.addColorStop(1, '#47934b'); }
      ctx.fillStyle = g;
      ctx.fillRect(0, y0, W, y1 - y0);
    }

    // ---- organic blotches so large areas don't read flat ----
    for (let i = 0; i < 60; i++) {
      const bx = Math.random() * W, by = Math.random() * H;
      const br = 40 + Math.random() * 170;
      const dark = Math.random() < 0.55;
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
      g.addColorStop(0, dark ? 'rgba(20,40,20,0.045)' : 'rgba(235,255,225,0.03)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(bx - br, by - br, br * 2, br * 2);
    }

    // ---- per-pixel grain (one-time cost, kills the "flat CG" look) ----
    const img = ctx.getImageData(0, 0, W, H);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 9;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);

    // ---- regulation markings (all dimensions from CFG.PITCH) ----
    ctx.strokeStyle = 'rgba(250,250,248,0.92)';
    ctx.fillStyle = 'rgba(250,250,248,0.92)';
    ctx.lineWidth = Math.max(3, P.LINE_W * sx);
    const X = (m) => ox + (m + P.LENGTH / 2) * sx;   // metres -> px (x: -L/2..L/2)
    const Z = (m) => oz + (m + P.WIDTH / 2) * sz;    // metres -> px (z: -W/2..W/2)
    const spot = (mx, mz) => {
      ctx.beginPath(); ctx.arc(X(mx), Z(mz), Math.max(3, 0.14 * sx), 0, Math.PI * 2); ctx.fill();
    };

    // boundary + halfway line
    ctx.strokeRect(X(-P.LENGTH / 2), Z(-P.WIDTH / 2), P.LENGTH * sx, P.WIDTH * sz);
    ctx.beginPath(); ctx.moveTo(X(0), Z(-P.WIDTH / 2)); ctx.lineTo(X(0), Z(P.WIDTH / 2)); ctx.stroke();

    // center circle + spot
    ctx.beginPath(); ctx.arc(X(0), Z(0), P.CENTER_CIRCLE_R * sx, 0, Math.PI * 2); ctx.stroke();
    spot(0, 0);

    // penalty-arc half-angle: where the 9.15m circle meets the box edge
    const arcA = Math.acos(Math.min(1, (P.BOX_DEPTH - P.PEN_SPOT) / P.CENTER_CIRCLE_R));

    for (const dir of [-1, 1]) {
      const gx = dir * P.LENGTH / 2; // goal line x
      // penalty box (16.5m x 40.32m)
      ctx.strokeRect(X(Math.min(gx, gx - dir * P.BOX_DEPTH)), Z(-P.BOX_W / 2), P.BOX_DEPTH * sx, P.BOX_W * sz);
      // goal area (5.5m x 18.32m)
      ctx.strokeRect(X(Math.min(gx, gx - dir * P.GOALAREA_DEPTH)), Z(-P.GOALAREA_W / 2), P.GOALAREA_DEPTH * sx, P.GOALAREA_W * sz);
      // penalty spot (11m) + arc bulging into the field
      const px = gx - dir * P.PEN_SPOT;
      spot(px, 0);
      ctx.beginPath();
      ctx.arc(X(px), Z(0), P.CENTER_CIRCLE_R * sx,
        dir > 0 ? Math.PI - arcA : -arcA,
        dir > 0 ? Math.PI + arcA : arcA);
      ctx.stroke();
      // corner quarter-arcs (r = 1m)
      for (const zSign of [-1, 1]) {
        const a0 = dir > 0
          ? (zSign > 0 ? Math.PI : Math.PI / 2)
          : (zSign > 0 ? -Math.PI / 2 : 0);
        ctx.beginPath();
        ctx.arc(X(gx), Z(zSign * P.WIDTH / 2), 1 * sx, a0, a0 + Math.PI / 2);
        ctx.stroke();
      }
    }

    // ---- vignette: darken the apron beyond the painted boundary ----
    const vA = 0.26, vC = 'rgba(14,26,16,';
    const px0 = X(-P.LENGTH / 2), px1 = X(P.LENGTH / 2);
    const pz0 = Z(-P.WIDTH / 2), pz1 = Z(P.WIDTH / 2);
    let g;
    g = ctx.createLinearGradient(0, 0, px0, 0);            // left apron
    g.addColorStop(0, vC + vA + ')'); g.addColorStop(1, vC + '0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, px0, H);
    g = ctx.createLinearGradient(W, 0, px1, 0);            // right apron
    g.addColorStop(0, vC + vA + ')'); g.addColorStop(1, vC + '0)');
    ctx.fillStyle = g; ctx.fillRect(px1, 0, W - px1, H);
    g = ctx.createLinearGradient(0, 0, 0, pz0);            // near apron
    g.addColorStop(0, vC + vA + ')'); g.addColorStop(1, vC + '0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, pz0);
    g = ctx.createLinearGradient(0, H, 0, pz1);            // far apron
    g.addColorStop(0, vC + vA + ')'); g.addColorStop(1, vC + '0)');
    ctx.fillStyle = g; ctx.fillRect(0, pz1, W, H - pz1);

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }
}

export default Pitch;
