import { registerModule } from '../../shared/permissions/moduleRegistry';
import { CatalogPage } from './CatalogPage';

registerModule({
  id: 'catalog',
  label: 'Ürün Kataloğu',
  path: '/katalog',
  icon: '🏷️',
  allowedRoles: ['yonetici'],
  element: CatalogPage,
  order: 30,
});
