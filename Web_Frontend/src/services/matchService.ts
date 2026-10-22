import { TournamentMatch, UpdateScorePayload, MatchStatus, MatchLocation } from '../types/tournament';
import { INITIAL_MATCHES } from './mockData';
import { STORAGE_KEYS } from '../config/constants';
import { isSupabaseConfigured, requireSupabase } from './supabase';

/**
 * Partidos del cuadro.
 *   · La mitad izquierda (1-4, 9, 10 y 13) sale de los datos estáticos.
 *   · La mitad derecha (5-8, 11, 12, 14 y 15) se lee de Supabase.
 *   · Los resultados del staff se guardan en la tabla `partidos`.
 */

interface MatchViewRow {
  id: number;
  ronda: number;
  ronda_nombre: string;
  ubicacion: MatchLocation;
  estado: MatchStatus;
  live_minute: number | null;
  goles_local: number;
  goles_visitante: number;
  ganador_id: string | null;
  siguiente_partido_id: number | null;
  arbitro_nombre: string | null;
  jugador_local_id: string | null;
  local_gamertag: string | null;
  local_club: string | null;
  jugador_visitante_id: string | null;
  visitante_gamertag: string | null;
  visitante_club: string | null;
}

function mapRow(row: MatchViewRow): TournamentMatch {
  return {
    id: row.id,
    ronda: (row.ronda as TournamentMatch['ronda']) ?? 1,
    ronda_nombre: row.ronda_nombre,
    ubicacion: row.ubicacion,
    jugador_local_id: row.jugador_local_id,
    jugador_local_nombre: row.local_gamertag ?? 'Por determinar',
    jugador_local_club: row.local_club ?? undefined,
    goles_local: row.goles_local,
    jugador_visitante_id: row.jugador_visitante_id,
    jugador_visitante_nombre: row.visitante_gamertag ?? 'Por determinar',
    jugador_visitante_club: row.visitante_club ?? undefined,
    goles_visitante: row.goles_visitante,
    estado: row.estado,
    ganador_id: row.ganador_id,
    arbitro_id: null,
    arbitro_nombre: row.arbitro_nombre ?? undefined,
    siguiente_partido_id: row.siguiente_partido_id
  };
}

export const matchService = {
  /**
   * Obtiene todos los partidos: estáticos + Supabase.
   */
  async getMatches(): Promise<TournamentMatch[]> {
    if (isSupabaseConfigured) {
      try {
        const client = requireSupabase();
        const { data, error } = await client
          .from('vista_clasificacion')
          .select('*')
          .order('id', { ascending: true });

        if (error) throw error;

        if (data && data.length) {
          const merged = new Map(INITIAL_MATCHES.map(match => [match.id, match]));
          (data as MatchViewRow[]).forEach(row => merged.set(row.id, mapRow(row)));
          return Array.from(merged.values()).sort((a, b) => a.id - b.id);
        }
      } catch (error) {
        console.warn('No se pudieron cargar los partidos desde Supabase:', error);
      }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TOURNAMENT_MATCHES);
      if (stored) {
        return JSON.parse(stored) as TournamentMatch[];
      }
    } catch {
      // Fallback a inicial
    }

    localStorage.setItem(STORAGE_KEYS.TOURNAMENT_MATCHES, JSON.stringify(INITIAL_MATCHES));
    return INITIAL_MATCHES;
  },

  /**
   * Actualiza el marcador, acta e incidencias de un partido.
   * En Supabase el trigger `partidos_validar` promociona al ganador.
   */
  async updateMatch(payload: UpdateScorePayload): Promise<TournamentMatch[]> {
    if (isSupabaseConfigured) {
      const client = requireSupabase();
      const update: Record<string, unknown> = {
        goles_local: payload.goles_local,
        goles_visitante: payload.goles_visitante
      };

      if (payload.estado) update.estado = payload.estado;
      if (payload.incidencias !== undefined) update.incidencias = payload.incidencias;
      if (payload.ganador_id !== undefined) update.ganador_id = payload.ganador_id;

      // Si se finaliza sin ganador explícito, se deduce del marcador.
      if (payload.estado === 'finalizado' && !payload.ganador_id) {
        if (payload.goles_local === payload.goles_visitante) {
          throw new Error('Un partido finalizado no puede terminar en empate.');
        }

        const { data: row, error: rowError } = await client
          .from('partidos')
          .select('jugador_local_id, jugador_visitante_id')
          .eq('id', payload.match_id)
          .maybeSingle<{
            jugador_local_id: string | null;
            jugador_visitante_id: string | null;
          }>();

        if (rowError) throw new Error(rowError.message);

        if (row) {
          update.ganador_id =
            payload.goles_local > payload.goles_visitante
              ? row.jugador_local_id
              : row.jugador_visitante_id;
        }
      }

      const { data, error } = await client
        .from('partidos')
        .update(update)
        .eq('id', payload.match_id)
        .select('id');

      if (error) throw new Error(error.message);

      // Si el partido no existe en la BBDD (lado estático), se guarda en local.
      if (data && data.length > 0) {
        return this.getMatches();
      }
    }

    const matches = await this.getMatches();
    const index = matches.findIndex(m => m.id === payload.match_id);

    if (index === -1) {
      throw new Error(`Partido con id ${payload.match_id} no encontrado`);
    }

    const currentMatch = { ...matches[index] };
    currentMatch.goles_local = payload.goles_local;
    currentMatch.goles_visitante = payload.goles_visitante;

    if (payload.incidencias !== undefined) {
      currentMatch.incidencias = payload.incidencias;
    }

    if (payload.estado) {
      currentMatch.estado = payload.estado;
    }

    // Determinar ganador si está finalizado
    if (currentMatch.estado === 'finalizado') {
      let winnerId = payload.ganador_id;
      let winnerName = '';
      let winnerClub = '';

      if (!winnerId) {
        if (currentMatch.goles_local > currentMatch.goles_visitante) {
          winnerId = currentMatch.jugador_local_id;
          winnerName = currentMatch.jugador_local_nombre;
          winnerClub = currentMatch.jugador_local_club || '';
        } else if (currentMatch.goles_visitante > currentMatch.goles_local) {
          winnerId = currentMatch.jugador_visitante_id;
          winnerName = currentMatch.jugador_visitante_nombre;
          winnerClub = currentMatch.jugador_visitante_club || '';
        }
      } else {
        if (winnerId === currentMatch.jugador_local_id) {
          winnerName = currentMatch.jugador_local_nombre;
          winnerClub = currentMatch.jugador_local_club || '';
        } else {
          winnerName = currentMatch.jugador_visitante_nombre;
          winnerClub = currentMatch.jugador_visitante_club || '';
        }
      }

      currentMatch.ganador_id = winnerId || null;

      // Avance automático en el cuadro eliminatorio
      if (winnerId && currentMatch.siguiente_partido_id) {
        const nextIdx = matches.findIndex(m => m.id === currentMatch.siguiente_partido_id);
        if (nextIdx !== -1) {
          const nextMatch = { ...matches[nextIdx] };
          if (!nextMatch.jugador_local_id || nextMatch.jugador_local_id === winnerId) {
            nextMatch.jugador_local_id = winnerId;
            nextMatch.jugador_local_nombre = winnerName;
            nextMatch.jugador_local_club = winnerClub;
          } else {
            nextMatch.jugador_visitante_id = winnerId;
            nextMatch.jugador_visitante_nombre = winnerName;
            nextMatch.jugador_visitante_club = winnerClub;
          }
          matches[nextIdx] = nextMatch;
        }
      }
    }

    currentMatch.updated_at = new Date().toISOString();
    matches[index] = currentMatch;

    localStorage.setItem(STORAGE_KEYS.TOURNAMENT_MATCHES, JSON.stringify(matches));
    return matches;
  },

  /**
   * Reinicia el cuadro local. En Supabase se recargan los datos reales.
   */
  async resetBracket(): Promise<TournamentMatch[]> {
    if (isSupabaseConfigured) {
      return this.getMatches();
    }

    localStorage.setItem(STORAGE_KEYS.TOURNAMENT_MATCHES, JSON.stringify(INITIAL_MATCHES));
    return INITIAL_MATCHES;
  }
};
