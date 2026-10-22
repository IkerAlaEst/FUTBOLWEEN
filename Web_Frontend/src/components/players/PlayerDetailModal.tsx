import React, { useEffect, useState } from 'react';
import {
  ExtendedPlayer,
  getPlayerMatchesInfo
} from '../../data/tournamentPlayersExtended';
import { BracketMatch, INITIAL_BRACKET_MATCHES } from '../../data/tournamentBracketData';
import { ClubShield } from '../bracket/ClubShield';
import {
  X,
  Trophy,
  Clock,
  MapPin,
  Swords,
  Radio,
  Flame,
  Target,
  UserCheck,
  Award,
  Activity,
  Skull
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface PlayerDetailModalProps {
  player: ExtendedPlayer | null;
  /** Cuadro ya mezclado (código + Supabase). Si no se pasa, usa el estático. */
  matches?: BracketMatch[];
  onClose: () => void;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({
  player,
  matches = INITIAL_BRACKET_MATCHES,
  onClose
}) => {
  const { isLight } = useTheme();
  const [activeTab, setActiveTab] = useState<'partidos' | 'estadisticas'>('partidos');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!player) return null;

  const matchesInfo = getPlayerMatchesInfo(player.id, matches);

  return (
    <div className="player-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`player-modal-window ${isLight ? 'light-modal' : 'dark-modal'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera Hero con Foto Circular y Datos Oficiales */}
        <div className="p-modal-hero">
          <button
            type="button"
            className="p-modal-close-icon"
            onClick={onClose}
            aria-label="Cerrar ficha"
          >
            <X size={20} />
          </button>

          <div className="p-modal-hero-content">
            {/* Foto circular grande de persona real con halo */}
            <div className="p-modal-avatar-box">
              <div
                className="p-modal-avatar-glow"
                style={{ borderColor: player.club.primaryColor || '#ff5e00' }}
              />
              {player.avatar ? (
                <img
                  src={player.avatar}
                  alt={player.fullName}
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
                  display: player.avatar ? 'none' : 'grid',
                  placeItems: 'center',
                  background: `linear-gradient(135deg, ${player.club.primaryColor || '#ff5e00'} 0%, #0d0614 100%)`,
                  color: '#ffffff',
                  fontSize: '32px',
                  fontWeight: 800
                }}
              >
                {(player.fullName || player.gamertag || 'J').trim().charAt(0).toUpperCase()}
              </div>
              <span className="p-modal-seed-pill">SEED #{player.seed}</span>
            </div>

            {/* Datos principales */}
            <div className="p-modal-hero-meta">
              <div className="p-modal-badges-row">
                <span className={`p-modal-status-badge ${player.status}`}>
                  {player.status === 'en_curso' && <Radio size={11} className="p-live-pulse-icon" style={{ display: 'inline', marginRight: 4 }} />}
                  {player.status === 'clasificado' && <Trophy size={11} style={{ display: 'inline', marginRight: 4 }} />}
                  {player.status === 'eliminado' && <Skull size={11} style={{ display: 'inline', marginRight: 4 }} />}
                  {player.status === 'programado' && <Clock size={11} style={{ display: 'inline', marginRight: 4 }} />}
                  <span>{player.statusLabel}</span>
                </span>

                {/* Mando con imagen real */}
                <div className="p-modal-controller-badge">
                  <img
                    src={player.mandoImage}
                    alt={player.mandoLabel}
                    className="p-modal-mando-thumb"
                  />
                  <span>{player.mandoLabel}</span>
                </div>
              </div>

              <h2 className="p-modal-gamertag">{player.gamertag}</h2>
              <span className="p-modal-fullname">{player.fullName}</span>

              {/* Club elegido */}
              <div className="p-modal-club-badge">
                <ClubShield club={player.club} size={26} />
                <span className="p-modal-club-name">{player.club.name}</span>
                <span className="p-modal-stadium-hint">({player.club.stadium})</span>
              </div>
            </div>
          </div>

          {/* Pestañas de navegación interna */}
          <div className="p-modal-tabs-strip">
            <button
              type="button"
              className={`p-tab-btn ${activeTab === 'partidos' ? 'active' : ''}`}
              onClick={() => setActiveTab('partidos')}
            >
              <Swords size={14} />
              <span>Horarios y Rivales ({matchesInfo.length})</span>
            </button>
            <button
              type="button"
              className={`p-tab-btn ${activeTab === 'estadisticas' ? 'active' : ''}`}
              onClick={() => setActiveTab('estadisticas')}
            >
              <Trophy size={14} />
              <span>Estadísticas del Torneo</span>
            </button>
          </div>
        </div>

        {/* Cuerpo del modal según pestaña */}
        <div className="p-modal-body">
          {activeTab === 'partidos' ? (
            <div className="p-matches-list">
              {matchesInfo.length === 0 ? (
                <div className="p-empty-state">
                  <Clock size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
                  <p>Aún no hay partidos asignados en el cuadro para este jugador.</p>
                </div>
              ) : (
                matchesInfo.map(({ match, rivalPlayer, isWinner, isLive, isFinished }) => {
                  return (
                    <div
                      key={match.id}
                      className={`p-match-duel-card ${isWinner ? 'match-won' : isFinished ? 'match-lost' : isLive ? 'match-live' : 'match-pending'}`}
                    >
                      {/* Cabecera del Partido: Ronda, Horario y Sede */}
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

                      {/* Enfrentamiento Frente a Frente: Jugador vs Rival */}
                      <div className="p-duel-clash-grid">
                        {/* Lado Jugador Actual */}
                        <div className={`p-clash-side player-side ${isWinner ? 'is-winner' : ''}`}>
                          <ClubShield club={player.club} size={42} />
                          <div className="p-clash-info">
                            <strong className="p-clash-name">{player.gamertag}</strong>
                            <span className="p-clash-club">{player.club.name}</span>
                            <div className="p-clash-mando-wrap">
                              <img src={player.mandoImage} alt="" className="p-clash-mando-thumb" />
                              <span className="p-clash-mando">{player.mandoLabel}</span>
                            </div>
                          </div>
                          <div className="p-clash-score-box">
                            {isFinished || isLive ? match.local?.player.id === player.id ? match.local?.score : match.visitante?.score : '-'}
                          </div>
                        </div>

                        {/* Separador Central: VS / Estado */}
                        <div className="p-clash-center-vs">
                          {isLive ? (
                            <span className="p-live-dial-chip">
                              <Radio size={12} className="p-live-pulse-icon" />
                              <span>EN VIVO {match.liveMinute}'</span>
                            </span>
                          ) : isFinished ? (
                            <span className={`p-result-dial-chip ${isWinner ? 'won' : 'lost'}`}>
                              {isWinner ? 'VICTORIA' : 'DERROTA'}
                            </span>
                          ) : (
                            <span className="p-vs-text">VS</span>
                          )}
                        </div>

                        {/* Lado Rival */}
                        <div className={`p-clash-side rival-side ${match.winnerPlayerId && rivalPlayer && match.winnerPlayerId === rivalPlayer.id ? 'is-winner' : ''}`}>
                          <div className="p-clash-score-box">
                            {isFinished || isLive ? match.local?.player.id === player.id ? match.visitante?.score : match.local?.score : '-'}
                          </div>
                          <div className="p-clash-info rival-info">
                            <strong className="p-clash-name">
                              {rivalPlayer ? rivalPlayer.gamertag : 'Por Determinar'}
                            </strong>
                            <span className="p-clash-club">
                              {rivalPlayer ? rivalPlayer.club.name : 'Aspirante'}
                            </span>
                            {rivalPlayer && (
                              <div className="p-clash-mando-wrap">
                                <span className="p-clash-mando">{rivalPlayer.mandoLabel}</span>
                                <img src={rivalPlayer.mandoImage} alt="" className="p-clash-mando-thumb" />
                              </div>
                            )}
                          </div>
                          <ClubShield club={rivalPlayer?.club} size={42} />
                        </div>
                      </div>

                      {/* Goleadores del partido si ha finalizado o está en juego */}
                      {match.events.length > 0 && (
                        <div className="p-duel-events-strip">
                          <div className="p-events-title-wrap">
                            <Target size={13} style={{ color: isLight ? '#0284c7' : '#fb923c' }} />
                            <span className="p-events-title">Goles del Partido:</span>
                          </div>
                          <div className="p-events-tags-wrap">
                            {match.events
                              .filter(e => e.tipo === 'gol' || e.tipo === 'penalti')
                              .map((ev, idx) => (
                                <span key={idx} className="p-event-tag">
                                  {ev.jugador} ({ev.minuto}'{ev.tipo === 'penalti' ? ' P' : ''})
                                </span>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Pestaña Estadísticas */
            <div className="p-stats-tab-content">
              {/* Tarjetas de Métricas Numéricas (SOLO ICONOS, CERO EMOJIS) */}
              <div className="p-metrics-cards-grid">
                <div className="p-metric-card">
                  <Activity size={18} style={{ opacity: 0.7, marginBottom: 4 }} />
                  <span className="p-metric-val">{player.matchesPlayed}</span>
                  <span className="p-metric-lbl">Partidos Jugados</span>
                </div>

                <div className="p-metric-card">
                  <Award size={18} style={{ color: '#4ade80', marginBottom: 4 }} />
                  <span className="p-metric-val won">
                    {matchesInfo.filter(m => m.isWinner).length}
                  </span>
                  <span className="p-metric-lbl">Victorias</span>
                </div>

                <div className="p-metric-card">
                  <Skull size={18} style={{ color: '#f87171', marginBottom: 4 }} />
                  <span className="p-metric-val lost">
                    {matchesInfo.filter(m => m.isFinished && !m.isWinner).length}
                  </span>
                  <span className="p-metric-lbl">Derrotas</span>
                </div>

                <div className="p-metric-card">
                  <Flame size={18} style={{ color: '#fbbf24', marginBottom: 4 }} />
                  <span className="p-metric-val highlight">{player.goalsScored}</span>
                  <span className="p-metric-lbl">Goles a Favor</span>
                </div>

                <div className="p-metric-card">
                  <Target size={18} style={{ opacity: 0.7, marginBottom: 4 }} />
                  <span className="p-metric-val">{player.goalsConceded}</span>
                  <span className="p-metric-lbl">Goles Encajados</span>
                </div>

                <div className="p-metric-card">
                  <Trophy size={18} style={{ color: player.goalDifference >= 0 ? '#4ade80' : '#f87171', marginBottom: 4 }} />
                  <span className="p-metric-val" style={{ color: player.goalDifference >= 0 ? '#4ade80' : '#f87171' }}>
                    {player.goalDifference > 0 ? `+${player.goalDifference}` : player.goalDifference}
                  </span>
                  <span className="p-metric-lbl">Diferencia de Goles</span>
                </div>
              </div>

              {/* Ficha técnica oficial del club y torneo */}
              <div className="p-official-spec-box">
                <h4 className="p-spec-title">
                  <UserCheck size={16} />
                  <span>Ficha Oficial del Torneo</span>
                </h4>
                <div className="p-spec-list">
                  <div className="p-spec-row">
                    <span className="p-spec-label">Club Seleccionado:</span>
                    <span className="p-spec-value">{player.club.name} ({player.club.stadium})</span>
                  </div>
                  <div className="p-spec-row">
                    <span className="p-spec-label">Configuración de Mando:</span>
                    <span className="p-spec-value">{player.mandoLabel} (Verificado Simarro LAN)</span>
                  </div>
                  <div className="p-spec-row">
                    <span className="p-spec-label">Posición en el Cuadro (Seed):</span>
                    <span className="p-spec-value">Cabezal de Serie #{player.seed}</span>
                  </div>
                  <div className="p-spec-row">
                    <span className="p-spec-label">Estado de Clasificación:</span>
                    <span className="p-spec-value" style={{ fontWeight: 800 }}>
                      {player.status === 'clasificado'
                        ? 'Clasificado a Cuartos de Final (IES Simarro)'
                        : player.status === 'en_curso'
                        ? 'Disputando Partido en Directo'
                        : player.status === 'eliminado'
                        ? 'Eliminado en Ronda de Octavos'
                        : 'En Espera de Disputar Octavos'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
