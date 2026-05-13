import { NextResponse } from 'next/server';

export async function fetchGeoCoordinates(city?: string, country?: string) {
  const queries: string[] = [];
  if (city && country) queries.push(`${city}, ${country}`);
  if (city) queries.push(city);
  if (country) queries.push(country);

  for (const query of queries) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TURTAKIP Next Application',
        Accept: 'application/json'
      }
    });

    if (!response.ok) continue;
    const data = (await response.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    if (data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        label: data[0].display_name
      };
    }
  }

  return null;
}

export function createErrorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
