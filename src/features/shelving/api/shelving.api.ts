import { supabase, isDemoMode } from '../../../shared/supabase/client';
import { getMockProducts } from '../../../shared/mock/mockData';
import type { ActiveShelf, PendingItem } from '../types';

export async function lookupShelfByBarcode(barcode: string): Promise<ActiveShelf> {
  if (isDemoMode()) {
    return {
      shelfId: `shelf-${barcode || 'A1-01'}`,
      barcode: barcode || 'RAF-A1-01',
      label: `Raf ${barcode || 'A1-01'} (Ana Depo)`,
    };
  }

  const { data, error } = await supabase
    .from('shelves')
    .select('id, barcode, name, location')
    .eq('barcode', barcode)
    .single();

  if (error || !data) {
    throw new Error(`Raf bulunamadı: ${barcode}`);
  }

  return {
    shelfId: data.id,
    barcode: data.barcode,
    label: data.name ?? data.location ?? data.barcode,
  };
}

export async function lookupProductByEan(
  ean: string,
): Promise<{ productId: string; articleNo: string; name: string }> {
  if (isDemoMode()) {
    const product = getMockProducts().find((p) => p.ean === ean) || getMockProducts()[0];
    return { productId: product.id, articleNo: product.articleNo, name: product.name };
  }

  const { data, error } = await supabase
    .from('products')
    .select('id, article_no, name')
    .eq('ean', ean)
    .single();

  if (error || !data) {
    throw new Error(`Ürün tanımlı değil: ${ean}`);
  }

  return { productId: data.id, articleNo: data.article_no, name: data.name };
}

export async function commitShelving(shelfId: string, items: PendingItem[]): Promise<void> {
  if (isDemoMode()) {
    return;
  }

  const payload = items.map((item) => ({ product_id: item.productId, qty: item.quantity }));

  const { error } = await supabase.rpc('commit_shelving', {
    p_shelf_id: shelfId,
    p_items: payload,
  });

  if (error) {
    throw new Error(error.message);
  }
}
