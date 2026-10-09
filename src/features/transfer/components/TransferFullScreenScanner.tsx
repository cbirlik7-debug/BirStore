import { useEffect, useRef } from 'react';
import { useCameraScanner } from '../../../shared/scanner/useCameraScanner';
import { TransferCapturePanel } from './TransferCapturePanel';
import type { RequiredId } from '../../../shared/supabase/types';
import type { TransferCaptureState, TransferSiparis } from '../types';

export function TransferFullScreenScanner({
  transfer,
  capture,
  unitCount,
  canAccept,
  onScan,
  onTargetField,
  onAccept,
  onDiscard,
  onClose,
}: {
  transfer: TransferSiparis;
  capture: TransferCaptureState | null;
  unitCount: number;
  canAccept: boolean;
  onScan: (code: string) => void;
  onTargetField: (field: RequiredId) => void;
  onAccept: () => void;
  onDiscard: () => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { start, stop, error, hasTorch, isTorchOn, toggleTorch } = useCameraScanner(videoRef);

  useEffect(() => {
    start(onScan, { continuous: true, cooldownMs: 1200 });
    return () => stop();
  }, [onScan, start, stop]);

  return (
    <div className="fullscreen-scanner">
      <video ref={videoRef} className="fullscreen-scanner-video" muted playsInline />
      <div className="fullscreen-scanner-controls">
        {hasTorch && (
          <button
            type="button"
            className={`fullscreen-scanner-btn ${isTorchOn ? 'active' : ''}`}
            aria-label={isTorchOn ? 'Feneri Kapat' : 'Feneri Aç'}
            onClick={() => toggleTorch()}
          >
            {isTorchOn ? '🔦' : '💡'}
          </button>
        )}
        <button
          type="button"
          className="fullscreen-scanner-close"
          aria-label="Kamerayı kapat"
          onClick={() => {
            stop();
            onClose();
          }}
        >
          ✕
        </button>
      </div>
      {error && (
        <p role="alert" className="fullscreen-scanner-error">
          {error}
        </p>
      )}
      <div className="fullscreen-scanner-panel">
        <TransferCapturePanel
          transfer={transfer}
          capture={capture}
          unitCount={unitCount}
          onTargetField={onTargetField}
          onAccept={onAccept}
          onDiscard={onDiscard}
          canAccept={canAccept}
          variant="fullscreen"
        />
      </div>
    </div>
  );
}
