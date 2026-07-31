# MağazaDepoPlus — Proje Bağlamı (Claude Code için)

Bu dosya, Claude Code bu repoda çalışırken otomatik okunur. Projenin geçmişini,
mimarisini ve bekleyen işlerini özetler.

## Proje Nedir

teknoloji mağazası deposu için mal kabul / koli takip sistemi.
Mağaza müdürüne sunum için başlayıp, gerçek kullanıma doğru genişletildi.
Kullanıcı görünen isim: **BirStore**. Repo/proje adı: `BirStore`.

## Dosya Yapısı

- `index.html` — mobil uygulama (telefon/tablet/MDE'den kullanılır). Tek dosya,
  HTML+CSS+JS bir arada. **Ana geliştirme dosyası budur.**
- `admin.html` — masaüstü yönetim paneli (sipariş/koli/katalog yönetimi, raporlar,
  tedarikçi performansı). Aynı desen: tek dosya.
- `manifest.json`, `sw.js`, `icon-*.png`, `apple-touch-icon.png` — PWA dosyaları
  (ana ekrana ekleme + çevrimdışı önbellek).
- `supabase-schema.sql`, `supabase-schema-v2-ek.sql`, `supabase-schema-v3-ek.sql`
  — Supabase veritabanı şeması, SIRAYLA çalıştırılmalı. Yeni bir şema değişikliği
  gerekirse yeni bir `-ek.sql` dosyası olarak eklenir (öncekiler asla değiştirilmez,
  zaten kurulu ortamlar bozulmasın diye).

## Mimari

- **Backend yok** — GitHub Pages üzerinde statik dosya olarak yayınlanıyor.
- **Veritabanı:** Supabase (Postgres). Tarayıcıdan `@supabase/supabase-js` (CDN)
  ile doğrudan bağlanılıyor, `anon` public key ile. RLS politikaları şu an
  **"herkese açık"** (pilot aşaması) — üretim öncesi kullanıcı girişiyle sıkılaştırılmalı.
- **Bağlantı bilgisi:** Her iki HTML dosyasının en üstünde
  `SUPABASE_URL` / `SUPABASE_ANON_KEY` sabitleri var, ikisi de aynı değerde olmalı.
- **Gerçek zamanlı senkron:** Supabase Realtime ile `koliler`, `koli_urunler`,
  `siparisler`, `tamamlanan_siparisler`, `tutanaklar` tabloları dinleniyor —
  bir cihazda okutulan diğer cihaz/panelde birkaç saniyede görünür.
- **Çevrimdışı kuyruk:** İnternet giderse mobil uygulama yazma işlemlerini
  `localStorage`'da biriktirir, bağlantı gelince (veya 20 sn'de bir) otomatik gönderir.

## Önemli Tasarım Kararları

- **Sticky aktif ürün:** Ürün barkodu bir kolide sadece bir kez okutulur, sonraki
  ünitelerde sadece IMEI/Seri okutulur, sistem otomatik eşleştirir.
- **Akıllı barkod girişi (`attachSmartBarcodeInput`):** MDE cihazları bazı barkod
  formatlarında (SSCC/GS1) gömülü ayırıcı karakteri "Enter" gibi gönderebiliyor —
  bu erken/yarım tetiklemeye yol açıyordu. Çözüm: kısa değerlerde Enter yok sayılır,
  454ms karakter-sessizliğinde otomatik gönderim yapılır. Yeni bir manuel giriş
  alanı eklenecekse MUTLAKA bu fonksiyon kullanılmalı, ham `oninput`/`keydown` ile
  tetikleme YAPILMAMALI.
- **İrsaliye AI okuma özelliği ERTELENDİ** — kullanıcı isteğiyle kapsam dışı
  bırakıldı, kod duruyor ama buton "yakında" diye pasif. Tercih edilen gelecek
  yön: Tesseract.js + şablon-bazlı ayrıştırma (yerel/ücretsiz), Anthropic API
  proxy'si DEĞİL.
- **Sürüm rozeti:** Sağ üstte `id="versionBadge"` — her anlamlı değişiklikte
  artırılır (deploy doğrulaması için, kullanıcı GitHub'a yükledikten sonra
  doğru sürümün yansıdığını buradan kontrol ediyor). Şu an mobil **v2.2**,
  panel **admin v1.3**.

## Bekleyen İşler (henüz yapılmadı, kullanıcı not olarak istedi)

- [ ] Aynı seri/IMEI tekrar girilirse ekranda mükerrer ürün uyarısı çıksın
- [ ] Sayım ekranı — birden fazla sayımın aynı anda yapılabilmesi

## Diğer Bilinen Kısıtlar

- Kullanıcı girişi/yetkilendirme yok (herkes anon erişimle yazabiliyor — pilot için kabul edilebilir)
- İrsaliye AI okuma sadece Claude.ai önizlemesinde çalışır, GitHub Pages'te pasif
- Katalog/tedarikçi/mağaza verisi düşük hacimli, arama/filtre kutusu henüz yok

## Kod Değişikliği Yaparken Dikkat

- Her iki HTML dosyası da **tek dosya** olarak kalmalı (build adımı yok, doğrudan
  tarayıcıda çalışıyor) — modül/import sistemi ekleme.
- Değişiklik sonrası sürüm rozetini artırmayı unutma.
- Şema değişikliği gerekiyorsa yeni `-ek.sql` dosyası aç, eskilerini değiştirme.
