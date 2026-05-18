"use client";

import { MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import type { MapDay } from "./PassengerMap";

const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

function ClickCatcher({ onPick }: { onPick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick?.(Number(event.latlng.lat.toFixed(6)), Number(event.latlng.lng.toFixed(6)));
    }
  });
  return null;
}

function FitAdminMap({ points, activePoint }: { points: [number, number][]; activePoint?: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (activePoint) {
      map.setView(activePoint, Math.max(map.getZoom(), 7), { animate: true });
    } else if (points.length > 1) {
      map.fitBounds(points, { padding: [28, 28] });
    } else if (points[0]) {
      map.setView(points[0], 7);
    }
  }, [activePoint, map, points]);
  return null;
}

export default function AdminMap({ days, activeDay, onPick }: { days: MapDay[]; activeDay?: number; onPick?: (lat: number, lng: number) => void }) {
  const points = days.filter((day) => day.lat != null && day.lng != null).map((day) => [day.lat as number, day.lng as number] as [number, number]);
  const active = days.find((day) => day.dayNumber === activeDay && day.lat != null && day.lng != null);
  const activePoint = active ? ([active.lat as number, active.lng as number] as [number, number]) : undefined;
  return (
    <MapContainer className="h-[420px] overflow-hidden rounded-md" center={points[0] || [39, 35]} zoom={points.length ? 4 : 3}>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      <FitAdminMap points={points} activePoint={activePoint} />
      <ClickCatcher onPick={onPick} />
      <Polyline positions={points} pathOptions={{ color: "#f3b94f", weight: 3 }} />
      {days.map((day) =>
        day.lat != null && day.lng != null ? (
          <Marker key={day.id || day.dayNumber} position={[day.lat, day.lng]} icon={icon} opacity={activeDay === day.dayNumber ? 1 : 0.65} />
        ) : null
      )}
    </MapContainer>
  );
}
