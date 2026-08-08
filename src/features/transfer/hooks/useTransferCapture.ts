import { useCallback, useEffect, useState } from 'react';
import { classifyIdentifier } from '../../../shared/lib/barcodeClassifier';
import { useRealtimeRefresh } from '../../../shared/realtime/useRealtimeRefresh';
import { playSuccess, playStep, playError, vibrateSuccess, vibrateStep, vibrateError } from '../../../shared/feedback/feedback';
import { lookupProductForEntry, findDuplicateIdentifier } from '../../goodsReceiving/api/goodsReceiving.api';
import { listTransferUnits, insertTransferUnit, deleteTransferUnit } from '../api/transfer.api';
import type { RequiredId } from '../../../shared/supabase/types';
import type { TransferCaptureState, TransferSiparis, TransferUnit } from '../types';

function determineAutoField(code: string, capture: TransferCaptureState): RequiredId | null {
  const required = capture.product?.requiredIds ?? [];
  const missing = required.filter((id) => !capture.identifiers[id]);
  if (missing.length === 0) return null;

  const guess = classifyIdentifier(code);
  if (guess === 'IMEI') {
    const imeiSlot = missing.find((id) => id === 'IMEI1' || id === 'IMEI2');
    if (imeiSlot) return imeiSlot;
  }
  if (guess === 'SERIAL' && missing.includes('SERIAL')) return 'SERIAL';
  return missing[0];
}

export function useTransferCapture(transfer: TransferSiparis) {
  const [units, setUnits] = useState<TransferUnit[]>([]);
  const [capture, setCapture] = useState<TransferCaptureState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setUnits(await listTransferUnits(transfer.id));
  }, [transfer.id]);

  useEffect(() => {
    refresh().catch((e) => setError(e instanceof Error ? e.message : 'Veriler yüklenemedi'));
  }, [refresh]);

  useRealtimeRefresh(['transfer_urunler'], refresh);

  const handleScan = useCallback(
    async (code: string) => {
      setError(null);
      try {
        if (!capture) {
          const product = await lookupProductForEntry(code);
          if (product) {
            setCapture({ ean: code, product, isUnexpected: false, identifiers: {}, targetField: null, duplicateWarning: null });
          } else {
            setCapture({ ean: code, product: null, isUnexpected: true, identifiers: {}, targetField: null, duplicateWarning: null });
          }
          playStep();
          vibrateStep();
          return;
        }

        const required = capture.product?.requiredIds ?? [];
        if (required.length === 0) return;

        const field = capture.targetField ?? determineAutoField(code, capture);
        if (!field) {
          setError('Kod sınıflandırılamadı — bir alana dokunup hedefleyin.');
          playError();
          vibrateError();
          return;
        }

        setCapture({
          ...capture,
          identifiers: { ...capture.identifiers, [field]: code },
          targetField: null,
          duplicateWarning: null,
        });
        playStep();
        vibrateStep();

        const duplicate = await findDuplicateIdentifier(code);
        if (duplicate) {
          setCapture((prev) =>
            prev && prev.identifiers[field] === code ? { ...prev, duplicateWarning: duplicate } : prev,
          );
          playError();
          vibrateError();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'İşlem başarısız');
        playError();
        vibrateError();
      }
    },
    [capture],
  );

  const setTargetField = useCallback((field: RequiredId) => {
    setCapture((prev) => (prev ? { ...prev, targetField: field } : prev));
  }, []);

  const canAccept = capture
    ? !capture.duplicateWarning &&
      (capture.isUnexpected ||
        !capture.product ||
        capture.product.requiredIds.every((id) => capture.identifiers[id]))
    : false;

  const handleAccept = useCallback(async () => {
    if (!capture || !canAccept) return;
    setError(null);
    try {
      if (capture.isUnexpected) {
        await insertTransferUnit(transfer.id, { rawBarkod: capture.ean, beklenmeyen: true });
      } else if (capture.product) {
        await insertTransferUnit(transfer.id, {
          productId: capture.product.productId,
          identifiers: capture.identifiers,
        });
      }
      setCapture(null);
      playSuccess();
      vibrateSuccess();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaydedilemedi');
      playError();
      vibrateError();
    }
  }, [transfer.id, canAccept, capture, refresh]);

  const handleDiscard = useCallback(() => {
    setCapture(null);
  }, []);

  const removeUnit = useCallback(
    async (id: string) => {
      try {
        await deleteTransferUnit(id);
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Birim silinemedi');
      }
    },
    [refresh],
  );

  return { units, capture, canAccept, error, handleScan, setTargetField, handleAccept, handleDiscard, removeUnit };
}
