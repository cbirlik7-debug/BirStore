-- BirStore v2 — ek şema 10: Realtime canlı senkron
-- Supabase SQL Editor'da önceki schema*.sql dosyalarından SONRA çalıştırın.

alter publication supabase_realtime add table
  public.koliler,
  public.koli_urunler,
  public.siparisler,
  public.tutanaklar,
  public.transfer_urunler,
  public.sayim_satirlari;
