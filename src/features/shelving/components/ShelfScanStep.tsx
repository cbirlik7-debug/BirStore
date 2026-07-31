import { useState } from 'react';
import { ScannerInput } from '../../../shared/scanner/ScannerInput';
import { lookupShelfByBarcode } from '../api/shelving.api';
import type { ActiveShelf } from '../types';

export function ShelfScanStep({ onShelfSelected }: { onShelfSelected: (shelf: ActiveShelf) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleScan(barcode: string) {
    setLoading(true);
    setError(null);
    try {
      const shelf = await lookupShelfByBarcode(barcode);
      onShelfSelected(shelf);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Raf okutulamadı');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shelf-scan-step">
      <p>Önce rafın barkodunu okutun.</p>
      <ScannerInput onScan={handleScan} placeholder="Raf barkodu" autoFocus />
      {loading && <p>Aranıyor...</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
