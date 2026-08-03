import { useCallback, useEffect, useState } from 'react';
import { classifyIdentifier } from '../../../shared/lib/barcodeClassifier';
import {
  lookupProductForEntry,
  listUnits,
  insertUnit,
  deleteUnit,
} from '../api/goodsReceiving.api';
import type { RequiredId, IdentifierValues } from '../../../shared/supabase/types';
import type { CommittedUnit, EntryProduct, ScanMode } from '../types';

function determineAutoField(
  code: string,
  product: EntryProduct,
  current: IdentifierValues,
  mode: ScanMode,
): RequiredId | null {
  const missing = product.requiredIds.filter((id) => !current[id]);
  if (missing.length === 0) return null;
  if (mode === 'sirali') return missing[0];

  const guess = classifyIdentifier(code);
  if (guess === 'IMEI') {
    const imeiSlot = missing.find((id) => id === 'IMEI1' || id === 'IMEI2');
    if (imeiSlot) return imeiSlot;
  }
  if (guess === 'SERIAL' && missing.includes('SERIAL')) return 'SERIAL';
  return missing[0];
}

export function useStickyProductEntry(koliId: string) {
  const [units, setUnits] = useState<CommittedUnit[]>([]);
  const [activeProduct, setActiveProduct] = useState<EntryProduct | null>(null);
  const [filled, setFilled] = useState<IdentifierValues>({});
  const [mode, setMode] = useState<ScanMode>('sirali');
  const [targetField, setTargetField] = useState<RequiredId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshUnits = useCallback(async () => {
    setUnits(await listUnits(koliId));
  }, [koliId]);

  useEffect(() => {
    refreshUnits().catch((e) => setError(e instanceof Error ? e.message : 'Birimler yüklenemedi'));
  }, [refreshUnits]);

  const handleScan = useCallback(
    async (code: string) => {
      setError(null);
      try {
        if (!activeProduct) {
          const product = await lookupProductForEntry(code);
          if (product) {
            if (product.requiredIds.length === 0) {
              await insertUnit(koliId, { productId: product.productId });
              await refreshUnits();
            } else {
              setActiveProduct(product);
              setFilled({});
              setTargetField(null);
            }
          } else {
            await insertUnit(koliId, { rawBarkod: code, beklenmeyen: true });
            await refreshUnits();
          }
          return;
        }

        if (!targetField) {
          const product = await lookupProductForEntry(code);
          if (product && product.productId !== activeProduct.productId) {
            setActiveProduct(product);
            setFilled({});
            setTargetField(null);
            if (product.requiredIds.length === 0) {
              await insertUnit(koliId, { productId: product.productId });
              await refreshUnits();
              setActiveProduct(null);
            }
            return;
          }
        }

        const field = targetField ?? determineAutoField(code, activeProduct, filled, mode);
        if (!field) {
          setError('Kod sınıflandırılamadı — bir alana dokunup hedefleyin.');
          return;
        }

        const nextFilled = { ...filled, [field]: code };
        setFilled(nextFilled);
        setTargetField(null);

        const allFilled = activeProduct.requiredIds.every((id) => nextFilled[id]);
        if (allFilled) {
          await insertUnit(koliId, {
            productId: activeProduct.productId,
            identifiers: nextFilled,
          });
          await refreshUnits();
          setFilled({});
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'İşlem başarısız');
      }
    },
    [activeProduct, filled, koliId, mode, refreshUnits, targetField],
  );

  const cancelActiveProduct = useCallback(() => {
    setActiveProduct(null);
    setFilled({});
    setTargetField(null);
  }, []);

  const removeUnit = useCallback(
    async (id: string) => {
      try {
        await deleteUnit(id);
        await refreshUnits();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Birim silinemedi');
      }
    },
    [refreshUnits],
  );

  return {
    units,
    activeProduct,
    filled,
    mode,
    setMode,
    targetField,
    setTargetField,
    error,
    handleScan,
    cancelActiveProduct,
    removeUnit,
  };
}
