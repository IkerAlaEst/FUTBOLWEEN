import {
  BracketMatch,
  MatchEvent,
  MatchStats,
  TournamentClub,
  TOURNAMENT_CLUBS,
  TOURNAMENT_PLAYERS,
  INITIAL_BRACKET_MATCHES
} from '../data/tournamentBracketData';
import {
  ExtendedPlayer,
  ControllerType,
  CONTROLLER_IMAGES,
  CONTROLLER_LABELS,
  PLAYER_REAL_PHOTOS,
  getExtendedPlayers,
  getPlayerMatchesInfo,
  PlayerMatchInfo
} from '../data/tournamentPlayersExtended';
import { isSupabaseConfigured, requireSupabase } from './supabase';
import { getLocalSimulations } from './simulationService';

/**
 * Cuadro del torneo:
 *   · Lado izquierdo (partidos 1-4, 9, 10 y 13) y jugadores u1-u8 → estático.
 *   · Lado derecho (partidos 5-8, 11, 12, 14 y 15) y jugadores 9-15 → Supabase.
 *   · Hueco libre: seed 11, lo ocupa el jugador que se registre.
 *
 * Si Supabase no está configurado se devuelve el cuadro estático completo
 * (15 jugadores + hueco), para que la app siga funcionando en local.
 */

export const TOURNAMENT_SLOTS = 16;
export const EMPTY_SLOT_SEED = 11;

const STATIC_PLAYER_IDS = new Set(['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8']);

interface DbPlayer {
  id: string;
  seed: number;
  gamertag: string;
  nombre_completo: string;
  avatar_url: string | null;
  club_nombre: string | null;
  club_short: string | null;
  club_badge: string | null;
  club_color: string | null;
  club_color2: string | null;
  club_stadium: string | null;
  liga: string | null;
  tipo_mando: string | null;
  player_number: number | null;
  matches_played: number | null;
  goals_scored: number | null;
  goals_conceded: number | null;
  is_eliminated: boolean | null;
  created_at: string | null;
}

interface DbMatch {
  id: number;
  ronda: number;
  ronda_nombre: string;
  branch: 'left' | 'right' | 'center';
  slot_index: number;
  ubicacion: 'aula' | 'castell';
  fecha: string;
  hora: string;
  estado: 'pendiente' | 'en_curso' | 'finalizado';
  live_minute: number | null;
  goles_local: number;
  goles_visitante: number;
  ganador_id: string | null;
  siguiente_partido_id: number | null;
  arbitro_nombre: string | null;
  estadisticas: Partial<MatchStats> | null;
  eventos: MatchEvent[] | null;
  jugador_local_id: string | null;
  jugador_visitante_id: string | null;
}

function emptyStats(): MatchStats {
  return {
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
  };
}

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '31/10/2026';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${WEEKDAYS[date.getDay()]} ${day}/${month}/${date.getFullYear()}`;
}

function formatTime(value: string): string {
  return `${value.slice(0, 5)}h`;
}

function normalizeController(value: string | null): ControllerType {
  if (value === 'xbox') return 'xbox';
  if (value === 'centro') return 'centro';
  return 'ps5';
}

export function clubFromDbPlayer(player: DbPlayer): TournamentClub {
  const byName = Object.values(TOURNAMENT_CLUBS).find(
    club => club.name.toLowerCase() === (player.club_nombre ?? '').toLowerCase()
  );

  return {
    id: byName?.id ?? (player.club_short ?? 'custom').toLowerCase(),
    name: player.club_nombre ?? byName?.name ?? 'Sin club',
    shortName: player.club_short ?? byName?.shortName ?? 'CLB',
    badge: player.club_badge ?? byName?.badge ?? '',
    primaryColor: player.club_color ?? byName?.primaryColor ?? '#ff5e00',
    secondaryColor: player.club_color2 ?? byName?.secondaryColor ?? '#ffffff',
    stadium: player.club_stadium ?? byName?.stadium ?? 'Xàtiva'
  };
}

function dbPlayerToExtended(player: DbPlayer, matches: BracketMatch[]): ExtendedPlayer {
  const club = clubFromDbPlayer(player);
  const tipoMando = normalizeController(player.tipo_mando);

  const playerMatches = matches.filter(
    match =>
      match.local?.player.id === player.id || match.visitante?.player.id === player.id
  );

  const isLive = playerMatches.some(match => match.status === 'en_curso');
  const hasLost = playerMatches.some(
    match =>
      match.status === 'finalizado' &&
      match.winnerPlayerId !== null &&
      match.winnerPlayerId !== player.id
  );
  const hasWon = playerMatches.some(
    match => match.status === 'finalizado' && match.winnerPlayerId === player.id
  );

  let status: ExtendedPlayer['status'] = 'programado';
  let statusLabel = 'EN ESPERA';

  if (isLive) {
    status = 'en_curso';
    statusLabel = 'EN DIRECTO';
  } else if (hasLost || player.is_eliminated) {
    status = 'eliminado';
    statusLabel = 'OCTAVOS';
  } else if (hasWon) {
    status = 'clasificado';
    statusLabel = 'CLASIFICADO';
  }

  const goalsScored = player.goals_scored ?? 0;
  const goalsConceded = player.goals_conceded ?? 0;

  return {
    id: player.id,
    gamertag: player.gamertag,
    fullName: player.nombre_completo,
    seed: player.seed,
    club,
    tipoMando,
    mandoLabel: CONTROLLER_LABELS[tipoMando],
    mandoImage: CONTROLLER_IMAGES[tipoMando],
    avatar:
      player.avatar_url ||
      PLAYER_REAL_PHOTOS[player.id] ||
      '',
    matchesPlayed:
      player.matches_played ??
      playerMatches.filter(match => match.status !== 'pendiente').length,
    goalsScored,
    goalsConceded,
    goalDifference: goalsScored - goalsConceded,
    isEliminated: hasLost || Boolean(player.is_eliminated),
    isLive,
    status,
    statusLabel
  };
}

function dbMatchToBracket(row: DbMatch, playersById: Map<string, DbPlayer>): BracketMatch {
  const round: BracketMatch['round'] =
    row.ronda === 1 ? 'octavos' : row.ronda === 2 ? 'cuartos' : row.ronda === 3 ? 'semis' : 'final';

  const buildParticipant = (
    playerId: string | null,
    score: number
  ): BracketMatch['local'] => {
    if (!playerId) return null;
    const player = playersById.get(playerId);
    if (!player) return null;
    const club = clubFromDbPlayer(player);
    return {
      player: {
        id: player.id,
        gamertag: player.gamertag,
        fullName: player.nombre_completo,
        clubId: club.id,
        seed: player.seed
      },
      club,
      score
    };
  };

  return {
    id: row.id,
    round,
    roundName: row.ronda_nombre,
    branch: row.branch,
    slotIndex: row.slot_index,
    dateStr: formatDate(row.fecha),
    timeStr: formatTime(row.hora),
    venue: row.ubicacion === 'castell' ? 'Castell de Xàtiva' : 'IES Dr. Lluís Simarro',
    status: row.estado,
    liveMinute: row.live_minute ?? undefined,
    local: buildParticipant(row.jugador_local_id, row.goles_local),
    visitante: buildParticipant(row.jugador_visitante_id, row.goles_visitante),
    winnerPlayerId: row.ganador_id,
    referee: row.arbitro_nombre ?? 'Juez_Simarro',
    nextMatchId: row.siguiente_partido_id,
    inDatabase: true,
    stats: { ...emptyStats(), ...(row.estadisticas ?? {}) },
    events: Array.isArray(row.eventos) ? row.eventos : []
  };
}

async function fetchDbPlayers(): Promise<DbPlayer[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('vista_jugadores')
    .select('*')
    .order('seed', { ascending: true });

  if (error) throw error;
  return (data ?? []) as DbPlayer[];
}

async function fetchDbMatches(): Promise<DbMatch[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('vista_clasificacion')
    .select('*')
    .order('id', { ascending: true });

  if (error) throw error;
  return (data ?? []) as DbMatch[];
}

function applyBracketOverrides(baseMatches: BracketMatch[]): BracketMatch[] {
  const matches = baseMatches.map(m => ({
    ...m,
    local: m.local ? { ...m.local, player: { ...m.local.player }, club: { ...m.local.club } } : null,
    visitante: m.visitante ? { ...m.visitante, player: { ...m.visitante.player }, club: { ...m.visitante.club } } : null,
    stats: { ...m.stats },
    events: [...m.events]
  }));
  const matchMap = new Map(matches.map(m => [m.id, m]));

  // 1. Asignar el 16º participante al partido 8 si no está ocupado
  const match8 = matchMap.get(8);
  if (match8 && !match8.visitante) {
    let p16Gamertag = 'VictorSpooky';
    let p16FullName = 'Víctor Micó';
    let p16Club = TOURNAMENT_CLUBS.tottenham;
    let p16Id = 'u16';

    try {
      const sessionRaw = localStorage.getItem('cf_user_session');
      if (sessionRaw) {
        const sessionUser = JSON.parse(sessionRaw);
        if (sessionUser && sessionUser.rol === 'jugador') {
          p16Id = sessionUser.id || 'u16';
          p16Gamertag = sessionUser.gamertag || p16Gamertag;
          p16FullName = sessionUser.nombre_completo || p16FullName;
          if (sessionUser.club_elegido) {
            const foundClub = Object.values(TOURNAMENT_CLUBS).find(
              c => c.name.toLowerCase() === sessionUser.club_elegido.toLowerCase()
            );
            if (foundClub) {
              p16Club = foundClub;
            } else {
              p16Club = {
                id: sessionUser.club_short?.toLowerCase() || 'custom',
                name: sessionUser.club_elegido,
                shortName: sessionUser.club_short || 'CUS',
                badge: sessionUser.club_badge || '',
                primaryColor: sessionUser.club_color || '#ff5e00',
                secondaryColor: sessionUser.club_color2 || '#ffffff',
                stadium: sessionUser.club_stadium || 'Xàtiva'
              };
            }
          }
        }
      }
    } catch {
      // Ignorar fallo de lectura local
    }

    match8.visitante = {
      player: {
        id: p16Id,
        gamertag: p16Gamertag,
        fullName: p16FullName,
        clubId: p16Club.id,
        seed: 11
      },
      club: p16Club,
      score: 0
    };
  }

  // 2. Aplicar simulaciones guardadas y promocionar ganadores a la siguiente ronda
  const localSims = getLocalSimulations();
  const simEntries = Object.entries(localSims).sort((a, b) => Number(a[0]) - Number(b[0]));

  for (const [, sim] of simEntries) {
    const m = matchMap.get(sim.matchId);
    if (!m) continue;

    m.status = 'finalizado';
    m.liveMinute = 90;
    m.winnerPlayerId = sim.ganadorId;
    m.stats = { ...emptyStats(), ...sim.estadisticas };
    m.events = sim.eventos;
    if (m.local) m.local.score = sim.golesLocal;
    if (m.visitante) m.visitante.score = sim.golesVisitante;

    const winnerParticipant = m.local?.player.id === sim.ganadorId ? m.local : m.visitante;
    if (winnerParticipant && m.nextMatchId) {
      const nextMatch = matchMap.get(m.nextMatchId);
      if (nextMatch) {
        const winnerClone = {
          player: { ...winnerParticipant.player },
          club: { ...winnerParticipant.club },
          score: 0
        };

        if (m.id % 2 === 1) {
          nextMatch.local = winnerClone;
        } else {
          nextMatch.visitante = winnerClone;
        }
      }
    }
  }

  return Array.from(matchMap.values()).sort((a, b) => a.id - b.id);
}

/** Cuadro completo: mitad estática del código + mitad de Supabase + simulaciones. */
export async function getMergedBracket(): Promise<BracketMatch[]> {
  if (!isSupabaseConfigured) {
    return applyBracketOverrides(INITIAL_BRACKET_MATCHES);
  }

  try {
    const [rows, players] = await Promise.all([fetchDbMatches(), fetchDbPlayers()]);
    if (!rows.length) return applyBracketOverrides(INITIAL_BRACKET_MATCHES);

    const playersById = new Map(players.map(player => [player.id, player]));
    const merged = new Map(INITIAL_BRACKET_MATCHES.map(match => [match.id, match]));

    rows.forEach(row => {
      merged.set(row.id, dbMatchToBracket(row, playersById));
    });

    const list = Array.from(merged.values()).sort((a, b) => a.id - b.id);
    return applyBracketOverrides(list);
  } catch (error) {
    console.warn('No se pudo cargar el cuadro desde Supabase:', error);
    return applyBracketOverrides(INITIAL_BRACKET_MATCHES);
  }
}

/** Jugadores: 8 estáticos + 7 de BBDD (+ el registrado si ya ocupó el hueco). */
export async function getMergedPlayers(): Promise<ExtendedPlayer[]> {
  const staticPlayers = getExtendedPlayers();
  if (!isSupabaseConfigured) return staticPlayers;

  try {
    const [dbPlayers, matches] = await Promise.all([
      fetchDbPlayers(),
      getMergedBracket()
    ]);

    if (!dbPlayers.length) return staticPlayers;

    const staticEight = staticPlayers.filter(player => STATIC_PLAYER_IDS.has(player.id));
    const dbExtended = dbPlayers
      .filter(player => Number.isInteger(player.seed))
      .map(player => dbPlayerToExtended(player, matches));

    return [...staticEight, ...dbExtended].sort((a, b) => a.seed - b.seed);
  } catch (error) {
    console.warn('No se pudieron cargar los jugadores desde Supabase:', error);
    return staticPlayers;
  }
}

/** Partidos de un jugador usando el cuadro ya mezclado. */
export function getMergedPlayerMatches(
  playerId: string,
  matches: BracketMatch[]
): PlayerMatchInfo[] {
  return getPlayerMatchesInfo(playerId, matches);
}
