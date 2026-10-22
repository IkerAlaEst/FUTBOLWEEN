/**
 * Pitido de árbitro sintetizado (sin ficheros de audio).
 * Se usa al empezar y al terminar la simulación de un partido.
 */
export function playWhistle(durationMs = 900): void {
  try {
    const AudioCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioCtor) return;

    const ctx = new AudioCtor();
    const now = ctx.currentTime;
    const duration = durationMs / 1000;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2350, now);
    osc.frequency.setValueAtTime(2650, now + duration * 0.18);
    osc.frequency.setValueAtTime(2400, now + duration * 0.4);
    osc.frequency.setValueAtTime(2700, now + duration * 0.65);

    // Trino rápido típico del silbato
    lfo.type = 'square';
    lfo.frequency.setValueAtTime(22, now);
    lfoGain.gain.setValueAtTime(120, now);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.03);
    gain.gain.setValueAtTime(0.12, now + duration * 0.75);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    lfo.start(now);
    osc.stop(now + duration + 0.05);
    lfo.stop(now + duration + 0.05);

    void ctx.resume();

    window.setTimeout(() => {
      void ctx.close().catch(() => undefined);
    }, (duration + 0.3) * 1000);
  } catch {
    // Sin audio disponible: la simulación sigue funcionando.
  }
}
