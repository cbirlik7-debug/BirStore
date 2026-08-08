import { lazy, Suspense, useState } from 'react';
import { TransferScanStep } from './components/TransferScanStep';
import { TransferCapturePanel } from './components/TransferCapturePanel';
import { ScannerInput } from '../../shared/scanner/ScannerInput';
import { useTransferCapture } from './hooks/useTransferCapture';
import type { TransferSiparis } from './types';

const TransferFullScreenScanner = lazy(() =>
  import('./components/TransferFullScreenScanner').then((m) => ({
    default: m.TransferFullScreenScanner,
  })),
);

function TransferWorkspace({
  transfer,
  onChangeTransfer,
}: {
  transfer: TransferSiparis;
  onChangeTransfer: () => void;
}) {
  const capture = useTransferCapture(transfer);
  const [cameraOpen, setCameraOpen] = useState(true);

  if (cameraOpen) {
    return (
      <Suspense fallback={<div className="fullscreen-scanner-loading">Kamera açılıyor...</div>}>
        <TransferFullScreenScanner
          transfer={transfer}
          capture={capture.capture}
          unitCount={capture.units.length}
          canAccept={capture.canAccept}
          onScan={capture.handleScan}
          onTargetField={capture.setTargetField}
          onAccept={capture.handleAccept}
          onDiscard={capture.handleDiscard}
          onClose={() => setCameraOpen(false)}
        />
      </Suspense>
    );
  }

  return (
    <div className="transfer-workspace">
      <div className="active-box-banner">
        <div className="active-box-info">
          <strong>{transfer.transferNo}</strong>
          <span>
            {transfer.kaynakDepoKodu} → {transfer.hedefDepoKodu} · {transfer.tip === 'iade' ? 'İade' : 'Transfer'}
          </span>
        </div>
        <div className="active-box-actions">
          <button type="button" onClick={onChangeTransfer}>
            Değiştir
          </button>
        </div>
      </div>

      {capture.error && <p role="alert">{capture.error}</p>}

      <ScannerInput onScan={capture.handleScan} placeholder="EAN / IMEI / Seri okutun" />
      <button type="button" onClick={() => setCameraOpen(true)}>
        Tam Ekran Kamera
      </button>

      <TransferCapturePanel
        transfer={transfer}
        capture={capture.capture}
        unitCount={capture.units.length}
        onTargetField={capture.setTargetField}
        onAccept={capture.handleAccept}
        onDiscard={capture.handleDiscard}
        canAccept={capture.canAccept}
        variant="inline"
      />

      <ul className="unit-list">
        {capture.units.map((u) => (
          <li key={u.id}>
            <span>{u.articleNo ? `${u.articleNo} — ${u.productName}` : (u.rawBarkod ?? 'Beklenmeyen ürün')}</span>
            <button type="button" className="btn-danger" onClick={() => capture.removeUnit(u.id)}>
              Sil
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TransferPage() {
  const [transfer, setTransfer] = useState<TransferSiparis | null>(null);

  return (
    <div className="transfer-page">
      {transfer ? (
        <TransferWorkspace transfer={transfer} onChangeTransfer={() => setTransfer(null)} />
      ) : (
        <TransferScanStep onReady={setTransfer} />
      )}
    </div>
  );
}
