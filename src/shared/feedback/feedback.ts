let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioContext = new Ctor();
  }
  return audioContext;
}

function beep(frequency: number, durationMs: number, delayMs = 0): void {
  const ctx = getContext();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  oscillator.connect(gain);
  gain.connect(ctx.destination);

  const startAt = ctx.currentTime + delayMs / 1000;
  gain.gain.setValueAtTime(0.15, startAt);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + durationMs / 1000);
  oscillator.start(startAt);
  oscillator.stop(startAt + durationMs / 1000);
}

/** Başarı: yüksek tiz tek bip. */
export function playSuccess(): void {
  beep(1400, 90);
}

/** Ara adım (ör. bir tanımlayıcı dolduruldu): kısa tık. */
export function playStep(): void {
  beep(900, 50);
}

/** Hata: çift düşük ton. */
export function playError(): void {
  beep(280, 120);
  beep(280, 120, 150);
}

export function vibrateSuccess(): void {
  navigator.vibrate?.(40);
}

export function vibrateStep(): void {
  navigator.vibrate?.(15);
}

export function vibrateError(): void {
  navigator.vibrate?.([60, 60, 60]);
}
