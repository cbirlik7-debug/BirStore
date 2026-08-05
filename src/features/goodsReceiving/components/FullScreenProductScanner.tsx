import { useEffect, useRef } from 'react';
import { useCameraScanner } from '../../../shared/scanner/useCameraScanner';
import { CaptureFieldsPanel } from './CaptureFieldsPanel';
import type { RequiredId } from '../../../shared/supabase/types';
import type { ActiveBox, CaptureState, ProductProgress } from '../types';

export function FullScreenProductScanner({
  box,
  capture,
  currentProductProgress,
  orderProgress,
  canAccept,
  onScan,
  onTargetField,
  onAccept,
  onDiscard,
  onClose,
}: {
  box: ActiveBox;
  capture: CaptureState | null;
  currentProductProgress: ProductProgress | null;
  orderProgress: ProductProgress | null;
  canAccept: boolean;
  onScan: (code: string) => void;
  onTargetField: (field: RequiredId) => void;
  onAccept: () => void;
  onDiscard: () => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { start, stop, error } = useCameraScanner(videoRef);

  useEffect(() => {
    start(onScan, { continuous: true });
    return () => stop();
  }, []);

  return (
    <div className="fullscreen-scanner">
      <video ref={videoRef} className="fullscreen-scanner-video" muted playsInline />
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
      {error && (
        <p role="alert" className="fullscreen-scanner-error">
          {error}
        </p>
      )}
      <div className="fullscreen-scanner-panel">
        <CaptureFieldsPanel
          box={box}
          capture={capture}
          currentProductProgress={currentProductProgress}
          orderProgress={orderProgress}
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
