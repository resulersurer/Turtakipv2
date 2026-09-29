# Ejder Turizm Tur Takip

Vercel native Next.js App Router uygulaması. Ejder Turizm tur detay ve liste sayfalarından tur verisi içe aktarır, kayıtları önce taslak oluşturur, admin onayından sonra yolcular için harita ve timeline tabanlı takip ekranları yayınlar.

## Teknoloji

- Next.js App Router, TypeScript, Tailwind CSS
- Prisma + PostgreSQL
- Neon veya Supabase PostgreSQL
- React Leaflet + Leaflet
- Cheerio import parser
- Zod API validation
- Vercel Blob upload
- Cookie tabanlı admin auth

## Lokal Kurulum

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

`.env` içindeki `DATABASE_URL`, `ADMIN_PASSWORD` ve `ADMIN_COOKIE_SECRET` değerlerini doldurun. Uygulama varsayılan olarak `http://localhost:3000` üzerinde çalışır.

## Environment Variables

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/ejder?sslmode=require"
ADMIN_PASSWORD="change-me"
ADMIN_COOKIE_SECRET="replace-with-a-long-random-string"
BLOB_READ_WRITE_TOKEN=""
GEOCODE_USER_AGENT="ejder-tour-tracker/1.0"
CRON_SECRET="replace-with-a-long-random-string"
```

`BLOB_READ_WRITE_TOKEN` tanımlı değilse `/api/upload` güvenli şekilde 501 döner. Supabase Storage tercih edilirse `app/api/upload/route.ts` içinde aynı sözleşmeyle `{ url }` dönecek şekilde provider değiştirilebilir.

## Neon veya Supabase DB

Neon:
1. Neon’da yeni PostgreSQL project oluşturun.
2. Connection string’i `DATABASE_URL` olarak ekleyin.
3. SSL parametresinin açık olduğundan emin olun.
4. `npm run prisma:migrate` çalıştırın.

Supabase:
1. Supabase project oluşturun.
2. Project Settings > Database connection string değerini alın.
3. `DATABASE_URL` içine connection pooler veya direct URL girin.
4. `npm run prisma:migrate` çalıştırın.

## Vercel Deploy

1. Repo’yu Vercel’e bağlayın.
2. Environment variables bölümüne `.env.example` içindeki değerleri ekleyin.
3. Build command varsayılan olarak `npm run build`.
4. `npm run build`, `prisma generate`, varsa `prisma migrate deploy` ve `next build` adımlarını çalıştırır.
5. Production’da uygulamanın çalışması için Vercel Project Settings > Environment Variables bölümünde `DATABASE_URL` mutlaka tanımlı olmalıdır. Tanımlı değilse build migration’ı atlar, uygulama production ayarları eksik ekranına düşer.
6. Toplu import uzun sürebilir; Vercel planınızın serverless function timeout limitini kontrol edin.

## Prisma

Geliştirme:

```bash
npm run prisma:migrate
```

Production migration:

```bash
npx prisma migrate deploy
```

Vercel deploy sırasında migration otomatik çalışır:

```bash
npm run build
```

Prisma Studio:

```bash
npm run prisma:studio
```

## Import Kullanımı

- `/admin` ekranına `ADMIN_PASSWORD` ile girin.
- `/admin/import` üzerinde tekil tur URL’si veya liste URL’si girin.
- Tekil import `/api/import/tour`, toplu import `/api/import/list` kullanır.
- Import sonucu doğrudan yayına alınmaz; tur `DRAFT` durumunda kaydedilir.
- Aynı kaynak tekrar import edilirse `sourceUrl`, `externalId` veya `slug` üzerinden mevcut kayıt güncellenir.
- Import logları `/api/import/logs` ve admin dashboard üzerinde görünür.

### Günlük otomatik senkronizasyon

`/admin/import` ekranındaki otomatik senkronizasyon bölümü Ejder Turizm'in 2026 ve 2027 liste sayfalarını takip eder. Vercel Cron kaynak sunucuyu yormamak ve fonksiyon süresini sınırlamak için 2026 listesini her gün Türkiye saatiyle 06.00'da, 2027 listesini 07.00'da `/api/cron/import-sync` adresinden ayrı ayrı çalıştırır. İstek `CRON_SECRET` ile doğrulanır; bu değişkeni Vercel Production ortamına ekleyin.

- Yeni turlar taslak oluşturulur; mevcut turun yayın/taslak durumu korunarak içerik ve çıkış tarihleri güncellenir.
- İçeriği değişmeyen turlar hash karşılaştırmasıyla yeniden yazılmaz.
- Her iki liste başarıyla okunduğunda artık hiçbir kaynakta görünmeyen turlar arşivlenir. Kaynaklardan biri alınamazsa güvenlik için arşivleme yapılmaz.
- Kaynaktan kaldırılan, rezervasyon geçmişi bulunan çıkış tarihleri silinmez; `SOURCE_REMOVED` durumuyla korunur.
- Yönetici aynı işlemi `/admin/import` ekranındaki **Şimdi senkronize et** düğmesiyle çalıştırabilir ve son çalışma sayılarını görebilir.
- Sayfanın altındaki **İçe aktarma değişiklik geçmişi** son 100 işlemi; yeni/arşivlenen turları, eklenen veya kaldırılan çıkış tarihlerini, fiyat ve temel tur bilgisi değişikliklerini zaman damgasıyla gösterir.

## Sayfalar

- `/admin`: dashboard, taslak/yayın sayıları ve import geçmişi
- `/admin/import`: tekil ve toplu import
- `/admin/tours`: arama ve tarih filtreli admin tur listesi
- `/admin/tours/[id]`: tur, çıkış tarihi, program günü ve harita düzenleme
- `/admin/reservations`: çıkış bazında kapasite, rezervasyon ve yolcu yönetimi
- `/admin/accounting`: kasa, banka, taksit ve rezervasyon tahsilatı yönetimi
- `/giris`: müşteri hesabına giriş
- `/kayit`: müşteri hesabı oluşturma
- `/hesabim`: ad-soyad ve şifre yönetimi
- `/tours`: public yayınlanmış tur listesi
- `/tour/[slug]`: public tur detayı
- `/passenger`: yayınlanmış turlar ve global rota haritası
- `/passenger/[tourId]`: timeline + harita senkron yolcu takip ekranı

## Güvenlik Notları

- Admin write endpointleri cookie auth ister.
- Public API okuması sadece yayınlanmış içerik gösterecek şekilde sayfalarda sınırlandırılmıştır.
- API inputları Zod ile validate edilir.
- Import metinleri HTML olarak basılmaz; `dangerouslySetInnerHTML` kullanılmaz.
- Secret değerler environment variable olarak yönetilir.

## Personel Rezervasyon Sistemi

`/admin/reservations` ekranı mevcut yönetici girişiyle açılır. Tur ve çıkış tarihi seçildikten sonra toplam kapasite ve operasyon için satışa kapalı koltuk sayısı girilir. Eski çıkışların kapasitesi başlangıçta **tanımsızdır**; kapasite girilmeden rezervasyon açılamaz. Sıfır kapasite satışa kapalı anlamına gelir.

- Bir rezervasyonda iletişim kişisi, telefon, isteğe bağlı e-posta/not ve birden fazla yolcu kaydedilir. Her yolcu bir koltuk kullanır.
- Kesin rezervasyonlar ve süresi dolmamış opsiyonlar kontenjandan düşer. Müsaitlik = toplam kapasite − satışa kapalı − kesin − aktif opsiyon.
- Opsiyon zamanı Türkiye saatine göre girilir. Süresi dolan opsiyonlar bir zamanlayıcıya/cron'a ihtiyaç olmadan hesaplamadan çıkar; panelde **Süresi doldu** görünür. Veritabanında HOLD ve bitiş zamanı geçmişi korunur.
- Aktif opsiyon kesinleştirilebilir. Süresi dolan veya iptal edilen kaydı yeniden açmak yerine yeni rezervasyon oluşturulur.
- İptal koltukları serbest bırakır; yolcular ve işlem geçmişi silinmez. Panel 30 saniyede bir güncellenir; rezervasyon yazılırken müsaitlik sunucuda tekrar kontrol edilir.
- Kod, yolcu adı, iletişim kişisi ve telefonla arama yapılır. CSV, seçilen çıkışta mevcut arama/durum filtresindeki yolcuları içerir; kesin yolcu listesi için **Kesin** filtresini seçin.
- Arşivlenmiş turlara ve Türkiye takvimine göre geçmiş çıkışlara yeni rezervasyon açılamaz.
- Tur düzenleme ve aynı tarihle tekrar içe aktarma çıkış kimliğini ve kontenjanı korur. Rezervasyon geçmişi olan çıkışın tarihi değiştirilemez veya çıkış silinemez; tur arşivlenebilir. Toplu tur silme rezervasyon geçmişi olan turları atlar.
- İlk sürüm personel kullanımı içindir; numaralı koltuk şeması içermez. İşlem geçmişi ortak yönetici hesabına aittir, personel bazında kimlik kaydı tutulmaz.

Şema değişikliği: `prisma/migrations/20260925090000_reservations/migration.sql`. Mevcut veritabanını güncellemek için `npm run prisma:deploy` ve `npm run prisma:generate` çalıştırın. Yapılandırılmış Vercel build akışı migration'ı zaten uygular.

Kapasite ve rezervasyon yazımları aynı PostgreSQL çıkış satırını kilitler; aynı son koltuğun eş zamanlı satılmasını engeller. Rezervasyon oluşturma istekleri benzersiz istek anahtarıyla tekrar gönderilebilir. Yolcu verisi döndüren rezervasyon API'leri yönetici oturumu gerektirir.

### Rezervasyon testleri

```bash
npm run test:reservations
```

Entegrasyon testleri için yalnızca yerel, ayrı bir `turtakip_reservations_test` PostgreSQL veritabanı kullanın. Migration'ları bu veritabanına uyguladıktan sonra:

```bash
TEST_DATABASE_URL="postgresql://USER:PASSWORD@127.0.0.1:5432/turtakip_reservations_test" npm run test:reservations:integration
```

Testler oluşturdukları kayıtları temizler. Son koltuk yarışı, tekrar gönderilen istekler, kapasite azaltma, opsiyon süresi, iptal, tur güncelleme ve silme korumalarını kapsar.

## Müşteri Üyeliği

Tur ekranlarındaki **Üye ol** ve **Giriş yap** bağlantıları müşteri üyeliğine açılır. Kayıt için ad-soyad, e-posta ve en az 12 karakterlik şifre gerekir. Kayıt tamamlanınca müşteri otomatik olarak oturum açar. `/hesabim` ekranından ad-soyad ve şifre değiştirilebilir; şifre değişiminde diğer cihazlardaki oturumlar kapatılır.

Üye hesapları yönetici hesabından ayrıdır. Müşteri oturumu `/admin` yetkisi sağlamaz. Şifreler düz metin tutulmaz; Better Auth tarafından güçlü parola özeti olarak saklanır. Oturumlar yedi gün geçerlidir ve sunucu tarafında doğrulanır. Giriş, kayıt ve şifre değişikliği istekleri PostgreSQL üzerinde kalıcı hız sınırına tabidir.

Giriş yapan üyeler yayınlanmış turların detay sayfasında her çıkışın toplam, dolu ve boş koltuk sayısını görebilir. Kapasitesi yönetici tarafından tanımlanmış gelecek çıkışlar için telefon ve yolcu bilgileriyle kesin rezervasyon oluşturabilir. İletişim adı ve e-posta oturumdaki üye hesabından alınır; rezervasyon üye kaydına bağlanır. Bir üye rezervasyonunda en fazla sekiz yolcu bulunabilir.

Yeni şema `prisma/migrations/20260925110000_members/migration.sql` migration'ıyla uygulanır. Üyelik için Vercel ortam değişkenlerine aşağıdakileri ekleyin:

```bash
BETTER_AUTH_SECRET="en-az-32-karakterlik-rastgele-bir-sunucu-sirri"
BETTER_AUTH_URL="https://uygulamanizin-alan-adi.example"
```

`BETTER_AUTH_SECRET` boşsa uygulama güçlü bir `ADMIN_COOKIE_SECRET` değerinden üyelik için ayrı bir anahtar türetebilir. Canlı ortamda açık ve ayrı bir `BETTER_AUTH_SECRET` kullanılması tercih edilir. `BETTER_AUTH_URL`, uygulamanın kullanıcıların açtığı tam HTTPS origin adresi olmalıdır; sonunda yol bulunmamalıdır.

Üyelik testleri:

```bash
npm run test:members
```

Entegrasyon testleri için migration uygulanmış ayrı yerel test veritabanını kullanın:

```bash
TEST_DATABASE_URL="postgresql://USER:PASSWORD@127.0.0.1:5432/turtakip_reservations_test" npm run test:members:integration
```

Bu testler kayıt, aynı e-postayla tekrar kayıt, güçlü şifre kuralları, oturum süresi, sahte cookie, çıkış, profil güncelleme, şifre değiştirme, origin kontrolü, hız sınırı ve yönetici hesabından yetki ayrımını doğrular.

## Muhasebe ve Taksit Takibi

`/admin/accounting` ekranında TRY, EUR, USD veya GBP para biriminde nakit kasa ve banka hesapları açılabilir. Her hesabın açılış bakiyesi ve gelir/gider hareketlerinden hesaplanan güncel bakiyesi ayrı tutulur.

- Ödeme planı, mevcut bir rezervasyona toplam borç, para birimi, ilk vade ve 1–24 taksit seçilerek bağlanır. Kuruş farkı son taksite eklenir.
- Rezervasyon tahsilatı bir ödeme planına ve taksite bağlanır. Tahsilat kalan rezervasyon borcunu aşamaz ve kullanılan hesabın para birimi planla aynı olmalıdır.
- Gider, iade ve bakiye düzeltme hareketleri kasa veya banka hesabına manuel kaydedilebilir. Dekont ya da işlem referansı isteğe bağlıdır.
- Panel toplam bakiyeleri, açık ödeme planlarını, geciken taksitleri, ödenen ve kalan tutarları gösterir.

Bu sürüm harici ödeme sağlayıcısına bağlanmaz ve kart verisi işlemez. Online ödeme daha sonra eklendiğinde aynı ödeme planı ve kasa hareketi modeli kullanılabilir. Şema değişikliği `prisma/migrations/20260928180000_accounting/migration.sql` dosyasındadır; Vercel build akışı migration'ı otomatik uygular.
