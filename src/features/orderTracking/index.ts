import { registerModule } from '../../shared/permissions/moduleRegistry';
import { OrderTrackingPage } from './OrderTrackingPage';

registerModule({
  id: 'orderTracking',
  label: 'Sipariş Kontrol',
  path: '/siparis-kontrol',
  icon: '📈',
  allowedRoles: ['depocu'],
  element: OrderTrackingPage,
  order: 70,
});
