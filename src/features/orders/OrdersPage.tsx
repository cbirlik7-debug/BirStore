import { Fragment, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { listOrders, createOrder, deleteOrder } from './api/orders.api';
import type { Order } from './types';
import { listSuppliers } from '../definitions/api/definitions.api';
import type { Supplier } from '../definitions/api/definitions.api';
import { listProducts } from '../catalog/api/catalog.api';
import type { CatalogProduct } from '../catalog/types';

interface DraftItem {
  productId: string;
  beklenen: number;
}

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [siparisNo, setSiparisNo] = useState('');
  const [tedarikciId, setTedarikciId] = useState('');
  const [irsaliyeNo, setIrsaliyeNo] = useState('');
  const [items, setItems] = useState<DraftItem[]>([{ productId: '', beklenen: 1 }]);
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const [o, s, p] = await Promise.all([listOrders(), listSuppliers(), listProducts()]);
      setOrders(o);
      setSuppliers(s);
      setProducts(p);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function updateItem(index: number, patch: Partial<DraftItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function addItemRow() {
    setItems((prev) => [...prev, { productId: '', beklenen: 1 }]);
  }

  function removeItemRow(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const validItems = items.filter((it) => it.productId);
      await createOrder({
        siparisNo,
        tedarikciId: tedarikciId || null,
        irsaliyeNo: irsaliyeNo || null,
        items: validItems,
      });
      setSiparisNo('');
      setTedarikciId('');
      setIrsaliyeNo('');
      setItems([{ productId: '', beklenen: 1 }]);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sipariş oluşturulamadı');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu siparişi silmek istediğinize emin misiniz?')) return;
    try {
      await deleteOrder(id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sipariş silinemedi');
    }
  }

  return (
    <div className="orders-page">
      <h2>Siparişler</h2>

      <form onSubmit={handleSubmit} className="catalog-form orders-form">
        <label>
          Sipariş No
          <input value={siparisNo} onChange={(e) => setSiparisNo(e.target.value)} required />
        </label>
        <label>
          Tedarikçi
          <select value={tedarikciId} onChange={(e) => setTedarikciId(e.target.value)}>
            <option value="">—</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.ad}
              </option>
            ))}
          </select>
        </label>
        <label>
          İrsaliye No
          <input value={irsaliyeNo} onChange={(e) => setIrsaliyeNo(e.target.value)} />
        </label>

        <fieldset className="order-items-fieldset">
          <legend>Kalemler</legend>
          {items.map((item, index) => (
            <div key={index} className="order-item-row">
              <select
                value={item.productId}
                onChange={(e) => updateItem(index, { productId: e.target.value })}
              >
                <option value="">Ürün seçin</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.articleNo} — {p.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={item.beklenen}
                onChange={(e) => updateItem(index, { beklenen: Number(e.target.value) })}
              />
              <button type="button" onClick={() => removeItemRow(index)}>
                Kaldır
              </button>
            </div>
          ))}
          <button type="button" onClick={addItemRow}>
            + Satır Ekle
          </button>
        </fieldset>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Oluşturuluyor...' : 'Sipariş Oluştur'}
        </button>
      </form>

      {error && <p role="alert">{error}</p>}

      {loading ? (
        <p>Yükleniyor...</p>
      ) : (
        <table className="catalog-table">
          <thead>
            <tr>
              <th>Sipariş No</th>
              <th>Tedarikçi</th>
              <th>İrsaliye No</th>
              <th>Kalem</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <Fragment key={order.id}>
                <tr>
                  <td>{order.siparisNo}</td>
                  <td>{order.tedarikciAdi ?? '—'}</td>
                  <td>{order.irsaliyeNo ?? '—'}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                    >
                      {order.items.length} kalem {expanded === order.id ? '▲' : '▼'}
                    </button>
                  </td>
                  <td>
                    <button type="button" onClick={() => handleDelete(order.id)}>
                      Sil
                    </button>
                  </td>
                </tr>
                {expanded === order.id && (
                  <tr>
                    <td colSpan={5}>
                      <ul className="order-items-detail">
                        {order.items.map((item) => (
                          <li key={item.productId}>
                            {item.articleNo} — {item.productName}: beklenen {item.beklenen}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
