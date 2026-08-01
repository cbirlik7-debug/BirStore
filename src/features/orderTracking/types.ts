export interface OrderProgress {
  id: string;
  siparisNo: string;
  tedarikciAdi: string | null;
  beklenenToplam: number;
  girilenToplam: number;
}

export interface OrderItemProgress {
  productId: string;
  articleNo: string;
  productName: string;
  beklenen: number;
  girilen: number;
}
