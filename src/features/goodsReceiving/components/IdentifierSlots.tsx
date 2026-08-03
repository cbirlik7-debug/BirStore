import { ScannerInput } from '../../../shared/scanner/ScannerInput';
import type { RequiredId, IdentifierValues } from '../../../shared/supabase/types';
import type { EntryProduct, ScanMode } from '../types';

const LABELS: Record<RequiredId, string> = {
  IMEI1: 'IMEI 1',
  IMEI2: 'IMEI 2',
  SERIAL: 'Seri No',
};

export function IdentifierSlots({
  product,
  filled,
  mode,
  onModeChange,
  targetField,
  onTargetField,
  onScan,
  onCancel,
}: {
  product: EntryProduct;
  filled: IdentifierValues;
  mode: ScanMode;
  onModeChange: (mode: ScanMode) => void;
  targetField: RequiredId | null;
  onTargetField: (field: RequiredId) => void;
  onScan: (code: string) => void;
  onCancel: () => void;
}) {
  return (
    <div className="identifier-slots">
      <div className="identifier-slots-header">
        <strong>
          {product.articleNo} — {product.name}
        </strong>
        <button type="button" onClick={onCancel}>
          Vazgeç
        </button>
      </div>

      <div className="scan-mode-toggle">
        <button
          type="button"
          className={mode === 'sirali' ? 'active' : ''}
          onClick={() => onModeChange('sirali')}
        >
          Sıralı
        </button>
        <button
          type="button"
          className={mode === 'birlesik' ? 'active' : ''}
          onClick={() => onModeChange('birlesik')}
        >
          Birleşik
        </button>
      </div>

      <div className="identifier-slot-list">
        {product.requiredIds.map((id) => (
          <button
            key={id}
            type="button"
            className={`identifier-slot ${targetField === id ? 'targeted' : ''} ${filled[id] ? 'filled' : ''}`}
            onClick={() => onTargetField(id)}
          >
            <span className="identifier-slot-label">{LABELS[id]}</span>
            <span className="identifier-slot-value">{filled[id] ?? '—'}</span>
          </button>
        ))}
      </div>

      <ScannerInput
        onScan={onScan}
        placeholder={targetField ? `${LABELS[targetField]} okutun` : 'Okutun'}
        autoFocus
      />
    </div>
  );
}
