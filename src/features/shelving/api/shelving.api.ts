import { supabase, isDemoMode } from '../../../shared/supabase/client';
import { getMockProducts } from '../../../shared/mock/mockData';
import { listUnplacedProducts } from '../../productLocator/api/productLocator.api';
import type { ActiveShelf, PendingItem } from '../types';

export interface ShelfSummary {
  shelfId: string;
  barcode: string;
  name: string;
  location: string | null;
  kalemSayisi: number;
  toplamAdet: number;
}

export interface WaitingProductItem {
  productId: string;
  ean: string;
  articleNo: string;
  name: string;
  koliBarkod: string | null;
  adet: number;
  statusText: string;
}

const DEFAULT_DEMO_SHELVES: ShelfSummary[] = [
  {
    shelfId: 'shelf-a1-01',
    barcode: 'RAF-A1-01',
    name: 'Raf A1-01',
    location: 'A Koridoru • Kat 1 (Aksesuarlar)',
    kalemSayisi: 1,
    toplamAdet: 6,
  },
  {
    shelfId: 'shelf-a1-02',
    barcode: 'RAF-A1-02',
    name: 'Raf A1-02',
    location: 'A Koridoru • Kat 2 (Telefonlar)',
    kalemSayisi: 1,
    toplamAdet: 14,
  },
  {
    shelfId: 'shelf-b3-05',
    barcode: 'RAF-B3-05',
    name: 'Raf B3-05',
    location: 'B Koridoru • Kat 3 (Satışa Hazır)',
    kalemSayisi: 1,
    toplamAdet: 8,
  },
  {
    shelfId: 'shelf-c1-04',
    barcode: 'RAF-C1-04',
    name: 'Raf C1-04',
    location: 'C Koridoru • Kat 1 (Elektronik)',
    kalemSayisi: 1,
    toplamAdet: 15,
  },
  {
    shelfId: 'shelf-d2-01',
    barcode: 'RAF-D2-01',
    name: 'Raf D2-01',
    location: 'D Koridoru • Kat 2 (Boş / Yedek Alan)',
    kalemSayisi: 0,
    toplamAdet: 0,
  },
];

function getDemoShelves(): ShelfSummary[] {
  try {
    const raw = localStorage.getItem('birstore_demo_shelves_v1');
    return raw ? JSON.parse(raw) : DEFAULT_DEMO_SHELVES;
  } catch {
    return DEFAULT_DEMO_SHELVES;
  }
}

function setDemoShelves(shelves: ShelfSummary[]): void {
  try {
    localStorage.setItem('birstore_demo_shelves_v1', JSON.stringify(shelves));
  } catch {
    // ignore
  }
}

export async function listShelvesWithStockSummary(): Promise<ShelfSummary[]> {
  if (isDemoMode()) {
    return getDemoShelves();
  }

  const [shelvesRes, stockRes] = await Promise.all([
    supabase.from('shelves').select('id, barcode, name, location').order('barcode'),
    supabase.from('shelf_stock').select('shelf_id, quantity').gt('quantity', 0),
  ]);

  if (shelvesRes.error) throw new Error(shelvesRes.error.message);
  if (stockRes.error) throw new Error(stockRes.error.message);

  const statsMap = new Map<string, { kalem: number; toplam: number }>();
  for (const row of stockRes.data ?? []) {
    const prev = statsMap.get(row.shelf_id) ?? { kalem: 0, toplam: 0 };
    statsMap.set(row.shelf_id, {
      kalem: prev.kalem + 1,
      toplam: prev.toplam + row.quantity,
    });
  }

  return (shelvesRes.data ?? []).map((s) => {
    const stats = statsMap.get(s.id) ?? { kalem: 0, toplam: 0 };
    return {
      shelfId: s.id,
      barcode: s.barcode,
      name: s.name ?? s.barcode,
      location: s.location ?? null,
      kalemSayisi: stats.kalem,
      toplamAdet: stats.toplam,
    };
  });
}

export async function lookupShelfByBarcode(barcode: string): Promise<ActiveShelf> {
  const clean = barcode.trim();
  if (isDemoMode()) {
    const shelves = getDemoShelves();
    const found =
      shelves.find(
        (s) =>
          s.barcode.toLowerCase() === clean.toLowerCase() ||
          s.name.toLowerCase() === clean.toLowerCase() ||
          s.shelfId.toLowerCase() === clean.toLowerCase(),
      ) || shelves[0];

    return {
      shelfId: found.shelfId,
      barcode: found.barcode,
      label: `${found.name} (${found.kalemSayisi} Kalem • ${found.toplamAdet} Adet)`,
    };
  }

  const { data, error } = await supabase
    .from('shelves')
    .select('id, barcode, name, location')
    .or(`barcode.eq.${clean},name.ilike.%${clean}%`)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Raf bulunamadı: ${clean}`);
  }

  return {
    shelfId: data.id,
    barcode: data.barcode,
    label: `${data.name ?? data.barcode}${data.location ? ` (${data.location})` : ''}`,
  };
}

export async function lookupProductByEan(
  ean: string,
): Promise<{ productId: string; articleNo: string; name: string }> {
  if (isDemoMode()) {
    const product = getMockProducts().find((p) => p.ean === ean) || getMockProducts()[0];
    return { productId: product.id, articleNo: product.articleNo, name: product.name };
  }

  const { data, error } = await supabase
    .from('products')
    .select('id, article_no, name')
    .eq('ean', ean)
    .single();

  if (error || !data) {
    throw new Error(`Ürün tanımlı değil: ${ean}`);
  }

  return { productId: data.id, articleNo: data.article_no, name: data.name };
}

export async function getWaitingProductsForShelving(): Promise<WaitingProductItem[]> {
  const unplaced = await listUnplacedProducts();
  return unplaced.map((u) => ({
    productId: u.productId,
    ean: u.ean,
    articleNo: u.articleNo,
    name: u.name,
    koliBarkod: u.koliBarkod,
    adet: u.adet,
    statusText: u.statusText,
  }));
}

export async function commitShelving(shelfId: string, items: PendingItem[]): Promise<void> {
  if (isDemoMode()) {
    // Demo modunda raf istatistiklerini yerel olarak güncelle
    const shelves = getDemoShelves();
    const totalAdded = items.reduce((sum, it) => sum + it.quantity, 0);

    const updated = shelves.map((s) => {
      if (s.shelfId === shelfId) {
        return {
          ...s,
          kalemSayisi: s.kalemSayisi + items.length,
          toplamAdet: s.toplamAdet + totalAdded,
        };
      }
      return s;
    });

    setDemoShelves(updated);
    return;
  }

  const payload = items.map((item) => ({ product_id: item.productId, qty: item.quantity }));

  const { error } = await supabase.rpc('commit_shelving', {
    p_shelf_id: shelfId,
    p_items: payload,
  });

  if (error) {
    throw new Error(error.message);
  }
}
