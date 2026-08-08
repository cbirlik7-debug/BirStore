import { useEffect, useState } from 'react';
import { listSupplierPerformance } from '../api/reports.api';
import type { SupplierPerformance } from '../types';

function riskClass(oran: number): string {
  if (oran >= 0.5) return 'badge-red';
  if (oran >= 0.2) return 'badge-orange';
  return 'badge-green';
}

export function SupplierPerformancePanel() {
  const [items, setItems] = useState<SupplierPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listSupplierPerformance()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : 'Veriler yüklenemedi'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Yükleniyor...</p>;

  return (
    <div>
      {error && <p role="alert">{error}</p>}
      {items.length === 0 ? (
        <p>Henüz veri yok.</p>
      ) : (
        <table className="catalog-table">
          <thead>
            <tr>
              <th>Tedarikçi</th>
              <th>Sipariş</th>
              <th>Tamamlanan</th>
              <th>Tutanak</th>
              <th>Sorun Oranı</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.tedarikciId}>
                <td>{s.tedarikciAdi}</td>
                <td>{s.siparisSayisi}</td>
                <td>{s.tamamlananSayisi}</td>
                <td>{s.tutanakSayisi}</td>
                <td>
                  <span className={`badge ${riskClass(s.sorunOrani)}`}>{Math.round(s.sorunOrani * 100)}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
