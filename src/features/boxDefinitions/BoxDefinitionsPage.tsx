import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { listBoxDefinitions, createBoxDefinition, deleteBoxDefinition } from './api/boxDefinitions.api';
import type { BoxDefinition } from './api/boxDefinitions.api';
import { listOrders } from '../orders/api/orders.api';
import type { Order } from '../orders/types';
import { listStores } from '../definitions/api/definitions.api';
import type { Store } from '../definitions/api/definitions.api';

export function BoxDefinitionsPage() {
  const [definitions, setDefinitions] = useState<BoxDefinition[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [barkod, setBarkod] = useState('');
  const [tip, setTip] = useState('eirsaliye');
  const [siparisId, setSiparisId] = useState('');
  const [magazaKodu, setMagazaKodu] = useState('');
  const [uyari, setUyari] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const [d, o, s] = await Promise.all([listBoxDefinitions(), listOrders(), listStores()]);
      setDefinitions(d);
      setOrders(o);
      setStores(s);
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createBoxDefinition({
        barkod,
        tip,
        siparisId: siparisId || null,
        magazaKodu: magazaKodu || null,
        uyari: uyari || null,
      });
      setBarkod('');
      setTip('eirsaliye');
      setSiparisId('');
      setMagazaKodu('');
      setUyari('');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Koli tanımı eklenemedi');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(barkod: string) {
    if (!confirm('Bu koli tanımını silmek istediğinize emin misiniz?')) return;
    try {
      await deleteBoxDefinition(barkod);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Koli tanımı silinemedi');
    }
  }

  return (
    <div className="box-definitions-page">
      <h2>Koli Tanımları</h2>

      <form onSubmit={handleSubmit} className="catalog-form">
        <label>
          Barkod
          <input value={barkod} onChange={(e) => setBarkod(e.target.value)} required />
        </label>
        <label>
          Tip
          <select value={tip} onChange={(e) => setTip(e.target.value)}>
            <option value="eirsaliye">e-İrsaliye</option>
            <option value="kurye">Kurye</option>
          </select>
        </label>
        <label>
          Sipariş
          <select value={siparisId} onChange={(e) => setSiparisId(e.target.value)}>
            <option value="">—</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.siparisNo}
              </option>
            ))}
          </select>
        </label>
        <label>
          Hedef Mağaza
          <select value={magazaKodu} onChange={(e) => setMagazaKodu(e.target.value)}>
            <option value="">—</option>
            {stores.map((s) => (
              <option key={s.kod} value={s.kod}>
                {s.kod} — {s.ad}
              </option>
            ))}
          </select>
        </label>
        <label>
          Uyarı Notu
          <input value={uyari} onChange={(e) => setUyari(e.target.value)} />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Ekleniyor...' : 'Koli Tanımı Ekle'}
        </button>
      </form>

      {error && <p role="alert">{error}</p>}

      {loading ? (
        <p>Yükleniyor...</p>
      ) : (
        <table className="catalog-table">
          <thead>
            <tr>
              <th>Barkod</th>
              <th>Tip</th>
              <th>Sipariş No</th>
              <th>Hedef Mağaza</th>
              <th>Uyarı</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {definitions.map((d) => (
              <tr key={d.barkod}>
                <td>{d.barkod}</td>
                <td>
                  <span className={`badge ${d.tip === 'eirsaliye' ? 'badge-blue' : 'badge-gray'}`}>
                    {d.tip === 'eirsaliye' ? 'e-İrsaliye' : 'Kurye'}
                  </span>
                </td>
                <td>{d.siparisNo ?? '—'}</td>
                <td>{d.magazaKodu ?? '—'}</td>
                <td>{d.uyari ?? '—'}</td>
                <td>
                  <button type="button" className="btn-danger" onClick={() => handleDelete(d.barkod)}>
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
