export type TutanakDurum = 'eksik' | 'fazla' | 'hasarli';

export interface TutanakLine {
  id: string;
  productId: string | null;
  articleNo: string | null;
  productName: string | null;
  durum: TutanakDurum;
  adet: number;
  aciklama: string | null;
  fotoUrl: string | null;
}

export interface Tutanak {
  id: string;
  siparisId: string | null;
  siparisNo: string | null;
  tutanakNo: string;
  createdAt: string;
  satirlar: TutanakLine[];
}
