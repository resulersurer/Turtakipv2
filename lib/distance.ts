export type Point = { lat?: number | null; lng?: number | null };

const R = 6371;

export function haversineKm(a: Point, b: Point) {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return 0;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

export function routeStats(points: Point[]) {
  let total = 0;
  const legs = points.map((point, index) => {
    const distanceFromPrevious = index === 0 ? 0 : haversineKm(points[index - 1], point);
    total += distanceFromPrevious;
    return { ...point, distanceFromPrevious, totalDistance: total };
  });
  return { total, legs };
}
