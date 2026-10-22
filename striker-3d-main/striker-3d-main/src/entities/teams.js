/**
 * teams.js — match fixture data: Argentina vs Spain (7v7 squads).
 *
 * Consumed by main.js (Team construction) and read through Team fields by the
 * HUD (shortName), PlayerModel (kit colors / kitStyle) and MatchManager
 * (names on toasts). Squad order MUST match Team.js's formation slots:
 * GK first, then 2 DF, 3 MF, and the FW last (kickoff taker / default
 * controlled player).
 */

export const ARGENTINA = {
  name: 'ARGENTINA',
  shortName: 'ARG',
  color: 0x8ec4e8,      // sky blue (albiceleste)
  colorAlt: 0xffffff,   // white stripes / trim
  shortsColor: 0x15151c, // black shorts
  socksColor: 0xe8e8e8,
  gkColor: 0x2d6a3e,    // green GK kit
  gkShortsColor: 0x1c3a24,
  kitStyle: 'stripes',
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
  name: 'SPAIN',
  shortName: 'ESP',
  color: 0xc60b1e,      // red home shirt
  colorAlt: 0xffc400,   // yellow trim
  shortsColor: 0x1c2a5e, // navy shorts
  socksColor: 0x8d0b18,
  gkColor: 0x1a1a1a,    // black GK kit
  gkShortsColor: 0x111111,
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

export default { ARGENTINA, SPAIN };
