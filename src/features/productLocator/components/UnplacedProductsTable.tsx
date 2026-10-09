import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { UnplacedProductItem } from '../api/productLocator.api';

interface UnplacedProductsTableProps {
  items: UnplacedProductItem[];
  loading: boolean;
}

export function UnplacedProductsTable({ items, loading }: UnplacedProductsTableProps) {
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
    <div className="unplaced-products-table-container">
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
          placeholder="🔍 Yerleştirilmemiş ürünlerde ara..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          style={{ width: '100%', maxWidth: '380px' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            {filtered.length} ürün raflama bekliyor
          </span>
          <Link
            to="/raflama"
            role="button"
            style={{
              background: 'var(--accent)',
              color: '#fff',
              fontSize: '12px',
              padding: '5px 10px',
              minHeight: '32px',
              fontWeight: 600,
            }}
          >
            Raflamaya Git →
          </Link>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', padding: '16px 0' }}>Yükleniyor...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', padding: '16px 0' }}>
          {filterQuery
            ? 'Aramaya uygun yerleştirilmemiş ürün bulunamadı.'
            : 'Harika! Tüm ürünler raflara yerleştirilmiş görünüyor.'}
        </p>
      ) : (
        <div className="table-scroll">
          <table className="catalog-table">
            <thead>
              <tr>
                <th>Ürün Adı</th>
                <th>EAN / Artikel</th>
                <th>Bekleyen Koli</th>
                <th>Bekleyen Adet</th>
                <th>Durum</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => (
                <tr key={`${item.productId}-${idx}`}>
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
                      <code style={{ background: 'var(--bg-elevated)', padding: '2px 6px' }}>
                        📦 {item.koliBarkod}
                      </code>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td>
                    {item.adet > 0 ? (
                      <strong style={{ fontSize: '14px', color: '#f59e0b' }}>
                        {item.adet} adet
                      </strong>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>0</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        item.koliBarkod ? 'badge-orange' : 'badge-gray'
                      }`}
                      style={{ fontSize: '11.5px' }}
                    >
                      {item.statusText}
                    </span>
                  </td>
                  <td>
                    <Link
                      to="/raflama"
                      role="button"
                      style={{ minHeight: '30px', padding: '3px 8px', fontSize: '11.5px' }}
                    >
                      Rafla →
                    </Link>
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
