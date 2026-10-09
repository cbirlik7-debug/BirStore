import { useEffect, useState } from 'react';
import { SearchBar } from './components/SearchBar';
import { ResultsTable } from './components/ResultsTable';
import { OrderCoverageList } from './components/OrderCoverageList';
import { ScannedRecordsList } from './components/ScannedRecordsList';
import { PlacedProductsTable } from './components/PlacedProductsTable';
import { UnplacedProductsTable } from './components/UnplacedProductsTable';
import {
  searchProduct,
  getShelfBreakdown,
  getOrderCoverage,
  findScannedRecords,
  listPlacedProducts,
  listUnplacedProducts,
} from './api/productLocator.api';
import type {
  ProductMatch,
  ShelfBreakdownRow,
  OrderCoverage,
  ScannedRecord,
  PlacedProductItem,
  UnplacedProductItem,
} from './api/productLocator.api';

type Tab = 'yerlestirilmis' | 'yerlestirilmemis' | 'arama';

export function ProductLocatorPage() {
  const [tab, setTab] = useState<Tab>('yerlestirilmis');

  // Yerleştirilmiş ve yerleştirilmemiş ürünler durumu
  const [placedItems, setPlacedItems] = useState<PlacedProductItem[]>([]);
  const [unplacedItems, setUnplacedItems] = useState<UnplacedProductItem[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  // Tekil arama durumu
  const [matches, setMatches] = useState<ProductMatch[]>([]);
  const [selected, setSelected] = useState<ProductMatch | null>(null);
  const [rows, setRows] = useState<ShelfBreakdownRow[]>([]);
  const [coverage, setCoverage] = useState<OrderCoverage[]>([]);
  const [scanned, setScanned] = useState<ScannedRecord[]>([]);
  const [rawQuery, setRawQuery] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  async function loadPlacementLists() {
    setLoadingLists(true);
    try {
      const [placed, unplaced] = await Promise.all([
        listPlacedProducts(),
        listUnplacedProducts(),
      ]);
      setPlacedItems(placed);
      setUnplacedItems(unplaced);
    } catch (err) {
      console.error('Yerleşim listeleri alınamadı:', err);
    } finally {
      setLoadingLists(false);
    }
  }

  useEffect(() => {
    loadPlacementLists();
  }, []);

  async function handleSearch(query: string) {
    setSearchError(null);
    setSelected(null);
    setRows([]);
    setCoverage([]);
    setScanned([]);
    setRawQuery(null);
    setSearching(true);
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
          setSearchError('Ürün veya kayıt bulunamadı.');
        }
      }
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : 'Arama başarısız');
    } finally {
      setSearching(false);
    }
  }

  async function selectProduct(product: ProductMatch) {
    setSelected(product);
    setMatches([]);
    setSearching(true);
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
      setSearchError(e instanceof Error ? e.message : 'Ürün bilgisi alınamadı');
    } finally {
      setSearching(false);
    }
  }

  function handleSelectFromPlaced(ean: string) {
    setTab('arama');
    handleSearch(ean);
  }

  return (
    <div className="product-locator-page">
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">Ürün Nerede</h2>
          <span className="page-subtitle">
            Depo raflarındaki ürün yerleşimleri ve bekleyen stokların anlık takibi
          </span>
        </div>
        <button
          type="button"
          onClick={loadPlacementLists}
          disabled={loadingLists}
          style={{ minHeight: '34px', padding: '4px 10px', fontSize: '12px' }}
        >
          🔄 Listeleri Yenile
        </button>
      </div>

      {/* Sekmeler */}
      <div className="reports-tabs" style={{ marginBottom: '20px' }}>
        <button
          type="button"
          className={tab === 'yerlestirilmis' ? 'reports-tab active' : 'reports-tab'}
          onClick={() => setTab('yerlestirilmis')}
        >
          📍 Yerleştirilmiş Ürünler ({placedItems.length})
        </button>
        <button
          type="button"
          className={tab === 'yerlestirilmis' ? 'reports-tab' : tab === 'yerlestirilmemis' ? 'reports-tab active' : 'reports-tab'}
          onClick={() => setTab('yerlestirilmemis')}
        >
          ⏳ Yerleştirilmemiş Ürünler ({unplacedItems.length})
        </button>
        <button
          type="button"
          className={tab === 'arama' ? 'reports-tab active' : 'reports-tab'}
          onClick={() => setTab('arama')}
        >
          🔍 Tekil Barkod / Seri No Ara
        </button>
      </div>

      {/* Sekme 1: Yerleştirilmiş Ürünler */}
      {tab === 'yerlestirilmis' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ margin: 0, fontSize: '15px' }}>📍 Depo Raflarına Yerleştirilmiş Ürünler</h3>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Belirli bir raf adresine atanmış ve adedi kayıtlı ürünler
              </span>
            </div>
          </div>
          <PlacedProductsTable
            items={placedItems}
            loading={loadingLists}
            onSelectProduct={handleSelectFromPlaced}
          />
        </div>
      )}

      {/* Sekme 2: Yerleştirilmemiş Ürünler */}
      {tab === 'yerlestirilmemis' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ margin: 0, fontSize: '15px' }}>⏳ Henüz Yerleştirilmemiş (Raflama Bekleyen) Ürünler</h3>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Mal kabulü yapılmış ancak henüz rafa kaldırılmamış veya raf kaydı bulunmayan ürünler
              </span>
            </div>
          </div>
          <UnplacedProductsTable items={unplacedItems} loading={loadingLists} />
        </div>
      )}

      {/* Sekme 3: Tekil Arama */}
      {tab === 'arama' && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: '15px' }}>🔍 Barkod, Seri No veya IMEI ile Konum Sorgula</h3>
          </div>
          <SearchBar onSearch={handleSearch} />
          {searching && <p style={{ color: 'var(--text-muted)', margin: '14px 0' }}>Aranıyor...</p>}
          {searchError && <p role="alert">{searchError}</p>}
          {matches.length > 1 && (
            <ul className="product-picker" style={{ margin: '14px 0' }}>
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
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '14px' }}>
                {selected.articleNo} — {selected.name}
              </h3>
              <ResultsTable rows={rows} />
              <OrderCoverageList items={coverage} />
              <ScannedRecordsList records={scanned} />
            </div>
          )}
          {!selected && rawQuery && (
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ fontSize: '15px' }}>"{rawQuery}" için okutulmuş kayıtlar</h3>
              <ScannedRecordsList records={scanned} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
