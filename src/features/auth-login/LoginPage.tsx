import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../shared/auth/useAuth';
import { isSupabaseConfigured } from '../../shared/supabase/client';
import { SupabaseConfigModal } from '../../shared/supabase/SupabaseConfigModal';

export function LoginPage() {
  const { session, signIn, enterDemoMode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  if (session) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await signIn(email, password);
    setSubmitting(false);
    if (signInError) setError(signInError);
  }

  return (
    <div style={{ padding: '20px' }}>
      <form onSubmit={handleSubmit} className="login-form" style={{ maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 4px 0', color: '#ea580c' }}>
            BirStore
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#9ca3af' }}>
            Depo & Mal Kabul Operasyon Sistemi
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div
            style={{
              background: 'rgba(234, 88, 12, 0.1)',
              border: '1px solid rgba(234, 88, 12, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '0.85rem',
              color: '#fdba74',
              lineHeight: 1.4,
            }}
          >
            <strong>ℹ️ Supabase Yapılandırması:</strong>
            <p style={{ margin: '6px 0 0 0' }}>
              Projeye ait Supabase URL/Key henüz tanımlanmadı. Sistemi doğrudan test etmek için aşağıdaki <strong>Demo Modu</strong> butonunu kullanabilirsiniz.
            </p>
          </div>
        )}

        <label>
          E-posta
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@mediamarkt.com.tr"
            required={isSupabaseConfigured}
          />
        </label>
        <label>
          Şifre
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required={isSupabaseConfigured}
          />
        </label>
        {error && <p role="alert" style={{ color: '#f87171', fontSize: '0.85rem' }}>{error}</p>}

        <button type="submit" disabled={submitting} className="btn-accept">
          {submitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>

        <button
          type="button"
          onClick={() => enterDemoMode()}
          style={{
            padding: '10px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: '4px',
          }}
        >
          🚀 Demo Moduyla Başlat (Önizleme)
        </button>

        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <button
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              fontSize: '0.8rem',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            ⚙️ Supabase Bağlantı Ayarları
          </button>
        </div>
      </form>

      <SupabaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </div>
  );
}
