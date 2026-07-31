import type { PendingItem } from '../types';

export function PendingList({
  items,
  onSetQuantity,
  onRemove,
}: {
  items: PendingItem[];
  onSetQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}) {
  if (items.length === 0) {
    return <p>Henüz ürün okutulmadı.</p>;
  }

  return (
    <table className="pending-list">
      <thead>
        <tr>
          <th>Artikel No</th>
          <th>Ürün</th>
          <th>Adet</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.productId}>
            <td>{item.articleNo}</td>
            <td>{item.name}</td>
            <td>
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => onSetQuantity(item.productId, Number(e.target.value))}
              />
            </td>
            <td>
              <button type="button" onClick={() => onRemove(item.productId)}>
                Kaldır
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
