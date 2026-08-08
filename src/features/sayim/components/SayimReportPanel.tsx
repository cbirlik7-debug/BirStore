import { useEffect, useState } from 'react';
import { getSayimReport } from '../api/sayim.api';
import type { Sayim, ShelfDiscrepancy } from '../types';

export function SayimReportPanel({ sayim }: { sayim: Sayim }) {
  const [rows, setRows] = useState<ShelfDiscrepancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSayimReport(sayim.id)
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Rapor yüklenemedi'))
      .finally(() => setLoading(false));
  }, [sayim.id]);

  if (loading) return <p>Yükleniyor...</p>;

  return (
    <div>
      {error && <p role="alert">{error}</p>}
      {rows.length === 0 ? (
        <p>Bu sayımda henüz sayılan raf yok.</p>
      ) : (
        <table className="catalog-table">
          <thead>
            <tr>
              <th>Raf</th>
              <th>Artikel</th>
              <th>Ürün</th>
              <th>Beklenen</th>
              <th>Sayılan</th>
              <th>Fark</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.shelfId}:${r.productId}`} className={r.fark !== 0 ? 'sayim-row-mismatch' : ''}>
                <td>{r.shelfLabel}</td>
                <td>{r.articleNo}</td>
                <td>{r.productName}</td>
                <td>{r.beklenen}</td>
                <td>{r.sayilan}</td>
                <td>{r.fark > 0 ? `+${r.fark}` : r.fark}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
