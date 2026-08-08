import { useEffect, useState } from 'react';
import { getDailyReport } from '../api/reports.api';
import { toCsv, downloadCsv } from '../../../shared/lib/csv';
import type { DailyReport } from '../types';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DailyReportPanel() {
  const [date, setDate] = useState(todayStr());
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(d: string) {
    setLoading(true);
    try {
      setReport(await getDailyReport(d));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Rapor yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleExport() {
    if (!report) return;
    const csv = toCsv(
      ['Artikel', 'Ürün Adı', 'Adet'],
      report.urunDokum.map((u) => [u.articleNo, u.productName, u.adet]),
    );
    downloadCsv(`gunluk-rapor-${report.tarih}.csv`, csv);
  }

  return (
    <div>
      <div className="daily-report-controls">
        <label>
          Tarih
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              load(e.target.value);
            }}
          />
        </label>
        <button type="button" onClick={handleExport} disabled={!report}>
          CSV Dışa Aktar
        </button>
      </div>

      {error && <p role="alert">{error}</p>}

      {loading || !report ? (
        <p>Yükleniyor...</p>
      ) : (
        <>
          <div className="dashboard-stats">
            <div className="stat-tile">
              <strong>{report.koliSayisi}</strong>
              <span>Koli</span>
            </div>
            <div className="stat-tile">
              <strong>{report.urunSayisi}</strong>
              <span>Ürün</span>
            </div>
            <div className="stat-tile">
              <strong>{report.tutanakSayisi}</strong>
              <span>Tutanak</span>
            </div>
          </div>

          {report.urunDokum.length === 0 ? (
            <p>Bu tarihte ürün girişi yok.</p>
          ) : (
            <div className="table-scroll">
            <table className="catalog-table">
              <thead>
                <tr>
                  <th>Artikel</th>
                  <th>Ürün Adı</th>
                  <th>Adet</th>
                </tr>
              </thead>
              <tbody>
                {report.urunDokum.map((u) => (
                  <tr key={u.articleNo}>
                    <td>{u.articleNo}</td>
                    <td>{u.productName}</td>
                    <td>{u.adet}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
