import { registerModule } from '../../shared/permissions/moduleRegistry';
import { OrdersPage } from './OrdersPage';

registerModule({
  id: 'orders',
  label: 'Siparişler',
  path: '/siparisler',
  allowedRoles: ['yonetici'],
  element: OrdersPage,
  order: 50,
});
