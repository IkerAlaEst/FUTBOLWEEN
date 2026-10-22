import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Check,
  Eye,
  EyeOff,
  Gamepad2,
  Ghost,
  Home,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Moon,
  Scale,
  ShieldCheck,
  Sparkles,
  Sun,
  Trophy,
  UserPlus,
  UserRound
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { navigateTo } from '../../hooks/useHashRoute';

/* ════════════════════════════════════════════════════════════════
   1 · CONSTANTES
   ════════════════════════════════════════════════════════════════ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ════════════════════════════════════════════════════════════════
   2 · PERSONAJE (Calabaza saludando)
   ════════════════════════════════════════════════════════════════ */

const Calabaza: React.FC = () => (
  <svg className="rg-pumpkin" viewBox="-14 0 228 218" role="img" aria-label="Calabaza saludando">
    <ellipse cx="100" cy="206" rx="54" ry="8" fill="rgba(0,0,0,.32)" />
    <g className="rg-pk-body">
      {/* pies */}
      <ellipse cx="72" cy="194" rx="18" ry="10" fill="#d9560a" />
      <ellipse cx="128" cy="194" rx="18" ry="10" fill="#d9560a" />

      {/* brazo izquierdo */}
      <path d="M24 130 C6 142 6 160 12 170" fill="none" stroke="#ec6a0c" strokeWidth="13" strokeLinecap="round" />
      <circle cx="12" cy="172" r="9" fill="#ffa23a" />

      {/* cuerpo */}
      <ellipse cx="52" cy="122" rx="40" ry="66" fill="#f2700f" />
      <ellipse cx="148" cy="122" rx="40" ry="66" fill="#f2700f" />
      <ellipse cx="100" cy="122" rx="46" ry="70" fill="#ffa23a" />
      <path d="M74 60 C58 100 58 146 74 184" fill="none" stroke="#d9560a" strokeWidth="3" strokeLinecap="round" opacity=".5" />
      <path d="M126 60 C142 100 142 146 126 184" fill="none" stroke="#d9560a" strokeWidth="3" strokeLinecap="round" opacity=".5" />
      <ellipse cx="78" cy="88" rx="12" ry="24" fill="rgba(255,255,255,.3)" transform="rotate(18 78 88)" />

      {/* tallo y hoja */}
      <path d="M90 58 C90 44 98 32 112 26 L121 36 C114 42 112 48 112 60 Z" fill="#6f9a2a" />
      <path d="M114 40 C132 24 154 30 156 44 C140 52 124 50 114 40Z" fill="#52c46b" />
      <path d="M118 40 C130 36 142 38 150 42" fill="none" stroke="#2f9150" strokeWidth="2" strokeLinecap="round" />

      {/* cara */}
      <g transform="translate(100 98)">
        <g className="rg-pk-eyes">
          <g transform="translate(-100 -98)">
            <polygon points="66,106 94,106 80,80" fill="#ffe27a" stroke="#3b0a5c" strokeWidth="5" strokeLinejoin="round" />
            <polygon points="106,106 134,106 120,80" fill="#ffe27a" stroke="#3b0a5c" strokeWidth="5" strokeLinejoin="round" />
            <circle cx="80" cy="99" r="4.5" fill="#3b0a5c" />
            <circle cx="120" cy="99" r="4.5" fill="#3b0a5c" />
          </g>
        </g>
      </g>
      <path d="M100 114 L93 126 L107 126 Z" fill="#3b0a5c" stroke="#3b0a5c" strokeWidth="3" strokeLinejoin="round" />
      <path d="M64 136 Q100 176 136 136 Q100 150 64 136 Z" fill="#3b0a5c" stroke="#3b0a5c" strokeWidth="3" strokeLinejoin="round" />
      <path d="M84 143 L94 145 L89 152 Z M106 145 L116 143 L111 152 Z" fill="#ffe27a" />
      <circle cx="54" cy="130" r="9" fill="rgba(255,100,140,.45)" />
      <circle cx="146" cy="130" r="9" fill="rgba(255,100,140,.45)" />

      {/* brazo derecho saludando */}
      <g transform="translate(176 128)">
        <g className="rg-pk-wave">
          <g transform="translate(-176 -128)">
            <path d="M174 128 C198 122 208 100 202 80" fill="none" stroke="#ec6a0c" strokeWidth="13" strokeLinecap="round" />
            <path d="M195 68 L192 59 M202 65 L202 55 M209 68 L212 59" fill="none" stroke="#ffa23a" strokeWidth="5" strokeLinecap="round" />
            <circle cx="202" cy="75" r="11" fill="#ffa23a" />
          </g>
        </g>
      </g>
    </g>
  </svg>
);

/* ════════════════════════════════════════════════════════════════
   3 · COMPONENTES PEQUEÑOS
   ════════════════════════════════════════════════════════════════ */

type FieldStatus = 'idle' | 'ok' | 'bad';

interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> {
  id: string;
  label: string;
  icon: LucideIcon;
  status?: FieldStatus;
  message?: string;
  right?: React.ReactNode;
}

const TextField: React.FC<TextFieldProps> = ({ id, label, icon: Icon, status = 'idle', message, right, ...input }) => (
  <div className={`rg-field ${status === 'bad' ? 'is-bad' : status === 'ok' ? 'is-ok' : ''}`}>
    <label className="rg-label" htmlFor={id}>
      {label}
    </label>
    <div className="rg-input-wrap">
      <Icon size={17} className="rg-input-icon" />
      <input id={id} className="rg-input" {...input} />
      <span className="rg-input-end">
        {right}
        {!right && status === 'ok' && <Check size={17} />}
        {!right && status === 'bad' && <AlertCircle size={17} />}
      </span>
    </div>
    <span className="rg-msg" role={status === 'bad' ? 'alert' : undefined}>
      {status === 'bad' ? message : ''}
    </span>
  </div>
);

/** Botón de modo oscuro / claro: interruptor con luna y sol. */
const ThemeToggle: React.FC<{ theme: string; onToggle: () => void }> = ({ theme, onToggle }) => (
  <button
    type="button"
    className="rg-theme"
    role="switch"
    aria-checked={theme === 'dark'}
    aria-label="Modo oscuro"
    title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    onClick={onToggle}
  >
    <span className="rg-theme-thumb" aria-hidden="true" />
    <span className={`rg-theme-opt ${theme === 'dark' ? 'is-on' : ''}`}>
      <Moon size={16} />
    </span>
    <span className={`rg-theme-opt ${theme === 'light' ? 'is-on' : ''}`}>
      <Sun size={16} />
    </span>
  </button>
);

/* ════════════════════════════════════════════════════════════════
   4 · PÁGINA DE INICIO DE SESIÓN
   ════════════════════════════════════════════════════════════════ */

export const LoginPage: React.FC = () => {
  const { user, login, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState(user?.email ?? '');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Bloquea el scroll de la página de fondo mientras esta pantalla está abierta.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const emailOk = EMAIL_RE.test(email.trim());
  const valid = emailOk && pass.length >= 1;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid || loading) return;
    setError('');
    setLoading(true);
    try {
      await login({ email: email.trim(), pass });
      navigateTo('home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se ha podido iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = user
    ? user.rol === 'arbitro'
      ? 'Árbitro'
      : user.rol === 'admin'
        ? 'Administrador'
        : user.rol === 'usuario'
          ? 'Aficionado'
          : 'Jugador'
    : '';
  const RoleIcon: LucideIcon = user
    ? user.rol === 'arbitro'
      ? Scale
      : user.rol === 'admin'
        ? ShieldCheck
        : user.rol === 'usuario'
          ? Sparkles
          : Gamepad2
    : UserRound;

  const bubble = user
    ? `Hola otra vez, ${user.gamertag || user.nombre_completo}. La puerta del castillo sigue abierta.`
    : '¿Volvemos a la carga? El castillo no se defiende solo.';

  const ui = (
    <div className="rg-root" data-theme={theme}>
      <style>{STYLES}</style>

      <div className="rg-bg" aria-hidden="true">
        <span className="rg-orb rg-orb-a" />
        <span className="rg-orb rg-orb-b" />
        <span className="rg-orb rg-orb-c" />
        <span className="rg-gridlines" />
      </div>

      <div className="rg-card">
        <span className="rg-card-spin" aria-hidden="true" />
        <div className="rg-card-inner">
          <aside className="rg-aside">
            <div className="rg-brand">
              <img src="/emblema.png" alt="Emblema Clash Footballween" className="rg-logo-img" />
              <span className="rg-brand-text">
                <strong>Clash Footballween</strong>
                <small>Xàtiva 2026</small>
              </span>
            </div>

            <ul className="rg-facts" aria-label="Datos del torneo">
              <li className="rg-fact">
                <span className="rg-fact-icon">
                  <CalendarDays size={16} />
                </span>
                <span className="rg-fact-text">
                  <small>Fecha</small>
                  <strong>31 oct · 20:00</strong>
                </span>
              </li>
              <li className="rg-fact">
                <span className="rg-fact-icon">
                  <Trophy size={16} />
                </span>
                <span className="rg-fact-text">
                  <small>Gran final</small>
                  <strong>Castillo</strong>
                </span>
              </li>
              <li className="rg-fact">
                <span className="rg-fact-icon">
                  <MapPin size={16} />
                </span>
                <span className="rg-fact-text">
                  <small>Rondas previas</small>
                  <strong>Aula de informática</strong>
                </span>
              </li>
            </ul>

            <div className="rg-hero">
              <div className="rg-bubble" key={bubble}>
                {bubble}
              </div>
              <div className="rg-hero-art">
                <Calabaza />
              </div>
            </div>
          </aside>

          <div className="rg-panel">
            <div className="rg-top">
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
              <button type="button" className="rg-home" onClick={() => navigateTo('home')} aria-label="Volver al inicio">
                <Home size={18} />
              </button>
            </div>

            {user ? (
              <div className="rg-final">
                <span className="rg-chip">
                  <Ghost size={15} /> Sesión activa
                </span>
                <div className="rg-final-number">{user.player_number ? user.player_number : <RoleIcon size={38} />}</div>
                <h2 className="rg-final-title">Ya estás dentro</h2>
                <span className="rg-chip rg-chip--soft">
                  <CalendarDays size={15} /> El torneo empieza el 31 oct · 20:00
                </span>

                <div className="rg-summary">
                  <div className="rg-tile">
                    <span className="rg-tile-icon">
                      <Mail size={16} />
                    </span>
                    <span className="rg-tile-text">
                      <small>Cuenta</small>
                      <strong>{user.nombre_completo}</strong>
                    </span>
                  </div>
                  <div className="rg-tile">
                    <span className="rg-tile-icon">
                      <RoleIcon size={16} />
                    </span>
                    <span className="rg-tile-text">
                      <small>Rol</small>
                      <strong>{roleLabel}</strong>
                    </span>
                  </div>
                  {user.gamertag && user.rol === 'jugador' && (
                    <div className="rg-tile">
                      <span className="rg-tile-icon">
                        <Gamepad2 size={16} />
                      </span>
                      <span className="rg-tile-text">
                        <small>Gamertag</small>
                        <strong>{user.gamertag}</strong>
                      </span>
                    </div>
                  )}
                  {user.club_elegido && (
                    <div className="rg-tile">
                      <span className="rg-tile-icon">
                        <Trophy size={16} />
                      </span>
                      <span className="rg-tile-text">
                        <small>Club</small>
                        <strong>
                          {user.club_badge && (
                            <img
                              src={user.club_badge}
                              alt=""
                              onError={event => {
                                event.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          {user.club_elegido}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>

                <div className="rg-final-actions">
                  <button
                    type="button"
                    className="rg-btn rg-btn--ghost"
                    onClick={() => {
                      logout();
                      setEmail('');
                      setPass('');
                    }}
                  >
                    <LogOut size={17} /> Cerrar sesión
                  </button>
                  <button type="button" className="rg-btn" onClick={() => navigateTo('home')}>
                    Entrar al torneo <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <form className="rg-form" onSubmit={handleSubmit} noValidate>
                <div className="rg-head rg-fade">
                  <span className="rg-kicker">
                    <Ghost size={15} /> Acceso al torneo
                  </span>
                  <h2>Inicia sesión</h2>
                  <p>Entra con el correo y la contraseña con los que te registraste.</p>
                </div>

                <div className="rg-body rg-fade">
                  <TextField
                    id="login-email"
                    label="Correo electrónico"
                    icon={Mail}
                    type="email"
                    autoComplete="email"
                    placeholder="tucorreo@alu.edu.gva.es"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    status={email ? (emailOk ? 'ok' : 'bad') : 'idle'}
                    message="Introduce un correo válido"
                  />
                  <TextField
                    id="login-pass"
                    label="Contraseña"
                    icon={Lock}
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Tu contraseña"
                    value={pass}
                    onChange={event => setPass(event.target.value)}
                    right={
                      <button
                        type="button"
                        className="rg-eye"
                        onClick={() => setShowPass(value => !value)}
                        aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    }
                  />
                </div>

                {error && (
                  <div className="rg-error" role="alert">
                    <AlertCircle size={17} /> {error}
                  </div>
                )}

                <div className="rg-foot">
                  <button type="button" className="rg-link" onClick={() => navigateTo('register')}>
                    <UserPlus size={16} /> Crear cuenta
                  </button>

                  <button type="submit" className="rg-btn" disabled={!valid || loading}>
                    {loading ? (
                      <>
                        <span className="rg-spin" /> Entrando…
                      </>
                    ) : (
                      <>
                        Entrar al torneo <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Se pinta en <body> para que ningún contenedor padre (transform, overflow…) pueda recortarlo.
  return createPortal(ui, document.body);
};

export default LoginPage;

/* ════════════════════════════════════════════════════════════════
   5 · ESTILOS (tema oscuro por defecto + tema claro)
   ════════════════════════════════════════════════════════════════ */

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Manrope:wght@500;600;700;800&display=swap');

/* ── Tema oscuro (Halloween Clash) ── */
.rg-root{
  --txt:#f8fafc; --mut:#94a3b8;
  --line:rgba(255,94,0,.28); --line-2:rgba(255,255,255,.16);
  --acc:#ff5e00; --acc-2:#eab308; --ink:#05060a; --ok:#22c55e; --bad:#ef4444;
  --grad:linear-gradient(135deg,#ff7a1a 0%,#ff5e00 50%,#d94800 100%);
  --root-bg:
    radial-gradient(70% 60% at 12% 0%,rgba(147,51,234,.32) 0%,transparent 62%),
    radial-gradient(70% 60% at 100% 100%,rgba(255,94,0,.36) 0%,transparent 62%),
    #05060a;
  --card-bg:linear-gradient(160deg,rgba(26,12,6,.98) 0%,rgba(16,10,24,.98) 55%,rgba(12,8,22,.98) 100%);
  --card-shadow:0 30px 90px -20px rgba(0,0,0,.9),0 0 60px -10px rgba(255,94,0,.45),0 0 100px -20px rgba(147,51,234,.3);
  --aside-bg:linear-gradient(180deg,rgba(255,94,0,.2),rgba(147,51,234,.08) 75%);
  --field-bg:rgba(8,10,16,.85); --field-bg-f:rgba(15,18,28,.95);
  --ph:#64748b; --autofill:#160d26;
  --ghost-bg:rgba(255,255,255,.08); --tile-bg:rgba(255,255,255,.06); --tile-icon-bg:rgba(255,94,0,.25);
  --chip-bg:rgba(255,94,0,.2); --chip-bd:rgba(234,179,8,.55);
  --err-bg:rgba(239,68,68,.18); --err-bd:rgba(239,68,68,.6); --err-txt:#fca5a5;
  --bubble-bg:#fff7ea; --bubble-txt:#1c0a03; --bubble-bd:transparent;
  --orb-o:.5; --grid:rgba(255,94,0,.08);
  --f-head:'Space Grotesk','Bricolage Grotesque','Segoe UI',system-ui,sans-serif;
  --f-body:'Space Grotesk','Manrope','Segoe UI',system-ui,-apple-system,sans-serif;
  --ease:cubic-bezier(.22,1,.36,1);
}

/* ── Tema claro (Día / Mediterráneo Xàtiva) ── */
.rg-root[data-theme='light']{
  --txt:#0f172a; --mut:#475569;
  --line:rgba(2,132,199,.22); --line-2:rgba(15,23,42,.14);
  --acc:#0284c7; --acc-2:#ea580c; --ink:#ffffff; --ok:#16a34a; --bad:#dc2626;
  --grad:linear-gradient(135deg,#0284c7 0%,#0369a1 100%);
  --root-bg:
    radial-gradient(70% 60% at 12% 0%,rgba(2,132,199,.18) 0%,transparent 62%),
    radial-gradient(70% 60% at 100% 100%,rgba(234,88,12,.18) 0%,transparent 62%),
    #f0f7ff;
  --card-bg:linear-gradient(160deg,#ffffff 0%,#f8fafc 55%,#f1f5f9 100%);
  --card-shadow:0 30px 80px -25px rgba(15,23,42,.18),0 0 50px -20px rgba(2,132,199,.3);
  --aside-bg:linear-gradient(180deg,rgba(2,132,199,.12),rgba(234,88,12,.06) 75%);
  --field-bg:#ffffff; --field-bg-f:#ffffff;
  --ph:#94a3b8; --autofill:#f0f7ff;
  --ghost-bg:rgba(2,132,199,.08); --tile-bg:rgba(2,132,199,.06); --tile-icon-bg:rgba(2,132,199,.18);
  --chip-bg:rgba(2,132,199,.12); --chip-bd:rgba(2,132,199,.4);
  --err-bg:rgba(220,38,38,.1); --err-bd:rgba(220,38,38,.4); --err-txt:#991b1b;
  --bubble-bg:#ffffff; --bubble-txt:#0f172a; --bubble-bd:rgba(2,132,199,.25);
  --orb-o:.25; --grid:rgba(2,132,199,.06);
}

.rg-root{
  position:fixed; top:0; left:0; right:0; bottom:0; height:100vh; height:100dvh; z-index:9999;
  display:flex; align-items:center; justify-content:center;
  padding:clamp(8px,2.2vmin,24px); overflow:hidden; color:var(--txt);
  background:var(--root-bg);
  font-family:var(--f-body); -webkit-font-smoothing:antialiased; text-align:left;
}
:where(.rg-root) *,:where(.rg-root) *::before,:where(.rg-root) *::after{box-sizing:border-box}
:where(.rg-root) button{font:inherit;color:inherit;cursor:pointer;border:0;background:none;padding:0;margin:0}
:where(.rg-root) button:disabled{cursor:not-allowed}
:where(.rg-root) h2,:where(.rg-root) p,:where(.rg-root) ul,:where(.rg-root) li{margin:0;padding:0}
.rg-root :focus-visible{outline:2px solid var(--acc-2);outline-offset:2px}

/* Fondo */
.rg-bg{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.rg-orb{position:absolute;border-radius:50%;filter:blur(80px);opacity:var(--orb-o);animation:rg-float 16s ease-in-out infinite alternate}
.rg-orb-a{width:46vmax;height:46vmax;left:-14vmax;top:-18vmax;background:radial-gradient(circle,#ff5e00,transparent 65%)}
.rg-orb-b{width:42vmax;height:42vmax;right:-14vmax;bottom:-16vmax;background:radial-gradient(circle,#9333ea,transparent 65%);animation-delay:-6s}
.rg-orb-c{width:24vmax;height:24vmax;right:14%;top:-9vmax;background:radial-gradient(circle,#eab308,transparent 65%);opacity:.3;animation-delay:-10s}
.rg-root[data-theme='light'] .rg-orb-a{background:radial-gradient(circle,#0284c7,transparent 65%)}
.rg-root[data-theme='light'] .rg-orb-b{background:radial-gradient(circle,#ea580c,transparent 65%)}
.rg-root[data-theme='light'] .rg-orb-c{background:radial-gradient(circle,#38bdf8,transparent 65%)}
.rg-gridlines{position:absolute;inset:0;opacity:.4;
  background-image:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);
  background-size:46px 46px;
  -webkit-mask-image:radial-gradient(ellipse at center,#000 15%,transparent 72%);
  mask-image:radial-gradient(ellipse at center,#000 15%,transparent 72%)}

/* Tarjeta con borde animado */
.rg-card{position:relative;width:min(100%,980px);height:min(100%,600px);border-radius:34px;padding:2px;overflow:hidden;
  box-shadow:var(--card-shadow);animation:rg-pop .8s var(--ease) both}
.rg-card-spin{position:absolute;left:50%;top:50%;width:max(220%,1500px);aspect-ratio:1;
  background:conic-gradient(from 0deg,transparent 0 55%,rgba(255,94,0,1) 76%,rgba(147,51,234,.95) 90%,transparent 100%);
  animation:rg-spin 8s linear infinite}
.rg-root[data-theme='light'] .rg-card-spin{
  background:conic-gradient(from 0deg,transparent 0 55%,rgba(2,132,199,1) 76%,rgba(234,88,12,.95) 90%,transparent 100%);
}
.rg-card-inner{position:relative;height:100%;border-radius:32px;overflow:hidden;
  display:grid;grid-template-columns:272px minmax(0,1fr);background:var(--card-bg)}

/* Lateral */
.rg-aside{position:relative;min-height:0;display:flex;flex-direction:column;gap:clamp(16px,3.2vh,28px);
  padding:clamp(18px,3.2vh,28px) 22px 12px;border-right:1.5px solid var(--line);background:var(--aside-bg);overflow:hidden}
.rg-brand{display:flex;align-items:center;gap:12px}
.rg-logo-img{width:auto;height:48px;max-width:64px;object-fit:contain;filter:drop-shadow(0 2px 10px rgba(255,94,0,.55));animation:rg-bob 4s ease-in-out infinite}
.rg-root[data-theme='light'] .rg-logo-img{filter:drop-shadow(0 2px 10px rgba(2,132,199,.45))}
.rg-brand-text{display:flex;flex-direction:column;min-width:0}
.rg-brand-text strong{font-family:var(--f-head);font-size:17px;font-weight:800;line-height:1.1;letter-spacing:-.01em}
.rg-brand-text small{margin-top:3px;color:var(--mut);font-size:13px;font-weight:700}

.rg-facts{list-style:none;display:flex;flex-direction:column;gap:clamp(8px,1.6vh,14px)}
.rg-fact{display:flex;align-items:center;gap:12px;min-width:0}
.rg-fact-icon{flex:none;width:34px;height:34px;border-radius:12px;display:grid;place-items:center;background:var(--tile-icon-bg);color:var(--acc-2)}
.rg-fact-text{display:flex;flex-direction:column;min-width:0}
.rg-fact-text small{color:var(--mut);font-size:12px;font-weight:800}
.rg-fact-text strong{font-size:14px;font-weight:800;line-height:1.2}

/* Personaje */
.rg-hero{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:flex-end;align-items:stretch;gap:12px}
.rg-bubble{position:relative;flex:none;padding:11px 14px;border-radius:20px;background:var(--bubble-bg);color:var(--bubble-txt);
  border:1.5px solid var(--bubble-bd);font-size:13.5px;font-weight:800;line-height:1.35;text-align:center;
  box-shadow:0 12px 26px -10px rgba(10,0,40,.45);animation:rg-bubble .5s var(--ease) both}
.rg-bubble::after{content:'';position:absolute;left:50%;bottom:-9px;margin-left:-10px;border:10px solid transparent;border-top-color:var(--bubble-bg);border-bottom:0}
.rg-hero-art{flex:1 1 0;min-height:0;max-height:210px;display:flex;justify-content:center}
.rg-pumpkin{height:100%;width:auto;max-width:100%;overflow:visible;filter:drop-shadow(0 12px 18px rgba(10,0,40,.35))}
.rg-pk-body{animation:rg-bob 3.6s ease-in-out infinite}
.rg-pk-wave{animation:rg-wave 1.1s ease-in-out infinite}
.rg-pk-eyes{animation:rg-blink 5s ease-in-out infinite}

/* Panel */
.rg-panel{position:relative;min-width:0;min-height:0;display:flex;flex-direction:column;
  padding:clamp(16px,3.2vh,30px) clamp(18px,3.2vw,38px) clamp(14px,2.6vh,24px)}
.rg-form{flex:1;min-height:0;display:flex;flex-direction:column;gap:clamp(8px,1.8vh,16px)}

/* Barra superior: modo oscuro/claro + inicio */
.rg-top{position:absolute;top:clamp(14px,2.6vh,22px);right:clamp(14px,2.4vw,22px);z-index:5;display:flex;align-items:center;gap:10px}
.rg-home{width:40px;height:40px;border-radius:14px;display:grid;place-items:center;color:var(--txt);background:var(--ghost-bg);border:1.5px solid var(--line-2);
  transition:color .25s,border-color .25s,background .25s,transform .35s var(--ease)}
.rg-home:hover{color:var(--ink);background:var(--grad);border-color:transparent;transform:translateY(-2px)}

.rg-theme{position:relative;display:inline-flex;align-items:center;height:40px;padding:0 4px;border-radius:999px;
  background:var(--ghost-bg);border:1.5px solid var(--line-2);transition:border-color .25s,background .3s}
.rg-theme:hover{border-color:var(--acc-2)}
.rg-theme-thumb{position:absolute;top:3px;left:4px;width:34px;height:30px;border-radius:999px;background:var(--grad);
  box-shadow:0 6px 16px -6px rgba(255,94,0,.95);transition:transform .45s var(--ease)}
.rg-root[data-theme='light'] .rg-theme-thumb{box-shadow:0 6px 16px -6px rgba(2,132,199,.7)}
.rg-theme[aria-checked='false'] .rg-theme-thumb{transform:translateX(34px)}
.rg-theme-opt{position:relative;z-index:1;width:34px;height:30px;display:grid;place-items:center;color:var(--mut);transition:color .3s}
.rg-theme-opt.is-on{color:var(--ink)}

.rg-fade{animation:rg-in .45s var(--ease) both}
.rg-head{flex:none;padding-right:150px}
.rg-kicker{display:inline-flex;align-items:center;gap:7px;color:var(--acc-2);font-size:13.5px;font-weight:800}
.rg-head h2{margin-top:6px;font-family:var(--f-head);font-size:clamp(24px,3.9vh,32px);font-weight:800;letter-spacing:-.025em;line-height:1.1;color:var(--txt)}
.rg-head p{margin-top:6px;color:var(--mut);font-size:14.5px;font-weight:600;line-height:1.4}
.rg-body{flex:1;min-height:0;display:flex;flex-direction:column;gap:clamp(6px,1.2vh,12px);overflow:hidden}
.rg-body > :first-child{margin-top:auto}
.rg-body > :last-child{margin-bottom:auto}

/* Campos */
.rg-field{display:flex;flex-direction:column;gap:6px;min-width:0}
.rg-label{font-size:13px;font-weight:800;color:var(--mut)}
.rg-input-wrap{position:relative;display:flex;align-items:center}
.rg-input-icon{position:absolute;left:15px;color:var(--mut);pointer-events:none;transition:color .3s}
.rg-input-wrap:focus-within .rg-input-icon{color:var(--acc-2)}
.rg-input{width:100%;height:clamp(44px,6.3vh,52px);padding:0 46px 0 44px;border-radius:18px;border:1.5px solid var(--line-2);
  background:var(--field-bg);color:var(--txt);font:inherit;font-size:15px;font-weight:700;
  transition:border-color .25s,box-shadow .25s,background .25s,color .25s}
.rg-input::placeholder{color:var(--ph);font-weight:600}
.rg-input:focus{border-color:var(--acc);background:var(--field-bg-f);box-shadow:0 0 0 4px rgba(255,94,0,.25)}
.rg-root[data-theme='light'] .rg-input:focus{box-shadow:0 0 0 4px rgba(2,132,199,.25)}
.rg-input:focus-visible{outline:none}
.rg-input:-webkit-autofill{-webkit-text-fill-color:var(--txt);box-shadow:0 0 0 100px var(--autofill) inset;caret-color:var(--txt)}
.rg-input-end{position:absolute;right:12px;display:flex;align-items:center;color:var(--mut)}
.rg-field.is-ok .rg-input{border-color:var(--ok)}
.rg-field.is-ok .rg-input-end{color:var(--ok)}
.rg-field.is-bad .rg-input{border-color:var(--bad)}
.rg-field.is-bad .rg-input-end{color:var(--bad)}
.rg-msg{display:block;min-height:15px;font-size:12.5px;font-weight:700;line-height:15px;color:var(--bad)}
.rg-eye{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;color:var(--mut);transition:color .2s,background .2s}
.rg-eye:hover{color:var(--txt);background:var(--ghost-bg)}

/* Botones */
.rg-foot{flex:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:clamp(10px,1.8vh,16px);border-top:1.5px solid var(--line)}
.rg-btn{position:relative;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;gap:8px;height:48px;padding:0 26px;border-radius:18px;
  color:var(--ink);background:var(--grad);font-size:15px;font-weight:800;
  box-shadow:0 14px 30px -12px rgba(255,94,0,.95),inset 0 1px 0 rgba(255,255,255,.5);
  transition:transform .35s var(--ease),box-shadow .35s,opacity .3s,filter .3s}
.rg-root[data-theme='light'] .rg-btn{box-shadow:0 14px 30px -12px rgba(2,132,199,.7),inset 0 1px 0 rgba(255,255,255,.5)}
.rg-btn::after{content:'';position:absolute;top:0;bottom:0;left:-60%;width:40%;pointer-events:none;
  background:linear-gradient(100deg,transparent,rgba(255,255,255,.6),transparent);transform:skewX(-20deg);transition:left .75s var(--ease)}
.rg-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 18px 36px -12px rgba(255,94,0,1),inset 0 1px 0 rgba(255,255,255,.55)}
.rg-root[data-theme='light'] .rg-btn:hover:not(:disabled){box-shadow:0 18px 36px -12px rgba(2,132,199,.8),inset 0 1px 0 rgba(255,255,255,.55)}
.rg-btn:hover:not(:disabled)::after{left:140%}
.rg-btn:active:not(:disabled){transform:translateY(0) scale(.98)}
.rg-btn:disabled{opacity:.45;filter:grayscale(.4);box-shadow:none}
.rg-btn--ghost{color:var(--txt);background:var(--ghost-bg);border:2px solid var(--line-2);box-shadow:none}
.rg-btn--ghost::after{display:none}
.rg-btn--ghost:hover:not(:disabled){border-color:var(--acc-2);box-shadow:none}
.rg-link{display:inline-flex;align-items:center;gap:8px;color:var(--mut);font-size:14.5px;font-weight:800;transition:color .2s}
.rg-link:hover{color:var(--acc-2)}
.rg-spin{width:17px;height:17px;border-radius:50%;border:2px solid rgba(42,17,0,.28);border-top-color:var(--ink);animation:rg-rot .7s linear infinite}

.rg-error{flex:none;display:flex;align-items:center;gap:8px;padding:11px 14px;border-radius:16px;color:var(--err-txt);font-size:13.5px;font-weight:700;
  background:var(--err-bg);border:1.5px solid var(--err-bd);animation:rg-shake .4s}

/* Sesión activa */
.rg-final{position:relative;flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:clamp(6px,1.5vh,14px);text-align:center;animation:rg-in .6s var(--ease) both}
.rg-chip{display:inline-flex;align-items:center;gap:7px;min-height:32px;padding:0 14px;border-radius:999px;color:var(--acc-2);font-size:13.5px;font-weight:800;
  background:var(--chip-bg);border:1.5px solid var(--chip-bd)}
.rg-chip--soft{color:var(--txt);background:var(--ghost-bg);border-color:var(--line-2)}
.rg-final-number{position:relative;width:clamp(72px,14vh,104px);aspect-ratio:1;border-radius:50%;display:grid;place-items:center;
  font-family:var(--f-head);font-size:clamp(34px,7vh,52px);font-weight:800;color:var(--ink);background:var(--grad);
  box-shadow:0 0 0 8px rgba(255,94,0,.22),0 0 54px rgba(255,94,0,.7)}
.rg-root[data-theme='light'] .rg-final-number{box-shadow:0 0 0 8px rgba(2,132,199,.2),0 0 54px rgba(2,132,199,.5)}
.rg-final-number::before{content:'';position:absolute;inset:-8px;border-radius:50%;border:2px solid var(--acc-2);animation:rg-ring 2.2s ease-out infinite}
.rg-final-title{font-family:var(--f-head);font-size:clamp(21px,3.8vh,29px);font-weight:800;letter-spacing:-.02em;line-height:1.15;color:var(--txt)}
.rg-summary{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%;max-width:540px}
.rg-tile{display:flex;align-items:center;gap:10px;min-width:0;padding:9px 12px;border-radius:18px;text-align:left;
  background:var(--tile-bg);border:1.5px solid var(--line)}
.rg-tile-icon{flex:none;width:34px;height:34px;border-radius:12px;display:grid;place-items:center;background:var(--tile-icon-bg);color:var(--acc-2)}
.rg-tile-text{min-width:0;display:flex;flex-direction:column}
.rg-tile-text small{color:var(--mut);font-size:12px;font-weight:800}
.rg-tile-text strong{display:flex;align-items:center;gap:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:800}
.rg-tile-text img{flex:none;width:18px;height:18px;object-fit:contain}
.rg-final-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:4px}

/* Animaciones */
@keyframes rg-pop{from{opacity:0;transform:translateY(18px) scale(.97)}to{opacity:1;transform:none}}
@keyframes rg-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes rg-bubble{from{opacity:0;transform:translateY(8px) scale(.92)}to{opacity:1;transform:none}}
@keyframes rg-spin{from{transform:translate(-50%,-50%) rotate(0)}to{transform:translate(-50%,-50%) rotate(360deg)}}
@keyframes rg-rot{to{transform:rotate(360deg)}}
@keyframes rg-float{to{transform:translate3d(4vmax,3vmax,0) scale(1.12)}}
@keyframes rg-pulse{0%,100%{box-shadow:0 10px 26px -8px rgba(255,138,31,.85),inset 0 1px 0 rgba(255,255,255,.55)}50%{box-shadow:0 10px 40px -2px rgba(255,138,31,1),inset 0 1px 0 rgba(255,255,255,.55)}}
@keyframes rg-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes rg-wave{0%,100%{transform:rotate(-14deg)}50%{transform:rotate(20deg)}}
@keyframes rg-blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
@keyframes rg-ring{0%{transform:scale(.9);opacity:.9}100%{transform:scale(1.5);opacity:0}}
@keyframes rg-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}

/* Responsive */
@media (max-height:700px){
  .rg-hero-art{max-height:150px}
  .rg-brand-text small{display:none}
}
@media (max-height:600px){
  .rg-hero{display:none}
}
@media (max-width:860px){
  .rg-card{width:min(100%,600px);height:min(100%,640px)}
  .rg-card-inner{grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr)}
  .rg-aside{flex-direction:row;align-items:center;gap:14px;padding:12px 16px;border-right:0;border-bottom:1.5px solid var(--line)}
  .rg-facts,.rg-hero{display:none}
  .rg-logo-img{height:40px}
}
@media (max-width:600px){
  .rg-head{padding-right:104px}
  .rg-head p{font-size:13.5px}
  .rg-btn{padding:0 18px}
  .rg-summary{gap:6px}
  .rg-tile{padding:8px 10px;gap:8px}
  .rg-tile-icon{width:30px;height:30px}
  .rg-final-actions .rg-btn{flex:1 1 100%}
}
@media (max-width:420px){
  .rg-head{padding-right:0;padding-top:48px}
  .rg-summary{grid-template-columns:1fr}
}
@media (max-height:480px){
  .rg-head p{display:none}
  .rg-aside{padding-top:8px;padding-bottom:8px}
  .rg-panel{padding-top:12px;padding-bottom:12px}
  .rg-body{overflow-y:auto;scrollbar-width:none}
  .rg-body::-webkit-scrollbar{display:none}
}
@media (prefers-reduced-motion:reduce){
  .rg-root *,.rg-root *::before,.rg-root *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
}
`;