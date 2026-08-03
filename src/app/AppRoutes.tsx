import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './AppShell';
import { RequireAuth } from '../shared/auth/RequireAuth';
import { RequireRole } from '../shared/auth/RequireRole';
import { LoginPage } from '../features/auth-login/LoginPage';
import { getAllModules, getModulesForRole } from '../shared/permissions/moduleRegistry';
import { useAuth } from '../shared/auth/useAuth';

export function AppRoutes() {
  const modules = getAllModules();
  const { role } = useAuth();
  const firstAccessiblePath = getModulesForRole(role)[0]?.path ?? '/giris';

  return (
    <Routes>
      <Route path="/giris" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to={firstAccessiblePath} replace />} />
          {modules.map((m) => (
            <Route key={m.id} element={<RequireRole allow={m.allowedRoles} />}>
              <Route path={m.path.replace(/^\//, '')} element={<m.element />} />
            </Route>
          ))}
        </Route>
      </Route>
    </Routes>
  );
}
