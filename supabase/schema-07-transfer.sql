-- BirStore v2 — ek şema 7: Transfer / İade (depo kodları arası)
-- Supabase SQL Editor'da önceki schema*.sql dosyalarından SONRA çalıştırın.

create table public.depo_kodlari (
  kod text primary key,
  ad text not null
);

insert into public.depo_kodlari (kod, ad) values
  ('5', 'Teşhir'),
  ('6', 'Mağaza Deposu (Satışa Açık)'),
  ('9', 'Satışa'),
  ('11', 'Servis'),
  ('30', 'Giden Transfer/İade'),
  ('99', 'Gelen Ürünler')
on conflict (kod) do nothing;

create table public.transfer_siparisleri (
  id uuid primary key default gen_random_uuid(),
  transfer_no text not null unique,
  kaynak_depo_kodu text not null references public.depo_kodlari(kod),
  hedef_depo_kodu text not null references public.depo_kodlari(kod),
  tip text not null check (tip in ('transfer', 'iade')),
  aciklama text,
  created_at timestamptz not null default now()
);

create table public.transfer_urunler (
  id uuid primary key default gen_random_uuid(),
  transfer_id uuid not null references public.transfer_siparisleri(id) on delete cascade,
  product_id uuid references public.products(id),
  raw_barkod text,
  identifiers jsonb not null default '{}'::jsonb,
  beklenmeyen boolean not null default false,
  created_at timestamptz not null default now()
);
create index transfer_urunler_transfer_idx on public.transfer_urunler (transfer_id);
create index transfer_urunler_product_idx on public.transfer_urunler (product_id);

alter table public.depo_kodlari enable row level security;
alter table public.transfer_siparisleri enable row level security;
alter table public.transfer_urunler enable row level security;

create policy depo_kodlari_read_all on public.depo_kodlari
  for select using (auth.role() = 'authenticated');
create policy depo_kodlari_write_yonetici on public.depo_kodlari
  for insert with check (public.current_role() = 'yonetici');
create policy depo_kodlari_update_yonetici on public.depo_kodlari
  for update using (public.current_role() = 'yonetici');
create policy depo_kodlari_delete_yonetici on public.depo_kodlari
  for delete using (public.current_role() = 'yonetici');

create policy transfer_siparisleri_read_warehouse on public.transfer_siparisleri
  for select using (public.current_role() in ('depocu', 'yonetici'));
create policy transfer_siparisleri_write_warehouse on public.transfer_siparisleri
  for insert with check (public.current_role() in ('depocu', 'yonetici'));
create policy transfer_siparisleri_delete_warehouse on public.transfer_siparisleri
  for delete using (public.current_role() in ('depocu', 'yonetici'));

create policy transfer_urunler_read_warehouse on public.transfer_urunler
  for select using (public.current_role() in ('depocu', 'yonetici'));
create policy transfer_urunler_write_warehouse on public.transfer_urunler
  for insert with check (public.current_role() in ('depocu', 'yonetici'));
create policy transfer_urunler_delete_warehouse on public.transfer_urunler
  for delete using (public.current_role() in ('depocu', 'yonetici'));
