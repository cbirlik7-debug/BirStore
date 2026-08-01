import { useEffect, useRef } from 'react';
import { useCameraScanner } from './useCameraScanner';

interface CameraScannerModalProps {
  onScan: (value: string) => void;
  onClose: () => void;
}

export function CameraScannerModal({ onScan, onClose }: CameraScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { start, stop, error } = useCameraScanner(videoRef);

  useEffect(() => {
    start((value) => {
      onScan(value);
      onClose();
    });
    return () => stop();
  }, []);

  return (
    <div className="camera-scanner-overlay" role="dialog" aria-modal="true">
      <div className="camera-scanner-panel">
        <video ref={videoRef} className="camera-scanner-video" muted playsInline />
        {error && <p role="alert">{error}</p>}
        <button type="button" onClick={onClose}>
          Kapat
        </button>
      </div>
    </div>
  );
}
