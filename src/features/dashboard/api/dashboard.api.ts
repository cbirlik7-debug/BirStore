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
}

export async function getDashboardData(): Promise<{ stats: DashboardStats; recentOrders: Order[] }> {
  const [orders, products, stores, suppliers, boxDefinitions, boxCounts, unitCount] =
    await Promise.all([
      listOrders(),
      listProducts(),
      listStores(),
      listSuppliers(),
      listBoxDefinitions(),
      getBoxCounts(),
      getUnitCount(),
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
    },
    recentOrders: orders.slice(0, 5),
  };
}
