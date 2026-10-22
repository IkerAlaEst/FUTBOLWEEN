import {
  TOURNAMENT_CLUBS,
  TOURNAMENT_PLAYERS,
  INITIAL_BRACKET_MATCHES,
  TournamentClub,
  BracketMatch
} from './tournamentBracketData';
import { INITIAL_PLAYERS } from '../services/mockData';

export type ControllerType = 'ps5' | 'xbox' | 'centro';

export interface ExtendedPlayer {
  id: string;
  gamertag: string;
  fullName: string;
  seed: number;
  club: TournamentClub;
  tipoMando: ControllerType;
  mandoLabel: string;
  mandoImage: string;
  avatar: string;
  matchesPlayed: number;
  goalsScored: number;
  goalsConceded: number;
  goalDifference: number;
  isEliminated: boolean;
  isLive: boolean;
  status: 'en_curso' | 'clasificado' | 'programado' | 'eliminado';
  statusLabel: string;
}

export interface PlayerMatchInfo {
  match: BracketMatch;
  roundName: string;
  dateStr: string;
  timeStr: string;
  venue: string;
  isLive: boolean;
  isFinished: boolean;
  isPending: boolean;
  playerScore: number;
  rivalScore: number;
  isWinner: boolean;
  rivalPlayer: {
    id: string;
    gamertag: string;
    fullName: string;
    club: TournamentClub;
    tipoMando: ControllerType;
    mandoLabel: string;
    mandoImage: string;
    avatar: string;
  } | null;
}

export const CONTROLLER_LABELS: Record<ControllerType, string> = {
  ps5: 'PS5 DualSense',
  xbox: 'Xbox Series X',
  centro: 'Mando Simarro / PC'
};

export const CONTROLLER_IMAGES: Record<ControllerType, string> = {
  ps5: '/ps4_mando.png',
  xbox: '/xbox_mando.png',
  centro: '/pc_1.png'
};

// Fotos reales de personas públicas (fotografías de perfil de alta calidad de personas reales)
export const PLAYER_REAL_PHOTOS: Record<string, string> = {
  u1: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80', // Marc Navarro (Valencia CF)
  u2: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', // Lucas García (Real Madrid)
  u3: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80', // Alejandro Torres (FC Barcelona)
  u4: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80', // Sara Martí (Atlético de Madrid)
  u5: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80', // Pau Ripoll (Man City)
  u6: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', // Clara Sanchis (Arsenal)
  u7: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80', // David Benavent (Bayern)
  u8: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80', // Enrique Moreno (Liverpool)
  u9: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80', // Mateo Calatayud (Inter)
  u10: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80', // Carla Ferri (PSG)
  u11: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80', // Guillem Pascual (AC Milan)
  u12: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&q=80', // Adrián Ribera (Juventus)
  u13: 'https://images.unsplash.com/photo-1534308143481-c55f00be8bd7?auto=format&fit=crop&w=400&q=80', // Joan Barberà (Dortmund)
  u14: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80', // Mireia Cerveró (Chelsea)
  u15: 'https://images.unsplash.com/photo-1528892952291-009c663ce843?auto=format&fit=crop&w=400&q=80', // Sergi Gisbert (Villarreal)
  u16: 'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=400&q=80'  // Víctor Micó (Tottenham)
};

export const getExtendedPlayers = (): ExtendedPlayer[] => {
  const players = Object.values(TOURNAMENT_PLAYERS).map(tp => {
    const mock = INITIAL_PLAYERS.find(p => p.id === tp.id);
    const club = TOURNAMENT_CLUBS[tp.clubId] || Object.values(TOURNAMENT_CLUBS)[0];
    const tipoMando: ControllerType = (mock?.tipo_mando as ControllerType) || 'ps5';
    
    // Partidos del jugador en el cuadro oficial
    const playerMatches = INITIAL_BRACKET_MATCHES.filter(
      m => m.local?.player.id === tp.id || m.visitante?.player.id === tp.id
    );

    const isLive = playerMatches.some(m => m.status === 'en_curso');
    const hasLost = playerMatches.some(
      m => m.status === 'finalizado' && m.winnerPlayerId && m.winnerPlayerId !== tp.id
    );
    const hasWon = playerMatches.some(
      m => m.status === 'finalizado' && m.winnerPlayerId === tp.id
    );

    let status: ExtendedPlayer['status'] = 'programado';
    let statusLabel = 'EN ESPERA';

    if (isLive) {
      status = 'en_curso';
      statusLabel = 'EN DIRECTO';
    } else if (hasLost) {
      status = 'eliminado';
      statusLabel = 'OCTAVOS';
    } else if (hasWon) {
      status = 'clasificado';
      statusLabel = 'CLASIFICADO';
    }

    const gf = mock?.goals_scored ?? 0;
    const gc = mock?.goals_conceded ?? 0;

    // Foto real o inicial si no tiene avatar asignado
    const avatar = PLAYER_REAL_PHOTOS[tp.id] || '';

    return {
      id: tp.id,
      gamertag: tp.gamertag,
      fullName: tp.fullName,
      seed: tp.seed,
      club,
      tipoMando,
      mandoLabel: CONTROLLER_LABELS[tipoMando],
      mandoImage: CONTROLLER_IMAGES[tipoMando],
      avatar,
      matchesPlayed: mock?.matches_played ?? playerMatches.filter(m => m.status === 'finalizado' || m.status === 'en_curso').length,
      goalsScored: gf,
      goalsConceded: gc,
      goalDifference: gf - gc,
      isEliminated: hasLost,
      isLive,
      status,
      statusLabel
    };
  });

  // Ordenados estrictamente por SEED (1 al 16)
  return players.sort((a, b) => a.seed - b.seed);
};

export const getPlayerMatchesInfo = (
  playerId: string,
  bracketMatches: BracketMatch[] = INITIAL_BRACKET_MATCHES
): PlayerMatchInfo[] => {
  const matches = bracketMatches.filter(
    m => m.local?.player.id === playerId || m.visitante?.player.id === playerId
  );

  return matches.map(m => {
    const isLocal = m.local?.player.id === playerId;
    const currentParticipant = isLocal ? m.local : m.visitante;
    const rivalParticipant = isLocal ? m.visitante : m.local;

    const rivalMock = rivalParticipant ? INITIAL_PLAYERS.find(p => p.id === rivalParticipant.player.id) : null;
    const rivalController: ControllerType = (rivalMock?.tipo_mando as ControllerType) || 'ps5';

    const rivalPlayer = rivalParticipant
      ? {
          id: rivalParticipant.player.id,
          gamertag: rivalParticipant.player.gamertag,
          fullName: rivalParticipant.player.fullName,
          club: rivalParticipant.club,
          tipoMando: rivalController,
          mandoLabel: CONTROLLER_LABELS[rivalController],
          mandoImage: CONTROLLER_IMAGES[rivalController],
          avatar: PLAYER_REAL_PHOTOS[rivalParticipant.player.id] || ''
        }
      : null;

    const playerScore = currentParticipant ? currentParticipant.score : 0;
    const rivalScore = rivalParticipant ? rivalParticipant.score : 0;
    const isWinner = m.status === 'finalizado' && m.winnerPlayerId === playerId;

    return {
      match: m,
      roundName: m.roundName,
      dateStr: m.dateStr,
      timeStr: m.timeStr,
      venue: m.venue,
      isLive: m.status === 'en_curso',
      isFinished: m.status === 'finalizado',
      isPending: m.status === 'pendiente',
      playerScore,
      rivalScore,
      isWinner,
      rivalPlayer
    };
  });
};
