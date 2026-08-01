-- BirStore v2 — ek şema 3: sipariş yönetimi + koli tanımları
-- Supabase SQL Editor'da schema.sql ve schema-02-katalog.sql'den SONRA çalıştırın.

create table public.siparisler (
  id uuid primary key default gen_random_uuid(),
  siparis_no text not null unique,
  tedarikci_id uuid references public.tedarikciler(id),
  irsaliye_no text,
  created_at timestamptz not null default now()
);

create table public.siparis_kalemleri (
  id uuid primary key default gen_random_uuid(),
  siparis_id uuid not null references public.siparisler(id) on delete cascade,
  product_id uuid not null references public.products(id),
  beklenen integer not null check (beklenen > 0),
  unique (siparis_id, product_id)
);

create table public.koli_tanimlari (
  barkod text primary key,
  tip text not null,
  siparis_id uuid references public.siparisler(id),
  magaza_kodu text references public.magazalar(kod),
  uyari text
);

alter table public.siparisler enable row level security;
alter table public.siparis_kalemleri enable row level security;
alter table public.koli_tanimlari enable row level security;

create policy siparisler_read_all on public.siparisler
  for select using (auth.role() = 'authenticated');
create policy siparisler_write_yonetici on public.siparisler
  for insert with check (public.current_role() = 'yonetici');
create policy siparisler_update_yonetici on public.siparisler
  for update using (public.current_role() = 'yonetici');
create policy siparisler_delete_yonetici on public.siparisler
  for delete using (public.current_role() = 'yonetici');

create policy siparis_kalemleri_read_all on public.siparis_kalemleri
  for select using (auth.role() = 'authenticated');
create policy siparis_kalemleri_write_yonetici on public.siparis_kalemleri
  for insert with check (public.current_role() = 'yonetici');
create policy siparis_kalemleri_update_yonetici on public.siparis_kalemleri
  for update using (public.current_role() = 'yonetici');
create policy siparis_kalemleri_delete_yonetici on public.siparis_kalemleri
  for delete using (public.current_role() = 'yonetici');

create policy koli_tanimlari_read_all on public.koli_tanimlari
  for select using (auth.role() = 'authenticated');
create policy koli_tanimlari_write_yonetici on public.koli_tanimlari
  for insert with check (public.current_role() = 'yonetici');
create policy koli_tanimlari_update_yonetici on public.koli_tanimlari
  for update using (public.current_role() = 'yonetici');
create policy koli_tanimlari_delete_yonetici on public.koli_tanimlari
  for delete using (public.current_role() = 'yonetici');
