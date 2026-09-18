import { supabase, isDemoMode } from '../../../shared/supabase/client';
import { deleteUnit } from '../../goodsReceiving/api/goodsReceiving.api';
import type { CompletedOrder, DailyReport, DuplicateRecord, SupplierPerformance, UnexpectedProduct } from '../types';

// --- Beklenmeyen Ürünler ---

interface UnexpectedRow {
  id: string;
  raw_barkod: string | null;
  created_at: string;
  koliler: { barkod: string; siparisler: { siparis_no: string } | null } | null;
}

export async function listUnexpectedProducts(): Promise<UnexpectedProduct[]> {
  if (isDemoMode()) {
    return [
      {
        id: 'unexp-1',
        rawBarkod: '8690001928374',
        koliBarkod: 'KL-849201948',
        siparisNo: 'SIP-2026-0811',
        createdAt: '2026-08-11T10:14:00Z',
      },
    ];
  }

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
  if (isDemoMode()) {
    return;
  }

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
  if (isDemoMode()) {
    return [];
  }

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
  if (isDemoMode()) {
    return [
      {
        tedarikciId: 'sup-1',
        tedarikciAdi: 'Apple Türkiye Dağıtım Ltd.',
        siparisSayisi: 12,
        tamamlananSayisi: 11,
        tutanakSayisi: 1,
        sorunOrani: 1 / 12,
      },
      {
        tedarikciId: 'sup-2',
        tedarikciAdi: 'Samsung Elektronik A.Ş.',
        siparisSayisi: 8,
        tamamlananSayisi: 8,
        tutanakSayisi: 0,
        sorunOrani: 0,
      },
      {
        tedarikciId: 'sup-3',
        tedarikciAdi: 'Sony Eurasia Pazarlama',
        siparisSayisi: 6,
        tamamlananSayisi: 5,
        tutanakSayisi: 1,
        sorunOrani: 1 / 6,
      },
    ];
  }

  const [
    { data: orderRows, error: ordersError },
    { data: tutanakRows, error: tutanaklarError },
    { data: completedRows, error: completedError },
  ] = await Promise.all([
    supabase.from('siparisler').select('id, tedarikci_id, tedarikciler(ad)'),
    supabase.from('tutanaklar').select('siparisler(tedarikci_id)'),
    supabase.from('tamamlanan_siparisler').select('siparis_id'),
  ]);
  if (ordersError) throw new Error(ordersError.message);
  if (tutanaklarError) throw new Error(tutanaklarError.message);
  if (completedError) throw new Error(completedError.message);

  const completedIds = new Set((completedRows ?? []).map((r) => r.siparis_id));

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
    if (completedIds.has(row.id)) entry.tamamlananSayisi += 1;
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
  if (isDemoMode()) {
    return {
      tarih: dateStr,
      koliSayisi: 14,
      urunSayisi: 45,
      tutanakSayisi: 1,
      urunDokum: [
        { articleNo: 'MM-IP15P-256', productName: 'Apple iPhone 15 Pro 256GB Titanyum', adet: 20 },
        { articleNo: 'MM-SGS24U-512', productName: 'Samsung Galaxy S24 Ultra 512GB Gri', adet: 15 },
        { articleNo: 'MM-AW-S9-45', productName: 'Apple Watch Series 9 GPS 45mm Gece Yarısı', adet: 10 },
      ],
      tamamlananSiparisler: [
        { siparisNo: 'SIP-2026-0812', kayitNo: 'KYT-904128', createdAt: `${dateStr}T15:30:00Z` },
      ],
    };
  }

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

  const { data: completedRows, error: completedError } = await supabase
    .from('tamamlanan_siparisler')
    .select('kayit_no, created_at, siparisler(siparis_no)')
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: false });
  if (completedError) throw new Error(completedError.message);

  const tamamlananSiparisler: CompletedOrder[] = (
    (completedRows ?? []) as unknown as { kayit_no: string; created_at: string; siparisler: { siparis_no: string } | null }[]
  ).map((row) => ({
    siparisNo: row.siparisler?.siparis_no ?? '—',
    kayitNo: row.kayit_no,
    createdAt: row.created_at,
  }));

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
    tamamlananSiparisler,
  };
}
