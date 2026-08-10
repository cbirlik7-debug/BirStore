-- BirStore v2 — ek şema 11: Siparişi Tamamla + Kayıt No
-- Supabase SQL Editor'da önceki schema*.sql dosyalarından SONRA çalıştırın.

create table public.tamamlanan_siparisler (
  siparis_id uuid primary key references public.siparisler(id),
  kayit_no text not null unique,
  created_at timestamptz not null default now()
);

alter table public.tamamlanan_siparisler enable row level security;

create policy tamamlanan_siparisler_read_all on public.tamamlanan_siparisler
  for select using (auth.role() = 'authenticated');
create policy tamamlanan_siparisler_write_warehouse on public.tamamlanan_siparisler
  for insert with check (public.current_role() in ('depocu', 'yonetici'));

alter publication supabase_realtime add table public.tamamlanan_siparisler;
