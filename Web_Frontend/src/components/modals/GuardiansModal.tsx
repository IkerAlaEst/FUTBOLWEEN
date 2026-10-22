import React, { useState } from 'react';
import {
  Castle,
  Shield,
  Crown,
  Swords,
  Calendar,
  MapPin,
  Award,
  Tv
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const GuardiansModal: React.FC = () => {
  const { user } = useAuth();
  const { isLight } = useTheme();
  const [championName, setChampionName] = useState(user?.gamertag || 'Marc Navarro');

  return (
    <div className="halloween-modal-content">
      {/* Cabecera de los Guardianes del Castillo de Xàtiva */}
      <div style={{ textAlign: 'center', marginBottom: '14px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '4px',
            color: isLight ? '#0284c7' : 'var(--neon-orange)',
            filter: isLight ? 'drop-shadow(0 2px 6px rgba(2,132,199,0.3))' : 'drop-shadow(0 0 12px rgba(255,94,0,0.9))'
          }}
        >
          <Castle size={28} />
          {isLight ? <Shield size={26} /> : <Swords size={26} />}
          <Crown size={26} />
        </div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '22px', fontWeight: 900, color: isLight ? '#0f172a' : '#fff', letterSpacing: '-0.02em', margin: '4px 0 2px' }}>
          La Gran Final en el <em style={{ color: isLight ? '#0284c7' : 'var(--neon-orange)', fontStyle: 'normal' }}>Castillo</em>
        </h2>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10.5px', fontWeight: 700, color: isLight ? '#0369a1' : 'var(--neon-orange)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          31 DE OCTUBRE · 20:00 H · CIMA DEL CASTELL DE XÀTIVA
        </span>
      </div>

      {/* 3 Insignias de la Gran Final con Bordes 3D */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
        <div style={{ background: isLight ? '#f0fdf4' : 'rgba(255,94,0,0.12)', border: isLight ? '2px solid #bbf7d0' : '2px solid rgba(255,94,0,0.4)', borderRadius: '10px', padding: '8px', textAlign: 'center', boxShadow: isLight ? '0 3px 0 #86efac' : '0 3px 0 rgba(180,52,3,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', font: "700 12px 'JetBrains Mono'", color: isLight ? '#16a34a' : '#ff5e00', marginBottom: '2px' }}>
            <Calendar size={13} />
            <span>31 OCTUBRE</span>
          </div>
          <div style={{ fontSize: '11px', color: isLight ? '#475569' : '#94a3b8' }}>20:00 H en Directo</div>
        </div>

        <div style={{ background: isLight ? '#eff6ff' : 'rgba(168,85,247,0.12)', border: isLight ? '2px solid #bfdbfe' : '2px solid rgba(168,85,247,0.4)', borderRadius: '10px', padding: '8px', textAlign: 'center', boxShadow: isLight ? '0 3px 0 #93c5fd' : '0 3px 0 rgba(109,40,217,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', font: "700 12px 'JetBrains Mono'", color: isLight ? '#2563eb' : '#c084fc', marginBottom: '2px' }}>
            <MapPin size={13} />
            <span>COTA 310M</span>
          </div>
          <div style={{ fontSize: '11px', color: isLight ? '#475569' : '#94a3b8' }}>Torre del Homenaje</div>
        </div>

        <div style={{ background: isLight ? '#fefce8' : 'rgba(234,179,8,0.12)', border: isLight ? '2px solid #fde047' : '2px solid rgba(234,179,8,0.4)', borderRadius: '10px', padding: '8px', textAlign: 'center', boxShadow: isLight ? '0 3px 0 #facc15' : '0 3px 0 rgba(161,98,7,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', font: "700 12px 'JetBrains Mono'", color: isLight ? '#ca8a04' : '#facc15', marginBottom: '2px' }}>
            <Award size={13} />
            <span>EL PREMIO</span>
          </div>
          <div style={{ fontSize: '11px', color: isLight ? '#475569' : '#94a3b8' }}>Estandarte con tu Cara</div>
        </div>
      </div>

      {/* Disposición Libro: Estandarte con Escudo de Xàtiva a la izquierda, Claves a la derecha */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 1.2fr', gap: '14px', marginBottom: '14px', alignItems: 'center' }}>
        
        {/* Simulador Interactivo del Estandarte con el Escudo Oficial de Xàtiva y Borde 3D */}
        <div
          className="banner-preview-card"
          style={{
            padding: '12px',
            textAlign: 'center',
            background: isLight ? '#ffffff' : undefined,
            border: `2px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.14)'}`,
            borderRadius: '12px',
            boxShadow: isLight ? '0 4px 0 #cbd5e1' : '0 4px 0 rgba(0,0,0,0.5)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: isLight ? '#0284c7' : 'var(--neon-orange)', textTransform: 'uppercase', marginBottom: '8px' }}>
            <Award size={14} />
            <span>Tu Estandarte en el Castillo</span>
          </div>

          <div className="medieval-banner-display" style={{ margin: '0 auto 10px' }}>
            <div className="banner-pole" />
            <div
              className="banner-fabric"
              style={{
                width: '136px',
                padding: '10px 8px 16px',
                background: isLight
                  ? 'linear-gradient(180deg, #0284c7 0%, #0369a1 60%, #1e3a8a 100%)'
                  : 'linear-gradient(180deg, #ff5e00 0%, #b43403 60%, #4c1d95 100%)'
              }}
            >
              {/* Escudo Oficial de Xàtiva en el Estandarte */}
              <img
                src="/escudo.png"
                alt="Escut de Xàtiva"
                style={{
                  width: '32px',
                  height: '36px',
                  objectFit: 'contain',
                  margin: '0 auto 4px',
                  display: 'block',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))'
                }}
              />
              <div className="banner-face-avatar" style={{ width: '38px', height: '38px', fontSize: '14px', margin: '4px auto' }}>
                {championName.substring(0, 2).toUpperCase()}
              </div>
              <div className="banner-title" style={{ fontSize: '8px' }}>CAMPEÓN 2026</div>
              <div className="banner-name" style={{ fontSize: '11px' }}>{championName.toUpperCase()}</div>
              <div className="banner-castle" style={{ fontSize: '8px' }}>CASTELL DE XÀTIVA</div>
            </div>
          </div>

          <input
            type="text"
            value={championName}
            onChange={e => setChampionName(e.target.value)}
            placeholder="Tu Gamertag..."
            style={{
              width: '100%',
              padding: '6px 10px',
              fontSize: '12px',
              textAlign: 'center',
              background: isLight ? '#f8fafc' : undefined,
              color: isLight ? '#0f172a' : undefined,
              borderColor: isLight ? '#cbd5e1' : undefined,
              borderRadius: '6px'
            }}
          />
        </div>

        {/* 3 Puntos Clave de la Final con Bordes 3D */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.75)', border: `2px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`, borderLeft: '4px solid #0284c7', borderRadius: '10px', padding: '8px 12px', boxShadow: isLight ? '0 3px 0 #e2e8f0' : '0 3px 0 rgba(0,0,0,0.5)' }}>
            <strong style={{ color: isLight ? '#0284c7' : '#ff5e00', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Castle size={14} /> La Cumbre del Torneo
            </strong>
            <p style={{ fontSize: '11px', color: isLight ? '#334155' : '#cbd5e1', margin: '2px 0 0' }}>
              Solo los 2 finalistas ascienden a la fortaleza medieval de Xàtiva para el duelo definitivo.
            </p>
          </div>

          <div style={{ background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.75)', border: `2px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`, borderLeft: '4px solid #7c3aed', borderRadius: '10px', padding: '8px 12px', boxShadow: isLight ? '0 3px 0 #e2e8f0' : '0 3px 0 rgba(0,0,0,0.5)' }}>
            <strong style={{ color: isLight ? '#7c3aed' : '#c084fc', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tv size={14} /> Retransmisión en Pantalla Gigante
            </strong>
            <p style={{ fontSize: '11px', color: isLight ? '#334155' : '#cbd5e1', margin: '2px 0 0' }}>
              El partido se emite en directo en el patio del Simarro para toda la afición.
            </p>
          </div>

          <div style={{ background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.75)', border: `2px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`, borderLeft: '4px solid #ca8a04', borderRadius: '10px', padding: '8px 12px', boxShadow: isLight ? '0 3px 0 #e2e8f0' : '0 3px 0 rgba(0,0,0,0.5)' }}>
            <strong style={{ color: isLight ? '#ca8a04' : '#facc15', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Crown size={14} /> Gloria Eterna en Xàtiva
            </strong>
            <p style={{ fontSize: '11px', color: isLight ? '#334155' : '#cbd5e1', margin: '2px 0 0' }}>
              El estandarte con tu rostro ondeará en la torre más alta visible desde toda la ciudad.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
