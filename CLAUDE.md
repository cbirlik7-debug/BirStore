# MağazaDepoPlus — Tam Sistem Spesifikasyonu

**Amaç:** Bu doküman, tek-dosya (index.html + admin.html) olarak geliştirilen
mevcut sistemin tüm özelliklerini, iş kurallarını ve veri modelini eksiksiz
tarif eder. Yeni modüler mimaride yeniden inşa edilirken kaynak spesifikasyon
olarak kullanılması içindir. Kod satırlarını değil, **davranışı ve mantığı**
aktarır — modüler yapıda implementasyon farklı olabilir/olmalı.

**⚠️ ÇAKIŞMA UYARISI:** Bu dokümandaki "Ürün Sorgula" özelliği (bkz. 4.7),
yeni projede zaten yazdırılmış olan **"ürün arama" modülü** ile aynı ihtiyacı
karşılıyor olabilir. Yeniden inşa ederken bu ikisini birleştirin, ayrı ayrı
yazmayın — aşağıda "Ürün Sorgula" bölümünde tam davranış tarif edilmiştir,
mevcut ürün arama modülünüzle karşılaştırıp eksik kalanları oraya taşıyın.

---

## 1. Proje Amacı ve Bağlam

MediaMarkt teknoloji mağazası deposu için geliştirilen, ERP'den bağımsız,
tarayıcı tabanlı depo operasyon sistemi. Telefon/tablet/MDE cihazlarından
"mal kabul" (gelen ürünleri sisteme işleme) sürecini yönetir; masaüstünden de
bir yönetim paneliyle sipariş/koli/katalog tanımlama ve raporlama yapılır.

Gerçek depo iş akışı (referans):
1. Tedarikçi/merkez depodan irsaliyeli ürünler gelir
2. Koliler tedarikçiye göre gruplanır (karışık paletlerden ayrılır)
3. Koli barkodu okutulur → sipariş otomatik açılır
4. Koli içindeki ürünler okutulur (EAN + gerekiyorsa IMEI/Seri)
5. Koli kapatılır, liste birikir
6. Sipariş kontrol: irsaliye ile karşılaştırma (girilen/beklenen)
7. Eşleşme tamamsa → "Siparişi Tamamla" → Kayıt No (KYT-xxxxxx)
8. Sorun varsa → "Tutanak Hazırla" → Tutanak No (TUT-xxxxxx), opsiyonel fotoğraf kanıtı

Depo kodları (henüz modül olarak yok, ileride transfer/iade modülü için referans):
5 (teşhir), 6 (mağaza deposu satışa açık), 9 (satışa), 11 (servis),
30 (giden transfer/iade), 99 (gelen ürünler)

---

## 2. Genel Mimari (Mevcut Sistem)

- **Frontend-only, backend yok.** GitHub Pages üzerinde statik dosya olarak
  yayınlanıyor (`index.html` = mobil uygulama, `admin.html` = yönetim paneli).
- **Veritabanı:** Supabase (Postgres + Realtime + Storage). Tarayıcıdan
  `@supabase/supabase-js` ile doğrudan bağlanılıyor (anon public key).
  RLS şu an "herkese açık" (pilot aşaması) — üretimde kullanıcı bazlı
  kısıtlanmalı.
- **Gerçek zamanlı senkron:** Supabase Realtime, `koliler`/`koli_urunler`/
  `siparisler`/`tamamlanan_siparisler`/`tutanaklar` tablolarını dinler; bir
  cihazda okutulan veri diğer cihaz/panelde birkaç saniyede görünür.
- **Çevrimdışı çalışma:** Mobil tarafta yazma işlemleri başarısız olursa
  `localStorage`'da kuyruğa alınır, bağlantı gelince (veya periyodik olarak)
  otomatik yeniden denenir. PWA desteği (manifest + service worker) ile
  ana ekrana eklenebilir, uygulama kabuğu önbelleğe alınır.
- **Sürüm rozeti:** Her ekranda görünen küçük bir sürüm etiketi — deploy
  doğrulaması için (kullanıcı GitHub'a yükledikten sonra doğru sürümün
  yansıdığını buradan kontrol ediyor). Modüler yapıda da benzer bir mekanizma
  (build/versiyon bilgisi) korunmalı.

---

## 3. Veri Modeli (Supabase Şeması)

```sql
-- Siparişler (irsaliye/order düzeyi)
siparisler (
  id uuid pk,
  siparis_no text unique not null,
  tedarikci text,
  irsaliye_no text,
  kalemler jsonb,        -- [{gtin, beklenen}]
  dinamik boolean,        -- OCR ile mi oluşturuldu (kullanılmıyor artık, ertelendi)
  created_at timestamptz
)

-- Okutulan koliler (fiili scan kayıtları)
koliler (
  id uuid pk,
  barkod text unique not null,      -- unique olmalı, upsert onConflict için şart
  tip text,                          -- 'eirsaliye' | 'kurye'
  siparis_no text fk -> siparisler,
  durum text,                        -- 'acik' | 'kapali'
  uyari text,                        -- örn. çifte etiket riski
  reopen_log jsonb,
  magaza_kodu text fk -> magazalar,  -- hedef mağaza (v2 eki)
  created_at, updated_at timestamptz
)

-- Koli içindeki her okutulan ünite (bir satır = bir ürün/adet)
koli_urunler (
  id uuid pk,
  koli_id uuid fk -> koliler (cascade delete),
  gtin text,                          -- 'BEKLENMEYEN-<raw>' prefix'i beklenmeyen ürünlerde
  ad text,
  identifiers jsonb,                  -- {IMEI1, IMEI2, SERIAL} - hangileri varsa
  beklenmeyen boolean,
  created_at timestamptz
)

-- Ürün kataloğu (EAN -> ürün eşlemesi)
urun_katalog (
  gtin text pk,
  artikel text,
  ad text,
  required_ids jsonb   -- örn. ["IMEI1","IMEI2"] veya ["SERIAL","IMEI1","IMEI2"] veya []
)

-- Koli tanımları (barkod -> tip + hangi siparişe ait + hedef mağaza)
koli_tanimlari (
  barkod text pk,
  tip text,
  siparis_no text,
  magaza_kodu text,
  uyari text
)

-- Mağazalar / Tedarikçiler (basit tanım tabloları)
magazalar (kod text pk, ad text)
tedarikciler (id uuid pk, ad text unique)

-- Tamamlanan siparişler
tamamlanan_siparisler (
  siparis_no text pk,
  kayit_no text,     -- KYT-xxxxxx
  created_at timestamptz
)

-- Tutanaklar
tutanaklar (
  id uuid pk,
  siparis_no text,
  tutanak_no text,    -- TUT-xxxxxx
  satirlar jsonb,      -- [{gtin, artikel, ad, durum:'eksik'|'fazla'|'hasarli', adet, aciklama, foto:url|null}]
  created_at timestamptz
)

-- Supabase Storage bucket: 'tutanak-fotograflari' (public) — tutanak fotoğrafları için
```

RLS: Tüm tablolarda şu an `for all using (true) with check (true)` — herkese
açık. Modüler/üretim sürümünde kullanıcı bazlı yetkilendirme eklenmeli.

---

## 4. Mobil Uygulama — Ekran ve Özellik Dökümü

Ekran-tabanlı (SPA), mobil öncelikli, geri tuşu destekli (screen stack).

### 4.1 Ana Ekran (Home)
- "📦 Koli Barkodu Okut" (kamera) — birincil aksiyon
- Manuel koli barkodu giriş alanı + "Koliyi Aç" butonu (kamera okumazsa yedek)
- "📋 Sipariş No ile Giriş Yap" — sipariş numarasını manuel girip o siparişin
  koli beklediği ekrana geçer
- "🔍 Ürün Sorgula (IMEI/Seri)" — bkz. 4.7
- "📄 İrsaliye Fotoğrafını Oku" — **ERTELENDİ**, buton pasif ("yakında")
- Bugüne ait özet (kaç koli, kaç sipariş vs. — home summary)
- "📦 Koli Listesine Git" (varsa açık/kapatılmış koliler)

### 4.2 Koli Tarama Mantığı
1. Barkod okutulur/girilir → `koli_tanimlari` tablosunda aranır
2. Tanımlıysa: tip + bağlı sipariş otomatik gelir
3. Tanımlı değilse VE aktif bir sipariş varsa: "bu siparişe yeni koli olarak
   eklensin mi?" diye sorup ad-hoc koli oluşturur (irsaliye OCR ile gelen
   kolilerin dict'te olmayacağı senaryosu için gerekliydi)
4. **Çakışma kontrolü:** Koli DB'de zaten varsa (başka cihaz/oturum tarafından
   açılmış/kapatılmışsa), o kaydın mevcut ürünleri yüklenir; kapalıysa
   "başka cihazda kapatılmış, yeniden açılsın mı?" onayı istenir
5. İki koli tipi ayrı rozetle gösterilir: **e-İrsaliye** (SAP NO) ve
   **Kurye/3PL** (SSCC) — kurye tipinde "çifte etiket riski" gibi uyarı
   notu gösterilebilir

### 4.3 Ürün Girişi Ekranı
- "🏷️ Ürün Barkodu Okut (Çoklu)" — bkz. 4.4 (çoklu barkod kamerası)
- Manuel ürün/IMEI/Seri giriş alanı (akıllı giriş, bkz. 4.8)
- **Sticky aktif ürün mantığı (kritik iş kuralı):**
  1. Taranan kod `urun_katalog`'da varsa → aktif ürün olarak ayarlanır.
     `required_ids` boşsa direkt 1 adet eklenir. Doluysa (örn. IMEI1, IMEI2
     gerekiyor) sıradaki tanımlayıcı beklenir.
  2. Taranan kod katalogda yok ama aktif bir "bekleyen tanımlayıcı" varsa →
     bu değer sıradaki tanımlayıcı olarak kabul edilir (IMEI1 dolduysa IMEI2,
     o da dolduysa kayıt tamamlanır).
  3. Bir ünite tamamlanınca **ürün barkodu tekrar okutulmaz** — sistem aynı
     ürün tipi için otomatik olarak bir sonraki ünitenin tanımlayıcılarını
     beklemeye devam eder. Farklı ürüne geçmek için sadece yeni ürünün
     barkodu okutulur.
  4. Ne katalogda ne beklemede olan bir kod gelirse: aktif sipariş varsa
     "bu barkod hangi kaleme ait?" eşleştirme modalı açılır (seçilince
     kalıcı olarak kataloğa da eklenir, bir daha sorulmaz). Sipariş yoksa
     doğrudan "beklenmeyen ürün" olarak kaydedilir.
- **Kolideki ürünler listesi:**
  - Üstte özet: toplam adet + farklı ürün sayısı + ürün bazlı döküm
    (göz taramasıyla hızlı kontrol için)
  - Her satırda ✕ ile silme (yanlış girilen ürünü kaldırma, onay ister)
  - IMEI/Seri varsa chip olarak gösterilir
- "Koliyi Kapat" butonu

### 4.4 Çoklu Barkod Kamerası (Ürün + IMEI + IMEI2 + Seri tek oturumda)
Kritik/karmaşık bir özellik — aynı ürün kutusunda birden fazla barkod
(EAN + IMEI1 + IMEI2 + Seri No) aynı anda görünür durumda olabiliyor
(örn. iPhone kutusu). Bu ekran:
- Kamerada görünen **tüm barkodları eş zamanlı algılar** (çoklu barkod
  tespiti), her birinin konumuna göre ekranda çerçeve çizer
- **Otomatik sınıflandırma:** 15 haneli sayı + Luhn kontrolü → IMEI;
  13/12/8 haneli sayı + geçerli kontrol hanesi (EAN-13/UPC-A/EAN-8) → EAN;
  harf içeren alfanumerik kod → Seri No. Tanınan barkodlar otomatik ilgili
  alana (EAN/IMEI1/IMEI2/Seri) yerleşir, kullanıcının dokunmasına gerek kalmaz.
- Alt panelde 4 sabit alan (EAN / IMEI 1 / IMEI 2 / Seri No) gösterilir.
  Dolu alana dokununca değer düzeltilebilir veya boşaltılıp "yeniden okutma"
  moduna geçilebilir. Boş alana dokunup sonra ekrandaki bir kutuya dokunarak
  yanlış sınıflandırmayı elle düzeltmek de mümkün.
- Kutu takibi: barkod bir an algılanamasa bile ~1.5 sn kutusu solgun halde
  yerinde kalır (titreme/kaybolma hissini önlemek için yumuşatma uygulanır,
  konum hesaplaması video'nun "object-fit:contain" ölçeklemesiyle birebir
  eşlenir — bu koordinat eşlemesi hataya çok açık, dikkatli implement edilmeli).
- "Bitti — Kaydet" ile toplanan EAN+tanımlayıcılar tek seferde işlenir
  (EAN kataloglu değilse eşleştirme modalına düşer, tanımlayıcılar korunarak).

### 4.5 Sipariş Kontrol Ekranı
- O ana kadar okutulan kolilerin sipariş bazlı gruplandığı liste
- Her kart: tedarikçi, sipariş no, kaç koli okutuldu, **giriş ilerleme
  yüzdesi** (girilen/beklenen, renkli çubuk), tamamlanmışsa "✓ Tamamlandı —
  Kayıt No" rozeti
- **Önce yerel (bu oturumda okutulanlar) anında gösterilir, sonra DB'den
  tüm cihazların verisiyle arka planda güncellenir** (responsive + doğru
  veri dengesi için bu iki aşamalı render deseni önemli)
- Karta dokununca Sipariş Detayı'na gider

### 4.6 Sipariş Detayı Ekranı
- İki görünüm modu: **Artikel bazlı** (her ürün için girilen/beklenen sayısı,
  renk kodlu: tam=yeşil, kısmi=sarı, yok=varsayılan) ve **Koliye göre**
  (her ürünün hangi koli barkodlarında geçtiği listelenir — "eksik çıkarsa
  hangi kolide arayacağını bilmek" için)
- "Siparişi Tamamla" → kayıt no üretir, DB'ye yazar
- "Tutanak Hazırla" → bkz. 4.9

### 4.7 Ürün Sorgula Ekranı — ⚠️ yeni "ürün arama" modülüyle birleştirilecek
IMEI/Seri/EAN ile arama — elle yazarak veya kamerayla okutarak:
- **Kataloglu bir EAN ise:** "Bu ürünü içeren siparişler" listesi gösterilir
  — her sipariş için tedarikçi, sipariş no, girilen/beklenen sayısı;
  tamamlanmışsa rozet; karta dokununca doğrudan o siparişin detayına gider.
- **Ayrıca (her durumda):** o değerle eşleşen zaten okutulmuş kayıtlar
  listelenir (IMEI1/IMEI2/Seri/EAN eşleşmesi) — hangi koli, hangi sipariş,
  ne zaman okutulmuş, tüm tanımlayıcılarıyla birlikte.
- Bu iki blok bir arada: "bu ürün nerede/hangi siparişte" sorusuna hem
  planlama hem de fiili kayıt açısından tam cevap verir.

### 4.8 Akıllı Barkod Girişi (tüm manuel alanlar için ortak davranış)
**Kritik bug-fix, mutlaka korunmalı:** MDE donanım tarayıcıları bazı barkod
formatlarında (özellikle SSCC/GS1-128, gömülü FNC1 ayırıcı içerenler) bu
ayırıcıyı "Enter" tuşu gibi gönderebiliyor — bu da değer tam yazılmadan erken
işlenmesine (sadece ilk birkaç karakterin kabul edilmesine) yol açıyordu.
Çözüm deseni:
- Enter tuşu, değer belirli bir minimum uzunluğun altındaysa **yok sayılır**
  (muhtemelen sahte ayırıcı sinyalidir), karakterlerin gelmeye devamına izin
  verilir.
- Karakter akışı durduktan ~450ms sonra (debounce) değer otomatik işlenir —
  gerçek tarayıcı hiç Enter göndermese bile çalışır.
- Elle yazan kullanıcı için ayrıca açık bir buton her zaman anında çalışır.
- Bu davranış TÜM manuel giriş alanlarında (koli no, sipariş no, ürün/IMEI/
  seri, ürün sorgula) tutarlı uygulanmalı — ham `oninput`/`keydown` ile
  "her karakterde tetikle" ASLA yapılmamalı.

### 4.9 Tutanak Ekranı
- Durum seçimi: Eksik / Fazla / Hasarlı
- Artikel seç + adet + opsiyonel açıklama
- **Opsiyonel fotoğraf ekleme** (dosya seçici / kamera capture) — Supabase
  Storage'a yüklenir, satıra URL olarak iliştirilir (kanıt fotoğrafı,
  örn. hasarlı ürün görüntüsü)
- Birden fazla satır eklenip tek tutanakta toplanabilir
- Onaylanınca tutanak no (TUT-xxxxxx) üretilir, DB'ye yazılır

### 4.10 Koli Listesi Ekranı
- Bu oturumda kapatılan koliler
- Her koli için **"Koliyi Yeniden Aç"** butonu (yanlış kapatılmışsa, DB'de
  durum tekrar 'acik' yapılır)

### 4.11 Geri Bildirim Katmanı
- Ses (Web Audio API ile üretilen basit bipler) + titreşim (`navigator.vibrate`):
  başarı (yüksek tiz bip), ara adım (kısa tık), hata (çift düşük ton) —
  ekrana bakmadan çalışabilmek için

---

## 5. Yönetim Paneli — Ekran ve Özellik Dökümü

Masaüstü, kenar menülü, tablo ağırlıklı arayüz. Aynı Supabase veritabanına
bağlanır — mobil ile hiçbir ek senkron kodu gerekmeden veri paylaşılır.

### 5.1 Özet (Dashboard)
Canlı sayaçlar: sipariş sayısı, tamamlanan, okutulan koli, açık koli,
okutulan ürün, tutanak sayısı. Son okutulan koliler tablosu.

### 5.2 Siparişler
- Yeni sipariş oluşturma formu: sipariş no, tedarikçi (dropdown), irsaliye
  no, kalem satırları (ürün + beklenen adet, dinamik satır ekleme)
- Liste: her sipariş için girilen/beklenen ilerleme çubuğu + "kalem detayı"
  aç-kapa (her ürün için ayrı girilen/beklenen rozeti, renk kodlu)
- Tamamlanma durumu rozeti
- CSV dışa aktarma (sipariş no, tedarikçi, irsaliye no, ürün, EAN, beklenen,
  girilen — düz satırlar halinde)
- Silme

### 5.3 Koliler
- Yeni koli tanımı formu: barkod, tip, bağlı sipariş, **hedef mağaza**,
  uyarı notu
- Liste: barkod, tip, sipariş, hedef mağaza, **teslim/okutma durumu**
  ("Henüz okutulmadı" → "Okutuluyor (açık)" → "✓ Ulaştı & kapatıldı",
  zaman damgasıyla), okutulan ürün sayısı
- Silme

### 5.4 Ürün Kataloğu
- Yeni ürün formu: EAN, artikel kodu, ad, gerekli tanımlayıcılar
  (IMEI1/IMEI2/Seri — checkbox'larla seçilir)
- Liste + silme

### 5.5 Tutanaklar
- Tüm tutanaklar, satır detaylarıyla (durum rozeti: eksik=kırmızı,
  fazla=sarı, hasarlı=mavi + artikel + adet + açıklama)
- **Fotoğraf küçük resmi** — varsa satırda görünür, tıklayınca büyük açılır
- **PDF çıktısı:** imza alanlı (Depo Görevlisi / Tedarikçi Yetkilisi),
  resmi görünümlü belge. Fotoğraflı satırlar varsa PDF'e ayrı bir
  "Fotoğraflı Kanıtlar" sayfası eklenir (görsel gömülü)
- CSV dışa aktarma
- Silme

### 5.6 Mağaza & Tedarikçi
Basit CRUD — mağaza kodu+adı, tedarikçi adı listeleri.

### 5.7 Beklenmeyen Ürünler
- Katalogda tanımsız barkodla okutulan tüm kayıtlar (hangi koli, hangi
  sipariş, ne zaman)
- **"Ürüne Bağla":** dropdown'dan gerçek ürünü seçip bağlama — hem o kaydın
  ürün bilgisi düzeltilir HEM barkod otomatik katalog'a da eklenir (aynı
  barkod bir daha "beklenmeyen" çıkmaz, sahada otomatik tanınır)
- "Sil" (yanlış okutmaysa)

### 5.8 Tedarikçi Performansı
- Tedarikçi bazlı: sipariş sayısı, tamamlanan sayısı, tutanak sayısı,
  eksik/fazla/hasarlı dökümü
- **"Sorun oranı"** rozeti (tutanak/sipariş oranı, eşik bazlı renk:
  %50+ kırmızı, %20+ sarı, altı yeşil) — en sorunlu tedarikçi üstte

### 5.9 Günlük Rapor
- Tarih seçimli: o günün koli/ürün/tamamlanan sipariş/tutanak sayıları
- Ürün bazlı giriş dökümü (en çok girilenden aza)
- Tamamlanan siparişler listesi (kayıt no + saat)
- CSV dışa aktarma

### 5.10 Demo Verisini Sıfırlama
Tek tık ile okutulan koli/ürün/tutanak/tamamlanan kayıtlarını temizler
(sipariş/katalog/mağaza/tedarikçi tanımları korunur) — sunum öncesi temiz
başlangıç için. Çift onay ister.

### 5.11 Gerçek Zamanlı Otomatik Yenileme
Açık sekme, Supabase Realtime üzerinden veri değişince kendini otomatik
yeniler (debounce'lu, art arda gelen değişiklikleri tek yenilemede toplar).

---

## 6. Gerçek Barkod Formatları (Referans)

Sahadan gelen gerçek örnekler, sınıflandırma/parsing mantığı için:

- **e-İrsaliye koli barkodu (SAP NO):** örn. `7071616921` — büyük numeric,
  koli kimliği. Ayrıca ayrı bir **ORDER barkodu** (örn. `190672525_4`)
  okutulunca o siparişin tüm beklenen kolilerini listeler.
- **Kurye/3PL koli barkodu (SSCC):** örn. `0100604934150000` — farklı format,
  "1/2 - 2 Koli" gibi parça bilgisi olabilir, aynı kutuda birden fazla
  sevkiyat etiketi olma riski var (karışık palet) → uyarı gösterilmeli.
- **Ürün EAN + IMEI (örn. Samsung A17):** EAN `8806097660866` + IMEI1
  `350278931208894` + IMEI2 `350459731208892` — ayrı barkodlar, bazen
  A/B/C 3 kopya sticker (herhangi biri geçerli).
- **Ürün UPC + Seri + IMEI (örn. iPhone 16e):** UPC `195950051148` +
  Serial `M97422CFFY` + IMEI1 `357072480077047` + IMEI2 `357072480302668`
  — 3-4 ayrı barkod, hepsi kaydedilmeli.
- **IMEI formatı:** her zaman 15 hane, Luhn checksum ile doğrulanabilir.

---

## 7. Ertelenen / Yapılmayan Özellikler

- **İrsaliye fotoğrafından AI ile otomatik veri çıkarma:** Kullanıcı isteğiyle
  kapsam dışı bırakıldı (geliştirmeyi tıkadığı için). Kod duruyor ama sadece
  Claude.ai önizlemesinde çalışıyor, GitHub Pages'te API anahtarı
  gizlenemediği için pasif. **Tercih edilen gelecek yön:** bulut AI değil,
  Tesseract.js + şablon-bazlı kural ayrıştırma (yerel, ücretsiz, veri dışarı
  çıkmaz) — irsaliye şablonları sınırlı sayıda tekrar eden formatta olduğu
  için (Media Markt e-irsaliye şablonu hep aynı) kural bazlı yaklaşım
  yeterli olabilir.
- **Kullanıcı girişi/yetkilendirme:** Henüz yok, "kim okuttu" bilgisi
  tutulmuyor. RLS herkese açık.
- **Depo kodları arası transfer/iade modülü** (5/6/9/11/30/99): Henüz yok.

## 8. Bekleyen Özellik İstekleri (kullanıcı tarafından not edilmiş, henüz kod yazılmadı)

- Aynı seri/IMEI ile tekrar ürün girişi yapılırsa ekranda **mükerrer ürün
  uyarısı** çıkmalı (şu an hiçbir tekrar kontrolü yok — aynı IMEI iki kez
  farklı kolilere/ünitelere girilebiliyor, sessizce kabul ediliyor)
- **Sayım ekranı** — envanter sayımı için ayrı bir modül, **birden fazla
  sayımın aynı anda (farklı kullanıcılar/cihazlar tarafından) yapılabilmesi**
  gerekiyor (eşzamanlılık/çakışma yönetimi düşünülmeli)

---

## 9. Modüler Mimariye Geçiş İçin Öneriler

Mevcut tek-dosya yapı şu mantıksal modüllere ayrılabilir:

1. **Mal Kabul modülü** — koli tarama, ürün girişi, sticky ürün mantığı,
   çoklu barkod kamerası (§4.2–4.4)
2. **Sipariş Yönetimi modülü** — sipariş kontrol/detay, tamamlama (§4.5–4.6)
3. **Ürün Arama/Sorgula modülü** — ⚠️ zaten var, §4.7 ile birleştirilecek
4. **Tutanak modülü** — oluşturma, fotoğraf, PDF çıktısı (§4.9, §5.5)
5. **Raf İstifleme modülü** — zaten yazdırılmış, mevcut sistemde karşılığı
   yok (yeni). Muhtemel entegrasyon noktası: mal kabulde okutulan ürünün
   "hangi rafa yerleştirileceği" bilgisi `koli_urunler` tablosuna veya yeni
   bir `raf_yerlesim` tablosuna eklenebilir.
6. **Katalog/Tanım Yönetimi modülü** — ürün/mağaza/tedarikçi/koli tanımları
   (§5.4, §5.6)
7. **Raporlama modülü** — günlük rapor, tedarikçi performansı, beklenmeyen
   ürünler (§5.7–5.9)
8. **Ortak/Çekirdek katman** — Supabase bağlantısı, akıllı barkod girişi
   yardımcı fonksiyonu (§4.8 — bu mantık paylaşılan bir modül/hook olmalı,
   her modülde ayrı ayrı yazılmamalı), gerçek zamanlı senkron, çevrimdışı
   kuyruk, geri bildirim (ses/titreşim) katmanı

**Kritik:** §4.8'deki akıllı barkod girişi davranışı ve §4.2'deki koli
çakışma kontrolü, hangi modülde barkod okutuluyorsa okutulsun aynı şekilde
çalışmalı — bunlar çekirdek/ortak katmana taşınmalı, modül bazında tekrar
yazılmamalı.
