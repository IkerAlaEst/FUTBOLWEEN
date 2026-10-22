import React, { useEffect, useRef } from 'react';
import { INITIAL_ALTITUDE_METERS, FINAL_ALTITUDE_METERS } from '../../config/constants';

export const AltitudeHud: React.FC = () => {
  const altTextRef = useRef<HTMLDivElement>(null);
  const altBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
          const altitude = Math.round(INITIAL_ALTITUDE_METERS - progress * (INITIAL_ALTITUDE_METERS - FINAL_ALTITUDE_METERS));

          if (altTextRef.current) {
            altTextRef.current.textContent = `${altitude}m`;
          }
          if (altBarRef.current) {
            altBarRef.current.style.height = `${(progress * 100).toFixed(1)}%`;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="altitude-hud" aria-label="Indicador de altitud en metros">
      <div className="alt-value" id="alt-Text" ref={altTextRef}>
        {INITIAL_ALTITUDE_METERS}m
      </div>
      <div className="alt-bar-track">
        <div
          className="alt-bar-fill"
          id="alt-bar"
          ref={altBarRef}
          style={{ height: '0%' }}
        />
      </div>
      <div className="alt-label">COTA CASTELL → SIMARRO</div>
    </div>
  );
};
