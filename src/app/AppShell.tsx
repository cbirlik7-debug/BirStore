import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Nav } from './Nav';
import { useAuth } from '../shared/auth/useAuth';
import { useOfflineQueueStatus } from '../shared/offline/useOfflineQueueStatus';
import { isSupabaseConfigured, isDemoMode } from '../shared/supabase/client';
import { SupabaseConfigModal } from '../shared/supabase/SupabaseConfigModal';
import { getModulesForRole } from '../shared/permissions/moduleRegistry';
import type { Role } from '../shared/permissions/types';

const ROLE_LABELS: Record<Role, string> = {
  yonetici: 'Yönetici Paneli',
  depocu: 'Depo',
  satis: 'Satış',
};

export function AppShell() {
  const { role, signOut } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const location = useLocation();
  const { pending, online } = useOfflineQueueStatus();

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  const demoActive = isDemoMode();
  const modules = getModulesForRole(role);
  // Bottom nav'da gösterilecek max 5 modül (en önemli olanlar)
  const bottomNavModules = modules.slice(0, 5);

  return (
    <div className="app-shell">
      {/* ── Masaüstü sidebar ── */}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', marginBottom: '8px' }}>
            <span className="db-status">
              {demoActive ? '🟡 Demo Modu' : online ? '🟢 Çevrimiçi ✓' : '🔴 Çevrimdışı'}
            </span>
            <button
              type="button"
              onClick={() => setIsConfigOpen(true)}
              style={{
                background: 'transparent',
                border: '1px solid #374151',
                color: isSupabaseConfigured ? '#9ca3af' : '#ea580c',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              ⚙️ {isSupabaseConfigured ? 'Supabase Ayarları' : 'Supabase Bağla'}
            </button>
          </div>
          {pending > 0 && <span className="badge badge-orange">{pending} bekleyen kayıt</span>}
          <button type="button" onClick={() => signOut()}>
            Çıkış
          </button>
        </div>
      </aside>

      {/* ── Overlay: mobilde sidebar açıkken arka planı karartır ── */}
      {navOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobil header ── */}
      <header className="mobile-header">
        <div className="mobile-header-brand">
          <span className="brand-dot" />
          <span className="brand-title">BirStore</span>
        </div>
        <div className="mobile-header-actions">
          {pending > 0 && (
            <span className="mobile-pending-badge">{pending}</span>
          )}
          <span className={`mobile-status-dot ${demoActive ? 'demo' : online ? 'online' : 'offline'}`} />
          <button
            type="button"
            className="mobile-more-btn"
            aria-label="Daha fazla"
            onClick={() => setNavOpen((open) => !open)}
          >
            {navOpen ? '✕' : '⋯'}
          </button>
        </div>
      </header>

      {/* ── Mobil slide-down menü (tüm modüller + çıkış) ── */}
      {navOpen && (
        <div className="mobile-drawer">
          <div className="mobile-drawer-inner">
            <div className="mobile-drawer-status">
              <span className="db-status">
                {demoActive ? '🟡 Demo Modu' : online ? '🟢 Çevrimiçi' : '🔴 Çevrimdışı'}
              </span>
              <button
                type="button"
                className="mobile-drawer-config-btn"
                onClick={() => { setIsConfigOpen(true); setNavOpen(false); }}
              >
                ⚙️ {isSupabaseConfigured ? 'Supabase Ayarları' : 'Supabase Bağla'}
              </button>
            </div>
            <nav className="mobile-drawer-nav">
              {modules.map((m) => (
                <NavLink
                  key={m.id}
                  to={m.path}
                  className={({ isActive }) => isActive ? 'mobile-drawer-link active' : 'mobile-drawer-link'}
                  onClick={() => setNavOpen(false)}
                >
                  <span className="nav-icon">{m.icon}</span>
                  <span>{m.label}</span>
                </NavLink>
              ))}
            </nav>
            <div className="mobile-drawer-footer">
              {pending > 0 && (
                <span className="badge badge-orange">{pending} bekleyen kayıt</span>
              )}
              <button
                type="button"
                className="mobile-signout-btn"
                onClick={() => { signOut(); setNavOpen(false); }}
              >
                🚪 Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="app-main">
        <Outlet />
      </main>

      {/* ── Mobil bottom navigation bar ── */}
      <nav className="bottom-nav" aria-label="Ana menü">
        {bottomNavModules.map((m) => (
          <NavLink
            key={m.id}
            to={m.path}
            className={({ isActive }) => isActive ? 'bottom-nav-item active' : 'bottom-nav-item'}
          >
            <span className="bottom-nav-icon">{m.icon}</span>
            <span className="bottom-nav-label">{m.label}</span>
          </NavLink>
        ))}
        {/* "Daha fazla" butonu: 5+ modül varsa ek menüye açar */}
        {modules.length > 5 && (
          <button
            type="button"
            className={`bottom-nav-item${navOpen ? ' active' : ''}`}
            onClick={() => setNavOpen((o) => !o)}
            aria-label="Daha fazla"
          >
            <span className="bottom-nav-icon">⋯</span>
            <span className="bottom-nav-label">Daha fazla</span>
          </button>
        )}
      </nav>

      <SupabaseConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />
    </div>
  );
}
