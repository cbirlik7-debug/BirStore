import { supabase } from '../../../shared/supabase/client';
import type { Order, OrderLineItem } from '../types';

interface OrderRow {
  id: string;
  siparis_no: string;
  irsaliye_no: string | null;
  created_at: string;
  tedarikciler: { ad: string } | null;
  siparis_kalemleri: {
    beklenen: number;
    products: { id: string; article_no: string; name: string } | null;
  }[];
}

export async function listOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('siparisler')
    .select(
      'id, siparis_no, irsaliye_no, created_at, tedarikciler(ad), siparis_kalemleri(beklenen, products(id, article_no, name))',
    )
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as OrderRow[]).map((row) => ({
    id: row.id,
    siparisNo: row.siparis_no,
    tedarikciAdi: row.tedarikciler?.ad ?? null,
    irsaliyeNo: row.irsaliye_no,
    createdAt: row.created_at,
    items: row.siparis_kalemleri
      .filter((k): k is typeof k & { products: NonNullable<typeof k.products> } => k.products !== null)
      .map((k) => ({
        productId: k.products.id,
        articleNo: k.products.article_no,
        productName: k.products.name,
        beklenen: k.beklenen,
      })),
  }));
}

export async function createOrder(input: {
  siparisNo: string;
  tedarikciId: string | null;
  irsaliyeNo: string | null;
  items: { productId: string; beklenen: number }[];
}): Promise<void> {
  const { data, error } = await supabase
    .from('siparisler')
    .insert({
      siparis_no: input.siparisNo,
      tedarikci_id: input.tedarikciId,
      irsaliye_no: input.irsaliyeNo,
    })
    .select('id')
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Sipariş oluşturulamadı');

  if (input.items.length > 0) {
    const { error: itemsError } = await supabase.from('siparis_kalemleri').insert(
      input.items.map((item) => ({
        siparis_id: data.id,
        product_id: item.productId,
        beklenen: item.beklenen,
      })),
    );
    if (itemsError) throw new Error(itemsError.message);
  }
}

export async function deleteOrder(id: string): Promise<void> {
  const { error } = await supabase.from('siparisler').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export type { OrderLineItem };
