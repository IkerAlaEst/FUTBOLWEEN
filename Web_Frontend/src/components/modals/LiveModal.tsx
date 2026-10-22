import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  MessageSquare,
  Send,
  Shield,
  Crown,
  Users,
  Sparkles,
  Flame,
  Tv
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { navigateTo } from '../../hooks/useHashRoute';
import './liveModal.css';

const YOUTUBE_VIDEO_ID = 'M8bQwPb3XJs';
const MIN_SEC = 154; // 2m 34s
const MAX_SEC = 811; // 13m 31s

const QUICK_REACTIONS = [
  '⚽ ¡GOLAZO!',
  '🔥 ¡VAMOSS!',
  '🛡️ ¡PARADÓN!',
  '👏 GG Menuda jugada',
  '⚔️ ¡Hala Madrid!',
  '⚪⚫ ¡Forza Juve!'
];

export const LiveModal: React.FC = () => {
  const { messages, sendMessage } = useChat();
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const chatMessagesBoxRef = useRef<HTMLDivElement>(null);

  // Minuto aleatorio inicial para reproducir entre 2:34 (154s) y 13:31 (811s)
  const [randomStart] = useState(() => {
    return Math.floor(Math.random() * (MAX_SEC - MIN_SEC + 1)) + MIN_SEC;
  });

  // Auto-scroll EXCLUSIVAMENTE dentro de la caja de mensajes del chat (NUNCA en el modal)
  useEffect(() => {
    if (chatMessagesBoxRef.current) {
      chatMessagesBoxRef.current.scrollTop = chatMessagesBoxRef.current.scrollHeight;
    }
  }, [messages]);

  // Manejador para garantizar scroll fluido con la rueda del ratón en el chat
  const handleMessagesWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = chatMessagesBoxRef.current;
    if (!el) return;
    const canScrollUp = el.scrollTop > 0 && e.deltaY < 0;
    const canScrollDown = el.scrollTop + el.clientHeight < el.scrollHeight - 1 && e.deltaY > 0;
    if (canScrollUp || canScrollDown) {
      e.stopPropagation();
    }
  };

  // Listener para el estado de Pantalla Completa nativa
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Alternar pantalla completa nativa en el reproductor
  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;

    if (!document.fullscreenElement) {
      if (videoContainerRef.current.requestFullscreen) {
        videoContainerRef.current.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Alternar audio con YouTube postMessage API sin pausar jamás
  const toggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!iframeRef.current?.contentWindow) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({
        event: 'command',
        func: nextMuted ? 'mute' : 'unMute',
        args: ''
      }),
      '*'
    );
    // Reanudar inmediatamente para evitar pausas del navegador
    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({
        event: 'command',
        func: 'playVideo',
        args: ''
      }),
      '*'
    );
  };

  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || inputText;
    if (!textToSend.trim()) return;

    if (!user) {
      navigateTo('login');
      return;
    }

    setSending(true);
    try {
      await sendMessage(textToSend);
      if (!customText) setInputText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="live-esports-wrapper">
      {/* Barra de Título Superior */}
      <div className="live-header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 className="live-main-heading">
            Retransmisión en <em>Directo</em>
          </h2>
          <span className="live-broadcast-chip">
            <Radio size={12} className="live-pulsing" /> EN DIRECTO
          </span>
        </div>
        <div className="live-tag-pill">
          <Tv size={12} style={{ color: 'var(--neon-orange)' }} />
          <span>IES Dr. Lluís Simarro · Partida Oficial en Vivo</span>
        </div>
      </div>

      {/* Grid Principal: Vídeo (64%) y Chat a la derecha (36%) */}
      <div className="live-esports-grid">
        {/* COLUMNA IZQUIERDA: PANTALLA DE VÍDEO LIMPIA SIN MARCADOR */}
        <div
          ref={videoContainerRef}
          className={`fifa-video-container ${isFullscreen ? 'is-fullscreen' : ''}`}
        >
          {/* Pantalla de sintonización instantánea para no mostrar pantalla negra */}
          {!isVideoLoaded && (
            <div className="fifa-preloader-screen">
              <div className="fifa-preloader-glow" />
              <Radio size={36} className="fifa-preloader-icon live-pulsing" />
              <strong className="fifa-preloader-title">SINTONIZANDO SEÑAL OFICIAL</strong>
              <span className="fifa-preloader-sub">4K HDR · 60 FPS · Aula Gaming Simarro</span>
            </div>
          )}

          {/* Iframe oficial con recorte estricto (-16% top / +32% height):
              Expulsa 100% de la interfaz de YouTube (sin títulos, sin barra de más vídeos, sin thumbnails) */}
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&start=${randomStart}&playsinline=1&enablejsapi=1&iv_load_policy=3&disablekb=1&fs=0`}
            className={`fifa-clean-iframe ${isVideoLoaded ? 'is-visible' : ''}`}
            title="Señal en Directo FIFA EA Sports FC"
            onLoad={() => setIsVideoLoaded(true)}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
          />

          {/* Escudo protector físico transparente:
              Atrapa TODOS los clics para que NUNCA aparezca el icono de pausa de YouTube.
              Doble clic para alternar pantalla completa. */}
          <div
            className="fifa-anti-pause-shield"
            aria-hidden="true"
            onDoubleClick={toggleFullscreen}
          />

          {/* CAPA DE CONTROLES FLOTANTES (Sin marcador, solo distintivos y botones) */}
          <div className="fifa-overlay-layer">
            {/* Distintivos superiores de emisión */}
            <div className="fifa-tv-top-row">
              <div className="fifa-tv-badges">
                <div className="fifa-live-pill">
                  <span className="fifa-live-pulse-dot" />
                  <span>EN DIRECTO</span>
                </div>
                <div className="fifa-channel-pill">
                  <span>SIMARRO TV · 4K 60FPS</span>
                </div>
              </div>
            </div>

            {/* Botones inferiores: Sonido + PANTALLA COMPLETA */}
            <div className="fifa-tv-bottom-row">
              <div style={{ flex: 1 }} />

              <div className="fifa-actions-group">
                {/* Botón Activar / Silenciar Sonido */}
                <button
                  type="button"
                  className="fifa-action-pill-btn"
                  onClick={toggleAudio}
                  title={isMuted ? 'Activar sonido del estadio' : 'Silenciar sonido'}
                >
                  {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  <span>{isMuted ? 'ACTIVAR SONIDO' : 'SONIDO ON'}</span>
                </button>

                {/* Botón Pantalla Completa */}
                <button
                  type="button"
                  className="fifa-action-pill-btn fifa-btn-fullscreen"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? 'Salir de pantalla completa' : 'Ver a pantalla completa'}
                >
                  {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
                  <span>{isFullscreen ? 'SALIR' : 'PANTALLA COMPLETA'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: CHAT EN VIVO MEJORADO ESTILO TWITCH */}
        <div className="live-chat-column">
          {/* Cabecera del Chat con contador de espectadores */}
          <div className="live-chat-header">
            <div className="live-chat-title-group">
              <div className="live-chat-icon-wrap">
                <MessageSquare size={16} />
              </div>
              <div>
                <h3 className="live-chat-title">Chat de la Retransmisión</h3>
                <span className="live-chat-spectators">
                  <span className="live-dot-mini" /> 1.428 espectadores en vivo
                </span>
              </div>
            </div>
            <span className="live-chat-rule-chip">
              <Sparkles size={11} style={{ color: '#fbbf24' }} /> Moderación ON
            </span>
          </div>

          {/* Anuncio fijado tipo Twitch */}
          <div className="live-chat-pinned-banner">
            <Flame size={13} style={{ color: 'var(--neon-orange)', flexShrink: 0 }} />
            <span>Respeta las normas del torneo del IES Simarro. ¡Comenta las mejores jugadas!</span>
          </div>

          {/* Historial de Mensajes del Chat con scroll interno controlado */}
          <div
            className="live-chat-messages-box"
            ref={chatMessagesBoxRef}
            onWheel={handleMessagesWheel}
          >
            {messages.map(m => {
              const time = new Date(m.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });
              return (
                <div
                  key={m.id}
                  className={`live-chat-item ${m.is_admin ? 'is-admin' : m.is_referee ? 'is-referee' : ''}`}
                >
                  <div className="live-chat-item-meta">
                    <span className="live-chat-time">[{time}]</span>
                    {m.is_admin && (
                      <span className="live-chat-badge admin">
                        <Crown size={10} /> ADMIN
                      </span>
                    )}
                    {m.is_referee && (
                      <span className="live-chat-badge referee">
                        <Shield size={10} /> ÁRBITRO
                      </span>
                    )}
                    {!m.is_admin && !m.is_referee && (
                      <span className="live-chat-badge fan">
                        <Users size={10} /> FAN
                      </span>
                    )}
                    <strong
                      className={`live-chat-author ${m.is_admin ? 'admin' : m.is_referee ? 'referee' : ''}`}
                    >
                      {m.user_nick}
                    </strong>
                  </div>
                  <div className="live-chat-text">{m.mensaje}</div>
                </div>
              );
            })}
          </div>

          {/* Tira de Reacciones Rápidas con 1 Clic */}
          <div className="live-quick-reactions-bar">
            {QUICK_REACTIONS.map(reaction => (
              <button
                key={reaction}
                type="button"
                className="live-reaction-pill"
                disabled={sending}
                onClick={() => handleSend(undefined, reaction)}
              >
                {reaction}
              </button>
            ))}
          </div>

          {/* Barra de Entrada Unificada: El botón de enviar está integrado DENTRO de la barra */}
          <div className="live-chat-footer-wrap">
            <form onSubmit={e => handleSend(e)} className="live-chat-input-bar">
              <input
                type="text"
                placeholder={user ? 'Comenta la jugada en vivo...' : 'Inicia sesión para chatear...'}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                disabled={sending}
                className="live-chat-input-field"
              />
              <button
                type="submit"
                className="live-chat-send-pill"
                disabled={sending}
              >
                <Send size={13} />
                <span>{sending ? '...' : user ? 'Enviar' : 'Entrar'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
