/**
 * events.js — tiny EventEmitter singleton shared by every module (SPEC §2.2).
 *
 * Canonical event names (emit/listen with exactly these strings):
 *   'goal'            {team}                     — a goal was scored
 *   'kickoff'         {team}                     — kickoff reset done
 *   'outOfBounds'     {kind:'throwin'|'corner'|'goalkick', team}
 *   'foul'            {team, pos}                — team = fouling team
 *   'freekick'        {team, pos}                — team = team taking it
 *   'corner'          {team}
 *   'halfEnd'         {half}
 *   'matchEnd'        {}
 *   'stateChange'     {state}                    — MatchManager.state
 *   'rumble'          {strong, weak, ms}         — wired to InputManager.vibrate
 *   'sfx'             {name:'kick'|'whistle'|'crowd_goal'|'crowd_ooh'|'tackle'}
 *   'controlledPlayerChanged' {player}
 *   'shotCharged'     {power01}                  — HUD power meter, 0..1
 */
export class Events {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._map = new Map();
  }

  /** Subscribe `fn` to event `name`. Returns `fn` for easy off() symmetry. */
  on(name, fn) {
    let set = this._map.get(name);
    if (!set) this._map.set(name, (set = new Set()));
    set.add(fn);
    return fn;
  }

  /** Unsubscribe `fn` from event `name` (safe if never subscribed). */
  off(name, fn) {
    const set = this._map.get(name);
    if (set) set.delete(fn);
  }

  /** Fire event `name` with an optional payload. Listeners run synchronously. */
  emit(name, payload) {
    const set = this._map.get(name);
    if (!set) return;
    // Copy to array: listeners may off() themselves during emit.
    for (const fn of [...set]) {
      try {
        fn(payload);
      } catch (err) {
        // One bad listener must never break the game loop.
        console.error(`[events] listener for '${name}' threw:`, err);
      }
    }
  }
}

/** Shared singleton — modules import this, never construct their own. */
export const events = new Events();
