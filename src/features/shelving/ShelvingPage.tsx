import { useCallback, useEffect, useState } from 'react';
import { ShelfSelectorList } from './components/ShelfSelectorList';
import { ProductScanStep } from './components/ProductScanStep';
import { PendingList } from './components/PendingList';
import { CommitButton } from './components/CommitButton';
import { WaitingProductsPicker } from './components/WaitingProductsPicker';
import { usePendingShelvingList } from './hooks/usePendingShelvingList';
import {
  listShelvesWithStockSummary,
  getWaitingProductsForShelving,
} from './api/shelving.api';
import type { ShelfSummary, WaitingProductItem } from './api/shelving.api';
import type { ActiveShelf } from './types';

export function ShelvingPage() {
  const [activeShelf, setActiveShelf] = useState<ActiveShelf | null>(null);
  const [shelves, setShelves] = useState<ShelfSummary[]>([]);
  const [waitingProducts, setWaitingProducts] = useState<WaitingProductItem[]>([]);
  const [loadingShelves, setLoadingShelves] = useState(true);
  const [loadingWaiting, setLoadingWaiting] = useState(true);

  // Ürün ekleme modu: 'bekleyenler' veya 'tarama'
  const [entryMode, setEntryMode] = useState<'bekleyenler' | 'tarama'>('bekleyenler');

  const { items, addOrIncrement, addWithQuantity, setQuantity, remove, clear } =
    usePendingShelvingList();

  const loadData = useCallback(async () => {
    setLoadingShelves(true);
    setLoadingWaiting(true);
    try {
      const [shelvesData, waitingData] = await Promise.all([
        listShelvesWithStockSummary(),
        getWaitingProductsForShelving(),
      ]);
      setShelves(shelvesData);
      setWaitingProducts(waitingData);
    } catch (err) {
      console.error('Raflama verileri yüklenemedi:', err);
    } finally {
      setLoadingShelves(false);
      setLoadingWaiting(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleChangeShelf() {
    if (
      items.length > 0 &&
      !confirm('Rafı değiştirirseniz istifleme listesi silinecektir. Devam edilsin mi?')
    ) {
      return;
    }
    clear();
    setActiveShelf(null);
  }

  function handleCommitted() {
    clear();
    loadData();
  }

  // Henüz raf seçilmemiş durum
  if (!activeShelf) {
    return (
      <div className="shelving-page">
        <div className="page-header">
          <div className="page-header-left">
            <h2 className="page-title">Ürün İstifle (Raflama)</h2>
            <span className="page-subtitle">
              Depo raflarını inceleyin, hedef rafı seçin ve bekleyen ürünleri istifleyin
            </span>
          </div>
          <button
            type="button"
            onClick={loadData}
            disabled={loadingShelves}
            style={{ minHeight: '34px', padding: '4px 10px', fontSize: '12px' }}
          >
            🔄 Yenile
          </button>
        </div>

        {/* Raf Listesi */}
        <ShelfSelectorList
          shelves={shelves}
          loading={loadingShelves}
          onShelfSelected={setActiveShelf}
        />

        {/* İstiflenmeyi Bekleyen Ürünler Önizlemesi */}
        <WaitingProductsPicker
          items={waitingProducts}
          loading={loadingWaiting}
          onAddProduct={() => {
            alert('Lütfen önce yukarıdaki listeden ürünleri istifleyeceğiniz rafı seçin.');
          }}
        />
      </div>
    );
  }

  // Raf seçilmiş durum
  return (
    <div className="shelving-page">
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">Ürün İstifle</h2>
          <span className="page-subtitle">Hedef rafa ürün ekleme ve miktar atama</span>
        </div>
      </div>

      {/* Aktif Raf Bilgi Kartı */}
      <div
        className="active-shelf-banner"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(226, 98, 42, 0.1)',
          border: '1px solid var(--accent)',
          borderRadius: '10px',
          padding: '14px 18px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>📍</span>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Hedef Raf</div>
            <strong style={{ fontSize: '16px', color: 'var(--text-h)' }}>
              {activeShelf.label}
            </strong>
          </div>
        </div>
        <button
          type="button"
          onClick={handleChangeShelf}
          style={{ minHeight: '34px', padding: '4px 12px', fontSize: '12.5px' }}
        >
          Rafı Değiştir
        </button>
      </div>

      {/* Ürün Ekleme Yöntemi Seçimi */}
      <div className="reports-tabs" style={{ marginBottom: '16px' }}>
        <button
          type="button"
          className={entryMode === 'bekleyenler' ? 'reports-tab active' : 'reports-tab'}
          onClick={() => setEntryMode('bekleyenler')}
        >
          ⏳ Bekleyen Ürünlerden Seç ({waitingProducts.length})
        </button>
        <button
          type="button"
          className={entryMode === 'tarama' ? 'reports-tab active' : 'reports-tab'}
          onClick={() => setEntryMode('tarama')}
        >
          📷 Kamera / Barkod ile Tara
        </button>
      </div>

      {/* Yöntem 1: Bekleyen Ürünler Listesi */}
      {entryMode === 'bekleyenler' && (
        <WaitingProductsPicker
          items={waitingProducts}
          loading={loadingWaiting}
          onAddProduct={(p) => addWithQuantity(p, p.quantity)}
        />
      )}

      {/* Yöntem 2: Barkod ile Giriş */}
      {entryMode === 'tarama' && (
        <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
          <ProductScanStep onProductScanned={addOrIncrement} />
        </div>
      )}

      {/* Rafa İstiflenecek Ürünlerin Geçici Listesi */}
      <div className="card" style={{ marginTop: '20px', padding: '18px' }}>
        <div className="card-header" style={{ marginBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px' }}>
              📋 Bu Rafa Atanacak Ürünler ({items.length} Kalem)
            </h3>
            <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Miktarları kontrol edip onaylayarak raf stoklarına işleyin
            </span>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={clear}
              style={{ minHeight: '30px', padding: '3px 8px', fontSize: '12px', color: 'var(--danger)' }}
            >
              Listeyi Temizle
            </button>
          )}
        </div>

        <PendingList items={items} onSetQuantity={setQuantity} onRemove={remove} />

        <div style={{ marginTop: '16px' }}>
          <CommitButton
            shelfId={activeShelf.shelfId}
            items={items}
            onCommitted={handleCommitted}
          />
        </div>
      </div>
    </div>
  );
}
