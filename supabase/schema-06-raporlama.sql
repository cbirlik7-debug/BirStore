-- BirStore v2 — ek şema 6: Raporlama (Beklenmeyen Ürünler / Mükerrer Kayıtlar)
-- Supabase SQL Editor'da önceki schema*.sql dosyalarından SONRA çalıştırın.

-- Beklenmeyen Ürünler ekranında "Ürüne Bağla" için — schema-04'te update policy yoktu.
create policy koli_urunler_update_warehouse on public.koli_urunler
  for update using (public.current_role() in ('depocu', 'yonetici'));

-- Bir ürünün birincil EAN'ı dışında sahada okutulan alternatif barkodları eşler
-- ("Ürüne Bağla" sonrası aynı barkod bir daha "beklenmeyen" çıkmasın diye).
create table public.product_ean_aliases (
  ean text primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.product_ean_aliases enable row level security;

create policy product_ean_aliases_read_all on public.product_ean_aliases
  for select using (auth.role() = 'authenticated');
create policy product_ean_aliases_write_warehouse on public.product_ean_aliases
  for insert with check (public.current_role() in ('depocu', 'yonetici'));
create policy product_ean_aliases_update_warehouse on public.product_ean_aliases
  for update using (public.current_role() in ('depocu', 'yonetici'));

-- Aynı IMEI/Seri değerinin birden fazla koli_urunler kaydında geçtiği durumları bulur.
-- security invoker: RLS zaten koli_urunler/koliler/siparisler'i depocu/yonetici ile sınırlıyor.
create or replace function public.find_duplicate_identifiers()
returns table (
  identifier_value text,
  koli_urun_id uuid,
  koli_id uuid,
  koli_barkod text,
  siparis_no text,
  created_at timestamptz
)
language sql
stable
security invoker
as $$
  with expanded as (
    select
      ku.id as koli_urun_id,
      ku.koli_id,
      ku.created_at,
      (jsonb_each_text(ku.identifiers)).value as identifier_value
    from public.koli_urunler ku
    where ku.identifiers <> '{}'::jsonb
  ),
  dup_values as (
    select identifier_value
    from expanded
    group by identifier_value
    having count(*) > 1
  )
  select
    e.identifier_value,
    e.koli_urun_id,
    e.koli_id,
    k.barkod as koli_barkod,
    s.siparis_no,
    e.created_at
  from expanded e
  join dup_values d using (identifier_value)
  join public.koliler k on k.id = e.koli_id
  left join public.siparisler s on s.id = k.siparis_id
  order by e.identifier_value, e.created_at;
$$;
