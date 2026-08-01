import { listOrders } from '../../orders/api/orders.api';
import type { OrderProgress, OrderItemProgress } from '../types';

// NOT: "girilen" adetleri Mal Kabul modülü (koli_urunler tablosu) ile
// dolacak. O modül gelene kadar burada sabit 0 döner — ekranlar hazır,
// veri geldiğinde bu iki fonksiyonun içi güncellenecek, arayüz değişmeyecek.

export async function listOrdersWithProgress(): Promise<OrderProgress[]> {
  const orders = await listOrders();

  return orders.map((order) => ({
    id: order.id,
    siparisNo: order.siparisNo,
    tedarikciAdi: order.tedarikciAdi,
    beklenenToplam: order.items.reduce((sum, item) => sum + item.beklenen, 0),
    girilenToplam: 0,
  }));
}

export async function getOrderItemProgress(orderId: string): Promise<OrderItemProgress[]> {
  const orders = await listOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) throw new Error('Sipariş bulunamadı');

  return order.items.map((item) => ({
    productId: item.productId,
    articleNo: item.articleNo,
    productName: item.productName,
    beklenen: item.beklenen,
    girilen: 0,
  }));
}
