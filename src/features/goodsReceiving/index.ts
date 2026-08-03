import { registerModule } from '../../shared/permissions/moduleRegistry';
import { GoodsReceivingPage } from './GoodsReceivingPage';

registerModule({
  id: 'goodsReceiving',
  label: 'Mal Kabul',
  path: '/mal-kabul',
  icon: '📥',
  allowedRoles: ['depocu'],
  element: GoodsReceivingPage,
  order: 5,
});
