import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  listStores,
  createStore,
  deleteStore,
  listSuppliers,
  createSupplier,
  deleteSupplier,
} from './api/definitions.api';
import type { Store, Supplier } from './api/definitions.api';

function StoresSection() {
  const [stores, setStores] = useState<Store[]>([]);
  const [kod, setKod] = useState('');
  const [ad, setAd] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setStores(await listStores());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Mağazalar yüklenemedi');
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await createStore({ kod, ad });
      setKod('');
      setAd('');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Mağaza eklenemedi');
    }
  }

  async function handleDelete(kod: string) {
    if (!confirm('Bu mağazayı silmek istediğinize emin misiniz?')) return;
    try {
      await deleteStore(kod);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Mağaza silinemedi');
    }
  }

  return (
    <section>
      <h3>Mağazalar</h3>
      <form onSubmit={handleSubmit} className="definitions-form">
        <input placeholder="Kod" value={kod} onChange={(e) => setKod(e.target.value)} required />
        <input placeholder="Ad" value={ad} onChange={(e) => setAd(e.target.value)} required />
        <button type="submit">Ekle</button>
      </form>
      {error && <p role="alert">{error}</p>}
      <ul className="definitions-list">
        {stores.map((s) => (
          <li key={s.kod}>
            <span>
              {s.kod} — {s.ad}
            </span>
            <button type="button" onClick={() => handleDelete(s.kod)}>
              Sil
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SuppliersSection() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ad, setAd] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setSuppliers(await listSuppliers());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tedarikçiler yüklenemedi');
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await createSupplier(ad);
      setAd('');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tedarikçi eklenemedi');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu tedarikçiyi silmek istediğinize emin misiniz?')) return;
    try {
      await deleteSupplier(id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tedarikçi silinemedi');
    }
  }

  return (
    <section>
      <h3>Tedarikçiler</h3>
      <form onSubmit={handleSubmit} className="definitions-form">
        <input placeholder="Ad" value={ad} onChange={(e) => setAd(e.target.value)} required />
        <button type="submit">Ekle</button>
      </form>
      {error && <p role="alert">{error}</p>}
      <ul className="definitions-list">
        {suppliers.map((s) => (
          <li key={s.id}>
            <span>{s.ad}</span>
            <button type="button" onClick={() => handleDelete(s.id)}>
              Sil
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DefinitionsPage() {
  return (
    <div className="definitions-page">
      <h2>Mağaza & Tedarikçi</h2>
      <StoresSection />
      <SuppliersSection />
    </div>
  );
}
