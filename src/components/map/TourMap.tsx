'use client';

import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvent } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { TourDay } from '@/types/tour';

const defaultCenter: [number, number] = [39.0, 34.5];

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const selectedIcon = L.divIcon({
  html: '<div style="background:#38bdf8;border:2px solid #0f172a;border-radius:9999px;height:24px;width:24px;box-shadow:0 0 0 6px rgba(56,189,248,0.18);"></div>',
  className: 'selected-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

interface TourMapProps {
  days: TourDay[];
  selectedDayId?: string;
  onSelect?: (dayId: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
}

function MapBounds({ markers }: { markers: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) return;
    map.fitBounds(markers, { padding: [50, 50] });
  }, [map, markers]);

  return null;
}

function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvent('click', (event) => {
    onMapClick?.(event.latlng.lat, event.latlng.lng);
  });

  return null;
}

export default function TourMap({ days, selectedDayId, onSelect, onMapClick }: TourMapProps) {
  const points = useMemo(() => days.filter((day) => day.lat != null && day.lng != null).map((day) => [day.lat!, day.lng!] as [number, number]), [days]);
  const activeDay = days.find((day) => day.id === selectedDayId) ?? days.find((day) => day.lat != null && day.lng != null);
  const clickableMarkers = days.filter((day) => day.lat != null && day.lng != null);
  const defaultPosition = activeDay ? [activeDay.lat!, activeDay.lng!] as [number, number] : defaultCenter;

  return (
    <div className="h-[420px] w-full overflow-hidden rounded-[28px] border border-white/10 shadow-panel">
      <MapContainer
        center={defaultPosition}
        zoom={activeDay ? 6 : 3}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {clickableMarkers.map((day) => (
          <Marker
            key={day.id}
            position={[day.lat!, day.lng!]}
            icon={day.id === activeDay?.id ? selectedIcon : markerIcon}
            eventHandlers={{
              click: () => onSelect?.(day.id)
            }}
          />
        ))}
        {points.length >= 2 && <Polyline pathOptions={{ color: '#38bdf8', weight: 4, opacity: 0.8 }} positions={points} />}
        {points.length > 0 && <MapBounds markers={points} />}
        <MapClickHandler onMapClick={onMapClick} />
      </MapContainer>
    </div>
  );
}
