import React, { useState } from 'react';
import { MapPin, Navigation, School, Castle, CheckCircle2 } from 'lucide-react';
import { useModal } from '../../context/ModalContext';
import { useTheme } from '../../context/ThemeContext';

export const LocationModal: React.FC = () => {
  const { modalParam } = useModal();
  const { isLight } = useTheme();

  const [activeTab, setActiveTab] = useState<'torneo' | 'final'>(
    modalParam === 'final' ? 'final' : 'torneo'
  );

  const locations = {
    torneo: {
      title: 'IES Dr. Lluís Simarro',
      subtitle: 'Fase Clasificatoria · Aula de Informática',
      badge: 'SEDE CLASIFICATORIA',
      badgeColor: '#0284c7',
      address: "Carrer d'Anselm Turmeda, s/n, 46800 Xàtiva, Valencia",
      schedule: 'Viernes 31 de Octubre · Desde las 16:00 h',
      mapUrl: 'https://maps.google.com/maps?q=IES+Doctor+Lluis+Simarro+Xativa&t=&z=16&ie=UTF8&iwloc=&output=embed',
      features: [
        'Aula de Informática con 16 PCs Gaming 144 FPS',
        'Conexión por cable LAN de 0ms latencia',
        'Zona de espectadores con proyector en directo',
        'Aparcamiento gratuito en las inmediaciones'
      ]
    },
    final: {
      title: 'Castell de Xàtiva',
      subtitle: 'La Gran Final · Cota 310m de Altitud',
      badge: 'SEDE GRAN FINAL',
      badgeColor: '#ea580c',
      address: 'Castell de Xàtiva, s/n, 46800 Xàtiva, Valencia',
      schedule: 'Viernes 31 de Octubre · 20:00 h en directo',
      mapUrl: 'https://maps.google.com/maps?q=Castell+de+Xativa&t=&z=16&ie=UTF8&iwloc=&output=embed',
      features: [
        'Escenario histórico en la Torre del Homenaje',
        'Entrega e izado del Estandarte del Campeón con Escudo',
        'Emisión en directo a la pantalla gigante del Simarro'
      ]
    }
  };

  const current = locations[activeTab];

  return (
    <div className="halloween-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Cabecera Oficial */}
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
          <School size={26} />
          <MapPin size={28} />
          <Castle size={26} />
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
          Sedes y <em style={{ color: isLight ? '#0284c7' : 'var(--neon-orange)', fontStyle: 'normal' }}>Ubicación</em>
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
          IES DR. LLUÍS SIMARRO & CASTELL DE XÀTIVA
        </span>
      </div>

      {/* Selector de Pestañas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('torneo')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '9px 14px',
            background: activeTab === 'torneo'
              ? (isLight ? '#0284c7' : '#ff5e00')
              : (isLight ? '#f1f5f9' : 'rgba(15, 23, 42, 0.75)'),
            color: activeTab === 'torneo' ? '#ffffff' : (isLight ? '#334155' : '#cbd5e1'),
            border: activeTab === 'torneo'
              ? `2px solid ${isLight ? '#0369a1' : '#ff7a29'}`
              : `1.5px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: '10px',
            boxShadow: activeTab === 'torneo'
              ? (isLight ? '0 3px 10px rgba(2,132,199,0.3)' : '0 3px 12px rgba(255,94,0,0.35)')
              : 'none',
            cursor: 'pointer',
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            transition: 'all 0.15s ease'
          }}
        >
          <School size={16} />
          <span>Fase Previa: IES Simarro</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('final')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '9px 14px',
            background: activeTab === 'final'
              ? (isLight ? '#0284c7' : '#ea580c')
              : (isLight ? '#f1f5f9' : 'rgba(15, 23, 42, 0.75)'),
            color: activeTab === 'final' ? '#ffffff' : (isLight ? '#334155' : '#cbd5e1'),
            border: activeTab === 'final'
              ? `2px solid ${isLight ? '#0369a1' : '#f97316'}`
              : `1.5px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: '10px',
            boxShadow: activeTab === 'final'
              ? (isLight ? '0 3px 10px rgba(2,132,199,0.3)' : '0 3px 12px rgba(234,88,12,0.35)')
              : 'none',
            cursor: 'pointer',
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            transition: 'all 0.15s ease'
          }}
        >
          <Castle size={16} />
          <span>Gran Final: Castell</span>
        </button>
      </div>

      {/* DISPOSICIÓN: EL MAPA Y AL LADO LA INFO (2 Columnas simétricas) */}
      <div
        className="location-modal-grid"
        style={{
          background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.85)',
          border: `1.5px solid ${isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.12)'}`,
          borderTop: `4px solid ${current.badgeColor}`,
          borderRadius: '14px',
          padding: '14px',
          boxShadow: isLight
            ? '0 4px 16px rgba(0,0,0,0.06)'
            : '0 6px 20px rgba(0,0,0,0.4)',
          alignItems: 'stretch'
        }}
      >
        {/* COLUMNA IZQUIERDA: EL MAPA */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            minHeight: '260px',
            height: '100%',
            borderRadius: '10px',
            overflow: 'hidden',
            border: `1.5px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.16)'}`,
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          <iframe
            title={current.title}
            src={current.mapUrl}
            width="100%"
            height="100%"
            style={{ border: 0, display: 'block', minHeight: '260px' }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* COLUMNA DERECHA: LA INFO */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '10px'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
              <div>
                <h3
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '18px',
                    fontWeight: 900,
                    color: isLight ? '#0f172a' : '#fff',
                    margin: 0
                  }}
                >
                  {current.title}
                </h3>
                <span style={{ fontSize: '11.5px', color: isLight ? '#64748b' : '#94a3b8' }}>
                  {current.subtitle}
                </span>
              </div>

              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '9.5px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '5px',
                  background: `${current.badgeColor}22`,
                  color: current.badgeColor,
                  border: `1px solid ${current.badgeColor}66`,
                  whiteSpace: 'nowrap'
                }}
              >
                {current.badge}
              </span>
            </div>

            {/* Dirección y Horario */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: isLight ? '#334155' : '#e2e8f0' }}>
                <MapPin size={15} style={{ color: current.badgeColor, flexShrink: 0, marginTop: '2px' }} />
                <span><b>Dirección:</b> {current.address}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isLight ? '#64748b' : '#94a3b8' }}>
                <Navigation size={15} style={{ color: current.badgeColor, flexShrink: 0 }} />
                <span><b>Horario:</b> {current.schedule}</span>
              </div>
            </div>

            {/* Características de la Sede */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {current.features.map((feat, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    fontSize: '11.5px',
                    color: isLight ? '#334155' : '#cbd5e1',
                    background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.04)',
                    padding: '5px 8px',
                    borderRadius: '7px',
                    border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.06)'}`
                  }}
                >
                  <CheckCircle2 size={13} style={{ color: current.badgeColor, flexShrink: 0 }} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'right', borderTop: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`, paddingTop: '6px' }}>
            <span style={{ fontSize: '10.5px', color: isLight ? '#94a3b8' : '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
              Xàtiva 2026 · Mapa GPS Integrado
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
