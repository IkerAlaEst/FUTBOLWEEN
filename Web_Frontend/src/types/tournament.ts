export type MatchRound = 1 | 2 | 3 | 4;

export type MatchStatus = 'pendiente' | 'en_curso' | 'finalizado';

export type MatchLocation = 'aula' | 'castell';

export interface TournamentMatch {
  id: number; // 1-8 Octavos, 9-12 Cuartos, 13-14 Semis, 15 Gran Final
  ronda: MatchRound;
  ronda_nombre: string;
  ubicacion: MatchLocation;
  
  // Jugador Local
  jugador_local_id: string | null;
  jugador_local_nombre: string;
  jugador_local_club?: string;
  goles_local: number;

  // Jugador Visitante
  jugador_visitante_id: string | null;
  jugador_visitante_nombre: string;
  jugador_visitante_club?: string;
  goles_visitante: number;

  estado: MatchStatus;
  ganador_id: string | null;
  arbitro_id: string | null;
  arbitro_nombre?: string;
  siguiente_partido_id: number | null;
  
  // Incidencias o actas de arbitraje
  incidencias?: string;
  updated_at?: string;
}

export interface UpdateScorePayload {
  match_id: number;
  goles_local: number;
  goles_visitante: number;
  estado?: MatchStatus;
  ganador_id?: string | null;
  incidencias?: string;
}
