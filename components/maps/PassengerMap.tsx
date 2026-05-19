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

const pulseIcon = L.divIcon({
  className: "tour-pulse-marker",
  html: '<span class="tour-pulse-marker__ring"></span><span class="tour-pulse-marker__dot"></span>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -18]
});

function redPinIcon(dayNumber: number, selected = false, pulse = false) {
  const animations = ["pinPulseA", "pinPulseB", "pinPulseC", "pinPulseD"];
  const durations = [2.8, 3.5, 2.2, 4.1, 3.0, 2.6, 3.8];
  const delays = [0, 0.9, 1.7, 0.4, 2.3, 1.1, 2.8, 0.6, 3.2, 1.5];
  const index = Math.abs(dayNumber) % animations.length;
  const pulseStyle = pulse ? `animation:${animations[index]} ${durations[dayNumber % durations.length]}s ease-in-out ${delays[dayNumber % delays.length]}s infinite;` : "";
  return L.divIcon({
    className: "",
    html: `<div class="tour-map-pin ${selected ? "tour-map-pin--selected" : ""}" style="${pulseStyle}">
      <svg viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 0C8.477 0 4 4.477 4 10c0 7.5 10 22 10 22s10-14.5 10-22C24 4.477 19.523 0 14 0z" fill="#E53E3E"/>
        <path d="M14 0C8.477 0 4 4.477 4 10c0 7.5 10 22 10 22s10-14.5 10-22C24 4.477 19.523 0 14 0z" fill="url(#pinGradient${dayNumber})" opacity="0.55"/>
        <circle cx="14" cy="10" r="4.5" fill="white" opacity="0.92"/>
        <defs><radialGradient id="pinGradient${dayNumber}" cx="35%" cy="25%" r="75%"><stop offset="0%" stop-color="#FF9090"/><stop offset="100%" stop-color="#7B0000"/></radialGradient></defs>
      </svg>
    </div>`,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36]
  });
}

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
        ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  return (
    <MapContainer className="h-full min-h-[360px] overflow-hidden rounded-md" center={points[0] || [39, 35]} zoom={points.length ? 4 : 2} scrollWheelZoom>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url={tiles} />
      <FitBounds points={points} pointsKey={pointsKey} />
      {followSelected ? <FocusSelected days={days} selectedDay={selectedDay} /> : null}
      {showRoute && points.length > 1 ? <Polyline positions={points} pathOptions={{ color: "#3b82f6", weight: 3, opacity: 0.85, dashArray: "6 10" }} /> : null}
      {days.map((day) =>
        day.lat != null && day.lng != null ? (
          <Marker key={day.id || day.dayNumber} position={[day.lat, day.lng]} icon={day.markerStyle === "pin" || !day.highlightPulse ? redPinIcon(day.dayNumber, selectedDay === day.dayNumber, day.highlightPulse) : pulseIcon} eventHandlers={{ click: () => onSelect?.(day.dayNumber) }}>
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
