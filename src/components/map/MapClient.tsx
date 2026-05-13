'use client';

import dynamic from 'next/dynamic';
import type { TourDay } from '@/types/tour';

const TourMap = dynamic(() => import('./TourMap'), { ssr: false });

interface MapClientProps {
  days: TourDay[];
  selectedDayId?: string;
  onSelect?: (dayId: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
}

export default function MapClient(props: MapClientProps) {
  return <TourMap {...props} />;
}
