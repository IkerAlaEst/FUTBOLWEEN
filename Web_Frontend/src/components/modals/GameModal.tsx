import React, { useEffect, useRef } from 'react';
import { useModal } from '../../context/ModalContext';
import { X, Gamepad2, Trophy, Sparkles, ArrowLeft } from 'lucide-react';

export const GameModal: React.FC = () => {
  const { closeModal } = useModal();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    // 1. Escuchar la tecla 'Q' o 'Escape' en la ventana principal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'q' || e.key === 'Q' || e.key === 'Escape') {
        e.preventDefault();
        closeModal();
      }
    };

    // 2. Escuchar mensajes postMessage enviados desde el iframe del juego
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'EXIT_GAME') {
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('message', handleMessage);

    // Dar foco al iframe automáticamente tras montar para que el usuario juegue directamente
    const timer = setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.focus();
      }
    }, 300);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('message', handleMessage);
      clearTimeout(timer);
    };
  }, [closeModal]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(3, 4, 8, 0.96)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'gameScreenFadeIn 0.35s ease-out forwards'
      }}
    >
      {/* Barra superior de control del juego (Header Gamer) */}
      <header
        style={{
          height: '62px',
          padding: '0 20px',
          background: 'linear-gradient(90deg, rgba(15, 20, 32, 0.98), rgba(26, 12, 6, 0.98))',
          borderBottom: '2px solid var(--neon-orange)',
          boxShadow: '0 4px 25px rgba(255, 94, 0, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10
        }}
      >
        {/* Lado izquierdo: Título y lema solicitado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'radial-gradient(circle, #ff5e00, #9333ea)',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 0 16px rgba(255, 94, 0, 0.6)'
            }}
          >
            <Gamepad2 size={22} color="#fff" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 900,
                  fontSize: '16px',
                  color: '#fff',
                  letterSpacing: '0.04em'
                }}
              >
                ¡PRUEBA FIFA O ENTRENA CON NOSOTROS!
              </span>
              <span
                style={{
                  background: 'rgba(34, 197, 94, 0.2)',
                  color: '#4ade80',
                  border: '1px solid rgba(34, 197, 94, 0.5)',
                  fontSize: '10px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}
              >
                ● EASTER EGG ONLINE
              </span>
            </div>
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '11px',
                color: '#94a3b8',
                display: 'block'
              }}
            >
              Simulador 3D Striker · Argentina vs España · Modo 95
            </span>
          </div>
        </div>

        {/* Centro: Controles rápidos */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            color: '#cbd5e1'
          }}
          className="hide-on-mobile"
        >
          <span style={{ background: 'rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: '4px' }}>
            WASD / Flechas: Moverse
          </span>
          <span style={{ background: 'rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: '4px' }}>
            Espacio: Disparar
          </span>
          <span style={{ background: 'rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: '4px' }}>
            J / K: Pasar
          </span>
        </div>

        {/* Lado derecho: Botón y atajo 'Q' para salir */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={closeModal}
            style={{
              background: 'linear-gradient(135deg, #ff5e00, #ea580c)',
              color: '#05060a',
              border: 'none',
              padding: '8px 18px',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 800,
              fontSize: '12px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              borderRadius: '6px',
              boxShadow: '0 0 18px rgba(255, 94, 0, 0.65)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'transform 0.15s, box-shadow 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px) scale(1.03)';
              e.currentTarget.style.boxShadow = '0 0 25px rgba(255, 94, 0, 0.9)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 0 18px rgba(255, 94, 0, 0.65)';
            }}
          >
            <span
              style={{
                background: '#05060a',
                color: '#ff5e00',
                padding: '2px 6px',
                borderRadius: '4px',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 900,
                fontSize: '11px'
              }}
            >
              Q
            </span>
            <span>Salir</span>
            <X size={16} />
          </button>
        </div>
      </header>

      {/* Contenedor del juego Striker 3D embebido */}
      <div
        style={{
          flex: 1,
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
          background: '#0b0e12'
        }}
      >
        <iframe
          ref={iframeRef}
          src="/game/index.html"
          title="Striker 3D Football Game"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block'
          }}
          allow="gamepad; autoplay; fullscreen"
        />
      </div>

      <style>{`
        @keyframes gameScreenFadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @media (max-width: 820px) {
          .hide-on-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
};

