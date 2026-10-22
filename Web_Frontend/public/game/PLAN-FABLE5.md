# Handoff Plan — Argentina vs Spain (Striker 3D)

**For:** Fable 5 (next session)  
**Project:** Browser 3D soccer game (`project/`)  
**Goal:** Turn the generic `HOME` vs `AWAY` match into **Argentina vs Spain** with real names, authentic kits, and improved **CC0 open-source** player models. Keep the game playable with no build tools.

---

## 1. Executive summary

This is a **Three.js r160** browser soccer game (7v7, FIFA-style controls, Xbox gamepad + keyboard). It already runs end-to-end: physics, AI, match rules, HUD, stadium, audio.

**Previous session did research + asset prep only.** Almost no game code was changed.

**Your job:** Implement the match theme + wire the downloaded player model. Do **not** rewrite match/AI systems unless required for the visual work.

---

## 2. How to run

```bash
cd project
npx serve .
# open http://localhost:3000 (or printed port)
```

Requires **http(s)** — `file://` will fail (ES modules + Gamepad API).  
Three.js loads from unpkg CDN via import map in `index.html`.

Syntax check:

```bash
cd project && npm run check
```

---

## 3. What is already done

| Item | Status | Location |
|------|--------|----------|
| Full playable game (7v7, AI, rules, HUD) | ✅ Done | `project/src/` |
| CC0 player model sourced & converted | ✅ Done | `project/assets/player.glb` |
| License file for asset | ✅ Done | `project/assets/LICENSE-quaternius.txt` |
| Argentina/Spain teams in code | ✅ Done | `src/entities/teams.js`, wired in `main.js` |
| GLB wired into `Player.js` | ✅ Done | `src/entities/PlayerModel.js` + `Player._buildGLB()` |
| Kit colors / stripes | ✅ Done | `PlayerModel.applyKit()` (shader stripes for ARG) |
| Real player names | ✅ Done | squads in `teams.js`, `Player.displayName` |
| HUD / title branding | ✅ Done | ARG/ESP scoreboard, title, splash, ad boards |
| Browser verification | ✅ Done | headless Chromium: no console errors, ~120fps |

---

## 4. What you must deliver

1. **Argentina (home, user team)** vs **Spain (away)** — names, colors, short codes on scoreboard.
2. **Real player names + shirt numbers** on a 7-a-side squad (see §8).
3. **Improved player visuals** using `assets/player.glb` (Quaternius CC0), with team kit tinting:
   - Argentina: sky blue + white (stripes on torso if feasible without huge refactor).
   - Spain: red home kit, yellow trim/shorts accent.
   - GK: distinct kit color per team (e.g. Argentina green, Spain black).
4. **HUD polish:** scoreboard shows `ARG` / `ESP` (or full names), controlled player shows **name + number** (not just `#7 FW`).
5. **Goal overlay:** show scorer name when possible (track `ball.lastTouch` on goal event).
6. **Match branding:** page title, boot splash, stadium ad boards — e.g. `ARGENTINA vs SPAIN` instead of `STRIKER 3D`.
7. **Optional but nice:** improved procedural ball (Argentina-style panel pattern is fine; keep no external ball asset requirement).
8. **Verify:** `npm run check` + serve + confirm no console errors on load.

---

## 5. Architecture constraints (do not break)

Read `docs/SPEC.md` and `README.md` for full contracts. Key rules:

- **No build tools** — plain ES modules, import map for `three` and `three/addons/`.
- **Gameplay constants** live in `src/config.js` (`CFG`) only.
- **Player physics API is sacred** — `move()`, `velocity`, `position`, `facing`, `stamina`, `hasBall`, `stunned`, etc. Visuals must not break these.
- **7v7 squad:** GK + 2 DF + 3 MF + 1 FW (`CFG.MATCH.TEAM_SIZE = 7`).
- **Home attacks +x**, away attacks -x. User controls **home** team (`PlayerController` wired to `home`).
- **Minimal scope** — match the existing code style; no new frameworks.

---

## 6. Asset: `player.glb` (Quaternius CC0)

**Source:** Quaternius "Animated Men Characters" (Feb 2019), CC0  
**Converted from:** `Male_Shirt.fbx` → GLB via `FBX2glTF`  
**License:** `project/assets/LICENSE-quaternius.txt`

### Model facts (verified in prior session)

- **Format:** GLB, ~498 KB, skinned mesh, **no UVs** (vertex colors / material slots only).
- **Scale:** Root `HumanArmature` has **scale 100**; model height ≈ 1.8 m after correction.
- **Facing:** Model faces **+Z in world** after load; game uses **+X / −X** for attack direction. You must rotate the visual root (e.g. `mesh.rotation.y = ±π/2`) so players face `player.facing`.
- **Material slots** (tint these per team):
  - `Shirt`, `Shirt2` → primary jersey
  - `Pants` → shorts
  - `Shoes`, `Socks` → footwear
  - `Skin`, `Hair`, `Hair2`, `Eyes` → leave natural (do not tint to team color)
- **Animations included** (prefix `HumanArmature|`):
  - `Man_Idle`, `Man_Walk`, `Man_Run`, `Man_Jump`, `Man_Punch`, `Man_Clapping`, `Man_Death`, etc.
  - **No dedicated kick/tackle clip** — map `Man_Punch` or keep a short procedural leg pose for kick/tackle on top of GLB, or use `Man_Jump` for celebrate.
- **Load once, clone per player** via `SkeletonUtils.clone()` from `three/addons/utils/SkeletonUtils.js`.

### Recommended loading pattern

```js
// New file: src/entities/PlayerModel.js (or inline in Player.js if small)
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

let _template = null; // { scene, animations, clipsByName }

export async function loadPlayerModel() {
  if (_template) return _template;
  const gltf = await new GLTFLoader().loadAsync('assets/player.glb');
  const clips = {};
  for (const clip of gltf.animations) clips[clip.name] = clip;
  _template = { scene: gltf.scene, animations: gltf.animations, clips };
  return _template;
}
```

**Bootstrap:** `main.js` should `await loadPlayerModel()` before creating teams, OR create teams after load with a small async boot wrapper. Keep boot splash until ready.

**Fallback:** If GLB fails to load, keep existing procedural `_build()` in `Player.js` so the game still runs.

### Argentina stripes (no UVs)

Options (pick simplest that looks good):

1. **Procedural stripe texture** on a `CanvasTexture`, assign as `map` on shirt materials only.
2. **Two-tone material hack:** duplicate shirt submesh materials — alternate tint on `Shirt` vs `Shirt2` (may not look like stripes but reads as two-tone kit).
3. **Shader patch** in `material.onBeforeCompile` for vertical stripes on torso Y range only.

Prefer (1) or (2) for minimal risk.

---

## 7. Implementation plan (ordered)

### Step A — Team data module

Create `src/entities/teams.js` (or extend `Team.js`):

```js
export const ARGENTINA = {
  name: 'Argentina',
  shortName: 'ARG',
  color: 0x75aad9,      // sky blue
  colorAlt: 0xffffff,   // white stripes / trim
  gkColor: 0x2d6a3e,    // green GK
  kitStyle: 'stripes',  // hint for Player visual
  side: 'home',
  squad: [
    { role: 'GK', num: 23, name: 'Martínez' },
    { role: 'DF', num: 13, name: 'Romero' },
    { role: 'DF', num: 19, name: 'Otamendi' },
    { role: 'MF', num: 7,  name: 'De Paul' },
    { role: 'MF', num: 24, name: 'Fernández' },
    { role: 'MF', num: 20, name: 'Mac Allister' },
    { role: 'FW', num: 10, name: 'Messi' },
  ],
};

export const SPAIN = {
  name: 'Spain',
  shortName: 'ESP',
  color: 0xc60b1e,      // red
  colorAlt: 0xffc400,   // yellow
  gkColor: 0x1a1a1a,
  kitStyle: 'solid',
  side: 'away',
  squad: [
    { role: 'GK', num: 23, name: 'Simón' },
    { role: 'DF', num: 14, name: 'Laporte' },
    { role: 'DF', num: 2,  name: 'Carvajal' },
    { role: 'MF', num: 8,  name: 'Pedri' },
    { role: 'MF', num: 16, name: 'Rodri' },
    { role: 'MF', num: 9,  name: 'Gavi' },
    { role: 'FW', num: 7,  name: 'Morata' },
  ],
};
```

Wire formation positions from existing `SQUAD` array in `Team.js` — merge `name` from team config by index (GK first, FW last = kickoff taker).

### Step B — Update `Team.js`

- Accept `squad` array with `{ role, num, name }` instead of hard-coded `SQUAD`.
- Pass `name` into `Player` constructor.
- Keep formation math unchanged.

### Step C — Update `Player.js`

- Add `this.displayName = name`.
- Replace `_build()` body with GLB clone when template loaded:
  - `this._body = SkeletonUtils.clone(template.scene)`
  - Apply kit tint function: `applyKitMaterials(mesh, team, role)`
  - Scale/rotate for pitch orientation
  - Keep highlight ring under feet
- Add `THREE.AnimationMixer` + map FSM modes:
  | `_animMode` | GLB clip |
  |-------------|----------|
  | idle | `HumanArmature\|Man_Idle` |
  | jog | `HumanArmature\|Man_Walk` |
  | sprint / dribble | `HumanArmature\|Man_Run` |
  | kick | `HumanArmature\|Man_Punch` (LoopOnce) |
  | tackle | procedural or `Man_Punch` |
  | celebrate | `HumanArmature\|Man_Clapping` or `Man_Jump` |
- Cross-fade clips on mode change (`fadeIn(0.15)`).
- Call `this._mixer.update(dt)` inside `updateAnim(dt)`.

### Step D — Update `main.js`

```js
import { ARGENTINA, SPAIN } from './entities/teams.js';
import { loadPlayerModel } from './entities/PlayerModel.js';

async function boot() {
  await loadPlayerModel().catch(console.warn);
  const home = new Team(scene, { ...ARGENTINA, attacking: +1 });
  const away = new Team(scene, { ...SPAIN, attacking: -1 });
  // ... rest unchanged
}
boot();
```

### Step E — HUD (`src/ui/HUD.js`)

- Scoreboard: use `teams.home.shortName` / `teams.away.shortName` (or full names).
- Stamina label: `STAMINA — Messi #10` instead of `#10 FW`.
- Optional: small name tag above controlled player (project via `cameraRig.toScreen` like power meter).

### Step F — Goal scorer (`src/core/MatchManager.js`)

In `_checkGoal()`, before `hud.showGoal(scorer.name)`:

```js
const scorerPlayer = this.ball.lastTouch;
const scorerLabel = scorerPlayer?.displayName
  ? `${scorerPlayer.displayName} — ${scorer.name}`
  : scorer.name;
this.hud?.showGoal?.(scorerLabel);
```

Ensure `ball.lastTouch` is still the scoring player at goal detection time (it should be from the last kick).

### Step G — Branding

| File | Change |
|------|--------|
| `index.html` | `<title>Argentina vs Spain</title>`, boot splash text |
| `src/world/Stadium.js` | `_makeAdTexture()` text → `ARGENTINA vs SPAIN` or `COPA FINAL` |
| `src/world/Stadium.js` | Crowd accent colors: more light blue + red in `_buildCrowd` |
| `src/world/Ball.js` | Optional canvas texture: white ball + dark pentagon pattern |

### Step H — Verify

1. `npm run check`
2. `npx serve .` → load page, no red errors in console
3. Confirm 14 players visible with kits (not capsules)
4. Confirm scoreboard `ARG — ESP`, names on stamina bar
5. Score a goal → scorer name appears
6. Gamepad/keyboard still work

---

## 8. Squad reference (7v7)

User plays as **Argentina (home)**.

### Argentina — home, attacks +x

| # | Name | Role |
|---|------|------|
| 23 | Martínez | GK |
| 13 | Romero | DF |
| 19 | Otamendi | DF |
| 7 | De Paul | MF |
| 24 | Fernández | MF |
| 20 | Mac Allister | MF |
| 10 | Messi | FW (kickoff, default controlled) |

### Spain — away, attacks −x

| # | Name | Role |
|---|------|------|
| 23 | Simón | GK |
| 14 | Laporte | DF |
| 2 | Carvajal | DF |
| 8 | Pedri | MF |
| 16 | Rodri | MF |
| 9 | Gavi | MF |
| 7 | Morata | FW |

*(Names are illustrative star lineups; swap if you prefer Álvarez, Yamal, etc. — keep 7 players.)*

---

## 9. Files to touch (expected diff)

| File | Action |
|------|--------|
| `src/entities/teams.js` | **Create** — ARG/ESP config |
| `src/entities/PlayerModel.js` | **Create** — load GLB, kit tint helper |
| `src/entities/Player.js` | **Edit** — GLB + AnimationMixer |
| `src/entities/Team.js` | **Edit** — named squads from config |
| `src/main.js` | **Edit** — async boot, ARG vs ESP teams |
| `src/ui/HUD.js` | **Edit** — names, short codes |
| `src/core/MatchManager.js` | **Edit** — scorer name on goal |
| `index.html` | **Edit** — title, splash |
| `src/world/Stadium.js` | **Edit** — ad boards, crowd colors |
| `src/world/Ball.js` | **Edit** (optional) — better ball texture |
| `README.md` | **Edit** (optional) — note CC0 asset + Argentina match |

**Do not** refactor AI, MatchManager rules, InputManager, or config unless necessary.

---

## 10. Pitfalls (from prior research)

1. **Do not `.clone()` skinned meshes** — use `SkeletonUtils.clone`.
2. **Model scale 100** on armature — test height ≈ `CFG.PLAYER.HEIGHT` (1.8 m); add wrapper scale if needed.
3. **Rotation** — players must face `facing` vector; GLB default ≠ game facing.
4. **14 clones × 1 mixer each** — acceptable for 7v7; watch perf on low-end laptops.
5. **GLB path** — `assets/player.glb` is relative to served root (`project/`), not `src/`.
6. **No git repo** — user has not asked for commits; do not commit unless asked.

---

## 11. Out of scope (unless user asks)

- 11v11, new AI behaviors, difficulty levels
- Real national anthems / external audio files (keep WebAudio synth)
- Multiplayer, substitutions, cards
- Downloading additional assets in-session (use `player.glb` already in repo)

---

## 12. Success criteria checklist

- [x] Scoreboard: **ARG vs ESP** (or Argentina vs Spain)
- [x] Home team = Argentina, user controls Argentina
- [x] All 14 players use GLB model (not capsules), team-colored kits
- [x] Argentina reads as light blue/white; Spain as red/yellow
- [x] HUD shows controlled player **name + number** (`STAMINA — Messi #10`)
- [x] Goal overlay shows **scorer name** (`Messi — ARGENTINA`)
- [x] Page title / splash / ads reflect the fixture
- [x] `npm run check` passes
- [x] Game runs at ~60fps after changes (~120fps headless Chromium w/ Metal)

---

## 13. Quick file map

```
project/
├── index.html              # import map, HUD root, boot splash
├── assets/
│   ├── player.glb          # CC0 Quaternius rigged man (READY)
│   └── LICENSE-quaternius.txt
├── src/
│   ├── main.js             # bootstrap — wire ARG/ESP here
│   ├── config.js           # CFG constants
│   ├── entities/
│   │   ├── Player.js       # visuals + movement
│   │   ├── Team.js         # squad + formation
│   │   ├── PlayerController.js
│   │   └── AIController.js
│   ├── core/
│   │   ├── MatchManager.js # goals, score, clock
│   │   └── CameraRig.js
│   ├── ui/HUD.js
│   └── world/
│       ├── Ball.js
│       ├── Pitch.js
│       └── Stadium.js
└── docs/SPEC.md            # full technical spec
```

---

*End of handoff — prior session stopped after asset copy; all gameplay code changes remain for Fable 5.*
