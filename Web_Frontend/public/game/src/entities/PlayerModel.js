/**
 * PlayerModel.js — shared GLB player template + per-team kit materials.
 *
 * Loads assets/player.glb (Quaternius CC0 rigged man, see
 * assets/LICENSE-quaternius.txt) ONCE and exposes it for Player.js to clone
 * per player via SkeletonUtils.clone. main.js awaits loadPlayerModel() before
 * building teams; if the load fails Player.js falls back to the procedural
 * capsule build, so the game always runs.
 *
 * Model facts (verified):
 *   - skinned mesh, 9 material slots by NAME (no UVs — no texture maps):
 *     Shirt/Shirt2 (jersey), Pants (shorts), Shoes, Socks, and
 *     Skin/Hair/Hair2/Eyes which are left untinted;
 *   - armature carries a 100x scale — the template is measured after load
 *     (skinned bounding box) and `fit` normalizes height to CFG.PLAYER.HEIGHT
 *     with feet on y=0;
 *   - faces +Z after load, matching Player's yaw convention
 *     (mesh.rotation.y = atan2(facing.x, facing.z) points local +Z along facing);
 *   - clips are exported as 'HumanArmature|Man_*' — exposed in `clips` with the
 *     prefix stripped (Idle, Walk, Run, Punch, Jump, Clapping, ...).
 *
 * Kit tinting: applyKit(root, team, role) swaps jersey/shorts/socks/shoes
 * materials by slot name with cached per-(team, GK) sets. Argentina's
 * kitStyle 'stripes' uses an onBeforeCompile patch that draws crisp vertical
 * stripes from the bind-pose x coordinate (the model has no UVs, so a canvas
 * texture map is not an option).
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { CFG } from '../config.js';

let _template = null;

const _box = new THREE.Box3();
const _meshBox = new THREE.Box3();

/** Load the GLB once. Resolves the shared template (or throws on failure). */
export async function loadPlayerModel() {
  if (_template) return _template;
  const gltf = await new GLTFLoader().loadAsync('assets/player.glb');

  const clips = {};
  for (const clip of gltf.animations) {
    clips[clip.name.replace(/^HumanArmature\|Man_/, '')] = clip;
  }

  // Measure the skinned bind pose so clones can be normalized to
  // CFG.PLAYER.HEIGHT with feet at y=0 (armature ships with a 100x scale).
  gltf.scene.updateMatrixWorld(true);
  _box.makeEmpty();
  gltf.scene.traverse((o) => {
    if (o.isSkinnedMesh && typeof o.computeBoundingBox === 'function') {
      o.computeBoundingBox();
      _meshBox.copy(o.boundingBox).applyMatrix4(o.matrixWorld);
      _box.union(_meshBox);
    }
  });
  let scale = 1, minY = 0;
  if (!_box.isEmpty()) {
    const h = _box.max.y - _box.min.y;
    if (h > 1e-4) scale = CFG.PLAYER.HEIGHT / h;
    minY = _box.min.y;
  }

  _template = { scene: gltf.scene, animations: gltf.animations, clips, fit: { scale, minY } };
  return _template;
}

/** Synchronous access for Player.js (null until loadPlayerModel resolves). */
export function getPlayerModel() { return _template; }

/**
 * Clone the template for one player: normalized scale, feet on y=0.
 * @returns {THREE.Object3D}
 */
export function clonePlayerRig() {
  const t = _template;
  const rig = SkeletonUtils.clone(t.scene);
  rig.scale.multiplyScalar(t.fit.scale);
  rig.position.y = -t.fit.minY * t.fit.scale;
  return rig;
}

// ---------------------------------------------------------------------------
// Kit materials
// ---------------------------------------------------------------------------

/** @type {Map<string, Object<string, THREE.Material>>} per (team, GK) sets */
const _kitCache = new Map();

function solidMat(color, roughness = 0.85) {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

/**
 * Jersey with crisp vertical stripes computed from the bind-pose x coordinate
 * (stable under skinning; the mesh has no UVs so `map` cannot be used).
 */
function stripedMat(primary, alt) {
  const mat = new THREE.MeshStandardMaterial({ color: primary, roughness: 0.85 });
  const uStripeColor = { value: new THREE.Color(alt) };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uStripeColor = uStripeColor;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vKitX;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvKitX = position.x;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vKitX;\nuniform vec3 uStripeColor;')
      .replace('#include <color_fragment>',
        '#include <color_fragment>\n' +
        // ~5 stripe pairs across the bind-pose torso (raw half-width ~0.012)
        'diffuseColor.rgb = mix(diffuseColor.rgb, uStripeColor, step(0.5, fract(vKitX * 210.0)));');
  };
  mat.customProgramCacheKey = () => 'kit-stripes';
  return mat;
}

function darken(color, f) {
  return new THREE.Color(color).multiplyScalar(f).getHex();
}

function kitMaterialsFor(team, isGK) {
  const key = `${team.name}|${isGK ? 'gk' : 'field'}`;
  let set = _kitCache.get(key);
  if (set) return set;

  if (isGK) {
    const gk = team.gkColor ?? darken(team.color, 0.4);
    set = {
      Shirt: solidMat(gk),
      Shirt2: solidMat(darken(gk, 0.8)),
      Pants: solidMat(team.gkShortsColor ?? darken(gk, 0.6), 0.9),
      Socks: solidMat(darken(gk, 0.7), 0.9),
      Shoes: solidMat(0x222222, 0.7),
    };
  } else {
    const striped = team.kitStyle === 'stripes';
    const jersey = striped
      ? stripedMat(team.color, team.colorAlt ?? 0xffffff)
      : solidMat(team.color);
    set = {
      Shirt: jersey,
      Shirt2: striped ? jersey : solidMat(darken(team.color, 0.82)),
      Pants: solidMat(team.shortsColor ?? team.colorAlt ?? darken(team.color, 0.5), 0.9),
      Socks: solidMat(team.socksColor ?? team.color, 0.9),
      Shoes: solidMat(0x222222, 0.7),
    };
  }
  _kitCache.set(key, set);
  return set;
}

/**
 * Swap kit materials (by slot name) on a cloned rig and enable shadows.
 * Skin/Hair/Hair2/Eyes keep the template's natural materials.
 */
export function applyKit(root, team, role) {
  const mats = kitMaterialsFor(team, role === 'GK');
  const swap = (m) => mats[m.name] ?? m;
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.material = Array.isArray(o.material) ? o.material.map(swap) : swap(o.material);
  });
}

export default { loadPlayerModel, getPlayerModel, clonePlayerRig, applyKit };
