import { useEffect, useState } from 'react';

/**
 * Router mínimo basado en hash para poder tener páginas separadas
 * (#/registro, #/login) sin añadir dependencias y funcionando en hosting estático.
 */
export type AppRoute = 'home' | 'login' | 'register' | 'clasificacion' | 'jugadores' | 'arbitros';

const ROUTE_EVENT = 'cf:route-change';
let savedScrollY = 0;

function parseHash(): AppRoute {
  const hash = window.location.hash.replace(/^#/, '').replace(/\/+$/, '').toLowerCase();
  if (hash === '/login' || hash === '/iniciar-sesion' || hash === '/entrar') return 'login';
  if (hash === '/registro' || hash === '/register' || hash === '/signup') return 'register';
  if (
    hash === '/clasificacion' ||
    hash === '/cuadro' ||
    hash === '/bracket' ||
    hash === '/playoffs' ||
    hash === '/eliminatorias'
  ) {
    return 'clasificacion';
  }
  if (hash === '/jugadores' || hash === '/players' || hash === '/participantes') {
    return 'jugadores';
  }
  if (hash === '/arbitros' || hash === '/referees' || hash === '/colegiados') {
    return 'arbitros';
  }
  return 'home';
}

export function navigateTo(route: AppRoute): void {
  const current = parseHash();

  if (current === 'home' && route !== 'home') {
    savedScrollY = window.scrollY;
  }

  if (route === 'home') {
    window.history.pushState(null, '', window.location.pathname + window.location.search);
    window.dispatchEvent(new Event(ROUTE_EVENT));
    window.setTimeout(() => window.scrollTo(0, savedScrollY), 60);
    return;
  }

  const hash =
    route === 'login'
      ? '#/login'
      : route === 'register'
      ? '#/registro'
      : route === 'clasificacion'
      ? '#/clasificacion'
      : route === 'arbitros'
      ? '#/arbitros'
      : '#/jugadores';

  if (window.location.hash === hash) {
    window.dispatchEvent(new Event(ROUTE_EVENT));
  } else {
    window.location.hash = hash;
  }
}

export function useHashRoute(): AppRoute {
  const [route, setRoute] = useState<AppRoute>(parseHash);

  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onChange);
    window.addEventListener('popstate', onChange);
    window.addEventListener(ROUTE_EVENT, onChange);
    return () => {
      window.removeEventListener('hashchange', onChange);
      window.removeEventListener('popstate', onChange);
      window.removeEventListener(ROUTE_EVENT, onChange);
    };
  }, []);

  return route;
}
