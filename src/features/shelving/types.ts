export interface PendingItem {
  productId: string;
  ean: string;
  articleNo: string;
  name: string;
  quantity: number;
}

export interface ActiveShelf {
  shelfId: string;
  barcode: string;
  label: string;
}
