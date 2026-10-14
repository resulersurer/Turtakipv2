'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { EnrichedTourItem } from './PassengerTourCard';

interface MapPinItem {
  id: string;
  tourId: string;
  tourName: string;
  cityName: string;
  countryName?: string;
  lat: number;
  lng: number;
  photoUrl?: string;
  dayNumber?: number;
}

interface PassengerGlobalMapProps {
  tours: EnrichedTourItem[];
}

export default function PassengerGlobalMap({ tours }: PassengerGlobalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Extract all valid pins
  const pins: MapPinItem[] = [];
  tours.forEach((tour) => {
    if (tour.days && tour.days.length > 0) {
      tour.days.forEach((day) => {
        if (day.lat != null && day.lng != null && !isNaN(day.lat) && !isNaN(day.lng)) {
          pins.push({
            id: `${tour.id}-${day.id || day.dayNumber}`,
            tourId: tour.id,
            tourName: tour.name,
            cityName: day.city || 'Belirtilmedi',
            countryName: day.country || '',
            lat: day.lat,
            lng: day.lng,
            photoUrl: day.photoUrl || tour.coverImage,
            dayNumber: day.dayNumber
          });
        }
      });
    }
  });

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: [28.0, 20.0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 12,
      scrollWheelZoom: false
    });
    mapInstanceRef.current = map;

    // Tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // Custom pulse marker icon
    const customMarkerIcon = L.divIcon({
      html: `
        <div style="position:relative; width:28px; height:28px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
          <span style="position:absolute; width:100%; height:100%; border-radius:50%; background:rgba(239, 68, 68, 0.4); animation:ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
          <div style="width:20px; height:20px; background:linear-gradient(135deg, #ef4444, #b91c1c); border:2px solid #ffffff; border-radius:50%; box-shadow:0 4px 12px rgba(239, 68, 68, 0.5); display:flex; align-items:center; justify-content:center;">
            <div style="width:6px; height:6px; background:#ffffff; border-radius:50%;"></div>
          </div>
        </div>
      `,
      className: 'custom-world-marker',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    });

    const markerBounds: [number, number][] = [];

    // Add markers and popups
    pins.forEach((pin) => {
      markerBounds.push([pin.lat, pin.lng]);

      const popupHtml = `
        <div style="width:220px; font-family:Inter, sans-serif; padding:2px;">
          ${pin.photoUrl ? `
            <div style="height:100px; width:100%; overflow:hidden; border-radius:10px; margin-bottom:8px;">
              <img src="${pin.photoUrl}" alt="${pin.cityName}" style="width:100%; height:100%; object-fit:cover;" />
            </div>
          ` : ''}
          <div style="font-size:11px; font-weight:700; color:#dc2626; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:2px;">
            📍 ${pin.cityName} ${pin.countryName ? `• ${pin.countryName}` : ''}
          </div>
          <div style="font-size:13px; font-weight:700; color:#0f172a; line-height:1.3; margin-bottom:4px;">
            ${pin.tourName}
          </div>
          ${pin.dayNumber ? `<div style="font-size:11px; color:#64748b; margin-bottom:8px;">${pin.dayNumber}. Gün Durağı</div>` : ''}
          <a href="/tour/${pin.tourId}" style="display:flex; align-items:center; justify-content:center; gap:6px; width:100%; background:#2563eb; color:#ffffff; font-size:12px; font-weight:600; padding:8px 0; border-radius:8px; text-decoration:none;">
            Turu İncele →
          </a>
        </div>
      `;

      L.marker([pin.lat, pin.lng], { icon: customMarkerIcon })
        .addTo(map)
        .bindPopup(popupHtml, { className: 'custom-leaflet-popup' });
    });

    // Fit bounds across all pins
    if (markerBounds.length > 0) {
      map.fitBounds(markerBounds, { padding: [40, 40], maxZoom: 5 });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [tours]);

  return (
    <div className="relative h-[480px] w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#071129] shadow-glass backdrop-blur-xl">
      {/* Top Map Overlay Badge */}
      <div className="absolute top-4 left-4 z-[400] flex items-center gap-2 rounded-2xl border border-white/10 bg-[#08122d]/90 px-4 py-2 text-xs font-semibold text-slate-200 shadow-xl backdrop-blur-md">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
        </span>
        <span>Canlı Dünya Rota Takibi</span>
        <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] text-brand-300">
          {pins.length} Aktif Lokasyon
        </span>
      </div>

      <div ref={mapContainerRef} className="h-full w-full" style={{ background: '#09132c' }} />
    </div>
  );
}
