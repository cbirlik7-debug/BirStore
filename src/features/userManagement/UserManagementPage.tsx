import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { listProfiles, updateProfileRole, inviteUser } from './api/userManagement.api';
import type { Role } from '../../shared/permissions/types';
import type { UserProfile } from './types';

const ROLE_LABELS: Record<Role, string> = { depocu: 'Depocu', satis: 'Satış', yonetici: 'Yönetici' };

export function UserManagementPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('depocu');
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      setProfiles(await listProfiles());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kullanıcılar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleRoleChange(id: string, role: Role) {
    setSavingId(id);
    setError(null);
    try {
      await updateProfileRole(id, role);
      setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, role } : p)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Rol güncellenemedi');
    } finally {
      setSavingId(null);
    }
  }

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    setInviting(true);
    setError(null);
    setInviteMessage(null);
    try {
      await inviteUser(email, inviteRole);
      setInviteMessage(`${email} adresine davet gönderildi.`);
      setEmail('');
      setInviteRole('depocu');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Davet gönderilemedi');
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className="user-management-page">
      <h2>Kullanıcı / Rol Yönetimi</h2>

      <form onSubmit={handleInvite} className="catalog-form">
        <label>
          E-posta
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Rol
          <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as Role)}>
            {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={inviting}>
          {inviting ? 'Gönderiliyor...' : 'Kullanıcı Davet Et'}
        </button>
      </form>

      {inviteMessage && <p className="badge badge-green">{inviteMessage}</p>}
      {error && <p role="alert">{error}</p>}

      {loading ? (
        <p>Yükleniyor...</p>
      ) : (
        <div className="table-scroll">
        <table className="catalog-table">
          <thead>
            <tr>
              <th>Ad</th>
              <th>Rol</th>
              <th>Kayıt Tarihi</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id}>
                <td>{p.fullName ?? p.id.slice(0, 8)}</td>
                <td>
                  <select
                    value={p.role}
                    disabled={savingId === p.id}
                    onChange={(e) => handleRoleChange(p.id, e.target.value as Role)}
                  >
                    {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{new Date(p.createdAt).toLocaleDateString('tr-TR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
