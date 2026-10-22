export interface TournamentClub {
  id: string;
  name: string;
  shortName: string;
  badge: string;
  primaryColor: string;
  secondaryColor: string;
  stadium: string;
}

export interface TournamentPlayer {
  id: string;
  gamertag: string;
  fullName: string;
  clubId: string;
  seed: number;
}

export interface MatchEvent {
  minuto: number;
  tipo: 'gol' | 'penalti' | 'amarilla' | 'roja' | 'falta' | 'ocasion' | 'paradon';
  jugador: string;
  equipo: 'local' | 'visitante';
  descripcion?: string;
}

export interface MatchStats {
  remates_local: number;
  remates_visitante: number;
  remates_puerta_local: number;
  remates_puerta_visitante: number;
  corners_local: number;
  corners_visitante: number;
  posesion_local: number;
  posesion_visitante: number;
  faltas_local: number;
  faltas_visitante: number;
  pases_local: string;
  pases_visitante: string;
  paradas_local: number;
  paradas_visitante: number;
  amarillas_local: number;
  amarillas_visitante: number;
  rojas_local: number;
  rojas_visitante: number;
}

export interface BracketParticipant {
  player: TournamentPlayer;
  club: TournamentClub;
  score: number;
}

export interface BracketMatch {
  id: number;
  round: 'octavos' | 'cuartos' | 'semis' | 'final';
  roundName: string;
  branch: 'left' | 'right' | 'center';
  slotIndex: number;
  dateStr: string;
  timeStr: string;
  venue: string;
  status: 'finalizado' | 'en_curso' | 'pendiente';
  liveMinute?: number;
  local: BracketParticipant | null;
  visitante: BracketParticipant | null;
  winnerPlayerId: string | null;
  stats: MatchStats;
  events: MatchEvent[];
  referee: string;
  nextMatchId: number | null;
  /** false = cruce de la mitad estática del cuadro (u1-u8), no existe en `partidos`. */
  inDatabase?: boolean;
}

export const TOURNAMENT_CLUBS: Record<string, TournamentClub> = {
  valencia: {
    id: 'valencia',
    name: 'Valencia CF',
    shortName: 'VAL',
    badge: 'https://r2.thesportsdb.com/images/media/team/badge/dm8l6o1655594864.png',
    primaryColor: '#f18e00',
    secondaryColor: '#ffffff',
    stadium: 'Mestalla'
  },
  madrid: {
    id: 'madrid',
    name: 'Real Madrid',
    shortName: 'RMA',
    badge: 'https://r2.thesportsdb.com/images/media/team/badge/vwvwrw1473502969.png',
    primaryColor: '#febe10',
    secondaryColor: '#ffffff',
    stadium: 'Santiago Bernabéu'
  },
  barcelona: {
    id: 'barcelona',
    name: 'FC Barcelona',
    shortName: 'BAR',
    badge: 'https://r2.thesportsdb.com/images/media/team/badge/wq9sir1639406443.png',
    primaryColor: '#a50044',
    secondaryColor: '#004d98',
    stadium: 'Spotify Camp Nou'
  },
  atletico: {
    id: 'atletico',
    name: 'Atlético de Madrid',
    shortName: 'ATM',
    badge: 'https://r2.thesportsdb.com/images/media/team/badge/0ulh3q1719984315.png',
    primaryColor: '#cb3524',
    secondaryColor: '#ffffff',
    stadium: 'Cívitas Metropolitano'
  },
  mancity: {
    id: 'mancity',
    name: 'Manchester City',
    shortName: 'MCI',
    badge: 'https://r2.thesportsdb.com/images/media/team/badge/vwpvry1467462651.png',
    primaryColor: '#6cabdd',
    secondaryColor: '#1c2c5b',
    stadium: 'Etihad Stadium'
  },
  arsenal: {
    id: 'arsenal',
    name: 'Arsenal FC',
    shortName: 'ARS',
    badge: 'https://r2.thesportsdb.com/images/media/team/badge/uyhbfe1612467038.png',
    primaryColor: '#ef0107',
    secondaryColor: '#ffffff',
    stadium: 'Emirates Stadium'
  },
  bayern: {
    id: 'bayern',
    name: 'Bayern München',
    shortName: 'BAY',
    badge: 'https://r2.thesportsdb.com/images/media/team/badge/01ogkh1716960412.png',
    primaryColor: '#dc052d',
    secondaryColor: '#0066b2',
    stadium: 'Allianz Arena'
  },
  liverpool: {
    id: 'liverpool',
    name: 'Liverpool FC',
    shortName: 'LIV',
    badge: 'https://r2.thesportsdb.com/images/media/team/badge/kfaher1737969724.png',
    primaryColor: '#c8102e',
    secondaryColor: '#00b2a9',
    stadium: 'Anfield'
  },
  inter: {
    id: 'inter',
    name: 'Inter de Milán',
    shortName: 'INT',
    badge: 'https://r2.thesportsdb.com/images/media/team/badge/ryhu6d1617113103.png',
    primaryColor: '#0068a8',
    secondaryColor: '#000000',
    stadium: 'San Siro'
  },
  psg: {
    id: 'psg',
    name: 'Paris Saint-Germain',
    shortName: 'PSG',
    badge: 'https://r2.thesportsdb.com/images/media/team/badge/rwqrrq1473504808.png',
    primaryColor: '#004170',
    secondaryColor: '#da291c',
    stadium: 'Parc des Princes'
  },
  milan: {
    id: 'milan',
    name: 'AC Milan',
    shortName: 'MIL',
    badge: 'https://r2.thesportsdb.com/images/media/team/badge/wvspur1448806617.png',
    primaryColor: '#fb090b',
    secondaryColor: '#000000',
    stadium: 'San Siro'
  },
  juventus: {
    id: 'juventus',
    name: 'Juventus FC',
    shortName: 'JUV',
    badge: 'https://r2.thesportsdb.com/images/media/team/badge/uxf0gr1742983727.png',
    primaryColor: '#262626',
    secondaryColor: '#ffffff',
    stadium: 'Allianz Stadium'
  },
  dortmund: {
    id: 'dortmund',
    name: 'Borussia Dortmund',
    shortName: 'BVB',
    badge: 'https://r2.thesportsdb.com/images/media/team/badge/q0o5001599679795.png',
    primaryColor: '#fde100',
    secondaryColor: '#000000',
    stadium: 'Signal Iduna Park'
  },
  chelsea: {
    id: 'chelsea',
    name: 'Chelsea FC',
    shortName: 'CHE',
    badge: 'https://r2.thesportsdb.com/images/media/team/badge/yvwvtu1448813215.png',
    primaryColor: '#034694',
    secondaryColor: '#d1ab3e',
    stadium: 'Stamford Bridge'
  },
  villarreal: {
    id: 'villarreal',
    name: 'Villarreal CF',
    shortName: 'VIL',
    badge: 'https://r2.thesportsdb.com/images/media/team/badge/vrypqy1473503073.png',
    primaryColor: '#ffe667',
    secondaryColor: '#00519e',
    stadium: 'Estadio de la Cerámica'
  },
  tottenham: {
    id: 'tottenham',
    name: 'Tottenham Hotspur',
    shortName: 'TOT',
    badge: 'https://r2.thesportsdb.com/images/media/team/badge/vrtrtp1448813175.png',
    primaryColor: '#132257',
    secondaryColor: '#ffffff',
    stadium: 'Tottenham Hotspur Stadium'
  }
};

export const TOURNAMENT_PLAYERS: Record<string, TournamentPlayer> = {
  u1: { id: 'u1', gamertag: 'NavarroXat_9', fullName: 'Marc Navarro Soler', clubId: 'valencia', seed: 1 },
  u2: { id: 'u2', gamertag: 'GhostLucas_FC', fullName: 'Lucas García Albiol', clubId: 'madrid', seed: 16 },
  u3: { id: 'u3', gamertag: 'TorresVamp', fullName: 'Alejandro Torres', clubId: 'barcelona', seed: 8 },
  u4: { id: 'u4', gamertag: 'SaraWitch_10', fullName: 'Sara Martí Bellver', clubId: 'atletico', seed: 9 },
  u5: { id: 'u5', gamertag: 'PauZombie_7', fullName: 'Pau Ripoll Vidal', clubId: 'mancity', seed: 4 },
  u6: { id: 'u6', gamertag: 'ClaraBat_04', fullName: 'Clara Sanchis', clubId: 'arsenal', seed: 13 },
  u7: { id: 'u7', gamertag: 'BenaventGhul', fullName: 'David Benavent', clubId: 'bayern', seed: 5 },
  u8: { id: 'u8', gamertag: 'KikeMummy_21', fullName: 'Enrique Moreno', clubId: 'liverpool', seed: 12 },
  u9: { id: 'u9', gamertag: 'MateoWolf_88', fullName: 'Mateo Calatayud', clubId: 'inter', seed: 2 },
  u10: { id: 'u10', gamertag: 'CarlaSpider', fullName: 'Carla Ferri', clubId: 'psg', seed: 15 },
  u11: { id: 'u11', gamertag: 'GuillemSkull', fullName: 'Guillem Pascual', clubId: 'milan', seed: 7 },
  u12: { id: 'u12', gamertag: 'RiberaGhoul', fullName: 'Adrián Ribera', clubId: 'juventus', seed: 10 },
  u13: { id: 'u13', gamertag: 'BarberaSpecter', fullName: 'Joan Barberà', clubId: 'dortmund', seed: 3 },
  u14: { id: 'u14', gamertag: 'MireiaPhantom', fullName: 'Mireia Cerveró', clubId: 'chelsea', seed: 14 },
  u15: { id: 'u15', gamertag: 'SergiGrave', fullName: 'Sergi Gisbert', clubId: 'villarreal', seed: 6 },
  u16: { id: 'u16', gamertag: 'VictorSpooky', fullName: 'Víctor Micó', clubId: 'tottenham', seed: 11 }
};

export const INITIAL_BRACKET_MATCHES: BracketMatch[] = [
  // ==========================================
  // OCTAVOS DE FINAL - RAMA IZQUIERDA (1 - 4)
  // Sede: IES Dr. Lluís Simarro
  // ==========================================
  {
    id: 1,
    round: 'octavos',
    roundName: 'Octavos de Final',
    branch: 'left',
    slotIndex: 0,
    dateStr: 'Viernes 31/10/2026',
    timeStr: '16:00h',
    venue: 'IES Dr. Lluís Simarro',
    status: 'finalizado',
    local: { player: TOURNAMENT_PLAYERS.u1, club: TOURNAMENT_CLUBS.valencia, score: 3 },
    visitante: { player: TOURNAMENT_PLAYERS.u2, club: TOURNAMENT_CLUBS.madrid, score: 1 },
    winnerPlayerId: 'u1',
    nextMatchId: 9,
    referee: 'Juez_Simarro',
    stats: {
      remates_local: 16,
      remates_visitante: 11,
      remates_puerta_local: 9,
      remates_puerta_visitante: 5,
      corners_local: 6,
      corners_visitante: 4,
      posesion_local: 56,
      posesion_visitante: 44,
      faltas_local: 5,
      faltas_visitante: 8,
      pases_local: '86% (320)',
      pases_visitante: '80% (258)',
      paradas_local: 4,
      paradas_visitante: 6,
      amarillas_local: 1,
      amarillas_visitante: 2,
      rojas_local: 0,
      rojas_visitante: 0
    },
    events: [
      { minuto: 14, tipo: 'gol', jugador: 'Hugo Duro', equipo: 'local', descripcion: 'Definición cruzada ajustada a la base del poste' },
      { minuto: 39, tipo: 'gol', jugador: 'Vinícius Jr.', equipo: 'visitante', descripcion: 'Recorte en el área y disparo imparable a la escuadra' },
      { minuto: 68, tipo: 'penalti', jugador: 'Hugo Duro', equipo: 'local', descripcion: 'Pena máxima convertida con temple raso' },
      { minuto: 87, tipo: 'gol', jugador: 'Diego López', equipo: 'local', descripcion: 'Contragolpe letal tras robo en salida de balón' }
    ]
  },
  {
    id: 2,
    round: 'octavos',
    roundName: 'Octavos de Final',
    branch: 'left',
    slotIndex: 1,
    dateStr: 'Viernes 31/10/2026',
    timeStr: '16:00h',
    venue: 'IES Dr. Lluís Simarro',
    status: 'finalizado',
    local: { player: TOURNAMENT_PLAYERS.u3, club: TOURNAMENT_CLUBS.barcelona, score: 4 },
    visitante: { player: TOURNAMENT_PLAYERS.u4, club: TOURNAMENT_CLUBS.atletico, score: 2 },
    winnerPlayerId: 'u3',
    nextMatchId: 9,
    referee: 'Juez_Simarro',
    stats: {
      remates_local: 18,
      remates_visitante: 12,
      remates_puerta_local: 10,
      remates_puerta_visitante: 6,
      corners_local: 7,
      corners_visitante: 3,
      posesion_local: 62,
      posesion_visitante: 38,
      faltas_local: 4,
      faltas_visitante: 9,
      pases_local: '91% (410)',
      pases_visitante: '78% (214)',
      paradas_local: 4,
      paradas_visitante: 6,
      amarillas_local: 0,
      amarillas_visitante: 3,
      rojas_local: 0,
      rojas_visitante: 0
    },
    events: [
      { minuto: 7, tipo: 'gol', jugador: 'Robert Lewandowski', equipo: 'local', descripcion: 'Vaselina sutil ante la salida del meta' },
      { minuto: 22, tipo: 'gol', jugador: 'Antoine Griezmann', equipo: 'visitante', descripcion: 'Cabezazo picado al saque de un córner' },
      { minuto: 45, tipo: 'gol', jugador: 'Lamine Yamal', equipo: 'local', descripcion: 'Golazo de rosca al palo largo desde el vértice' },
      { minuto: 59, tipo: 'gol', jugador: 'Julián Álvarez', equipo: 'visitante', descripcion: 'Zurdazo al primer toque tras rechace' },
      { minuto: 73, tipo: 'gol', jugador: 'Raphinha', equipo: 'local', descripcion: 'Disparo potente tras carrera en banda' },
      { minuto: 89, tipo: 'gol', jugador: 'Dani Olmo', equipo: 'local', descripcion: 'Sentencia tras jugada combinativa al borde del área' }
    ]
  },
  {
    id: 3,
    round: 'octavos',
    roundName: 'Octavos de Final',
    branch: 'left',
    slotIndex: 2,
    dateStr: 'Viernes 31/10/2026',
    timeStr: '16:45h',
    venue: 'IES Dr. Lluís Simarro',
    status: 'finalizado',
    local: { player: TOURNAMENT_PLAYERS.u5, club: TOURNAMENT_CLUBS.mancity, score: 3 },
    visitante: { player: TOURNAMENT_PLAYERS.u6, club: TOURNAMENT_CLUBS.arsenal, score: 0 },
    winnerPlayerId: 'u5',
    nextMatchId: 10,
    referee: 'Juez_Simarro',
    stats: {
      remates_local: 15,
      remates_visitante: 6,
      remates_puerta_local: 8,
      remates_puerta_visitante: 2,
      corners_local: 5,
      corners_visitante: 2,
      posesion_local: 64,
      posesion_visitante: 36,
      faltas_local: 6,
      faltas_visitante: 7,
      pases_local: '89% (385)',
      pases_visitante: '79% (205)',
      paradas_local: 2,
      paradas_visitante: 5,
      amarillas_local: 1,
      amarillas_visitante: 1,
      rojas_local: 0,
      rojas_visitante: 0
    },
    events: [
      { minuto: 18, tipo: 'gol', jugador: 'Erling Haaland', equipo: 'local', descripcion: 'Pase a la red tras asistencia milimétrica de De Bruyne' },
      { minuto: 54, tipo: 'gol', jugador: 'Kevin De Bruyne', equipo: 'local', descripcion: 'Cañonazo desde fuera del área' },
      { minuto: 81, tipo: 'gol', jugador: 'Phil Foden', equipo: 'local', descripcion: 'Volea acrobática en el segundo palo' }
    ]
  },
  {
    id: 4,
    round: 'octavos',
    roundName: 'Octavos de Final',
    branch: 'left',
    slotIndex: 3,
    dateStr: 'Viernes 31/10/2026',
    timeStr: '16:45h',
    venue: 'IES Dr. Lluís Simarro',
    status: 'finalizado',
    local: { player: TOURNAMENT_PLAYERS.u7, club: TOURNAMENT_CLUBS.bayern, score: 2 },
    visitante: { player: TOURNAMENT_PLAYERS.u8, club: TOURNAMENT_CLUBS.liverpool, score: 1 },
    winnerPlayerId: 'u7',
    nextMatchId: 10,
    referee: 'Juez_Simarro',
    stats: {
      remates_local: 12,
      remates_visitante: 13,
      remates_puerta_local: 6,
      remates_puerta_visitante: 5,
      corners_local: 4,
      corners_visitante: 6,
      posesion_local: 50,
      posesion_visitante: 50,
      faltas_local: 7,
      faltas_visitante: 5,
      pases_local: '82% (280)',
      pases_visitante: '84% (295)',
      paradas_local: 4,
      paradas_visitante: 4,
      amarillas_local: 2,
      amarillas_visitante: 1,
      rojas_local: 0,
      rojas_visitante: 0
    },
    events: [
      { minuto: 31, tipo: 'gol', jugador: 'Harry Kane', equipo: 'local', descripcion: 'Remate seco a bocajarro' },
      { minuto: 50, tipo: 'gol', jugador: 'Mohamed Salah', equipo: 'visitante', descripcion: 'Tiro combado al palo corto' },
      { minuto: 78, tipo: 'gol', jugador: 'Jamal Musiala', equipo: 'local', descripcion: 'Regate múltiple y definición rasa con clase' }
    ]
  },

  // ==========================================
  // OCTAVOS DE FINAL - RAMA DERECHA (5 - 8)
  // Sede: IES Dr. Lluís Simarro
  // ==========================================
  {
    id: 5,
    round: 'octavos',
    roundName: 'Octavos de Final',
    branch: 'right',
    slotIndex: 0,
    dateStr: 'Viernes 31/10/2026',
    timeStr: '16:00h',
    venue: 'IES Dr. Lluís Simarro',
    status: 'en_curso',
    liveMinute: 83,
    local: { player: TOURNAMENT_PLAYERS.u9, club: TOURNAMENT_CLUBS.inter, score: 2 },
    visitante: { player: TOURNAMENT_PLAYERS.u10, club: TOURNAMENT_CLUBS.psg, score: 2 },
    winnerPlayerId: null,
    nextMatchId: 11,
    referee: 'Juez_Simarro',
    stats: {
      remates_local: 13,
      remates_visitante: 15,
      remates_puerta_local: 7,
      remates_puerta_visitante: 8,
      corners_local: 4,
      corners_visitante: 5,
      posesion_local: 48,
      posesion_visitante: 52,
      faltas_local: 8,
      faltas_visitante: 6,
      pases_local: '83% (290)',
      pases_visitante: '87% (320)',
      paradas_local: 6,
      paradas_visitante: 5,
      amarillas_local: 1,
      amarillas_visitante: 2,
      rojas_local: 0,
      rojas_visitante: 0
    },
    events: [
      { minuto: 12, tipo: 'gol', jugador: 'Lautaro Martínez', equipo: 'local', descripcion: 'Cabezazo potente al primer palo' },
      { minuto: 34, tipo: 'gol', jugador: 'Ousmane Dembélé', equipo: 'visitante', descripcion: 'Veloz incursión por banda y definición cruzada' },
      { minuto: 61, tipo: 'gol', jugador: 'Marcus Thuram', equipo: 'local', descripcion: 'Zurdazo a la media vuelta dentro del área' },
      { minuto: 77, tipo: 'gol', jugador: 'Bradley Barcola', equipo: 'visitante', descripcion: 'Tiro ajustado tras pared rápida' }
    ]
  },
  {
    id: 6,
    round: 'octavos',
    roundName: 'Octavos de Final',
    branch: 'right',
    slotIndex: 1,
    dateStr: 'Viernes 31/10/2026',
    timeStr: '16:00h',
    venue: 'IES Dr. Lluís Simarro',
    status: 'pendiente',
    local: { player: TOURNAMENT_PLAYERS.u11, club: TOURNAMENT_CLUBS.milan, score: 0 },
    visitante: { player: TOURNAMENT_PLAYERS.u12, club: TOURNAMENT_CLUBS.juventus, score: 0 },
    winnerPlayerId: null,
    nextMatchId: 11,
    referee: 'Juez_Simarro',
    stats: {
      remates_local: 0,
      remates_visitante: 0,
      remates_puerta_local: 0,
      remates_puerta_visitante: 0,
      corners_local: 0,
      corners_visitante: 0,
      posesion_local: 50,
      posesion_visitante: 50,
      faltas_local: 0,
      faltas_visitante: 0,
      pases_local: '0%',
      pases_visitante: '0%',
      paradas_local: 0,
      paradas_visitante: 0,
      amarillas_local: 0,
      amarillas_visitante: 0,
      rojas_local: 0,
      rojas_visitante: 0
    },
    events: []
  },
  {
    id: 7,
    round: 'octavos',
    roundName: 'Octavos de Final',
    branch: 'right',
    slotIndex: 2,
    dateStr: 'Viernes 31/10/2026',
    timeStr: '16:45h',
    venue: 'IES Dr. Lluís Simarro',
    status: 'finalizado',
    local: { player: TOURNAMENT_PLAYERS.u13, club: TOURNAMENT_CLUBS.dortmund, score: 2 },
    visitante: { player: TOURNAMENT_PLAYERS.u14, club: TOURNAMENT_CLUBS.chelsea, score: 3 },
    winnerPlayerId: 'u14',
    nextMatchId: 12,
    referee: 'Juez_Simarro',
    stats: {
      remates_local: 14,
      remates_visitante: 16,
      remates_puerta_local: 7,
      remates_puerta_visitante: 9,
      corners_local: 3,
      corners_visitante: 5,
      posesion_local: 46,
      posesion_visitante: 54,
      faltas_local: 7,
      faltas_visitante: 4,
      pases_local: '81% (260)',
      pases_visitante: '88% (330)',
      paradas_local: 6,
      paradas_visitante: 5,
      amarillas_local: 2,
      amarillas_visitante: 0,
      rojas_local: 0,
      rojas_visitante: 0
    },
    events: [
      { minuto: 9, tipo: 'gol', jugador: 'Serhou Guirassy', equipo: 'local', descripcion: 'Cabezazo inapelable tras centro medido' },
      { minuto: 28, tipo: 'gol', jugador: 'Cole Palmer', equipo: 'visitante', descripcion: 'Disparo con efecto directo a la escuadra' },
      { minuto: 44, tipo: 'gol', jugador: 'Nicolas Jackson', equipo: 'visitante', descripcion: 'Remate cruzado raso ante la salida del arquero' },
      { minuto: 65, tipo: 'penalti', jugador: 'Julian Brandt', equipo: 'local', descripcion: 'Gol de penalti con frialdad al centro' },
      { minuto: 86, tipo: 'gol', jugador: 'Christopher Nkunku', equipo: 'visitante', descripcion: 'Toque sutil al palo largo para dar la victoria' }
    ]
  },
  {
    id: 8,
    round: 'octavos',
    roundName: 'Octavos de Final',
    branch: 'right',
    slotIndex: 3,
    dateStr: 'Viernes 31/10/2026',
    timeStr: '16:45h',
    venue: 'IES Dr. Lluís Simarro',
    status: 'pendiente',
    local: { player: TOURNAMENT_PLAYERS.u15, club: TOURNAMENT_CLUBS.villarreal, score: 0 },
    // Hueco libre (seed 11): lo ocupará el jugador que se registre.
    visitante: null,
    winnerPlayerId: null,
    nextMatchId: 12,
    referee: 'Juez_Simarro',
    stats: {
      remates_local: 0,
      remates_visitante: 0,
      remates_puerta_local: 0,
      remates_puerta_visitante: 0,
      corners_local: 0,
      corners_visitante: 0,
      posesion_local: 50,
      posesion_visitante: 50,
      faltas_local: 0,
      faltas_visitante: 0,
      pases_local: '0%',
      pases_visitante: '0%',
      paradas_local: 0,
      paradas_visitante: 0,
      amarillas_local: 0,
      amarillas_visitante: 0,
      rojas_local: 0,
      rojas_visitante: 0
    },
    events: []
  },

  // ==========================================
  // CUARTOS DE FINAL - RAMA IZQUIERDA (9 - 10)
  // Sede: IES Dr. Lluís Simarro
  // ==========================================
  {
    id: 9,
    round: 'cuartos',
    roundName: 'Cuartos de Final',
    branch: 'left',
    slotIndex: 0,
    dateStr: 'Viernes 31/10/2026',
    timeStr: '17:45h',
    venue: 'IES Dr. Lluís Simarro',
    status: 'en_curso',
    liveMinute: 68,
    local: { player: TOURNAMENT_PLAYERS.u1, club: TOURNAMENT_CLUBS.valencia, score: 2 },
    visitante: { player: TOURNAMENT_PLAYERS.u3, club: TOURNAMENT_CLUBS.barcelona, score: 1 },
    winnerPlayerId: null,
    nextMatchId: 13,
    referee: 'Juez_Simarro',
    stats: {
      remates_local: 14,
      remates_visitante: 9,
      remates_puerta_local: 8,
      remates_puerta_visitante: 4,
      corners_local: 5,
      corners_visitante: 2,
      posesion_local: 58,
      posesion_visitante: 42,
      faltas_local: 4,
      faltas_visitante: 7,
      pases_local: '88% (342)',
      pases_visitante: '81% (268)',
      paradas_local: 3,
      paradas_visitante: 6,
      amarillas_local: 1,
      amarillas_visitante: 2,
      rojas_local: 0,
      rojas_visitante: 0
    },
    events: [
      { minuto: 14, tipo: 'gol', jugador: 'Hugo Duro', equipo: 'local', descripcion: 'Zapatazo cruzado al primer toque' },
      { minuto: 39, tipo: 'gol', jugador: 'Lamine Yamal', equipo: 'visitante', descripcion: 'Golazo de rosca buscando el palo largo' },
      { minuto: 68, tipo: 'penalti', jugador: 'Pepelu', equipo: 'local', descripcion: 'Pena máxima transformada engañando al meta' }
    ]
  },
  {
    id: 10,
    round: 'cuartos',
    roundName: 'Cuartos de Final',
    branch: 'left',
    slotIndex: 1,
    dateStr: 'Viernes 31/10/2026',
    timeStr: '17:45h',
    venue: 'IES Dr. Lluís Simarro',
    status: 'pendiente',
    local: { player: TOURNAMENT_PLAYERS.u5, club: TOURNAMENT_CLUBS.mancity, score: 0 },
    visitante: { player: TOURNAMENT_PLAYERS.u7, club: TOURNAMENT_CLUBS.bayern, score: 0 },
    winnerPlayerId: null,
    nextMatchId: 13,
    referee: 'Juez_Simarro',
    stats: {
      remates_local: 0,
      remates_visitante: 0,
      remates_puerta_local: 0,
      remates_puerta_visitante: 0,
      corners_local: 0,
      corners_visitante: 0,
      posesion_local: 50,
      posesion_visitante: 50,
      faltas_local: 0,
      faltas_visitante: 0,
      pases_local: '0%',
      pases_visitante: '0%',
      paradas_local: 0,
      paradas_visitante: 0,
      amarillas_local: 0,
      amarillas_visitante: 0,
      rojas_local: 0,
      rojas_visitante: 0
    },
    events: []
  },

  // ==========================================
  // CUARTOS DE FINAL - RAMA DERECHA (11 - 12)
  // Sede: IES Dr. Lluís Simarro
  // ==========================================
  {
    id: 11,
    round: 'cuartos',
    roundName: 'Cuartos de Final',
    branch: 'right',
    slotIndex: 0,
    dateStr: 'Viernes 31/10/2026',
    timeStr: '18:15h',
    venue: 'IES Dr. Lluís Simarro',
    status: 'pendiente',
    local: null,
    visitante: null,
    winnerPlayerId: null,
    nextMatchId: 14,
    referee: 'Juez_Simarro',
    stats: {
      remates_local: 0,
      remates_visitante: 0,
      remates_puerta_local: 0,
      remates_puerta_visitante: 0,
      corners_local: 0,
      corners_visitante: 0,
      posesion_local: 50,
      posesion_visitante: 50,
      faltas_local: 0,
      faltas_visitante: 0,
      pases_local: '0%',
      pases_visitante: '0%',
      paradas_local: 0,
      paradas_visitante: 0,
      amarillas_local: 0,
      amarillas_visitante: 0,
      rojas_local: 0,
      rojas_visitante: 0
    },
    events: []
  },
  {
    id: 12,
    round: 'cuartos',
    roundName: 'Cuartos de Final',
    branch: 'right',
    slotIndex: 1,
    dateStr: 'Viernes 31/10/2026',
    timeStr: '18:15h',
    venue: 'IES Dr. Lluís Simarro',
    status: 'pendiente',
    local: { player: TOURNAMENT_PLAYERS.u14, club: TOURNAMENT_CLUBS.chelsea, score: 0 },
    // El rival sale del partido 8 (Sergi Gisbert vs Jugador 16). No se rellena hasta simular.
    visitante: null,
    winnerPlayerId: null,
    nextMatchId: 14,
    referee: 'Juez_Simarro',
    stats: {
      remates_local: 0,
      remates_visitante: 0,
      remates_puerta_local: 0,
      remates_puerta_visitante: 0,
      corners_local: 0,
      corners_visitante: 0,
      posesion_local: 50,
      posesion_visitante: 50,
      faltas_local: 0,
      faltas_visitante: 0,
      pases_local: '0%',
      pases_visitante: '0%',
      paradas_local: 0,
      paradas_visitante: 0,
      amarillas_local: 0,
      amarillas_visitante: 0,
      rojas_local: 0,
      rojas_visitante: 0
    },
    events: []
  },

  // ==========================================
  // SEMIFINALES (13 - 14)
  // Sede: IES Dr. Lluís Simarro
  // ==========================================
  {
    id: 13,
    round: 'semis',
    roundName: 'Semifinal 1',
    branch: 'left',
    slotIndex: 0,
    dateStr: 'Viernes 31/10/2026',
    timeStr: '19:00h',
    venue: 'IES Dr. Lluís Simarro',
    status: 'pendiente',
    local: null,
    visitante: null,
    winnerPlayerId: null,
    nextMatchId: 15,
    referee: 'Juez_Simarro',
    stats: {
      remates_local: 0,
      remates_visitante: 0,
      remates_puerta_local: 0,
      remates_puerta_visitante: 0,
      corners_local: 0,
      corners_visitante: 0,
      posesion_local: 50,
      posesion_visitante: 50,
      faltas_local: 0,
      faltas_visitante: 0,
      pases_local: '0%',
      pases_visitante: '0%',
      paradas_local: 0,
      paradas_visitante: 0,
      amarillas_local: 0,
      amarillas_visitante: 0,
      rojas_local: 0,
      rojas_visitante: 0
    },
    events: []
  },
  {
    id: 14,
    round: 'semis',
    roundName: 'Semifinal 2',
    branch: 'right',
    slotIndex: 0,
    dateStr: 'Viernes 31/10/2026',
    timeStr: '19:15h',
    venue: 'IES Dr. Lluís Simarro',
    status: 'pendiente',
    local: null,
    visitante: null,
    winnerPlayerId: null,
    nextMatchId: 15,
    referee: 'Juez_Simarro',
    stats: {
      remates_local: 0,
      remates_visitante: 0,
      remates_puerta_local: 0,
      remates_puerta_visitante: 0,
      corners_local: 0,
      corners_visitante: 0,
      posesion_local: 50,
      posesion_visitante: 50,
      faltas_local: 0,
      faltas_visitante: 0,
      pases_local: '0%',
      pases_visitante: '0%',
      paradas_local: 0,
      paradas_visitante: 0,
      amarillas_local: 0,
      amarillas_visitante: 0,
      rojas_local: 0,
      rojas_visitante: 0
    },
    events: []
  },

  // ==========================================
  // LA GRAN FINAL (15) - CASTELL DE XÀTIVA
  // Viernes 31 de Octubre a las 20:00 h
  // ==========================================
  {
    id: 15,
    round: 'final',
    roundName: 'La Gran Final',
    branch: 'center',
    slotIndex: 0,
    dateStr: 'Viernes 31/10/2026',
    timeStr: '20:00h',
    venue: 'Castell de Xàtiva',
    status: 'pendiente',
    local: null,
    visitante: null,
    winnerPlayerId: null,
    nextMatchId: null,
    referee: 'Juez_Simarro & Comité Xàtiva Esports',
    stats: {
      remates_local: 0,
      remates_visitante: 0,
      remates_puerta_local: 0,
      remates_puerta_visitante: 0,
      corners_local: 0,
      corners_visitante: 0,
      posesion_local: 50,
      posesion_visitante: 50,
      faltas_local: 0,
      faltas_visitante: 0,
      pases_local: '0%',
      pases_visitante: '0%',
      paradas_local: 0,
      paradas_visitante: 0,
      amarillas_local: 0,
      amarillas_visitante: 0,
      rojas_local: 0,
      rojas_visitante: 0
    },
    events: []
  }
];
