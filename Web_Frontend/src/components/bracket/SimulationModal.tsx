import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BracketMatch,
  MatchEvent,
  MatchStats
} from '../../data/tournamentBracketData';
import { useAuth } from '../../context/AuthContext';
import { saveSimulation } from '../../services/simulationService';
import { fetchTeamSquad, TeamSquad } from '../../services/sportsDb';
import { playWhistle } from '../../utils/whistle';
import { Check, Clock, Radio, Scale, Trophy, X, ShieldAlert, Sparkles } from 'lucide-react';
import './simulationModal.css';

interface SimulationModalProps {
  match: BracketMatch;
  onClose: () => void;
  onFinished: () => void | Promise<void>;
}

type Phase = 'loading' | 'playing' | 'penalties' | 'saving' | 'saved' | 'error';

interface TimelineEvent extends MatchEvent {
  /** Solo para la tanda de penaltis. */
  penalty?: boolean;
}

function pickScorer(squad: TeamSquad): string {
  const r = Math.random();
  if (r < 0.72 && squad.forwards.length > 0) {
    return squad.forwards[Math.floor(Math.random() * squad.forwards.length)];
  }
  if (r < 0.94 && squad.midfielders.length > 0) {
    return squad.midfielders[Math.floor(Math.random() * squad.midfielders.length)];
  }
  if (squad.defenders.length > 0) {
    return squad.defenders[Math.floor(Math.random() * squad.defenders.length)];
  }
  return squad.all[Math.floor(Math.random() * squad.all.length)] || 'Goleador';
}

function pickAssister(squad: TeamSquad, exclude?: string): string {
  const pool = [...squad.midfielders, ...squad.forwards, ...squad.defenders].filter(p => p !== exclude);
  if (pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return 'su compañero';
}

function pickGoalkeeper(squad: TeamSquad): string {
  if (squad.goalkeepers.length > 0) {
    return squad.goalkeepers[0];
  }
  return squad.all[0] || 'El portero';
}

function pickFouler(squad: TeamSquad): string {
  const pool = squad.defenders.length > 0 ? squad.defenders : (squad.midfielders.length > 0 ? squad.midfielders : squad.all);
  return pool[Math.floor(Math.random() * pool.length)] || 'Defensa';
}

function pickCarded(squad: TeamSquad): string {
  const pool = [...squad.defenders, ...squad.midfielders];
  if (pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return squad.all[Math.floor(Math.random() * squad.all.length)] || 'Jugador';
}

function pickAttacker(squad: TeamSquad): string {
  const pool = [...squad.forwards, ...squad.midfielders];
  if (pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return squad.all[Math.floor(Math.random() * squad.all.length)] || 'Atacante';
}

function buildTimeline(
  localSquad: TeamSquad,
  visitSquad: TeamSquad
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (let minute = 1; minute <= 90; minute += 1) {
    // Gol Local
    if (Math.random() < 0.022) {
      const scorer = pickScorer(localSquad);
      const assister = pickAssister(localSquad, scorer);
      const isPenalti = Math.random() < 0.15;
      const descs = [
        `${scorer} define con clase al palo largo tras asistencia de ${assister}`,
        `${scorer} remata de volea imparable a la escuadra`,
        `${scorer} cabecea al fondo de la red un centro milimétrico de ${assister}`,
        `${scorer} culmina un rápido contragolpe con un disparo cruzado raso`,
        `${scorer} bate al portero en el mano a mano con una sutil vaselina`
      ];
      events.push({
        minuto: minute,
        tipo: isPenalti ? 'penalti' : 'gol',
        jugador: scorer,
        equipo: 'local',
        descripcion: isPenalti
          ? `${scorer} transforma el penalti engañando al portero`
          : descs[Math.floor(Math.random() * descs.length)]
      });
    }

    // Gol Visitante
    if (Math.random() < 0.022) {
      const scorer = pickScorer(visitSquad);
      const assister = pickAssister(visitSquad, scorer);
      const isPenalti = Math.random() < 0.15;
      const descs = [
        `${scorer} define con clase al palo largo tras pase de ${assister}`,
        `${scorer} conecta un latigazo directo a la escuadra`,
        `${scorer} remata al primer toque dentro del área asistido por ${assister}`,
        `${scorer} anota con un derechazo cruzado inapelable`,
        `${scorer} culmina la jugada combinativa con un toque raso`
      ];
      events.push({
        minuto: minute,
        tipo: isPenalti ? 'penalti' : 'gol',
        jugador: scorer,
        equipo: 'visitante',
        descripcion: isPenalti
          ? `${scorer} transforma la pena máxima con frialdad`
          : descs[Math.floor(Math.random() * descs.length)]
      });
    }

    // Falta
    if (Math.random() < 0.075) {
      const side = Math.random() < 0.5 ? 'local' : 'visitante';
      const squad = side === 'local' ? localSquad : visitSquad;
      const player = pickFouler(squad);
      events.push({
        minuto: minute,
        tipo: 'falta',
        jugador: player,
        equipo: side,
        descripcion: `Falta táctica de ${player} en la medular`
      });
    }

    // Amarilla
    if (Math.random() < 0.016) {
      const side = Math.random() < 0.5 ? 'local' : 'visitante';
      const squad = side === 'local' ? localSquad : visitSquad;
      const player = pickCarded(squad);
      events.push({
        minuto: minute,
        tipo: 'amarilla',
        jugador: player,
        equipo: side,
        descripcion: `Tarjeta amarilla para ${player} por cortar una contra prometedora`
      });
    }

    // Roja
    if (Math.random() < 0.004) {
      const side = Math.random() < 0.5 ? 'local' : 'visitante';
      const squad = side === 'local' ? localSquad : visitSquad;
      const player = pickCarded(squad);
      events.push({
        minuto: minute,
        tipo: 'roja',
        jugador: player,
        equipo: side,
        descripcion: `Tarjeta roja directa para ${player} tras una entrada desmedida`
      });
    }

    // Ocasión
    if (Math.random() < 0.045) {
      const side = Math.random() < 0.5 ? 'local' : 'visitante';
      const squad = side === 'local' ? localSquad : visitSquad;
      const player = pickAttacker(squad);
      events.push({
        minuto: minute,
        tipo: 'ocasion',
        jugador: player,
        equipo: side,
        descripcion: `Gran ocasión de ${player} que roza el palo con un disparo potente`
      });
    }

    // Paradón
    if (Math.random() < 0.03) {
      const side = Math.random() < 0.5 ? 'local' : 'visitante';
      const squad = side === 'local' ? localSquad : visitSquad;
      const gk = pickGoalkeeper(squad);
      events.push({
        minuto: minute,
        tipo: 'paradon',
        jugador: gk,
        equipo: side,
        descripcion: `Paradón providencial de ${gk} desviando el balón a córner`
      });
    }
  }

  return events;
}

function buildStats(
  localGoals: number,
  visitGoals: number
): MatchStats {
  const possessionLocal = 42 + Math.floor(Math.random() * 17);
  return {
    remates_local: 5 + localGoals * 2 + Math.floor(Math.random() * 5),
    remates_visitante: 5 + visitGoals * 2 + Math.floor(Math.random() * 5),
    remates_puerta_local: localGoals + Math.floor(Math.random() * 3),
    remates_puerta_visitante: visitGoals + Math.floor(Math.random() * 3),
    corners_local: Math.floor(Math.random() * 8),
    corners_visitante: Math.floor(Math.random() * 8),
    posesion_local: possessionLocal,
    posesion_visitante: 100 - possessionLocal,
    faltas_local: 4 + Math.floor(Math.random() * 8),
    faltas_visitante: 4 + Math.floor(Math.random() * 8),
    pases_local: `${78 + Math.floor(Math.random() * 15)}%`,
    pases_visitante: `${78 + Math.floor(Math.random() * 15)}%`,
    paradas_local: 1 + Math.floor(Math.random() * 6),
    paradas_visitante: 1 + Math.floor(Math.random() * 6),
    amarillas_local: Math.floor(Math.random() * 4),
    amarillas_visitante: Math.floor(Math.random() * 4),
    rojas_local: Math.random() < 0.08 ? 1 : 0,
    rojas_visitante: Math.random() < 0.08 ? 1 : 0
  };
}

function shootout(localSquad: TeamSquad, visitSquad: TeamSquad): {
  local: number;
  visitante: number;
  winner: 'local' | 'visitante';
  decisiveScorer: string;
} {
  let local = 0;
  let visitante = 0;

  for (let i = 0; i < 5; i += 1) {
    if (Math.random() < 0.72) local += 1;
    if (Math.random() < 0.72) visitante += 1;
  }

  while (local === visitante) {
    if (Math.random() < 0.72) local += 1;
    if (Math.random() < 0.72) visitante += 1;
  }

  const winner = local > visitante ? 'local' : 'visitante';
  const winningSquad = winner === 'local' ? localSquad : visitSquad;
  const decisiveScorer = pickScorer(winningSquad);

  return { local, visitante, winner, decisiveScorer };
}

export const SimulationModal: React.FC<SimulationModalProps> = ({
  match,
  onClose,
  onFinished
}) => {
  const { user } = useAuth();
  const [minute, setMinute] = useState(0);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [phase, setPhase] = useState<Phase>('loading');
  const [squads, setSquads] = useState<{ local: TeamSquad; visitante: TeamSquad } | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [penalties, setPenalties] = useState<{ local: number; visitante: number } | null>(null);
  const [error, setError] = useState('');
  const intervalRef = useRef<number | null>(null);

  const localName = match.local?.player.gamertag ?? 'Por determinar';
  const visitName = match.visitante?.player.gamertag ?? 'Por determinar';
  const localClub = match.local?.club.name ?? 'Equipo Local';
  const visitClub = match.visitante?.club.name ?? 'Equipo Visitante';

  // 1. Cargar las plantillas reales de los dos equipos usando TheSportsDB API
  useEffect(() => {
    let isCancelled = false;

    if (match.status === 'finalizado') {
      return;
    }

    if (!match.local || !match.visitante) {
      setError('Este partido aún no tiene los dos jugadores. Espera al 16º jugador.');
      setPhase('error');
      return;
    }

    async function loadSquadsFromApi() {
      setPhase('loading');
      setError('');

      try {
        const [lSquad, vSquad] = await Promise.all([
          fetchTeamSquad(localClub, match.local?.club.id),
          fetchTeamSquad(visitClub, match.visitante?.club.id)
        ]);

        if (isCancelled) return;

        setSquads({ local: lSquad, visitante: vSquad });
        const generatedTimeline = buildTimeline(lSquad, vSquad);
        setTimeline(generatedTimeline);
        setPhase('playing');
        playWhistle(800);
      } catch (loadErr) {
        if (isCancelled) return;
        setError(loadErr instanceof Error ? loadErr.message : 'Error al consultar plantillas de la API');
        setPhase('error');
      }
    }

    loadSquadsFromApi();

    return () => {
      isCancelled = true;
    };
  }, [match, localClub, visitClub]);

  const score = useMemo(() => {
    let local = 0;
    let visitante = 0;
    events.forEach(event => {
      if (event.tipo === 'gol' || event.tipo === 'penalti') {
        if (event.equipo === 'local') local += 1;
        else visitante += 1;
      }
    });
    return { local, visitante };
  }, [events]);

  const stopClock = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const finish = (finalLocal: number, finalVisit: number, shootoutResult?: {
    local: number;
    visitante: number;
    winner: 'local' | 'visitante';
    decisiveScorer: string;
  }) => {
    stopClock();

    if (!user || (user.rol !== 'arbitro' && user.rol !== 'admin')) {
      setError('Solo un árbitro puede guardar el acta.');
      setPhase('error');
      return;
    }
    if (!match.local || !match.visitante) {
      setError('El partido aún no tiene los dos participantes.');
      setPhase('error');
      return;
    }

    let winnerId: string;
    if (finalLocal > finalVisit) winnerId = match.local.player.id;
    else if (finalVisit > finalLocal) winnerId = match.visitante.player.id;
    else if (shootoutResult) {
      winnerId =
        shootoutResult.winner === 'local'
          ? match.local.player.id
          : match.visitante.player.id;
    } else {
      setError('El partido necesita un ganador.');
      setPhase('error');
      return;
    }

    // `timeline` contiene todos los eventos del partido con jugadores reales
    const finalEvents: MatchEvent[] = [...timeline];
    if (shootoutResult) {
      finalEvents.push({
        minuto: 90,
        tipo: 'penalti',
        jugador: shootoutResult.decisiveScorer,
        equipo: shootoutResult.winner,
        descripcion: `Tanda de penaltis ${shootoutResult.local}-${shootoutResult.visitante} · Gol decisivo de ${shootoutResult.decisiveScorer}`
      });
    }

    setPhase('saving');
    setError('');

    void saveSimulation({
      matchId: match.id,
      golesLocal: finalLocal,
      golesVisitante: finalVisit,
      ganadorId: winnerId,
      arbitroId: user.id,
      eventos: finalEvents,
      estadisticas: buildStats(finalLocal, finalVisit)
    })
      .then(async () => {
        setPhase('saved');
        playWhistle(1200);
        await onFinished();
      })
      .catch((saveError: unknown) => {
        setError(
          saveError instanceof Error ? saveError.message : 'No se pudo guardar el acta.'
        );
        setPhase('error');
      });
  };

  // 2. Cronómetro del partido una vez cargadas las plantillas reales
  useEffect(() => {
    if (phase !== 'playing' || !squads || timeline.length === 0) return;

    let currentMinute = 0;
    intervalRef.current = window.setInterval(() => {
      currentMinute = Math.min(90, currentMinute + 1);
      setMinute(currentMinute);

      const newEvents = timeline.filter(event => event.minuto === currentMinute);
      if (newEvents.length) {
        setEvents(previous => [...previous, ...newEvents]);
      }

      if (currentMinute >= 90) {
        stopClock();

        const finalLocal = timeline.filter(
          event => (event.tipo === 'gol' || event.tipo === 'penalti') && event.equipo === 'local'
        ).length;
        const finalVisit = timeline.filter(
          event => (event.tipo === 'gol' || event.tipo === 'penalti') && event.equipo === 'visitante'
        ).length;

        if (finalLocal === finalVisit) {
          const result = shootout(squads.local, squads.visitante);
          setPenalties({ local: result.local, visitante: result.visitante });
          setPhase('penalties');
          window.setTimeout(() => finish(finalLocal, finalVisit, result), 1700);
        } else {
          window.setTimeout(() => finish(finalLocal, finalVisit), 700);
        }
      }
    }, 80);

    return () => stopClock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, squads, timeline]);

  if (match.status === 'finalizado') {
    return (
      <div className="sim-backdrop" onClick={onClose} role="dialog" aria-modal="true">
        <div
          className="sim-modal"
          onClick={e => e.stopPropagation()}
          style={{ textAlign: 'center', padding: '36px 24px', maxWidth: '440px' }}
        >
          <div
            style={{
              display: 'inline-flex',
              padding: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              borderRadius: '50%',
              color: '#ef4444',
              marginBottom: '14px'
            }}
          >
            <Scale size={28} />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>Partido Finalizado</h3>
          <p style={{ color: 'var(--mut)', margin: '0 0 20px', fontSize: '14px', lineHeight: 1.5 }}>
            Este partido ya ha sido arbitrado oficialmente y su acta está cerrada. No se permite re-arbitrar partidos finalizados.
          </p>
          <button type="button" className="sim-btn sim-btn--primary" onClick={onClose}>
            Entendido
          </button>
        </div>
      </div>
    );
  }

  const finalLocal = score.local;
  const finalVisit = score.visitante;

  return (
    <div className="sim-overlay" role="dialog" aria-modal="true">
      <div className="sim-modal">
        <div className="sim-header">
          <span className="sim-kicker">
            <Scale size={13} /> Acta oficial · Partido #{match.id}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="sim-api-badge" title="Plantillas reales consultadas mediante TheSportsDB API">
              <Sparkles size={11} /> Jugadores Oficiales API
            </span>
            <button
              type="button"
              className="sim-close"
              onClick={() => {
                stopClock();
                onClose();
              }}
              aria-label="Cerrar simulación"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="sim-competition">
          <span>{match.roundName}</span>
          <span className="sim-venue">
            <Clock size={12} /> {match.timeStr} · {match.venue}
          </span>
        </div>

        <div className="sim-scoreboard">
          <div className="sim-team">
            <div>
              <span className="sim-team-name">{localClub}</span>
              <span className="sim-player-sub">Usuario: {localName}</span>
            </div>
            <strong className="sim-goals">{finalLocal}</strong>
          </div>

          <div className="sim-clock">
            {phase === 'loading' ? (
              <span className="sim-live" style={{ color: '#38bdf8' }}>
                <Radio size={12} /> CONECTANDO API...
              </span>
            ) : phase === 'penalties' ? (
              <>
                <span className="sim-live">
                  <Radio size={12} /> PENALTIS
                </span>
                <strong>
                  {penalties?.local ?? 0} - {penalties?.visitante ?? 0}
                </strong>
              </>
            ) : phase === 'saved' || phase === 'saving' ? (
              <>
                <span className="sim-live">
                  <Check size={12} /> FINAL
                </span>
                <strong>90'</strong>
              </>
            ) : (
              <>
                <span className="sim-live">
                  <Radio size={12} /> EN JUEGO
                </span>
                <strong>{minute}'</strong>
              </>
            )}
          </div>

          <div className="sim-team right">
            <strong className="sim-goals">{finalVisit}</strong>
            <div>
              <span className="sim-team-name">{visitClub}</span>
              <span className="sim-player-sub">Usuario: {visitName}</span>
            </div>
          </div>
        </div>

        <div className="sim-progress">
          <span style={{ width: `${Math.min(100, (minute / 90) * 100)}%` }} />
        </div>

        {phase === 'loading' ? (
          <div className="sim-loading-wrap">
            <div className="sim-spinner" />
            <p style={{ margin: 0, fontSize: '13.5px', color: '#94a3b8' }}>
              Consultando la API oficial de TheSportsDB para convocar a los jugadores de <strong>{localClub}</strong> y <strong>{visitClub}</strong>...
            </p>
          </div>
        ) : (
          <div className="sim-event-list">
            {events.length === 0 ? (
              <p className="sim-muted">El árbitro ha pitado el inicio. Rueda el balón…</p>
            ) : (
              [...events].reverse().map((event, index) => (
                <div
                  key={`${event.minuto}-${event.tipo}-${index}`}
                  className={`sim-event sim-event--${event.tipo}`}
                >
                  <span className="sim-minute">{event.minuto}'</span>
                  <span className="sim-event-type">{event.tipo.toUpperCase()}</span>
                  <span className="sim-event-player">{event.jugador}</span>
                  <span className="sim-event-desc">{event.descripcion}</span>
                </div>
              ))
            )}
          </div>
        )}

        {phase === 'penalties' && (
          <div className="sim-penalties">
            <Trophy size={16} /> Tanda de penaltis: {penalties?.local ?? 0} -{' '}
            {penalties?.visitante ?? 0}
          </div>
        )}

        {phase === 'saving' && <p className="sim-muted">Guardando el acta en Supabase con los jugadores del partido…</p>}

        {phase === 'saved' && (
          <div className="sim-saved">
            <Check size={16} /> Acta guardada en Supabase con jugadores reales de los equipos. El ganador avanza de ronda.
          </div>
        )}

        {error && (
          <div className="sim-error">
            <ShieldAlert size={16} /> {error}
          </div>
        )}

        <div className="sim-footer">
          <span className="sim-referee">
            <Scale size={14} /> Árbitro: {user?.nombre_completo ?? 'Sin sesión'}
          </span>
          {phase === 'saved' ? (
            <button type="button" className="sim-btn" onClick={onClose}>
              Cerrar acta
            </button>
          ) : (
            <button
              type="button"
              className="sim-btn sim-btn--ghost"
              onClick={() => {
                stopClock();
                onClose();
              }}
            >
              Salir sin guardar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
