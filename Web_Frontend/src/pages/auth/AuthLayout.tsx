import React, { ReactNode, useEffect } from 'react';
import { ArrowLeft, Ghost, Moon, Sparkles, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { navigateTo } from '../../hooks/useHashRoute';
import { AuthCharacter } from './AuthCharacter';
import './auth.css';

interface AuthLayoutProps {
  variant: 'login' | 'register';
  /** Mensaje que dice el personaje en el bocadillo */
  message: string;
  children: ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ variant, message, children }) => {
  const { isLight, toggleTheme } = useTheme();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className={`auth-page auth-page--${variant}`}>
      <div className="auth-bg" aria-hidden="true">
        <span className="auth-glow auth-glow--orange" />
        <span className="auth-glow auth-glow--purple" />
        <span className="auth-moon" />
        <span className="auth-fog" />
        <span className="auth-bat auth-bat--1">🦇</span>
        <span className="auth-bat auth-bat--2">🦇</span>
        <span className="auth-bat auth-bat--3">🦇</span>
        <span className="auth-bat auth-bat--4">🦇</span>
        <span className="auth-pumpkin auth-pumpkin--1">🎃</span>
        <span className="auth-pumpkin auth-pumpkin--2">🎃</span>
      </div>

      <header className="auth-topbar">
        <a
          className="auth-brand"
          href="#/"
          onClick={event => {
            event.preventDefault();
            navigateTo('home');
          }}
        >
          <span className="auth-crest">CF</span>
          <span className="auth-brand-text">
            <span className="auth-brand-sub">XÀTIVA 2026</span>
            <span className="auth-brand-title">CLASH FOOTBALLWEEN</span>
          </span>
        </a>

        <div className="auth-top-actions">
          <button
            type="button"
            className="auth-theme-btn"
            onClick={toggleTheme}
            aria-label={isLight ? 'Cambiar a modo Halloween' : 'Cambiar a modo claro'}
            title={isLight ? 'Modo Halloween' : 'Modo claro'}
          >
            {isLight ? <Moon size={15} /> : <Sun size={15} />}
            <span>{isLight ? 'Modo noche' : 'Modo día'}</span>
          </button>
          <button type="button" className="auth-back-link" onClick={() => navigateTo('home')}>
            <ArrowLeft size={14} /> Volver al torneo
          </button>
        </div>
      </header>

      <main className="auth-shell">
        <section className="auth-stage">
          <span className="auth-eyebrow">
            <Ghost size={13} /> 31 OCT · 20:00 · IES Dr. Lluís Simarro
          </span>
          <h1 className="auth-title">
            CLASH
            <br />
            <em>FOOTBALLWEEN</em>
          </h1>
          <p className="auth-subtitle">
            El torneo de EA FC más terrorífico de Xàtiva. 16 cracks, un castillo y una sola
            corona… ¿te atreves a entrar?
          </p>

          <div className="auth-character">
            <span className="auth-bubble">
              <span>{message}</span>
            </span>
            <AuthCharacter />
            <span className="auth-character-shadow" aria-hidden="true" />
          </div>

          <div className="auth-chip-row">
            <span className="auth-chip">
              <Sparkles size={12} /> 16 plazas
            </span>
            <span className="auth-chip">🎮 EA FC 26</span>
            <span className="auth-chip">🏰 Aula + Castillo</span>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-card">{children}</div>
          <p className="auth-legal">
            Al continuar aceptas las normas del torneo. Tus datos se guardan de forma local hasta
            conectar la base de datos del centro.
          </p>
        </section>
      </main>

      <footer className="auth-footer">
        <span>© 2026 Clash Footballween · Xàtiva</span>
        <span className="auth-footer-dot" />
        <span>IES Dr. Lluís Simarro</span>
      </footer>
    </div>
  );
};
