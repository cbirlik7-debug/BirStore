import { useMemo, useState } from 'react';
import type { ShelfSummary } from '../api/shelving.api';
import type { ActiveShelf } from '../types';
import { ScannerInput } from '../../../shared/scanner/ScannerInput';

interface ShelfSelectorListProps {
  shelves: ShelfSummary[];
  loading: boolean;
  onShelfSelected: (shelf: ActiveShelf) => void;
}

export function ShelfSelectorList({
  shelves,
  loading,
  onShelfSelected,
}: ShelfSelectorListProps) {
  const [filterQuery, setFilterQuery] = useState('');

  const filtered = useMemo(() => {
    if (!filterQuery.trim()) return shelves;
    const q = filterQuery.toLowerCase();
    return shelves.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.barcode.toLowerCase().includes(q) ||
        (s.location && s.location.toLowerCase().includes(q)),
    );
  }, [shelves, filterQuery]);

  function handleScan(barcode: string) {
    const clean = barcode.trim();
    const found = shelves.find(
      (s) =>
        s.barcode.toLowerCase() === clean.toLowerCase() ||
        s.name.toLowerCase() === clean.toLowerCase(),
    );
    if (found) {
      onShelfSelected({
        shelfId: found.shelfId,
        barcode: found.barcode,
        label: `${found.name} (${found.kalemSayisi} Kalem • ${found.toplamAdet} Adet)`,
      });
    } else {
      onShelfSelected({
        shelfId: `shelf-${clean}`,
        barcode: clean,
        label: `Raf ${clean}`,
      });
    }
  }

  return (
    <div className="shelf-selector-list card" style={{ padding: '18px' }}>
      <div className="card-header" style={{ marginBottom: '14px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px' }}>📍 Depo Raf Listesi</h3>
          <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            İstifleme yapmak istediğiniz rafı seçin veya barkodunu okutun
          </span>
        </div>
      </div>

      {/* Barkod Okutma Girişi */}
      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '13px', margin: '0 0 6px', color: 'var(--text)' }}>
          Hızlı Raf Barkodu Okutun:
        </p>
        <ScannerInput onScan={handleScan} placeholder="Raf barkodu okutun (Örn: RAF-A1-01)" autoFocus />
      </div>

      {/* Arama ve Filtreleme */}
      <div style={{ margin: '14px 0 12px' }}>
        <input
          type="search"
          placeholder="🔍 Raflarda ara (Raf adı, barkod, koridor)..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          style={{ width: '100%', maxWidth: '380px' }}
        />
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', padding: '16px 0' }}>Raflar yükleniyor...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', padding: '16px 0' }}>
          {filterQuery ? 'Aramaya uygun raf bulunamadı.' : 'Tanımlı raf bulunmuyor.'}
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '12px',
          }}
        >
          {filtered.map((shelf) => (
            <div
              key={shelf.shelfId}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'border-color 0.15s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <strong style={{ fontSize: '15px', color: 'var(--text-h)' }}>
                  📍 {shelf.name}
                </strong>
                <code>{shelf.barcode}</code>
              </div>

              {shelf.location && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {shelf.location}
                </div>
              )}

              {/* Kalem ve Toplam Adet Göstergeleri */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  marginTop: '4px',
                  flexWrap: 'wrap',
                }}
              >
                <span className="badge badge-blue" style={{ fontSize: '12px' }}>
                  📦 {shelf.kalemSayisi} Kalem Çeşit
                </span>
                <span
                  className={`badge ${
                    shelf.toplamAdet > 0 ? 'badge-green' : 'badge-gray'
                  }`}
                  style={{ fontSize: '12px' }}
                >
                  🔢 {shelf.toplamAdet} Adet Toplam Ürün
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  onShelfSelected({
                    shelfId: shelf.shelfId,
                    barcode: shelf.barcode,
                    label: `${shelf.name} (${shelf.kalemSayisi} Kalem • ${shelf.toplamAdet} Adet)`,
                  })
                }
                style={{
                  marginTop: '6px',
                  width: '100%',
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '13px',
                  minHeight: '36px',
                }}
              >
                Bu Rafı Seç & İstifle →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
