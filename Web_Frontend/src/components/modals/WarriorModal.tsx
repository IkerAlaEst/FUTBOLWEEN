import React from 'react';
import {
  Trophy,
  Medal,
  Crown,
  Target,
  Shield,
  Swords,
  Castle
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const WarriorModal: React.FC = () => {
  const { isLight } = useTheme();

  return (
    <div className="halloween-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Cabecera Oficial: Cuadro de Clasificación */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '4px',
            color: isLight ? '#0284c7' : 'var(--neon-orange)',
            filter: isLight ? 'drop-shadow(0 2px 6px rgba(2,132,199,0.3))' : 'drop-shadow(0 0 10px rgba(255,94,0,0.8))'
          }}
        >
          <Trophy size={28} />
          <Medal size={26} />
          <Crown size={26} />
        </div>
        <h2
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '22px',
            fontWeight: 900,
            color: isLight ? '#0f172a' : '#ffffff',
            letterSpacing: '-0.02em',
            margin: '2px 0 3px'
          }}
        >
          Cuadro de <em style={{ color: isLight ? '#0284c7' : 'var(--neon-orange)', fontStyle: 'normal' }}>Clasificación</em>
        </h2>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10.5px',
            fontWeight: 700,
            color: isLight ? '#0369a1' : 'var(--neon-orange)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase'
          }}
        >
          16 JUGADORES · ELIMINATORIAS DIRECTAS 1v1 · EA SPORTS FC 26
        </span>
      </div>

      {/* Barra de Progreso Visual de las 4 Fases */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.85)',
          border: `1.5px solid ${isLight ? '#cbd5e1' : 'rgba(255, 94, 0, 0.35)'}`,
          borderRadius: '12px',
          boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.04)' : '0 4px 16px rgba(0,0,0,0.5)',
          padding: '12px 10px',
          textAlign: 'center'
        }}
      >
        <div>
          <div style={{ fontSize: '10px', fontWeight: 800, color: isLight ? '#64748b' : '#94a3b8', letterSpacing: '0.06em' }}>OCTAVOS</div>
          <div style={{ font: "800 14px 'JetBrains Mono'", color: isLight ? '#334155' : '#e2e8f0' }}>16 JUG</div>
          <div style={{ fontSize: '10px', color: isLight ? '#94a3b8' : '#64748b' }}>8 Partidos</div>
        </div>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 800, color: '#0284c7', letterSpacing: '0.06em' }}>CUARTOS</div>
          <div style={{ font: "800 14px 'JetBrains Mono'", color: '#0284c7' }}>8 JUG</div>
          <div style={{ fontSize: '10px', color: isLight ? '#0284c7' : '#38bdf8' }}>4 Partidos</div>
        </div>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 800, color: isLight ? '#7c3aed' : '#a855f7', letterSpacing: '0.06em' }}>SEMIS</div>
          <div style={{ font: "800 14px 'JetBrains Mono'", color: isLight ? '#7c3aed' : '#a855f7' }}>4 JUG</div>
          <div style={{ fontSize: '10px', color: isLight ? '#7c3aed' : '#c084fc' }}>2 Partidos</div>
        </div>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 800, color: isLight ? '#ea580c' : '#ff5e00', letterSpacing: '0.06em' }}>GRAN FINAL</div>
          <div style={{ font: "800 14px 'JetBrains Mono'", color: isLight ? '#ea580c' : '#ff5e00' }}>2 FINALISTAS</div>
          <div style={{ fontSize: '10px', color: isLight ? '#ea580c' : '#f97316' }}>Castillo</div>
        </div>
      </div>

      {/* 4 Fases Eliminatorias con Cards de Alta Definición */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
        <div style={{ background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.75)', border: `1.5px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`, borderLeft: '4px solid #64748b', borderRadius: '10px', padding: '10px 14px', boxShadow: isLight ? '0 2px 6px rgba(0,0,0,0.03)' : '0 3px 10px rgba(0,0,0,0.4)' }}>
          <strong style={{ color: isLight ? '#0f172a' : '#fff', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <Target size={15} style={{ color: '#64748b' }} /> Octavos de Final (Aula Simarro)
          </strong>
          <span style={{ fontSize: '12px', color: isLight ? '#334155' : '#cbd5e1' }}>
            8 cruces 1v1 directos. Los 8 vencedores sellan su pase a cuartos de final.
          </span>
        </div>

        <div style={{ background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.75)', border: `1.5px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`, borderLeft: '4px solid #0284c7', borderRadius: '10px', padding: '10px 14px', boxShadow: isLight ? '0 2px 6px rgba(0,0,0,0.03)' : '0 3px 10px rgba(0,0,0,0.4)' }}>
          <strong style={{ color: isLight ? '#0284c7' : '#60a5fa', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <Shield size={15} style={{ color: '#0284c7' }} /> Cuartos de Final (Aula Simarro)
          </strong>
          <span style={{ fontSize: '12px', color: isLight ? '#334155' : '#cbd5e1' }}>
            Partidos a máxima intensidad. Solo los 4 mejores avanzan a semifinales.
          </span>
        </div>

        <div style={{ background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.75)', border: `1.5px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`, borderLeft: '4px solid #7c3aed', borderRadius: '10px', padding: '10px 14px', boxShadow: isLight ? '0 2px 6px rgba(0,0,0,0.03)' : '0 3px 10px rgba(0,0,0,0.4)' }}>
          <strong style={{ color: isLight ? '#7c3aed' : '#c084fc', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <Swords size={15} style={{ color: '#7c3aed' }} /> Semifinales (Aula Simarro)
          </strong>
          <span style={{ fontSize: '12px', color: isLight ? '#334155' : '#cbd5e1' }}>
            Duelo directo por el billete a la cumbre. Los 2 ganadores suben a la Gran Final.
          </span>
        </div>

        <div style={{ background: isLight ? '#fff7ed' : 'linear-gradient(135deg, rgba(255,94,0,0.18), rgba(20,8,12,0.92))', border: `1.5px solid ${isLight ? '#fed7aa' : 'rgba(255,94,0,0.45)'}`, borderLeft: '4px solid #ea580c', borderRadius: '10px', padding: '10px 14px', boxShadow: isLight ? '0 2px 8px rgba(234,88,12,0.1)' : '0 3px 12px rgba(255,94,0,0.25)' }}>
          <strong style={{ color: isLight ? '#c2410c' : 'var(--neon-orange)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <Castle size={15} style={{ color: '#ea580c' }} /> La Gran Final (Castell de Xàtiva)
          </strong>
          <span style={{ fontSize: '12px', color: isLight ? '#7c2d12' : '#fed7aa' }}>
            31 de Octubre a las 20:00 h. El vencedor izará su estandarte en la Torre Mayor.
          </span>
        </div>
      </div>
    </div>
  );
};
