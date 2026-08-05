import type { RequiredId } from '../../../shared/supabase/types';
import type { ActiveBox, CaptureState, ProductProgress } from '../types';

const LABELS: Record<RequiredId, string> = {
  IMEI1: 'IMEI 1',
  IMEI2: 'IMEI 2',
  SERIAL: 'Seri No',
};

export function CaptureFieldsPanel({
  box,
  capture,
  currentProductProgress,
  orderProgress,
  onTargetField,
  onAccept,
  onDiscard,
  canAccept,
  variant = 'inline',
}: {
  box: ActiveBox;
  capture: CaptureState | null;
  currentProductProgress: ProductProgress | null;
  orderProgress: ProductProgress | null;
  onTargetField: (field: RequiredId) => void;
  onAccept: () => void;
  onDiscard: () => void;
  canAccept: boolean;
  variant?: 'inline' | 'fullscreen';
}) {
  return (
    <div className={`capture-panel capture-panel-${variant}`}>
      <div className="capture-panel-context">
        <span>{box.barkod}</span>
        {box.siparisNo && <span>Sipariş: {box.siparisNo}</span>}
      </div>

      {(orderProgress || currentProductProgress) && (
        <div className="capture-panel-progress">
          {currentProductProgress && (
            <span>
              Bu üründe: {currentProductProgress.girilen}/{currentProductProgress.beklenen}
            </span>
          )}
          {orderProgress && (
            <span>
              Sipariş toplam: {orderProgress.girilen}/{orderProgress.beklenen}
            </span>
          )}
        </div>
      )}

      {!capture ? (
        <p className="capture-panel-hint">EAN okutun.</p>
      ) : (
        <>
          <div className="capture-panel-product">
            {capture.isUnexpected ? (
              <span className="badge badge-gray">Beklenmeyen ürün: {capture.ean}</span>
            ) : (
              <>
                <div className="capture-field-row">
                  <span className="capture-field-label">EAN</span>
                  <span className="capture-field-value">{capture.ean}</span>
                </div>
                <div className="capture-field-row">
                  <span className="capture-field-label">Artikel No</span>
                  <span className="capture-field-value">{capture.product?.articleNo}</span>
                </div>
                <div className="capture-field-row">
                  <span className="capture-field-label">Ürün Adı</span>
                  <span className="capture-field-value">{capture.product?.name}</span>
                </div>
              </>
            )}
          </div>

          {capture.product && capture.product.requiredIds.length > 0 && (
            <div className="identifier-slot-list">
              {capture.product.requiredIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`identifier-slot ${capture.targetField === id ? 'targeted' : ''} ${capture.identifiers[id] ? 'filled' : ''}`}
                  onClick={() => onTargetField(id)}
                >
                  <span className="identifier-slot-label">{LABELS[id]}</span>
                  <span className="identifier-slot-value">{capture.identifiers[id] ?? '—'}</span>
                </button>
              ))}
            </div>
          )}

          <div className="capture-panel-actions">
            <button type="button" onClick={onDiscard}>
              Vazgeç
            </button>
            <button type="button" className="btn-accept" disabled={!canAccept} onClick={onAccept}>
              Kabul
            </button>
          </div>
        </>
      )}
    </div>
  );
}
