"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import type { Airport } from "@/types/aviation";
import { useAirportDirectory } from "@/lib/airportDirectory";
import CuratorAirportInput from "./CuratorAirportInput";
import { GoldButton, cardCls, fieldCls, goldLinkCls, labelCls, tdCls, thCls } from "./curatorUi";

interface EstimateRow {
  key: string;
  label: string;
  seats: string;
  flyingTime: string;
  low: number;
  high: number;
}

const usd = (n: number) => n.toLocaleString("en-US");
const cityOf = (a?: Airport | null, code?: string) => (a ? (a.city || a.name || code || "").split(/[\/,(]/)[0].trim() : code || "");

export default function AgentPriceEstimateView() {
  const router = useRouter();
  const params = useSearchParams();
  const [from, setFrom] = useState(params?.get("from") || "");
  const [to, setTo] = useState(params?.get("to") || "");
  const [fromAp, setFromAp] = useState<Airport | null>(null);
  const [toAp, setToAp] = useState<Airport | null>(null);
  const [date, setDate] = useState(params?.get("date") || "");
  const [pax, setPax] = useState(params?.get("pax") || "");
  const [trip, setTrip] = useState<"return" | "one_way">(params?.get("trip") === "one_way" ? "one_way" : "return");
  const [rows, setRows] = useState<EstimateRow[] | null>(null);
  const [placeholders, setPlaceholders] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [airports] = useAirportDirectory();

  // Airports given in the link (e.g. from "Request this" or a shared estimate)
  useEffect(() => {
    if (from && !fromAp) setFromAp(airports.find((a) => a.icao === from) || null);
    if (to && !toAp) setToAp(airports.find((a) => a.icao === to) || null);
  }, [airports, from, to, fromAp, toAp]);

  // Estimate as soon as both airports are known (no tokens are used)
  useEffect(() => {
    if (!from || !to || from === to) {
      setRows(null);
      return;
    }
    let alive = true;
    setLoading(true);
    const t = setTimeout(() => {
      api.curator
        .estimate({
          from,
          to,
          fromLat: fromAp?.coordinates?.lat,
          fromLng: fromAp?.coordinates?.lng,
          toLat: toAp?.coordinates?.lat,
          toLng: toAp?.coordinates?.lng,
          pax: pax || undefined,
          trip,
          date: date || undefined
        })
        .then((res) => {
          if (!alive) return;
          setRows(res.data.rows || []);
          setPlaceholders(Boolean(res.data.placeholders));
          setError(null);
        })
        .catch((err: any) => alive && setError(err?.message || "The estimate could not be worked out."))
        .finally(() => alive && setLoading(false));
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [from, to, fromAp, toAp, pax, trip, date]);

  const shareText = useMemo(() => {
    if (!rows || !rows.length) return "";
    const first = rows[0];
    const route = `${cityOf(fromAp, from)}–${cityOf(toAp, to)}${trip === "return" ? " return" : ""}`;
    return `${route}${pax ? `, ${pax} pax` : ""}, ${first.label.toLowerCase()} from about $${usd(first.low)}. Shall I get you a firm offer?`;
  }, [rows, fromAp, toAp, from, to, trip, pax]);

  const copy = async () => {
    if (!shareText) return;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this text", shareText);
    }
  };

  const requestThis = (r: EstimateRow) => {
    const q = new URLSearchParams({ from, to, trip, category: r.key });
    if (date) q.set("date", date);
    if (pax) q.set("pax", pax);
    router.push(`/agent/requests/new?${q.toString()}`);
  };

  return (
    <div>
      <h1 className="text-[32px] leading-tight font-bold text-white tracking-tight m-0">Price estimate</h1>
      <p className="text-[15px] text-[#93A1B5] mt-1.5 mb-6">A quick range to share in conversation. Not an offer: the desk confirms the real price within hours.</p>

      <div className={`${cardCls} p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6`}>
        <div>
          <label className={labelCls}>From</label>
          <CuratorAirportInput
            value={from}
            onChange={(code, a) => {
              setFrom(code);
              setFromAp(a || null);
            }}
          />
        </div>
        <div>
          <label className={labelCls}>To</label>
          <CuratorAirportInput
            value={to}
            onChange={(code, a) => {
              setTo(code);
              setToAp(a || null);
            }}
          />
        </div>
        <div>
          <label className={labelCls}>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldCls} />
        </div>
        <div>
          <label className={labelCls}>Passengers</label>
          <input type="number" min={1} max={19} value={pax} onChange={(e) => setPax(e.target.value)} className={fieldCls} />
        </div>
        <div>
          <label className={labelCls}>Trip</label>
          <select value={trip} onChange={(e) => setTrip(e.target.value as "return" | "one_way")} className={fieldCls}>
            <option value="return">Return same day</option>
            <option value="one_way">One way</option>
          </select>
        </div>
      </div>

      <div className={`${cardCls} overflow-hidden px-3 py-1 mb-6`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <th className={thCls}>Category</th>
                <th className={thCls}>Seats</th>
                <th className={thCls}>Flying time each way</th>
                <th className={thCls}>Estimated range, {trip === "return" ? "return" : "one way"}, all-in</th>
                <th className={thCls} />
              </tr>
            </thead>
            <tbody>
              {!rows && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[15px] text-[#93A1B5]">
                    {error ? <span className="text-[#F08C8C]">{error}</span> : loading ? "Working out the ranges…" : "Pick both airports to see the ranges."}
                  </td>
                </tr>
              )}
              {rows && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[15px] text-[#93A1B5]">
                    No category seats {pax} passengers. Ask the desk for a larger aircraft.
                  </td>
                </tr>
              )}
              {rows?.map((r) => (
                <tr key={r.key} className="border-b border-white/[0.05] last:border-0">
                  <td className={`${tdCls} font-bold text-white text-[16px]`}>{r.label}</td>
                  <td className={tdCls}>{r.seats}</td>
                  <td className={tdCls}>{r.flyingTime}</td>
                  <td className={`${tdCls} text-right font-bold text-[#E0C17C] whitespace-nowrap`}>
                    $ {usd(r.low)} – {usd(r.high)}
                  </td>
                  <td className={`${tdCls} whitespace-nowrap`}>
                    <button type="button" onClick={() => requestThis(r)} className={goldLinkCls}>
                      Request this
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div className={`${cardCls} p-6`}>
          <h3 className="text-[19px] font-bold text-white m-0 mb-3">How the range is built</h3>
          <p className="text-[15px] text-[#A8B3C2] leading-relaxed m-0">
            Hourly rates by category from OrbAero&apos;s rate table (updated monthly from real quotes) × flying time both ways, plus typical positioning,
            landing, handling and waiting fees, plus your margin and OrbAero&apos;s fee. December peak season adds 10–20 %.
            {placeholders ? " Ranges shown are placeholders until the rate table is filled." : ""}
          </p>
        </div>
        <div className={`${cardCls} p-6`}>
          <h3 className="text-[19px] font-bold text-white m-0 mb-3">Share</h3>
          <p className="text-[15px] text-[#A8B3C2] leading-relaxed mt-0 mb-4">
            {shareText ? <>Send as text: “{shareText}”</> : "Pick a route to get a message you can send."}
          </p>
          <GoldButton className="w-full rounded-full" onClick={copy} disabled={!shareText}>
            {copied ? "Copied" : "Copy for WhatsApp"}
          </GoldButton>
        </div>
      </div>

      <p className="text-[15px] text-[#93A1B5] mt-5">
        Each estimate uses no tokens. Turning it into a request uses 1 token, as usual.
      </p>
    </div>
  );
}
