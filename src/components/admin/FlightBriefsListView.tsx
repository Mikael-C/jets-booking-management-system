"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import TablePager, { usePagedRows } from "@/components/ui/TablePager";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import DocId from "@/components/ui/DocId";

interface BriefRow {
  id: string;
  bookingId: string;
  brief: string;
  trip: string;
  tripToken: string;
  departure: string | null;
  departureLocal: string;
  route: string;
  aircraft: string;
  tail: string;
  pax: number;
  readiness: string[];
  sentTo: string;
  sentAt: string | null;
  status: "draft" | "sent" | "final" | "cancelled";
}

type Filter = "next7" | "draft" | "sent" | "final" | "cancelled" | null;

const thCls = "text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 px-4 py-3.5 whitespace-nowrap";

const STATUS = {
  draft: { text: "Draft", cls: "bg-slate-100 text-slate-700" },
  sent: { text: "Sent", cls: "bg-emerald-50 text-emerald-700" },
  final: { text: "Final", cls: "bg-slate-100 text-slate-700" },
  cancelled: { text: "Cancelled route", cls: "bg-rose-50 text-rose-700" }
};

const departureLabel = (r: BriefRow) => {
  const [date, time] = r.departureLocal.split(" ");
  if (!date) return "—";
  const d = new Date(`${date}T00:00:00`);
  const day = isNaN(d.getTime()) ? date : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  return `${day}${time ? ` ${time} LT` : ""}`;
};

export default function FlightBriefsListView() {
  const router = useRouter();
  const [rows, setRows] = useState<BriefRow[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [errorText, setErrorText] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>(null);
  const [sort, setSort] = useState<"newest" | "oldest" | "departure">("newest");

  const load = useCallback(async () => {
    try {
      const res = await api.registry.flightBriefs();
      setRows(Array.isArray(res?.data) ? res.data : []);
      setState("ready");
    } catch (err: any) {
      setErrorText(err?.message || "The server could not be reached.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = Date.now();
    const list = rows.filter((r) => {
      if (filter === "next7") {
        const d = r.departure ? new Date(r.departure).getTime() : NaN;
        if (isNaN(d) || d < now - 86400000 || d > now + 7 * 86400000) return false;
      } else if (filter && r.status !== filter) return false;
      if (!q) return true;
      return [r.brief, r.trip, r.tail, r.route, r.aircraft].some((x) => String(x || "").toLowerCase().includes(q));
    });
    return [...list].sort((a, b) => {
      if (sort === "departure") return new Date(a.departure || 0).getTime() - new Date(b.departure || 0).getTime();
      const diff = new Date(b.sentAt || b.departure || 0).getTime() - new Date(a.sentAt || a.departure || 0).getTime();
      return sort === "newest" ? diff : -diff;
    });
  }, [rows, query, filter, sort]);

  // Pagination: 15 per page, back to page 1 when the search or a filter changes
  const paged = usePagedRows(filtered, 15, JSON.stringify([query, filter, sort]));

  const pill = (key: Exclude<Filter, null>, label: string) => (
    <button
      key={key}
      type="button"
      onClick={() => setFilter((f) => (f === key ? null : key))}
      className={`px-3 py-1 rounded-full border text-xs font-semibold transition-colors ${
        filter === key ? "bg-[#111827] text-white border-[#111827] shadow-sm" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-12">
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight m-0">Flight briefs</h1>

      <div className="flex flex-wrap items-center gap-2.5">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search brief, trip, tail..."
          className="w-full sm:w-64 bg-white border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs shadow-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
        />
        {pill("next7", "Next 7 days")}
        {pill("draft", "Draft")}
        {pill("sent", "Sent")}
        {pill("final", "Final")}
        {pill("cancelled", "Cancelled route")}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-500">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="departure">Departure soonest</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table id="briefs-table" className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className={thCls}>Brief</th>
                <th className={thCls}>Trip</th>
                <th className={thCls}>Departure</th>
                <th className={thCls}>Route</th>
                <th className={thCls}>Aircraft · tail</th>
                <th className={thCls}>Pax</th>
                <th className={thCls}>Readiness</th>
                <th className={thCls}>Sent to</th>
                <th className={thCls}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state === "loading" && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400 text-xs">
                    Loading flight briefs…
                  </td>
                </tr>
              )}
              {state === "error" && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-xs text-rose-700">
                    {errorText}{" "}
                    <button type="button" onClick={() => { setState("loading"); load(); }} className="underline">
                      Try again
                    </button>
                  </td>
                </tr>
              )}
              {state === "ready" && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400 text-xs">
                    No briefs match.
                  </td>
                </tr>
              )}
              {paged.pageRows.map((r) => {
                const st = STATUS[r.status];
                return (
                  <tr
                    key={r.id}
                    onClick={() => router.push(`/trips/${r.tripToken}/itinerary#generate-flight-brief`)}
                    className="hover:bg-slate-50/60 cursor-pointer"
                    title="Open the brief on the trip's Itinerary tab"
                  >
                    <td className="px-4 py-3.5">
                      <DocId id={r.brief} />
                    </td>
                    <td className="px-4 py-3.5">
                      <DocId id={r.trip} />
                    </td>
                    <td className="px-4 py-3.5 text-slate-900 whitespace-nowrap">{departureLabel(r)}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-900 whitespace-nowrap">{r.route || "—"}</td>
                    <td className="px-4 py-3.5 text-slate-900 whitespace-nowrap">
                      {r.aircraft} · {r.tail}
                    </td>
                    <td className="px-4 py-3.5 text-slate-900">{r.pax}</td>
                    <td className="px-4 py-3.5">
                      {r.readiness.length === 0 || r.status === "cancelled" ? (
                        <span className="text-slate-900">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {r.readiness.map((item) => (
                            <span key={item} className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                              ▲ {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-900 whitespace-nowrap">{r.sentTo || "—"}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap ${st.cls}`}>{st.text}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <TablePager {...paged} label="briefs" scrollToId="briefs-table" />
        <p className="text-[11px] text-gray-400 leading-relaxed px-4 py-3.5 m-0 border-t border-slate-100">
          A brief exists only for a booking and always belongs to one version. It can be sent once the readiness checks are green, or sent as
          a draft with the missing items listed.
        </p>
      </div>
    </div>
  );
}
