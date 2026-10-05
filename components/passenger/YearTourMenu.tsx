"use client";

import Link from "next/link";
import { ChevronDown, ArrowUpRight } from "lucide-react";
import { useId, useState } from "react";

export function YearTourMenu({ label, href, featured = false }: { label: string; href: string; featured?: boolean }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="passenger-links__group passenger-links__group--dropdown"
      onPointerEnter={(event) => { if (event.pointerType === "mouse") setOpen(true); }}
      onPointerLeave={(event) => { if (event.pointerType === "mouse") setOpen(false); }}
      onFocus={(event) => { if (event.target.tagName === "A") setOpen(true); }}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
      onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); event.stopPropagation(); } }}>
      <div className={`passenger-links__item passenger-links__trigger${featured ? " passenger-links__item--featured" : ""}`}>
        <Link href={href}>{label}</Link>
        <button type="button" aria-label={`${label} alt bağlantıları`} aria-expanded={open} aria-controls={id}
          onClick={() => setOpen((value) => !value)}>
          <ChevronDown size={15} aria-hidden="true" />
        </button>
      </div>
      <div id={id} className="passenger-links__dropdown" hidden={!open}>
        <Link href={href} className="passenger-links__subitem">Tüm turlar <ArrowUpRight size={13} aria-hidden="true" /></Link>
        <Link href={`${href}/son-koltuklar`} className="passenger-links__subitem">Son Koltuklar <ArrowUpRight size={13} aria-hidden="true" /></Link>
      </div>
    </div>
  );
}
