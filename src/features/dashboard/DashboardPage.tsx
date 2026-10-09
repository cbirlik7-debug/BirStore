import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardData } from './api/dashboard.api';
import type { DashboardStats } from './api/dashboard.api';
import { useRealtimeRefresh } from '../../shared/realtime/useRealtimeRefresh';
import type { Order } from '../orders/types';

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    getDashboardData()
      .then((data) => {
        setStats(data.stats);
        setRecentOrders(data.recentOrders);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Özet verisi yüklenemedi'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useRealtimeRefresh(
    ['koliler', 'koli_urunler', 'siparisler', 'tutanaklar', 'tamamlanan_siparisler'],
    refresh,
  );

  // Koli tamamlama oranı hesaplama
  const totalKoli = (stats?.okutulanKoli ?? 0) + (stats?.acikKoli ?? 0);
  const koliPercent = totalKoli > 0 ? Math.round(((stats?.okutulanKoli ?? 0) / totalKoli) * 100) : 100;

  // Sipariş tamamlama oranı
  const totalSiparis = stats?.siparisSayisi ?? 0;
  const completedSiparis = stats?.tamamlananSiparis ?? 0;
  const siparisPercent =
    totalSiparis > 0 ? Math.round((completedSiparis / totalSiparis) * 100) : 0;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">Depo Genel Bakış</h2>
          <span className="page-subtitle">Canlı operasyonel durum ve depo hareketleri</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" onClick={refresh} title="Verileri Yenile">
            🔄 Yenile
          </button>
        </div>
      </div>

      {error && <p role="alert">{error}</p>}

      {loading ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div className="skeleton" style={{ height: '80px', marginBottom: '16px' }} />
          <div className="skeleton" style={{ height: '180px' }} />
        </div>
      ) : (
        stats && (
          <>
            {/* Kritik Durum & Eşik Uyarıları */}
            {stats.acikKoli > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>⚠️</span>
                  <div>
                    <strong style={{ color: '#f59e0b', fontSize: '14px' }}>
                      {stats.acikKoli} Adet Açık Koli Bulunuyor!
                    </strong>
                    <div style={{ fontSize: '12.5px', color: 'var(--text)', marginTop: '2px' }}>
                      Mal kabulde açılmış fakat henüz tamamlanmamış/raflanmamış koliler var.
                    </div>
                  </div>
                </div>
                <Link
                  to="/mal-kabul"
                  role="button"
                  style={{
                    background: '#f59e0b',
                    color: '#000',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                  }}
                >
                  Mal Kabule Git →
                </Link>
              </div>
            )}

            {/* İstatistik Kutuları */}
            <div className="dashboard-stats">
              <div className="stat-tile">
                <strong>{stats.siparisSayisi}</strong>
                <span>Sipariş</span>
              </div>
              <div className="stat-tile">
                <strong>{stats.okutulanKoli}</strong>
                <span>Okutulan Koli</span>
              </div>
              <div className="stat-tile">
                <strong>{stats.acikKoli}</strong>
                <span>Açık Koli</span>
              </div>
              <div className="stat-tile">
                <strong>{stats.okutulanUrun}</strong>
                <span>Okutulan Ürün</span>
              </div>
              <div className="stat-tile">
                <strong>{stats.tamamlananSiparis}</strong>
                <span>Tamamlanan Sipariş</span>
              </div>
              <div className="stat-tile">
                <strong>{stats.urunSayisi}</strong>
                <span>Tanımlı Ürün</span>
              </div>
              <div className="stat-tile">
                <strong>{stats.magazaSayisi}</strong>
                <span>Mağaza</span>
              </div>
              <div className="stat-tile">
                <strong>{stats.tedarikciSayisi}</strong>
                <span>Tedarikçi</span>
              </div>
            </div>

            {/* Görsel Grafikler & Hızlı Erişim Bölümü */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
                margin: '24px 0',
              }}
            >
              {/* Grafik Kartı 1: Koli Operasyon Dağılımı */}
              <div className="card" style={{ margin: 0 }}>
                <div className="card-header">
                  <h3 style={{ margin: 0, fontSize: '15px' }}>📦 Koli Süreç Dağılımı</h3>
                  <span className="badge badge-green">%{koliPercent} Tamam</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '10px 0' }}>
                  {/* SVG Halka Grafik */}
                  <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
                    <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="3.8"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="3.8"
                        strokeDasharray={`${koliPercent}, 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '14px',
                      }}
                    >
                      %{koliPercent}
                    </div>
                  </div>

                  {/* Lejant */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '100%', minHeight: '10px', borderRadius: '50%', background: 'var(--accent)' }} />
                      <span>Tamamlanan: <strong>{stats.okutulanKoli}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                      <span>İşlemde: <strong>{stats.acikKoli}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grafik Kartı 2: Sipariş Gerçekleşme Oranı */}
              <div className="card" style={{ margin: 0 }}>
                <div className="card-header">
                  <h3 style={{ margin: 0, fontSize: '15px' }}>📋 Sipariş Tamamlanma</h3>
                  <span className="badge badge-blue">
                    {completedSiparis} / {totalSiparis}
                  </span>
                </div>
                <div style={{ padding: '8px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text)' }}>Tamamlanma Oranı</span>
                    <strong>%{siparisPercent}</strong>
                  </div>
                  {/* İlerleme Çubuğu */}
                  <div
                    style={{
                      height: '10px',
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '99px',
                      overflow: 'hidden',
                      marginBottom: '14px',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${siparisPercent}%`,
                        background: 'linear-gradient(90deg, #3ecf8e, #639bff)',
                        borderRadius: '99px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Link to="/siparisler" role="button" style={{ fontSize: '12px', padding: '6px 12px' }}>
                      Sipariş Listesi →
                    </Link>
                    <Link to="/sayim" role="button" style={{ fontSize: '12px', padding: '6px 12px' }}>
                      Sayım Başlat →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Son Siparişler Tablosu */}
            <div className="card">
              <div className="card-header">
                <h3 style={{ margin: 0 }}>Son Eklenen Siparişler</h3>
                <Link to="/siparisler" style={{ fontSize: '13px', color: 'var(--accent)' }}>
                  Tümünü Gör →
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', padding: '12px 0' }}>Henüz sipariş yok.</p>
              ) : (
                <div className="table-scroll">
                  <table className="catalog-table">
                    <thead>
                      <tr>
                        <th>Sipariş No</th>
                        <th>Tedarikçi</th>
                        <th>İrsaliye No</th>
                        <th>Tarih</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order.id}>
                          <td><strong>{order.siparisNo}</strong></td>
                          <td>{order.tedarikciAdi ?? '—'}</td>
                          <td><code>{order.irsaliyeNo ?? '—'}</code></td>
                          <td>{new Date(order.createdAt).toLocaleString('tr-TR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )
      )}
    </div>
  );
}
