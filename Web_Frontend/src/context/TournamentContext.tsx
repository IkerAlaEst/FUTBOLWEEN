import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TournamentMatch, UpdateScorePayload } from '../types/tournament';
import { UserProfile } from '../types/user';
import { matchService } from '../services/matchService';
import { playerService } from '../services/playerService';

interface TournamentContextType {
  matches: TournamentMatch[];
  players: UserProfile[];
  loading: boolean;
  updateScore: (payload: UpdateScorePayload) => Promise<void>;
  resetTournament: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const TournamentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [players, setPlayers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [loadedMatches, loadedPlayers] = await Promise.all([
        matchService.getMatches(),
        playerService.getPlayers()
      ]);
      setMatches(loadedMatches);
      setPlayers(loadedPlayers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateScore = async (payload: UpdateScorePayload) => {
    const updated = await matchService.updateMatch(payload);
    setMatches([...updated]);
  };

  const resetTournament = async () => {
    const reset = await matchService.resetBracket();
    setMatches([...reset]);
  };

  return (
    <TournamentContext.Provider
      value={{
        matches,
        players,
        loading,
        updateScore,
        resetTournament,
        refreshData: loadData
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = (): TournamentContextType => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament debe usarse dentro de TournamentProvider');
  }
  return context;
};

