import { supabase } from '../../../shared/supabase/client';
import { runOrQueue, registerOfflineHandler } from '../../../shared/offline/offlineQueue';
import type { IdentifierValues, RequiredId } from '../../../shared/supabase/types';
import type { ActiveBox, CommittedUnit, DuplicateMatch, EntryProduct } from '../types';

interface KolilerRow {
  id: string;
  barkod: string;
  tip: string;
  durum: string;
  siparis_id: string | null;
  magaza_kodu: string | null;
  uyari: string | null;
  reopen_log: { at: string }[];
  siparisler: { siparis_no: string } | null;
  magazalar: { ad: string } | null;
}

function mapBoxRow(row: KolilerRow): ActiveBox {
  return {
    id: row.id,
    barkod: row.barkod,
    tip: row.tip,
    durum: row.durum as 'acik' | 'kapali',
    siparisId: row.siparis_id,
    siparisNo: row.siparisler?.siparis_no ?? null,
    magazaKodu: row.magaza_kodu,
    magazaAdi: row.magazalar?.ad ?? null,
    uyari: row.uyari,
    reopenLog: row.reopen_log ?? [],
  };
}

const BOX_SELECT =
  'id, barkod, tip, durum, siparis_id, magaza_kodu, uyari, reopen_log, siparisler(siparis_no), magazalar(ad)';

export async function findBoxByBarcode(barkod: string): Promise<ActiveBox | null> {
  const { data, error } = await supabase
    .from('koliler')
    .select(BOX_SELECT)
    .eq('barkod', barkod)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapBoxRow(data as unknown as KolilerRow) : null;
}

export async function findBoxDefinition(barkod: string): Promise<{
  tip: string;
  siparisId: string | null;
  magazaKodu: string | null;
  uyari: string | null;
} | null> {
  const { data, error } = await supabase
    .from('koli_tanimlari')
    .select('tip, siparis_id, magaza_kodu, uyari')
    .eq('barkod', barkod)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    tip: data.tip,
    siparisId: data.siparis_id,
    magazaKodu: data.magaza_kodu,
    uyari: data.uyari,
  };
}

export async function createBox(input: {
  barkod: string;
  tip: string;
  siparisId: string | null;
  magazaKodu: string | null;
  uyari: string | null;
}): Promise<ActiveBox> {
  const { data, error } = await supabase
    .from('koliler')
    .insert({
      barkod: input.barkod,
      tip: input.tip,
      siparis_id: input.siparisId,
      magaza_kodu: input.magazaKodu,
      uyari: input.uyari,
    })
    .select(BOX_SELECT)
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Koli oluşturulamadı');
  return mapBoxRow(data as unknown as KolilerRow);
}

export async function reopenBox(id: string, previousLog: { at: string }[]): Promise<void> {
  const { error } = await supabase
    .from('koliler')
    .update({
      durum: 'acik',
      reopen_log: [...previousLog, { at: new Date().toISOString() }],
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

async function closeBoxRaw(id: string): Promise<void> {
  const { error } = await supabase
    .from('koliler')
    .update({ durum: 'kapali', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function closeBox(id: string): Promise<void> {
  await runOrQueue('goodsReceiving.closeBox', { id }, () => closeBoxRaw(id));
}

registerOfflineHandler('goodsReceiving.closeBox', async (payload) => {
  const p = payload as { id: string };
  await closeBoxRaw(p.id);
});

export async function lookupProductForEntry(ean: string): Promise<EntryProduct | null> {
  const { data, error } = await supabase
    .from('products')
    .select('id, article_no, name, required_ids')
    .eq('ean', ean)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (data) {
    return {
      productId: data.id,
      articleNo: data.article_no,
      name: data.name,
      requiredIds: data.required_ids as RequiredId[],
    };
  }

  const { data: alias, error: aliasError } = await supabase
    .from('product_ean_aliases')
    .select('products(id, article_no, name, required_ids)')
    .eq('ean', ean)
    .maybeSingle();

  if (aliasError) throw new Error(aliasError.message);
  const product = (
    alias as unknown as {
      products: { id: string; article_no: string; name: string; required_ids: RequiredId[] } | null;
    } | null
  )?.products;
  if (!product) return null;
  return {
    productId: product.id,
    articleNo: product.article_no,
    name: product.name,
    requiredIds: product.required_ids,
  };
}

interface KoliUrunRow {
  id: string;
  product_id: string | null;
  raw_barkod: string | null;
  identifiers: IdentifierValues;
  beklenmeyen: boolean;
  products: { article_no: string; name: string } | null;
}

export async function listUnits(koliId: string): Promise<CommittedUnit[]> {
  const { data, error } = await supabase
    .from('koli_urunler')
    .select('id, product_id, raw_barkod, identifiers, beklenmeyen, products(article_no, name)')
    .eq('koli_id', koliId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as KoliUrunRow[]).map((row) => ({
    id: row.id,
    productId: row.product_id,
    articleNo: row.products?.article_no ?? null,
    productName: row.products?.name ?? null,
    rawBarkod: row.raw_barkod,
    identifiers: row.identifiers,
    beklenmeyen: row.beklenmeyen,
  }));
}

interface InsertUnitInput {
  productId?: string | null;
  rawBarkod?: string | null;
  identifiers?: IdentifierValues;
  beklenmeyen?: boolean;
}

async function insertUnitRaw(koliId: string, input: InsertUnitInput): Promise<void> {
  const { error } = await supabase.from('koli_urunler').insert({
    koli_id: koliId,
    product_id: input.productId ?? null,
    raw_barkod: input.rawBarkod ?? null,
    identifiers: input.identifiers ?? {},
    beklenmeyen: input.beklenmeyen ?? false,
  });

  if (error) throw new Error(error.message);
}

export async function insertUnit(koliId: string, input: InsertUnitInput): Promise<void> {
  await runOrQueue('goodsReceiving.insertUnit', { koliId, input }, () => insertUnitRaw(koliId, input));
}

registerOfflineHandler('goodsReceiving.insertUnit', async (payload) => {
  const p = payload as { koliId: string; input: InsertUnitInput };
  await insertUnitRaw(p.koliId, p.input);
});

export async function findDuplicateIdentifier(value: string): Promise<DuplicateMatch | null> {
  const { data, error } = await supabase
    .from('koli_urunler')
    .select('created_at, koliler(barkod, siparisler(siparis_no))')
    .or(
      `identifiers->>IMEI1.eq.${value},identifiers->>IMEI2.eq.${value},identifiers->>SERIAL.eq.${value}`,
    )
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as unknown as {
    created_at: string;
    koliler: { barkod: string; siparisler: { siparis_no: string } | null } | null;
  };
  return {
    koliBarkod: row.koliler?.barkod ?? '—',
    siparisNo: row.koliler?.siparisler?.siparis_no ?? null,
    createdAt: row.created_at,
  };
}

export async function deleteUnit(id: string): Promise<void> {
  const { error } = await supabase.from('koli_urunler').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function countUnitsByProductForOrder(
  orderId: string,
): Promise<Record<string, number>> {
  const { data: boxes, error: boxesError } = await supabase
    .from('koliler')
    .select('id')
    .eq('siparis_id', orderId);
  if (boxesError) throw new Error(boxesError.message);

  const koliIds = (boxes ?? []).map((b) => b.id);
  if (koliIds.length === 0) return {};

  const { data: units, error: unitsError } = await supabase
    .from('koli_urunler')
    .select('product_id')
    .in('koli_id', koliIds)
    .not('product_id', 'is', null);
  if (unitsError) throw new Error(unitsError.message);

  const counts: Record<string, number> = {};
  for (const row of units ?? []) {
    if (!row.product_id) continue;
    counts[row.product_id] = (counts[row.product_id] ?? 0) + 1;
  }
  return counts;
}

export async function getBoxCounts(): Promise<{ total: number; acik: number }> {
  const { count: total, error: totalError } = await supabase
    .from('koliler')
    .select('id', { count: 'exact', head: true });
  if (totalError) throw new Error(totalError.message);

  const { count: acik, error: acikError } = await supabase
    .from('koliler')
    .select('id', { count: 'exact', head: true })
    .eq('durum', 'acik');
  if (acikError) throw new Error(acikError.message);

  return { total: total ?? 0, acik: acik ?? 0 };
}

export async function getUnitCount(): Promise<number> {
  const { count, error } = await supabase
    .from('koli_urunler')
    .select('id', { count: 'exact', head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function listOrderOptions(): Promise<{ id: string; siparisNo: string }[]> {
  const { data, error } = await supabase
    .from('siparisler')
    .select('id, siparis_no')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({ id: row.id, siparisNo: row.siparis_no }));
}
