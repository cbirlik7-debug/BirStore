import type { OrderCoverage } from '../api/productLocator.api';

export function OrderCoverageList({ items }: { items: OrderCoverage[] }) {
  if (items.length === 0) return null;

  return (
    <div className="order-coverage-list">
      <h4>Bu Ürünü İçeren Siparişler</h4>
      <ul>
        {items.map((o) => {
          const percent = o.beklenen === 0 ? 0 : Math.round((o.girilen / o.beklenen) * 100);
          return (
            <li key={o.siparisId}>
              <span>{o.siparisNo}</span>
              <span>{o.tedarikciAdi ?? '—'}</span>
              <span>
                {o.girilen}/{o.beklenen}
              </span>
              {o.kayitNo ? (
                <span className="badge badge-green">✓ {o.kayitNo}</span>
              ) : (
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
