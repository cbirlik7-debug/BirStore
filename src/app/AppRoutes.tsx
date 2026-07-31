import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './AppShell';
import { RequireAuth } from '../shared/auth/RequireAuth';
import { RequireRole } from '../shared/auth/RequireRole';
import { LoginPage } from '../features/auth-login/LoginPage';
import { getAllModules } from '../shared/permissions/moduleRegistry';

export function AppRoutes() {
  const modules = getAllModules();

  return (
    <Routes>
      <Route path="/giris" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to={modules[0]?.path ?? '/giris'} replace />} />
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
