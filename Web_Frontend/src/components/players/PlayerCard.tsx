import React, { useState } from 'react';
import { ExtendedPlayer } from '../../data/tournamentPlayersExtended';
import { ClubShield } from '../bracket/ClubShield';
import { Trophy, Clock, Skull, Radio, ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface PlayerCardProps {
  player: ExtendedPlayer;
  onSelect: (player: ExtendedPlayer) => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, onSelect }) => {
  const { isLight } = useTheme();
  const [imgBroken, setImgBroken] = useState(false);

  return (
    <div
      className={`player-v-card ${player.status} ${isLight ? 'light-card' : 'dark-card'}`}
      onClick={() => onSelect(player)}
      role="button"
      tabIndex={0}
      title={`Ver ficha, horarios y rivales de ${player.gamertag}`}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(player);
        }
      }}
    >
      {/* 1. Cabecera superior: Seed numérico y Chip de Estado (SOLO ICONOS, SIN EMOJIS) */}
      <div className="p-card-top-bar">
        <span className="p-seed-badge">
          <b>SEED #{player.seed.toString().padStart(2, '0')}</b>
        </span>

        {player.status === 'en_curso' && (
          <span className="p-status-chip is-live">
            <Radio size={11} className="p-live-pulse-icon" />
            <span>EN VIVO</span>
          </span>
        )}

        {player.status === 'clasificado' && (
          <span className="p-status-chip is-qualified">
            <Trophy size={11} />
            <span>CLASIFICADO</span>
          </span>
        )}

        {player.status === 'eliminado' && (
          <span className="p-status-chip is-eliminated">
            <Skull size={11} />
            <span>OCTAVOS</span>
          </span>
        )}

        {player.status === 'programado' && (
          <span className="p-status-chip is-pending">
            <Clock size={11} />
            <span>EN ESPERA</span>
          </span>
        )}
      </div>

      {/* 2. Foto circular de persona real con halo */}
      <div className="p-avatar-wrapper">
        <div
          className="p-avatar-halo"
          style={{
            borderColor: player.club.primaryColor || '#ff5e00'
          }}
        />
        <div className="p-avatar-circle">
          {player.avatar && !imgBroken ? (
            <img
              src={player.avatar}
              alt={player.fullName}
              className="p-avatar-img"
              loading="lazy"
              onError={() => setImgBroken(true)}
            />
          ) : (
            <div
              className="p-avatar-fallback"
              style={{
                background: `linear-gradient(135deg, ${player.club.primaryColor} 0%, #0d0614 100%)`
              }}
            >
              <span>{(player.fullName || player.gamertag || 'J').trim().charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Nombre del Jugador: Gamertag prominente + Nombre real */}
      <div className="p-identity-section">
        <h3 className="p-gamertag-title">{player.gamertag}</h3>
        <span className="p-fullname-subtitle">{player.fullName}</span>
      </div>

      {/* 4. Barra Horizontal Simétrica: Escudo Grande (Izq) | Línea | Mando Grande (Der) */}
      <div className="p-duo-horizontal-bar">
        {/* Lado izquierdo: Escudo oficial en grande sin nombre ni contenedor */}
        <div className="p-duo-slot shield-slot" title={player.club.name}>
          <ClubShield club={player.club} size={50} />
        </div>

        {/* Mini línea divisoria vertical */}
        <div className="p-duo-mini-divider" />

        {/* Lado derecho: Mando en grande sin nombre ni contenedor */}
        <div className="p-duo-slot mando-slot" title={player.mandoLabel}>
          <img
            src={player.mandoImage}
            alt={player.mandoLabel}
            className="p-duo-mando-pure-img"
            loading="lazy"
          />
        </div>
      </div>

      {/* 6. Botón de Acción inferior */}
      <div className="p-card-footer-cta">
        <span>Horarios y Rival</span>
        <ChevronRight size={13} className="p-arrow-cta" />
      </div>
    </div>
  );
};
