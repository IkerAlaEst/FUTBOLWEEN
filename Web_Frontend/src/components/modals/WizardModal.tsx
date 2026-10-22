import React, { useState } from 'react';
import {
  Monitor,
  Gamepad2,
  Cpu,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ControllerType } from '../../types/user';

export const WizardModal: React.FC = () => {
  const { user } = useAuth();
  const { isLight } = useTheme();
  const [selectedPad, setSelectedPad] = useState<ControllerType>(user?.tipo_mando || 'ps4');
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSelectPad = (type: ControllerType) => {
    setSelectedPad(type);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2200);
  };

  return (
    <div className="halloween-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Cabecera Oficial: Setup de Mandos */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '4px',
            color: isLight ? '#0284c7' : '#c084fc',
            filter: isLight ? 'drop-shadow(0 2px 6px rgba(2,132,199,0.3))' : 'drop-shadow(0 0 10px rgba(168,85,247,0.8))'
          }}
        >
          <Gamepad2 size={26} />
          <Monitor size={26} />
          <Cpu size={24} />
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
          Setup de <em style={{ color: isLight ? '#0284c7' : '#a855f7', fontStyle: 'normal' }}>Mandos</em>
        </h2>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10.5px',
            fontWeight: 700,
            color: isLight ? '#0369a1' : '#c084fc',
            letterSpacing: '0.12em',
            textTransform: 'uppercase'
          }}
        >
          PUESTO OFICIAL PC GAMING · AULA DE INFORMÁTICA IES SIMARRO
        </span>
      </div>

      {/* Puesto PC Gaming del Torneo con pc_1.png */}
      <div
        style={{
          background: isLight ? '#f0f9ff' : 'linear-gradient(135deg, rgba(30, 16, 50, 0.85), rgba(14, 8, 24, 0.95))',
          border: isLight ? '1.5px solid #bae6fd' : '1.5px solid rgba(168, 85, 247, 0.45)',
          borderRadius: '12px',
          boxShadow: isLight ? '0 3px 10px rgba(2,132,199,0.08)' : '0 4px 16px rgba(0,0,0,0.5)',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}
      >
        <img
          src="/pc_1.png"
          alt="PC Gaming Simarro"
          style={{
            width: '64px',
            height: '52px',
            objectFit: 'contain',
            filter: 'drop-shadow(0 2px 8px rgba(168, 85, 247, 0.4))'
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <span style={{ background: '#a855f7', color: '#fff', fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.04em' }}>
              PUESTO OFICIAL PC
            </span>
            <span style={{ background: isLight ? '#e0f2fe' : 'rgba(56,189,248,0.18)', color: isLight ? '#0369a1' : '#38bdf8', fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(56,189,248,0.3)' }}>
              144 FPS ESTABLES
            </span>
            <span style={{ background: isLight ? '#dcfce7' : 'rgba(34,197,94,0.18)', color: isLight ? '#15803d' : '#4ade80', fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(34,197,94,0.3)' }}>
              0ms LATENCIA USB
            </span>
          </div>
          <div style={{ fontSize: '11.5px', color: isLight ? '#334155' : '#cbd5e1', lineHeight: 1.4 }}>
            Los partidos se juegan en PCs de competición. Selecciona el periférico con el que vas a jugar para registrarlo en tu perfil:
          </div>
        </div>
      </div>

      {savedNotice && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(34,197,94,0.18)', border: '1.5px solid #22c55e', color: '#4ade80', padding: '6px 12px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 700, textAlign: 'center', animation: 'pulse 1.2s infinite' }}>
          <CheckCircle2 size={15} />
          <span>¡Mando guardado correctamente en tu perfil de jugador!</span>
        </div>
      )}

      {/* Grid de los 3 Mandos / Periféricos con imágenes grandes e interacción */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        
        {/* 1. Mando PS4 */}
        <div
          className={`controller-card ${selectedPad === 'ps4' || selectedPad === 'ps5' ? 'active' : ''}`}
          onClick={() => handleSelectPad('ps4')}
          style={{
            padding: '12px 10px',
            textAlign: 'center',
            cursor: 'pointer',
            borderRadius: '12px',
            background: (selectedPad === 'ps4' || selectedPad === 'ps5')
              ? (isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.18)')
              : (isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.75)'),
            border: (selectedPad === 'ps4' || selectedPad === 'ps5')
              ? '2px solid #3b82f6'
              : (isLight ? '1.5px solid #e2e8f0' : '1.5px solid rgba(255,255,255,0.1)'),
            boxShadow: (selectedPad === 'ps4' || selectedPad === 'ps5')
              ? (isLight ? '0 4px 14px rgba(59, 130, 246, 0.25)' : '0 0 18px rgba(59, 130, 246, 0.4)')
              : (isLight ? '0 2px 6px rgba(0,0,0,0.04)' : '0 3px 10px rgba(0,0,0,0.4)'),
            transition: 'all 0.18s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ background: '#2563eb', color: '#fff', fontSize: '8.5px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
              PLAYSTATION
            </span>
            {(selectedPad === 'ps4' || selectedPad === 'ps5') && (
              <CheckCircle2 size={13} style={{ color: '#3b82f6' }} />
            )}
          </div>
          <div style={{ height: '65px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0' }}>
            <img
              src="/ps4_mando.png"
              alt="Mando PS4 DualShock"
              style={{
                maxHeight: '62px',
                maxWidth: '92%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.35))'
              }}
            />
          </div>
          <div style={{ font: "800 13px 'Space Grotesk', sans-serif", color: isLight ? '#0f172a' : '#fff', marginBottom: '2px' }}>Mando PS4</div>
          <span style={{ fontSize: '10.5px', color: isLight ? '#64748b' : '#94a3b8', display: 'block' }}>Sticks simétricos</span>
        </div>

        {/* 2. Mando Xbox One */}
        <div
          className={`controller-card ${selectedPad === 'xbox' ? 'active' : ''}`}
          onClick={() => handleSelectPad('xbox')}
          style={{
            padding: '12px 10px',
            textAlign: 'center',
            cursor: 'pointer',
            borderRadius: '12px',
            background: selectedPad === 'xbox'
              ? (isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.18)')
              : (isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.75)'),
            border: selectedPad === 'xbox'
              ? '2px solid #22c55e'
              : (isLight ? '1.5px solid #e2e8f0' : '1.5px solid rgba(255,255,255,0.1)'),
            boxShadow: selectedPad === 'xbox'
              ? (isLight ? '0 4px 14px rgba(34, 197, 94, 0.25)' : '0 0 18px rgba(34, 197, 94, 0.4)')
              : (isLight ? '0 2px 6px rgba(0,0,0,0.04)' : '0 3px 10px rgba(0,0,0,0.4)'),
            transition: 'all 0.18s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ background: '#16a34a', color: '#fff', fontSize: '8.5px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
              XBOX
            </span>
            {selectedPad === 'xbox' && (
              <CheckCircle2 size={13} style={{ color: '#22c55e' }} />
            )}
          </div>
          <div style={{ height: '65px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0' }}>
            <img
              src="/xbox_mando.png"
              alt="Mando Xbox One"
              style={{
                maxHeight: '62px',
                maxWidth: '92%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.35))'
              }}
            />
          </div>
          <div style={{ font: "800 13px 'Space Grotesk', sans-serif", color: isLight ? '#0f172a' : '#fff', marginBottom: '2px' }}>Mando Xbox</div>
          <span style={{ fontSize: '10.5px', color: isLight ? '#64748b' : '#94a3b8', display: 'block' }}>Sticks asimétricos</span>
        </div>

        {/* 3. Teclado & Ratón Gaming */}
        <div
          className={`controller-card ${selectedPad === 'teclado' || selectedPad === 'centro' ? 'active' : ''}`}
          onClick={() => handleSelectPad('teclado')}
          style={{
            padding: '12px 10px',
            textAlign: 'center',
            cursor: 'pointer',
            borderRadius: '12px',
            background: (selectedPad === 'teclado' || selectedPad === 'centro')
              ? (isLight ? '#fefce8' : 'rgba(234, 179, 8, 0.18)')
              : (isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.75)'),
            border: (selectedPad === 'teclado' || selectedPad === 'centro')
              ? '2px solid #eab308'
              : (isLight ? '1.5px solid #e2e8f0' : '1.5px solid rgba(255,255,255,0.1)'),
            boxShadow: (selectedPad === 'teclado' || selectedPad === 'centro')
              ? (isLight ? '0 4px 14px rgba(234, 179, 8, 0.25)' : '0 0 18px rgba(234, 179, 8, 0.4)')
              : (isLight ? '0 2px 6px rgba(0,0,0,0.04)' : '0 3px 10px rgba(0,0,0,0.4)'),
            transition: 'all 0.18s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ background: '#eab308', color: '#000', fontSize: '8.5px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
              TECLADO PC
            </span>
            {(selectedPad === 'teclado' || selectedPad === 'centro') && (
              <CheckCircle2 size={13} style={{ color: '#eab308' }} />
            )}
          </div>
          <div style={{ height: '65px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0' }}>
            <img
              src="/teclado.png"
              alt="Teclado y Ratón Gaming"
              style={{
                maxHeight: '62px',
                maxWidth: '92%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.35))'
              }}
            />
          </div>
          <div style={{ font: "800 13px 'Space Grotesk', sans-serif", color: isLight ? '#0f172a' : '#fff', marginBottom: '2px' }}>Teclado & Ratón</div>
          <span style={{ fontSize: '10.5px', color: isLight ? '#64748b' : '#94a3b8', display: 'block' }}>Configuración PC</span>
        </div>
      </div>
    </div>
  );
};
