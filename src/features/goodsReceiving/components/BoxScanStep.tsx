import { useEffect, useState } from 'react';
import { ScannerInput } from '../../../shared/scanner/ScannerInput';
import {
  findBoxByBarcode,
  findBoxDefinition,
  createBox,
  reopenBox,
  listOrderOptions,
} from '../api/goodsReceiving.api';
import type { ActiveBox } from '../types';

export function BoxScanStep({ onBoxReady }: { onBoxReady: (box: ActiveBox) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingBarkod, setPendingBarkod] = useState<string | null>(null);
  const [orders, setOrders] = useState<{ id: string; siparisNo: string }[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');

  useEffect(() => {
    if (pendingBarkod) {
      listOrderOptions()
        .then(setOrders)
        .catch((e) => setError(e instanceof Error ? e.message : 'Siparişler yüklenemedi'));
    }
  }, [pendingBarkod]);

  async function handleScan(barkod: string) {
    setLoading(true);
    setError(null);
    try {
      const existing = await findBoxByBarcode(barkod);
      if (existing) {
        if (existing.durum === 'acik') {
          onBoxReady(existing);
          return;
        }
        const confirmReopen = confirm(
          `"${barkod}" kolisi kapatılmış. Yeniden açılsın mı?`,
        );
        if (confirmReopen) {
          await reopenBox(existing.id, existing.reopenLog);
          onBoxReady({ ...existing, durum: 'acik' });
        }
        return;
      }

      const definition = await findBoxDefinition(barkod);
      if (definition) {
        const box = await createBox({ barkod, ...definition });
        onBoxReady(box);
        return;
      }

      setPendingBarkod(barkod);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Koli okutulamadı');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdHocCreate() {
    if (!pendingBarkod || !selectedOrderId) return;
    setLoading(true);
    setError(null);
    try {
      const box = await createBox({
        barkod: pendingBarkod,
        tip: 'eirsaliye',
        siparisId: selectedOrderId,
        magazaKodu: null,
        uyari: null,
      });
      onBoxReady(box);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Koli oluşturulamadı');
    } finally {
      setLoading(false);
    }
  }

  if (pendingBarkod) {
    return (
      <div className="box-scan-step">
        <p>
          "{pendingBarkod}" tanımlı bir koli değil. Bu koli hangi siparişe ait?
        </p>
        <select value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)}>
          <option value="">Sipariş seçin</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.siparisNo}
            </option>
          ))}
        </select>
        <div className="box-scan-actions">
          <button type="button" disabled={!selectedOrderId || loading} onClick={handleAdHocCreate}>
            {loading ? 'Oluşturuluyor...' : 'Koliyi Bu Siparişe Ekle'}
          </button>
          <button type="button" onClick={() => setPendingBarkod(null)}>
            Vazgeç
          </button>
        </div>
        {error && <p role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <div className="box-scan-step">
      <p>Koli barkodunu okutun.</p>
      <ScannerInput onScan={handleScan} placeholder="Koli barkodu" autoFocus />
      {loading && <p>Aranıyor...</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
