import React, { useState } from 'react';
import { RefereeProfile } from '../../data/refereesData';
import { MapPin, Scale, ChevronRight, ShieldCheck } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface RefereeCardProps {
  referee: RefereeProfile;
  assignedCount: number;
  onSelect: (referee: RefereeProfile) => void;
}

/**
 * Misma estructura visual que `PlayerCard`, adaptada a árbitros:
 * foto, gamertag, nombre, plaza y zona en lugar de club/mando.
 */
export const RefereeCard: React.FC<RefereeCardProps> = ({
  referee,
  assignedCount,
  onSelect
}) => {
  const { isLight } = useTheme();
  const [imgBroken, setImgBroken] = useState(false);

  return (
    <div
      className={`player-v-card programado ${isLight ? 'light-card' : 'dark-card'}`}
      onClick={() => onSelect(referee)}
      role="button"
      tabIndex={0}
      title={`Ver partidos asignados a ${referee.gamertag}`}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(referee);
        }
      }}
    >
      <div className="p-card-top-bar">
        <span className="p-seed-badge">
          <b>ÁRBITRO #{String(referee.slot).padStart(2, '0')}</b>
        </span>
        <span className="p-status-chip is-qualified">
          <ShieldCheck size={11} />
          <span>OFICIAL</span>
        </span>
      </div>

      <div className="p-avatar-wrapper">
        <div className="p-avatar-halo" style={{ borderColor: '#b69cff' }} />
        <div className="p-avatar-circle">
          {referee.avatar && !imgBroken ? (
            <img
              src={referee.avatar}
              alt={referee.fullName}
              className="p-avatar-img"
              loading="lazy"
              onError={() => setImgBroken(true)}
            />
          ) : (
            <div
              className="p-avatar-fallback"
              style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #0d0614 100%)' }}
            >
              <span>{(referee.fullName || referee.gamertag || 'A').trim().charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-identity-section">
        <h3 className="p-gamertag-title">{referee.gamertag}</h3>
        <span className="p-fullname-subtitle">{referee.fullName}</span>
      </div>

      <div className="p-duo-horizontal-bar">
        <div className="p-duo-slot shield-slot" title="Árbitro oficial">
          <Scale size={48} style={{ color: '#b69cff' }} />
        </div>
        <div className="p-duo-mini-divider" />
        <div className="p-duo-slot mando-slot" title={referee.zona}>
          <MapPin size={44} style={{ color: '#ff8a1f' }} />
        </div>
      </div>

      <div className="p-card-footer-cta">
        <span>
          {assignedCount > 0
            ? `${assignedCount} partido${assignedCount === 1 ? '' : 's'} asignado${assignedCount === 1 ? '' : 's'}`
            : 'Sin partidos asignados'}
        </span>
        <ChevronRight size={13} className="p-arrow-cta" />
      </div>
    </div>
  );
};
