import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { listProducts, createProduct, deleteProduct } from './api/catalog.api';
import type { CatalogProduct } from './types';
import type { RequiredId } from '../../shared/supabase/types';
import { toCsv, downloadCsv, parseCsv } from '../../shared/lib/csv';

const ALL_REQUIRED_IDS: RequiredId[] = ['IMEI1', 'IMEI2', 'SERIAL'];

interface CsvPreviewItem {
  ean: string;
  articleNo: string;
  name: string;
  requiredIds: RequiredId[];
  isValid: boolean;
  error?: string;
}

export function CatalogPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form alanları
  const [ean, setEan] = useState('');
  const [articleNo, setArticleNo] = useState('');
  const [name, setName] = useState('');
  const [requiredIds, setRequiredIds] = useState<RequiredId[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Arama filtresi
  const [searchQuery, setSearchQuery] = useState('');

  // CSV İçe Aktarma Durumu
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState<CsvPreviewItem[]>([]);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // CSV Dışa Aktarma
  function handleExportCsv() {
    if (products.length === 0) return;
    const headers = ['EAN', 'ArtikelNo', 'UrunAdi', 'GerekliTanimlayicilar'];
    const rows = products.map((p) => [
      p.ean,
      p.articleNo,
      p.name,
      p.requiredIds.join(';'),
    ]);
    const csvData = toCsv(headers, rows);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCsv(`birstore-katalog-${dateStr}.csv`, csvData);
  }

  // Örnek CSV Şablonu
  function handleDownloadTemplate() {
    const headers = ['EAN', 'ArtikelNo', 'UrunAdi', 'GerekliTanimlayicilar'];
    const exampleRows = [
      ['869000000001', 'ART-101', 'Örnek Ürün A', 'IMEI1;SERIAL'],
      ['869000000002', 'ART-102', 'Örnek Ürün B', ''],
    ];
    const csvData = toCsv(headers, exampleRows);
    downloadCsv('birstore-katalog-sablon.csv', csvData);
  }

  // CSV Dosyası Yükleme ve Önizleme
  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const { rows } = parseCsv(text);
      const parsed: CsvPreviewItem[] = rows.map((row) => {
        const rowEan = row['EAN'] || row['ean'] || row['Barkod'] || '';
        const rowArt = row['ArtikelNo'] || row['artikelNo'] || row['Artikel'] || '';
        const rowName = row['UrunAdi'] || row['urunAdi'] || row['Ad'] || row['Isim'] || '';
        const rowReq = (row['GerekliTanimlayicilar'] || row['Tanimlayicilar'] || '')
          .split(/[;,]/)
          .map((s) => s.trim().toUpperCase())
          .filter((s): s is RequiredId => ALL_REQUIRED_IDS.includes(s as RequiredId));

        let isValid = true;
        let errorMsg = '';
        if (!rowEan) {
          isValid = false;
          errorMsg = 'EAN eksik';
        } else if (!rowArt) {
          isValid = false;
          errorMsg = 'Artikel eksik';
        } else if (!rowName) {
          isValid = false;
          errorMsg = 'Ad eksik';
        }

        return {
          ean: rowEan,
          articleNo: rowArt,
          name: rowName,
          requiredIds: rowReq,
          isValid,
          error: errorMsg,
        };
      });

      setCsvPreview(parsed);
      setImportModalOpen(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file, 'utf-8');
  }

  // Toplu İçe Aktarmayı Çalıştır
  async function handleExecuteImport() {
    const validItems = csvPreview.filter((i) => i.isValid);
    if (validItems.length === 0) return;

    setImporting(true);
    setImportStatus(`0 / ${validItems.length} ekleniyor...`);
    let addedCount = 0;
    let failCount = 0;

    for (let i = 0; i < validItems.length; i++) {
      const item = validItems[i];
      try {
        await createProduct({
          ean: item.ean,
          articleNo: item.articleNo,
          name: item.name,
          requiredIds: item.requiredIds,
        });
        addedCount++;
      } catch {
        failCount++;
      }
      setImportStatus(`${i + 1} / ${validItems.length} işlendi...`);
    }

    setImporting(false);
    setImportStatus(`${addedCount} ürün başarıyla eklendi.${failCount > 0 ? ` (${failCount} hata)` : ''}`);
    await refresh();
    setTimeout(() => {
      setImportModalOpen(false);
      setCsvPreview([]);
      setImportStatus(null);
    }, 1800);
  }

  // Canlı Arama ile Filtrelenen Ürünler
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.ean.toLowerCase().includes(q) ||
        p.articleNo.toLowerCase().includes(q),
    );
  }, [products, searchQuery]);

  return (
    <div className="catalog-page">
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">Ürün Kataloğu</h2>
          <span className="page-subtitle">Toplam {products.length} ürün tanımlı</span>
        </div>
        <div className="catalog-header-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" onClick={handleExportCsv} disabled={products.length === 0} title="Mevcut listeyi CSV olarak indir">
            📥 CSV İndir
          </button>
          <label className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
            📤 CSV Yükle
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </label>
          <button type="button" onClick={handleDownloadTemplate} title="Örnek CSV şablonu indir">
            📄 Şablon
          </button>
        </div>
      </div>

      {/* CSV İçe Aktarma Modal / Paneli */}
      {importModalOpen && (
        <div className="camera-scanner-overlay" role="dialog" aria-modal="true">
          <div className="camera-scanner-panel" style={{ maxWidth: '640px', width: '92%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0 }}>Toplu Ürün Yükleme (CSV)</h3>
              <button type="button" onClick={() => setImportModalOpen(false)} disabled={importing} style={{ minHeight: '32px', padding: '4px 10px' }}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '12px' }}>
              Yüklenen dosyada <strong>{csvPreview.length}</strong> satır tespit edildi.
              ({csvPreview.filter((p) => p.isValid).length} geçerli, {csvPreview.filter((p) => !p.isValid).length} geçersiz)
            </p>

            <div className="table-scroll" style={{ maxHeight: '260px', marginBottom: '16px' }}>
              <table className="catalog-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Durum</th>
                    <th>EAN</th>
                    <th>Artikel</th>
                    <th>Ad</th>
                    <th>Tanımlayıcılar</th>
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.map((item, idx) => (
                    <tr key={idx} style={{ opacity: item.isValid ? 1 : 0.6 }}>
                      <td>
                        {item.isValid ? (
                          <span className="badge badge-green">✓ Geçerli</span>
                        ) : (
                          <span className="badge badge-orange">{item.error}</span>
                        )}
                      </td>
                      <td>{item.ean || '—'}</td>
                      <td>{item.articleNo || '—'}</td>
                      <td>{item.name || '—'}</td>
                      <td>{item.requiredIds.join(', ') || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {importStatus && (
              <div style={{ padding: '8px 12px', background: 'var(--accent-bg)', borderRadius: '6px', marginBottom: '12px', fontSize: '13px' }}>
                {importStatus}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setImportModalOpen(false)} disabled={importing}>
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={importing || csvPreview.filter((p) => p.isValid).length === 0}
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                {importing ? 'Yükleniyor...' : `${csvPreview.filter((p) => p.isValid).length} Ürünü İçe Aktar`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ürün Ekleme Formu */}
      <form onSubmit={handleSubmit} className="catalog-form">
        <label>
          EAN
          <input value={ean} onChange={(e) => setEan(e.target.value)} placeholder="Örn: 869000000001" required />
        </label>
        <label>
          Artikel No
          <input value={articleNo} onChange={(e) => setArticleNo(e.target.value)} placeholder="Örn: ART-101" required />
        </label>
        <label>
          Ad
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ürün adı" required />
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

      {/* Arama ve Filtreleme */}
      <div style={{ margin: '20px 0 12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          type="search"
          placeholder="🔍 Ürün adı, EAN veya Artikel No ile ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', maxWidth: '400px' }}
        />
        {searchQuery && (
          <button type="button" onClick={() => setSearchQuery('')} style={{ minHeight: '38px', padding: '0 12px' }}>
            Temizle
          </button>
        )}
      </div>

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
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    {searchQuery ? 'Aramaya uygun ürün bulunamadı.' : 'Henüz ürün bulunmuyor.'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id}>
                    <td><code>{p.ean}</code></td>
                    <td><code>{p.articleNo}</code></td>
                    <td><strong>{p.name}</strong></td>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
