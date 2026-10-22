import React from 'react';
import { Gamepad2, Stethoscope, Trophy, Sparkles, Swords, Castle } from 'lucide-react';
import { useModal } from '../../context/ModalContext';
import { useTheme } from '../../context/ThemeContext';
import { ModalKey } from '../../types/common';

export const HotspotsOverlay: React.FC = () => {
  const { openModal } = useModal();
  const { isLight } = useTheme();

  const npcs = [
    {
      key: 'normas' as ModalKey,
      type: 'gamer',
      title: 'El Gamer',
      subtitle: 'Normas Oficiales del Torneo',
      icon: <Gamepad2 size={16} />
    },
    {
      key: 'setup_mandos' as ModalKey,
      type: isLight ? 'medico' : 'mago',
      title: isLight ? 'El Médico' : 'El Mago',
      subtitle: 'Setup PC & Elección de Mandos',
      icon: isLight ? <Stethoscope size={16} /> : <Sparkles size={16} />
    },
    {
      key: 'cuadro_guerrero' as ModalKey,
      type: isLight ? 'futbolista' : 'guerrero',
      title: isLight ? 'El Futbolista' : 'El Guerrero',
      subtitle: 'Cuadro Eliminatorio & Clasificación',
      icon: isLight ? <Trophy size={16} /> : <Swords size={16} />
    },
    {
      key: 'gran_final' as ModalKey,
      type: 'guardianes',
      title: 'Los Guardianes',
      subtitle: isLight ? 'La Gran Final & Estandarte de Honor' : 'La Gran Final & Estandarte Legendario',
      icon: <Castle size={16} />
    }
  ];

  return (
    <div id="npc-tags-layer" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 30 }}>
      {npcs.map(npc => (
        <div
          key={npc.key}
          id={`npc-tag-${npc.key}`}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            opacity: 0,
            pointerEvents: 'none',
            transform: 'translate3d(0, 0, 0)',
            willChange: 'transform, opacity',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            transition: 'opacity 0.2s ease-out'
          }}
        >
          {/* Pill de diálogo temático */}
          <button
            type="button"
            onClick={() => openModal(npc.key)}
            className="npc-hotspot-pill"
            style={{
              background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(12, 10, 20, 0.88)',
              backdropFilter: 'blur(10px)',
              border: `1.5px solid ${isLight ? '#0284c7' : 'var(--neon-orange)'}`,
              borderRadius: '20px',
              padding: '6px 14px',
              color: isLight ? '#0f172a' : '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: isLight
                ? '0 4px 16px rgba(2, 132, 199, 0.3)'
                : '0 0 16px rgba(255, 94, 0, 0.4), inset 0 0 8px rgba(147, 51, 234, 0.3)',
              transition: 'transform 0.15s ease, box-shadow 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <span style={{ fontSize: '14px', display: 'flex', alignItems: 'center' }}>
              {npc.icon}
            </span>
            <div style={{ textAlign: 'left' }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: isLight ? '#0284c7' : 'var(--neon-orange)',
                  display: 'block',
                  textTransform: 'uppercase'
                }}
              >
                {npc.title}
              </span>
              <span style={{ fontSize: '10px', color: isLight ? '#475569' : '#cbd5e1' }}>{npc.subtitle}</span>
            </div>
          </button>

          {/* Flecha indicadora hacia el personaje 3D debajo */}
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: `6px solid ${isLight ? '#0284c7' : 'var(--neon-orange)'}`,
              filter: isLight ? 'drop-shadow(0 2px 4px rgba(2,132,199,0.3))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))'
            }}
          />
        </div>
      ))}
    </div>
  );
};
