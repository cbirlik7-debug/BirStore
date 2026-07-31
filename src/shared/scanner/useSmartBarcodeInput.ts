import { useCallback, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';

interface UseSmartBarcodeInputOptions {
  onScan: (value: string) => void;
  silenceMs?: number;
  minLengthForEarlyEnter?: number;
}

/**
 * MDE tarayıcılar bazı barkod formatlarında (SSCC/GS1) gömülü ayırıcıyı "Enter"
 * gibi gönderebiliyor, bu erken/yarım tetiklemeye yol açar. Kısa değerlerde
 * Enter yok sayılır, karakter-sessizliğinde otomatik gönderim yapılır.
 */
export function useSmartBarcodeInput({
  onScan,
  silenceMs = 454,
  minLengthForEarlyEnter = 6,
}: UseSmartBarcodeInputOptions) {
  const [value, setValue] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const submit = useCallback(
    (raw: string) => {
      clearTimer();
      const trimmed = raw.trim();
      if (trimmed.length === 0) return;
      onScan(trimmed);
      setValue('');
    },
    [clearTimer, onScan],
  );

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      setValue(next);
      clearTimer();
      timerRef.current = setTimeout(() => submit(next), silenceMs);
    },
    [clearTimer, silenceMs, submit],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      if (value.length < minLengthForEarlyEnter) return;
      submit(value);
    },
    [minLengthForEarlyEnter, submit, value],
  );

  const reset = useCallback(() => {
    clearTimer();
    setValue('');
  }, [clearTimer]);

  return { value, onChange, onKeyDown, reset };
}
