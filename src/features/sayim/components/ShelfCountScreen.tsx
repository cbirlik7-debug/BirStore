import { useState } from 'react';
import { ScannerInput } from '../../../shared/scanner/ScannerInput';
import { playSuccess, playStep, playError, vibrateSuccess, vibrateStep, vibrateError } from '../../../shared/feedback/feedback';
import { lookupShelfByBarcode, lookupProductByEan } from '../../shelving/api/shelving.api';
import {
  findShelfLock,
  isLockStale,
  acquireShelfLock,
  releaseShelfLock,
  submitShelfCounts,
} from '../api/sayim.api';
import { useAuth } from '../../../shared/auth/useAuth';
import type { Sayim, SayimCountItem, ShelfLockInfo } from '../types';
import type { ActiveShelf } from '../../shelving/types';

export function ShelfCountScreen({ sayim, onDone }: { sayim: Sayim; onDone: () => void }) {
  const { session, role } = useAuth();
  const userId = session?.user.id ?? '';

  const [shelf, setShelf] = useState<ActiveShelf | null>(null);
  const [lock, setLock] = useState<ShelfLockInfo | null>(null);
  const [items, setItems] = useState<SayimCountItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleShelfScan(barcode: string) {
    setError(null);
    try {
      const s = await lookupShelfByBarcode(barcode);
      const existingLock = await findShelfLock(s.shelfId);
      if (existingLock && existingLock.kilitleyenUserId !== userId) {
        setShelf(s);
        setLock(existingLock);
        return;
      }
      if (!existingLock) {
        await acquireShelfLock(s.shelfId, sayim.id, userId);
      }
      setShelf(s);
      setLock(null);
      setItems([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Raf okutulamadı');
    }
  }

  async function handleForceUnlock() {
    if (!shelf) return;
    setError(null);
    try {
      await releaseShelfLock(shelf.shelfId);
      await acquireShelfLock(shelf.shelfId, sayim.id, userId);
      setLock(null);
      setItems([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kilit açılamadı');
    }
  }

  async function handleProductScan(ean: string) {
    setError(null);
    try {
      const product = await lookupProductByEan(ean);
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === product.productId);
        if (existing) {
          return prev.map((i) => (i.productId === product.productId ? { ...i, adet: i.adet + 1 } : i));
        }
        return [...prev, { productId: product.productId, articleNo: product.articleNo, name: product.name, adet: 1 }];
      });
      playStep();
      vibrateStep();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ürün bulunamadı');
      playError();
      vibrateError();
    }
  }

  function updateAdet(productId: string, adet: number) {
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, adet } : i)));
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  async function handleFinish() {
    if (!shelf) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitShelfCounts(sayim.id, shelf.shelfId, userId, items);
      setShelf(null);
      setItems([]);
      playSuccess();
      vibrateSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaydedilemedi');
      playError();
      vibrateError();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (shelf && !lock) {
      try {
        await releaseShelfLock(shelf.shelfId);
      } catch {
        // kullanıcı ekrandan ayrılıyor, sessizce geç
      }
    }
    setShelf(null);
    setItems([]);
  }

  if (!shelf) {
    return (
      <div className="sayim-shelf-scan">
        <h2>{sayim.ad}</h2>
        {error && <p role="alert">{error}</p>}
        <ScannerInput onScan={handleShelfScan} placeholder="Raf barkodu okutun" autoFocus />
        <button type="button" onClick={onDone}>
          Sayım Listesine Dön
        </button>
      </div>
    );
  }

  if (lock) {
    const minutes = Math.round((Date.now() - new Date(lock.kilitlendiAt).getTime()) / 60000);
    const stale = isLockStale(lock);
    return (
      <div className="sayim-lock-info">
        <h2>{shelf.label}</h2>
        <p>
          Bu raf {lock.kilitleyenAdi ?? 'başka bir kullanıcı'} tarafından {minutes} dk önce kilitlendi
          {stale ? ' — muhtemelen terk edilmiş.' : '.'}
        </p>
        {error && <p role="alert">{error}</p>}
        <div className="sayim-lock-actions">
          {(stale || role === 'yonetici') && (
            <button type="button" onClick={handleForceUnlock}>
              Kilidi Aç ve Devam Et
            </button>
          )}
          <button type="button" onClick={() => setShelf(null)}>
            Geri
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sayim-count-screen">
      <h2>{shelf.label}</h2>
      {error && <p role="alert">{error}</p>}
      <ScannerInput onScan={handleProductScan} placeholder="Ürün EAN okutun" autoFocus />

      <ul className="sayim-item-list">
        {items.map((item) => (
          <li key={item.productId}>
            <span>
              {item.articleNo} — {item.name}
            </span>
            <input
              type="number"
              min={0}
              value={item.adet}
              onChange={(e) => updateAdet(item.productId, Number(e.target.value))}
            />
            <button type="button" className="btn-danger" onClick={() => removeItem(item.productId)}>
              Sil
            </button>
          </li>
        ))}
      </ul>

      <div className="sayim-count-actions">
        <button type="button" onClick={handleCancel}>
          Vazgeç
        </button>
        <button type="button" className="btn-accept" disabled={submitting} onClick={handleFinish}>
          {submitting ? 'Kaydediliyor...' : 'Bitir'}
        </button>
      </div>
    </div>
  );
}
