import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { listProducts, createProduct, deleteProduct } from './api/catalog.api';
import type { CatalogProduct } from './types';
import type { RequiredId } from '../../shared/supabase/types';

const ALL_REQUIRED_IDS: RequiredId[] = ['IMEI1', 'IMEI2', 'SERIAL'];

export function CatalogPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [ean, setEan] = useState('');
  const [articleNo, setArticleNo] = useState('');
  const [name, setName] = useState('');
  const [requiredIds, setRequiredIds] = useState<RequiredId[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      setProducts(await listProducts());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ürünler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function toggleRequiredId(id: RequiredId) {
    setRequiredIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createProduct({ ean, articleNo, name, requiredIds });
      setEan('');
      setArticleNo('');
      setName('');
      setRequiredIds([]);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ürün eklenemedi');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    try {
      await deleteProduct(id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ürün silinemedi');
    }
  }

  return (
    <div className="catalog-page">
      <h2>Ürün Kataloğu</h2>

      <form onSubmit={handleSubmit} className="catalog-form">
        <label>
          EAN
          <input value={ean} onChange={(e) => setEan(e.target.value)} required />
        </label>
        <label>
          Artikel No
          <input value={articleNo} onChange={(e) => setArticleNo(e.target.value)} required />
        </label>
        <label>
          Ad
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <fieldset>
          <legend>Gerekli Tanımlayıcılar</legend>
          {ALL_REQUIRED_IDS.map((id) => (
            <label key={id} className="checkbox-label">
              <input
                type="checkbox"
                checked={requiredIds.includes(id)}
                onChange={() => toggleRequiredId(id)}
              />
              {id}
            </label>
          ))}
        </fieldset>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Ekleniyor...' : 'Ürün Ekle'}
        </button>
      </form>

      {error && <p role="alert">{error}</p>}
      {loading ? (
        <p>Yükleniyor...</p>
      ) : (
        <div className="table-scroll">
        <table className="catalog-table">
          <thead>
            <tr>
              <th>EAN</th>
              <th>Artikel No</th>
              <th>Ad</th>
              <th>Gerekli Tanımlayıcılar</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.ean}</td>
                <td>{p.articleNo}</td>
                <td>{p.name}</td>
                <td>
                  {p.requiredIds.length === 0
                    ? '—'
                    : p.requiredIds.map((id) => (
                        <span key={id} className="badge">
                          {id}
                        </span>
                      ))}
                </td>
                <td>
                  <button type="button" className="btn-danger" onClick={() => handleDelete(p.id)}>
                    Sil
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
