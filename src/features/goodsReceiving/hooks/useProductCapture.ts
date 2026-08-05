import { useCallback, useEffect, useState } from 'react';
import { classifyIdentifier } from '../../../shared/lib/barcodeClassifier';
import { listOrders } from '../../orders/api/orders.api';
import {
  lookupProductForEntry,
  listUnits,
  insertUnit,
  deleteUnit,
  countUnitsByProductForOrder,
} from '../api/goodsReceiving.api';
import type { RequiredId } from '../../../shared/supabase/types';
import type { ActiveBox, CaptureState, CommittedUnit, ProductProgress } from '../types';

function determineAutoField(code: string, capture: CaptureState): RequiredId | null {
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

export function useProductCapture(box: ActiveBox) {
  const [units, setUnits] = useState<CommittedUnit[]>([]);
  const [capture, setCapture] = useState<CaptureState | null>(null);
  const [orderItems, setOrderItems] = useState<{ productId: string; beklenen: number }[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const refreshAll = useCallback(async () => {
    const nextUnits = await listUnits(box.id);
    setUnits(nextUnits);

    if (box.siparisId) {
      const [orders, counts] = await Promise.all([
        listOrders(),
        countUnitsByProductForOrder(box.siparisId),
      ]);
      const order = orders.find((o) => o.id === box.siparisId);
      setOrderItems(order ? order.items.map((i) => ({ productId: i.productId, beklenen: i.beklenen })) : []);
      setProductCounts(counts);
    } else {
      setOrderItems([]);
      setProductCounts({});
    }
  }, [box.id, box.siparisId]);

  useEffect(() => {
    refreshAll().catch((e) => setError(e instanceof Error ? e.message : 'Veriler yüklenemedi'));
  }, [refreshAll]);

  const orderProgress: ProductProgress | null = box.siparisId
    ? {
        girilen: Object.values(productCounts).reduce((sum, n) => sum + n, 0),
        beklenen: orderItems.reduce((sum, i) => sum + i.beklenen, 0),
      }
    : null;

  const currentProductProgress: ProductProgress | null = capture?.product
    ? (() => {
        const item = orderItems.find((i) => i.productId === capture.product!.productId);
        if (!item) return null;
        return { girilen: productCounts[capture.product.productId] ?? 0, beklenen: item.beklenen };
      })()
    : null;

  const handleScan = useCallback(
    async (code: string) => {
      setError(null);
      try {
        if (!capture) {
          const product = await lookupProductForEntry(code);
          if (product) {
            setCapture({ ean: code, product, isUnexpected: false, identifiers: {}, targetField: null });
          } else {
            setCapture({ ean: code, product: null, isUnexpected: true, identifiers: {}, targetField: null });
          }
          return;
        }

        const required = capture.product?.requiredIds ?? [];
        if (required.length === 0) return; // hiçbir slot beklenmiyor, ek kod okutmanın anlamı yok

        const field = capture.targetField ?? determineAutoField(code, capture);
        if (!field) {
          setError('Kod sınıflandırılamadı — bir alana dokunup hedefleyin.');
          return;
        }

        setCapture({
          ...capture,
          identifiers: { ...capture.identifiers, [field]: code },
          targetField: null,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'İşlem başarısız');
      }
    },
    [capture],
  );

  const setTargetField = useCallback((field: RequiredId) => {
    setCapture((prev) => (prev ? { ...prev, targetField: field } : prev));
  }, []);

  const canAccept = capture
    ? capture.isUnexpected ||
      !capture.product ||
      capture.product.requiredIds.every((id) => capture.identifiers[id])
    : false;

  const handleAccept = useCallback(async () => {
    if (!capture || !canAccept) return;
    setError(null);
    try {
      if (capture.isUnexpected) {
        await insertUnit(box.id, { rawBarkod: capture.ean, beklenmeyen: true });
      } else if (capture.product) {
        await insertUnit(box.id, {
          productId: capture.product.productId,
          identifiers: capture.identifiers,
        });
      }
      setCapture(null);
      await refreshAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaydedilemedi');
    }
  }, [box.id, canAccept, capture, refreshAll]);

  const handleDiscard = useCallback(() => {
    setCapture(null);
  }, []);

  const removeUnit = useCallback(
    async (id: string) => {
      try {
        await deleteUnit(id);
        await refreshAll();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Birim silinemedi');
      }
    },
    [refreshAll],
  );

  return {
    units,
    capture,
    canAccept,
    orderProgress,
    currentProductProgress,
    error,
    handleScan,
    setTargetField,
    handleAccept,
    handleDiscard,
    removeUnit,
  };
}
