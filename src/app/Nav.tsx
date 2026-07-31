import { NavLink } from 'react-router-dom';
import { useAuth } from '../shared/auth/useAuth';
import { getModulesForRole } from '../shared/permissions/moduleRegistry';

export function Nav() {
  const { role, signOut } = useAuth();
  const modules = getModulesForRole(role);

  return (
    <nav className="app-nav">
      {modules.map((m) => (
        <NavLink key={m.id} to={m.path}>
          {m.label}
        </NavLink>
      ))}
      <button type="button" onClick={() => signOut()}>
        Çıkış
      </button>
    </nav>
  );
}
