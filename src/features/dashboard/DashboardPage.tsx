import { useCallback, useEffect, useState } from 'react';
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

  useRealtimeRefresh(['koliler', 'koli_urunler', 'siparisler', 'tutanaklar'], refresh);

  return (
    <div className="dashboard-page">
      <h2>Özet</h2>
      {error && <p role="alert">{error}</p>}
      {loading ? (
        <p>Yükleniyor...</p>
      ) : (
        stats && (
          <>
            <div className="dashboard-stats">
              <div className="stat-tile">
                <strong>{stats.siparisSayisi}</strong>
                <span>Sipariş</span>
              </div>
              <div className="stat-tile">
                <strong>{stats.koliTanimSayisi}</strong>
                <span>Koli Tanımı</span>
              </div>
              <div className="stat-tile">
                <strong>{stats.urunSayisi}</strong>
                <span>Ürün</span>
              </div>
              <div className="stat-tile">
                <strong>{stats.magazaSayisi}</strong>
                <span>Mağaza</span>
              </div>
              <div className="stat-tile">
                <strong>{stats.tedarikciSayisi}</strong>
                <span>Tedarikçi</span>
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
            </div>

            <h3>Son Eklenen Siparişler</h3>
            {recentOrders.length === 0 ? (
              <p>Henüz sipariş yok.</p>
            ) : (
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
                      <td>{order.siparisNo}</td>
                      <td>{order.tedarikciAdi ?? '—'}</td>
                      <td>{order.irsaliyeNo ?? '—'}</td>
                      <td>{new Date(order.createdAt).toLocaleString('tr-TR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )
      )}
    </div>
  );
}
