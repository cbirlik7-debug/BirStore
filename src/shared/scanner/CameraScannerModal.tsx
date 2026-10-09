import { useEffect, useRef, useState } from 'react';
import { useCameraScanner } from './useCameraScanner';

interface CameraScannerModalProps {
  onScan: (value: string) => void;
  onClose: () => void;
  initialContinuous?: boolean;
}

export function CameraScannerModal({
  onScan,
  onClose,
  initialContinuous = false,
}: CameraScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [continuous, setContinuous] = useState(initialContinuous);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const { start, stop, error, hasTorch, isTorchOn, toggleTorch } = useCameraScanner(videoRef);

  useEffect(() => {
    start(
      (value) => {
        setLastScanned(value);
        onScan(value);
        if (!continuous) {
          onClose();
        }
      },
      { continuous, cooldownMs: 1400 },
    );
    return () => stop();
  }, [continuous, onScan, onClose, start, stop]);

  return (
    <div className="camera-scanner-overlay" role="dialog" aria-modal="true">
      <div className="camera-scanner-panel">
        <div className="camera-scanner-viewport">
          <video ref={videoRef} className="camera-scanner-video" muted playsInline />
          
          {/* Görsel hedefleme çerçevesi ve lazer çizgisi */}
          <div className="camera-scanner-reticle">
            <div className="camera-scanner-laser" />
          </div>

          {lastScanned && continuous && (
            <div className="camera-scanner-toast">
              ✓ Okundu: <strong>{lastScanned}</strong>
            </div>
          )}
        </div>

        {error && <p role="alert" className="camera-scanner-error">{error}</p>}

        <div className="camera-scanner-actions">
          {hasTorch && (
            <button
              type="button"
              className={`scanner-tool-btn ${isTorchOn ? 'active' : ''}`}
              onClick={() => toggleTorch()}
              title={isTorchOn ? 'Feneri Kapat' : 'Feneri Aç'}
            >
              {isTorchOn ? '🔦 Fener Açık' : '💡 Fener'}
            </button>
          )}

          <button
            type="button"
            className={`scanner-tool-btn ${continuous ? 'active' : ''}`}
            onClick={() => setContinuous((c) => !c)}
            title="Sürekli / Tekli okuma modu"
          >
            {continuous ? '🔄 Seri Mod Açık' : '🎯 Tekli Okuma'}
          </button>

          <button type="button" className="scanner-close-btn" onClick={onClose}>
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
