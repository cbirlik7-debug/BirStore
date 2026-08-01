import { supabase } from '../../../shared/supabase/client';

export interface BoxDefinition {
  barkod: string;
  tip: string;
  siparisNo: string | null;
  magazaKodu: string | null;
  uyari: string | null;
}

interface BoxDefinitionRow {
  barkod: string;
  tip: string;
  magaza_kodu: string | null;
  uyari: string | null;
  siparisler: { siparis_no: string } | null;
}

export async function listBoxDefinitions(): Promise<BoxDefinition[]> {
  const { data, error } = await supabase
    .from('koli_tanimlari')
    .select('barkod, tip, magaza_kodu, uyari, siparisler(siparis_no)')
    .order('barkod');

  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as BoxDefinitionRow[]).map((row) => ({
    barkod: row.barkod,
    tip: row.tip,
    siparisNo: row.siparisler?.siparis_no ?? null,
    magazaKodu: row.magaza_kodu,
    uyari: row.uyari,
  }));
}

export async function createBoxDefinition(input: {
  barkod: string;
  tip: string;
  siparisId: string | null;
  magazaKodu: string | null;
  uyari: string | null;
}): Promise<void> {
  const { error } = await supabase.from('koli_tanimlari').insert({
    barkod: input.barkod,
    tip: input.tip,
    siparis_id: input.siparisId,
    magaza_kodu: input.magazaKodu,
    uyari: input.uyari,
  });
  if (error) throw new Error(error.message);
}

export async function deleteBoxDefinition(barkod: string): Promise<void> {
  const { error } = await supabase.from('koli_tanimlari').delete().eq('barkod', barkod);
  if (error) throw new Error(error.message);
}
