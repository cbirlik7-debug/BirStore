import { useMemo, useState } from 'react';
import type { WaitingProductItem } from '../api/shelving.api';

interface WaitingProductsPickerProps {
  items: WaitingProductItem[];
  loading: boolean;
  onAddProduct: (product: {
    productId: string;
    ean: string;
    articleNo: string;
    name: string;
    quantity: number;
  }) => void;
}

export function WaitingProductsPicker({
  items,
  loading,
  onAddProduct,
}: WaitingProductsPickerProps) {
  const [filterQuery, setFilterQuery] = useState('');

  const filtered = useMemo(() => {
    if (!filterQuery.trim()) return items;
    const q = filterQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.ean.toLowerCase().includes(q) ||
        item.articleNo.toLowerCase().includes(q) ||
        (item.koliBarkod && item.koliBarkod.toLowerCase().includes(q)),
    );
  }, [items, filterQuery]);

  return (
    <div className="waiting-products-picker card" style={{ padding: '16px', marginTop: '16px' }}>
      <div className="card-header" style={{ marginBottom: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '15px' }}>
            ⏳ Bekleyen Ürünler Listesinden Seç
          </h3>
          <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Mal kabulü yapılmış fakat henüz raflanmamış ürünleri tek tıkla bu rafa ekleyin
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <input
          type="search"
          placeholder="🔍 Bekleyen ürünlerde ara..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          style={{ width: '100%', maxWidth: '360px' }}
        />
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', padding: '12px 0' }}>Yükleniyor...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', padding: '12px 0' }}>
          {filterQuery
            ? 'Aramaya uygun bekleyen ürün bulunamadı.'
            : 'Raflanmayı bekleyen ürün bulunmuyor.'}
        </p>
      ) : (
        <div className="table-scroll" style={{ maxHeight: '280px' }}>
          <table className="catalog-table" style={{ fontSize: '12.5px' }}>
            <thead>
              <tr>
                <th>Ürün</th>
                <th>EAN / Artikel</th>
                <th>Bekleyen Koli</th>
                <th>Bekleyen Miktar</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.productId}>
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
                    {item.koliBarkod ? (
                      <code style={{ fontSize: '11.5px' }}>📦 {item.koliBarkod}</code>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <strong style={{ color: '#f59e0b', fontSize: '13.5px' }}>
                      {item.adet > 0 ? `${item.adet} adet` : 'Stoksuz'}
                    </strong>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() =>
                        onAddProduct({
                          productId: item.productId,
                          ean: item.ean,
                          articleNo: item.articleNo,
                          name: item.name,
                          quantity: item.adet > 0 ? item.adet : 1,
                        })
                      }
                      style={{
                        background: 'var(--accent)',
                        color: '#fff',
                        border: 'none',
                        fontSize: '12px',
                        padding: '4px 10px',
                        minHeight: '32px',
                        fontWeight: 600,
                      }}
                    >
                      ➕ Rafa Ekle {item.adet > 0 ? `(${item.adet})` : ''}
                    </button>
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
