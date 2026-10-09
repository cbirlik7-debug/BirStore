import { useEffect, useRef } from 'react';

interface HardwareScannerOptions {
  onScan: (barcode: string) => void;
  enabled?: boolean;
  minBarcodeLength?: number;
  maxKeyIntervalMs?: number;
}

/**
 * Global Donanım Barkod Okuyucu Dinleyicisi (Zebra, Honeywell, Datalogic veya USB/BT barkod tabancaları).
 * Donanım okuyucuları klavye vuruşlarını insanlar tarafından yapılamayacak kadar yüksek hızda (<50ms)
 * ardışık gönderip sonunda Enter basarlar. Bu hook bu vuruşları yakalayarak otomatik tarama tetikler.
 */
export function useGlobalHardwareScanner({
  onScan,
  enabled = true,
  minBarcodeLength = 4,
  maxKeyIntervalMs = 60,
}: HardwareScannerOptions) {
  const bufferRef = useRef<string>('');
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Eğer kullanıcı odaklanmış bir metin alanına (input/textarea) yazıyorsa müdahale etme
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (isInput) {
        return;
      }

      const now = performance.now();
      const interval = now - lastTimeRef.current;
      lastTimeRef.current = now;

      if (e.key === 'Enter') {
        const barcode = bufferRef.current.trim();
        bufferRef.current = '';

        if (barcode.length >= minBarcodeLength) {
          e.preventDefault();
          onScan(barcode);
        }
        return;
      }

      // Sadece basılabilir tek karakterleri kabul et
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Eğer iki tuş arası çok uzun sürdüyse (insan tuşlaması), buffer'ı sıfırla
        if (interval > maxKeyIntervalMs && bufferRef.current.length > 0) {
          bufferRef.current = '';
        }
        bufferRef.current += e.key;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, minBarcodeLength, maxKeyIntervalMs, onScan]);
}
