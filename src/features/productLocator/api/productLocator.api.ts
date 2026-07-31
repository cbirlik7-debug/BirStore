import { supabase } from '../../../shared/supabase/client';

export interface ProductMatch {
  id: string;
  ean: string;
  articleNo: string;
  name: string;
}

export interface ShelfBreakdownRow {
  shelfId: string;
  shelfName: string;
  quantity: number;
  placedAt: string;
  updatedAt: string;
}

export async function searchProduct(query: string): Promise<ProductMatch[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, ean, article_no, name')
    .or(`ean.eq.${query},article_no.ilike.%${query}%`)
    .limit(20);

  if (error) throw new Error(error.message);

  return (data ?? []).map((p) => ({ id: p.id, ean: p.ean, articleNo: p.article_no, name: p.name }));
}

export async function getShelfBreakdown(productId: string): Promise<ShelfBreakdownRow[]> {
  const { data, error } = await supabase
    .from('shelf_stock')
    .select('shelf_id, quantity, placed_at, updated_at, shelves(name, barcode)')
    .eq('product_id', productId)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const shelf = row.shelves as unknown as { name: string | null; barcode: string } | null;
    return {
      shelfId: row.shelf_id,
      shelfName: shelf?.name ?? shelf?.barcode ?? row.shelf_id,
      quantity: row.quantity,
      placedAt: row.placed_at,
      updatedAt: row.updated_at,
    };
  });
}
