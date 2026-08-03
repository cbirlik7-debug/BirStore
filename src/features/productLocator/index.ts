import { registerModule } from '../../shared/permissions/moduleRegistry';
import { ProductLocatorPage } from './ProductLocatorPage';

registerModule({
  id: 'productLocator',
  label: 'Ürün Nerede',
  path: '/urun-nerede',
  icon: '🔍',
  allowedRoles: ['depocu', 'satis'],
  element: ProductLocatorPage,
  order: 20,
});
