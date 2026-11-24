"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAviation, normalizeBooking } from "@/lib/aviationContext";
import { api } from "@/lib/api";
import DocId from "@/components/ui/DocId";
import { loadBooking, money, shortDay } from "@/lib/financeDocs";

interface ContractRow {
  id: string;
  bookingId: string;
  contract: string;
  tripVersion: string;
  tripToken: string;
  client: string;
  value: number;
  currency: string;
  sentAt: string | null;
  sentVia: string;
  signedAt: string | null;
  signedVia: string;
  termsVersion: string;
  status: "awaiting" | "signed" | "expired";
}

type Filter = "awaiting" | "signed" | "expired" | null;

const thCls = "text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 px-4 py-3.5 whitespace-nowrap";

const STATUS = {
  awaiting: { text: "Awaiting signature", cls: "bg-amber-50 text-amber-800" },
  signed: { text: "Signed → booked", cls: "bg-emerald-50 text-emerald-700" },
  expired: { text: "Expired unsigned", cls: "bg-rose-50 text-rose-700" }
};

const signedLabel = (iso: string | null, via: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const text = isNaN(d.getTime())
    ? String(iso)
    : `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}${d.getUTCHours() || d.getUTCMinutes() ? ` ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : ""}`;
  return via ? `${text} · ${via}` : text;
};

export default function ContractsListView() {
  const { bookings, openDocument } = useAviation();
  const [rows, setRows] = useState<ContractRow[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [errorText, setErrorText] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>(null);
  const [sort, setSort] = useState<"newest" | "oldest" | "value">("newest");

  const load = useCallback(async () => {
    try {
      const res = await api.registry.contracts();
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

  const awaitingCount = rows.filter((r) => r.status === "awaiting").length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((r) => {
      if (filter && r.status !== filter) return false;
      if (!q) return true;
      return [r.contract, r.tripVersion, r.client].some((x) => x.toLowerCase().includes(q));
    });
    return [...list].sort((a, b) => {
      if (sort === "value") return b.value - a.value;
      const diff = new Date(b.sentAt || 0).getTime() - new Date(a.sentAt || 0).getTime();
      return sort === "newest" ? diff : -diff;
    });
  }, [rows, query, filter, sort]);

  const openContract = async (r: ContractRow) => {
    const booking = await loadBooking(bookings, r.bookingId, normalizeBooking);
    if (booking) openDocument(booking, "charter_agreement");
  };

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
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight m-0">Contracts</h1>

      <div className="flex flex-wrap items-center gap-2.5">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contract, trip, client..."
          className="w-full sm:w-64 bg-white border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs shadow-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
        />
        {pill("awaiting", `Awaiting signature ${awaitingCount}`)}
        {pill("signed", "Signed")}
        {pill("expired", "Expired unsigned")}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-500">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="value">Highest value</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className={thCls}>Contract</th>
                <th className={thCls}>Trip · version</th>
                <th className={thCls}>Client</th>
                <th className={`${thCls} text-right`}>Value</th>
                <th className={thCls}>Sent</th>
                <th className={thCls}>Signed</th>
                <th className={thCls}>Terms version</th>
                <th className={thCls}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state === "loading" && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-xs">
                    Loading contracts…
                  </td>
                </tr>
              )}
              {state === "error" && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-xs text-rose-700">
                    {errorText}{" "}
                    <button type="button" onClick={() => { setState("loading"); load(); }} className="underline">
                      Try again
                    </button>
                  </td>
                </tr>
              )}
              {state === "ready" && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-xs">
                    No contracts match.
                  </td>
                </tr>
              )}
              {filtered.map((r) => {
                const st = STATUS[r.status];
                return (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3.5">
                      <button type="button" onClick={() => openContract(r)} className="hover:underline" title="Open the charter agreement">
                        <DocId id={r.contract} />
                      </button>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link href={`/trips/${r.tripToken}/documents`} className="hover:underline">
                        <DocId id={r.tripVersion} />
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-slate-900">{r.client}</td>
                    <td className="px-4 py-3.5 text-slate-900 text-right whitespace-nowrap">{money(r.value, r.currency)}</td>
                    <td className="px-4 py-3.5 text-slate-900 whitespace-nowrap">
                      {shortDay(r.sentAt)}
                      {r.status !== "signed" && r.sentVia ? ` · ${r.sentVia}` : ""}
                    </td>
                    <td className="px-4 py-3.5 text-slate-900 whitespace-nowrap">{signedLabel(r.signedAt, r.signedVia)}</td>
                    <td className="px-4 py-3.5 text-slate-900">{r.termsVersion}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap ${st.cls}`}>{st.text}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-gray-400 leading-relaxed px-4 py-3.5 m-0 border-t border-slate-100">
          A signed contract is what turns a quote into a booking. Each contract stores the version of the terms it was issued with.
        </p>
      </div>
    </div>
  );
}
