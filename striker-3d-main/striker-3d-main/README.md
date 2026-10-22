# Striker 3D — Argentina vs Spain

Browser-based 3D soccer game (FIFA-style) built with Three.js — no build tools.
Xbox controller via the Gamepad API with a full keyboard/mouse fallback. Played
**7-a-side** (GK + 2 DF + 3 MF + 1 FW) instead of 11v11 to keep AI fidelity and
frame rate high (see [docs/SPEC.md](docs/SPEC.md) §3).

The match is **Argentina (home) vs Spain (away)**: real squads with names and
shirt numbers (`src/entities/teams.js`), authentic kits (striped albiceleste vs
red/navy, distinct GK colors) and scorer names on the goal overlay. **Local
2-controller play** is supported — first pad (or keyboard) drives Argentina,
second pad drives Spain; with one pad Spain stays AI. Players use one external
art asset — `assets/player.glb`, a rigged **CC0** character by Quaternius
("Animated Men", converted FBX→GLB; license in `assets/LICENSE-quaternius.txt`)
— cloned per player with per-team kit materials and driven by a
`THREE.AnimationMixer`. If the GLB fails to load, the game falls back to the
original procedural figures. Everything else (pitch, stadium, crowd, ball,
audio) remains procedurally generated.

## 1. How to run

Any static file server works — ES modules and the Gamepad API require http(s),
so opening `index.html` via `file://` will NOT work.

```bash
# from this directory, pick ONE:
npx serve .
npx http-server -p 8080
python3 -m http.server 8080
```

Then open the printed URL (e.g. http://localhost:3000) in a Chromium or
Firefox browser. Three.js r160 is loaded from the unpkg CDN via an import map,
so an internet connection is required on first load.

**Controllers (local 2P):** plug in / pair Xbox pads — the first becomes
**P1 Argentina**, the second **P2 Spain** (banner shows which). One pad (or
keyboard/mouse) = you vs AI Spain. Touching the keyboard or mouse switches P1
back to keyboard mode; P2 is pad-only.

## 2. Xbox controller mapping

Uses the W3C Gamepad API **"standard" mapping** (indices can vary by
browser/OS/controller — non-standard pads may need remapping):

| Control        | W3C index            | In-game action                        |
| -------------- | -------------------- | ------------------------------------- |
| Left stick     | axes[0], axes[1]     | Move player (Y axis inverted)         |
| Right stick    | axes[2], axes[3]     | Aim passes/shots; skill flicks        |
| A              | buttons[0]           | Sprint (held) / through ball (tap)    |
| B              | buttons[1]           | Shoot (hold to charge)                |
| X              | buttons[2]           | Pass (hold to charge)                 |
| Y              | buttons[3]           | Lob / cross (hold to charge)          |
| LB             | buttons[4]           | Switch player                         |
| RB             | buttons[5]           | Skill-move modifier                   |
| LT (analog)    | buttons[6] (.value)  | Finesse shot (held)                   |
| RT (analog)    | buttons[7] (.value)  | Sprint (held)                         |
| Back / View    | buttons[8]           | Pause (secondary)                     |
| Start / Menu   | buttons[9]           | Pause                                 |
| D-pad          | buttons[12..15]      | Camera: up=broadcast, right=behind, down=tactical |

Sticks use a 0.15 radial deadzone with re-normalized 0..1 magnitude. Rumble
(dual-rumble actuator) fires on goals, tackles and hard ball contact.

## 3. Keyboard / mouse mapping

| Input            | Action                                  |
| ---------------- | --------------------------------------- |
| W A S D          | Move (camera-relative)                  |
| Mouse            | Aim (direction from player to cursor)   |
| LMB or L (hold)  | Shoot — hold to charge, release to fire |
| RMB or J (hold)  | Pass — hold to charge                   |
| K (hold)         | Lob / cross — hold to charge            |
| Space (tap)      | Through ball (leads a teammate)         |
| Shift (hold)     | Sprint (drains stamina)                 |
| Ctrl (hold)      | Finesse shot modifier (curled shots)    |
| E (hold) + aim   | Skill moves: step-over / big touch; tap while charging = fake shot |
| Q                | Switch player                           |
| Arrow keys       | Camera: up=broadcast, right=behind, down=tactical |
| Esc or Enter     | Pause / resume                          |

## 4. Art & the glTF player pipeline

Apart from the CC0 player model, everything you see and hear is generated:

- **Players** (`src/entities/Player.js` + `src/entities/PlayerModel.js`) are
  clones of the shared Quaternius GLB rig (`SkeletonUtils.clone`), tinted per
  team/role in `PlayerModel.applyKit()` and animated by a per-player
  `THREE.AnimationMixer`. The FSM
  (`idle | jog | sprint | dribble | kick | tackle | celebrate`) picks a mode
  from actual velocity/state and cross-fades the matching clip; locomotion
  playback speed tracks real pace. If the GLB fails to load, `Player._build()`
  falls back to the original procedural primitive figures (box limbs on pivot
  groups, swung procedurally in `updateAnim(dt)`). `playKickAnim()`,
  `playTackleAnim()` and `celebrate()` trigger the timed one-shots either way.
- **Crowd** (`src/world/Stadium.js`) is a single `InstancedMesh` of ~5,400
  spectators (two merged boxes each: body + head) with per-instance colors
  and a GPU vertex-shader bob — one draw call.
- **Pitch & stadium** are primitive geometry with canvas-generated textures
  (mown stripes + regulation markings); the nets wobble procedurally.
- **Audio** is synthesized with the Web Audio API (`src/audio/AudioManager.js`)
  — filtered noise for the crowd, oscillators for the whistle/kicks/sting.
  No audio files.

### Swapping in a rigged glTF character

The movement/physics API (`move()`, `velocity`, `position`, `stamina`,
`hasBall`, `facing`, `stun()` …) is completely independent of the visuals, so
a real character only touches mesh construction and animation:

1. **Load the model once** (not per player) and keep a master copy. The
   import map in `index.html` already exposes `three/addons/`:
   ```js
   import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
   import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

   const gltf = await new GLTFLoader().loadAsync('assets/player.glb');
   ```
2. **Replace the primitive body in `Player._build()`** with a per-player
   `SkeletonUtils.clone(gltf.scene)` assigned to `this._body` (skinned meshes
   must be cloned via SkeletonUtils, not `.clone()`). Keep it parented under
   `this.mesh` — the `THREE.Group` whose `position` IS the player's feet
   position — keep the team-color logic (e.g. tint the jersey material) and
   keep the highlight ring.
3. **Drive a `THREE.AnimationMixer` inside `Player.updateAnim(dt)`**: create
   one mixer per player (`new THREE.AnimationMixer(this._body)`), call
   `mixer.update(dt)` every frame, and map the existing `_animMode` FSM
   states to clips (`idle`/`jog`/`sprint` loops cross-faded with
   `action.reset().fadeIn(0.15).play()` when the mode changes).
4. **Map the one-shots**: `playKickAnim()` / `playTackleAnim()` /
   `celebrate()` become `THREE.LoopOnce` clips with `clampWhenFinished`.

Everything else — movement, stamina, possession, AI, match rules — keeps
working unchanged because it only reads the physics-facing API above.

## 5. Tuning guide

Every gameplay constant lives in `src/config.js` (exported as `CFG`), and the
big **TUNING GUIDE comment block at the top of that file** explains the 15
most impactful ones with safe ranges. The ~10 you will reach for first:

| Constant (CFG path)       | Value  | What it does |
| ------------------------- | ------ | ------------ |
| `PLAYER.JOG`              | 7.0    | Base top speed (m/s). The master game-speed knob; keep `WALK` ≈ 0.6×`JOG`. |
| `PLAYER.SPRINT_MULT`      | 1.55   | Sprint speed multiplier. >1.7 makes defenders useless, <1.3 makes sprint pointless. Drains `STAMINA_DRAIN`/s. |
| `PLAYER.ACCEL`            | 22     | Velocity approach rate (m/s²). Higher = snappier/arcade, lower = heavier/momentum. |
| `KICK.SHOT_MAX`           | 32     | Full-charge shot speed (m/s). `PASS_MAX` (22) / `LOB_MAX` (24) scale passes & crosses the same way. |
| `KICK.CHARGE_TIME`        | 0.9    | Seconds of button-hold to reach full power — the risk/reward dial for shooting. |
| `BALL.GRAVITY`            | -22    | Game-weighted gravity so lobs land quickly. Tune together with `KICK.LOB_HEIGHT`. |
| `BALL.ROLL_FRICTION`      | 0.9925 | Rolling decay (≈40% speed kept per second) — controls how far passes/through balls roll out. |
| `BALL.MAGNUS`             | 0.9    | Curl strength from spin (finesse shots). 0 disables curving, 2+ is cartoonish. |
| `PLAYER.POSSESS_RADIUS` / `PLAYER.KICK_RANGE` | 1.0 / 1.1 | Possession "stickiness" bubble and max kick reach — bigger = forgiving, smaller = skill-based. |
| `AI.CHASE_RADIUS` / `AI.TACKLE_SUCCESS` | 14 / 0.75 | How close the ball must be before AI breaks shape; tackle odds (failures near `FOUL_DANGER_RADIUS` concede free kicks). |

Also commonly tweaked: `MATCH.HALF_MINUTES` (5) for match length,
`CAM.HEIGHT`/`CAM.DIST` (26/32) for broadcast framing, and `INPUT.DEADZONE`
(0.15) if your controller drifts. Modules read from `CFG` only — never
hard-code numbers elsewhere.

## 6. Known simplifications

- **7v7 instead of 11v11** (documented choice, [SPEC](docs/SPEC.md) §3): GK + 2 DF + 3 MF +
  1 FW per team (`MATCH.TEAM_SIZE`), to keep AI fidelity and frame rate high.
- **Simplified offside**: judged only at the moment a pass is released — a
  teammate receiver beyond the second-last opponent AND already in the
  attacking half is whistled (0.3 m grace for level). No offside from set
  pieces, throw-ins or dribbles.
- **No player injuries, substitutions or cards** — fouls always lead to a
  free kick (`MATCH.MAX_SUB_MINI` is reserved but unused).
- **Synthesized placeholder audio** — Web Audio oscillators/filtered noise
  standing in for real crowd/whistle/kick samples (see §4).
- **Single AI difficulty** — one behavior FSM with fixed reaction/tackle
  constants (`AI.*`), no difficulty levels.
