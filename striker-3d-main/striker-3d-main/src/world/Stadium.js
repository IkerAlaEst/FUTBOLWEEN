/**
 * Stadium.js — POLISH (SPEC §2.11).
 *
 * Builds the whole matchday environment (main.js adds NO lights — the scene
 * lighting contract lives here, kept from the tested core stub and re-tuned
 * toward a warm dusk):
 *   - gradient sky dome (BackSide sphere): soft warm dusk, low saturation,
 *     deliberately NO blue-purple gradient;
 *   - key directional light (the ONLY shadow caster over the pitch) +
 *     hemisphere/ambient fills;
 *   - tiered stand blocks on all four sides (all structure merged into
 *     2 draw calls: concrete + roofs);
 *   - instanced crowd: ONE InstancedMesh of ~5.4k low-poly spectators
 *     (muted varied per-instance colors) with a gentle GPU bob driven by a
 *     shared time uniform (zero per-frame CPU), plus a goal-wave surge on
 *     the 'goal' event;
 *   - 4 floodlight towers (merged pylons + merged emissive lamp clusters);
 *     2 towers carry real SpotLights with shadows, the other 2 are fake
 *     (emissive lamps only) per SPEC §2.11;
 *   - ad-board ring: 4 merged emissive strips with procedural canvas text
 *     (ARGENTINA vs SPAIN / COPA FINAL fixture branding), slowly scrolling.
 *
 * Main-pass draw calls added: sky 1, apron 1, stands 2, crowd 1, towers 1,
 * lamps 1, ad-boards 1 = 8. Crowd never casts/receives shadows.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CFG } from '../config.js';
import { events } from '../core/events.js';

// stand geometry constants (metres)
const TIER_TREAD = 2.3;   // depth of one terrace step
const TIER_RISER = 0.85;  // height of one terrace step
const STAND_BASE = 0.6;   // front wall height
const SEAT_GAP = 0.6;     // metres between spectators along a row
const OCCUPANCY = 0.82;   // fraction of seats filled

export class Stadium {
  constructor(scene) {
    this.scene = scene;
    this._uTime = { value: 0 };
    this._uAmp = { value: 1 };   // crowd bob amplitude (surges on goals)
    this._wave = 0;

    this._buildSky(scene);
    this._buildLights(scene);
    this._buildApron(scene);
    const seatSlots = this._buildStands(scene);
    this._buildCrowd(scene, seatSlots);
    this._buildFloodlights(scene);
    this._buildAdBoards(scene);

    // goal-wave: crowd surges for a few seconds after every goal
    events.on('goal', () => { this._wave = 3; });

    // single self-driven ticker: advances the crowd time uniform, wave decay
    // and the ad-board scroll (visual only; main.js has no stadium hook)
    let last = performance.now();
    const tick = (now) => {
      this._raf = requestAnimationFrame(tick);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      this._uTime.value += dt;
      if (this._wave > 0) this._wave = Math.max(0, this._wave - dt * 0.9);
      this._uAmp.value = 1 + this._wave;
      if (this._adTexture) this._adTexture.offset.x = (now * 0.00002) % 1;
    };
    this._raf = requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------------------------
  // Sky dome: warm dusk gradient (canvas) on a big BackSide sphere
  // ---------------------------------------------------------------------------
  _buildSky(scene) {
    const cv = document.createElement('canvas');
    cv.width = 4; cv.height = 256;
    const ctx = cv.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0.0, '#6d6f6a');   // warm-grey zenith (no blue-purple!)
    grad.addColorStop(0.32, '#8d8478');  // dusty mid
    grad.addColorStop(0.56, '#b89d7c');  // soft amber
    grad.addColorStop(0.76, '#e0bc8c');  // horizon glow
    grad.addColorStop(0.87, '#e9ca9d');  // pale gold band
    grad.addColorStop(1.0, '#3f4238');   // below-horizon ground haze
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 4, 256);
    const skyTex = new THREE.CanvasTexture(cv);
    skyTex.colorSpace = THREE.SRGBColorSpace;
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(380, 32, 16),
      new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false })
    );
    sky.renderOrder = -10;
    scene.add(sky);
    this.sky = sky;
  }

  // ---------------------------------------------------------------------------
  // Lighting (contract: this file owns ALL scene lights)
  // ---------------------------------------------------------------------------
  _buildLights(scene) {
    // key light (the ONLY pitch shadow caster, per SPEC §4)
    const key = new THREE.DirectionalLight(0xffedd4, 2.5);
    key.position.set(55, 85, 35);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    const S = Math.max(CFG.PITCH.LENGTH, CFG.PITCH.WIDTH) * 0.75;
    key.shadow.camera.left = -S; key.shadow.camera.right = S;
    key.shadow.camera.top = S; key.shadow.camera.bottom = -S;
    key.shadow.camera.near = 10; key.shadow.camera.far = 260;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    scene.add(key);
    scene.add(key.target);
    this.keyLight = key;

    // dusk fills: warm sky bounce over deep-green ground bounce
    scene.add(new THREE.HemisphereLight(0xcdbd9f, 0x33502f, 0.8));
    scene.add(new THREE.AmbientLight(0xffffff, 0.16));
  }

  // ---------------------------------------------------------------------------
  // Apron: huge dark disc under everything so the world never ends
  // ---------------------------------------------------------------------------
  _buildApron(scene) {
    const apron = new THREE.Mesh(
      new THREE.CircleGeometry(360, 40),
      new THREE.MeshStandardMaterial({ color: 0x2c4a2e, roughness: 1 })
    );
    apron.rotation.x = -Math.PI / 2;
    apron.position.y = -0.08;
    apron.receiveShadow = true;
    scene.add(apron);
  }

  // ---------------------------------------------------------------------------
  // Stands: 4 tiered blocks, all concrete merged (1 call), roofs merged (1 call).
  // Returns the flat list of seat slots {x, y, z, yaw} for the crowd builder.
  // ---------------------------------------------------------------------------
  _buildStands(scene) {
    const halfL = CFG.PITCH.LENGTH / 2, halfW = CFG.PITCH.WIDTH / 2;
    const concrete = [], roofs = [];
    const slots = [];

    // one parametric stand: `along` = 'x'|'z' build axis, sign = which side
    const buildStand = (along, sign, length, tiers) => {
      const base = (along === 'x' ? halfW : halfL) + 7.5; // first tread offset from line
      const depth = tiers * TIER_TREAD;
      const mk = (w, h, d, cx, cy, cz, arr) => {
        const g = new THREE.BoxGeometry(w, h, d);
        g.translate(cx, cy, cz);
        arr.push(g);
      };
      const span = (w, h, d, alongOff, y, outOff, arr) => {
        // place a box on this stand: alongOff = along the terrace, outOff = outward
        if (along === 'x') mk(w, h, d, alongOff, y, sign * (base + outOff), arr);
        else mk(d, h, w, sign * (base + outOff), y, alongOff, arr);
      };

      // front wall
      span(length, STAND_BASE, 0.3, 0, STAND_BASE / 2, 0.15, concrete);
      // tier slabs (solid from the ground: cheap + no gaps)
      for (let i = 0; i < tiers; i++) {
        const topY = STAND_BASE + (i + 1) * TIER_RISER;
        span(length, topY, TIER_TREAD, 0, topY / 2, i * TIER_TREAD + TIER_TREAD / 2 + 0.3, concrete);
      }
      // rear wall + roof slab
      const topTierY = STAND_BASE + tiers * TIER_RISER;
      span(length, 3.0, 0.5, 0, topTierY + 1.5, depth + 0.5, concrete);
      span(length + 2, 0.25, depth + 3.5, 0, topTierY + 3.1, depth / 2, roofs);

      // seat slots: 2 rows per tier
      for (let i = 0; i < tiers; i++) {
        const treadY = STAND_BASE + (i + 1) * TIER_RISER;
        for (let row = 0; row < 2; row++) {
          const out = i * TIER_TREAD + 0.75 + row * 0.9;
          const n = Math.floor((length - 1.2) / SEAT_GAP);
          for (let k = 0; k < n; k++) {
            const a = -((n - 1) / 2) * SEAT_GAP + k * SEAT_GAP;
            const jx = (Math.random() - 0.5) * 0.22;
            const jy = (Math.random() - 0.5) * 0.22;
            if (along === 'x') slots.push({ x: a + jx, y: treadY, z: sign * (base + out) + jy, yaw: sign > 0 ? Math.PI : 0 });
            else slots.push({ x: sign * (base + out) + jy, y: treadY, z: a + jx, yaw: sign > 0 ? -Math.PI / 2 : Math.PI / 2 });
          }
        }
      }
    };

    buildStand('x', +1, CFG.PITCH.LENGTH + 24, 5); // far side (camera side too)
    buildStand('x', -1, CFG.PITCH.LENGTH + 24, 5);
    buildStand('z', +1, CFG.PITCH.WIDTH + 16, 4);  // behind +x goal
    buildStand('z', -1, CFG.PITCH.WIDTH + 16, 4);  // behind -x goal

    const conc = new THREE.Mesh(
      mergeGeometries(concrete),
      new THREE.MeshStandardMaterial({ color: 0x5c5f60, roughness: 0.95, metalness: 0.02 })
    );
    const roof = new THREE.Mesh(
      mergeGeometries(roofs),
      new THREE.MeshStandardMaterial({ color: 0x3f4448, roughness: 0.9, metalness: 0.1 })
    );
    scene.add(conc, roof);
    return slots;
  }

  // ---------------------------------------------------------------------------
  // Crowd: one InstancedMesh; per-instance color; GPU bob via shared uniforms
  // ---------------------------------------------------------------------------
  _buildCrowd(scene, slots) {
    // one spectator: body + head merged, origin at the feet
    const body = new THREE.BoxGeometry(0.38, 0.82, 0.28);
    body.translate(0, 0.41, 0);
    const head = new THREE.BoxGeometry(0.24, 0.24, 0.24);
    head.translate(0, 0.95, 0);
    const geo = mergeGeometries([body, head]);

    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const uTime = this._uTime, uAmp = this._uAmp;
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uTime;
      shader.uniforms.uAmp = uAmp;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uAmp;')
        .replace('#include <begin_vertex>',
          `#include <begin_vertex>
          #ifdef USE_INSTANCING
            float sph = instanceMatrix[3].x * 12.9898 + instanceMatrix[3].z * 78.233;
            float sphRnd = fract(sin(sph) * 43758.5453);
            transformed.y += uAmp * 0.05 * (0.35 + 0.65 * sphRnd) * sin(uTime * 2.3 + sph);
          #endif`);
    };

    const count = slots.length;
    const crowd = new THREE.InstancedMesh(geo, mat, count);
    crowd.castShadow = false;
    crowd.receiveShadow = false;
    crowd.frustumCulled = false; // spans the whole stadium; culling math not worth it

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    const c = new THREE.Color();
    let placed = 0;
    for (let i = 0; i < count; i++) {
      const slot = slots[i];
      if (Math.random() > OCCUPANCY) { // empty seat: park the instance underground
        m.makeTranslation(0, -50 - i * 0.001, 0);
        crowd.setMatrixAt(i, m);
        continue;
      }
      e.set(0, slot.yaw + (Math.random() - 0.5) * 0.6, 0);
      q.setFromEuler(e);
      const sc = 0.92 + Math.random() * 0.2;
      s.set(sc, 0.9 + Math.random() * 0.25, sc);
      p.set(slot.x, slot.y - 0.15, slot.z); // shins tucked into the terrace front
      m.compose(p, q, s);
      crowd.setMatrixAt(i, m);
      // muted palette with fixture-color accents: Argentina sky blue/white,
      // Spain red — reads as travelling fans in the stands
      const r = Math.random();
      if (r < 0.1) c.setHSL(0.56, 0.45, 0.62);        // albiceleste sky blue
      else if (r < 0.15) c.setHSL(0, 0, 0.85);        // white accent
      else if (r < 0.22) c.setHSL(0.99, 0.55, 0.35);  // Spain red
      else c.setHSL(Math.random(), 0.08 + Math.random() * 0.22, 0.28 + Math.random() * 0.32);
      crowd.setColorAt(i, c);
      placed++;
    }
    crowd.instanceMatrix.needsUpdate = true;
    if (crowd.instanceColor) crowd.instanceColor.needsUpdate = true;
    this.crowdCount = placed; // exposed for smoke tests (SPEC §4: >= ~4000)
    scene.add(crowd);
    this.crowd = crowd;
  }

  // ---------------------------------------------------------------------------
  // Floodlights: 4 merged towers + merged emissive lamp grids; 2 real SpotLights
  // ---------------------------------------------------------------------------
  _buildFloodlights(scene) {
    const halfL = CFG.PITCH.LENGTH / 2, halfW = CFG.PITCH.WIDTH / 2;
    const towerGeos = [], lampGeos = [];
    const positions = [
      [halfL + 15.5, halfW + 14], [halfL + 15.5, -(halfW + 14)],
      [-(halfL + 15.5), halfW + 14], [-(halfL + 15.5), -(halfW + 14)],
    ];
    const H = 17;
    const tmp = new THREE.Object3D();

    for (const [tx, tz] of positions) {
      // pylon (slightly tapered) + crosshead, composed via a scratch Object3D
      const pylon = new THREE.CylinderGeometry(0.2, 0.4, H, 8);
      pylon.translate(tx, H / 2, tz);
      towerGeos.push(pylon);

      tmp.position.set(tx, H + 0.6, tz);
      tmp.rotation.set(0, Math.atan2(-tx, -tz), 0); // yaw the head toward pitch center
      tmp.updateMatrix();
      const headBox = new THREE.BoxGeometry(3.0, 1.5, 0.5);
      headBox.applyMatrix4(tmp.matrix);
      towerGeos.push(headBox);

      // 3x2 emissive lamps on the pitch-facing side of the head
      for (let lx = -1; lx <= 1; lx++) {
        for (let ly = 0; ly < 2; ly++) {
          const lamp = new THREE.BoxGeometry(0.55, 0.45, 0.1);
          lamp.translate(lx * 0.9, -0.35 + ly * 0.7, 0.3);
          lamp.applyMatrix4(tmp.matrix);
          lampGeos.push(lamp);
        }
      }
    }

    const towers = new THREE.Mesh(
      mergeGeometries(towerGeos),
      new THREE.MeshStandardMaterial({ color: 0x46494d, roughness: 0.7, metalness: 0.35 })
    );
    scene.add(towers);

    const lamps = new THREE.Mesh(
      mergeGeometries(lampGeos),
      new THREE.MeshBasicMaterial({ color: 0xfff2cf }) // lit look, no light cost
    );
    scene.add(lamps);

    // 2 REAL spotlights with shadows (diagonal pair); the other 2 towers stay fake
    for (const [tx, tz] of [[positions[0][0], positions[0][1]], [positions[3][0], positions[3][1]]]) {
      const spot = new THREE.SpotLight(0xffe9c4, 6500, 260, 0.5, 0.6, 2);
      spot.position.set(tx, H + 0.4, tz);
      spot.target.position.set(0, 0, 0);
      spot.castShadow = true;
      spot.shadow.mapSize.set(512, 512);
      spot.shadow.camera.near = 20;
      spot.shadow.camera.far = 220;
      spot.shadow.bias = -0.0004;
      scene.add(spot, spot.target);
    }
  }

  // ---------------------------------------------------------------------------
  // Ad-board ring: 4 merged emissive strips, procedural fixture canvas text
  // ---------------------------------------------------------------------------
  _buildAdBoards(scene) {
    const halfL = CFG.PITCH.LENGTH / 2, halfW = CFG.PITCH.WIDTH / 2;
    const tex = this._makeAdTexture();
    this._adTexture = tex;

    const geos = [];
    const mkBoard = (len, cx, cz, rotY) => {
      const g = new THREE.PlaneGeometry(len, 0.95);
      const uv = g.attributes.uv; // one texture tile per ~14m of board
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * len / 14, uv.getY(i));
      g.rotateY(rotY);
      g.translate(cx, 0.5, cz);
      geos.push(g);
    };
    // behind each goal (outside the nets) + along each touchline
    mkBoard(CFG.PITCH.WIDTH, halfL + 3.7, 0, -Math.PI / 2);
    mkBoard(CFG.PITCH.WIDTH, -(halfL + 3.7), 0, Math.PI / 2);
    mkBoard(CFG.PITCH.LENGTH - 1, 0, halfW + 2.2, Math.PI);
    mkBoard(CFG.PITCH.LENGTH - 1, 0, -(halfW + 2.2), 0);

    const boards = new THREE.Mesh(
      mergeGeometries(geos),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })
    );
    scene.add(boards);
  }

  _makeAdTexture() {
    const cv = document.createElement('canvas');
    cv.width = 1024; cv.height = 96;
    const ctx = cv.getContext('2d');
    // dark slate strip with a warm baseline accent
    ctx.fillStyle = '#141a20';
    ctx.fillRect(0, 0, 1024, 96);
    ctx.fillStyle = '#b8893b';
    ctx.fillRect(0, 88, 1024, 8);
    ctx.font = '700 44px "Consolas", "Roboto Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // fixture branding: ARGENTINA vs SPAIN alternating with COPA FINAL
    for (let i = 0; i < 2; i++) {
      const cx = 256 + i * 512;
      if (i % 2 === 0) {
        ctx.fillStyle = '#8ec4e8';
        ctx.fillText('ARGENTINA', cx - 118, 44);
        ctx.fillStyle = '#b8893b';
        ctx.font = '700 30px "Consolas", "Roboto Mono", monospace';
        ctx.fillText('vs', cx + 12, 46);
        ctx.font = '700 44px "Consolas", "Roboto Mono", monospace';
        ctx.fillStyle = '#e05a5a';
        ctx.fillText('SPAIN', cx + 118, 44);
      } else {
        ctx.fillStyle = '#e8e2d2';
        ctx.fillText('COPA FINAL', cx, 44);
      }
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }
}

export default Stadium;
