export interface OrderLineItem {
  productId: string;
  articleNo: string;
  productName: string;
  beklenen: number;
}

export interface Order {
  id: string;
  siparisNo: string;
  tedarikciAdi: string | null;
  irsaliyeNo: string | null;
  createdAt: string;
  items: OrderLineItem[];
}
