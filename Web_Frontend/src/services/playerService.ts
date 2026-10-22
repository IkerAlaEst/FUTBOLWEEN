import { UserProfile, ControllerType, UserRole } from '../types/user';
import { INITIAL_PLAYERS } from './mockData';
import { STORAGE_KEYS } from '../config/constants';
import { isSupabaseConfigured, requireSupabase } from './supabase';

/**
 * Listado de jugadores.
 *   · Mitad izquierda del cuadro: 8 jugadores estáticos del código.
 *   · Mitad derecha: jugadores reales de la tabla `perfiles` de Supabase.
 */

const STATIC_IDS = new Set(['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8']);
const STATIC_PLAYERS = INITIAL_PLAYERS.filter(player => STATIC_IDS.has(player.id));
// El seed 11 es el hueco libre: no hay un 16º jugador precargado.
const LOCAL_PLAYERS = INITIAL_PLAYERS.filter(player => player.id !== 'u16');

interface PlayerRow {
  id: string;
  email: string | null;
  nombre_completo: string;
  gamertag: string;
  rol: string;
  avatar_url: string | null;
  bio: string | null;
  club_nombre: string | null;
  club_short: string | null;
  club_badge: string | null;
  club_color: string | null;
  club_color2: string | null;
  club_stadium: string | null;
  liga: string | null;
  tipo_mando: string | null;
  zona: string | null;
  player_number: number | null;
  seed: number | null;
  matches_played: number | null;
  goals_scored: number | null;
  goals_conceded: number | null;
  is_eliminated: boolean | null;
  created_at: string | null;
}

function mapPlayer(row: PlayerRow): UserProfile {
  return {
    id: row.id,
    email: row.email ?? '',
    nombre_completo: row.nombre_completo,
    gamertag: row.gamertag,
    rol: (row.rol as UserRole) ?? 'jugador',
    avatar_url: row.avatar_url ?? undefined,
    bio: row.bio ?? undefined,
    club_elegido: row.club_nombre ?? undefined,
    club_short: row.club_short ?? undefined,
    club_badge: row.club_badge ?? undefined,
    club_color: row.club_color ?? undefined,
    club_color2: row.club_color2 ?? undefined,
    club_stadium: row.club_stadium ?? undefined,
    liga: row.liga ?? undefined,
    tipo_mando: (row.tipo_mando as ControllerType | null) ?? undefined,
    zona: (row.zona as UserProfile['zona']) ?? undefined,
    player_number: row.player_number ?? undefined,
    seed: row.seed ?? undefined,
    matches_played: row.matches_played ?? 0,
    goals_scored: row.goals_scored ?? 0,
    goals_conceded: row.goals_conceded ?? 0,
    is_eliminated: row.is_eliminated ?? false,
    created_at: row.created_at ?? undefined
  };
}

export const playerService = {
  /**
   * Obtiene los jugadores inscritos: 8 estáticos + los de Supabase.
   */
  async getPlayers(): Promise<UserProfile[]> {
    if (!isSupabaseConfigured) {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.PLAYERS);
        if (stored) return JSON.parse(stored) as UserProfile[];
      } catch {
        // Fallback
      }
      return LOCAL_PLAYERS;
    }

    try {
      const client = requireSupabase();
      // La vista solo expone datos de torneo (sin emails ni user_id).
      const { data, error } = await client
        .from('vista_jugadores')
        .select('*')
        .order('seed', { ascending: true });

      if (error) throw error;

      const dbPlayers = ((data ?? []) as PlayerRow[]).map(mapPlayer);
      if (!dbPlayers.length) return LOCAL_PLAYERS;

      return [...STATIC_PLAYERS, ...dbPlayers];
    } catch (error) {
      console.warn('No se pudieron cargar los jugadores desde Supabase:', error);
      return LOCAL_PLAYERS;
    }
  },

  /**
   * Añade un jugador ficticio/manual a la tabla `perfiles`.
   * El registro real de usuarios pasa por Supabase Auth.
   */
  async addPlayer(player: UserProfile): Promise<UserProfile[]> {
    if (isSupabaseConfigured) {
      const client = requireSupabase();
      const { error } = await client.from('perfiles').insert({
        email: player.email,
        nombre_completo: player.nombre_completo,
        gamertag: player.gamertag,
        rol: player.rol,
        avatar_url: player.avatar_url,
        bio: player.bio,
        club_nombre: player.club_elegido,
        club_short: player.club_short,
        club_badge: player.club_badge,
        club_color: player.club_color,
        club_color2: player.club_color2,
        club_stadium: player.club_stadium,
        liga: player.liga,
        tipo_mando: player.tipo_mando,
        zona: player.zona,
        player_number: player.player_number,
        seed: player.seed
      });

      if (error) throw new Error(error.message);
      return this.getPlayers();
    }

    const players = await this.getPlayers();
    const updated = [...players, player];
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(updated));
    return updated;
  }
};
