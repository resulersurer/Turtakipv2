# TURTAKIP Next

TURTAKIP Next, turizm şirketleri için modern bir tur programı ve yolcu takip uygulamasıdır. Bu proje **sıfırdan** geliştirilmiştir; eski TURTAKIP reposundaki kodlar taşınmamış, ASP.NET kullanılmamıştır.

## Özellikler

- Next.js 15 App Router ile tek uygulama
- TypeScript + Tailwind CSS
- Prisma ORM ve PostgreSQL uyumu
- Neon PostgreSQL bağlantısına hazır yapı
- Admin panelde tur oluşturma, düzenleme, çoğaltma ve silme
- React Leaflet harita, rota çizimi ve seçilebilir markerlar
- Nominatim proxy geocoding route
- Zod + React Hook Form ile form doğrulama
- Drag & drop ile gün sıralama
- Responsive ve premium Türkçe arayüz

## Kurulum

1. Bağımlılıkları yükleyin

```bash
npm install
```

2. Ortam değişkenlerini hazırlayın

```bash
cp .env.example .env
```

`.env` içindeki `DATABASE_URL`, `DIRECT_URL` ve `NEXT_PUBLIC_APP_URL` değerlerini kendi ortamınıza göre doldurun.

3. Prisma istemcisini oluşturun

```bash
npm run db:generate
```

4. Veritabanı şemasını geliştirme veritabanına uygulayın

```bash
npm run db:push
```

Alternatif olarak migration tabanlı akış kullanacaksanız:

```bash
npm run db:migrate -- --name init
```

5. Geliştirme sunucusunu başlatın

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Neon PostgreSQL Bağlantısı

Bu proje Prisma datasource içinde PostgreSQL kullanır ve iki bağlantı adresi bekler:

- `DATABASE_URL`: Uygulamanın runtime sırasında kullanacağı Neon pooled connection string.
- `DIRECT_URL`: Prisma migration ve schema işlemleri için Neon direct/non-pooled connection string.

Neon panelinde proje oluşturduktan sonra bağlantı ekranından:

1. Pooled connection string'i `DATABASE_URL` olarak ekleyin.
2. Direct connection string'i `DIRECT_URL` olarak ekleyin.
3. Her iki URL'de de `sslmode=require` olduğundan emin olun.
4. Lokal geliştirme için `.env` dosyasına, production için Vercel Environment Variables alanına ekleyin.

Örnek format:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Vercel Deploy

1. Vercel hesabınıza bağlanın.
2. Yeni proje ekleyin ve bu repo dizinini seçin.
3. Environment variables ekleyin:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXT_PUBLIC_APP_URL`
4. Deploy butonuna tıklayın.

Deploy öncesinde Neon veritabanına şemayı uygulamak için lokalden şu komutu çalıştırabilirsiniz:

```bash
npm run db:push
```

Migration dosyalarıyla ilerliyorsanız production için:

```bash
npm run db:deploy
```

## Environment Variables

- `DATABASE_URL` - Neon/PostgreSQL pooled bağlantı adresi
- `DIRECT_URL` - Prisma migration işlemleri için Neon/PostgreSQL direct bağlantı adresi
- `NEXT_PUBLIC_APP_URL` - uygulama URL'si

## Admin Kullanımı

- `/admin` adresinden yeni tur oluşturun.
- Tarih aralığı seçildiğinde günler otomatik oluşturulur.
- Şehir/ülke yazınca geocode otomatik çalışır.
- Haritaya tıklayarak konum seçebilirsiniz.
- Günleri drag & drop ile yeniden sıralayabilirsiniz.
- Kaydetme, çoğaltma, silme ve yolcu linki kopyalama özellikleri mevcut.

## Yolcu Paneli

- `/tour/[id]` adresinde tüm tur yolculara açık.
- Harita, rota ve gün detayları gösterilir.
- Mobil ve desktop uyumlu bir yolcu deneyimi sunar.

## Geocoding Notları

- Geocode istekleri client tarafından doğrudan Nominatim'e gitmez.
- `/api/geocode?city=&country=` route handler kullanılır.
- Şehir+ülke ile arama yapılır, yoksa şehir veya ülke bazında fallback uygulanır.
