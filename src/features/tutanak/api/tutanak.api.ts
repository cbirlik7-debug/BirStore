import { supabase } from '../../../shared/supabase/client';
import type { Tutanak, TutanakDurum, TutanakLine } from '../types';

interface TutanakRow {
  id: string;
  siparis_id: string | null;
  tutanak_no: string;
  created_at: string;
  siparisler: { siparis_no: string } | null;
  tutanak_satirlari: {
    id: string;
    product_id: string | null;
    durum: string;
    adet: number;
    aciklama: string | null;
    foto_url: string | null;
    products: { article_no: string; name: string } | null;
  }[];
}

const TUTANAK_SELECT =
  'id, siparis_id, tutanak_no, created_at, siparisler(siparis_no), tutanak_satirlari(id, product_id, durum, adet, aciklama, foto_url, products(article_no, name))';

function mapTutanakRow(row: TutanakRow): Tutanak {
  return {
    id: row.id,
    siparisId: row.siparis_id,
    siparisNo: row.siparisler?.siparis_no ?? null,
    tutanakNo: row.tutanak_no,
    createdAt: row.created_at,
    satirlar: row.tutanak_satirlari.map((s) => ({
      id: s.id,
      productId: s.product_id,
      articleNo: s.products?.article_no ?? null,
      productName: s.products?.name ?? null,
      durum: s.durum as TutanakLine['durum'],
      adet: s.adet,
      aciklama: s.aciklama,
      fotoUrl: s.foto_url,
    })),
  };
}

export async function listTutanaklar(): Promise<Tutanak[]> {
  const { data, error } = await supabase
    .from('tutanaklar')
    .select(TUTANAK_SELECT)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as TutanakRow[]).map(mapTutanakRow);
}

function generateTutanakNo(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `TUT-${rand}`;
}

export async function createTutanak(siparisId: string | null): Promise<{ id: string; tutanakNo: string }> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const tutanakNo = generateTutanakNo();
    const { data, error } = await supabase
      .from('tutanaklar')
      .insert({ siparis_id: siparisId, tutanak_no: tutanakNo })
      .select('id, tutanak_no')
      .single();

    if (!error && data) return { id: data.id, tutanakNo: data.tutanak_no };
    if (error && error.code !== '23505') throw new Error(error.message);
  }
  throw new Error('Tutanak numarası üretilemedi, tekrar deneyin.');
}

export async function addTutanakLine(
  tutanakId: string,
  input: {
    productId: string | null;
    durum: TutanakDurum;
    adet: number;
    aciklama: string | null;
    fotoUrl: string | null;
  },
): Promise<void> {
  const { error } = await supabase.from('tutanak_satirlari').insert({
    tutanak_id: tutanakId,
    product_id: input.productId,
    durum: input.durum,
    adet: input.adet,
    aciklama: input.aciklama,
    foto_url: input.fotoUrl,
  });

  if (error) throw new Error(error.message);
}

export async function deleteTutanakLine(id: string): Promise<void> {
  const { error } = await supabase.from('tutanak_satirlari').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteTutanak(id: string): Promise<void> {
  const { error } = await supabase.from('tutanaklar').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function uploadTutanakFoto(file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('tutanak-fotograflari').upload(path, file);
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('tutanak-fotograflari').getPublicUrl(path);
  return data.publicUrl;
}
