import { registerModule } from '../../shared/permissions/moduleRegistry';
import { DefinitionsPage } from './DefinitionsPage';

registerModule({
  id: 'definitions',
  label: 'Mağaza & Tedarikçi',
  path: '/tanimlar',
  allowedRoles: ['yonetici'],
  element: DefinitionsPage,
  order: 40,
});
