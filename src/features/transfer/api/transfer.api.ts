import { supabase } from '../../../shared/supabase/client';
import { runOrQueue, registerOfflineHandler } from '../../../shared/offline/offlineQueue';
import type { IdentifierValues } from '../../../shared/supabase/types';
import type { DepoKodu, TransferSiparis, TransferTip, TransferUnit } from '../types';

export async function listDepoKodlari(): Promise<DepoKodu[]> {
  const { data, error } = await supabase.from('depo_kodlari').select('kod, ad').order('kod');
  if (error) throw new Error(error.message);
  return data ?? [];
}

interface TransferRow {
  id: string;
  transfer_no: string;
  kaynak_depo_kodu: string;
  hedef_depo_kodu: string;
  tip: string;
  aciklama: string | null;
  created_at: string;
}

function mapTransferRow(row: TransferRow): TransferSiparis {
  return {
    id: row.id,
    transferNo: row.transfer_no,
    kaynakDepoKodu: row.kaynak_depo_kodu,
    hedefDepoKodu: row.hedef_depo_kodu,
    tip: row.tip as TransferTip,
    aciklama: row.aciklama,
    createdAt: row.created_at,
  };
}

const TRANSFER_SELECT = 'id, transfer_no, kaynak_depo_kodu, hedef_depo_kodu, tip, aciklama, created_at';

function generateTransferNo(tip: TransferTip): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `${tip === 'iade' ? 'IAD' : 'TRF'}-${rand}`;
}

export async function createTransfer(input: {
  tip: TransferTip;
  kaynakDepoKodu: string;
  hedefDepoKodu: string;
  aciklama: string | null;
}): Promise<TransferSiparis> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const transferNo = generateTransferNo(input.tip);
    const { data, error } = await supabase
      .from('transfer_siparisleri')
      .insert({
        transfer_no: transferNo,
        kaynak_depo_kodu: input.kaynakDepoKodu,
        hedef_depo_kodu: input.hedefDepoKodu,
        tip: input.tip,
        aciklama: input.aciklama,
      })
      .select(TRANSFER_SELECT)
      .single();

    if (!error && data) return mapTransferRow(data);
    if (error && error.code !== '23505') throw new Error(error.message);
  }
  throw new Error('Transfer numarası üretilemedi, tekrar deneyin.');
}

export async function listTransferOptions(): Promise<TransferSiparis[]> {
  const { data, error } = await supabase
    .from('transfer_siparisleri')
    .select(TRANSFER_SELECT)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);
  return ((data ?? []) as TransferRow[]).map(mapTransferRow);
}

interface TransferUrunRow {
  id: string;
  product_id: string | null;
  raw_barkod: string | null;
  identifiers: IdentifierValues;
  beklenmeyen: boolean;
  products: { article_no: string; name: string } | null;
}

export async function listTransferUnits(transferId: string): Promise<TransferUnit[]> {
  const { data, error } = await supabase
    .from('transfer_urunler')
    .select('id, product_id, raw_barkod, identifiers, beklenmeyen, products(article_no, name)')
    .eq('transfer_id', transferId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as TransferUrunRow[]).map((row) => ({
    id: row.id,
    productId: row.product_id,
    articleNo: row.products?.article_no ?? null,
    productName: row.products?.name ?? null,
    rawBarkod: row.raw_barkod,
    identifiers: row.identifiers,
    beklenmeyen: row.beklenmeyen,
  }));
}

interface InsertTransferUnitInput {
  productId?: string | null;
  rawBarkod?: string | null;
  identifiers?: IdentifierValues;
  beklenmeyen?: boolean;
}

async function insertTransferUnitRaw(transferId: string, input: InsertTransferUnitInput): Promise<void> {
  const { error } = await supabase.from('transfer_urunler').insert({
    transfer_id: transferId,
    product_id: input.productId ?? null,
    raw_barkod: input.rawBarkod ?? null,
    identifiers: input.identifiers ?? {},
    beklenmeyen: input.beklenmeyen ?? false,
  });

  if (error) throw new Error(error.message);
}

export async function insertTransferUnit(transferId: string, input: InsertTransferUnitInput): Promise<void> {
  await runOrQueue('transfer.insertUnit', { transferId, input }, () => insertTransferUnitRaw(transferId, input));
}

registerOfflineHandler('transfer.insertUnit', async (payload) => {
  const p = payload as { transferId: string; input: InsertTransferUnitInput };
  await insertTransferUnitRaw(p.transferId, p.input);
});

export async function deleteTransferUnit(id: string): Promise<void> {
  const { error } = await supabase.from('transfer_urunler').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
