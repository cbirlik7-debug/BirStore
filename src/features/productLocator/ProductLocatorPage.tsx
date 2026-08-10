import { useState } from 'react';
import { SearchBar } from './components/SearchBar';
import { ResultsTable } from './components/ResultsTable';
import { OrderCoverageList } from './components/OrderCoverageList';
import { ScannedRecordsList } from './components/ScannedRecordsList';
import {
  searchProduct,
  getShelfBreakdown,
  getOrderCoverage,
  findScannedRecords,
} from './api/productLocator.api';
import type { ProductMatch, ShelfBreakdownRow, OrderCoverage, ScannedRecord } from './api/productLocator.api';

export function ProductLocatorPage() {
  const [matches, setMatches] = useState<ProductMatch[]>([]);
  const [selected, setSelected] = useState<ProductMatch | null>(null);
  const [rows, setRows] = useState<ShelfBreakdownRow[]>([]);
  const [coverage, setCoverage] = useState<OrderCoverage[]>([]);
  const [scanned, setScanned] = useState<ScannedRecord[]>([]);
  const [rawQuery, setRawQuery] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch(query: string) {
    setError(null);
    setSelected(null);
    setRows([]);
    setCoverage([]);
    setScanned([]);
    setRawQuery(null);
    setLoading(true);
    try {
      const results = await searchProduct(query);
      if (results.length === 1) {
        await selectProduct(results[0]);
      } else if (results.length > 1) {
        setMatches(results);
      } else {
        const records = await findScannedRecords(query);
        if (records.length > 0) {
          setScanned(records);
          setRawQuery(query);
        } else {
          setError('Ürün veya kayıt bulunamadı.');
        }
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
      const [breakdown, coverageRows, records] = await Promise.all([
        getShelfBreakdown(product.id),
        getOrderCoverage(product.id),
        findScannedRecords(product.ean, product.id),
      ]);
      setRows(breakdown);
      setCoverage(coverageRows);
      setScanned(records);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ürün bilgisi alınamadı');
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
          <OrderCoverageList items={coverage} />
          <ScannedRecordsList records={scanned} />
        </>
      )}
      {!selected && rawQuery && (
        <>
          <h3>"{rawQuery}" için okutulmuş kayıtlar</h3>
          <ScannedRecordsList records={scanned} />
        </>
      )}
    </div>
  );
}
