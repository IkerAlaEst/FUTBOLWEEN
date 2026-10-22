/**
 * config.js — every gameplay constant in one place (SPEC §2.1).
 *
 * Modules MUST read tuning values from CFG only — never hard-code gameplay numbers.
 * Exact values may be tuned, but every key below is part of the contract:
 * other modules (Team/AI/MatchManager/HUD replacements) read them by name.
 *
 * ============================================================================
 * TUNING GUIDE — the most impactful constants and what they do
 * ============================================================================
 *  1. PLAYER.JOG (7.0) ............ Base top speed in m/s. Raising it speeds the
 *     whole game up; keep WALK ≈ 0.6×JOG so analog stick feels granular.
 *  2. PLAYER.SPRINT_MULT (1.55) ... Sprint multiplier. >1.7 makes defenders
 *     useless; <1.3 makes sprinting pointless. Drains STAMINA_DRAIN/s while held.
 *  3. PLAYER.ACCEL (22) ........... m/s² approach rate toward target velocity.
 *     Higher = snappier/arcade, lower = heavier/momentum-y feel.
 *  4. KICK.SHOT_MAX (32) .......... Full-charge shot speed (m/s). ~30+ beats a
 *     GK from 25m; under 25 shots feel weak. PASS_MAX/LOB_MAX scale similarly.
 *  5. KICK.CHARGE_TIME (0.9) ...... Seconds to reach full power. Shorter =
 *     twitchier shooting; longer = more risk/reward while charging.
 *  6. BALL.GRAVITY (-22) .......... Slightly heavier than real (-9.8) so lobs
 *     and bounces feel game-y and land quickly. Tune with LOB_HEIGHT.
 *  7. BALL.RESTITUTION (0.55) ..... Bounce energy kept. 0.7+ = pinball,
 *     0.3 = dead ball. Affects first-touch bounces and post rebounds.
 *  8. BALL.ROLL_FRICTION (0.9925) . Rolling multiplier, applied as
 *     pow(ROLL_FRICTION, dt*120) => ~40% speed retained per second.
 *     0.99 = slick (~33%/s), 0.995 = wet (~55%/s). Controls how far
 *     passes/through balls roll out.
 *  9. BALL.MAGNUS (0.9) ........... Strength of curve from spin (finesse
 *     shots). 0 disables curving; 2+ is cartoonish bend.
 * 10. PLAYER.POSSESS_RADIUS (1.0) + PLAYER.KICK_RANGE (1.1)
 *     ............................. Possession "stickiness" bubble and max
 *     kick reach. Bigger bubbles = forgiving, rugby-like; smaller = skill-based.
 * 11. CAM.HEIGHT / CAM.DIST (26/32) Broadcast camera framing. Higher DIST =
 *     more of the pitch visible, smaller players. CAM.LERP (3.2) controls lag.
 * 12. INPUT.DEADZONE (0.15) ....... Stick deadzone. Raise to 0.2 if controllers
 *     drift; keep <0.25 or fine dribbling dies.
 * 13. MATCH.HALF_MINUTES (5) ...... Real minutes per half (clock counts up in
 *     scaled game seconds — 1 real second = 1 clock second).
 * 14. AI.CHASE_RADIUS (14) ........ How close the ball must be before an AI
 *     player breaks shape to chase. Small = static shape, big = swarm ball.
 * 15. AI.TACKLE_SUCCESS (0.75) .... AI/user tackle success odds inside
 *     TACKLE_RADIUS; failures near FOUL_DANGER_RADIUS concede free kicks.
 * ============================================================================
 */

export const CFG = {
  PITCH: {
    LENGTH: 105,          // goal line to goal line (x axis), metres
    WIDTH: 68,            // touchline to touchline (z axis), metres
    SCALE: 1,             // global shrink/grow factor (1 = real scale)
    GOAL_W: 7.32,         // goal mouth width (between posts)
    GOAL_H: 2.44,         // crossbar height
    GOAL_DEPTH: 2.2,      // net depth behind the line
    POST_R: 0.06,         // post/crossbar cylinder radius
    LINE_W: 0.12,         // painted line width (texture only)
    BOX_DEPTH: 16.5,      // penalty box depth from goal line
    BOX_W: 40.32,         // penalty box width
    GOALAREA_DEPTH: 5.5,  // six-yard box depth
    GOALAREA_W: 18.32,    // six-yard box width
    CENTER_CIRCLE_R: 9.15,
    PEN_SPOT: 11,         // penalty spot distance from goal line
  },

  BALL: {
    RADIUS: 0.22,         // scaled up from real 0.11 for visibility (SPEC §2.1)
    GRAVITY: -22,         // m/s² (game-weighted, see guide #6)
    RESTITUTION: 0.55,    // ground/post bounce energy retained
    ROLL_FRICTION: 0.9925, // rolling multiplier: v *= pow(this, dt*120). 0.9925
                          // keeps ~40% speed per second (≈0.985 at a 60fps reference)
                          // => a 22 m/s driven pass rolls out ~24m. SPEC's literal
                          // 0.985@120fps keeps only 16%/s and caps passes at ~12m.
    AIR_DRAG: 0.012,      // quadratic drag: a = -AIR_DRAG*|v|*v. Tuned so a 25 m/s
                          // shot loses ~20% over 20m (SPEC's 0.12 stalls balls in ~10m).
    MAGNUS: 0.9,          // a = MAGNUS * (spin × v)
    STOP_EPS: 0.05,       // |v| below this on ground => full stop
    SPIN_DECAY: 0.5,      // spin damping per second
    NET_DAMP: 0.25,       // velocity kept after hitting net
  },

  PLAYER: {
    RADIUS: 0.45,
    HEIGHT: 1.8,
    WALK: 4.5,
    JOG: 7.0,
    SPRINT_MULT: 1.55,
    ACCEL: 22,            // m/s² velocity approach rate
    TURN_LERP: 10,        // facing slerp rate (1/s)
    STAMINA_MAX: 100,
    STAMINA_DRAIN: 22,    // per second while sprinting
    STAMINA_REGEN: 14,    // per second while not sprinting
    KICK_RANGE: 1.1,      // max distance to ball for a kick/touch
    POSSESS_RADIUS: 1.0,  // sticky-possession capture bubble
    POSSESS_MAX_SPEED: 9, // ball faster than this cannot be trapped
  },

  KICK: {
    PASS_MIN: 8,
    PASS_MAX: 22,
    SHOT_MIN: 12,
    SHOT_MAX: 32,
    LOB_MIN: 10,
    LOB_MAX: 24,
    CHARGE_TIME: 0.9,     // seconds of hold for full power
    LOB_HEIGHT: 0.55,     // vertical velocity fraction for lobs/crosses
    THROUGH_LEAD: 1.6,    // seconds of receiver-velocity lead on through balls
  },

  AI: {
    REACTION: 0.25,       // seconds before AI responds to loose balls
    MARK_DIST: 2.5,       // marking standoff distance
    CHASE_RADIUS: 14,     // ball within this => nearest AI chases
    SHOT_RANGE: 28,       // AI shoots inside this distance to goal
    SHOT_ANGLE: 0.5,      // min |aim-to-goal alignment| (radians-ish tolerance)
    PASS_LANE_CHECK: 6,   // opponents within this of a pass lane block it
    GK_LINE_OFFSET: 1.2,  // GK holds this far in front of goal line
    GK_DIVE_SPEED: 12,
    TACKLE_RADIUS: 1.2,
    TACKLE_SUCCESS: 0.75,
    FOUL_DANGER_RADIUS: 1.6,
  },

  MATCH: {
    HALF_MINUTES: 5,      // real minutes per half; clock counts up
    MAX_SUB_MINI: 3,      // max substitutions per mini-half (reserved; unused by core stub)
    OFFSIDE_ENABLED: true,
    CELEBRATION_SECS: 4,  // pause between goal and kickoff reset
    KICKOFF_FREEZE: 0.6,  // AI freeze after restarts (also throw-in/corner)
    TEAM_SIZE: 7,         // 7v7 (SPEC §3): GK + 2 DF + 3 MF + 1 FW
  },

  CAM: {
    HEIGHT: 26,
    DIST: 32,
    LERP: 3.2,            // position/look-at exponential follow rate
    ZOOM_MIN: 0.75,       // closest zoom factor
    ZOOM_MAX: 1.25,       // widest zoom factor (max player spread)
    GOAL_ZOOM_RADIUS: 25, // zooms in when ball within this of a goal
    BEHIND_HEIGHT: 6,     // 'behind' mode: height above controlled player
    BEHIND_DIST: 11,      // 'behind' mode: distance behind controlled player
    TACTICAL_HEIGHT: 70,  // 'tactical' mode: near top-down height
  },

  INPUT: {
    DEADZONE: 0.15,
    RUMBLE_GOAL: [1.0, 1.0, 600],
    RUMBLE_TACKLE: [0.6, 0.6, 200],
    RUMBLE_COLLIDE: [0.3, 0.3, 120],
  },
};

export default CFG;
