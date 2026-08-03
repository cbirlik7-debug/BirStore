import { registerModule } from '../../shared/permissions/moduleRegistry';
import { DashboardPage } from './DashboardPage';

registerModule({
  id: 'dashboard',
  label: 'Özet',
  path: '/ozet',
  icon: '📊',
  allowedRoles: ['yonetici'],
  element: DashboardPage,
  order: 0,
});
