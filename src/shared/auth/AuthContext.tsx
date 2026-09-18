import { createContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, isDemoMode, enableDemoMode, disableDemoMode } from '../supabase/client';
import type { Role } from '../permissions/types';

export interface AuthState {
  session: Session | null;
  role: Role | null;
  loading: boolean;
  isDemo: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
}

export const AuthContext = createContext<AuthState | undefined>(undefined);

function createMockSession(): Session {
  return {
    access_token: 'mock-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: 'demo-yonetici-id',
      email: 'yonetici@birstore.local',
      app_metadata: {},
      user_metadata: { ad_soyad: 'Demo Yönetici' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    },
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(isDemoMode());

  useEffect(() => {
    let active = true;

    // Demo modu aktifse doğrudan yönetici oturumu ver
    if (isDemoMode()) {
      setIsDemo(true);
      setSession(createMockSession());
      setRole('yonetici');
      setLoading(false);
      return () => {
        active = false;
      };
    }

    // Supabase yapılandırılmamışsa oturumsuz olarak aç (kullanıcı login/demo ekranını görür)
    if (!isSupabaseConfigured) {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    async function loadRole(userId: string) {
      try {
        const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
        if (active) setRole(data?.role ?? null);
      } catch (err) {
        console.error('Kullanıcı rolü yüklenemedi:', err);
        if (active) setRole(null);
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) {
        loadRole(data.session.user.id).finally(() => active && setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch(() => {
      if (active) setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        setLoading(true);
        loadRole(newSession.user.id).finally(() => active && setLoading(false));
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription?.subscription?.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    if (isDemoMode() || !isSupabaseConfigured) {
      enableDemoMode();
      return { error: null };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    if (isDemoMode()) {
      disableDemoMode();
      setSession(null);
      setRole(null);
      setIsDemo(false);
      return;
    }
    await supabase.auth.signOut();
  }

  function enterDemoMode() {
    enableDemoMode();
  }

  function exitDemoMode() {
    disableDemoMode();
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        role,
        loading,
        isDemo,
        signIn,
        signOut,
        enterDemoMode,
        exitDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
