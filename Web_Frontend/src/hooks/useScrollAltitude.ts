import { useState, useEffect } from 'react';
import { INITIAL_ALTITUDE_METERS, FINAL_ALTITUDE_METERS } from '../config/constants';

interface ScrollAltitudeData {
  scrollProgress: number; // 0 to 1
  altitudeMeters: number; // 310m to 85m
  phaseLabel: string;
}

export function useScrollAltitude(): ScrollAltitudeData {
  const [data, setData] = useState<ScrollAltitudeData>({
    scrollProgress: 0,
    altitudeMeters: INITIAL_ALTITUDE_METERS,
    phaseLabel: 'CIMA DEL CASTILLO · HAZ SCROLL PARA BAJAR'
  });

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
      
      const altitude = Math.round(INITIAL_ALTITUDE_METERS - progress * (INITIAL_ALTITUDE_METERS - FINAL_ALTITUDE_METERS));

      let label = 'CIMA DEL CASTILLO · HAZ SCROLL PARA BAJAR';
      if (progress > 0.75) {
        label = 'IES DR. LLUÍS SIMARRO · FASE PREVIA Y AULA';
      } else if (progress > 0.2) {
        label = 'ESCALINATA ENCANTADA · DESCENDIENDO AL VALLE';
      }

      setData({
        scrollProgress: progress,
        altitudeMeters: altitude,
        phaseLabel: label
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return data;
}

