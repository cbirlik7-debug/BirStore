import { supabase } from '../../../shared/supabase/client';
import { listOrders } from '../../orders/api/orders.api';
import { listProducts } from '../../catalog/api/catalog.api';
import { listStores, listSuppliers } from '../../definitions/api/definitions.api';
import { listBoxDefinitions } from '../../boxDefinitions/api/boxDefinitions.api';
import { getBoxCounts, getUnitCount } from '../../goodsReceiving/api/goodsReceiving.api';
import type { Order } from '../../orders/types';

export interface DashboardStats {
  siparisSayisi: number;
  koliTanimSayisi: number;
  urunSayisi: number;
  magazaSayisi: number;
  tedarikciSayisi: number;
  okutulanKoli: number;
  acikKoli: number;
  okutulanUrun: number;
  tamamlananSiparis: number;
}

async function getCompletedOrderCount(): Promise<number> {
  const { count, error } = await supabase
    .from('tamamlanan_siparisler')
    .select('siparis_id', { count: 'exact', head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getDashboardData(): Promise<{ stats: DashboardStats; recentOrders: Order[] }> {
  const [orders, products, stores, suppliers, boxDefinitions, boxCounts, unitCount, tamamlananSiparis] =
    await Promise.all([
      listOrders(),
      listProducts(),
      listStores(),
      listSuppliers(),
      listBoxDefinitions(),
      getBoxCounts(),
      getUnitCount(),
      getCompletedOrderCount(),
    ]);

  return {
    stats: {
      siparisSayisi: orders.length,
      koliTanimSayisi: boxDefinitions.length,
      urunSayisi: products.length,
      magazaSayisi: stores.length,
      tedarikciSayisi: suppliers.length,
      okutulanKoli: boxCounts.total,
      acikKoli: boxCounts.acik,
      okutulanUrun: unitCount,
      tamamlananSiparis,
    },
    recentOrders: orders.slice(0, 5),
  };
}
