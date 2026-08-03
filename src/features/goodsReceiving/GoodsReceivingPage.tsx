import { useState } from 'react';
import { BoxScanStep } from './components/BoxScanStep';
import { ActiveBoxBanner } from './components/ActiveBoxBanner';
import { ProductEntryStep } from './components/ProductEntryStep';
import { IdentifierSlots } from './components/IdentifierSlots';
import { UnitList } from './components/UnitList';
import { ClosedBoxList } from './components/ClosedBoxList';
import { useStickyProductEntry } from './hooks/useStickyProductEntry';
import { closeBox, reopenBox } from './api/goodsReceiving.api';
import type { ActiveBox } from './types';

function ActiveBoxWorkspace({
  box,
  onClosed,
  onChangeBox,
}: {
  box: ActiveBox;
  onClosed: (box: ActiveBox) => void;
  onChangeBox: () => void;
}) {
  const entry = useStickyProductEntry(box.id);
  const [closing, setClosing] = useState(false);

  async function handleClose() {
    setClosing(true);
    try {
      await closeBox(box.id);
      onClosed({ ...box, durum: 'kapali' });
    } finally {
      setClosing(false);
    }
  }

  return (
    <div className="active-box-workspace">
      <ActiveBoxBanner box={box} onClose={handleClose} onChangeBox={onChangeBox} closing={closing} />

      {entry.error && <p role="alert">{entry.error}</p>}

      {!entry.activeProduct ? (
        <ProductEntryStep onScan={entry.handleScan} />
      ) : (
        <IdentifierSlots
          product={entry.activeProduct}
          filled={entry.filled}
          mode={entry.mode}
          onModeChange={entry.setMode}
          targetField={entry.targetField}
          onTargetField={entry.setTargetField}
          onScan={entry.handleScan}
          onCancel={entry.cancelActiveProduct}
        />
      )}

      <UnitList units={entry.units} onRemove={entry.removeUnit} />
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
