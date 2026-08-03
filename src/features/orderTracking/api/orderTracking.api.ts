import { listOrders } from '../../orders/api/orders.api';
import { countUnitsByProductForOrder } from '../../goodsReceiving/api/goodsReceiving.api';
import type { OrderProgress, OrderItemProgress } from '../types';

export async function listOrdersWithProgress(): Promise<OrderProgress[]> {
  const orders = await listOrders();

  return Promise.all(
    orders.map(async (order) => {
      const counts = await countUnitsByProductForOrder(order.id);
      const girilenToplam = order.items.reduce(
        (sum, item) => sum + (counts[item.productId] ?? 0),
        0,
      );
      return {
        id: order.id,
        siparisNo: order.siparisNo,
        tedarikciAdi: order.tedarikciAdi,
        beklenenToplam: order.items.reduce((sum, item) => sum + item.beklenen, 0),
        girilenToplam,
      };
    }),
  );
}

export async function getOrderItemProgress(orderId: string): Promise<OrderItemProgress[]> {
  const orders = await listOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) throw new Error('Sipariş bulunamadı');

  const counts = await countUnitsByProductForOrder(orderId);

  return order.items.map((item) => ({
    productId: item.productId,
    articleNo: item.articleNo,
    productName: item.productName,
    beklenen: item.beklenen,
    girilen: counts[item.productId] ?? 0,
  }));
}
