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
