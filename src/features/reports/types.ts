export interface UnexpectedProduct {
  id: string;
  rawBarkod: string | null;
  koliBarkod: string;
  siparisNo: string | null;
  createdAt: string;
}

export interface DuplicateRecord {
  identifierValue: string;
  koliUrunId: string;
  koliBarkod: string;
  siparisNo: string | null;
  createdAt: string;
}

export interface SupplierPerformance {
  tedarikciId: string;
  tedarikciAdi: string;
  siparisSayisi: number;
  tamamlananSayisi: number;
  tutanakSayisi: number;
  sorunOrani: number;
}

export interface DailyReport {
  tarih: string;
  koliSayisi: number;
  urunSayisi: number;
  tutanakSayisi: number;
  urunDokum: { articleNo: string; productName: string; adet: number }[];
}
