"use client";

import dynamic from "next/dynamic";
import type { MapDay } from "./PassengerMap";

const PassengerMap = dynamic(() => import("./PassengerMap"), { ssr: false });

export function PublicMap({ days, showRoute = true, layer = "dark" }: { days: MapDay[]; showRoute?: boolean; layer?: "dark" | "light" | "satellite" }) {
  return <PassengerMap days={days} showRoute={showRoute} layer={layer} />;
}
