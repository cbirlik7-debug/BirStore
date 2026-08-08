-- BirStore v2 — ek şema 9: Kullanıcı / Rol Yönetimi
-- Supabase SQL Editor'da önceki schema*.sql dosyalarından SONRA çalıştırın.

-- profiles tablosunda şimdiye kadar sadece select policy vardı (schema.sql).
-- Yönetici ekranından rol değiştirme ve yeni kullanıcı (Edge Function ile) profil
-- satırı oluşturma için insert/update policy'leri ekleniyor.
create policy profiles_update_yonetici on public.profiles
  for update using (public.current_role() = 'yonetici');

create policy profiles_insert_yonetici on public.profiles
  for insert with check (public.current_role() = 'yonetici');
