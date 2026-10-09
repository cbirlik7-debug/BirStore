import { supabase, isDemoMode } from '../../../shared/supabase/client';
import { listOrders } from '../../orders/api/orders.api';
import { countUnitsByProductForOrder } from '../../goodsReceiving/api/goodsReceiving.api';
import { getMockProducts } from '../../../shared/mock/mockData';
import type { IdentifierValues } from '../../../shared/supabase/types';

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

export interface OrderCoverage {
  siparisId: string;
  siparisNo: string;
  tedarikciAdi: string | null;
  girilen: number;
  beklenen: number;
  kayitNo: string | null;
}

export type ScannedRecordSource = 'mal_kabul' | 'transfer';

export interface ScannedRecord {
  id: string;
  source: ScannedRecordSource;
  context: string;
  siparisNo: string | null;
  identifiers: IdentifierValues;
  rawBarkod: string | null;
  createdAt: string;
}

export async function searchProduct(query: string): Promise<ProductMatch[]> {
  if (isDemoMode()) {
    const q = query.trim().toLowerCase();
    return getMockProducts()
      .filter((p) => p.ean.includes(q) || p.articleNo.toLowerCase().includes(q) || p.name.toLowerCase().includes(q))
      .map((p) => ({ id: p.id, ean: p.ean, articleNo: p.articleNo, name: p.name }));
  }

  const { data, error } = await supabase
    .from('products')
    .select('id, ean, article_no, name')
    .or(`ean.eq.${query},article_no.ilike.%${query}%`)
    .limit(20);

  if (error) throw new Error(error.message);

  return (data ?? []).map((p) => ({ id: p.id, ean: p.ean, articleNo: p.article_no, name: p.name }));
}

export async function getShelfBreakdown(productId: string): Promise<ShelfBreakdownRow[]> {
  if (isDemoMode()) {
    return [
      {
        shelfId: 'shelf-a1',
        shelfName: 'Raf A1-02 (Merkez Depo)',
        quantity: 14,
        placedAt: '2026-08-01T10:00:00Z',
        updatedAt: '2026-08-11T12:00:00Z',
      },
      {
        shelfId: 'shelf-b3',
        shelfName: 'Raf B3-05 (Satışa Hazır)',
        quantity: 8,
        placedAt: '2026-08-05T14:30:00Z',
        updatedAt: '2026-08-10T09:15:00Z',
      },
    ];
  }

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

export async function getOrderCoverage(productId: string): Promise<OrderCoverage[]> {
  const orders = await listOrders();
  const relevant = orders.filter((o) => o.items.some((i) => i.productId === productId));

  return Promise.all(
    relevant.map(async (o) => {
      const counts = await countUnitsByProductForOrder(o.id);
      const item = o.items.find((i) => i.productId === productId)!;
      return {
        siparisId: o.id,
        siparisNo: o.siparisNo,
        tedarikciAdi: o.tedarikciAdi,
        girilen: counts[productId] ?? 0,
        beklenen: item.beklenen,
        kayitNo: null,
      };
    }),
  );
}

function buildIdentifierOrClause(value: string, productId?: string): string {
  const clauses = [
    `identifiers->>IMEI1.eq.${value}`,
    `identifiers->>IMEI2.eq.${value}`,
    `identifiers->>SERIAL.eq.${value}`,
    `raw_barkod.eq.${value}`,
  ];
  if (productId) clauses.push(`product_id.eq.${productId}`);
  return clauses.join(',');
}

interface KoliMatchRow {
  id: string;
  raw_barkod: string | null;
  identifiers: IdentifierValues;
  created_at: string;
  koliler: { barkod: string; siparisler: { siparis_no: string } | null } | null;
}

interface TransferMatchRow {
  id: string;
  raw_barkod: string | null;
  identifiers: IdentifierValues;
  created_at: string;
  transfer_siparisleri: { transfer_no: string } | null;
}

export async function findScannedRecords(value: string, productId?: string): Promise<ScannedRecord[]> {
  if (isDemoMode()) {
    return [
      {
        id: 'rec-1',
        source: 'mal_kabul',
        context: 'KL-849201948',
        siparisNo: 'SIP-2026-0811',
        identifiers: { SERIAL: value || 'SER-9948201' },
        rawBarkod: value,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  const orClause = buildIdentifierOrClause(value, productId);

  const [koliResult, transferResult] = await Promise.all([
    supabase
      .from('koli_urunler')
      .select('id, raw_barkod, identifiers, created_at, koliler(barkod, siparisler(siparis_no))')
      .or(orClause)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('transfer_urunler')
      .select('id, raw_barkod, identifiers, created_at, transfer_siparisleri(transfer_no)')
      .or(orClause)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  if (koliResult.error) throw new Error(koliResult.error.message);
  if (transferResult.error) throw new Error(transferResult.error.message);

  const koliRecords: ScannedRecord[] = ((koliResult.data ?? []) as unknown as KoliMatchRow[]).map((row) => ({
    id: row.id,
    source: 'mal_kabul',
    context: row.koliler?.barkod ?? '—',
    siparisNo: row.koliler?.siparisler?.siparis_no ?? null,
    identifiers: row.identifiers,
    rawBarkod: row.raw_barkod,
    createdAt: row.created_at,
  }));

  const transferRecords: ScannedRecord[] = ((transferResult.data ?? []) as unknown as TransferMatchRow[]).map(
    (row) => ({
      id: row.id,
      source: 'transfer',
      context: row.transfer_siparisleri?.transfer_no ?? '—',
      siparisNo: null,
      identifiers: row.identifiers,
      rawBarkod: row.raw_barkod,
      createdAt: row.created_at,
    }),
  );

  return [...koliRecords, ...transferRecords].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export interface PlacedProductItem {
  productId: string;
  ean: string;
  articleNo: string;
  name: string;
  shelfId: string;
  shelfName: string;
  quantity: number;
  placedAt: string;
}

export interface UnplacedProductItem {
  productId: string;
  ean: string;
  articleNo: string;
  name: string;
  koliBarkod: string | null;
  adet: number;
  statusText: string;
}

export async function listPlacedProducts(): Promise<PlacedProductItem[]> {
  if (isDemoMode()) {
    const products = getMockProducts();
    const p1 = products[0];
    const p2 = products[1];
    const p5 = products[4];
    return [
      {
        productId: p1.id,
        ean: p1.ean,
        articleNo: p1.articleNo,
        name: p1.name,
        shelfId: 'shelf-a1',
        shelfName: 'Raf A1-02 (Merkez Depo)',
        quantity: 14,
        placedAt: '2026-08-01T10:00:00Z',
      },
      {
        productId: p1.id,
        ean: p1.ean,
        articleNo: p1.articleNo,
        name: p1.name,
        shelfId: 'shelf-b3',
        shelfName: 'Raf B3-05 (Satışa Hazır)',
        quantity: 8,
        placedAt: '2026-08-05T14:30:00Z',
      },
      {
        productId: p2.id,
        ean: p2.ean,
        articleNo: p2.articleNo,
        name: p2.name,
        shelfId: 'shelf-c1',
        shelfName: 'Raf C1-04 (Elektronik)',
        quantity: 15,
        placedAt: '2026-08-09T16:00:00Z',
      },
      {
        productId: p5.id,
        ean: p5.ean,
        articleNo: p5.articleNo,
        name: p5.name,
        shelfId: 'shelf-a2',
        shelfName: 'Raf A2-01 (Aksesuar)',
        quantity: 6,
        placedAt: '2026-08-10T11:20:00Z',
      },
    ];
  }

  const { data, error } = await supabase
    .from('shelf_stock')
    .select('product_id, shelf_id, quantity, placed_at, shelves(name, barcode), products(id, ean, article_no, name)')
    .gt('quantity', 0)
    .order('placed_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const shelf = row.shelves as unknown as { name: string | null; barcode: string } | null;
    const prod = row.products as unknown as { id: string; ean: string; article_no: string; name: string } | null;
    return {
      productId: row.product_id,
      ean: prod?.ean ?? '—',
      articleNo: prod?.article_no ?? '—',
      name: prod?.name ?? 'Bilinmeyen Ürün',
      shelfId: row.shelf_id,
      shelfName: shelf?.name ?? shelf?.barcode ?? row.shelf_id,
      quantity: row.quantity,
      placedAt: row.placed_at,
    };
  });
}

export async function listUnplacedProducts(): Promise<UnplacedProductItem[]> {
  if (isDemoMode()) {
    const products = getMockProducts();
    const p3 = products[2];
    const p4 = products[3];
    const p6 = products[5];
    return [
      {
        productId: p3.id,
        ean: p3.ean,
        articleNo: p3.articleNo,
        name: p3.name,
        koliBarkod: 'KL-849201948',
        adet: 8,
        statusText: 'Kolide Girişi Yapıldı (Raflama Bekliyor)',
      },
      {
        productId: p4.id,
        ean: p4.ean,
        articleNo: p4.articleNo,
        name: p4.name,
        koliBarkod: 'KL-849201949',
        adet: 4,
        statusText: 'Kolide Girişi Yapıldı (Raflama Bekliyor)',
      },
      {
        productId: p6.id,
        ean: p6.ean,
        articleNo: p6.articleNo,
        name: p6.name,
        koliBarkod: null,
        adet: 0,
        statusText: 'Katalogda Tanımlı (Henüz Rafı Yok)',
      },
    ];
  }

  const { data: koliUnits, error: koliErr } = await supabase
    .from('koli_urunler')
    .select('product_id, raw_barkod, koliler(barkod), products(id, ean, article_no, name)')
    .order('created_at', { ascending: false });

  if (koliErr) throw new Error(koliErr.message);

  const { data: shelved, error: shelfErr } = await supabase
    .from('shelf_stock')
    .select('product_id')
    .gt('quantity', 0);

  if (shelfErr) throw new Error(shelfErr.message);

  const shelvedProductIds = new Set((shelved ?? []).map((s) => s.product_id));
  const unplacedMap = new Map<string, UnplacedProductItem>();

  for (const row of koliUnits ?? []) {
    const prod = row.products as unknown as { id: string; ean: string; article_no: string; name: string } | null;
    const koli = row.koliler as unknown as { barkod: string } | null;
    if (!prod || shelvedProductIds.has(prod.id)) continue;

    const existing = unplacedMap.get(prod.id);
    if (existing) {
      existing.adet += 1;
    } else {
      unplacedMap.set(prod.id, {
        productId: prod.id,
        ean: prod.ean,
        articleNo: prod.article_no,
        name: prod.name,
        koliBarkod: koli?.barkod ?? row.raw_barkod ?? null,
        adet: 1,
        statusText: 'Kolide Girişi Yapıldı (Raflama Bekliyor)',
      });
    }
  }

  const { data: allProds } = await supabase.from('products').select('id, ean, article_no, name');
  for (const p of allProds ?? []) {
    if (!shelvedProductIds.has(p.id) && !unplacedMap.has(p.id)) {
      unplacedMap.set(p.id, {
        productId: p.id,
        ean: p.ean,
        articleNo: p.article_no,
        name: p.name,
        koliBarkod: null,
        adet: 0,
        statusText: 'Katalogda Tanımlı (Henüz Rafı Yok)',
      });
    }
  }

  return Array.from(unplacedMap.values());
}

