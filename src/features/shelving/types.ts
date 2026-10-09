export interface PendingItem {
  productId: string;
  ean: string;
  articleNo: string;
  name: string;
  quantity: number;
  /** Eklenebilecek maksimum miktar (bekleyen stok). Tanımlıysa aşılamaz. */
  maxQuantity?: number;
}

export interface ActiveShelf {
  shelfId: string;
  barcode: string;
  label: string;
}
