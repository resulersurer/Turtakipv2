"use client";

import dynamic from "next/dynamic";
import type { MapDay } from "./PassengerMap";

const PassengerMap = dynamic(() => import("./PassengerMap"), { ssr: false });

export function PublicMap({ days }: { days: MapDay[] }) {
  return <PassengerMap days={days} />;
}
