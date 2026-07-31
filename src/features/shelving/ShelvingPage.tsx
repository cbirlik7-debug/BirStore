import { useState } from 'react';
import { ShelfScanStep } from './components/ShelfScanStep';
import { ProductScanStep } from './components/ProductScanStep';
import { PendingList } from './components/PendingList';
import { CommitButton } from './components/CommitButton';
import { usePendingShelvingList } from './hooks/usePendingShelvingList';
import type { ActiveShelf } from './types';

export function ShelvingPage() {
  const [activeShelf, setActiveShelf] = useState<ActiveShelf | null>(null);
  const { items, addOrIncrement, setQuantity, remove, clear } = usePendingShelvingList();

  function handleChangeShelf() {
    if (items.length > 0 && !confirm('Rafı değiştirirseniz mevcut liste silinecek. Devam edilsin mi?')) {
      return;
    }
    clear();
    setActiveShelf(null);
  }

  if (!activeShelf) {
    return (
      <div className="shelving-page">
        <h2>Ürün İstifle</h2>
        <ShelfScanStep onShelfSelected={setActiveShelf} />
      </div>
    );
  }

  return (
    <div className="shelving-page">
      <h2>Ürün İstifle</h2>
      <div className="active-shelf-banner">
        <span>Aktif Raf: {activeShelf.label}</span>
        <button type="button" onClick={handleChangeShelf}>
          Rafı Değiştir
        </button>
      </div>
      <ProductScanStep onProductScanned={addOrIncrement} />
      <PendingList items={items} onSetQuantity={setQuantity} onRemove={remove} />
      <CommitButton shelfId={activeShelf.shelfId} items={items} onCommitted={clear} />
    </div>
  );
}
