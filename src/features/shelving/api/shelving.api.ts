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
    const shelves = getDemoShelves();
    const totalAdded = items.reduce((sum, it) => sum + it.quantity, 0);
    const updated = shelves.map((s) => {
      if (s.shelfId === shelfId) {
        return { ...s, kalemSayisi: s.kalemSayisi + items.length, toplamAdet: s.toplamAdet + totalAdded };
      }
      return s;
    });
    setDemoShelves(updated);
    try {
      const existing: PlacedStockRow[] = JSON.parse(localStorage.getItem('birstore_demo_placed_v1') ?? '[]');
      const shelfName = shelves.find((s) => s.shelfId === shelfId)?.name ?? shelfId;
      for (const item of items) {
        const idx = existing.findIndex((r) => r.shelfId === shelfId && r.productId === item.productId);
        if (idx >= 0) { existing[idx].quantity += item.quantity; }
        else { existing.push({ shelfId, shelfName, productId: item.productId, articleNo: item.articleNo, name: item.name, quantity: item.quantity }); }
      }
      localStorage.setItem('birstore_demo_placed_v1', JSON.stringify(existing));
    } catch { /* ignore */ }
    return;
  }
  const payload = items.map((item) => ({ product_id: item.productId, qty: item.quantity }));
  const { error } = await supabase.rpc('commit_shelving', { p_shelf_id: shelfId, p_items: payload });
  if (error) throw new Error(error.message);
}

export interface PlacedStockRow {
  shelfId: string; shelfName: string; productId: string; articleNo: string; name: string; quantity: number;
}

export async function listPlacedStock(): Promise<PlacedStockRow[]> {
  if (isDemoMode()) {
    try {
      const raw = localStorage.getItem('birstore_demo_placed_v1');
      if (!raw) {
        const shelves = getDemoShelves();
        const { getMockProducts } = await import('../../../shared/mock/mockData');
        const products = getMockProducts();
        const demo: PlacedStockRow[] = [
          { shelfId: shelves[0]?.shelfId ?? 'shelf-a1-01', shelfName: shelves[0]?.name ?? 'Raf A1-01', productId: products[0]?.id ?? 'p1', articleNo: products[0]?.articleNo ?? '1001', name: products[0]?.name ?? 'Örnek Ürün 1', quantity: 6 },
          { shelfId: shelves[1]?.shelfId ?? 'shelf-a1-02', shelfName: shelves[1]?.name ?? 'Raf A1-02', productId: products[1]?.id ?? 'p2', articleNo: products[1]?.articleNo ?? '1002', name: products[1]?.name ?? 'Örnek Ürün 2', quantity: 14 },
          { shelfId: shelves[2]?.shelfId ?? 'shelf-b3-05', shelfName: shelves[2]?.name ?? 'Raf B3-05', productId: products[2]?.id ?? 'p3', articleNo: products[2]?.articleNo ?? '1003', name: products[2]?.name ?? 'Örnek Ürün 3', quantity: 8 },
        ];
        localStorage.setItem('birstore_demo_placed_v1', JSON.stringify(demo));
        return demo;
      }
      return JSON.parse(raw);
    } catch { return []; }
  }
  const { data, error } = await supabase.from('shelf_stock').select('quantity, shelves ( id, name, barcode ), products ( id, article_no, name )').gt('quantity', 0);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({ shelfId: row.shelves?.id ?? '', shelfName: row.shelves?.name ?? row.shelves?.barcode ?? '', productId: row.products?.id ?? '', articleNo: row.products?.article_no ?? '', name: row.products?.name ?? '', quantity: row.quantity }));
}

export interface ShelfFormData { barcode: string; name: string; location: string; }

export async function createShelf(data: ShelfFormData): Promise<ShelfSummary> {
  if (isDemoMode()) {
    const shelves = getDemoShelves();
    const newShelf: ShelfSummary = { shelfId: `shelf-${Date.now()}`, barcode: data.barcode.trim() || `RAF-${Date.now()}`, name: data.name.trim() || data.barcode.trim(), location: data.location.trim() || null, kalemSayisi: 0, toplamAdet: 0 };
    setDemoShelves([...shelves, newShelf]);
    return newShelf;
  }
  const { data: inserted, error } = await supabase.from('shelves').insert({ barcode: data.barcode.trim(), name: data.name.trim(), location: data.location.trim() || null }).select('id, barcode, name, location').single();
  if (error || !inserted) throw new Error(error?.message ?? 'Raf oluşturulamadı');
  return { shelfId: inserted.id, barcode: inserted.barcode, name: inserted.name ?? inserted.barcode, location: inserted.location ?? null, kalemSayisi: 0, toplamAdet: 0 };
}

export async function updateShelf(shelfId: string, data: ShelfFormData): Promise<void> {
  if (isDemoMode()) {
    const shelves = getDemoShelves();
    setDemoShelves(shelves.map((s) => s.shelfId === shelfId ? { ...s, barcode: data.barcode.trim() || s.barcode, name: data.name.trim() || s.name, location: data.location.trim() || null } : s));
    return;
  }
  const { error } = await supabase.from('shelves').update({ barcode: data.barcode.trim(), name: data.name.trim(), location: data.location.trim() || null }).eq('id', shelfId);
  if (error) throw new Error(error.message);
}

export async function deleteShelf(shelfId: string): Promise<void> {
  if (isDemoMode()) {
    setDemoShelves(getDemoShelves().filter((s) => s.shelfId !== shelfId));
    return;
  }
  const { error } = await supabase.from('shelves').delete().eq('id', shelfId);
  if (error) throw new Error(error.message);
}
