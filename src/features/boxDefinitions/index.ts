import { registerModule } from '../../shared/permissions/moduleRegistry';
import { BoxDefinitionsPage } from './BoxDefinitionsPage';

registerModule({
  id: 'boxDefinitions',
  label: 'Koli Tanımları',
  path: '/koli-tanimlari',
  icon: '📦',
  allowedRoles: ['yonetici'],
  element: BoxDefinitionsPage,
  order: 60,
});
