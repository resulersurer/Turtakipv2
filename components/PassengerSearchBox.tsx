"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function PassengerSearchBox({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const trimmed = value.trim();
    if (trimmed.length >= 3) {
      timer.current = setTimeout(() => {
        router.push(`/passenger?q=${encodeURIComponent(trimmed)}`);
      }, 400);
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, router]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = value.trim();
        if (trimmed.length > 0) router.push(`/passenger?q=${encodeURIComponent(trimmed)}`);
      }}
      className="flex flex-col gap-3 sm:flex-row"
    >
      <div className="group relative min-w-0 flex-1">
        <div className="pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-r from-[#7f1d1d]/0 via-[#7f1d1d]/20 to-mint/30 opacity-0 blur transition-opacity duration-300 group-focus-within:opacity-100" />
        <div className="relative flex items-center rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 group-focus-within:border-[#7f1d1d]/40 group-focus-within:shadow-md">
          <svg className="ml-3.5 h-4 w-4 shrink-0 text-[#7f1d1d]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-xl bg-transparent py-3 pl-3 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
            placeholder="Tur adı, şehir, ülke veya havayolu ara…"
            aria-label="Tur ara"
          />
          {value && (
            <button
              type="button"
              onClick={() => {
                setValue("");
                router.push("/passenger");
              }}
              className="mr-2 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#7f1d1d]"
              aria-label="Temizle"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
