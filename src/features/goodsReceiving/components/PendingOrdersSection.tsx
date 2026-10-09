import { useEffect, useState } from 'react';
import {
  listPendingOrders,
  listBoxesByOrderId,
  createBox,
  reopenBox,
} from '../api/goodsReceiving.api';
import type { PendingOrderSummary } from '../api/goodsReceiving.api';
import type { ActiveBox } from '../types';

interface PendingOrdersSectionProps {
  onSelectBox: (box: ActiveBox) => void;
}

export function PendingOrdersSection({ onSelectBox }: PendingOrdersSectionProps) {
  const [orders, setOrders] = useState<PendingOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [boxes, setBoxes] = useState<ActiveBox[]>([]);
  const [loadingBoxes, setLoadingBoxes] = useState(false);

  // Yeni koli açma durumu
  const [newBoxModalOpen, setNewBoxModalOpen] = useState(false);
  const [newBoxBarcode, setNewBoxBarcode] = useState('');
  const [creatingBox, setCreatingBox] = useState(false);
  const [boxError, setBoxError] = useState<string | null>(null);

  async function loadOrders() {
    setLoading(true);
    setError(null);
    try {
      const data = await listPendingOrders();
      setOrders(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Açık siparişler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function handleSelectOrder(orderId: string) {
    if (selectedOrderId === orderId) {
      // Zaten seçiliyse kapat
      setSelectedOrderId(null);
      setBoxes([]);
      return;
    }

    setSelectedOrderId(orderId);
    setLoadingBoxes(true);
    setBoxError(null);
    try {
      const data = await listBoxesByOrderId(orderId);
      setBoxes(data);
    } catch (e) {
      setBoxError(e instanceof Error ? e.message : 'Siparişe ait koliler yüklenemedi');
    } finally {
      setLoadingBoxes(false);
    }
  }

  async function handleBoxAction(box: ActiveBox) {
    if (box.durum === 'kapali') {
      const ok = confirm(`"${box.barkod}" kolisi kapalı. Yeniden açılıp işlem yapılsın mı?`);
      if (!ok) return;
      try {
        await reopenBox(box.id, box.reopenLog);
        onSelectBox({ ...box, durum: 'acik' });
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Koli açılamadı');
      }
      return;
    }
    onSelectBox(box);
  }

  async function handleCreateNewBox() {
    if (!selectedOrderId || !newBoxBarcode.trim()) return;
    setCreatingBox(true);
    setBoxError(null);
    try {
      const newBox = await createBox({
        barkod: newBoxBarcode.trim(),
        tip: 'eirsaliye',
        siparisId: selectedOrderId,
        magazaKodu: null,
        uyari: null,
      });
      setNewBoxBarcode('');
      setNewBoxModalOpen(false);
      // Koliyi hemen aç
      onSelectBox(newBox);
    } catch (e) {
      setBoxError(e instanceof Error ? e.message : 'Koli oluşturulamadı');
    } finally {
      setCreatingBox(false);
    }
  }

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  return (
    <div className="pending-orders-section card" style={{ marginTop: '20px' }}>
      <div className="card-header">
        <div>
          <h3 style={{ margin: 0, fontSize: '16px' }}>📋 Açık Bekleyen Siparişler</h3>
          <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Mal kabul bekleyen veya devam eden siparişler ({orders.length})
          </span>
        </div>
        <button
          type="button"
          onClick={loadOrders}
          disabled={loading}
          style={{ minHeight: '34px', padding: '4px 10px', fontSize: '12px' }}
        >
          🔄 Yenile
        </button>
      </div>

      {error && <p role="alert">{error}</p>}

      {loading ? (
        <div style={{ padding: '16px 0', color: 'var(--text-muted)' }}>
          Siparişler yükleniyor...
        </div>
      ) : orders.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', padding: '12px 0' }}>
          Şu anda açık bekleyen sipariş bulunmuyor.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {orders.map((order) => {
            const isSelected = selectedOrderId === order.id;
            const percent =
              order.beklenenToplam > 0
                ? Math.min(100, Math.round((order.girilenToplam / order.beklenenToplam) * 100))
                : 0;

            return (
              <div
                key={order.id}
                style={{
                  border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: isSelected ? 'rgba(226, 98, 42, 0.05)' : 'var(--bg)',
                  borderRadius: '10px',
                  padding: '14px',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Sipariş Başlığı */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleSelectOrder(order.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>📄</span>
                    <div>
                      <strong style={{ fontSize: '15px', color: 'var(--text-h)' }}>
                        {order.siparisNo}
                      </strong>
                      <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {order.tedarikciAdi ?? 'Tedarikçi Belirtilmemiş'}
                        {order.irsaliyeNo && ` • İrsaliye: ${order.irsaliyeNo}`}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* İlerleme */}
                    <div style={{ textAlign: 'right', minWidth: '110px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text)' }}>
                        {order.girilenToplam} / {order.beklenenToplam} Ürün (%{percent})
                      </span>
                      <div
                        style={{
                          height: '6px',
                          background: 'rgba(255,255,255,0.08)',
                          borderRadius: '99px',
                          marginTop: '4px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${percent}%`,
                            background: percent === 100 ? '#3ecf8e' : 'var(--accent)',
                          }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      style={{
                        minHeight: '34px',
                        padding: '4px 12px',
                        fontSize: '12px',
                        background: isSelected ? 'var(--accent)' : 'var(--bg-elevated)',
                        color: isSelected ? '#fff' : 'var(--text-h)',
                        borderColor: isSelected ? 'transparent' : 'var(--border)',
                      }}
                    >
                      {isSelected ? 'Kolileri Kapat ▲' : 'Kolileri Gör ▼'}
                    </button>
                  </div>
                </div>

                {/* Seçili Siparişin Kolileri Bölümü */}
                {isSelected && (
                  <div
                    style={{
                      marginTop: '16px',
                      paddingTop: '16px',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '12px',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <h4 style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-h)' }}>
                        📦 Bu Siparişe Ait Koliler ({boxes.length})
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setNewBoxBarcode(`KL-${order.siparisNo.slice(-4)}-0${boxes.length + 1}`);
                          setNewBoxModalOpen(true);
                        }}
                        style={{
                          background: 'var(--gradient-accent)',
                          color: '#fff',
                          border: 'none',
                          minHeight: '32px',
                          padding: '4px 10px',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        ➕ Bu Siparişe Yeni Koli Aç
                      </button>
                    </div>

                    {boxError && <p role="alert">{boxError}</p>}

                    {loadingBoxes ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                        Koliler yükleniyor...
                      </p>
                    ) : boxes.length === 0 ? (
                      <div
                        style={{
                          padding: '16px',
                          textAlign: 'center',
                          background: 'var(--bg-surface)',
                          borderRadius: '8px',
                          border: '1px dashed var(--border)',
                          fontSize: '13px',
                          color: 'var(--text-muted)',
                        }}
                      >
                        Bu sipariş için henüz oluşturulmuş bir koli yok.
                        <div style={{ marginTop: '8px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setNewBoxBarcode(`KL-${order.siparisNo.slice(-4)}-01`);
                              setNewBoxModalOpen(true);
                            }}
                            style={{ fontSize: '12px', padding: '5px 12px' }}
                          >
                            İlk Koliyi Oluştur
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                          gap: '10px',
                        }}
                      >
                        {boxes.map((box) => (
                          <div
                            key={box.id}
                            style={{
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border)',
                              borderRadius: '8px',
                              padding: '12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <code style={{ fontSize: '13px', fontWeight: 600 }}>
                                {box.barkod}
                              </code>
                              <span
                                className={`badge ${
                                  box.durum === 'acik' ? 'badge-green' : 'badge-gray'
                                }`}
                              >
                                {box.durum === 'acik' ? '🟢 Açık' : '🔒 Kapalı'}
                              </span>
                            </div>

                            {box.magazaAdi && (
                              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                                {box.magazaAdi}
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => handleBoxAction(box)}
                              style={{
                                width: '100%',
                                marginTop: '4px',
                                minHeight: '36px',
                                fontSize: '12.5px',
                                background:
                                  box.durum === 'acik' ? 'var(--accent)' : 'var(--bg-elevated)',
                                color: box.durum === 'acik' ? '#fff' : 'var(--text-h)',
                                borderColor:
                                  box.durum === 'acik' ? 'transparent' : 'var(--border)',
                                fontWeight: 600,
                              }}
                            >
                              {box.durum === 'acik'
                                ? '📦 Koliyi Aç & Ürün Oku →'
                                : '🔓 Yeniden Aç & Oku'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Yeni Koli Açma Modalı */}
      {newBoxModalOpen && selectedOrder && (
        <div className="camera-scanner-overlay" role="dialog" aria-modal="true">
          <div className="camera-scanner-panel" style={{ maxWidth: '420px', width: '90%' }}>
            <h3 style={{ margin: 0 }}>Yeni Koli Oluştur</h3>
            <p style={{ fontSize: '13px', color: 'var(--text)', margin: '4px 0 12px' }}>
              <strong>{selectedOrder.siparisNo}</strong> siparişi için koli barkodu belirleyin:
            </p>

            <label style={{ marginBottom: '12px' }}>
              Koli Barkodu
              <input
                type="text"
                value={newBoxBarcode}
                onChange={(e) => setNewBoxBarcode(e.target.value)}
                placeholder="Örn: KL-849201948"
                autoFocus
              />
            </label>

            {boxError && <p role="alert">{boxError}</p>}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setNewBoxModalOpen(false)}
                disabled={creatingBox}
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleCreateNewBox}
                disabled={creatingBox || !newBoxBarcode.trim()}
                style={{ background: 'var(--accent)', color: '#fff', fontWeight: 600 }}
              >
                {creatingBox ? 'Açılıyor...' : 'Koliyi Aç & Başla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
