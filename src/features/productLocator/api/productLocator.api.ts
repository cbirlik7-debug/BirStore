import { supabase } from '../../../shared/supabase/client';
import { listOrders } from '../../orders/api/orders.api';
import { countUnitsByProductForOrder } from '../../goodsReceiving/api/goodsReceiving.api';
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
