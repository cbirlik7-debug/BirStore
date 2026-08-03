-- BirStore v2 — ek şema 4: Mal Kabul (koli okutma + ürün/IMEI/Seri girişi)
-- Supabase SQL Editor'da önceki schema*.sql dosyalarından SONRA çalıştırın.

create table public.koliler (
  id uuid primary key default gen_random_uuid(),
  barkod text not null unique,
  tip text not null,
  siparis_id uuid references public.siparisler(id),
  magaza_kodu text references public.magazalar(kod),
  durum text not null default 'acik' check (durum in ('acik', 'kapali')),
  uyari text,
  reopen_log jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.koli_urunler (
  id uuid primary key default gen_random_uuid(),
  koli_id uuid not null references public.koliler(id) on delete cascade,
  product_id uuid references public.products(id),
  raw_barkod text,
  identifiers jsonb not null default '{}'::jsonb,
  beklenmeyen boolean not null default false,
  created_at timestamptz not null default now()
);
create index koli_urunler_koli_idx on public.koli_urunler (koli_id);
create index koli_urunler_product_idx on public.koli_urunler (product_id);

alter table public.koliler enable row level security;
alter table public.koli_urunler enable row level security;

create policy koliler_read_warehouse on public.koliler
  for select using (public.current_role() in ('depocu', 'yonetici'));
create policy koliler_write_warehouse on public.koliler
  for insert with check (public.current_role() in ('depocu', 'yonetici'));
create policy koliler_update_warehouse on public.koliler
  for update using (public.current_role() in ('depocu', 'yonetici'));

create policy koli_urunler_read_warehouse on public.koli_urunler
  for select using (public.current_role() in ('depocu', 'yonetici'));
create policy koli_urunler_write_warehouse on public.koli_urunler
  for insert with check (public.current_role() in ('depocu', 'yonetici'));
create policy koli_urunler_delete_warehouse on public.koli_urunler
  for delete using (public.current_role() in ('depocu', 'yonetici'));
