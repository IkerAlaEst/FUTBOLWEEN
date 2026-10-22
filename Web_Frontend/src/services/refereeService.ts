import { RefereeProfile, STATIC_REFEREES } from '../data/refereesData';
import { isSupabaseConfigured, requireSupabase } from './supabase';

interface RefereeRow {
  id: string;
  referee_slot: number | null;
  gamertag: string;
  nombre_completo: string;
  avatar_url: string | null;
  zona: string | null;
  player_number: number | null;
}

/**
 * Árbitros oficiales:
 *   · 3 insertados por `continuar.sql`.
 *   · 1 plaza para el árbitro que se registre (referee_slot 4).
 */
export const refereeService = {
  async getReferees(): Promise<RefereeProfile[]> {
    if (!isSupabaseConfigured) return STATIC_REFEREES;

    try {
      const client = requireSupabase();
      const { data, error } = await client
        .from('vista_arbitros')
        .select('*')
        .order('referee_slot', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return STATIC_REFEREES;

      return (data as RefereeRow[])
        .filter(row => row.referee_slot !== null)
        .map(row => ({
          id: row.id,
          slot: row.referee_slot as number,
          gamertag: row.gamertag,
          fullName: row.nombre_completo,
          avatar: row.avatar_url || '',
          zona:
            row.zona === 'Castillo' ? 'Castillo' : 'Aula de informática',
          playerNumber: row.referee_slot ?? row.player_number ?? 4
        }));
    } catch (error) {
      console.warn('No se pudieron cargar los árbitros desde Supabase:', error);
      return STATIC_REFEREES;
    }
  }
};
