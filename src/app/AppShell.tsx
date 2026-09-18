import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Nav } from './Nav';
import { useAuth } from '../shared/auth/useAuth';
import { useOfflineQueueStatus } from '../shared/offline/useOfflineQueueStatus';
import { isSupabaseConfigured, isDemoMode } from '../shared/supabase/client';
import { SupabaseConfigModal } from '../shared/supabase/SupabaseConfigModal';
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
      <main className="app-main">
        <Outlet />
      </main>

      <SupabaseConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />
    </div>
  );
}
