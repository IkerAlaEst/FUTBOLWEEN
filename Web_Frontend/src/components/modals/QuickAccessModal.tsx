import React from 'react';
import {
  FileText,
  MapPin,
  Castle,
  Trophy,
  Gamepad2,
  Zap,
  ChevronRight
} from 'lucide-react';
import { useModal } from '../../context/ModalContext';
import { useTheme } from '../../context/ThemeContext';
import { ModalKey } from '../../types/common';

export const QuickAccessModal: React.FC = () => {
  const { openModal } = useModal();
  const { isLight } = useTheme();

  // Las 5 secciones oficiales requeridas: Normas, Ubicación, Final, Clasificación y Setup de Mandos
  const buttons: {
    title: string;
    badge: string;
    color: string;
    icon: React.ReactNode;
    subtitle: string;
    targetKey: ModalKey;
    param?: string;
    highlight?: boolean;
  }[] = [
    {
      title: 'Normas',
      badge: 'EA FC 26 · MODO 95',
      color: '#ff5e00',
      icon: <FileText size={22} />,
      subtitle: '2x5 min · Medias 95 · Prórroga y penaltis oficiales',
      targetKey: 'normas'
    },
    {
      title: 'Ubicación',
      badge: 'SEDES Y MAPAS',
      color: '#0284c7',
      icon: <MapPin size={22} />,
      subtitle: 'Aula Gaming Simarro & Castell de Xàtiva',
      targetKey: 'ubicaciones',
      param: 'torneo'
    },
    {
      title: 'Final',
      badge: '31 OCT · 20:00 H',
      color: '#eab308',
      icon: <Castle size={22} />,
      subtitle: 'Torre del Homenaje a 310m de altitud',
      targetKey: 'gran_final'
    },
    {
      title: 'Clasificación',
      badge: '16 JUGADORES · 1v1',
      color: '#22c55e',
      icon: <Trophy size={22} />,
      subtitle: 'Cuadro de eliminatorias directas hacia el título',
      targetKey: 'cuadro_guerrero'
    },
    {
      title: 'Setup de Mandos',
      badge: 'PS4 · XBOX · TECLADO',
      color: '#a855f7',
      icon: <Gamepad2 size={24} />,
      subtitle: 'Configuración oficial de periféricos en PCs a 144 FPS',
      targetKey: 'setup_mandos',
      highlight: true
    }
  ];

  return (
    <div className="halloween-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Cabecera oficial estilizada */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 14px',
            borderRadius: '999px',
            background: isLight ? 'rgba(2, 132, 199, 0.12)' : 'rgba(255, 94, 0, 0.16)',
            border: `1.5px solid ${isLight ? 'rgba(2, 132, 199, 0.45)' : 'rgba(255, 94, 0, 0.5)'}`,
            color: isLight ? '#0284c7' : 'var(--neon-orange)',
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '6px',
            boxShadow: isLight ? '0 0 12px rgba(2, 132, 199, 0.15)' : '0 0 14px rgba(255, 94, 0, 0.25)'
          }}
        >
          <Zap size={13} style={{ fill: isLight ? '#0284c7' : 'var(--neon-orange)' }} />
          <span>DIRECTORIO OFICIAL · GUÍA DEL TORNEO</span>
        </div>

        <h2
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '22px',
            fontWeight: 900,
            color: isLight ? '#0f172a' : '#ffffff',
            margin: '0 0 4px',
            letterSpacing: '-0.02em'
          }}
        >
          Guía Oficial del <em style={{ color: isLight ? '#0284c7' : 'var(--neon-orange)', fontStyle: 'normal' }}>Torneo</em>
        </h2>

        <p
          style={{
            fontSize: '12.5px',
            color: isLight ? '#475569' : '#cbd5e1',
            margin: 0,
            fontWeight: 500
          }}
        >
          Consulta las normas, sedes con mapa, la gran final, el cuadro y la configuración de mandos
        </p>
      </div>

      {/* Grid de 5 tarjetas simétrico: 2 filas de 2 tarjetas + 1 tarjeta destacada inferior */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px'
        }}
      >
        {buttons.map((btn, idx) => {
          const isFullWidth = !!btn.highlight;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => openModal(btn.targetKey, btn.param)}
              style={{
                gridColumn: isFullWidth ? '1 / -1' : 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: isFullWidth ? '14px 18px' : '13px 16px',
                textAlign: 'left',
                cursor: 'pointer',
                background: isLight
                  ? `linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)`
                  : `linear-gradient(135deg, ${btn.color}22 0%, rgba(20, 14, 32, 0.96) 55%, rgba(12, 8, 20, 0.98) 100%)`,
                border: `1.5px solid ${isLight ? `${btn.color}55` : `${btn.color}80`}`,
                borderLeft: `5px solid ${btn.color}`,
                borderRadius: '14px',
                boxShadow: isLight
                  ? `0 4px 14px -2px rgba(15, 23, 42, 0.08), 0 0 16px ${btn.color}20`
                  : `0 6px 20px -3px rgba(0, 0, 0, 0.65), 0 0 20px ${btn.color}35`,
                transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s ease, border-color 0.18s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.012)';
                e.currentTarget.style.borderColor = btn.color;
                e.currentTarget.style.boxShadow = isLight
                  ? `0 10px 24px -2px rgba(15, 23, 42, 0.14), 0 0 24px ${btn.color}45`
                  : `0 12px 30px -3px rgba(0, 0, 0, 0.75), 0 0 28px ${btn.color}65`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = isLight ? `${btn.color}55` : `${btn.color}80`;
                e.currentTarget.style.boxShadow = isLight
                  ? `0 4px 14px -2px rgba(15, 23, 42, 0.08), 0 0 16px ${btn.color}20`
                  : `0 6px 20px -3px rgba(0, 0, 0, 0.65), 0 0 20px ${btn.color}35`;
              }}
            >
              {/* Contenedor del Icono con iluminación y gradiente */}
              <div
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: isFullWidth ? '46px' : '42px',
                  height: isFullWidth ? '46px' : '42px',
                  borderRadius: '12px',
                  background: isLight
                    ? `linear-gradient(135deg, ${btn.color}25 0%, ${btn.color}12 100%)`
                    : `linear-gradient(135deg, ${btn.color}50 0%, ${btn.color}18 100%)`,
                  border: `1.5px solid ${btn.color}`,
                  color: isLight ? btn.color : '#ffffff',
                  boxShadow: isLight
                    ? `0 0 12px ${btn.color}35`
                    : `0 0 18px ${btn.color}55`,
                  flexShrink: 0
                }}
              >
                {btn.icon}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <span
                    style={{
                      font: "800 9.5px 'JetBrains Mono', monospace",
                      letterSpacing: '0.06em',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: isLight ? `${btn.color}18` : `${btn.color}30`,
                      color: btn.color,
                      border: `1px solid ${btn.color}60`,
                      boxShadow: `0 0 8px ${btn.color}20`,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {btn.badge}
                  </span>
                  <ChevronRight size={16} style={{ color: btn.color, opacity: 0.9, flexShrink: 0 }} />
                </div>

                <strong
                  style={{
                    font: "800 14px 'Space Grotesk', sans-serif",
                    color: isLight ? '#0f172a' : '#ffffff',
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1.25,
                    margin: '2px 0 2px'
                  }}
                >
                  {btn.title}
                </strong>

                <span
                  style={{
                    fontSize: '11.5px',
                    color: isLight ? '#64748b' : '#94a3b8',
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontWeight: 500
                  }}
                >
                  {btn.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
