import React from 'react';
import { BracketMatch } from '../../data/tournamentBracketData';
import { ClubShield } from './ClubShield';
import { useTheme } from '../../context/ThemeContext';
import { Trophy, Check, Clock, Play } from 'lucide-react';

interface MatchCardProps {
  match: BracketMatch;
  onSelect: (match: BracketMatch) => void;
  isCenterFinal?: boolean;
  /** Solo lo pasan los árbitros: muestra el botón de simular el partido. */
  onArbitrate?: (match: BracketMatch) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onSelect,
  isCenterFinal = false,
  onArbitrate,
}) => {
  const { isLight } = useTheme();

  const isLive = match.status === 'en_curso';
  const isFinished = match.status === 'finalizado';
  const isPending = match.status === 'pendiente';

  const local = match.local;
  const visit = match.visitante;

  const isLocalWinner = isFinished && match.winnerPlayerId && local && match.winnerPlayerId === local.player.id;
  const isVisitWinner = isFinished && match.winnerPlayerId && visit && match.winnerPlayerId === visit.player.id;

  return (
    <div
      className={`b-match-card ${isLive ? 'is-live' : ''} ${isCenterFinal ? 'is-final' : ''} ${
        isFinished ? 'is-finished' : 'is-pending'
      }`}
      onClick={() => onSelect(match)}
      role="button"
      tabIndex={0}
      title="Clic para ver acta oficial y estadísticas completas del partido"
    >
      {/* Barra superior de la tarjeta */}
      <div className="b-card-header">
        <span className="b-match-num">
          <b>#{match.id}</b>
        </span>

        {isLive && (
          <span className="b-live-badge">
            <span className="live-dot" />
            <span>VIVO {match.liveMinute}'</span>
          </span>
        )}

        {isFinished && (
          <span className="b-finished-badge">
            <Check size={9} style={{ display: 'inline', marginRight: 2 }} />
            <span>FINAL</span>
          </span>
        )}

        {isPending && (
          <span className="b-pending-badge">
            <Clock size={9} style={{ display: 'inline', marginRight: 2 }} />
            <span>{match.timeStr}</span>
          </span>
        )}
      </div>

      {/* Fila Participante Local */}
      <div
        className={`b-participant-row local ${isLocalWinner ? 'is-winner' : ''} ${
          isVisitWinner ? 'is-loser' : ''
        }`}
      >
        <div className="b-player-group">
          <ClubShield club={local?.club} size={20} />
          <div className="b-name-block">
            <span className="b-gamertag">
              {local ? local.player.gamertag : <span className="b-tbd">Por determinar</span>}
            </span>
          </div>
        </div>

        <div className="b-score-box">
          {isLocalWinner && (
            <span title="Ganador">
              <Trophy size={11} className="b-winner-trophy" />
            </span>
          )}
          <span className={`b-score-val ${isLocalWinner ? 'b-winner-val' : ''}`}>
            {isFinished || isLive ? local?.score : '-'}
          </span>
        </div>
      </div>

      {/* Fila Participante Visitante */}
      <div
        className={`b-participant-row visitante ${isVisitWinner ? 'is-winner' : ''} ${
          isLocalWinner ? 'is-loser' : ''
        }`}
      >
        <div className="b-player-group">
          <ClubShield club={visit?.club} size={20} />
          <div className="b-name-block">
            <span className="b-gamertag">
              {visit ? visit.player.gamertag : <span className="b-tbd">Por determinar</span>}
            </span>
          </div>
        </div>

        <div className="b-score-box">
          {isVisitWinner && (
            <span title="Ganador">
              <Trophy size={11} className="b-winner-trophy" />
            </span>
          )}
          <span className={`b-score-val ${isVisitWinner ? 'b-winner-val' : ''}`}>
            {isFinished || isLive ? visit?.score : '-'}
          </span>
        </div>
      </div>

      {onArbitrate && !isFinished && match.local && match.visitante && (
        <button
          type="button"
          className="b-arbitrar-btn"
          title="Pitar y simular este partido"
          onClick={e => {
            e.stopPropagation();
            onArbitrate(match);
          }}
        >
          <Play size={11} /> Arbitrar partido
        </button>
      )}
    </div>
  );
};
