import { lazy, Suspense, useState } from 'react';
import { BoxScanStep } from './components/BoxScanStep';
import { ActiveBoxBanner } from './components/ActiveBoxBanner';
import { CaptureFieldsPanel } from './components/CaptureFieldsPanel';
import { UnitList } from './components/UnitList';
import { ClosedBoxList } from './components/ClosedBoxList';
import { ScannerInput } from '../../shared/scanner/ScannerInput';
import { useProductCapture } from './hooks/useProductCapture';
import { closeBox, reopenBox } from './api/goodsReceiving.api';
import type { ActiveBox } from './types';

const FullScreenProductScanner = lazy(() =>
  import('./components/FullScreenProductScanner').then((m) => ({
    default: m.FullScreenProductScanner,
  })),
);

function ActiveBoxWorkspace({
  box,
  onClosed,
  onChangeBox,
}: {
  box: ActiveBox;
  onClosed: (box: ActiveBox) => void;
  onChangeBox: () => void;
}) {
  const capture = useProductCapture(box);
  const [closing, setClosing] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(true);

  async function handleClose() {
    setClosing(true);
    try {
      await closeBox(box.id);
      onClosed({ ...box, durum: 'kapali' });
    } finally {
      setClosing(false);
    }
  }

  if (cameraOpen) {
    return (
      <Suspense fallback={<div className="fullscreen-scanner-loading">Kamera açılıyor...</div>}>
        <FullScreenProductScanner
          box={box}
          capture={capture.capture}
          currentProductProgress={capture.currentProductProgress}
          orderProgress={capture.orderProgress}
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
    <div className="active-box-workspace">
      <ActiveBoxBanner box={box} onClose={handleClose} onChangeBox={onChangeBox} closing={closing} />

      {capture.error && <p role="alert">{capture.error}</p>}

      <ScannerInput onScan={capture.handleScan} placeholder="EAN / IMEI / Seri okutun" />
      <button type="button" onClick={() => setCameraOpen(true)}>
        Tam Ekran Kamera
      </button>

      <CaptureFieldsPanel
        box={box}
        capture={capture.capture}
        currentProductProgress={capture.currentProductProgress}
        orderProgress={capture.orderProgress}
        onTargetField={capture.setTargetField}
        onAccept={capture.handleAccept}
        onDiscard={capture.handleDiscard}
        canAccept={capture.canAccept}
        variant="inline"
      />

      <UnitList units={capture.units} onRemove={capture.removeUnit} />
    </div>
  );
}

export function GoodsReceivingPage() {
  const [activeBox, setActiveBox] = useState<ActiveBox | null>(null);
  const [closedBoxes, setClosedBoxes] = useState<ActiveBox[]>([]);
  const [showClosedList, setShowClosedList] = useState(false);

  function handleClosed(box: ActiveBox) {
    setClosedBoxes((prev) => [box, ...prev]);
    setActiveBox(null);
  }

  async function handleReopen(box: ActiveBox) {
    await reopenBox(box.id, box.reopenLog);
    setClosedBoxes((prev) => prev.filter((b) => b.id !== box.id));
    setActiveBox({ ...box, durum: 'acik' });
    setShowClosedList(false);
  }

  return (
    <div className="goods-receiving-page">
      <div className="goods-receiving-header">
        <h2>Mal Kabul</h2>
        <button type="button" onClick={() => setShowClosedList((s) => !s)}>
          {showClosedList ? 'Koli Taramaya Dön' : `Kapatılan Koliler (${closedBoxes.length})`}
        </button>
      </div>

      {showClosedList ? (
        <ClosedBoxList boxes={closedBoxes} onReopen={handleReopen} />
      ) : activeBox ? (
        <ActiveBoxWorkspace
          box={activeBox}
          onClosed={handleClosed}
          onChangeBox={() => setActiveBox(null)}
        />
      ) : (
        <BoxScanStep onBoxReady={setActiveBox} />
      )}
    </div>
  );
}
