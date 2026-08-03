import type { IdentifierValues, RequiredId } from '../../shared/supabase/types';

export interface ActiveBox {
  id: string;
  barkod: string;
  tip: string;
  durum: 'acik' | 'kapali';
  siparisId: string | null;
  siparisNo: string | null;
  magazaKodu: string | null;
  magazaAdi: string | null;
  uyari: string | null;
  reopenLog: { at: string }[];
}

export interface CommittedUnit {
  id: string;
  productId: string | null;
  articleNo: string | null;
  productName: string | null;
  rawBarkod: string | null;
  identifiers: IdentifierValues;
  beklenmeyen: boolean;
}

export interface EntryProduct {
  productId: string;
  articleNo: string;
  name: string;
  requiredIds: RequiredId[];
}

export type ScanMode = 'sirali' | 'birlesik';
