import { useEffect, useState } from 'react';
import { listUnexpectedProducts, linkUnexpectedProduct } from '../api/reports.api';
import { listProducts } from '../../catalog/api/catalog.api';
import type { CatalogProduct } from '../../catalog/types';
import type { UnexpectedProduct } from '../types';

export function UnexpectedProductsPanel() {
  const [items, setItems] = useState<UnexpectedProduct[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState('');

  async function refresh() {
    setLoading(true);
    try {
      const [u, p] = await Promise.all([listUnexpectedProducts(), listProducts()]);
      setItems(u);
      setProducts(p);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleLink(item: UnexpectedProduct) {
    if (!selectedProductId) return;
    try {
      await linkUnexpectedProduct(item.id, item.rawBarkod ?? '', selectedProductId);
      setLinkingId(null);
      setSelectedProductId('');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ürüne bağlanamadı');
    }
  }

  if (loading) return <p>Yükleniyor...</p>;

  return (
    <div>
      {error && <p role="alert">{error}</p>}
      {items.length === 0 ? (
        <p>Beklenmeyen ürün yok.</p>
      ) : (
        <table className="catalog-table">
          <thead>
            <tr>
              <th>Ham Barkod</th>
              <th>Koli</th>
              <th>Sipariş</th>
              <th>Tarih</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.rawBarkod ?? '—'}</td>
                <td>{item.koliBarkod}</td>
                <td>{item.siparisNo ?? '—'}</td>
                <td>{new Date(item.createdAt).toLocaleString('tr-TR')}</td>
                <td>
                  {linkingId === item.id ? (
                    <span className="unexpected-link-form">
                      <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
                        <option value="">Ürün seçin</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.articleNo} — {p.name}
                          </option>
                        ))}
                      </select>
                      <button type="button" disabled={!selectedProductId} onClick={() => handleLink(item)}>
                        Bağla
                      </button>
                      <button type="button" onClick={() => setLinkingId(null)}>
                        Vazgeç
                      </button>
                    </span>
                  ) : (
                    <button type="button" onClick={() => setLinkingId(item.id)}>
                      Ürüne Bağla
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
