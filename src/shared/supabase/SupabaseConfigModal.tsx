import { useState } from 'react';
import {
  supabaseUrl,
  supabaseAnonKey,
  isSupabaseConfigured,
  saveSupabaseConfig,
  clearSupabaseConfig,
  isDemoMode,
  enableDemoMode,
  disableDemoMode,
} from './client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SupabaseConfigModal({ isOpen, onClose }: Props) {
  const [url, setUrl] = useState(supabaseUrl || '');
  const [key, setKey] = useState(supabaseAnonKey || '');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || !key.trim()) {
      setError('Lütfen hem Supabase URL hem de Anon Key değerlerini doldurun.');
      return;
    }
    if (!url.startsWith('https://') && !url.startsWith('http://')) {
      setError('Supabase URL "https://" ile başlamalıdır.');
      return;
    }
    setError(null);
    saveSupabaseConfig(url, key);
  }

  function handleClear() {
    if (confirm('Kayıtlı Supabase bağlantı bilgilerini silmek istediğinize emin misiniz?')) {
      clearSupabaseConfig();
    }
  }

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem',
    }}>
      <div className="modal-content" style={{
        background: '#1b1f27',
        color: '#f3f4f6',
        borderRadius: '12px',
        maxWidth: '540px',
        width: '100%',
        padding: '1.5rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        border: '1px solid #374151',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
            ⚙️ Supabase Yapılandırması
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              fontSize: '1.5rem',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '1rem' }}>
          Projenizin veritabanı bağlantı bilgilerini buradan girebilirsiniz. Bilgiler tarayıcınızın yerel hafızasında saklanır ve re-build gerekmeden anında devreye girer.
        </p>

        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          background: isSupabaseConfigured ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${isSupabaseConfigured ? '#10b981' : '#ef4444'}`,
          marginBottom: '1rem',
          fontSize: '0.85rem',
        }}>
          <strong>Durum: </strong>
          {isSupabaseConfigured ? (
            <span style={{ color: '#10b981' }}>Bağlantı Yapılandırıldı ✓</span>
          ) : (
            <span style={{ color: '#f87171' }}>Bağlantı Bilgileri Tanımlanmadı (Demo Modu Etkin)</span>
          )}
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
              VITE_SUPABASE_URL
            </label>
            <input
              type="text"
              placeholder="https://xxxxxxxx.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: '6px',
                border: '1px solid #4b5563',
                background: '#111827',
                color: '#fff',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
              VITE_SUPABASE_ANON_KEY
            </label>
            <textarea
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: '6px',
                border: '1px solid #4b5563',
                background: '#111827',
                color: '#fff',
                fontSize: '0.85rem',
                boxSizing: 'border-box',
                fontFamily: 'monospace',
              }}
            />
          </div>

          {error && (
            <div style={{ color: '#f87171', fontSize: '0.85rem' }}>{error}</div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '0.6rem 1rem',
                background: '#ea580c',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Kaydet ve Bağlan
            </button>

            {isSupabaseConfigured && (
              <button
                type="button"
                onClick={handleClear}
                style={{
                  padding: '0.6rem 1rem',
                  background: '#374151',
                  color: '#f87171',
                  border: '1px solid #4b5563',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Bilgileri Sıfırla
              </button>
            )}
          </div>
        </form>

        <hr style={{ border: 'none', borderTop: '1px solid #374151', margin: '1.25rem 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
            {isDemoMode() ? '🟡 Demo Modu Aktif' : '🟢 Canlı Mod Aktif'}
          </span>
          <button
            type="button"
            onClick={() => (isDemoMode() ? disableDemoMode() : enableDemoMode())}
            style={{
              padding: '0.4rem 0.8rem',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            {isDemoMode() ? 'Demo Modundan Çık' : 'Demo Moduna Geç'}
          </button>
        </div>
      </div>
    </div>
  );
}
