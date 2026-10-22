/**
 * main.js — bootstrap + game loop (SPEC §2.14).
 *
 * - renderer: WebGLRenderer antialias, PCFSoft shadow map, sRGB output;
 * - scene/camera + all modules; ARGENTINA (home, user team) attacks +x,
 *   SPAIN (away) attacks -x — fixture data in entities/teams.js;
 * - the shared GLB player template is awaited (top-level) BEFORE teams are
 *   built; on load failure Player.js falls back to procedural visuals;
 * - controlled player starts as the home FW (nearest the kickoff spot);
 * - local 2P: pad 0 (+ keyboard) drives home, pad 1 drives away; second pad
 *   connect/disconnect toggles Spain human control vs full AI;
 * - fixed timestep: STEP = 1/120, max 5 steps per frame (spiral guard);
 *   input.update() runs once per rAF — that call IS both the render-frame
 *   poll and the "start of each fixed-step batch" poll (calling it again
 *   inside the batch would eat edge-triggered presses);
 * - fixed-step order (SPEC): controllers -> AI -> ball -> matchManager;
 *   camera/HUD update on the render frame;
 * - rumble: events 'rumble' -> input.vibrate; 'goal' -> CFG.INPUT.RUMBLE_GOAL
 *   (tackle/collision rumble is emitted by PlayerController/Ball directly);
 * - pause: input.onPausePressed -> matchManager.pause()/resume() + hud.showPause;
 * - camera modes via P1 dpad (up=broadcast, right=behind, down=tactical);
 * - window resize handler; boot splash removal after first frame.
 */
import * as THREE from 'three';
import { CFG } from './config.js';
import { events } from './core/events.js';
import { CameraRig } from './core/CameraRig.js';
import { MatchManager } from './core/MatchManager.js';
import { InputManager } from './input/InputManager.js';
import { Pitch } from './world/Pitch.js';
import { Stadium } from './world/Stadium.js';
import { Ball } from './world/Ball.js';
import { Team } from './entities/Team.js';
import { ARGENTINA, SPAIN } from './entities/teams.js';
import { loadPlayerModel } from './entities/PlayerModel.js';
import { PlayerController } from './entities/PlayerController.js';
import { AIController } from './entities/AIController.js';
import { HUD } from './ui/HUD.js';
import { AudioManager } from './audio/AudioManager.js';

// ---------------------------------------------------------------------------
// Renderer / scene / camera
// ---------------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.getElementById('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x9db8cf, 180, 420);

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 600);

// ---------------------------------------------------------------------------
// Modules
// ---------------------------------------------------------------------------
const stadium = new Stadium(scene);
const pitch = new Pitch(scene);
const ball = new Ball(scene);

// GLB player template must be ready before Player constructors run (the boot
// splash stays up until the first rendered frame). Failure => capsule fallback.
await loadPlayerModel().catch((e) => console.warn('player.glb failed to load — using procedural players', e));

const home = new Team(scene, { ...ARGENTINA, attacking: +1 });
const away = new Team(scene, { ...SPAIN, attacking: -1 });
home.opponent = away;
away.opponent = home;
home.attachBall(ball);
away.attachBall(ball);
ball.pitch = pitch;
ball.players = [...home.players, ...away.players];

const input = new InputManager(renderer.domElement);
const cameraRig = new CameraRig(camera);
const hud = new HUD(document.getElementById('hud'));
const audio = new AudioManager(); // subscribes to sfx/goal itself; silent until a gesture
const playerController = new PlayerController(home, ball, input, cameraRig, { slot: 0 });
const awayController = new PlayerController(away, ball, input, cameraRig, { slot: 1 });
const aiHome = new AIController(home, ball, away);
const aiAway = new AIController(away, ball, home);
const matchManager = new MatchManager({ teams: { home, away }, ball, hud, pitch });

// controlled player starts as the home FW (last in the squad = nearest kickoff)
home.setControlled(home.players[home.players.length - 1]);

/** Enable/disable Spain human control when P2 pad connects/disconnects. */
function syncAwayHuman(enabled) {
  if (enabled) {
    if (!away.controlled) {
      away.setControlled(away.players[away.players.length - 1]);
    }
  } else {
    away.clearControlled();
  }
  hud.setTwoPlayer(enabled);
}

// ---------------------------------------------------------------------------
// Cross-module wiring (events + callbacks)
// ---------------------------------------------------------------------------

// mouse aim reference = P1 controlled player's screen position
const _screenRef = { x: innerWidth / 2, y: innerHeight / 2 };
input.aimRefProvider = () => {
  const p = home.controlled;
  if (!p) return _screenRef;
  return cameraRig.toScreen(p.position, _screenRef);
};

// 'behind' camera follows the home (P1) controlled player
events.on('controlledPlayerChanged', ({ player, team }) => {
  if (team === home && player) cameraRig.player = player;
});
cameraRig.player = home.controlled;

// rumble: event bus -> gamepad haptics; goal rumble per CFG
events.on('rumble', ({ strong, weak, ms }) => input.vibrate(strong, weak, ms));
events.on('goal', () => {
  const r = CFG.INPUT.RUMBLE_GOAL;
  events.emit('rumble', { strong: r[0], weak: r[1], ms: r[2] });
});

// brief AI freeze on every kickoff restart
events.on('kickoff', () => {
  aiHome.freeze(CFG.MATCH.KICKOFF_FREEZE);
  aiAway.freeze(CFG.MATCH.KICKOFF_FREEZE);
});

// gamepad connection banner + P2 join/leave
input.onGamepadChange = (connected, name, slot) => {
  hud.showGamepad(connected, name, slot);
  if (slot === 1) syncAwayHuman(connected);
};

// Pads already plugged in before listeners bound (gamepadconnected can fire early).
input.update();
for (let slot = 0; slot < 2; slot++) {
  if (!input.hasPad(slot)) continue;
  const name = input.padName(slot) || 'Gamepad';
  hud.showGamepad(true, name, slot);
  if (slot === 1) syncAwayHuman(true);
}

// pause toggle (Esc/Enter/Start edge) + pause-overlay Resume button
function togglePause() {
  if (matchManager.state === 'paused') matchManager.resume();
  else matchManager.pause();
  hud.showPause(matchManager.state === 'paused');
}
input.onPausePressed = togglePause;
hud.onResume = togglePause;

// keep HUD scoreboard names in sync if teams are ever renamed
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ---------------------------------------------------------------------------
// Game loop: fixed timestep physics, per-frame camera/HUD
// ---------------------------------------------------------------------------
const STEP = 1 / 120;
const MAX_STEPS = 5;
let acc = 0;
let last = performance.now();
let booted = false;

/** One fixed physics step (SPEC §2.14 update order). */
function step(dt) {
  playerController.update(dt);
  awayController.update(dt);
  aiHome.update(dt);
  aiAway.update(dt);
  ball.update(dt);
  matchManager.update(dt);
}

/** Player spread 0..1 across the pitch (drives broadcast zoom). */
let spread = 0.5;
function computeSpread() {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const p of ball.players) {
    if (p.position.x < minX) minX = p.position.x;
    if (p.position.x > maxX) maxX = p.position.x;
    if (p.position.z < minZ) minZ = p.position.z;
    if (p.position.z > maxZ) maxZ = p.position.z;
  }
  const sx = (maxX - minX) / CFG.PITCH.LENGTH;
  const sz = (maxZ - minZ) / CFG.PITCH.WIDTH;
  spread = Math.min(1, Math.max(sx, sz));
}

function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.25) dt = 0.25; // tab-switch clamp

  // Poll input once per rAF: covers the render frame AND the step batch.
  input.update();

  // camera modes from dpad edges (up=broadcast, right=behind, down=tactical)
  const S = input.state;
  if (S.dpad.up) cameraRig.setMode('broadcast');
  else if (S.dpad.right) cameraRig.setMode('behind');
  else if (S.dpad.down) cameraRig.setMode('tactical');

  if (matchManager.state !== 'paused') {
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < MAX_STEPS) {
      step(STEP);
      acc -= STEP;
      steps++;
    }
    if (steps === MAX_STEPS) acc = 0; // spiral-of-death guard

    // procedural animation is visual: advance on the render frame
    for (const p of ball.players) p.updateAnim(dt);
    pitch.update(dt); // net pulse decay
  }

  computeSpread();
  const halfL = CFG.PITCH.LENGTH / 2;
  const nearGoal = halfL - Math.abs(ball.position.x) < CFG.CAM.GOAL_ZOOM_RADIUS;
  cameraRig.update(dt, ball.position, spread, nearGoal);
  hud.update(dt, { match: matchManager, teams: { home, away }, ball });

  renderer.render(scene, camera);

  if (!booted) {
    booted = true;
    document.getElementById('boot-splash')?.remove();
  }
}

requestAnimationFrame(frame);

// Dev/debug handle (used by smoke tests; harmless in production).
window.__STRIKER__ = {
  scene, camera, renderer, ball, home, away, matchManager, input, cameraRig, hud, events,
  playerController, awayController, aiHome, aiAway, step,
};
