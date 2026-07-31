import { useState } from 'react';
import { SearchBar } from './components/SearchBar';
import { ResultsTable } from './components/ResultsTable';
import { searchProduct, getShelfBreakdown } from './api/productLocator.api';
import type { ProductMatch, ShelfBreakdownRow } from './api/productLocator.api';

export function ProductLocatorPage() {
  const [matches, setMatches] = useState<ProductMatch[]>([]);
  const [selected, setSelected] = useState<ProductMatch | null>(null);
  const [rows, setRows] = useState<ShelfBreakdownRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch(query: string) {
    setError(null);
    setSelected(null);
    setRows([]);
    setLoading(true);
    try {
      const results = await searchProduct(query);
      if (results.length === 1) {
        await selectProduct(results[0]);
      } else {
        setMatches(results);
        if (results.length === 0) setError('Ürün bulunamadı.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Arama başarısız');
    } finally {
      setLoading(false);
    }
  }

  async function selectProduct(product: ProductMatch) {
    setSelected(product);
    setMatches([]);
    setLoading(true);
    try {
      const breakdown = await getShelfBreakdown(product.id);
      setRows(breakdown);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Raf bilgisi alınamadı');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="product-locator-page">
      <h2>Ürün Nerede</h2>
      <SearchBar onSearch={handleSearch} />
      {loading && <p>Aranıyor...</p>}
      {error && <p role="alert">{error}</p>}
      {matches.length > 1 && (
        <ul className="product-picker">
          {matches.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => selectProduct(m)}>
                {m.articleNo} — {m.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {selected && (
        <>
          <h3>
            {selected.articleNo} — {selected.name}
          </h3>
          <ResultsTable rows={rows} />
        </>
      )}
    </div>
  );
}
