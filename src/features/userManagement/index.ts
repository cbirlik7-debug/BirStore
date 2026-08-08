import { registerModule } from '../../shared/permissions/moduleRegistry';
import { UserManagementPage } from './UserManagementPage';

registerModule({
  id: 'userManagement',
  label: 'Kullanıcılar',
  path: '/kullanicilar',
  icon: '👤',
  allowedRoles: ['yonetici'],
  element: UserManagementPage,
  order: 100,
});
