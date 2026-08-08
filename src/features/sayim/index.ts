import { registerModule } from '../../shared/permissions/moduleRegistry';
import { SayimPage } from './SayimPage';

registerModule({
  id: 'sayim',
  label: 'Sayım',
  path: '/sayim',
  icon: '🧮',
  allowedRoles: ['depocu', 'yonetici'],
  element: SayimPage,
  order: 45,
});
