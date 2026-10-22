import { useState, useEffect } from 'react';
import { TOURNAMENT_TARGET_DATE } from '../config/constants';

interface CountdownResult {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  isExpired: boolean;
}

export function useCountdown(targetDateIso: string = TOURNAMENT_TARGET_DATE): CountdownResult {
  const [timeLeft, setTimeLeft] = useState<CountdownResult>({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00',
    isExpired: false
  });

  useEffect(() => {
    const target = new Date(targetDateIso).getTime();

    const calculate = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, target - now);

      if (diff <= 0) {
        setTimeLeft({
          days: '00',
          hours: '00',
          minutes: '00',
          seconds: '00',
          isExpired: true
        });
        return;
      }

      const days = String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, '0');
      const hours = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0');
      const minutes = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
      const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        isExpired: false
      });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDateIso]);

  return timeLeft;
}

