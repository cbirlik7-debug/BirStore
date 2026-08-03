import { listOrders } from '../../orders/api/orders.api';
import { listProducts } from '../../catalog/api/catalog.api';
import { listStores, listSuppliers } from '../../definitions/api/definitions.api';
import { listBoxDefinitions } from '../../boxDefinitions/api/boxDefinitions.api';
import type { Order } from '../../orders/types';

export interface DashboardStats {
  siparisSayisi: number;
  koliTanimSayisi: number;
  urunSayisi: number;
  magazaSayisi: number;
  tedarikciSayisi: number;
}

export async function getDashboardData(): Promise<{ stats: DashboardStats; recentOrders: Order[] }> {
  const [orders, products, stores, suppliers, boxDefinitions] = await Promise.all([
    listOrders(),
    listProducts(),
    listStores(),
    listSuppliers(),
    listBoxDefinitions(),
  ]);

  return {
    stats: {
      siparisSayisi: orders.length,
      koliTanimSayisi: boxDefinitions.length,
      urunSayisi: products.length,
      magazaSayisi: stores.length,
      tedarikciSayisi: suppliers.length,
    },
    recentOrders: orders.slice(0, 5),
  };
}
