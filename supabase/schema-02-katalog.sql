-- BirStore v2 — ek şema 2: ürün kataloğu genişletmesi + mağaza/tedarikçi tanımları
-- Supabase SQL Editor'da schema.sql'den SONRA çalıştırın.

alter table public.products
  add column required_ids jsonb not null default '[]'::jsonb;
  -- örn. ["IMEI1","IMEI2"] veya ["SERIAL","IMEI1","IMEI2"] veya []

create table public.magazalar (
  kod text primary key,
  ad text not null
);

create table public.tedarikciler (
  id uuid primary key default gen_random_uuid(),
  ad text not null unique
);

alter table public.magazalar enable row level security;
alter table public.tedarikciler enable row level security;

create policy magazalar_read_all on public.magazalar
  for select using (auth.role() = 'authenticated');
create policy magazalar_write_yonetici on public.magazalar
  for insert with check (public.current_role() = 'yonetici');
create policy magazalar_update_yonetici on public.magazalar
  for update using (public.current_role() = 'yonetici');
create policy magazalar_delete_yonetici on public.magazalar
  for delete using (public.current_role() = 'yonetici');

create policy tedarikciler_read_all on public.tedarikciler
  for select using (auth.role() = 'authenticated');
create policy tedarikciler_write_yonetici on public.tedarikciler
  for insert with check (public.current_role() = 'yonetici');
create policy tedarikciler_update_yonetici on public.tedarikciler
  for update using (public.current_role() = 'yonetici');
create policy tedarikciler_delete_yonetici on public.tedarikciler
  for delete using (public.current_role() = 'yonetici');

-- products tablosunda silme politikası eksikti, ekleniyor
create policy products_delete_yonetici on public.products
  for delete using (public.current_role() = 'yonetici');
