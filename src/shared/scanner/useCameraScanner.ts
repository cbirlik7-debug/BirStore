import { useCallback, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';

function toTurkishError(err: unknown): string {
  if (err instanceof DOMException) {
    if (err.name === 'NotAllowedError') return 'Kameraya erişim izni verilmedi.';
    if (err.name === 'NotFoundError') return 'Kamera bulunamadı.';
    if (err.name === 'NotReadableError') return 'Kameraya erişilemiyor (başka bir uygulama kullanıyor olabilir).';
  }
  return 'Kamera başlatılamadı.';
}

export function useCameraScanner(videoRef: RefObject<HTMLVideoElement | null>) {
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const stop = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setActive(false);
  }, []);

  const start = useCallback(
    async (onDetected: (value: string) => void) => {
      setError(null);
      if (!videoRef.current) return;

      readerRef.current ??= new BrowserMultiFormatReader();

      try {
        const controls = await readerRef.current.decodeFromConstraints(
          { video: { facingMode: 'environment' } },
          videoRef.current,
          (result) => {
            if (result) {
              onDetected(result.getText());
              stop();
            }
            // Sürekli tarama modunda "bulunamadı" hataları normaldir (her
            // karede barkod olmayabilir) — sadece başarılı sonuç işlenir.
          },
        );
        controlsRef.current = controls;
        setActive(true);
      } catch (err) {
        setError(toTurkishError(err));
        setActive(false);
      }
    },
    [stop, videoRef],
  );

  return { start, stop, active, error };
}
