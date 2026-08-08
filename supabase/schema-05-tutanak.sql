-- BirStore v2 — ek şema 5: Tutanak (eksik/fazla/hasarlı kayıt + fotoğraf)
-- Supabase SQL Editor'da önceki schema*.sql dosyalarından SONRA çalıştırın.

create table public.tutanaklar (
  id uuid primary key default gen_random_uuid(),
  siparis_id uuid references public.siparisler(id),
  tutanak_no text not null unique,
  created_at timestamptz not null default now()
);

create table public.tutanak_satirlari (
  id uuid primary key default gen_random_uuid(),
  tutanak_id uuid not null references public.tutanaklar(id) on delete cascade,
  product_id uuid references public.products(id),
  durum text not null check (durum in ('eksik', 'fazla', 'hasarli')),
  adet integer not null check (adet > 0),
  aciklama text,
  foto_url text,
  created_at timestamptz not null default now()
);
create index tutanak_satirlari_tutanak_idx on public.tutanak_satirlari (tutanak_id);

alter table public.tutanaklar enable row level security;
alter table public.tutanak_satirlari enable row level security;

create policy tutanaklar_read_warehouse on public.tutanaklar
  for select using (public.current_role() in ('depocu', 'yonetici'));
create policy tutanaklar_write_warehouse on public.tutanaklar
  for insert with check (public.current_role() in ('depocu', 'yonetici'));
create policy tutanaklar_delete_warehouse on public.tutanaklar
  for delete using (public.current_role() in ('depocu', 'yonetici'));

create policy tutanak_satirlari_read_warehouse on public.tutanak_satirlari
  for select using (public.current_role() in ('depocu', 'yonetici'));
create policy tutanak_satirlari_write_warehouse on public.tutanak_satirlari
  for insert with check (public.current_role() in ('depocu', 'yonetici'));
create policy tutanak_satirlari_delete_warehouse on public.tutanak_satirlari
  for delete using (public.current_role() in ('depocu', 'yonetici'));

-- Fotoğraf kanıtları için storage bucket
insert into storage.buckets (id, name, public)
values ('tutanak-fotograflari', 'tutanak-fotograflari', true)
on conflict (id) do nothing;

create policy tutanak_fotograflari_read on storage.objects
  for select using (bucket_id = 'tutanak-fotograflari');
create policy tutanak_fotograflari_insert on storage.objects
  for insert with check (
    bucket_id = 'tutanak-fotograflari' and public.current_role() in ('depocu', 'yonetici')
  );
create policy tutanak_fotograflari_delete on storage.objects
  for delete using (
    bucket_id = 'tutanak-fotograflari' and public.current_role() in ('depocu', 'yonetici')
  );
