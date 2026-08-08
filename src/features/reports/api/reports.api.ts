import { supabase } from '../../../shared/supabase/client';
import { listOrders } from '../../orders/api/orders.api';
import { countUnitsByProductForOrder, deleteUnit } from '../../goodsReceiving/api/goodsReceiving.api';
import type { DailyReport, DuplicateRecord, SupplierPerformance, UnexpectedProduct } from '../types';

// --- Beklenmeyen Ürünler ---

interface UnexpectedRow {
  id: string;
  raw_barkod: string | null;
  created_at: string;
  koliler: { barkod: string; siparisler: { siparis_no: string } | null } | null;
}

export async function listUnexpectedProducts(): Promise<UnexpectedProduct[]> {
  const { data, error } = await supabase
    .from('koli_urunler')
    .select('id, raw_barkod, created_at, koliler(barkod, siparisler(siparis_no))')
    .eq('beklenmeyen', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as UnexpectedRow[]).map((row) => ({
    id: row.id,
    rawBarkod: row.raw_barkod,
    koliBarkod: row.koliler?.barkod ?? '—',
    siparisNo: row.koliler?.siparisler?.siparis_no ?? null,
    createdAt: row.created_at,
  }));
}

export async function linkUnexpectedProduct(
  koliUrunId: string,
  rawBarkod: string,
  productId: string,
): Promise<void> {
  if (rawBarkod) {
    const { error: aliasError } = await supabase
      .from('product_ean_aliases')
      .upsert({ ean: rawBarkod, product_id: productId }, { onConflict: 'ean' });
    if (aliasError) throw new Error(aliasError.message);
  }

  const { error } = await supabase
    .from('koli_urunler')
    .update({ product_id: productId, beklenmeyen: false })
    .eq('id', koliUrunId);
  if (error) throw new Error(error.message);
}

// --- Mükerrer Kayıtlar ---

interface DuplicateRow {
  identifier_value: string;
  koli_urun_id: string;
  koli_id: string;
  koli_barkod: string;
  siparis_no: string | null;
  created_at: string;
}

export async function listDuplicateIdentifiers(): Promise<DuplicateRecord[]> {
  const { data, error } = await supabase.rpc('find_duplicate_identifiers');
  if (error) throw new Error(error.message);
  return ((data ?? []) as DuplicateRow[]).map((row) => ({
    identifierValue: row.identifier_value,
    koliUrunId: row.koli_urun_id,
    koliBarkod: row.koli_barkod,
    siparisNo: row.siparis_no,
    createdAt: row.created_at,
  }));
}

export const deleteDuplicateRecord = deleteUnit;

// --- Tedarikçi Performansı ---

interface SupplierOrderRow {
  id: string;
  tedarikci_id: string | null;
  tedarikciler: { ad: string } | null;
}

interface SupplierTutanakRow {
  siparisler: { tedarikci_id: string | null } | null;
}

export async function listSupplierPerformance(): Promise<SupplierPerformance[]> {
  const [{ data: orderRows, error: ordersError }, { data: tutanakRows, error: tutanaklarError }, orders] =
    await Promise.all([
      supabase.from('siparisler').select('id, tedarikci_id, tedarikciler(ad)'),
      supabase.from('tutanaklar').select('siparisler(tedarikci_id)'),
      listOrders(),
    ]);
  if (ordersError) throw new Error(ordersError.message);
  if (tutanaklarError) throw new Error(tutanaklarError.message);

  const progress = await Promise.all(
    orders.map(async (o) => {
      const counts = await countUnitsByProductForOrder(o.id);
      const girilen = o.items.reduce((sum, i) => sum + (counts[i.productId] ?? 0), 0);
      const beklenen = o.items.reduce((sum, i) => sum + i.beklenen, 0);
      return { id: o.id, complete: beklenen > 0 && girilen >= beklenen };
    }),
  );
  const completeMap = new Map(progress.map((p) => [p.id, p.complete]));

  const bySupplier = new Map<
    string,
    { ad: string; siparisSayisi: number; tamamlananSayisi: number; tutanakSayisi: number }
  >();
  for (const row of (orderRows ?? []) as unknown as SupplierOrderRow[]) {
    if (!row.tedarikci_id) continue;
    const entry = bySupplier.get(row.tedarikci_id) ?? {
      ad: row.tedarikciler?.ad ?? '—',
      siparisSayisi: 0,
      tamamlananSayisi: 0,
      tutanakSayisi: 0,
    };
    entry.siparisSayisi += 1;
    if (completeMap.get(row.id)) entry.tamamlananSayisi += 1;
    bySupplier.set(row.tedarikci_id, entry);
  }
  for (const row of (tutanakRows ?? []) as unknown as SupplierTutanakRow[]) {
    const tedarikciId = row.siparisler?.tedarikci_id;
    if (!tedarikciId) continue;
    const entry = bySupplier.get(tedarikciId);
    if (entry) entry.tutanakSayisi += 1;
  }

  return Array.from(bySupplier.entries())
    .map(([tedarikciId, v]) => ({
      tedarikciId,
      tedarikciAdi: v.ad,
      siparisSayisi: v.siparisSayisi,
      tamamlananSayisi: v.tamamlananSayisi,
      tutanakSayisi: v.tutanakSayisi,
      sorunOrani: v.siparisSayisi === 0 ? 0 : v.tutanakSayisi / v.siparisSayisi,
    }))
    .sort((a, b) => b.sorunOrani - a.sorunOrani);
}

// --- Günlük Rapor ---

interface DailyUnitRow {
  product_id: string;
  products: { article_no: string; name: string } | null;
}

export async function getDailyReport(dateStr: string): Promise<DailyReport> {
  const start = `${dateStr}T00:00:00`;
  const end = `${dateStr}T23:59:59.999`;

  const { count: koliSayisi, error: kolilerError } = await supabase
    .from('koliler')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', start)
    .lte('created_at', end);
  if (kolilerError) throw new Error(kolilerError.message);

  const { count: tutanakSayisi, error: tutanaklarError } = await supabase
    .from('tutanaklar')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', start)
    .lte('created_at', end);
  if (tutanaklarError) throw new Error(tutanaklarError.message);

  const { data: units, error: unitsError } = await supabase
    .from('koli_urunler')
    .select('product_id, products(article_no, name)')
    .gte('created_at', start)
    .lte('created_at', end)
    .not('product_id', 'is', null);
  if (unitsError) throw new Error(unitsError.message);

  const rows = (units ?? []) as unknown as DailyUnitRow[];
  const byProduct = new Map<string, { articleNo: string; productName: string; adet: number }>();
  for (const row of rows) {
    if (!row.products) continue;
    const entry = byProduct.get(row.product_id) ?? {
      articleNo: row.products.article_no,
      productName: row.products.name,
      adet: 0,
    };
    entry.adet += 1;
    byProduct.set(row.product_id, entry);
  }

  return {
    tarih: dateStr,
    koliSayisi: koliSayisi ?? 0,
    urunSayisi: rows.length,
    tutanakSayisi: tutanakSayisi ?? 0,
    urunDokum: Array.from(byProduct.values()).sort((a, b) => b.adet - a.adet),
  };
}
