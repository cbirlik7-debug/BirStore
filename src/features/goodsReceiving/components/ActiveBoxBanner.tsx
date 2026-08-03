import type { ActiveBox } from '../types';

export function ActiveBoxBanner({
  box,
  onClose,
  onChangeBox,
  closing,
}: {
  box: ActiveBox;
  onClose: () => void;
  onChangeBox: () => void;
  closing: boolean;
}) {
  return (
    <div className="active-box-banner">
      <div className="active-box-info">
        <span className={`badge ${box.tip === 'eirsaliye' ? 'badge-blue' : 'badge-gray'}`}>
          {box.tip === 'eirsaliye' ? 'e-İrsaliye' : 'Kurye'}
        </span>
        <strong>{box.barkod}</strong>
        {box.siparisNo && <span>Sipariş: {box.siparisNo}</span>}
        {box.magazaAdi && <span>Mağaza: {box.magazaAdi}</span>}
      </div>
      {box.uyari && <p role="alert">{box.uyari}</p>}
      <div className="active-box-actions">
        <button type="button" onClick={onChangeBox}>
          Koliyi Değiştir
        </button>
        <button type="button" className="btn-danger" disabled={closing} onClick={onClose}>
          {closing ? 'Kapatılıyor...' : 'Koliyi Kapat'}
        </button>
      </div>
    </div>
  );
}
