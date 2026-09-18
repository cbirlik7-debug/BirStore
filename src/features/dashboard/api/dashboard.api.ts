import { supabase, isDemoMode } from '../../../shared/supabase/client';
import { listOrders } from '../../orders/api/orders.api';
import { listProducts } from '../../catalog/api/catalog.api';
import { listStores, listSuppliers } from '../../definitions/api/definitions.api';
import { listBoxDefinitions } from '../../boxDefinitions/api/boxDefinitions.api';
import { getBoxCounts, getUnitCount } from '../../goodsReceiving/api/goodsReceiving.api';
import { MOCK_ORDERS } from '../../../shared/mock/mockData';
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
  if (isDemoMode()) {
    return {
      stats: {
        siparisSayisi: 3,
        koliTanimSayisi: 3,
        urunSayisi: 6,
        magazaSayisi: 4,
        tedarikciSayisi: 5,
        okutulanKoli: 18,
        acikKoli: 4,
        okutulanUrun: 45,
        tamamlananSiparis: 1,
      },
      recentOrders: MOCK_ORDERS,
    };
  }

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
