import type { IdentifierValues, RequiredId } from '../../shared/supabase/types';
import type { DuplicateMatch, EntryProduct } from '../goodsReceiving/types';

export type TransferTip = 'transfer' | 'iade';

export interface DepoKodu {
  kod: string;
  ad: string;
}

export interface TransferSiparis {
  id: string;
  transferNo: string;
  kaynakDepoKodu: string;
  hedefDepoKodu: string;
  tip: TransferTip;
  aciklama: string | null;
  createdAt: string;
}

export interface TransferUnit {
  id: string;
  productId: string | null;
  articleNo: string | null;
  productName: string | null;
  rawBarkod: string | null;
  identifiers: IdentifierValues;
  beklenmeyen: boolean;
}

export interface TransferCaptureState {
  ean: string;
  product: EntryProduct | null;
  isUnexpected: boolean;
  identifiers: IdentifierValues;
  targetField: RequiredId | null;
  duplicateWarning: DuplicateMatch | null;
}
