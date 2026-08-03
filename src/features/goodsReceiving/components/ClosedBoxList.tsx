import type { ActiveBox } from '../types';

export function ClosedBoxList({
  boxes,
  onReopen,
}: {
  boxes: ActiveBox[];
  onReopen: (box: ActiveBox) => void;
}) {
  if (boxes.length === 0) {
    return <p>Bu oturumda kapatılan koli yok.</p>;
  }

  return (
    <ul className="closed-box-list">
      {boxes.map((box) => (
        <li key={box.id}>
          <span className={`badge ${box.tip === 'eirsaliye' ? 'badge-blue' : 'badge-gray'}`}>
            {box.tip === 'eirsaliye' ? 'e-İrsaliye' : 'Kurye'}
          </span>
          <span>{box.barkod}</span>
          {box.siparisNo && <span>{box.siparisNo}</span>}
          <button type="button" onClick={() => onReopen(box)}>
            Yeniden Aç
          </button>
        </li>
      ))}
    </ul>
  );
}
