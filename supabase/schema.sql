-- BirStore v2 — ilk şema: roller, ürünler, raflar, raf stokları
-- Supabase SQL Editor'da sırayla çalıştırın.

create type public.app_role as enum ('depocu', 'satis', 'yonetici');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.app_role not null default 'satis',
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  ean text not null unique,
  article_no text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);
create index products_article_no_idx on public.products (article_no);

create table public.shelves (
  id uuid primary key default gen_random_uuid(),
  barcode text not null unique,
  name text,
  location text,
  created_at timestamptz not null default now()
);

create table public.shelf_stock (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  shelf_id uuid not null references public.shelves(id),
  quantity integer not null default 0 check (quantity >= 0),
  placed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, shelf_id)
);
create index shelf_stock_product_idx on public.shelf_stock (product_id);
create index shelf_stock_shelf_idx on public.shelf_stock (shelf_id);

-- Rol okuma yardımcı fonksiyonu (security definer: profiles üzerinde
-- sonsuz-recursion'a yol açmadan mevcut kullanıcının rolünü okur)
create or replace function public.current_role() returns public.app_role
language sql stable security definer as $$
  select role from public.profiles where id = auth.uid();
$$;
revoke all on function public.current_role from public;
grant execute on function public.current_role to authenticated;

-- İstifle commit — tek RPC çağrısıyla atomik toplu ekleme/artırma
create or replace function public.commit_shelving(p_shelf_id uuid, p_items jsonb)
returns void language plpgsql security invoker as $$
begin
  insert into public.shelf_stock (product_id, shelf_id, quantity, placed_at, updated_at)
  select (item->>'product_id')::uuid, p_shelf_id, (item->>'qty')::int, now(), now()
  from jsonb_array_elements(p_items) as item
  on conflict (product_id, shelf_id)
  do update set quantity = shelf_stock.quantity + excluded.quantity, updated_at = now();
end; $$;

-- RLS
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.shelves enable row level security;
alter table public.shelf_stock enable row level security;

create policy profiles_select_own on public.profiles
  for select using (id = auth.uid() or public.current_role() = 'yonetici');

create policy products_read_all on public.products
  for select using (auth.role() = 'authenticated');
create policy products_write_warehouse on public.products
  for insert with check (public.current_role() in ('depocu', 'yonetici'));
create policy products_update_warehouse on public.products
  for update using (public.current_role() in ('depocu', 'yonetici'));

create policy shelves_read_all on public.shelves
  for select using (auth.role() = 'authenticated');
create policy shelves_write_warehouse on public.shelves
  for insert with check (public.current_role() in ('depocu', 'yonetici'));
create policy shelves_update_warehouse on public.shelves
  for update using (public.current_role() in ('depocu', 'yonetici'));

create policy shelf_stock_read_all on public.shelf_stock
  for select using (public.current_role() in ('depocu', 'satis', 'yonetici'));
create policy shelf_stock_write_warehouse on public.shelf_stock
  for insert with check (public.current_role() in ('depocu', 'yonetici'));
create policy shelf_stock_update_warehouse on public.shelf_stock
  for update using (public.current_role() in ('depocu', 'yonetici'));

-- Kurulumdan sonra: Supabase Studio > Authentication'dan bir kullanıcı
-- oluşturun, sonra aşağıdaki gibi profiles satırını ekleyip rolünü
-- 'yonetici' yapın (UUID'yi oluşturduğunuz auth kullanıcısından alın):
--
-- insert into public.profiles (id, full_name, role)
-- values ('<auth-user-uuid>', 'Ad Soyad', 'yonetici');
