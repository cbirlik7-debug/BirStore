import { useMemo, useState } from 'react';
import type { PlacedProductItem } from '../api/productLocator.api';

interface PlacedProductsTableProps {
  items: PlacedProductItem[];
  loading: boolean;
  onSelectProduct?: (ean: string) => void;
}

export function PlacedProductsTable({
  items,
  loading,
  onSelectProduct,
}: PlacedProductsTableProps) {
  const [filterQuery, setFilterQuery] = useState('');

  const filtered = useMemo(() => {
    if (!filterQuery.trim()) return items;
    const q = filterQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.ean.toLowerCase().includes(q) ||
        item.articleNo.toLowerCase().includes(q) ||
        item.shelfName.toLowerCase().includes(q),
    );
  }, [items, filterQuery]);

  return (
    <div className="placed-products-table-container">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px',
          flexWrap: 'wrap',
        }}
      >
        <input
          type="search"
          placeholder="🔍 Yerleştirilmiş ürünlerde ara (isim, raf, EAN)..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          style={{ width: '100%', maxWidth: '380px' }}
        />
        <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
          {filtered.length} raf konumu listeleniyor
        </span>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', padding: '16px 0' }}>Yükleniyor...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', padding: '16px 0' }}>
          {filterQuery ? 'Aramaya uygun yerleştirilmiş ürün bulunamadı.' : 'Henüz yerleştirilmiş ürün yok.'}
        </p>
      ) : (
        <div className="table-scroll">
          <table className="catalog-table">
            <thead>
              <tr>
                <th>Ürün Adı</th>
                <th>EAN / Artikel</th>
                <th>Bulunduğu Raf</th>
                <th>Raftaki Adet</th>
                <th>Son Yerleştirme</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => (
                <tr key={`${item.productId}-${item.shelfId}-${idx}`}>
                  <td>
                    <strong>{item.name}</strong>
                  </td>
                  <td>
                    <code>{item.ean}</code>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {item.articleNo}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-green" style={{ fontSize: '12.5px' }}>
                      📍 {item.shelfName}
                    </span>
                  </td>
                  <td>
                    <strong style={{ fontSize: '15px' }}>{item.quantity}</strong> adet
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {new Date(item.placedAt).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td>
                    {onSelectProduct && (
                      <button
                        type="button"
                        onClick={() => onSelectProduct(item.ean)}
                        style={{ minHeight: '30px', padding: '3px 8px', fontSize: '11.5px' }}
                      >
                        Sorgula →
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
