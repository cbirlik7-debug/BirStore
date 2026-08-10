import { supabase } from '../../../shared/supabase/client';
import { listOrders } from '../../orders/api/orders.api';
import { countUnitsByProductForOrder } from '../../goodsReceiving/api/goodsReceiving.api';
import type { OrderProgress, OrderItemProgress } from '../types';

async function getCompletionMap(): Promise<Map<string, string>> {
  const { data, error } = await supabase.from('tamamlanan_siparisler').select('siparis_id, kayit_no');
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((row) => [row.siparis_id, row.kayit_no]));
}

export async function listOrdersWithProgress(): Promise<OrderProgress[]> {
  const [orders, completion] = await Promise.all([listOrders(), getCompletionMap()]);

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
        kayitNo: completion.get(order.id) ?? null,
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

function generateKayitNo(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `KYT-${rand}`;
}

export async function completeOrder(orderId: string): Promise<{ kayitNo: string }> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const kayitNo = generateKayitNo();
    const { data, error } = await supabase
      .from('tamamlanan_siparisler')
      .insert({ siparis_id: orderId, kayit_no: kayitNo })
      .select('kayit_no')
      .single();

    if (!error && data) return { kayitNo: data.kayit_no };

    if (error && error.code === '23505') {
      const { data: existing } = await supabase
        .from('tamamlanan_siparisler')
        .select('kayit_no')
        .eq('siparis_id', orderId)
        .maybeSingle();
      if (existing) return { kayitNo: existing.kayit_no };
      continue;
    }

    if (error) throw new Error(error.message);
  }
  throw new Error('Sipariş tamamlanamadı, tekrar deneyin.');
}
