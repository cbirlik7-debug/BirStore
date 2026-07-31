import type { ShelfBreakdownRow } from '../api/productLocator.api';

export function ResultsTable({ rows }: { rows: ShelfBreakdownRow[] }) {
  if (rows.length === 0) {
    return <p>Bu ürün henüz hiçbir rafa yerleştirilmemiş.</p>;
  }

  const total = rows.reduce((sum, r) => sum + r.quantity, 0);

  return (
    <div className="results-table">
      <p className="total">Toplam: {total} adet</p>
      <table>
        <thead>
          <tr>
            <th>Raf</th>
            <th>Adet</th>
            <th>Yerleştirme Tarihi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.shelfId}>
              <td>{row.shelfName}</td>
              <td>{row.quantity}</td>
              <td>{new Date(row.placedAt).toLocaleString('tr-TR')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
