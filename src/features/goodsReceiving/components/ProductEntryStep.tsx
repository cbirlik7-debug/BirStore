import { ScannerInput } from '../../../shared/scanner/ScannerInput';

export function ProductEntryStep({ onScan }: { onScan: (code: string) => void }) {
  return (
    <div className="product-entry-step">
      <p>Ürün barkodunu (EAN) okutun.</p>
      <ScannerInput onScan={onScan} placeholder="Ürün EAN" autoFocus />
    </div>
  );
}
