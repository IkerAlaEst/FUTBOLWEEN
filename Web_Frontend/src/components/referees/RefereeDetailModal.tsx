import React, { useEffect } from 'react';
import { RefereeProfile } from '../../data/refereesData';
import { BracketMatch } from '../../data/tournamentBracketData';
import { useTheme } from '../../context/ThemeContext';
import { navigateTo } from '../../hooks/useHashRoute';
import { CalendarDays, Clock, MapPin, Scale, Trophy, X } from 'lucide-react';

interface RefereeDetailModalProps {
  referee: RefereeProfile;
  matches: BracketMatch[];
  onClose: () => void;
}

export const RefereeDetailModal: React.FC<RefereeDetailModalProps> = ({
  referee,
  matches,
  onClose
}) => {
  const { isLight } = useTheme();
  const assigned = matches.filter(
    match => match.referee === referee.fullName || match.referee === referee.gamertag
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="player-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`player-modal-window ${isLight ? 'light-modal' : 'dark-modal'}`}
        onClick={event => event.stopPropagation()}
        style={{ maxWidth: '720px' }}
      >
        <div className="p-modal-hero">
          <button
            type="button"
            className="p-modal-close-icon"
            onClick={onClose}
            aria-label="Cerrar ficha del árbitro"
          >
            <X size={20} />
          </button>

          <div className="p-modal-hero-content">
            <div className="p-modal-avatar-box">
              <div className="p-modal-avatar-glow" style={{ borderColor: '#b69cff' }} />
              {referee.avatar ? (
                <img
                  src={referee.avatar}
                  alt={referee.fullName}
                  className="p-modal-avatar-img"
                  onError={e => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'grid';
                    }
                  }}
                />
              ) : null}
              <div
                className="p-modal-avatar-img"
                style={{
                  display: referee.avatar ? 'none' : 'grid',
                  placeItems: 'center',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #0d0614 100%)',
                  color: '#ffffff',
                  fontSize: '32px',
                  fontWeight: 800
                }}
              >
                {(referee.fullName || referee.gamertag || 'A').trim().charAt(0).toUpperCase()}
              </div>
              <span className="p-modal-seed-pill">ÁRBITRO #{referee.slot}</span>
            </div>

            <div className="p-modal-hero-meta">
              <div className="p-modal-badges-row">
                <span className="p-modal-status-badge clasificado">
                  <Scale size={11} style={{ display: 'inline', marginRight: 4 }} />
                  <span>ÁRBITRO OFICIAL</span>
                </span>
                <div className="p-modal-controller-badge">
                  <MapPin size={14} />
                  <span>{referee.zona}</span>
                </div>
              </div>

              <h2 className="p-modal-gamertag">{referee.gamertag}</h2>
              <span className="p-modal-fullname">{referee.fullName}</span>
            </div>
          </div>
        </div>

        <div className="p-modal-body">
          <h4 style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trophy size={16} style={{ color: '#fbbf24' }} />
            Partidos asignados ({assigned.length})
          </h4>

          {assigned.length === 0 ? (
            <div className="p-empty-state">
              <Clock size={30} style={{ opacity: 0.5, marginBottom: 8 }} />
              <p>Todavía no tiene partidos asignados. La organización se los asignará.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {assigned.map(match => (
                <div key={match.id} className="p-match-duel-card match-pending">
                  <div className="p-duel-header">
                    <div className="p-duel-round-tag">
                      <Trophy size={13} style={{ color: '#fbbf24' }} />
                      <strong>{match.roundName}</strong>
                      <span className="p-duel-num">Partido #{match.id}</span>
                    </div>
                    <div className="p-duel-schedule-tag">
                      <Clock size={13} />
                      <span>{match.timeStr}</span>
                      <span className="p-duel-dot">·</span>
                      <MapPin size={13} />
                      <span>{match.venue}</span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      padding: '8px 4px 2px'
                    }}
                  >
                    <strong style={{ fontSize: '14px' }}>
                      {match.local?.player.gamertag ?? 'Por determinar'}
                    </strong>
                    <span style={{ opacity: 0.6, fontSize: '12px' }}>vs</span>
                    <strong style={{ fontSize: '14px' }}>
                      {match.visitante?.player.gamertag ?? 'Por determinar'}
                    </strong>
                  </div>

                  <div className="p-duel-schedule-tag" style={{ marginTop: 6 }}>
                    <CalendarDays size={13} />
                    <span>{match.dateStr}</span>
                    <span className="p-duel-dot">·</span>
                    <span style={{ textTransform: 'uppercase', fontWeight: 800 }}>
                      {match.status === 'finalizado'
                        ? 'Finalizado'
                        : match.status === 'en_curso'
                          ? 'En directo'
                          : 'Pendiente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            className="btn-primary-neon"
            style={{ marginTop: '16px', width: '100%' }}
            onClick={() => {
              onClose();
              navigateTo('clasificacion');
            }}
          >
            <Scale size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Ir a la clasificación para arbitrar
          </button>
        </div>
      </div>
    </div>
  );
};
