"use client";

import dynamic from "next/dynamic";
import type { MapDay } from "./PassengerMap";

const PassengerMap = dynamic(() => import("./PassengerMap"), { ssr: false });

export function PublicMap({ days, showRoute = true }: { days: MapDay[]; showRoute?: boolean }) {
  return <PassengerMap days={days} showRoute={showRoute} />;
}
