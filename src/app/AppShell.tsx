import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Nav } from './Nav';
import { useAuth } from '../shared/auth/useAuth';
import type { Role } from '../shared/permissions/types';

const ROLE_LABELS: Record<Role, string> = {
  yonetici: 'Yönetici Paneli',
  depocu: 'Depo',
  satis: 'Satış',
};

export function AppShell() {
  const { role, signOut } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <aside className={navOpen ? 'sidebar nav-open' : 'sidebar'}>
        <div className="sidebar-brand">
          <span className="brand-dot" />
          <div>
            <div className="brand-title">BirStore</div>
            <div className="brand-subtitle">{role ? ROLE_LABELS[role] : ''}</div>
          </div>
          <button
            type="button"
            className="menu-toggle"
            aria-label="Menü"
            onClick={() => setNavOpen((open) => !open)}
          >
            {navOpen ? '✕' : '☰'}
          </button>
        </div>
        <Nav />
        <div className="sidebar-footer">
          <span className="db-status">Veritabanı: bağlı ✓</span>
          <button type="button" onClick={() => signOut()}>
            Çıkış
          </button>
        </div>
      </aside>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
