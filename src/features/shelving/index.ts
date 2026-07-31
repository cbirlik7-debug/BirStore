import { registerModule } from '../../shared/permissions/moduleRegistry';
import { ShelvingPage } from './ShelvingPage';

registerModule({
  id: 'shelving',
  label: 'Ürün İstifle',
  path: '/istifle',
  allowedRoles: ['depocu'],
  element: ShelvingPage,
  order: 10,
});
