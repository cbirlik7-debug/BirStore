export interface Sayim {
  id: string;
  ad: string;
  baslangic: string;
  bitis: string | null;
  durum: 'acik' | 'kapali';
}

export interface ShelfLockInfo {
  shelfId: string;
  sayimId: string;
  kilitleyenUserId: string;
  kilitleyenAdi: string | null;
  kilitlendiAt: string;
}

export interface SayimCountItem {
  productId: string;
  articleNo: string;
  name: string;
  adet: number;
}

export interface ShelfDiscrepancy {
  shelfId: string;
  shelfLabel: string;
  productId: string;
  articleNo: string;
  productName: string;
  beklenen: number;
  sayilan: number;
  fark: number;
}
