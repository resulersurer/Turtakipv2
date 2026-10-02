import Image from "next/image";
import { Plane } from "lucide-react";

const airlineCodes: Record<string, string> = {
  "turk hava yollari": "TK",
  "turk havayollari": "TK",
  "turkish airlines": "TK",
  "thy": "TK",
  "tk": "TK",
  "qatar": "QR",
  "qatar airways": "QR",
  "qr": "QR",
  "pegasus": "PC",
  "pegasus airlines": "PC",
  "pegasus hava yollari": "PC",
  "pegasus havayollari": "PC",
  "pc": "PC",
  "emirates": "EK",
  "emirates airlines": "EK",
  "ek": "EK",
};

export function AirlineName({ name }: { name: string }) {
  const key = name.toLocaleLowerCase("tr-TR").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i").replace(/\s+/g, " ").trim();
  const code = airlineCodes[key];

  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      {code ? (
        <Image src={`/airlines/${code}.png`} alt="" width={24} height={24} className="h-6 w-6 shrink-0 rounded-sm object-contain" />
      ) : (
        <Plane size={14} aria-hidden="true" className="shrink-0" />
      )}
      <span className="text-xs font-semibold tracking-wide text-[#7f1d1d]">{name}</span>
    </span>
  );
}
