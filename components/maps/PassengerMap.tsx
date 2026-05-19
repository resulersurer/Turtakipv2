"use client";

import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

export type MapDay = {
  id?: string;
  dayNumber: number;
  title: string;
  city?: string | null;
  country?: string | null;
  lat?: number | null;
  lng?: number | null;
  highlightPulse?: boolean;
  markerStyle?: "pulse" | "pin";
};

const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const pulseIcon = L.divIcon({
  className: "tour-pulse-marker",
  html: '<span class="tour-pulse-marker__ring"></span><span class="tour-pulse-marker__dot"></span>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -18]
});

const redPinIcon = L.divIcon({
  className: "tour-red-pin",
  html: '<span class="tour-red-pin__pin"></span>',
  iconSize: [34, 46],
  iconAnchor: [17, 44],
  popupAnchor: [0, -42]
});

function FitBounds({ points, pointsKey }: { points: [number, number][]; pointsKey: string }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points, { padding: [28, 28] });
    else if (points[0]) map.setView(points[0], 6);
  }, [map, pointsKey]);
  return null;
}

function FocusSelected({ days, selectedDay }: { days: MapDay[]; selectedDay?: number }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedDay) return;
    const day = days.find((item) => item.dayNumber === selectedDay && item.lat != null && item.lng != null);
    if (!day || day.lat == null || day.lng == null) return;
    map.flyTo([day.lat, day.lng], Math.max(map.getZoom(), 6), { duration: 1.1, easeLinearity: 0.2 });
  }, [days, map, selectedDay]);
  return null;
}

export default function PassengerMap({
  days,
  selectedDay,
  layer = "dark",
  showRoute = true,
  followSelected = false,
  onSelect
}: {
  days: MapDay[];
  selectedDay?: number;
  layer?: "dark" | "light" | "satellite";
  showRoute?: boolean;
  followSelected?: boolean;
  onSelect?: (dayNumber: number) => void;
}) {
  const points = days.filter((day) => day.lat != null && day.lng != null).map((day) => [day.lat as number, day.lng as number] as [number, number]);
  const pointsKey = points.map((point) => point.join(",")).join("|");
  const tiles =
    layer === "satellite"
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      : layer === "light"
        ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  return (
    <MapContainer className="h-full min-h-[360px] overflow-hidden rounded-md" center={points[0] || [39, 35]} zoom={points.length ? 4 : 2} scrollWheelZoom>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url={tiles} />
      <FitBounds points={points} pointsKey={pointsKey} />
      {followSelected ? <FocusSelected days={days} selectedDay={selectedDay} /> : null}
      {showRoute && points.length > 1 ? <Polyline positions={points} pathOptions={{ color: "#44d7b6", weight: 4 }} /> : null}
      {days.map((day) =>
        day.lat != null && day.lng != null ? (
          <Marker key={day.id || day.dayNumber} position={[day.lat, day.lng]} icon={day.markerStyle === "pin" ? redPinIcon : day.highlightPulse ? pulseIcon : icon} eventHandlers={{ click: () => onSelect?.(day.dayNumber) }}>
            <Popup>
              <strong>
                {day.dayNumber}. Gün {selectedDay === day.dayNumber ? "•" : ""}
              </strong>
              <br />
              {day.title}
              <br />
              {[day.city, day.country].filter(Boolean).join(", ")}
            </Popup>
          </Marker>
        ) : null
      )}
    </MapContainer>
  );
}
