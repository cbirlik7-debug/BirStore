import { useCallback, useEffect, useState, useMemo } from 'react';
import { PendingList } from './components/PendingList';
import { CommitButton } from './components/CommitButton';
import { WaitingProductsPicker } from './components/WaitingProductsPicker';
import { ProductScanStep } from './components/ProductScanStep';
import { usePendingShelvingList } from './hooks/usePendingShelvingList';
import {
  listShelvesWithStockSummary,
  getWaitingProductsForShelving,
  listPlacedStock,
  createShelf,
  updateShelf,
  deleteShelf,
} from './api/shelving.api';
import type {
  ShelfSummary,
  WaitingProductItem,
  PlacedStockRow,
  ShelfFormData,
} from './api/shelving.api';
import type { ActiveShelf } from './types';

type Tab = 'raflar' | 'istiflenmiş' | 'bekleyen';
type EntryMode = 'bekleyenler' | 'tarama';

// ── Raf Form Modal ─────────────────────────────────────────────────────────
interface ShelfModalProps {
  initial?: ShelfSummary | null;
  onClose: () => void;
  onSaved: () => void;
}

function ShelfModal({ initial, onClose, onSaved }: ShelfModalProps) {
  const [form, setForm] = useState<ShelfFormData>({
    barcode: initial?.barcode ?? '',
    name: initial?.name ?? '',
    location: initial?.location ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() && !form.barcode.trim()) {
      setError('Raf adı veya barkod girilmelidir.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (initial) {
        await updateShelf(initial.shelfId, form);
      } else {
        await createShelf(form);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '28px 24px',
          width: '100%', maxWidth: '460px', boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-h)' }}>
            {initial ? '✏️ Rafı Düzenle' : '➕ Yeni Raf Oluştur'}
          </h3>
          <button
            type="button" onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}
          >×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Raf Barkodu
            </span>
            <input
              type="text"
              placeholder="Örn: RAF-A1-01"
              value={form.barcode}
              onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
              style={{ width: '100%' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Raf Adı <span style={{ color: 'var(--danger)' }}>*</span>
            </span>
            <input
              type="text"
              placeholder="Örn: Raf A1-01"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              style={{ width: '100%' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Konum / Açıklama
            </span>
            <input
              type="text"
              placeholder="Örn: A Koridoru • Kat 1 (Aksesuarlar)"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              style={{ width: '100%' }}
            />
          </label>

          {error && (
            <p style={{ margin: 0, padding: '8px 12px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '8px', color: 'var(--danger)', fontSize: '13px' }}>
              ⚠️ {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button type="button" onClick={onClose} style={{ minHeight: '36px', padding: '6px 16px', fontSize: '13px' }}>
              İptal
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ minHeight: '36px', padding: '6px 20px', fontSize: '13px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 600 }}
            >
              {saving ? 'Kaydediliyor...' : initial ? 'Güncelle' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Raf Listesi Sekmesi ────────────────────────────────────────────────────
interface ShelvesTabProps {
  shelves: ShelfSummary[];
  loading: boolean;
  onShelfSelected: (shelf: ActiveShelf) => void;
  onRefresh: () => void;
  onCreateNew: () => void;
  onEdit: (shelf: ShelfSummary) => void;
  onDelete: (shelf: ShelfSummary) => void;
}

function ShelvesTab({ shelves, loading, onShelfSelected, onRefresh, onCreateNew, onEdit, onDelete }: ShelvesTabProps) {
  const [filterQuery, setFilterQuery] = useState('');

  const filtered = useMemo(() => {
    if (!filterQuery.trim()) return shelves;
    const q = filterQuery.toLowerCase();
    return shelves.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.barcode.toLowerCase().includes(q) ||
        (s.location ?? '').toLowerCase().includes(q),
    );
  }, [shelves, filterQuery]);

  return (
    <div>
      {/* Araç Çubuğu */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          type="search"
          placeholder="🔍 Raf adı, barkod veya konum ara..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          style={{ flex: 1, minWidth: '200px', maxWidth: '380px' }}
        />
        <button
          type="button" onClick={onRefresh} disabled={loading}
          style={{ minHeight: '36px', padding: '4px 12px', fontSize: '12.5px' }}
        >
          🔄 Yenile
        </button>
        <button
          type="button" onClick={onCreateNew}
          style={{ minHeight: '36px', padding: '4px 16px', fontSize: '13px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 600 }}
        >
          ➕ Yeni Raf
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
          ⏳ Raflar yükleniyor...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
          {filterQuery ? 'Aramaya uygun raf bulunamadı.' : 'Henüz raf tanımlanmamış. "Yeni Raf" ile ekleyin.'}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '12px',
          }}
        >
          {filtered.map((shelf) => (
            <div
              key={shelf.shelfId}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              {/* Başlık */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-h)' }}>
                    📍 {shelf.name}
                  </div>
                  <code style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                    {shelf.barcode}
                  </code>
                </div>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => onEdit(shelf)}
                    title="Düzenle"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 8px', fontSize: '13px', cursor: 'pointer', minHeight: '28px' }}
                  >✏️</button>
                  <button
                    type="button"
                    onClick={() => onDelete(shelf)}
                    title="Sil"
                    style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '6px', padding: '4px 8px', fontSize: '13px', cursor: 'pointer', minHeight: '28px', color: 'var(--danger)' }}
                  >🗑</button>
                </div>
              </div>

              {/* Konum */}
              {shelf.location && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-elevated)', borderRadius: '6px', padding: '4px 8px' }}>
                  {shelf.location}
                </div>
              )}

              {/* İstatistikler */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span className="badge badge-blue" style={{ fontSize: '11.5px' }}>
                  📦 {shelf.kalemSayisi} Kalem
                </span>
                <span className={`badge ${shelf.toplamAdet > 0 ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: '11.5px' }}>
                  🔢 {shelf.toplamAdet} Adet
                </span>
              </div>

              {/* İstifleme Butonu */}
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
                  marginTop: '2px',
                  width: '100%',
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '13px',
                  minHeight: '36px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Bu Rafa İstifle →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── İstiflenmiş Ürünler Sekmesi ───────────────────────────────────────────
interface PlacedTabProps {
  rows: PlacedStockRow[];
  loading: boolean;
  onRefresh: () => void;
}

function PlacedTab({ rows, loading, onRefresh }: PlacedTabProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const [groupByShelf, setGroupByShelf] = useState(true);

  const filtered = useMemo(() => {
    if (!filterQuery.trim()) return rows;
    const q = filterQuery.toLowerCase();
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.articleNo.toLowerCase().includes(q) ||
        r.shelfName.toLowerCase().includes(q),
    );
  }, [rows, filterQuery]);

  // Rafa göre grupla
  const grouped = useMemo(() => {
    const map = new Map<string, { shelfId: string; shelfName: string; rows: PlacedStockRow[] }>();
    for (const row of filtered) {
      const existing = map.get(row.shelfId);
      if (existing) { existing.rows.push(row); }
      else { map.set(row.shelfId, { shelfId: row.shelfId, shelfName: row.shelfName, rows: [row] }); }
    }
    return Array.from(map.values());
  }, [filtered]);

  const totalItems = rows.reduce((s, r) => s + r.quantity, 0);
  const uniqueProducts = new Set(rows.map((r) => r.productId)).size;

  return (
    <div>
      {/* Özet */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        {[
          { label: 'Toplam Ürün Çeşidi', value: uniqueProducts, icon: '📦', color: 'var(--badge-blue-fg)' },
          { label: 'Toplam Adet', value: totalItems, icon: '🔢', color: 'var(--success)' },
          { label: 'Dolu Raf Sayısı', value: grouped.length, icon: '📍', color: '#f59e0b' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 14px' }}
          >
            <div style={{ fontSize: '22px', marginBottom: '4px' }}>{stat.icon}</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Araç çubuğu */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
        <input
          type="search"
          placeholder="🔍 Ürün adı, artikel veya raf ara..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          style={{ flex: 1, minWidth: '200px', maxWidth: '360px' }}
        />
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setGroupByShelf(true)}
            style={{ minHeight: '32px', padding: '4px 12px', fontSize: '12px', background: groupByShelf ? 'var(--accent)' : 'var(--bg-elevated)', color: groupByShelf ? '#fff' : 'var(--text)', border: '1px solid var(--border)', fontWeight: groupByShelf ? 700 : 400 }}
          >Rafa Göre</button>
          <button
            type="button"
            onClick={() => setGroupByShelf(false)}
            style={{ minHeight: '32px', padding: '4px 12px', fontSize: '12px', background: !groupByShelf ? 'var(--accent)' : 'var(--bg-elevated)', color: !groupByShelf ? '#fff' : 'var(--text)', border: '1px solid var(--border)', fontWeight: !groupByShelf ? 700 : 400 }}
          >Liste</button>
          <button type="button" onClick={onRefresh} disabled={loading} style={{ minHeight: '32px', padding: '4px 10px', fontSize: '12px' }}>
            🔄
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>⏳ Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
          {filterQuery ? 'Aramaya uygun kayıt bulunamadı.' : 'Henüz istiflenmiş ürün bulunmuyor.'}
        </div>
      ) : groupByShelf ? (
        // Raf bazında gruplu görünüm
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {grouped.map((group) => {
            const groupTotal = group.rows.reduce((s, r) => s + r.quantity, 0);
            return (
              <div key={group.shelfId} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '8px' }}>
                  <strong style={{ color: 'var(--text-h)', fontSize: '14px' }}>📍 {group.shelfName}</strong>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span className="badge badge-blue" style={{ fontSize: '11.5px' }}>📦 {group.rows.length} Kalem</span>
                    <span className="badge badge-green" style={{ fontSize: '11.5px' }}>🔢 {groupTotal} Adet</span>
                  </div>
                </div>
                <div className="table-scroll">
                  <table className="catalog-table" style={{ fontSize: '12.5px' }}>
                    <thead>
                      <tr>
                        <th>Artikel No</th>
                        <th>Ürün Adı</th>
                        <th style={{ textAlign: 'right' }}>Miktar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((row) => (
                        <tr key={row.productId}>
                          <td><code style={{ fontSize: '11.5px' }}>{row.articleNo}</code></td>
                          <td>{row.name}</td>
                          <td style={{ textAlign: 'right' }}>
                            <strong style={{ color: 'var(--success)', fontSize: '13px' }}>{row.quantity}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Düz liste görünümü
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <div className="table-scroll">
            <table className="catalog-table" style={{ fontSize: '12.5px' }}>
              <thead>
                <tr>
                  <th>Raf</th>
                  <th>Artikel No</th>
                  <th>Ürün Adı</th>
                  <th style={{ textAlign: 'right' }}>Miktar</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={`${row.shelfId}-${row.productId}-${i}`}>
                    <td><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📍 {row.shelfName}</span></td>
                    <td><code style={{ fontSize: '11.5px' }}>{row.articleNo}</code></td>
                    <td>{row.name}</td>
                    <td style={{ textAlign: 'right' }}>
                      <strong style={{ color: 'var(--success)', fontSize: '13px' }}>{row.quantity}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── İstifleme Akışı (Raf Seçilmiş) ────────────────────────────────────────
interface ShelvingFlowProps {
  activeShelf: ActiveShelf;
  waitingProducts: WaitingProductItem[];
  loadingWaiting: boolean;
  onChangeShelf: () => void;
  onCommitted: () => void;
}

function ShelvingFlow({ activeShelf, waitingProducts, loadingWaiting, onChangeShelf, onCommitted }: ShelvingFlowProps) {
  const [entryMode, setEntryMode] = useState<EntryMode>('bekleyenler');
  const { items, addOrIncrement, addWithQuantity, setQuantity, remove, clear } = usePendingShelvingList();

  function handleChangeShelf() {
    if (items.length > 0 && !confirm('Rafı değiştirirseniz istifleme listesi silinecektir. Devam edilsin mi?')) return;
    clear();
    onChangeShelf();
  }

  function handleCommitted() {
    clear();
    onCommitted();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Aktif raf banner */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(226, 98, 42, 0.1)', border: '1px solid var(--accent)',
        borderRadius: 'var(--radius)', padding: '14px 18px', flexWrap: 'wrap', gap: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>📍</span>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Hedef Raf</div>
            <strong style={{ fontSize: '15px', color: 'var(--text-h)' }}>{activeShelf.label}</strong>
          </div>
        </div>
        <button type="button" onClick={handleChangeShelf} style={{ minHeight: '34px', padding: '4px 12px', fontSize: '12.5px' }}>
          ← Rafı Değiştir
        </button>
      </div>

      {/* Ürün ekleme yöntemi */}
      <div className="reports-tabs" style={{ marginBottom: '0' }}>
        <button type="button" className={entryMode === 'bekleyenler' ? 'reports-tab active' : 'reports-tab'} onClick={() => setEntryMode('bekleyenler')}>
          ⏳ Bekleyenlerden Seç ({waitingProducts.length})
        </button>
        <button type="button" className={entryMode === 'tarama' ? 'reports-tab active' : 'reports-tab'} onClick={() => setEntryMode('tarama')}>
          📷 Barkod Tara
        </button>
      </div>

      {entryMode === 'bekleyenler' && (
        <WaitingProductsPicker
          items={waitingProducts}
          loading={loadingWaiting}
          onAddProduct={(p) => addWithQuantity(p, p.quantity, p.quantity)}
        />
      )}

      {entryMode === 'tarama' && (
        <div className="card" style={{ padding: '16px' }}>
          <ProductScanStep onProductScanned={addOrIncrement} />
        </div>
      )}

      {/* Eklenecek ürünler */}
      <div className="card" style={{ padding: '18px' }}>
        <div className="card-header" style={{ marginBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px' }}>📋 Bu Rafa Atanacak Ürünler ({items.length} Kalem)</h3>
            <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Miktarları kontrol edip onaylayarak raf stoklarına işleyin</span>
          </div>
          {items.length > 0 && (
            <button type="button" onClick={clear} style={{ minHeight: '30px', padding: '3px 8px', fontSize: '12px', color: 'var(--danger)' }}>
              Temizle
            </button>
          )}
        </div>
        <PendingList items={items} onSetQuantity={setQuantity} onRemove={remove} />
        <div style={{ marginTop: '16px' }}>
          <CommitButton shelfId={activeShelf.shelfId} items={items} onCommitted={handleCommitted} />
        </div>
      </div>
    </div>
  );
}

// ── Ana Sayfa ──────────────────────────────────────────────────────────────
export function ShelvingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('raflar');
  const [activeShelf, setActiveShelf] = useState<ActiveShelf | null>(null);

  // Raf listesi
  const [shelves, setShelves] = useState<ShelfSummary[]>([]);
  const [loadingShelves, setLoadingShelves] = useState(true);

  // Bekleyen ürünler
  const [waitingProducts, setWaitingProducts] = useState<WaitingProductItem[]>([]);
  const [loadingWaiting, setLoadingWaiting] = useState(true);

  // İstiflenmiş ürünler
  const [placedStock, setPlacedStock] = useState<PlacedStockRow[]>([]);
  const [loadingPlaced, setLoadingPlaced] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShelf, setEditingShelf] = useState<ShelfSummary | null>(null);

  const loadShelves = useCallback(async () => {
    setLoadingShelves(true);
    try {
      setShelves(await listShelvesWithStockSummary());
    } catch (err) { console.error(err); }
    finally { setLoadingShelves(false); }
  }, []);

  const loadWaiting = useCallback(async () => {
    setLoadingWaiting(true);
    try {
      setWaitingProducts(await getWaitingProductsForShelving());
    } catch (err) { console.error(err); }
    finally { setLoadingWaiting(false); }
  }, []);

  const loadPlaced = useCallback(async () => {
    setLoadingPlaced(true);
    try {
      setPlacedStock(await listPlacedStock());
    } catch (err) { console.error(err); }
    finally { setLoadingPlaced(false); }
  }, []);

  useEffect(() => {
    loadShelves();
    loadWaiting();
    loadPlaced();
  }, [loadShelves, loadWaiting, loadPlaced]);

  async function handleDelete(shelf: ShelfSummary) {
    if (!confirm(`"${shelf.name}" rafını silmek istediğinizden emin misiniz?`)) return;
    try {
      await deleteShelf(shelf.shelfId);
      loadShelves();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Silinemedi');
    }
  }

  function handleShelfSelected(shelf: ActiveShelf) {
    setActiveShelf(shelf);
    setActiveTab('raflar');
  }

  function handleCommitted() {
    loadShelves();
    loadWaiting();
    loadPlaced();
    setActiveShelf(null);
  }

  // Sekme etiketleri
  const tabs: { key: Tab; label: string }[] = [
    { key: 'raflar', label: `📍 Raflar (${shelves.length})` },
    { key: 'istiflenmiş', label: `✅ İstiflenmiş Ürünler` },
    { key: 'bekleyen', label: `⏳ Bekleyen Ürünler (${waitingProducts.length})` },
  ];

  return (
    <div className="shelving-page">
      {/* Modal */}
      {modalOpen && (
        <ShelfModal
          initial={editingShelf}
          onClose={() => { setModalOpen(false); setEditingShelf(null); }}
          onSaved={() => { loadShelves(); }}
        />
      )}

      {/* Sayfa Başlığı */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div className="page-header-left">
          <h2 className="page-title">Ürün İstifle</h2>
          <span className="page-subtitle">Raf yönetimi, istifleme ve stok takibi</span>
        </div>
      </div>

      {/* İstifleme Akışı (Raf seçildiyse) */}
      {activeShelf ? (
        <ShelvingFlow
          activeShelf={activeShelf}
          waitingProducts={waitingProducts}
          loadingWaiting={loadingWaiting}
          onChangeShelf={() => setActiveShelf(null)}
          onCommitted={handleCommitted}
        />
      ) : (
        <>
          {/* Sekmeler */}
          <div className="reports-tabs" style={{ marginBottom: '20px' }}>
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                className={activeTab === t.key ? 'reports-tab active' : 'reports-tab'}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Raf Listesi Sekmesi */}
          {activeTab === 'raflar' && (
            <ShelvesTab
              shelves={shelves}
              loading={loadingShelves}
              onShelfSelected={handleShelfSelected}
              onRefresh={loadShelves}
              onCreateNew={() => { setEditingShelf(null); setModalOpen(true); }}
              onEdit={(shelf) => { setEditingShelf(shelf); setModalOpen(true); }}
              onDelete={handleDelete}
            />
          )}

          {/* İstiflenmiş Ürünler Sekmesi */}
          {activeTab === 'istiflenmiş' && (
            <PlacedTab rows={placedStock} loading={loadingPlaced} onRefresh={loadPlaced} />
          )}

          {/* Bekleyen Ürünler Sekmesi */}
          {activeTab === 'bekleyen' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                <button type="button" onClick={loadWaiting} disabled={loadingWaiting} style={{ minHeight: '34px', padding: '4px 12px', fontSize: '12.5px' }}>
                  🔄 Yenile
                </button>
              </div>
              <WaitingProductsPicker
                items={waitingProducts}
                loading={loadingWaiting}
                onAddProduct={() => {
                  alert('Ürün istifleme için önce "Raflar" sekmesinden bir raf seçin.');
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
