import { forwardRef } from 'react';
import { useSmartBarcodeInput } from './useSmartBarcodeInput';

interface ScannerInputProps {
  onScan: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const ScannerInput = forwardRef<HTMLInputElement, ScannerInputProps>(
  ({ onScan, placeholder, autoFocus }, ref) => {
    const { value, onChange, onKeyDown } = useSmartBarcodeInput({ onScan });

    return (
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
    );
  },
);

ScannerInput.displayName = 'ScannerInput';
