"use client";
import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useAirportDirectory } from "@/lib/airportDirectory";
import { rankAirports } from "@/lib/airportSearch";
import type { Airport } from "@/types/aviation";
import { fieldCls } from "./curatorUi";

export const airportLabel = (a?: Airport | null) => (a ? `${(a.city || a.name || "").split(/[\/,(]/)[0].trim()} (${a.icao})` : "");

/** Dark airport picker: type a city, name or code; shows "Lagos (DNMM)". */
export default function CuratorAirportInput({
  value,
  onChange,
  placeholder = "City or ICAO",
  className = ""
}: {
  value: string;
  onChange: (icao: string, airport?: Airport) => void;
  placeholder?: string;
  className?: string;
}) {
  const [airports] = useAirportDirectory();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const deferred = useDeferredValue(text);
  const box = useRef<HTMLDivElement>(null);
  const selected = useMemo(() => airports.find((a) => a.icao === value) || null, [airports, value]);

  useEffect(() => {
    if (!open) setText(selected ? airportLabel(selected) : value || "");
  }, [selected, value, open]);

  useEffect(() => {
    const close = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const results = useMemo(() => (open && deferred.trim().length >= 2 ? rankAirports(airports, deferred).slice(0, 8) : []), [airports, deferred, open]);

  return (
    <div ref={box} className={`relative ${className}`}>
      <input
        value={text}
        placeholder={placeholder}
        onFocus={(e) => {
          setOpen(true);
          e.target.select();
        }}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          const code = e.target.value.trim().toUpperCase();
          if (/^[A-Z0-9]{4}$/.test(code)) {
            const exact = airports.find((a) => a.icao === code);
            if (exact) onChange(exact.icao, exact);
          }
        }}
        className={fieldCls}
      />
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-[#111A27] border border-[#263345] rounded-xl shadow-2xl py-1.5 max-h-72 overflow-y-auto">
          {results.map((a) => (
            <button
              key={a.icao}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(a.icao, a);
                setText(airportLabel(a));
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-white/[0.05] flex items-center justify-between gap-3"
            >
              <span className="text-[14px] text-white truncate">
                {a.city || a.name} <span className="text-[#93A1B5]">· {a.name}</span>
              </span>
              <span className="font-mono text-[13px] text-[#C9A24A]">{a.icao}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
