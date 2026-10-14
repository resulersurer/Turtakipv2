import type { EnrichedTourItem } from '@/components/passenger/PassengerTourCard';

export const SAMPLE_PASSENGER_TOURS: EnrichedTourItem[] = [
  {
    id: 'sample-japan-korea-1',
    name: 'Japonya Kore Turu THY NRT 12Gün - 2026',
    startDate: '2026-08-13',
    endDate: '2026-08-24',
    createdAt: new Date(),
    updatedAt: new Date(),
    airline: 'TÜRK HAVA YOLLARI',
    originCity: 'İstanbul',
    year: '2026',
    coverImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    activeDayIndex: 12,
    totalDaysCount: 12,
    totalPointsCount: 12,
    statusText: '12. günü devam ediyor',
    statusType: 'ongoing',
    days: [
      { id: 'jk-1', dayNumber: 1, date: '2026-08-13', city: 'Tokyo', country: 'Japonya', lat: 35.6762, lng: 139.6503, activity: 'Tokyo varış ve otele yerleşme' },
      { id: 'jk-2', dayNumber: 2, date: '2026-08-14', city: 'Kyoto', country: 'Japonya', lat: 35.0116, lng: 135.7681, activity: 'Tarihi tapınaklar' },
      { id: 'jk-3', dayNumber: 3, date: '2026-08-15', city: 'Osaka', country: 'Japonya', lat: 34.6937, lng: 135.5023, activity: 'Osaka Kalesi ve Dotonbori' },
      { id: 'jk-4', dayNumber: 4, date: '2026-08-16', city: 'Seul', country: 'Güney Kore', lat: 37.5665, lng: 126.9780, activity: 'Gyeongbokgung Sarayı' },
      { id: 'jk-5', dayNumber: 5, date: '2026-08-17', city: 'Busan', country: 'Güney Kore', lat: 35.1796, lng: 129.0756, activity: 'Haeundae Sahili' }
    ]
  },
  {
    id: 'sample-nepal-1',
    name: 'NEPAL TURU – HİMALAYALAR - INDIGO 2026',
    startDate: '2026-08-15',
    endDate: '2026-08-24',
    createdAt: new Date(),
    updatedAt: new Date(),
    airline: 'INDIGO AIRLINES',
    originCity: 'İstanbul',
    year: '2026',
    coverImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
    activeDayIndex: 10,
    totalDaysCount: 10,
    totalPointsCount: 8,
    statusText: '10. günü devam ediyor',
    statusType: 'ongoing',
    days: [
      { id: 'np-1', dayNumber: 1, date: '2026-08-15', city: 'Katmandu', country: 'Nepal', lat: 27.7172, lng: 85.3240, activity: 'Durbar Meydanı' },
      { id: 'np-2', dayNumber: 2, date: '2026-08-16', city: 'Pokhara', country: 'Nepal', lat: 28.2096, lng: 83.9856, activity: 'Fewal Gölü & Himalayalar manzarası' }
    ]
  },
  {
    id: 'sample-china-1',
    name: 'Çin Turu 10Gün- 2026 QR',
    startDate: '2026-08-16',
    endDate: '2026-08-25',
    createdAt: new Date(),
    updatedAt: new Date(),
    airline: 'QATAR AIRWAYS',
    originCity: 'İstanbul',
    year: '2026',
    coverImage: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=800&q=80',
    activeDayIndex: 9,
    totalDaysCount: 9,
    totalPointsCount: 9,
    statusText: '9. günü devam ediyor, 1 gün sonra bitecek',
    statusType: 'ending_soon',
    days: [
      { id: 'cn-1', dayNumber: 1, date: '2026-08-16', city: 'Pekin', country: 'Çin', lat: 39.9042, lng: 116.4074, activity: 'Yasak Şehir & Çin Seddi' },
      { id: 'cn-2', dayNumber: 2, date: '2026-08-17', city: 'Şanghay', country: 'Çin', lat: 31.2304, lng: 121.4737, activity: 'The Bund & Şanghay Kulesi' },
      { id: 'cn-3', dayNumber: 3, date: '2026-08-18', city: 'Xi’an', country: 'Çin', lat: 34.3416, lng: 108.9398, activity: 'Toprak Askerler (Terracotta)' }
    ]
  },
  {
    id: 'sample-armenia-1',
    name: 'ERMENİSTAN TURU -PC 2026',
    startDate: '2026-08-20',
    endDate: '2026-08-25',
    createdAt: new Date(),
    updatedAt: new Date(),
    airline: 'PEGASUS',
    originCity: 'İstanbul',
    year: '2026',
    coverImage: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80',
    activeDayIndex: 5,
    totalDaysCount: 6,
    totalPointsCount: 5,
    statusText: '5. günü devam ediyor, 1 gün sonra bitecek',
    statusType: 'ending_soon',
    days: [
      { id: 'am-1', dayNumber: 1, date: '2026-08-20', city: 'Erivan', country: 'Ermenistan', lat: 40.1792, lng: 44.4991, activity: 'Cumhuriyet Meydanı & Kaskad' },
      { id: 'am-2', dayNumber: 2, date: '2026-08-21', city: 'Sevan', country: 'Ermenistan', lat: 40.5564, lng: 44.9542, activity: 'Sevan Gölü Manastırı' }
    ]
  },
  {
    id: 'sample-japan-nrt-2',
    name: 'ÖZEL Japonya Turu —THY 10Gün NRT',
    startDate: '2026-08-19',
    endDate: '2026-08-28',
    createdAt: new Date(),
    updatedAt: new Date(),
    airline: 'TÜRK HAVA YOLLARI',
    originCity: 'İstanbul',
    year: '2026',
    coverImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
    activeDayIndex: 6,
    totalDaysCount: 10,
    totalPointsCount: 10,
    statusText: '6. günü devam ediyor, 4 gün sonra bitecek',
    statusType: 'ongoing',
    days: [
      { id: 'jn-1', dayNumber: 1, date: '2026-08-19', city: 'Fuji Dağı', country: 'Japonya', lat: 35.3606, lng: 138.7274, activity: 'Fuji Dağı ve Hakone Teleferik' },
      { id: 'jn-2', dayNumber: 2, date: '2026-08-20', city: 'Hiroşima', country: 'Japonya', lat: 34.3853, lng: 132.4553, activity: 'Barış Anıtı Parkı ve Miyajima' }
    ]
  },
  {
    id: 'sample-vietnam-cambodia-1',
    name: 'Vietnam Kamboçya & Laos Egzotik Asya Turu',
    startDate: '2026-08-18',
    endDate: '2026-08-29',
    createdAt: new Date(),
    updatedAt: new Date(),
    airline: 'QATAR AIRWAYS',
    originCity: 'İstanbul',
    year: '2026',
    coverImage: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
    activeDayIndex: 7,
    totalDaysCount: 12,
    totalPointsCount: 14,
    statusText: '7. günü devam ediyor, 5 gün sonra bitecek',
    statusType: 'ongoing',
    days: [
      { id: 'vc-1', dayNumber: 1, date: '2026-08-18', city: 'Hanoi', country: 'Vietnam', lat: 21.0285, lng: 105.8542, activity: 'Halong Körfezi tekne turu' },
      { id: 'vc-2', dayNumber: 2, date: '2026-08-20', city: 'Siem Reap', country: 'Kamboçya', lat: 13.3671, lng: 103.8448, activity: 'Angkor Wat Tapınak Kompleksi' },
      { id: 'vc-3', dayNumber: 3, date: '2026-08-22', city: 'Luang Prabang', country: 'Laos', lat: 19.8893, lng: 102.1334, activity: 'Kuang Si Şelalesi' }
    ]
  },
  {
    id: 'sample-south-america-1',
    name: 'Büyük Güney Amerika: Peru, Brezilya, Arjantin Turu',
    startDate: '2026-08-14',
    endDate: '2026-08-28',
    createdAt: new Date(),
    updatedAt: new Date(),
    airline: 'TÜRK HAVA YOLLARI',
    originCity: 'İstanbul',
    year: '2026',
    coverImage: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80',
    activeDayIndex: 11,
    totalDaysCount: 15,
    totalPointsCount: 18,
    statusText: '11. günü devam ediyor, 4 gün sonra bitecek',
    statusType: 'ongoing',
    days: [
      { id: 'sa-1', dayNumber: 1, date: '2026-08-14', city: 'Cusco / Machu Picchu', country: 'Peru', lat: -13.1631, lng: -72.5450, activity: 'İnka Medeniyeti Keşfi' },
      { id: 'sa-2', dayNumber: 2, date: '2026-08-17', city: 'Rio de Janeiro', country: 'Brezilya', lat: -22.9068, lng: -43.1729, activity: 'Kurtarıcı İsa Heykeli ve Copacabana' },
      { id: 'sa-3', dayNumber: 3, date: '2026-08-21', city: 'Buenos Aires', country: 'Arjantin', lat: -34.6037, lng: -58.3816, activity: 'La Boca ve Tango Gecesi' }
    ]
  },
  {
    id: 'sample-italy-france-1',
    name: 'Büyük İtalya & Fransa Riviera Masalı Turu',
    startDate: '2026-08-21',
    endDate: '2026-08-30',
    createdAt: new Date(),
    updatedAt: new Date(),
    airline: 'TÜRK HAVA YOLLARI',
    originCity: 'İstanbul',
    year: '2026',
    coverImage: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80',
    activeDayIndex: 4,
    totalDaysCount: 10,
    totalPointsCount: 12,
    statusText: '4. günü devam ediyor, 6 gün sonra bitecek',
    statusType: 'ongoing',
    days: [
      { id: 'if-1', dayNumber: 1, date: '2026-08-21', city: 'Roma', country: 'İtalya', lat: 41.9028, lng: 12.4964, activity: 'Kolezyum & Vatikan' },
      { id: 'if-2', dayNumber: 2, date: '2026-08-23', city: 'Floransa', country: 'İtalya', lat: 43.7696, lng: 11.2558, activity: 'Duomo ve Uffizi' },
      { id: 'if-3', dayNumber: 3, date: '2026-08-25', city: 'Nice', country: 'Fransa', lat: 43.7102, lng: 7.2620, activity: 'Cote d’Azur ve Promenade' }
    ]
  },
  {
    id: 'sample-south-africa-1',
    name: 'Güney Afrika & Cape Town Safari Rüyası',
    startDate: '2026-08-19',
    endDate: '2026-08-29',
    createdAt: new Date(),
    updatedAt: new Date(),
    airline: 'TÜRK HAVA YOLLARI',
    originCity: 'İstanbul',
    year: '2026',
    coverImage: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
    activeDayIndex: 6,
    totalDaysCount: 11,
    totalPointsCount: 9,
    statusText: '6. günü devam ediyor, 5 gün sonra bitecek',
    statusType: 'ongoing',
    days: [
      { id: 'za-1', dayNumber: 1, date: '2026-08-19', city: 'Cape Town', country: 'Güney Afrika', lat: -33.9249, lng: 18.4241, activity: 'Masa Dağı ve Penguen Sahili' },
      { id: 'za-2', dayNumber: 2, date: '2026-08-23', city: 'Kruger', country: 'Güney Afrika', lat: -24.0116, lng: 31.4853, activity: 'Büyük 5 Safari Deneyimi' }
    ]
  }
];
