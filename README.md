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
4. `npm run build`, `prisma generate`, `prisma migrate deploy` ve `next build` adımlarını çalıştırır. Bu yüzden Vercel production ortamında `DATABASE_URL` deploy öncesinde tanımlı olmalıdır.
5. Toplu import uzun sürebilir; Vercel planınızın serverless function timeout limitini kontrol edin.

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

## Sayfalar

- `/admin`: dashboard, taslak/yayın sayıları ve import geçmişi
- `/admin/import`: tekil ve toplu import
- `/admin/tours`: arama ve tarih filtreli admin tur listesi
- `/admin/tours/[id]`: tur, çıkış tarihi, program günü ve harita düzenleme
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
