import { NextResponse } from 'next/server';
import { fetchGeoCoordinates, createErrorResponse } from '@/lib/geocode';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const city = url.searchParams.get('city')?.trim() || undefined;
  const country = url.searchParams.get('country')?.trim() || undefined;

  if (!city && !country) {
    return createErrorResponse('City veya country parametresi gerekli.', 400);
  }

  try {
    const result = await fetchGeoCoordinates(city, country);
    if (!result) {
      return createErrorResponse('Konum bulunamadı.', 404);
    }
    return NextResponse.json(result);
  } catch (error) {
    return createErrorResponse('Geocoding sırasında hata oluştu.', 500);
  }
}
