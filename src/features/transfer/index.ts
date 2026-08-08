import { registerModule } from '../../shared/permissions/moduleRegistry';
import { TransferPage } from './TransferPage';

registerModule({
  id: 'transfer',
  label: 'Transfer / İade',
  path: '/transfer',
  icon: '🔁',
  allowedRoles: ['depocu', 'yonetici'],
  element: TransferPage,
  order: 40,
});
