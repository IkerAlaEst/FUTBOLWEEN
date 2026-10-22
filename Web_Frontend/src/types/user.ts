export type UserRole = 'jugador' | 'arbitro' | 'usuario' | 'admin';

export type ControllerType = 'ps4' | 'xbox' | 'teclado' | 'ps5' | 'centro';

export interface UserProfile {
  id: string;
  email: string;
  nombre_completo: string;
  gamertag: string;
  rol: UserRole;
  club_elegido?: string;
  club_badge?: string;
  club_short?: string;
  club_color?: string;
  club_color2?: string;
  club_stadium?: string;
  liga?: string;
  tipo_mando?: ControllerType;
  zona?: 'Aula de informática' | 'Castillo';
  player_number?: number;
  /** Posición 1-16 en el cuadro. El seed 11 es el hueco del jugador que se registra. */
  seed?: number;
  /** Plaza de árbitro 1-4 (solo rol arbitro). */
  referee_slot?: number;
  avatar_url?: string;
  bio?: string;
  created_at?: string;
  // Campos extra para mostrar en torneo / UI
  matches_played?: number;
  goals_scored?: number;
  goals_conceded?: number;
  is_eliminated?: boolean;
}

export interface RegisterJugadorPayload {
  email: string;
  pass: string;
  nombre_completo: string;
  gamertag: string;
  curso?: string;
  club_elegido: string;
  club_badge?: string;
  club_short?: string;
  club_color?: string;
  club_color2?: string;
  club_stadium?: string;
  liga?: string;
  tipo_mando: ControllerType;
  /** Foto de perfil elegida en el formulario (se sube al bucket `avatares`). */
  avatar_file?: File | null;
}

export interface RegisterUsuarioPayload {
  email: string;
  pass: string;
  nombre_completo: string;
  bio?: string;
  gamertag?: string;
  club_elegido?: string;
  club_badge?: string;
  club_short?: string;
  club_color?: string;
  club_color2?: string;
  club_stadium?: string;
  liga?: string;
  avatar_file?: File | null;
}

export interface RegisterArbitroPayload {
  email: string;
  pass: string;
  nombre_completo: string;
  /** Ya no se pide PIN: el árbitro solo se registra con nombre y foto. */
  pin?: string;
  zona?: 'Aula de informática' | 'Castillo';
  avatar_file?: File | null;
}

export interface LoginPayload {
  email: string;
  pass: string;
}
