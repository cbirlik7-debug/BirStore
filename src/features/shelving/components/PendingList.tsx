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
    return (
      <p style={{ color: 'var(--text-muted)', padding: '12px 0', margin: 0 }}>
        Henüz ürün eklenmedi. Bekleyen listesinden veya barkod tarayarak ürün ekleyin.
      </p>
    );
  }

  return (
    <div className="table-scroll">
      <table className="catalog-table pending-list" style={{ fontSize: '13px' }}>
        <thead>
          <tr>
            <th>Artikel No</th>
            <th>Ürün Adı</th>
            <th style={{ width: '140px' }}>Adet</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const hasMax = item.maxQuantity !== undefined && item.maxQuantity > 0;
            const isAtMax = hasMax && item.quantity >= (item.maxQuantity ?? 0);
            const isOverMax = hasMax && item.quantity > (item.maxQuantity ?? 0);

            return (
              <tr key={item.productId}>
                <td>
                  <code style={{ fontSize: '11.5px' }}>{item.articleNo}</code>
                </td>
                <td>{item.name}</td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <input
                      type="number"
                      min={1}
                      max={item.maxQuantity ?? undefined}
                      value={item.quantity}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (!isNaN(val)) {
                          onSetQuantity(item.productId, val);
                        }
                      }}
                      style={{
                        width: '80px',
                        borderColor: isOverMax ? 'var(--danger)' : undefined,
                        boxShadow: isOverMax ? '0 0 0 2px var(--danger-bg)' : undefined,
                      }}
                    />
                    {hasMax && (
                      <span
                        style={{
                          fontSize: '11px',
                          color: isAtMax ? 'var(--warning)' : 'var(--text-muted)',
                          fontWeight: isAtMax ? 600 : 400,
                        }}
                      >
                        Maks: {item.maxQuantity}
                        {isAtMax && ' ⚠️'}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => onRemove(item.productId)}
                    style={{
                      background: 'var(--danger-bg)',
                      border: '1px solid var(--danger-border)',
                      color: 'var(--danger)',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      minHeight: '28px',
                    }}
                  >
                    Kaldır
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
