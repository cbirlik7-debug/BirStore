import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './useAuth';

export function RequireAuth() {
  const { session, loading } = useAuth();

  if (loading) return <p>Yükleniyor...</p>;
  if (!session) return <Navigate to="/giris" replace />;

  return <Outlet />;
}
