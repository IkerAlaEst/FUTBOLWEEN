# SPEC.md — "Striker 3D" Browser Soccer Game (Single Source of Truth)

## 0. Overview
Browser-based 3D soccer game (FIFA-style) with Three.js r160+, Xbox controller via Gamepad API + keyboard/mouse fallback. **No build tools.** Plain ES modules loaded via `<script type="module">` and an import map pointing to a pinned Three.js CDN. Must run by opening `index.html` over any static file server (and must also work when served by the version manager).

- Language: modern vanilla JS (ES2022), ES modules.
- Rendering: Three.js (WebGL). CDN: `https://unpkg.com/three@0.160.0/build/three.module.js` via import map `{ "three": "..." }`.
- No external art assets. All visuals are procedural (canvas textures, primitives, instancing). All audio is synthesized with WebAudio (no audio files).
- Target: 60fps on a mid laptop.

## 1. File Layout (exact)
```
project/
├── index.html                  # canvas container, HUD DOM root, import map, loads src/main.js
├── README.md                   # user docs: controls, Xbox mapping table, placeholder notes, tuning guide
├── src/
│   ├── main.js                 # bootstrap: renderer/scene, fixed-timestep loop, wires all modules
│   ├── config.js               # TUNING: every gameplay constant, with a big "TUNING GUIDE" comment block
│   ├── core/
│   │   ├── events.js           # tiny EventEmitter (on/off/emit)
│   │   ├── CameraRig.js        # broadcast camera + modes
│   │   └── MatchManager.js     # match state machine, score, clock, rules
│   ├── input/
│   │   └── InputManager.js     # GamepadManager + keyboard/mouse fallback, unified InputState
│   ├── world/
│   │   ├── Pitch.js            # pitch mesh, canvas texture (stripes + markings), goals, net wobble
│   │   ├── Stadium.js          # instanced stands/crowd, floodlights, sky
│   │   └── Ball.js             # BallPhysics: gravity, bounce, friction, drag, Magnus, collisions
│   ├── entities/
│   │   ├── Player.js           # visual capsule figure + procedural anim + movement physics
│   │   ├── PlayerController.js # user-controlled logic (uses InputState)
│   │   ├── AIController.js     # formation positioning + behavior FSM + GK AI
│   │   └── Team.js             # squad creation, formation coords, player switching
│   ├── ui/
│   │   └── HUD.js              # scoreboard, stamina, power meter, minimap, overlays, pause menu
│   └── audio/
│       └── AudioManager.js     # WebAudio-synth crowd loop, whistle, kicks, goal sting
```

## 2. Shared Contracts (sacred — implement exactly)

### 2.1 config.js
Exports `export const CFG = { ... }`. ALL gameplay constants live here, grouped:
```
PITCH { LENGTH:105, WIDTH:68, SCALE:1, GOAL_W:7.32, GOAL_H:2.44, ... }
BALL  { RADIUS:0.11*... (scaled up for visibility: use 0.22), GRAVITY:-22, RESTITUTION:0.55,
        ROLL_FRICTION:0.985, AIR_DRAG:0.12, MAGNUS:0.9, STOP_EPS:0.05 }
PLAYER{ RADIUS:0.45, HEIGHT:1.8, WALK:4.5, JOG:7.0, SPRINT_MULT:1.55, ACCEL:22, TURN_LERP:10,
        STAMINA_MAX:100, STAMINA_DRAIN:22, STAMINA_REGEN:14, KICK_RANGE:1.1, POSSESS_RADIUS:1.0 }
KICK  { PASS_MIN:8, PASS_MAX:22, SHOT_MIN:12, SHOT_MAX:32, LOB_MIN:10, LOB_MAX:24, CHARGE_TIME:0.9,
        LOB_HEIGHT:0.55, THROUGH_LEAD:1.6 }
AI    { REACTION:0.25, MARK_DIST:2.5, CHASE_RADIUS:14, SHOT_RANGE:28, SHOT_ANGLE:0.5,
        PASS_LANE_CHECK:6, GK_LINE_OFFSET:1.2, GK_DIVE_SPEED:12, TACKLE_RADIUS:1.2,
        TACKLE_SUCCESS:0.75, FOUL_DANGER_RADIUS:1.6 }
MATCH { HALF_MINUTES:5, MAX_SUB_MINI:... , OFFSIDE_ENABLED:true, CELEBRATION_SECS:4 }
CAM   { HEIGHT:26, DIST:32, LERP:3.2, ZOOM_MIN:0.75, ZOOM_MAX:1.25, GOAL_ZOOM_RADIUS:25 }
INPUT { DEADZONE:0.15, RUMBLE_GOAL:[1.0,1.0,600], RUMBLE_TACKLE:[0.6,0.6,200], RUMBLE_COLLIDE:[0.3,0.3,120] }
```
Exact values may be tuned by implementers, but keys above MUST exist (modules read from CFG only).

### 2.2 core/events.js
```js
export class Events {
  on(name, fn); off(name, fn); emit(name, payload);
}
export const events = new Events(); // singleton
```
Event names (string literals used across modules — emit/listen with exactly these):
`goal` {team}, `kickoff`, `outOfBounds` {kind:'throwin'|'corner'|'goalkick', team}, `foul` {team, pos},
`freekick` {team, pos}, `corner` {team}, `halfEnd` {half}, `matchEnd`, `stateChange` {state},
`rumble` {strong, weak, ms}, `sfx` {name:'kick'|'whistle'|'crowd_goal'|'crowd_ooh'|'tackle'},
`controlledPlayerChanged` {player}, `shotCharged` {power01} (HUD meter).

### 2.3 input/InputManager.js
```js
export class InputManager {
  constructor(domElement)         // listens for gamepadconnected/disconnected, keyboard, mouse
  update()                        // call EVERY frame (gamepads must be polled)
  get state() -> InputState
  usingGamepad: boolean           // auto-switches on first gamepad input / first key input
  onPausePressed: callback|null   // edge-triggered
  vibrate(strong, weak, ms)       // GamepadHapticActuator; no-op on keyboard
}
```
**InputState** (fresh object each frame, all values normalized):
```js
{
  move: {x, y},        // left stick / WASD; radial-normalized, deadzoned, magnitude 0..1 (analog walk/sprint)
  aim: {x, y},         // right stick / mouse-direction from player; for pass/shot aim + player-switch flicks
  sprint: bool,        // RT held OR A held OR Shift
  finesse: bool,       // LT held / Ctrl
  skill: bool,         // RB held / E  (skill-move modifier)
  pass:   {pressed, released, heldSecs},   // X / left-click secondary? -> keyboard: J or LMB quick
  lob:    {pressed, released, heldSecs},   // Y / K
  shoot:  {pressed, released, heldSecs},   // B / L or Space
  through:{pressed},   // A tap / I
  switchPlayer:{pressed}, // LB / Q
  dpad: {up,down,left,right},              // camera/tactics / arrow keys
  anyInput: bool
}
```
**Xbox mapping (standard mapping, document verbatim in README):**
- axes[0], axes[1] = left stick X/Y (Y inverted); axes[2], axes[3] = right stick X/Y
- buttons[0]=A, [1]=B, [2]=X, [3]=Y, [4]=LB, [5]=RB, [6]=LT(analog .value), [7]=RT(analog),
  [8]=Back/View, [9]=Start/Menu (pause), [12..15]=D-pad up/down/left/right
- Button semantics: A=sprint(held)+through-ball(tap), B=shoot(charge), X=pass(charge), Y=lob/cross,
  LB=switch player, RB=skill modifier, RT=sprint, LT=finesse, Start=pause, D-pad=camera modes.
Keyboard fallback (also in README): WASD move, mouse aim, LMB=shoot(hold to charge), RMB or J=pass,
K=lob, Space=through, Shift=sprint, Ctrl=finesse, E=skill, Q=switch, arrows=camera, Esc/Enter=pause.

### 2.4 entities/Player.js
```js
export class Player {
  constructor(scene, {team, number, role, home})  // role: 'GK'|'DF'|'MF'|'FW'; home: Vector3 kickoff pos
  mesh: THREE.Group           // procedural figure (head/torso/2 arms/2 legs), team colors
  position: THREE.Vector3     // == mesh.position (ground plane, y=0)
  velocity: THREE.Vector3
  team: Team; number; role; hasBall: bool (derived: ball.owner===this)
  stamina: 0..CFG.PLAYER.STAMINA_MAX
  controlled: bool            // shows highlight ring when true
  move(dir /*Vector2-ish*/, sprint, dt)   // accel/decel + slerp facing; drains stamina
  updateAnim(dt)              // procedural leg/arm swing by speed; FSM: idle|jog|sprint|dribble|kick|tackle
  playKickAnim(); playTackleAnim(); celebrate()
  setHighlight(on)
}
```

### 2.5 world/Ball.js (BallPhysics)
```js
export class Ball {
  constructor(scene)
  mesh; position; velocity; spin: THREE.Vector3   // spin for Magnus
  owner: Player|null                              // sticky possession
  update(dt)          // if owner: glue to owner's feet w/ small dribble offset; else integrate physics
  kick(dirVec3, power, {lob=0, spinVec=null}={})  // releases owner, sets velocity (+ spin -> Magnus)
  tryPossess(player)  // attach if close & slow; returns bool
  release()
  isMoving(): bool
}
```
Physics: gravity, ground bounce (RESTITUTION, y-vel flip), rolling friction, quadratic air drag,
Magnus `F = CFG.BALL.MAGNUS * (spin × v)`, collisions: goal posts/crossbar (cylinder reflect),
net (dampen + net wobble event `sfx`/net pulse), pitch boundaries -> emit `outOfBounds` via MatchManager
(Ball only reports crossing; MatchManager decides). Keep ball collision with players: soft push + possess attempt.

### 2.6 entities/Team.js
```js
export class Team {
  constructor(scene, {name, color, colorAlt, attacking}) // attacking: +1 attacks +x goal, -1 attacks -x
  players: Player[]     // 11, formation 4-4-2; players[0] is GK
  formation: Vector3[]  // kickoff homes, mirrored by `attacking`
  resetToFormation()
  closestToBall(ballPos, exclude?): Player
  setControlled(player)
  controlled: Player
  autoSwitch(ballPos)   // pick best candidate (closest + in front), emits controlledPlayerChanged
}
```

### 2.7 entities/PlayerController.js
```js
export class PlayerController {
  constructor(team, ball, input, cameraRig)
  update(dt)   // reads input.state; camera-relative movement; charging pass/shot (emit shotCharged);
               // executes pass/lob/shot/through on release w/ aim dir; skill moves on aim flick+skill
               // (step-over: burst+ball nudge; fake shot: cancel charge+stun AI nearby; sprint-dribble: big touch);
               // sliding tackle when defending (shoot btn without ball) w/ CFG.AI success/foul logic
}
```

### 2.8 entities/AIController.js
```js
export class AIController {
  constructor(team, ball, opponentTeam)
  update(dt)
  // Per-player FSM: SUPPORT | MARK | CHASE_BALL | DEFEND_POSITION | MAKE_RUN | GK
  // Weighted formation positioning: home shifts toward ball (attackers push up, line holds).
  // Possessor decisions: pass (lane check vs opponents within CFG.AI.PASS_LANE_CHECK of segment),
  // dribble toward goal, shoot if dist<SHOT_RANGE && angle ok. Uses ball.kick with CFG.KICK ranges.
  // GK: track ball along goal line (GK_LINE_OFFSET), dive at predicted shot crossing goal plane.
}
```

### 2.9 core/CameraRig.js
```js
export class CameraRig {
  constructor(camera)
  mode: 'broadcast'|'behind'|'tactical'   // toggled by dpad (up=broadcast, right=behind, down=tactical)
  update(dt, focus /*ball pos*/, spread /*0..1 player spread*/, nearGoal: bool)
  // broadcast: elevated side view w/ lerp lag; zoom scales w/ spread, zooms in nearGoal
  // behind: behind controlled player; tactical: high top-down
}
```

### 2.10 core/MatchManager.js
```js
export class MatchManager {
  constructor({teams, ball, hud, pitch})
  state: 'kickoff'|'inplay'|'out'|'goal'|'freekick'|'corner'|'halftime'|'fulltime'|'paused'
  score: {home, away}; clock: seconds elapsed; half: 1|2
  update(dt)          // clock, state transitions, out-of-bounds (throw-in=nearest opponent gets ball at
                      // touchline spot; corner/goal-kick placement), simplified offside on pass
                      // (attacker beyond 2nd-last defender & beyond halfway at pass moment -> freekick other way),
                      // fouls (from tackle events) -> freekick placement w/ wall line-up,
                      // goal detection (ball fully crosses goal line between posts) -> 'goal' state,
                      // celebration pause CFG.MATCH.CELEBRATION_SECS, then kickoff reset
  pause()/resume(); restart()
  // emits: goal, stateChange, halfEnd, matchEnd, freekick, corner, sfx whistle etc.
}
```

### 2.11 world/Pitch.js + Stadium.js
```js
export class Pitch {
  constructor(scene)
  // ground plane with canvas texture: mown stripes (alternating bands) + regulation markings
  // (touchlines, halfway, center circle+spot, penalty box/arc/spot, goal area, corner arcs)
  // goals at ±x ends: posts+crossbar (white cylinders w/ collision data exposed), net mesh that
  // wobbles (vertex offset decay, `pulseNet(side)` method called on ball-net contact)
  inGoal(pos): 'home'|'away'|null;  outInfo(pos): null|{kind, team}
  goals: {home:{posts:[...cyl colliders], line, dir}, away:{...}}  // used by Ball collisions
}
export class Stadium { constructor(scene) }  // instanced crowd blocks, 4 floodlight towers
                                             // (SpotLights, 2 with shadow), gradient sky dome
```

### 2.12 ui/HUD.js
```js
export class HUD {
  constructor(rootEl)         // builds DOM: scoreboard (names, score, clock), stamina bar,
                              // power meter (arc/bar, listens 'shotCharged'), minimap canvas
                              // (pitch rect, dots per player, ball), goal overlay ("GOAL!" anim),
                              // connection banner (gamepad connected + mapping hint), pause menu
                              // (Resume / Restart / Controls list), offside/foul toast
  update(dt, {match, teams, ball})   // refresh clock/score/minimap/stamina of controlled player
  showGoal(teamName); showToast(text); showPause(on); showGamepad(connected, name)
}
```
Style: clean dark UI, low-saturation, monospace-ish scoreboard; no frameworks.

### 2.13 audio/AudioManager.js
```js
export class AudioManager {
  constructor()               // lazy AudioContext on first user gesture; master gain
  // synthesized: crowd noise loop (filtered brown noise, swells via 'crowd_goal'/'crowd_ooh'),
  // whistle (noise burst + 2.2kHz osc), kick thump, tackle thud, goal sting.
  // subscribes to 'sfx' + 'goal' events itself.
}
```

### 2.14 main.js
- Creates renderer (shadowMap on), scene, PerspectiveCamera; instantiates all modules; fixed-timestep
  physics: `acc += frameDt; while (acc >= STEP) { world.step(STEP) }` with STEP=1/120, render each rAF.
- update order per fixed step: input.update() (also each render frame for polling) ->
  controllers -> AI -> ball -> matchManager; camera/hud on render frame.
- `events.emit('rumble', ...)` -> InputManager.vibrate; goal/tackle/collision trigger rumble per CFG.INPUT.

## 3. Rules & Gameplay specifics
- 11v11 would be heavy for AI fidelity here: use **7v7** (GK + 2 DF + 3 MF + 1 FW) scaled 4-4-2-style
  shape to keep playability + perf. Document this choice in README. (Formation coords in Team.js.)
- Kickoff: conceding team kicks off.
- Throw-in/corner/goal-kick: ball placed, nearest appropriate player auto-gains possession, brief AI freeze (0.6s).
- Free kick: taker placed at spot, opponents auto-wall 9.15m-ish away, charge-shot with aim.
- Offside simplified: on a pass release, if a teammate receiver is beyond last outfield defender and in attacking half -> whistle, possession to opponents as freekick. Show toast "OFFSIDE".
- Goals: whole ball over line inside posts.
- Match: 2 halves of CFG.MATCH.HALF_MINUTES; halftime swaps sides (or simply swap kickoff + direction flag);
  fulltime overlay with result + Restart button.
- Rumble: goal [CFG.INPUT.RUMBLE_GOAL], tackle [RUMBLE_TACKLE], player-ball collision [RUMBLE_COLLIDE].

## 4. Performance
- InstancedMesh for crowd (>= ~4000 instances), 1 stadium geometry merged where possible.
- Shadows: only key light casts; players cast, crowd doesn't.
- Fixed timestep 1/120 physics; max 5 steps/frame clamp.
- No per-frame allocations in hot loops (reuse temp vectors).

## 5. Docs (README.md must contain, verbatim sections)
1. How to run (`npx serve .` or any static server; note: needs http(s) for modules+gamepad).
2. Xbox button/axis index mapping table (as in §2.3) + note that indices follow the W3C "standard"
   mapping and can vary by browser/OS.
3. Keyboard/mouse mapping table.
4. Placeholder art notes: capsule/primitive players, procedural anims; how to swap in glTF
   (replace Player.buildMesh + load via GLTFLoader, feed AnimationMixer into Player.updateAnim).
5. Tuning guide: point to src/config.js block and list the 10 most impactful constants.
6. Known simplifications (7v7, simplified offside, procedural audio).

## 6. Branching
- `core` branch: scaffold + input + ball + player + camera + minimal pitch plane so it runs.
- `ai-match` branch: Team/AI/MatchManager/rules (builds on merged core).
- `polish` branch: Pitch visuals/Stadium/HUD/Audio (builds on merged core).
Main agent merges ai-match and polish into main, resolves conflicts, writes README, verifies.
