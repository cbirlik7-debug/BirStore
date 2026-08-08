import { Fragment, useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  listTutanaklar,
  createTutanak,
  addTutanakLine,
  deleteTutanakLine,
  deleteTutanak,
  uploadTutanakFoto,
} from './api/tutanak.api';
import { listOrderOptions } from '../goodsReceiving/api/goodsReceiving.api';
import { useRealtimeRefresh } from '../../shared/realtime/useRealtimeRefresh';
import { listProducts } from '../catalog/api/catalog.api';
import type { CatalogProduct } from '../catalog/types';
import type { Tutanak, TutanakDurum } from './types';

const DURUM_LABELS: Record<TutanakDurum, string> = { eksik: 'Eksik', fazla: 'Fazla', hasarli: 'Hasarlı' };
const DURUM_BADGE: Record<TutanakDurum, string> = { eksik: 'badge-red', fazla: 'badge-orange', hasarli: 'badge-blue' };

export function TutanakPage() {
  const [searchParams] = useSearchParams();
  const presetSiparisId = searchParams.get('siparisId');

  const [tutanaklar, setTutanaklar] = useState<Tutanak[]>([]);
  const [orders, setOrders] = useState<{ id: string; siparisNo: string }[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [active, setActive] = useState<Tutanak | null>(null);
  const [siparisId, setSiparisId] = useState(presetSiparisId ?? '');
  const [productId, setProductId] = useState('');
  const [durum, setDurum] = useState<TutanakDurum>('eksik');
  const [adet, setAdet] = useState(1);
  const [aciklama, setAciklama] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [t, o, p] = await Promise.all([listTutanaklar(), listOrderOptions(), listProducts()]);
      setTutanaklar(t);
      setOrders(o);
      setProducts(p);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useRealtimeRefresh(['tutanaklar'], refresh);

  async function handleStart() {
    setError(null);
    try {
      const { id, tutanakNo } = await createTutanak(siparisId || null);
      setActive({
        id,
        tutanakNo,
        siparisId: siparisId || null,
        siparisNo: orders.find((o) => o.id === siparisId)?.siparisNo ?? null,
        createdAt: new Date().toISOString(),
        satirlar: [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tutanak oluşturulamadı');
    }
  }

  async function handleAddLine(e: FormEvent) {
    e.preventDefault();
    if (!active) return;
    setSubmitting(true);
    setError(null);
    try {
      const fotoUrl = foto ? await uploadTutanakFoto(foto) : null;
      await addTutanakLine(active.id, {
        productId: productId || null,
        durum,
        adet,
        aciklama: aciklama || null,
        fotoUrl,
      });
      const product = products.find((p) => p.id === productId);
      setActive({
        ...active,
        satirlar: [
          ...active.satirlar,
          {
            id: crypto.randomUUID(),
            productId: productId || null,
            articleNo: product?.articleNo ?? null,
            productName: product?.name ?? null,
            durum,
            adet,
            aciklama: aciklama || null,
            fotoUrl,
          },
        ],
      });
      setProductId('');
      setDurum('eksik');
      setAdet(1);
      setAciklama('');
      setFoto(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Satır eklenemedi');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveLine(lineId: string) {
    if (!active) return;
    try {
      await deleteTutanakLine(lineId);
      setActive({ ...active, satirlar: active.satirlar.filter((l) => l.id !== lineId) });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Satır silinemedi');
    }
  }

  async function handleFinish() {
    setActive(null);
    setSiparisId('');
    await refresh();
  }

  async function handleDownloadPdf(t: Tutanak) {
    setError(null);
    try {
      const { generateTutanakPdf } = await import('./pdf');
      await generateTutanakPdf(t);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PDF oluşturulamadı');
    }
  }

  async function handleDeleteTutanak(id: string) {
    if (!confirm('Bu tutanağı silmek istediğinize emin misiniz?')) return;
    try {
      await deleteTutanak(id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tutanak silinemedi');
    }
  }

  if (active) {
    return (
      <div className="tutanak-page">
        <h2>
          {active.tutanakNo}
          {active.siparisNo ? ` — Sipariş: ${active.siparisNo}` : ''}
        </h2>
        {error && <p role="alert">{error}</p>}

        <form onSubmit={handleAddLine} className="catalog-form tutanak-line-form">
          <label>
            Durum
            <select value={durum} onChange={(e) => setDurum(e.target.value as TutanakDurum)}>
              <option value="eksik">Eksik</option>
              <option value="fazla">Fazla</option>
              <option value="hasarli">Hasarlı</option>
            </select>
          </label>
          <label>
            Artikel
            <select value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">Ürün seçin</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.articleNo} — {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Adet
            <input type="number" min={1} value={adet} onChange={(e) => setAdet(Number(e.target.value))} />
          </label>
          <label>
            Açıklama
            <input value={aciklama} onChange={(e) => setAciklama(e.target.value)} />
          </label>
          <label>
            Fotoğraf (opsiyonel)
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
            />
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Ekleniyor...' : '+ Satır Ekle'}
          </button>
        </form>

        <ul className="tutanak-line-list">
          {active.satirlar.map((l) => (
            <li key={l.id}>
              <span className={`badge ${DURUM_BADGE[l.durum]}`}>{DURUM_LABELS[l.durum]}</span>
              <span>{l.articleNo ? `${l.articleNo} — ${l.productName}` : 'Beklenmeyen ürün'}</span>
              <span>Adet: {l.adet}</span>
              {l.aciklama && <span>{l.aciklama}</span>}
              {l.fotoUrl && <img src={l.fotoUrl} alt="Kanıt" className="tutanak-line-photo" />}
              <button type="button" className="btn-danger" onClick={() => handleRemoveLine(l.id)}>
                Sil
              </button>
            </li>
          ))}
        </ul>

        <button type="button" onClick={handleFinish}>
          Bitir — Listeye Dön
        </button>
      </div>
    );
  }

  return (
    <div className="tutanak-page">
      <h2>Tutanaklar</h2>

      <div className="tutanak-start">
        <label>
          Sipariş (opsiyonel)
          <select value={siparisId} onChange={(e) => setSiparisId(e.target.value)}>
            <option value="">—</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.siparisNo}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={handleStart}>
          Yeni Tutanak Başlat
        </button>
      </div>

      {error && <p role="alert">{error}</p>}

      {loading ? (
        <p>Yükleniyor...</p>
      ) : tutanaklar.length === 0 ? (
        <p>Henüz tutanak yok.</p>
      ) : (
        <div className="table-scroll">
        <table className="catalog-table">
          <thead>
            <tr>
              <th>Tutanak No</th>
              <th>Sipariş</th>
              <th>Tarih</th>
              <th>Satır</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {tutanaklar.map((t) => (
              <Fragment key={t.id}>
                <tr>
                  <td>{t.tutanakNo}</td>
                  <td>{t.siparisNo ?? '—'}</td>
                  <td>{new Date(t.createdAt).toLocaleString('tr-TR')}</td>
                  <td>
                    <button type="button" onClick={() => setExpanded(expanded === t.id ? null : t.id)}>
                      {t.satirlar.length} satır {expanded === t.id ? '▲' : '▼'}
                    </button>
                  </td>
                  <td>
                    <button type="button" onClick={() => handleDownloadPdf(t)}>
                      PDF İndir
                    </button>
                    <button type="button" className="btn-danger" onClick={() => handleDeleteTutanak(t.id)}>
                      Sil
                    </button>
                  </td>
                </tr>
                {expanded === t.id && (
                  <tr>
                    <td colSpan={5}>
                      <ul className="tutanak-line-list">
                        {t.satirlar.map((l) => (
                          <li key={l.id}>
                            <span className={`badge ${DURUM_BADGE[l.durum]}`}>{DURUM_LABELS[l.durum]}</span>
                            <span>{l.articleNo ? `${l.articleNo} — ${l.productName}` : 'Beklenmeyen ürün'}</span>
                            <span>Adet: {l.adet}</span>
                            {l.aciklama && <span>{l.aciklama}</span>}
                            {l.fotoUrl && (
                              <a href={l.fotoUrl} target="_blank" rel="noreferrer">
                                <img src={l.fotoUrl} alt="Kanıt" className="tutanak-line-photo" />
                              </a>
                            )}
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
        </div>
      )}
    </div>
  );
}
