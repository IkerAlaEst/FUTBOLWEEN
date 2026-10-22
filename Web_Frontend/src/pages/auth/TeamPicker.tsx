import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Check, MapPin, RefreshCw, Trophy } from 'lucide-react';
import { fetchTeamsByLeague, LEAGUES, LeagueOption, TeamOption } from '../../services/sportsDb';

interface TeamPickerProps {
  leagueId: string;
  onLeagueChange: (leagueId: string) => void;
  selectedTeamId?: string;
  onSelect: (team: TeamOption | null) => void;
  optional?: boolean;
}

export const TeamPicker: React.FC<TeamPickerProps> = ({
  leagueId,
  onLeagueChange,
  selectedTeamId,
  onSelect,
  optional = false
}) => {
  const league = useMemo<LeagueOption>(
    () => LEAGUES.find(item => item.id === leagueId) ?? LEAGUES[0],
    [leagueId]
  );
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'api' | 'fallback'>('api');
  const [index, setIndex] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchTeamsByLeague(league).then(result => {
      if (!alive) return;
      setTeams(result.teams);
      setSource(result.source);
      setLoading(false);
      setIndex(0);
    });
    return () => {
      alive = false;
    };
  }, [league, reloadKey]);

  useEffect(() => {
    if (!selectedTeamId) return;
    const found = teams.findIndex(team => team.id === selectedTeamId);
    if (found >= 0) setIndex(found);
  }, [teams, selectedTeamId]);

  const team = teams[index];

  const step = (delta: number) => {
    if (!teams.length) return;
    setIndex(previous => (previous + delta + teams.length) % teams.length);
  };

  const handleLeague = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onSelect(null);
    onLeagueChange(event.target.value);
  };

  return (
    <div className="team-picker">
      <div className="team-picker-head">
        <label className="team-picker-league">
          <span className="team-picker-label">
            <Trophy size={13} /> Liga
          </span>
          <select value={league.id} onChange={handleLeague}>
            {LEAGUES.map(item => (
              <option key={item.id} value={item.id}>
                {item.flag} {item.name}
              </option>
            ))}
          </select>
        </label>
        <span
          className={`team-source ${source === 'api' ? 'is-live' : 'is-local'}`}
          title={
            source === 'api'
              ? 'Equipos cargados en directo desde TheSportsDB'
              : 'TheSportsDB no ha respondido: mostrando equipos de respaldo'
          }
        >
          <span className="team-source-dot" />
          {source === 'api' ? 'TheSportsDB · en vivo' : 'Modo local'}
          <button
            type="button"
            className="team-source-refresh"
            onClick={() => setReloadKey(key => key + 1)}
            title="Volver a cargar equipos"
            aria-label="Recargar equipos"
          >
            <RefreshCw size={11} />
          </button>
        </span>
      </div>

      {loading ? (
        <div className="team-loading" role="status" aria-live="polite">
          <div className="team-loading-badge" />
          <div className="team-loading-lines">
            <span />
            <span />
            <span />
          </div>
          <p>Buscando equipos de {league.name}…</p>
        </div>
      ) : (
        <div
          className="team-carousel"
          tabIndex={0}
          onKeyDown={event => {
            if (event.key === 'ArrowLeft') {
              event.preventDefault();
              step(-1);
            } else if (event.key === 'ArrowRight') {
              event.preventDefault();
              step(1);
            }
          }}
        >
          <button type="button" className="team-arrow" onClick={() => step(-1)} aria-label="Equipo anterior">
            <ChevronLeft size={20} />
          </button>

          {team && (
            <button
              type="button"
              key={team.id}
              className={`team-card ${selectedTeamId === team.id ? 'is-selected' : ''}`}
              onClick={() => onSelect(selectedTeamId === team.id ? null : team)}
              style={
                {
                  '--team-color': team.color,
                  '--team-color-2': team.color2
                } as React.CSSProperties
              }
            >
              <span className="team-card-glow" aria-hidden="true" />
              <span className="team-badge">
                <span className="team-badge-initials">{team.shortName}</span>
                {team.badge ? (
                  <img
                    src={team.badge}
                    alt=""
                    loading="lazy"
                    onError={event => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                ) : null}
              </span>
              <span className="team-name">{team.name}</span>
              <span className="team-meta">
                <MapPin size={12} /> {team.stadium || 'Estadio desconocido'}
              </span>
              <span className="team-league-tag">
                {league.flag} {league.name}
              </span>
              <span className={`team-select-hint ${selectedTeamId === team.id ? 'is-on' : ''}`}>
                {selectedTeamId === team.id ? (
                  <>
                    <Check size={13} /> Equipo elegido
                  </>
                ) : (
                  'Pulsa para elegir este equipo'
                )}
              </span>
            </button>
          )}

          <button type="button" className="team-arrow" onClick={() => step(1)} aria-label="Equipo siguiente">
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {!loading && teams.length > 0 && (
        <div className="team-picker-foot">
          <span className="team-counter">
            {index + 1} / {teams.length}
          </span>
          <div className="team-dots" role="tablist" aria-label="Equipos disponibles">
            {teams.map((item, dotIndex) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={dotIndex === index}
                aria-label={item.name}
                className={`team-dot ${dotIndex === index ? 'is-on' : ''}`}
                onClick={() => setIndex(dotIndex)}
              />
            ))}
          </div>
          {optional && (
            <button type="button" className="team-skip" onClick={() => onSelect(null)}>
              Más tarde
            </button>
          )}
        </div>
      )}

      {!loading && teams.length === 0 && (
        <p className="team-empty">No hay equipos disponibles ahora mismo. Prueba otra liga.</p>
      )}
    </div>
  );
};
