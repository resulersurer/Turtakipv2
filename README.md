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

### Lokal Geliştirme

1. Bağımlılıkları yükleyin
```bash
npm install
```

2. Ortam değişkenlerini hazırlayın
```bash
cp .env.example .env.local
```
`.env.local` içindeki `DATABASE_URL`, `DIRECT_URL` ve `NEXT_PUBLIC_APP_URL` değerlerini Neon'dan alınan connection strings ile doldurun:
- `DATABASE_URL`: Neon pooled connection string (runtime için)
- `DIRECT_URL`: Neon direct connection string (migration için)

3. Prisma istemcisini oluşturun
```bash
npm run db:generate
```

4. Veritabanı şemasını push edin
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

Uygulama `http://localhost:3000`'de açılacak.

### Database Komutları

```bash
# Prisma Client oluştur
npm run db:generate

# Yeni migration oluştur ve uygula
npm run db:migrate

# Mevcut migration'ları production'a deploy et
npm run db:deploy

# Prisma schema'sını doğrudan database'e push et (development)
npm run db:push

# Prisma Studio açıldır (database GUI)
npm run db:studio
```

## Environment Variables

### Lokal Geliştirme (`.env.local`)
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=require"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Vercel Production
Vercel Settings → Environment Variables içinde aynı değişkenleri set edin:
- `DATABASE_URL`: Neon pooled connection
- `DIRECT_URL`: Neon direct connection
- `NEXT_PUBLIC_APP_URL`: Production URL'si

**Not:** `.env` dosyaları `.gitignore`'da yer aldığı için GitHub'a push edilmez. Sensitive bilgiler (password, token) asla repoya yazılmaz.

### Neon Connection Strings Nedir?

- **DATABASE_URL (Pooled)**: PgBouncer ile connection pooling. Runtime ve API routes için uygun.
- **DIRECT_URL (Unpooled)**: Doğrudan PostgreSQL bağlantısı. Prisma migrations için gerekli.

## Build

```bash
npm run build
```

<<<<<<< HEAD
Prisma Client otomatik generate edilir, sonra Next.js static ve dynamic page'leri build edilir.
=======
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
>>>>>>> ffc4984c2001926a9db0baecfb7ab02f37b1ac84

## Vercel Deploy

1. Repository'yi GitHub'a push edin
2. [Vercel Dashboard](https://vercel.com) → New Project → GitHub repo seçin
3. Environment Variables seç ve şu değerleri ekle:
   - `DATABASE_URL`: Neon pooled connection
   - `DIRECT_URL`: Neon direct connection
   - `NEXT_PUBLIC_APP_URL`: Production URL'si (örn: `https://turtakip.vercel.app`)
4. Deploy başlatılacak

Production'da Prisma migrations otomatik çalıştırılmaz. Gerekirse manual deploy:
```bash
npx prisma migrate deploy
```

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
