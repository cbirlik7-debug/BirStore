import { supabase } from '../../../shared/supabase/client';
import type { RequiredId } from '../../../shared/supabase/types';
import type { CatalogProduct } from '../types';

export async function listProducts(): Promise<CatalogProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, ean, article_no, name, required_ids')
    .order('article_no');

  if (error) throw new Error(error.message);

  return (data ?? []).map((p) => ({
    id: p.id,
    ean: p.ean,
    articleNo: p.article_no,
    name: p.name,
    requiredIds: p.required_ids,
  }));
}

export async function createProduct(input: {
  ean: string;
  articleNo: string;
  name: string;
  requiredIds: RequiredId[];
}): Promise<void> {
  const { error } = await supabase.from('products').insert({
    ean: input.ean,
    article_no: input.articleNo,
    name: input.name,
    required_ids: input.requiredIds,
  });

  if (error) throw new Error(error.message);
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
