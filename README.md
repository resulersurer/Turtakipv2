# TURTAKIP Next

TURTAKIP Next, turizm şirketleri için modern bir tur programı ve yolcu takip uygulamasıdır. Bu proje **sıfırdan** geliştirilmiştir; eski TURTAKIP reposundaki kodlar taşınmamış, ASP.NET kullanılmamıştır.

## Özellikler

- Next.js 15 App Router ile tek uygulama
- TypeScript + Tailwind CSS
- Prisma ORM ve PostgreSQL uyumu
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

2. `.env.local` dosyasını oluşturun (`.env.example`'dan kopyalayın)
```bash
cp .env.example .env.local
```

3. Neon PostgreSQL connection strings'ı `.env.local`'e ekleyin
   - `DATABASE_URL`: Neon pooled connection string (runtime için)
   - `DIRECT_URL`: Neon direct connection string (migration için)

4. Prisma istemcisini oluşturun
```bash
npm run db:generate
```

5. Veritabanı şemasını push edin
```bash
npm run db:push
```

6. Geliştirme sunucusunu başlatın
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

Prisma Client otomatik generate edilir, sonra Next.js static ve dynamic page'leri build edilir.

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
3. Environment variables ekleyin.
4. Deploy butonuna tıklayın.

## Environment Variables

- `DATABASE_URL` - PostgreSQL bağlantı adresi
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
