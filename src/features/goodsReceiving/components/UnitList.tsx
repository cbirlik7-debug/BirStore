import type { CommittedUnit } from '../types';

export function UnitList({
  units,
  onRemove,
}: {
  units: CommittedUnit[];
  onRemove: (id: string) => void;
}) {
  const totalCount = units.length;
  const distinctProducts = new Set(units.map((u) => u.productId ?? u.rawBarkod)).size;

  return (
    <div className="unit-list">
      <p className="unit-list-summary">
        Toplam {totalCount} adet, {distinctProducts} farklı ürün
      </p>
      {units.length === 0 ? (
        <p>Henüz ürün okutulmadı.</p>
      ) : (
        <ul>
          {units.map((unit) => (
            <li key={unit.id} className={unit.beklenmeyen ? 'unexpected' : ''}>
              <span>
                {unit.beklenmeyen
                  ? `Beklenmeyen ürün: ${unit.rawBarkod}`
                  : `${unit.articleNo} — ${unit.productName}`}
              </span>
              <span className="unit-identifiers">
                {Object.entries(unit.identifiers).map(([key, value]) => (
                  <span key={key} className="badge">
                    {key}: {value}
                  </span>
                ))}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Bu birimi silmek istediğinize emin misiniz?')) onRemove(unit.id);
                }}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
