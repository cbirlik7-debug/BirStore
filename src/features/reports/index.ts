import { registerModule } from '../../shared/permissions/moduleRegistry';
import { ReportsPage } from './ReportsPage';

registerModule({
  id: 'reports',
  label: 'Raporlar',
  path: '/raporlar',
  icon: '📊',
  allowedRoles: ['yonetici'],
  element: ReportsPage,
  order: 90,
});
