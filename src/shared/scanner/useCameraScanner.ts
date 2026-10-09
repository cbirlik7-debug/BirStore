import { useCallback, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';
import { playSuccess, vibrateSuccess } from '../feedback/feedback';

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
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const lastScanRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  const stop = useCallback(() => {
    if (isTorchOn && videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream | null;
      const track = stream?.getVideoTracks?.()[0];
      if (track) {
        try {
          (track as any).applyConstraints({ advanced: [{ torch: false }] });
        } catch {
          // ignore
        }
      }
      setIsTorchOn(false);
    }
    setHasTorch(false);
    controlsRef.current?.stop();
    controlsRef.current = null;
    setActive(false);
  }, [isTorchOn, videoRef]);

  const toggleTorch = useCallback(async () => {
    if (!videoRef.current) return false;
    const stream = videoRef.current.srcObject as MediaStream | null;
    const track = stream?.getVideoTracks?.()[0];
    if (!track) return false;
    const next = !isTorchOn;
    try {
      await (track as any).applyConstraints({
        advanced: [{ torch: next }],
      });
      setIsTorchOn(next);
      return next;
    } catch {
      return isTorchOn;
    }
  }, [isTorchOn, videoRef]);

  const start = useCallback(
    async (
      onDetected: (value: string) => void,
      opts?: { continuous?: boolean; cooldownMs?: number },
    ) => {
      setError(null);
      if (!videoRef.current) return;

      readerRef.current ??= new BrowserMultiFormatReader();
      const cooldown = opts?.cooldownMs ?? 1500;

      try {
        const controls = await readerRef.current.decodeFromConstraints(
          { video: { facingMode: 'environment' } },
          videoRef.current,
          (result) => {
            if (result) {
              const text = result.getText();
              const now = Date.now();
              if (
                opts?.continuous &&
                lastScanRef.current.code === text &&
                now - lastScanRef.current.time < cooldown
              ) {
                return;
              }
              lastScanRef.current = { code: text, time: now };
              playSuccess();
              vibrateSuccess();
              onDetected(text);
              if (!opts?.continuous) stop();
            }
          },
        );
        controlsRef.current = controls;
        setActive(true);

        // Cihazın kamera feneri (torch) desteğini tespit et
        const stream = videoRef.current?.srcObject as MediaStream | null;
        const track = stream?.getVideoTracks?.()[0];
        if (track && typeof (track as any).getCapabilities === 'function') {
          const caps = (track as any).getCapabilities();
          setHasTorch(Boolean(caps?.torch));
        }
      } catch (err) {
        setError(toTurkishError(err));
        setActive(false);
      }
    },
    [stop, videoRef],
  );

  return { start, stop, active, error, hasTorch, isTorchOn, toggleTorch };
}
