// BirStore — Kullanıcı davet Edge Function
//
// Deploy: `supabase functions deploy invite-user` (Supabase CLI ile, proje login/link edilmiş olmalı).
// SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY Supabase Edge Functions
// ortamında deploy edilen fonksiyonlara otomatik sağlanır — ekstra secret tanımlamaya
// GEREK YOK. (Yalnızca `supabase functions serve` ile yerel test ederken bunları kendi
// `.env` dosyanıza eklemeniz gerekir — service role key'i asla repoya/koda yazmayın.)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const ALLOWED_ROLES = ['depocu', 'satis', 'yonetici'];

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Yetkisiz' }, 401);
  }

  // Çağıranın kimliğini ve rolünü KENDİ token'ıyla doğrula (service role burada kullanılmıyor).
  const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user: caller },
  } = await callerClient.auth.getUser();
  if (!caller) {
    return jsonResponse({ error: 'Yetkisiz' }, 401);
  }

  const { data: callerProfile } = await callerClient
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single();

  if (callerProfile?.role !== 'yonetici') {
    return jsonResponse({ error: 'Sadece yönetici kullanıcı davet edebilir' }, 403);
  }

  let body: { email?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Geçersiz istek gövdesi' }, 400);
  }

  const { email, role } = body;
  if (!email || !role) {
    return jsonResponse({ error: 'email ve role zorunlu' }, 400);
  }
  if (!ALLOWED_ROLES.includes(role)) {
    return jsonResponse({ error: 'Geçersiz rol' }, 400);
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email);
  if (inviteError || !invited.user) {
    return jsonResponse({ error: inviteError?.message ?? 'Davet gönderilemedi' }, 400);
  }

  const { error: profileError } = await adminClient
    .from('profiles')
    .insert({ id: invited.user.id, role });
  if (profileError) {
    return jsonResponse({ error: profileError.message }, 400);
  }

  return jsonResponse({ ok: true, userId: invited.user.id }, 200);
});
