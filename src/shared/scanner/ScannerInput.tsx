import { forwardRef, lazy, Suspense, useState } from 'react';
import { useSmartBarcodeInput } from './useSmartBarcodeInput';

const CameraScannerModal = lazy(() =>
  import('./CameraScannerModal').then((m) => ({ default: m.CameraScannerModal })),
);

interface ScannerInputProps {
  onScan: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const ScannerInput = forwardRef<HTMLInputElement, ScannerInputProps>(
  ({ onScan, placeholder, autoFocus }, ref) => {
    const { value, onChange, onKeyDown } = useSmartBarcodeInput({ onScan });
    const [cameraOpen, setCameraOpen] = useState(false);

    return (
      <div className="scanner-input">
        <input
          ref={ref}
          type="text"
          inputMode="none"
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder ?? 'Barkod okutun...'}
          autoFocus={autoFocus}
        />
        <button
          type="button"
          className="camera-trigger"
          onClick={() => setCameraOpen(true)}
          aria-label="Kamerayla tara"
          title="Kamerayla tara"
        >
          📷
        </button>
        {cameraOpen && (
          <Suspense fallback={null}>
            <CameraScannerModal onScan={onScan} onClose={() => setCameraOpen(false)} />
          </Suspense>
        )}
      </div>
    );
  },
);

ScannerInput.displayName = 'ScannerInput';
