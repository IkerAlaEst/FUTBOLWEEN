import React, { useState, useEffect, useRef } from 'react';
import {
  Sun,
  Moon,
  Crown,
  Scale,
  Gamepad2,
  LogOut,
  Zap,
  Menu,
  X,
  Radio,
  Trophy,
  Users,
  Home
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { useTheme } from '../../context/ThemeContext';
import { navigateTo, useHashRoute } from '../../hooks/useHashRoute';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { openModal } = useModal();
  const { isLight, toggleTheme } = useTheme();
  const route = useHashRoute();
  const [hideNav, setHideNav] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let lastY = window.scrollY;
    const handleScroll = () => {
      const currentY = window.scrollY;
      setHideNav(currentY > lastY && currentY > 60 && !isMobileMenuOpen);
      lastY = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobileMenuOpen]);

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [route]);

  // Cerrar menú al redimensionar a pantalla de escritorio
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1040 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]);

  // Cerrar al hacer clic fuera del navbar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  const handleHomeClick = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsMobileMenuOpen(false);
    if (route !== 'home') {
      navigateTo('home');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = (action: () => void) => {
    action();
    setIsMobileMenuOpen(false);
  };

  const getRoleIcon = () => {
    if (!user) return null;
    if (user.rol === 'admin') return <Crown size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />;
    if (user.rol === 'arbitro') return <Scale size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />;
    return <Gamepad2 size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />;
  };

  return (
    <nav ref={navRef} className={`fnav ${hideNav ? 'hide' : ''}`} id="fnav">
      {/* 1. Logotipo Oficial y Marca */}
      <a href="#" className="brand" onClick={handleHomeClick}>
        <img src="/emblema.png" alt="Emblema Clash Footballween" className="brand-crest-img" />
        <div>
          <span className="brand-sub">XÀTIVA 2026</span>
          <span className="brand-title">CLASH FOOTBALLWEEN</span>
        </div>
      </a>

      {/* 2. Enlaces Centrales de Navegación de Escritorio: Guía es la PRIMERA */}
      <ul className="fnav-links fnav-desktop-links">
        <li>
          <button
            type="button"
            onClick={() => openModal('acceso_rapido')}
            className="fnav-guia-btn"
            title="Abrir Directorio y Guía Oficial del Torneo"
          >
            <Zap size={13} />
            <span>Guía</span>
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={handleHomeClick}
            className={route === 'home' ? 'active-nav-link' : ''}
          >
            Inicio
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={() => navigateTo('clasificacion')}
            className={route === 'clasificacion' ? 'active-nav-link' : ''}
          >
            Clasificación
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={() => navigateTo('jugadores')}
            className={route === 'jugadores' ? 'active-nav-link' : ''}
          >
            Jugadores
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={() => navigateTo('arbitros')}
            className={route === 'arbitros' ? 'active-nav-link' : ''}
          >
            Árbitros
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={() => openModal('directo')}
            className="fnav-directo-btn"
          >
            <span className="live-dot" />
            <span>Directo</span>
          </button>
        </li>
      </ul>

      {/* 3. Acciones de Usuario (Tema + Perfil + Hamburguesa) */}
      <div className="fnav-actions">
        {/* Botón de Tema (Icono + texto en pantallas amplias, solo icono en intermedias) */}
        <button
          type="button"
          onClick={toggleTheme}
          className="theme-toggle-pill"
          title={isLight ? 'Cambiar a Modo Noche / Halloween' : 'Cambiar a Modo Día / Claro'}
        >
          {isLight ? (
            <>
              <Sun size={14} />
              <span className="theme-toggle-text">Modo Día</span>
            </>
          ) : (
            <>
              <Moon size={14} />
              <span className="theme-toggle-text">Modo Halloween</span>
            </>
          )}
        </button>

        {user ? (
          <div className="fnav-user-cluster">
            <button
              type="button"
              className="btn-primary-neon fnav-profile-btn"
              onClick={() => openModal('perfil')}
              title="Ver mi perfil y partidos"
            >
              {getRoleIcon()}
              <span>{user.gamertag || user.nombre_completo}</span>
            </button>
            <button
              type="button"
              onClick={logout}
              title="Cerrar sesión"
              className="fnav-logout-btn"
            >
              <LogOut size={13} />
              <span className="logout-text">Salir</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn-primary-neon fnav-login-btn"
            onClick={() => navigateTo('login')}
          >
            Registro / Inicio
          </button>
        )}

        {/* Botón Hamburguesa (Aparece en pantallas más apretadas) */}
        <button
          type="button"
          className={`fnav-hamburger-btn ${isMobileMenuOpen ? 'is-active' : ''}`}
          onClick={() => setIsMobileMenuOpen(prev => !prev)}
          aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú de navegación'}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* 4. Menú Desplegable Móvil / Tablet: Compacto y Elegante */}
      {isMobileMenuOpen && (
        <div className="fnav-mobile-dropdown" role="dialog" aria-modal="true">
          <div className="fnav-mobile-top">
            <span className="fnav-mobile-title">NAVEGACIÓN OFICIAL</span>
            <span className="fnav-mobile-tag">XÀTIVA 2026</span>
          </div>

          <ul className="fnav-mobile-list">
            {/* 1. GUÍA (Primero según solicitud) */}
            <li>
              <button
                type="button"
                className="fnav-mobile-item fnav-mobile-guia"
                onClick={() => handleNavClick(() => openModal('acceso_rapido'))}
              >
                <span className="fnav-item-icon-wrap guia">
                  <Zap size={15} />
                </span>
                <span className="fnav-item-label">Guía Oficial del Torneo</span>
                <span className="fnav-item-chip gold">GUÍA</span>
              </button>
            </li>

            {/* 2. INICIO (Segundo según solicitud) */}
            <li>
              <button
                type="button"
                className={`fnav-mobile-item ${route === 'home' ? 'active' : ''}`}
                onClick={handleHomeClick}
              >
                <span className="fnav-item-icon-wrap">
                  <Home size={15} />
                </span>
                <span className="fnav-item-label">Inicio</span>
              </button>
            </li>

            {/* 3. CLASIFICACIÓN */}
            <li>
              <button
                type="button"
                className={`fnav-mobile-item ${route === 'clasificacion' ? 'active' : ''}`}
                onClick={() => handleNavClick(() => navigateTo('clasificacion'))}
              >
                <span className="fnav-item-icon-wrap">
                  <Trophy size={15} />
                </span>
                <span className="fnav-item-label">Cuadro de Clasificación</span>
              </button>
            </li>

            {/* 4. JUGADORES */}
            <li>
              <button
                type="button"
                className={`fnav-mobile-item ${route === 'jugadores' ? 'active' : ''}`}
                onClick={() => handleNavClick(() => navigateTo('jugadores'))}
              >
                <span className="fnav-item-icon-wrap">
                  <Users size={15} />
                </span>
                <span className="fnav-item-label">Los 16 Jugadores</span>
              </button>
            </li>

            {/* 5. ÁRBITROS */}
            <li>
              <button
                type="button"
                className={`fnav-mobile-item ${route === 'arbitros' ? 'active' : ''}`}
                onClick={() => handleNavClick(() => navigateTo('arbitros'))}
              >
                <span className="fnav-item-icon-wrap">
                  <Scale size={15} />
                </span>
                <span className="fnav-item-label">Los Árbitros Oficiales</span>
              </button>
            </li>

            {/* 6. DIRECTO */}
            <li>
              <button
                type="button"
                className="fnav-mobile-item fnav-mobile-directo"
                onClick={() => handleNavClick(() => openModal('directo'))}
              >
                <span className="fnav-item-icon-wrap directo">
                  <Radio size={15} className="live-pulsing" />
                </span>
                <span className="fnav-item-label">Retransmisión en Directo</span>
                <span className="fnav-item-chip red">
                  <span className="live-pulse-dot" /> EN VIVO
                </span>
              </button>
            </li>
          </ul>

          <div className="fnav-mobile-divider" />

          {/* Acciones en el menú móvil */}
          <div className="fnav-mobile-footer-actions">
            <button
              type="button"
              onClick={toggleTheme}
              className="fnav-mobile-action-btn"
            >
              {isLight ? <Sun size={15} /> : <Moon size={15} />}
              <span>{isLight ? 'Cambiar a Modo Halloween' : 'Cambiar a Modo Día'}</span>
            </button>

            {user ? (
              <div className="fnav-mobile-user-row">
                <button
                  type="button"
                  className="btn-primary-neon fnav-mobile-profile"
                  onClick={() => handleNavClick(() => openModal('perfil'))}
                >
                  {getRoleIcon()}
                  <span>{user.gamertag || user.nombre_completo}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick(logout)}
                  className="fnav-logout-btn fnav-mobile-logout"
                  title="Cerrar sesión"
                >
                  <LogOut size={14} />
                  <span>Salir</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-primary-neon"
                style={{ width: '100%', padding: '10px', textAlign: 'center' }}
                onClick={() => handleNavClick(() => navigateTo('login'))}
              >
                Registro / Inicio
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
