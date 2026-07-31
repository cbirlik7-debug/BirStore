import { Outlet } from 'react-router-dom';
import { useAuth } from './useAuth';
import type { Role } from '../permissions/types';

export function RequireRole({ allow }: { allow: Role[] }) {
  const { role } = useAuth();
  const allowed = role === 'yonetici' || (role !== null && allow.includes(role));

  if (!allowed) {
    return <p>Bu sayfayı görüntüleme yetkiniz yok.</p>;
  }

  return <Outlet />;
}
