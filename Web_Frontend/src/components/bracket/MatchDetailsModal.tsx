import React, { useEffect } from 'react';
import { X, Trophy, Swords, Castle, Check, Clock, Radio, Shield, MapPin, UserCheck, Flame } from 'lucide-react';
import { BracketMatch } from '../../data/tournamentBracketData';
import { ClubShield } from './ClubShield';
import { useTheme } from '../../context/ThemeContext';

interface MatchDetailsModalProps {
  match: BracketMatch | null;
  onClose: () => void;
}

export const MatchDetailsModal: React.FC<MatchDetailsModalProps> = ({ match, onClose }) => {
  const { isLight } = useTheme();

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!match) return null;

  const isFinal = match.round === 'final';
  const isLive = match.status === 'en_curso';
  const isFinished = match.status === 'finalizado';

  const localParticipant = match.local;
  const visitParticipant = match.visitante;

  const localScore = localParticipant ? localParticipant.score : 0;
  const visitScore = visitParticipant ? visitParticipant.score : 0;

  const localGoals = match.events.filter(e => e.equipo === 'local' && (e.tipo === 'gol' || e.tipo === 'penalti'));
  const visitGoals = match.events.filter(e => e.equipo === 'visitante' && (e.tipo === 'gol' || e.tipo === 'penalti'));

  // Calculo de posesión y porcentajes
  const posLocal = match.stats.posesion_local || (isFinished || isLive ? 50 : 0);
  const posVisit = match.stats.posesion_visitante || (isFinished || isLive ? 50 : 0);

  // Estadísticas comparativas para la tabla estilo Acta oficial (Imagen 2)
  const statRows = [
    {
      label: 'Goles',
      localVal: localScore,
      visitVal: visitScore,
      barLocal: localScore,
      barVisit: visitScore,
      highlightMax: true
    },
    {
      label: 'Remates',
      localVal: match.stats.remates_local,
      visitVal: match.stats.remates_visitante,
      barLocal: match.stats.remates_local,
      barVisit: match.stats.remates_visitante,
      highlightMax: true
    },
    {
      label: 'Remates a Puerta',
      localVal: match.stats.remates_puerta_local,
      visitVal: match.stats.remates_puerta_visitante,
      barLocal: match.stats.remates_puerta_local,
      barVisit: match.stats.remates_puerta_visitante,
      highlightMax: true
    },
    {
      label: 'Córners',
      localVal: match.stats.corners_local,
      visitVal: match.stats.corners_visitante,
      barLocal: match.stats.corners_local,
      barVisit: match.stats.corners_visitante,
      highlightMax: true
    },
    {
      label: 'Posesión de balón',
      localVal: `${posLocal}%`,
      visitVal: `${posVisit}%`,
      barLocal: posLocal,
      barVisit: posVisit,
      highlightMax: true
    },
    {
      label: 'Faltas',
      localVal: match.stats.faltas_local,
      visitVal: match.stats.faltas_visitante,
      barLocal: match.stats.faltas_local,
      barVisit: match.stats.faltas_visitante,
      highlightMax: false
    },
    {
      label: 'Pases Completados',
      localVal: match.stats.pases_local,
      visitVal: match.stats.pases_visitante,
      barLocal: parseInt(match.stats.pases_local, 10) || 50,
      barVisit: parseInt(match.stats.pases_visitante, 10) || 50,
      highlightMax: true
    },
    {
      label: 'Paradas de Portero',
      localVal: match.stats.paradas_local,
      visitVal: match.stats.paradas_visitante,
      barLocal: match.stats.paradas_local,
      barVisit: match.stats.paradas_visitante,
      highlightMax: true
    }
  ];

  return (
    <div className="match-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="match-modal-card"
        onClick={e => e.stopPropagation()}
        style={{
          background: isLight ? '#ffffff' : 'linear-gradient(180deg, #160c22 0%, #0d0614 100%)',
          color: isLight ? '#0f172a' : '#f8fafc',
          borderColor: isLive ? '#22c55e' : isLight ? '#0284c7' : 'var(--neon-orange)'
        }}
      >
        {/* Cabecera superior estilo retransmisión televisiva oficial (Imagen 2) */}
        <div
          className="match-modal-header"
          style={{
            background: isLight
              ? 'linear-gradient(90deg, #0284c7 0%, #0369a1 100%)'
              : 'linear-gradient(90deg, rgba(255,94,0,0.25) 0%, rgba(124,58,237,0.3) 100%)',
            borderBottom: `2px solid ${isLight ? '#0369a1' : 'rgba(255,94,0,0.4)'}`
          }}
        >
          <div className="match-modal-header-left">
            {isFinal ? (
              <Castle size={18} className="trophy-pulse" style={{ color: '#fbbf24' }} />
            ) : isLive ? (
              <Radio size={18} className="live-icon-spin" style={{ color: '#4ade80' }} />
            ) : (
              <Trophy size={18} style={{ color: isLight ? '#ffffff' : 'var(--neon-orange)' }} />
            )}
            <div>
              <strong>{match.roundName} · Clash Footballween 2026</strong>
              <small style={{ display: 'block', opacity: 0.9, fontSize: '11px' }}>
                Partido #{match.id} · {match.venue}
              </small>
            </div>
          </div>

          <div className="match-modal-header-right">
            <span className="match-modal-date-chip">
              <Clock size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              {match.dateStr} · {match.timeStr}
            </span>
            <button
              type="button"
              className="match-modal-close-btn"
              onClick={onClose}
              aria-label="Cerrar ficha"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Marcador Principal con Cajas Grandes y Goleadores (Imagen 2) */}
        <div className="match-modal-scoreboard">
          {/* Lado Local */}
          <div className="team-scoreboard-side local">
            <div className="team-badge-hero">
              <ClubShield club={localParticipant?.club} size={58} />
              {localParticipant && match.winnerPlayerId === localParticipant.player.id && (
                <span className="winner-crown-chip" title="Vencedor y Clasificado">
                  🏆 GANADOR
                </span>
              )}
            </div>

            <div className="team-meta-hero">
              <h3 className="player-gamertag-hero">
                {localParticipant ? localParticipant.player.gamertag : 'Por Determinar'}
              </h3>
              <span className="player-fullname-hero">
                {localParticipant ? `${localParticipant.player.fullName} · ${localParticipant.club.name}` : 'Aspirante Octavos'}
              </span>
            </div>

            {/* Lista de goleadores con minutos (Imagen 2) */}
            <div className="scorers-list local">
              {localGoals.length > 0 ? (
                localGoals.map((ev, i) => (
                  <div key={i} className="scorer-item" title={ev.descripcion || `${ev.jugador} (${ev.minuto}')`}>
                    <span className="ball-icon">⚽</span>
                    <strong>{ev.jugador}</strong>
                    <span className="minute-tag">{ev.minuto}'{ev.tipo === 'penalti' ? ' (P)' : ''}</span>
                  </div>
                ))
              ) : isFinished ? (
                <span className="no-scorers-hint">Sin goles anotados</span>
              ) : null}
            </div>
          </div>

          {/* Cajas Digitales de Puntuación Central (Imagen 2: [ 5 ] [ 0 ]) */}
          <div className="scoreboard-center-dial">
            <div className="score-boxes-container">
              <div
                className={`digit-score-box ${isFinished && localScore > visitScore ? 'winner-box' : ''}`}
                style={{
                  background: isLight ? '#f1f5f9' : '#07040a',
                  borderColor: isFinished && localScore > visitScore ? '#fbbf24' : isLight ? '#0284c7' : '#ff5e00',
                  color: isFinished && localScore > visitScore ? '#fbbf24' : isLight ? '#0369a1' : '#ffffff'
                }}
              >
                {isFinished || isLive ? localScore : '-'}
              </div>

              <span className="score-divider">:</span>

              <div
                className={`digit-score-box ${isFinished && visitScore > localScore ? 'winner-box' : ''}`}
                style={{
                  background: isLight ? '#f1f5f9' : '#07040a',
                  borderColor: isFinished && visitScore > localScore ? '#fbbf24' : isLight ? '#0284c7' : '#ff5e00',
                  color: isFinished && visitScore > localScore ? '#fbbf24' : isLight ? '#0369a1' : '#ffffff'
                }}
              >
                {isFinished || isLive ? visitScore : '-'}
              </div>
            </div>

            {/* Estado del Partido */}
            <div className="match-status-pill-wrap">
              {isLive ? (
                <div className="live-status-pill">
                  <span className="live-dot" />
                  <span>EN DIRECTO {match.liveMinute}'</span>
                </div>
              ) : isFinished ? (
                <div className="finished-status-pill">
                  <Check size={12} />
                  <span>FINALIZADO</span>
                </div>
              ) : (
                <div className="pending-status-pill">
                  <Clock size={12} />
                  <span>PROGRAMADO {match.timeStr}</span>
                </div>
              )}
            </div>
          </div>

          {/* Lado Visitante */}
          <div className="team-scoreboard-side visitante">
            <div className="team-badge-hero">
              <ClubShield club={visitParticipant?.club} size={58} />
              {visitParticipant && match.winnerPlayerId === visitParticipant.player.id && (
                <span className="winner-crown-chip" title="Vencedor y Clasificado">
                  🏆 GANADOR
                </span>
              )}
            </div>

            <div className="team-meta-hero">
              <h3 className="player-gamertag-hero">
                {visitParticipant ? visitParticipant.player.gamertag : 'Por Determinar'}
              </h3>
              <span className="player-fullname-hero">
                {visitParticipant ? `${visitParticipant.player.fullName} · ${visitParticipant.club.name}` : 'Aspirante Octavos'}
              </span>
            </div>

            {/* Lista de goleadores visitante (Imagen 2) */}
            <div className="scorers-list visitante">
              {visitGoals.length > 0 ? (
                visitGoals.map((ev, i) => (
                  <div key={i} className="scorer-item" title={ev.descripcion || `${ev.jugador} (${ev.minuto}')`}>
                    <span className="ball-icon">⚽</span>
                    <strong>{ev.jugador}</strong>
                    <span className="minute-tag">{ev.minuto}'{ev.tipo === 'penalti' ? ' (P)' : ''}</span>
                  </div>
                ))
              ) : isFinished ? (
                <span className="no-scorers-hint">Sin goles anotados</span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Tabla Oficial de Estadísticas (Imagen 2) */}
        <div className="match-modal-stats-section">
          <div className="stats-table-wrapper">
            <table className="official-stats-table">
              <thead>
                <tr>
                  <th className="th-team local">
                    {localParticipant ? localParticipant.club.name : 'Local'}
                  </th>
                  <th className="th-title">Estadísticas</th>
                  <th className="th-team visitante">
                    {visitParticipant ? visitParticipant.club.name : 'Visitante'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {statRows.map((row, idx) => {
                  const total = (typeof row.barLocal === 'number' ? row.barLocal : 0) + (typeof row.barVisit === 'number' ? row.barVisit : 0);
                  const pctLocal = total > 0 ? Math.round((Number(row.barLocal) / total) * 100) : 50;
                  const pctVisit = 100 - pctLocal;

                  return (
                    <tr key={idx} className={idx % 2 === 0 ? 'even-row' : 'odd-row'}>
                      <td className="td-val local">
                        <strong>{row.localVal}</strong>
                      </td>

                      <td className="td-stat-center">
                        <span className="stat-label-text">{row.label}</span>
                        {(isFinished || isLive) && (
                          <div className="stat-duel-bar-container">
                            <div
                              className="stat-bar-fill local"
                              style={{
                                width: `${pctLocal}%`,
                                background: isLight ? '#0284c7' : 'var(--neon-orange)'
                              }}
                            />
                            <div
                              className="stat-bar-fill visit"
                              style={{
                                width: `${pctVisit}%`,
                                background: isLight ? '#38bdf8' : '#7c3aed'
                              }}
                            />
                          </div>
                        )}
                      </td>

                      <td className="td-val visit">
                        <strong>{row.visitVal}</strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pie Oficial / Fuente (Imagen 2: Fuente: Enetpulse / EpData) */}
        <div className="match-modal-footer">
          <div className="footer-source-note">
            <UserCheck size={14} style={{ color: isLight ? '#0284c7' : 'var(--neon-orange)' }} />
            <span>
              Acta Oficial: <b>{match.referee}</b> · Sede: {match.venue}
            </span>
          </div>
          <span className="footer-epdata">
            Fuente: Clash Footballween MatchEngine / Actas Oficiales Simarro (2026)
          </span>
        </div>
      </div>
    </div>
  );
};

