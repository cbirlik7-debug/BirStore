import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { listSayimlar, createSayim, closeSayim } from './api/sayim.api';
import { ShelfCountScreen } from './components/ShelfCountScreen';
import { SayimReportPanel } from './components/SayimReportPanel';
import { useAuth } from '../../shared/auth/useAuth';
import { useRealtimeRefresh } from '../../shared/realtime/useRealtimeRefresh';
import type { Sayim } from './types';

export function SayimPage() {
  const { role } = useAuth();
  const [sayimlar, setSayimlar] = useState<Sayim[]>([]);
  const [active, setActive] = useState<Sayim | null>(null);
  const [viewingReport, setViewingReport] = useState<Sayim | null>(null);
  const [ad, setAd] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setSayimlar(await listSayimlar());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sayımlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useRealtimeRefresh(['sayimlar', 'sayim_satirlari'], refresh);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!ad.trim()) return;
    try {
      const s = await createSayim(ad.trim());
      setAd('');
      await refresh();
      setActive(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sayım oluşturulamadı');
    }
  }

  async function handleClose(s: Sayim) {
    if (!confirm(`"${s.ad}" sayımını kapatmak istediğinize emin misiniz?`)) return;
    try {
      await closeSayim(s.id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sayım kapatılamadı');
    }
  }

  if (active) {
    return <ShelfCountScreen sayim={active} onDone={() => setActive(null)} />;
  }

  if (viewingReport) {
    return (
      <div className="sayim-page">
        <button type="button" onClick={() => setViewingReport(null)}>
          ← Sayım Listesi
        </button>
        <h2>{viewingReport.ad} — Rapor</h2>
        <SayimReportPanel sayim={viewingReport} />
      </div>
    );
  }

  return (
    <div className="sayim-page">
      <h2>Sayım</h2>
      {error && <p role="alert">{error}</p>}

      <form onSubmit={handleCreate} className="catalog-form">
        <label>
          Yeni Sayım Adı
          <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="örn. Ağustos 2026 Sayımı" required />
        </label>
        <button type="submit">Sayım Başlat</button>
      </form>

      {loading ? (
        <p>Yükleniyor...</p>
      ) : sayimlar.length === 0 ? (
        <p>Henüz sayım yok.</p>
      ) : (
        <div className="table-scroll">
        <table className="catalog-table">
          <thead>
            <tr>
              <th>Ad</th>
              <th>Başlangıç</th>
              <th>Durum</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sayimlar.map((s) => (
              <tr key={s.id}>
                <td>{s.ad}</td>
                <td>{new Date(s.baslangic).toLocaleString('tr-TR')}</td>
                <td>
                  <span className={`badge ${s.durum === 'acik' ? 'badge-green' : 'badge-gray'}`}>
                    {s.durum === 'acik' ? 'Açık' : 'Kapalı'}
                  </span>
                </td>
                <td>
                  {s.durum === 'acik' && (
                    <button type="button" onClick={() => setActive(s)}>
                      Say
                    </button>
                  )}
                  <button type="button" onClick={() => setViewingReport(s)}>
                    Rapor
                  </button>
                  {s.durum === 'acik' && role === 'yonetici' && (
                    <button type="button" className="btn-danger" onClick={() => handleClose(s)}>
                      Kapat
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
