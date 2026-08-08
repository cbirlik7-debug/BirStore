-- BirStore v2 — ek şema 8: Sayım (envanter sayımı, raf bazlı kilit)
-- Supabase SQL Editor'da önceki schema*.sql dosyalarından SONRA çalıştırın.

create table public.sayimlar (
  id uuid primary key default gen_random_uuid(),
  ad text not null,
  baslangic timestamptz not null default now(),
  bitis timestamptz,
  durum text not null default 'acik' check (durum in ('acik', 'kapali'))
);

create table public.sayim_kilitleri (
  shelf_id uuid primary key references public.shelves(id) on delete cascade,
  sayim_id uuid not null references public.sayimlar(id) on delete cascade,
  kilitleyen_user_id uuid not null references public.profiles(id),
  kilitlendi_at timestamptz not null default now()
);

create table public.sayim_satirlari (
  id uuid primary key default gen_random_uuid(),
  sayim_id uuid not null references public.sayimlar(id) on delete cascade,
  shelf_id uuid not null references public.shelves(id),
  product_id uuid not null references public.products(id),
  sayilan_adet integer not null check (sayilan_adet >= 0),
  user_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create index sayim_satirlari_sayim_idx on public.sayim_satirlari (sayim_id);
create index sayim_satirlari_shelf_idx on public.sayim_satirlari (shelf_id);

-- Sayım işbirliği için: kilit sahibinin adını göstermek amacıyla profil isimleri
-- herkese (giriş yapmış kullanıcılara) açık okunabilir hale getiriliyor.
create policy profiles_read_all on public.profiles
  for select using (auth.role() = 'authenticated');

alter table public.sayimlar enable row level security;
alter table public.sayim_kilitleri enable row level security;
alter table public.sayim_satirlari enable row level security;

create policy sayimlar_read_warehouse on public.sayimlar
  for select using (public.current_role() in ('depocu', 'yonetici'));
create policy sayimlar_write_warehouse on public.sayimlar
  for insert with check (public.current_role() in ('depocu', 'yonetici'));
create policy sayimlar_update_warehouse on public.sayimlar
  for update using (public.current_role() in ('depocu', 'yonetici'));

create policy sayim_kilitleri_read_warehouse on public.sayim_kilitleri
  for select using (public.current_role() in ('depocu', 'yonetici'));
create policy sayim_kilitleri_write_warehouse on public.sayim_kilitleri
  for insert with check (public.current_role() in ('depocu', 'yonetici'));
create policy sayim_kilitleri_delete_warehouse on public.sayim_kilitleri
  for delete using (public.current_role() in ('depocu', 'yonetici'));

create policy sayim_satirlari_read_warehouse on public.sayim_satirlari
  for select using (public.current_role() in ('depocu', 'yonetici'));
create policy sayim_satirlari_write_warehouse on public.sayim_satirlari
  for insert with check (public.current_role() in ('depocu', 'yonetici'));
