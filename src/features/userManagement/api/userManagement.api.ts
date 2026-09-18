import { supabase, isDemoMode } from '../../../shared/supabase/client';
import type { Role } from '../../../shared/permissions/types';
import type { UserProfile } from '../types';

export async function listProfiles(): Promise<UserProfile[]> {
  if (isDemoMode()) {
    return [
      { id: 'usr-1', fullName: 'Can Birlik (Yönetici)', role: 'yonetici', createdAt: '2026-08-01T10:00:00Z' },
      { id: 'usr-2', fullName: 'Ahmet Yılmaz (Depocu)', role: 'depocu', createdAt: '2026-08-02T11:00:00Z' },
      { id: 'usr-3', fullName: 'Merve Demir (Satış)', role: 'satis', createdAt: '2026-08-03T12:00:00Z' },
    ];
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at')
    .order('created_at');

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    role: row.role,
    createdAt: row.created_at,
  }));
}

export async function updateProfileRole(id: string, role: Role): Promise<void> {
  if (isDemoMode()) return;

  const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function inviteUser(email: string, role: Role): Promise<void> {
  if (isDemoMode()) return;

  const { error } = await supabase.functions.invoke('invite-user', { body: { email, role } });
  if (!error) return;

  let message = error.message;
  if ('context' in error && error.context instanceof Response) {
    try {
      const body = await error.context.clone().json();
      if (body?.error) message = body.error;
    } catch {
      // yanıt gövdesi JSON değil, genel hata mesajı kullanılır
    }
  }
  throw new Error(message);
}
