import { supabase, isDemoMode } from '../../../shared/supabase/client';

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

const MOCK_BOXES: BoxDefinition[] = [
  { barkod: 'KL-849201948', tip: 'eirsaliye', siparisNo: 'SIP-2026-0811', magazaKodu: 'IST-01', uyari: null },
  { barkod: 'KL-193849102', tip: 'kurye', siparisNo: 'SIP-2026-0812', magazaKodu: 'IST-02', uyari: null },
  { barkod: 'KL-992018374', tip: 'standart', siparisNo: 'SIP-2026-0813', magazaKodu: 'ANK-01', uyari: 'Kırılabilir Ürün' },
];

function getDemoBoxes(): BoxDefinition[] {
  try {
    const raw = localStorage.getItem('birstore_demo_boxes');
    return raw ? JSON.parse(raw) : MOCK_BOXES;
  } catch {
    return MOCK_BOXES;
  }
}

function setDemoBoxes(boxes: BoxDefinition[]): void {
  try {
    localStorage.setItem('birstore_demo_boxes', JSON.stringify(boxes));
  } catch (err) {
    console.error('Demo box storage error:', err);
  }
}

export async function listBoxDefinitions(): Promise<BoxDefinition[]> {
  if (isDemoMode()) {
    return getDemoBoxes();
  }

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
  if (isDemoMode()) {
    const current = getDemoBoxes();
    setDemoBoxes([
      {
        barkod: input.barkod,
        tip: input.tip,
        siparisNo: 'SIP-2026-0811',
        magazaKodu: input.magazaKodu,
        uyari: input.uyari,
      },
      ...current,
    ]);
    return;
  }

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
  if (isDemoMode()) {
    const current = getDemoBoxes();
    setDemoBoxes(current.filter((b) => b.barkod !== barkod));
    return;
  }

  const { error } = await supabase.from('koli_tanimlari').delete().eq('barkod', barkod);
  if (error) throw new Error(error.message);
}
