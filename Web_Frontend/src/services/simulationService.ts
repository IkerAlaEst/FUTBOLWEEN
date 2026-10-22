import { MatchEvent, MatchStats } from '../data/tournamentBracketData';
import { isSupabaseConfigured, requireSupabase } from './supabase';

export interface SimulationPayload {
  matchId: number;
  golesLocal: number;
  golesVisitante: number;
  ganadorId: string;
  arbitroId: string;
  eventos: MatchEvent[];
  estadisticas: MatchStats;
}

const LOCAL_SIM_KEY = 'cf_bracket_simulations';

export function getLocalSimulations(): Record<number, SimulationPayload> {
  try {
    const raw = localStorage.getItem(LOCAL_SIM_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalSimulation(payload: SimulationPayload): void {
  try {
    const current = getLocalSimulations();
    current[payload.matchId] = payload;
    localStorage.setItem(LOCAL_SIM_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn('No se pudo guardar la simulación en localStorage:', err);
  }
}

/**
 * Guarda el acta simulada en `partidos` y en persistencia local.
 * Promociona al ganador a la siguiente ronda del cuadro.
 */
export async function saveSimulation(payload: SimulationPayload): Promise<void> {
  // Siempre guardar primero en persistencia local para asegurar avance en cualquier entorno
  saveLocalSimulation(payload);

  if (!isSupabaseConfigured) {
    return;
  }

  try {
    const client = requireSupabase();
    const { data, error } = await client
      .from('partidos')
      .update({
        goles_local: payload.golesLocal,
        goles_visitante: payload.golesVisitante,
        estado: 'finalizado',
        live_minute: 90,
        ganador_id: payload.ganadorId,
        arbitro_id: payload.arbitroId,
        eventos: payload.eventos,
        estadisticas: payload.estadisticas
      })
      .eq('id', payload.matchId)
      .select('id');

    if (error) {
      console.warn('Aviso: no se pudo sincronizar en Supabase, conservado en local:', error.message);
    }
  } catch (err) {
    console.warn('Aviso: excepción sincronizando en Supabase, conservado en local:', err);
  }
}
