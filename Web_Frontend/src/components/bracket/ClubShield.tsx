import React, { useState } from 'react';
import { TournamentClub } from '../../data/tournamentBracketData';
import { Shield } from 'lucide-react';

interface ClubShieldProps {
  club?: TournamentClub | null;
  size?: number;
  showName?: boolean;
  className?: string;
}

export const ClubShield: React.FC<ClubShieldProps> = ({
  club,
  size = 22,
  showName = false,
  className = ''
}) => {
  const [broken, setBroken] = useState(false);

  if (!club) {
    return (
      <div
        className={`club-shield-placeholder ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px dashed rgba(255, 255, 255, 0.25)',
          display: 'grid',
          placeItems: 'center',
          color: '#64748b',
          flexShrink: 0
        }}
        title="Por determinar"
      >
        <Shield size={Math.round(size * 0.55)} />
      </div>
    );
  }

  return (
    <div
      className={`club-shield-wrap ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        flexShrink: 0
      }}
    >
      <div
        className="club-shield-icon"
        style={{
          width: size,
          height: size,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          position: 'relative'
        }}
      >
        {club.badge && !broken ? (
          <img
            src={club.badge}
            alt={club.name}
            loading="eager"
            draggable={false}
            onError={() => setBroken(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
        ) : (
          <span
            style={{
              width: size,
              height: size,
              borderRadius: '50%',
              background: club.primaryColor || '#ff5e00',
              color: '#ffffff',
              display: 'grid',
              placeItems: 'center',
              fontSize: `${Math.max(8, Math.round(size * 0.38))}px`,
              fontWeight: 900,
              fontFamily: "'Space Grotesk', sans-serif",
              border: '1px solid rgba(255,255,255,0.4)',
              boxSizing: 'border-box'
            }}
          >
            {club.shortName.slice(0, 3)}
          </span>
        )}
      </div>

      {showName && (
        <span
          className="club-shield-name"
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'inherit',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {club.name}
        </span>
      )}
    </div>
  );
};
