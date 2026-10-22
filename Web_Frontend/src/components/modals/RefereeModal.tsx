import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { useModal } from '../../context/ModalContext';
import { MatchStatus } from '../../types/tournament';

export const RefereeModal: React.FC = () => {
  const { matches, updateScore } = useTournament();
  const { modalParam, openModal } = useModal();

  const matchId = Number(modalParam) || 1;
  const match = matches.find(m => m.id === matchId) || matches[0];

  const [localGoals, setLocalGoals] = useState(match ? match.goles_local : 0);
  const [visitorGoals, setVisitorGoals] = useState(match ? match.goles_visitante : 0);
  const [status, setStatus] = useState<MatchStatus>(match ? match.estado : 'pendiente');
  const [incidents, setIncidents] = useState(match ? match.incidencias || '' : '');
  const [saving, setSaving] = useState(false);

  if (!match) {
    return <div>No se ha encontrado el partido.</div>;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateScore({
        match_id: match.id,
        goles_local: localGoals,
        goles_visitante: visitorGoals,
        estado: status,
        incidencias: incidents
      });
      openModal('bracket');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2>
        Acta Oficial · <em>Partido #{match.id}</em>
      </h2>
      <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '14px' }}>
        {match.ronda_nombre} · Sede: {match.ubicacion === 'castell' ? 'Torre Mayor del Castillo' : 'Aula de Informática Simarro'}
      </p>

      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,94,0,0.2)' }}>
          {/* Local */}
          <div style={{ textAlign: 'center' }}>
            <strong style={{ display: 'block', fontSize: '15px', color: '#ff5e00' }}>
              {match.jugador_local_nombre || 'Pendiente'}
            </strong>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{match.jugador_local_club || 'Club'}</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setLocalGoals(Math.max(0, localGoals - 1))}
                style={{ width: '28px', height: '28px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                -
              </button>
              <span style={{ fontSize: '24px', fontWeight: 'bold', minWidth: '32px' }}>{localGoals}</span>
              <button
                type="button"
                onClick={() => setLocalGoals(localGoals + 1)}
                style={{ width: '28px', height: '28px', background: '#ff5e00', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                +
              </button>
            </div>
          </div>

          <div style={{ fontSize: '20px', fontWeight: 900, color: '#94a3b8' }}>VS</div>

          {/* Visitante */}
          <div style={{ textAlign: 'center' }}>
            <strong style={{ display: 'block', fontSize: '15px', color: '#ff5e00' }}>
              {match.jugador_visitante_nombre || 'Pendiente'}
            </strong>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{match.jugador_visitante_club || 'Club'}</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setVisitorGoals(Math.max(0, visitorGoals - 1))}
                style={{ width: '28px', height: '28px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                -
              </button>
              <span style={{ fontSize: '24px', fontWeight: 'bold', minWidth: '32px' }}>{visitorGoals}</span>
              <button
                type="button"
                onClick={() => setVisitorGoals(visitorGoals + 1)}
                style={{ width: '28px', height: '28px', background: '#ff5e00', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '14px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
            Estado del Encuentro:
          </label>
          <select value={status} onChange={e => setStatus(e.target.value as MatchStatus)}>
            <option value="pendiente">Pendiente (A la espera)</option>
            <option value="en_curso">En juego (Tiempo reglamentario)</option>
            <option value="finalizado">Finalizado (Cerrar acta y clasificar ganador)</option>
          </select>
        </div>

        <div style={{ marginTop: '10px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
            Observaciones e incidencias (desconexión, prórroga, penaltis):
          </label>
          <input
            type="text"
            placeholder="Sin incidencias registradas..."
            value={incidents}
            onChange={e => setIncidents(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
          <button className="btn-primary-neon" type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Firmar y Guardar Acta'}
          </button>
        </div>
      </form>
    </div>
  );
};

