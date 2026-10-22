import React from 'react';
import {
  Gamepad2,
  Trophy,
  Flame,
  Clock,
  Scale,
  Zap,
  Skull,
  Target,
  PauseCircle,
  Users
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const GamerModal: React.FC = () => {
  const { isLight } = useTheme();

  return (
    <div className="halloween-modal-content">
      {/* Cabecera Temática */}
      <div style={{ textAlign: 'center', marginBottom: '14px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '4px',
            color: isLight ? '#0284c7' : 'var(--neon-orange)',
            filter: isLight ? 'drop-shadow(0 2px 6px rgba(2,132,199,0.4))' : 'drop-shadow(0 0 10px rgba(255,94,0,0.8))'
          }}
        >
          <Gamepad2 size={26} />
          <Trophy size={28} />
          <Flame size={26} />
        </div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '22px', fontWeight: 900, color: isLight ? '#0f172a' : '#fff', letterSpacing: '-0.02em', margin: '4px 0 2px' }}>
          Normas y <em style={{ color: isLight ? '#0284c7' : 'var(--neon-orange)', fontStyle: 'normal' }}>Reglamento</em>
        </h2>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10.5px', fontWeight: 700, color: isLight ? '#0369a1' : 'var(--neon-orange)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          EA SPORTS FC 26 · MODO 95 IGUALADO · AULA GAMING SIMARRO
        </span>
      </div>

      {/* 3 Métricas Clave de Competición con Bordes 3D */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
        <div style={{ background: isLight ? '#f0fdf4' : 'rgba(255,94,0,0.12)', border: isLight ? '2px solid #bbf7d0' : '2px solid rgba(255,94,0,0.4)', borderRadius: '10px', padding: '10px', textAlign: 'center', boxShadow: isLight ? '0 3px 0 #86efac' : '0 3px 0 rgba(180,52,3,0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px', color: isLight ? '#16a34a' : '#ff5e00' }}>
            <Clock size={20} />
          </div>
          <div style={{ font: "700 13px 'JetBrains Mono'", color: isLight ? '#16a34a' : '#ff5e00' }}>2 x 5 MIN</div>
          <div style={{ fontSize: '11px', color: isLight ? '#475569' : '#94a3b8' }}>Velocidad Normal</div>
        </div>

        <div style={{ background: isLight ? '#eff6ff' : 'rgba(168,85,247,0.12)', border: isLight ? '2px solid #bfdbfe' : '2px solid rgba(168,85,247,0.4)', borderRadius: '10px', padding: '10px', textAlign: 'center', boxShadow: isLight ? '0 3px 0 #93c5fd' : '0 3px 0 rgba(109,40,217,0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px', color: isLight ? '#2563eb' : '#c084fc' }}>
            <Scale size={20} />
          </div>
          <div style={{ font: "700 13px 'JetBrains Mono'", color: isLight ? '#2563eb' : '#c084fc' }}>MODO 95</div>
          <div style={{ fontSize: '11px', color: isLight ? '#475569' : '#94a3b8' }}>Media igualada</div>
        </div>

        <div style={{ background: isLight ? '#fef2f2' : 'rgba(239,68,68,0.12)', border: isLight ? '2px solid #fecaca' : '2px solid rgba(239,68,68,0.4)', borderRadius: '10px', padding: '10px', textAlign: 'center', boxShadow: isLight ? '0 3px 0 #fca5a5' : '0 3px 0 rgba(153,27,27,0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px', color: isLight ? '#dc2626' : '#f87171' }}>
            {isLight ? <Zap size={20} /> : <Skull size={20} />}
          </div>
          <div style={{ font: "700 13px 'JetBrains Mono'", color: isLight ? '#dc2626' : '#f87171' }}>MUERTE SÚBITA</div>
          <div style={{ fontSize: '11px', color: isLight ? '#475569' : '#94a3b8' }}>Prórroga + Penaltis</div>
        </div>
      </div>

      {/* 4 Reglas Fundamentales (Conciso, Visual, con Bordes 3D) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        <div style={{ background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.75)', border: `2px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`, borderLeft: '4px solid #0284c7', borderRadius: '10px', padding: '10px 14px', boxShadow: isLight ? '0 3px 0 #e2e8f0' : '0 3px 0 rgba(0,0,0,0.5)' }}>
          <strong style={{ color: isLight ? '#0284c7' : '#ff5e00', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <Target size={15} /> Elección de Equipos
          </strong>
          <span style={{ fontSize: '12px', color: isLight ? '#334155' : '#cbd5e1' }}>
            Libertad absoluta de club o selección en cada ronda. Sin restricciones.
          </span>
        </div>

        <div style={{ background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.75)', border: `2px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`, borderLeft: '4px solid #7c3aed', borderRadius: '10px', padding: '10px 14px', boxShadow: isLight ? '0 3px 0 #e2e8f0' : '0 3px 0 rgba(0,0,0,0.5)' }}>
          <strong style={{ color: isLight ? '#7c3aed' : '#c084fc', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <PauseCircle size={15} /> Pausas Tácticas
          </strong>
          <span style={{ fontSize: '12px', color: isLight ? '#334155' : '#cbd5e1' }}>
            Máximo <b>2 pausas</b> por jugador y <b>solo con balón fuera de juego</b>.
          </span>
        </div>

        <div style={{ background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.75)', border: `2px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`, borderLeft: '4px solid #0284c7', borderRadius: '10px', padding: '10px 14px', boxShadow: isLight ? '0 3px 0 #e2e8f0' : '0 3px 0 rgba(0,0,0,0.5)' }}>
          <strong style={{ color: isLight ? '#0284c7' : '#38bdf8', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <Gamepad2 size={15} /> Mandos Oficiales
          </strong>
          <span style={{ fontSize: '12px', color: isLight ? '#334155' : '#cbd5e1' }}>
            Trae tu propio mando (Xbox, PS4, PS5) o usa uno verificado del aula.
          </span>
        </div>

        <div style={{ background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.75)', border: `2px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`, borderLeft: '4px solid #16a34a', borderRadius: '10px', padding: '10px 14px', boxShadow: isLight ? '0 3px 0 #e2e8f0' : '0 3px 0 rgba(0,0,0,0.5)' }}>
          <strong style={{ color: isLight ? '#16a34a' : '#4ade80', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <Users size={15} /> Código Fair Play
          </strong>
          <span style={{ fontSize: '12px', color: isLight ? '#334155' : '#cbd5e1' }}>
            Cero toxicidad. Cualquier falta de respeto conlleva descalificación directa.
          </span>
        </div>
      </div>
    </div>
  );
};
