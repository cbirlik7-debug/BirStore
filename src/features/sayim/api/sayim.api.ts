import { supabase } from '../../../shared/supabase/client';
import { runOrQueue, registerOfflineHandler } from '../../../shared/offline/offlineQueue';
import type { Sayim, ShelfDiscrepancy, ShelfLockInfo } from '../types';

const LOCK_STALE_MS = 30 * 60 * 1000;

export async function listSayimlar(): Promise<Sayim[]> {
  const { data, error } = await supabase
    .from('sayimlar')
    .select('id, ad, baslangic, bitis, durum')
    .order('baslangic', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    ad: row.ad,
    baslangic: row.baslangic,
    bitis: row.bitis,
    durum: row.durum as 'acik' | 'kapali',
  }));
}

export async function createSayim(ad: string): Promise<Sayim> {
  const { data, error } = await supabase
    .from('sayimlar')
    .insert({ ad })
    .select('id, ad, baslangic, bitis, durum')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Sayım oluşturulamadı');
  return { id: data.id, ad: data.ad, baslangic: data.baslangic, bitis: data.bitis, durum: data.durum as 'acik' | 'kapali' };
}

export async function closeSayim(id: string): Promise<void> {
  const { error } = await supabase
    .from('sayimlar')
    .update({ durum: 'kapali', bitis: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

interface LockRow {
  shelf_id: string;
  sayim_id: string;
  kilitleyen_user_id: string;
  kilitlendi_at: string;
  profiles: { full_name: string | null } | null;
}

export async function findShelfLock(shelfId: string): Promise<ShelfLockInfo | null> {
  const { data, error } = await supabase
    .from('sayim_kilitleri')
    .select('shelf_id, sayim_id, kilitleyen_user_id, kilitlendi_at, profiles(full_name)')
    .eq('shelf_id', shelfId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as unknown as LockRow;
  return {
    shelfId: row.shelf_id,
    sayimId: row.sayim_id,
    kilitleyenUserId: row.kilitleyen_user_id,
    kilitleyenAdi: row.profiles?.full_name ?? null,
    kilitlendiAt: row.kilitlendi_at,
  };
}

export function isLockStale(lock: ShelfLockInfo): boolean {
  return Date.now() - new Date(lock.kilitlendiAt).getTime() > LOCK_STALE_MS;
}

export async function acquireShelfLock(shelfId: string, sayimId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('sayim_kilitleri')
    .insert({ shelf_id: shelfId, sayim_id: sayimId, kilitleyen_user_id: userId });
  if (error) {
    throw new Error(error.code === '23505' ? 'Bu raf başka biri tarafından sayılıyor.' : error.message);
  }
}

export async function releaseShelfLock(shelfId: string): Promise<void> {
  const { error } = await supabase.from('sayim_kilitleri').delete().eq('shelf_id', shelfId);
  if (error) throw new Error(error.message);
}

interface SubmitShelfCountsPayload {
  sayimId: string;
  shelfId: string;
  userId: string;
  items: { productId: string; adet: number }[];
}

async function submitShelfCountsRaw(payload: SubmitShelfCountsPayload): Promise<void> {
  const { sayimId, shelfId, userId, items } = payload;
  if (items.length > 0) {
    const { error } = await supabase.from('sayim_satirlari').insert(
      items.map((i) => ({
        sayim_id: sayimId,
        shelf_id: shelfId,
        product_id: i.productId,
        sayilan_adet: i.adet,
        user_id: userId,
      })),
    );
    if (error) throw new Error(error.message);
  }
  const { error: unlockError } = await supabase.from('sayim_kilitleri').delete().eq('shelf_id', shelfId);
  if (unlockError) throw new Error(unlockError.message);
}

export async function submitShelfCounts(
  sayimId: string,
  shelfId: string,
  userId: string,
  items: { productId: string; adet: number }[],
): Promise<void> {
  const payload = { sayimId, shelfId, userId, items };
  await runOrQueue('sayim.submitShelfCounts', payload, () => submitShelfCountsRaw(payload));
}

registerOfflineHandler('sayim.submitShelfCounts', async (payload) => {
  await submitShelfCountsRaw(payload as SubmitShelfCountsPayload);
});

interface SatirRow {
  shelf_id: string;
  product_id: string;
  sayilan_adet: number;
  shelves: { name: string | null; barcode: string } | null;
  products: { article_no: string; name: string } | null;
}

interface StockRow {
  shelf_id: string;
  product_id: string;
  quantity: number;
  shelves: { name: string | null; barcode: string } | null;
  products: { article_no: string; name: string } | null;
}

export async function getSayimReport(sayimId: string): Promise<ShelfDiscrepancy[]> {
  const { data: satirlar, error } = await supabase
    .from('sayim_satirlari')
    .select('shelf_id, product_id, sayilan_adet, shelves(name, barcode), products(article_no, name)')
    .eq('sayim_id', sayimId);
  if (error) throw new Error(error.message);

  const rows = (satirlar ?? []) as unknown as SatirRow[];
  const shelfIds = Array.from(new Set(rows.map((r) => r.shelf_id)));

  const bySlot = new Map<string, ShelfDiscrepancy>();

  if (shelfIds.length > 0) {
    const { data: stock, error: stockError } = await supabase
      .from('shelf_stock')
      .select('shelf_id, product_id, quantity, shelves(name, barcode), products(article_no, name)')
      .in('shelf_id', shelfIds);
    if (stockError) throw new Error(stockError.message);

    for (const s of (stock ?? []) as unknown as StockRow[]) {
      const key = `${s.shelf_id}:${s.product_id}`;
      bySlot.set(key, {
        shelfId: s.shelf_id,
        shelfLabel: s.shelves?.name ?? s.shelves?.barcode ?? '—',
        productId: s.product_id,
        articleNo: s.products?.article_no ?? '—',
        productName: s.products?.name ?? '—',
        beklenen: s.quantity,
        sayilan: 0,
        fark: 0,
      });
    }
  }

  for (const row of rows) {
    const key = `${row.shelf_id}:${row.product_id}`;
    const entry = bySlot.get(key) ?? {
      shelfId: row.shelf_id,
      shelfLabel: row.shelves?.name ?? row.shelves?.barcode ?? '—',
      productId: row.product_id,
      articleNo: row.products?.article_no ?? '—',
      productName: row.products?.name ?? '—',
      beklenen: 0,
      sayilan: 0,
      fark: 0,
    };
    entry.sayilan += row.sayilan_adet;
    bySlot.set(key, entry);
  }

  const result = Array.from(bySlot.values());
  for (const r of result) r.fark = r.sayilan - r.beklenen;
  return result.sort((a, b) => Math.abs(b.fark) - Math.abs(a.fark));
}
