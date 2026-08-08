import { registerModule } from '../../shared/permissions/moduleRegistry';
import { TutanakPage } from './TutanakPage';

registerModule({
  id: 'tutanak',
  label: 'Tutanaklar',
  path: '/tutanaklar',
  icon: '📝',
  allowedRoles: ['depocu', 'yonetici'],
  element: TutanakPage,
  order: 80,
});
