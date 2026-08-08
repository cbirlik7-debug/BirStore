import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { listDepoKodlari, createTransfer, listTransferOptions } from '../api/transfer.api';
import type { DepoKodu, TransferSiparis, TransferTip } from '../types';

export function TransferScanStep({ onReady }: { onReady: (t: TransferSiparis) => void }) {
  const [depoKodlari, setDepoKodlari] = useState<DepoKodu[]>([]);
  const [existing, setExisting] = useState<TransferSiparis[]>([]);
  const [tip, setTip] = useState<TransferTip>('transfer');
  const [kaynak, setKaynak] = useState('');
  const [hedef, setHedef] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([listDepoKodlari(), listTransferOptions()])
      .then(([d, t]) => {
        setDepoKodlari(d);
        setExisting(t);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Veriler yüklenemedi'));
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!kaynak || !hedef) return;
    setSubmitting(true);
    setError(null);
    try {
      const t = await createTransfer({ tip, kaynakDepoKodu: kaynak, hedefDepoKodu: hedef, aciklama: aciklama || null });
      onReady(t);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transfer oluşturulamadı');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="transfer-scan-step">
      <h2>Transfer / İade</h2>
      {error && <p role="alert">{error}</p>}

      <form onSubmit={handleCreate} className="catalog-form">
        <label>
          Tip
          <select value={tip} onChange={(e) => setTip(e.target.value as TransferTip)}>
            <option value="transfer">Transfer</option>
            <option value="iade">İade</option>
          </select>
        </label>
        <label>
          Kaynak Depo
          <select value={kaynak} onChange={(e) => setKaynak(e.target.value)} required>
            <option value="">Seçin</option>
            {depoKodlari.map((d) => (
              <option key={d.kod} value={d.kod}>
                {d.kod} — {d.ad}
              </option>
            ))}
          </select>
        </label>
        <label>
          Hedef Depo
          <select value={hedef} onChange={(e) => setHedef(e.target.value)} required>
            <option value="">Seçin</option>
            {depoKodlari.map((d) => (
              <option key={d.kod} value={d.kod}>
                {d.kod} — {d.ad}
              </option>
            ))}
          </select>
        </label>
        <label>
          Açıklama (opsiyonel)
          <input value={aciklama} onChange={(e) => setAciklama(e.target.value)} />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Oluşturuluyor...' : 'Yeni Transfer Başlat'}
        </button>
      </form>

      {existing.length > 0 && (
        <div className="transfer-existing-list">
          <h3>Devam Eden Transferler</h3>
          <ul>
            {existing.map((t) => (
              <li key={t.id}>
                <button type="button" onClick={() => onReady(t)}>
                  {t.transferNo} · {t.kaynakDepoKodu} → {t.hedefDepoKodu} · {t.tip === 'iade' ? 'İade' : 'Transfer'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
