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

1. Bağımlılıkları yükleyin

```bash
npm install
```

2. Prisma istemcisini oluşturun

```bash
npx prisma generate
```

3. Veritabanı migrasyonunu çalıştırın

```bash
npx prisma migrate dev --name init
```

4. Geliştirme sunucusunu başlatın

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Vercel Deploy

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
