import { useEffect, useState } from 'react';
import { listDuplicateIdentifiers, deleteDuplicateRecord } from '../api/reports.api';
import type { DuplicateRecord } from '../types';

export function DuplicateRecordsPanel() {
  const [items, setItems] = useState<DuplicateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      setItems(await listDuplicateIdentifiers());
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

  async function handleDelete(koliUrunId: string) {
    if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    try {
      await deleteDuplicateRecord(koliUrunId);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kayıt silinemedi');
    }
  }

  if (loading) return <p>Yükleniyor...</p>;

  const grouped = new Map<string, DuplicateRecord[]>();
  for (const item of items) {
    grouped.set(item.identifierValue, [...(grouped.get(item.identifierValue) ?? []), item]);
  }

  return (
    <div>
      {error && <p role="alert">{error}</p>}
      {grouped.size === 0 ? (
        <p>Mükerrer kayıt bulunamadı.</p>
      ) : (
        <div className="duplicate-groups">
          {Array.from(grouped.entries()).map(([value, records]) => (
            <div key={value} className="duplicate-group">
              <h3>{value}</h3>
              <ul>
                {records.map((r) => (
                  <li key={r.koliUrunId}>
                    <span>{r.koliBarkod}</span>
                    <span>{r.siparisNo ?? '—'}</span>
                    <span>{new Date(r.createdAt).toLocaleString('tr-TR')}</span>
                    <button type="button" className="btn-danger" onClick={() => handleDelete(r.koliUrunId)}>
                      Sil
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
