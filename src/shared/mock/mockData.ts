import type { CatalogProduct } from '../../features/catalog/types';
import type { Order } from '../../features/orders/types';
import type { OrderProgress } from '../../features/orderTracking/types';

export interface Store {
  kod: string;
  ad: string;
}

export interface Supplier {
  id: string;
  ad: string;
}

export interface BoxDefinition {
  barkod: string;
  tip: string;
  siparisNo: string | null;
  magazaKodu: string | null;
  uyari: string | null;
}

export const INITIAL_STORES: Store[] = [
  { kod: 'IST-01', ad: 'MediaMarkt Meydan İstanbul' },
  { kod: 'IST-02', ad: 'MediaMarkt Vadistanbul' },
  { kod: 'ANK-01', ad: 'MediaMarkt Ankamall' },
  { kod: 'IZM-01', ad: 'MediaMarkt Forum Bornova' },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 'sup-1', ad: 'Apple Türkiye Dağıtım Ltd.' },
  { id: 'sup-2', ad: 'Samsung Elektronik A.Ş.' },
  { id: 'sup-3', ad: 'Sony Eurasia Pazarlama' },
  { id: 'sup-4', ad: 'Philips Ev Aletleri Tic.' },
  { id: 'sup-5', ad: 'Dyson Turkey Elektrikli Ürünler' },
];

export const INITIAL_PRODUCTS: CatalogProduct[] = [
  {
    id: 'prod-1',
    ean: '0195949038419',
    articleNo: 'MM-IP15P-256',
    name: 'Apple iPhone 15 Pro 256GB Titanyum',
    requiredIds: ['IMEI1', 'IMEI2', 'SERIAL'],
  },
  {
    id: 'prod-2',
    ean: '8806095392019',
    articleNo: 'MM-SGS24U-512',
    name: 'Samsung Galaxy S24 Ultra 512GB Gri',
    requiredIds: ['IMEI1', 'IMEI2', 'SERIAL'],
  },
  {
    id: 'prod-3',
    ean: '4548736132580',
    articleNo: 'MM-SNY-WH1000XM5',
    name: 'Sony WH-1000XM5 Kablosuz Kulaklık Siyah',
    requiredIds: ['SERIAL'],
  },
  {
    id: 'prod-4',
    ean: '8710103982914',
    articleNo: 'MM-PHL-HD9285',
    name: 'Philips HD9285/90 Airfryer XXL Akıllı Fritöz',
    requiredIds: ['SERIAL'],
  },
  {
    id: 'prod-5',
    ean: '0195949012345',
    articleNo: 'MM-AW-S9-45',
    name: 'Apple Watch Series 9 GPS 45mm Gece Yarısı',
    requiredIds: ['SERIAL'],
  },
  {
    id: 'prod-6',
    ean: '8806091823912',
    articleNo: 'MM-LG-55C3',
    name: 'LG OLED55C3 55" 4K Smart OLED TV',
    requiredIds: ['SERIAL'],
  },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-1',
    siparisNo: 'SIP-2026-0811',
    tedarikciAdi: 'Apple Türkiye Dağıtım Ltd.',
    irsaliyeNo: 'IRS-982310',
    createdAt: '2026-08-11T09:30:00Z',
    items: [
      { productId: 'prod-1', articleNo: 'MM-IP15P-256', productName: 'Apple iPhone 15 Pro 256GB Titanyum', beklenen: 20 },
      { productId: 'prod-5', articleNo: 'MM-AW-S9-45', productName: 'Apple Watch Series 9 GPS 45mm Gece Yarısı', beklenen: 10 },
    ],
  },
  {
    id: 'ord-2',
    siparisNo: 'SIP-2026-0812',
    tedarikciAdi: 'Samsung Elektronik A.Ş.',
    irsaliyeNo: 'IRS-441290',
    createdAt: '2026-08-11T11:15:00Z',
    items: [
      { productId: 'prod-2', articleNo: 'MM-SGS24U-512', productName: 'Samsung Galaxy S24 Ultra 512GB Gri', beklenen: 15 },
    ],
  },
  {
    id: 'ord-3',
    siparisNo: 'SIP-2026-0813',
    tedarikciAdi: 'Sony Eurasia Pazarlama',
    irsaliyeNo: 'IRS-110294',
    createdAt: '2026-08-10T14:40:00Z',
    items: [
      { productId: 'prod-3', articleNo: 'MM-SNY-WH1000XM5', productName: 'Sony WH-1000XM5 Kablosuz Kulaklık Siyah', beklenen: 25 },
    ],
  },
];

export const MOCK_ORDER_PROGRESS: OrderProgress[] = [
  {
    id: 'ord-1',
    siparisNo: 'SIP-2026-0811',
    tedarikciAdi: 'Apple Türkiye Dağıtım Ltd.',
    beklenenToplam: 30,
    girilenToplam: 22,
    kayitNo: null,
  },
  {
    id: 'ord-2',
    siparisNo: 'SIP-2026-0812',
    tedarikciAdi: 'Samsung Elektronik A.Ş.',
    beklenenToplam: 15,
    girilenToplam: 15,
    kayitNo: 'KYT-904128',
  },
  {
    id: 'ord-3',
    siparisNo: 'SIP-2026-0813',
    tedarikciAdi: 'Sony Eurasia Pazarlama',
    beklenenToplam: 25,
    girilenToplam: 8,
    kayitNo: null,
  },
];

function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`birstore_demo_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`birstore_demo_${key}`, JSON.stringify(value));
  } catch (err) {
    console.error('Demo storage error:', err);
  }
}

export function getMockProducts(): CatalogProduct[] {
  return getStored('products', INITIAL_PRODUCTS);
}

export function addMockProduct(p: CatalogProduct): void {
  const current = getMockProducts();
  setStored('products', [p, ...current]);
}

export function removeMockProduct(id: string): void {
  const current = getMockProducts();
  setStored('products', current.filter((p) => p.id !== id));
}

export function getMockStores(): Store[] {
  return getStored('stores', INITIAL_STORES);
}

export function addMockStore(s: Store): void {
  const current = getMockStores();
  setStored('stores', [...current, s]);
}

export function removeMockStore(kod: string): void {
  const current = getMockStores();
  setStored('stores', current.filter((s) => s.kod !== kod));
}

export function getMockSuppliers(): Supplier[] {
  return getStored('suppliers', INITIAL_SUPPLIERS);
}

export function addMockSupplier(s: Supplier): void {
  const current = getMockSuppliers();
  setStored('suppliers', [...current, s]);
}

export function removeMockSupplier(id: string): void {
  const current = getMockSuppliers();
  setStored('suppliers', current.filter((s) => s.id !== id));
}

export function getMockOrders(): Order[] {
  return getStored('orders', MOCK_ORDERS);
}

export function addMockOrder(o: Order): void {
  const current = getMockOrders();
  setStored('orders', [o, ...current]);
}
