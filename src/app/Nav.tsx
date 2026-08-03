import { NavLink } from 'react-router-dom';
import { useAuth } from '../shared/auth/useAuth';
import { getModulesForRole } from '../shared/permissions/moduleRegistry';

export function Nav() {
  const { role } = useAuth();
  const modules = getModulesForRole(role);

  return (
    <nav className="sidebar-nav">
      {modules.map((m) => (
        <NavLink
          key={m.id}
          to={m.path}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="nav-icon">{m.icon}</span>
          <span>{m.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
