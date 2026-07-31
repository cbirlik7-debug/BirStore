import { useState } from 'react';
import { ScannerInput } from '../../../shared/scanner/ScannerInput';
import { lookupProductByEan } from '../api/shelving.api';

export function ProductScanStep({
  onProductScanned,
}: {
  onProductScanned: (product: { productId: string; ean: string; articleNo: string; name: string }) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  async function handleScan(ean: string) {
    setError(null);
    try {
      const product = await lookupProductByEan(ean);
      onProductScanned({ ean, ...product });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ürün okutulamadı');
    }
  }

  return (
    <div className="product-scan-step">
      <p>Ürünleri okutun (karışık sırayla, aynı ürün tekrar okutulursa miktar artar).</p>
      <ScannerInput onScan={handleScan} placeholder="Ürün EAN" autoFocus />
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
