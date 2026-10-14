'use client';

import dynamic from 'next/dynamic';
import type { EnrichedTourItem } from './PassengerTourCard';

const PassengerGlobalMap = dynamic(() => import('./PassengerGlobalMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[480px] w-full items-center justify-center rounded-[28px] border border-white/10 bg-[#071129] shadow-glass backdrop-blur-xl">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
        <span className="text-sm font-medium text-slate-300">Canlı Harita Yükleniyor...</span>
      </div>
    </div>
  )
});

interface PassengerGlobalMapClientProps {
  tours: EnrichedTourItem[];
}

export default function PassengerGlobalMapClient(props: PassengerGlobalMapClientProps) {
  return <PassengerGlobalMap {...props} />;
}
