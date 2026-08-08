import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listOrdersWithProgress, getOrderItemProgress } from './api/orderTracking.api';
import { useRealtimeRefresh } from '../../shared/realtime/useRealtimeRefresh';
import type { OrderProgress, OrderItemProgress } from './types';

export function OrderTrackingPage() {
  const [orders, setOrders] = useState<OrderProgress[]>([]);
  const [selected, setSelected] = useState<OrderProgress | null>(null);
  const [items, setItems] = useState<OrderItemProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    listOrdersWithProgress()
      .then(setOrders)
      .catch((e) => setError(e instanceof Error ? e.message : 'Siparişler yüklenemedi'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useRealtimeRefresh(['koliler', 'koli_urunler', 'siparisler'], refresh);

  async function openOrder(order: OrderProgress) {
    setSelected(order);
    setError(null);
    try {
      setItems(await getOrderItemProgress(order.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sipariş detayı yüklenemedi');
    }
  }

  if (selected) {
    return (
      <div className="order-tracking-page">
        <button type="button" onClick={() => setSelected(null)}>
          ← Sipariş Listesi
        </button>
        <h2>
          {selected.siparisNo} {selected.tedarikciAdi ? `— ${selected.tedarikciAdi}` : ''}
        </h2>
        <Link to={`/tutanaklar?siparisId=${selected.id}`} className="btn-accept" role="button">
          Tutanak Hazırla
        </Link>
        {error && <p role="alert">{error}</p>}
        <ul className="order-item-progress-list">
          {items.map((item) => (
            <li
              key={item.productId}
              className={item.girilen >= item.beklenen ? 'complete' : 'incomplete'}
            >
              <span>
                {item.articleNo} — {item.productName}
              </span>
              <span>
                {item.girilen}/{item.beklenen}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="order-tracking-page">
      <h2>Sipariş Kontrol</h2>
      {error && <p role="alert">{error}</p>}
      {loading ? (
        <p>Yükleniyor...</p>
      ) : orders.length === 0 ? (
        <p>Henüz sipariş yok.</p>
      ) : (
        <div className="order-progress-cards">
          {orders.map((order) => {
            const percent =
              order.beklenenToplam === 0
                ? 0
                : Math.round((order.girilenToplam / order.beklenenToplam) * 100);
            return (
              <button
                key={order.id}
                type="button"
                className="order-progress-card"
                onClick={() => openOrder(order)}
              >
                <div className="order-progress-card-header">
                  <strong>{order.siparisNo}</strong>
                  <span>{order.tedarikciAdi ?? '—'}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
                </div>
                <span className="progress-label">
                  {order.girilenToplam}/{order.beklenenToplam}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
