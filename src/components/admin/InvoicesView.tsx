"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAviation, normalizeBooking } from "@/lib/aviationContext";
import { api } from "@/lib/api";
import DocId from "@/components/ui/DocId";
import { creditNoteDocBooking, downloadCsv, invoiceDocBooking, loadBooking, money, shortDay } from "@/lib/financeDocs";

interface DocRow {
  id: string;
  bookingId: string;
  number: string;
  type: string;
  kind: "invoice" | "credit_note";
  trip: string;
  tripToken: string;
  client: string;
  date: string | null;
  amount: number;
  open: number;
  currency: string;
  appliesTo: string;
  status: string;
  combined: boolean;
  paymentLink?: string;
  internalNote?: string;
}

type Filter = "all" | "invoices" | "credit_notes" | "unpaid" | "combined" | "this_month";

const STATUS: Record<string, { label: string; cls: string }> = {
  issued: { label: "Issued", cls: "bg-slate-100 text-slate-700" },
  credited: { label: "Credited", cls: "bg-emerald-50 text-emerald-700" },
  paid: { label: "Paid", cls: "bg-emerald-50 text-emerald-700" },
  unpaid: { label: "Unpaid", cls: "bg-amber-50 text-amber-800" },
  part_paid: { label: "Part paid", cls: "bg-amber-50 text-amber-800" },
  proof_uploaded: { label: "Proof uploaded", cls: "bg-amber-50 text-amber-800" },
  overdue: { label: "Overdue", cls: "bg-rose-50 text-rose-700" },
  combined: { label: "Combined", cls: "bg-slate-100 text-slate-600" },
  void: { label: "Void", cls: "bg-slate-100 text-slate-500" }
};

const thCls = "text-left text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500 px-4 py-3 whitespace-nowrap";

export default function InvoicesView() {
  const { bookings, openDocument, role } = useAviation();
  const [rows, setRows] = useState<DocRow[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [errorText, setErrorText] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "amount">("newest");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; url?: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.registry.invoices();
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

  const isAdmin = role === "admin" || role === "super_admin" || role === "finance";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = new Date();
    let list = rows.filter((r) => {
      if (filter === "invoices" && r.kind !== "invoice") return false;
      if (filter === "credit_notes" && r.kind !== "credit_note") return false;
      if (filter === "unpaid" && !(r.kind === "invoice" && ["unpaid", "overdue", "part_paid", "proof_uploaded"].includes(r.status))) return false;
      if (filter === "combined" && !r.combined) return false;
      if (filter === "this_month") {
        const d = r.date ? new Date(r.date) : null;
        if (!d || d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      }
      if (!q) return true;
      return [r.number, r.trip, r.client, r.appliesTo].some((x) => String(x || "").toLowerCase().includes(q));
    });
    list = [...list].sort((a, b) => {
      if (sort === "amount") return Math.abs(b.amount) - Math.abs(a.amount);
      const diff = new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
      return sort === "newest" ? diff : -diff;
    });
    return list;
  }, [rows, query, filter, sort]);

  const openPdf = async (r: DocRow) => {
    const booking = await loadBooking(bookings, r.bookingId, normalizeBooking);
    if (!booking) {
      setNotice({ text: `Could not open ${r.number}: the trip was not found.` });
      return;
    }
    if (r.kind === "invoice") openDocument(invoiceDocBooking(booking, { number: r.number, amount: r.amount }), "invoice");
    else openDocument(creditNoteDocBooking(booking, { number: r.number, amount: r.amount, against: r.appliesTo, issuedAt: r.date || undefined }), "credit_note");
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };

  const generateLink = async (r: DocRow) => {
    setBusy(r.id);
    try {
      const res = await api.registry.paymentLink(r.bookingId, r.number, window.location.origin);
      const url = res.data.url;
      const copied = await copy(url);
      setNotice({
        text: `${copied ? "Payment link copied" : "Payment link ready"} · ${r.number} · ${money(res.data.amount, res.data.currency)}${
          res.data.provider === "Stripe" ? " · card or bank transfer" : " · bank transfer with proof upload"
        }`,
        url
      });
      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, paymentLink: url } : x)));
    } catch (err: any) {
      setNotice({ text: err?.message || "The payment link could not be created." });
    } finally {
      setBusy(null);
    }
  };

  const exportCsv = () => {
    downloadCsv(`invoices-credit-notes-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Number", "Type", "Trip", "Client", "Date", "Amount", "Currency", "Applies to", "Status"],
      ...filtered.map((r) => [r.number, r.type, r.trip, r.client, r.date ? r.date.slice(0, 10) : "", r.amount.toFixed(2), r.currency, r.appliesTo, STATUS[r.status]?.label || r.status])
    ]);
  };

  const pill = (key: Filter, label: string) => (
    <button
      key={key}
      type="button"
      onClick={() => setFilter(key)}
      className={`px-4 py-2 rounded-full border text-[15px] transition-colors ${
        filter === key ? "bg-[#0B1320] text-white border-[#0B1320]" : "bg-white text-slate-800 border-slate-200 hover:border-slate-400"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[30px] font-bold text-slate-900 m-0">Invoices &amp; credit notes</h1>
        <button
          type="button"
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 px-4 py-2.5 rounded-lg text-[15px] font-semibold shadow-sm disabled:opacity-50"
        >
          Export for accountant
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search number, trip, client..."
          className="w-full sm:w-[340px] bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
        />
        {pill("all", "All")}
        {pill("invoices", "Invoices")}
        {pill("credit_notes", "Credit notes")}
        {pill("unpaid", "Unpaid")}
        {pill("combined", "Combined")}
        {pill("this_month", "This month")}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[15px] text-slate-500">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-[15px] text-slate-900 focus:outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="amount">Largest amount</option>
          </select>
        </div>
      </div>

      {notice && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#EEF4FD] border border-[#C9DBF5] rounded-lg px-4 py-2.5 text-sm text-slate-800">
          <span>
            {notice.text}
            {notice.url && (
              <>
                {" · "}
                <a href={notice.url} target="_blank" rel="noopener noreferrer" className="text-[#1F5FAE] underline break-all">
                  {notice.url}
                </a>
              </>
            )}
          </span>
          <button type="button" onClick={() => setNotice(null)} className="text-slate-500 hover:text-slate-800 text-xs">
            Close
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[15px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className={thCls}>Number</th>
                <th className={thCls}>Type</th>
                <th className={thCls}>Trip</th>
                <th className={thCls}>Client</th>
                <th className={thCls}>Date</th>
                <th className={`${thCls} text-right`}>Amount</th>
                <th className={thCls}>Applies to</th>
                <th className={thCls}>Status</th>
                <th className={thCls}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state === "loading" && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400 text-sm">
                    Loading invoices and credit notes…
                  </td>
                </tr>
              )}
              {state === "error" && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-rose-700">
                    {errorText}{" "}
                    <button type="button" onClick={() => { setState("loading"); load(); }} className="underline">
                      Try again
                    </button>
                  </td>
                </tr>
              )}
              {state === "ready" && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400 text-sm">
                    No documents match.
                  </td>
                </tr>
              )}
              {filtered.map((r) => {
                const st = STATUS[r.status] || STATUS.issued;
                const payable = r.kind === "invoice" && r.open > 0 && !["combined", "void", "credited", "paid"].includes(r.status);
                return (
                  <tr key={r.id} className="hover:bg-slate-50/60" title={r.kind === "credit_note" && isAdmin && r.internalNote ? `Internal reason: ${r.internalNote}` : undefined}>
                    <td className="px-4 py-3.5">
                      <DocId id={r.number} />
                    </td>
                    <td className="px-4 py-3.5 text-slate-900">{r.type}</td>
                    <td className="px-4 py-3.5">
                      <Link href={`/trips/${r.tripToken}/accounting`} className="hover:underline">
                        <DocId id={r.trip} />
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-slate-900">{r.client}</td>
                    <td className="px-4 py-3.5 text-slate-900 whitespace-nowrap">{shortDay(r.date)}</td>
                    <td className="px-4 py-3.5 text-slate-900 text-right whitespace-nowrap">{money(r.amount, r.currency)}</td>
                    <td className="px-4 py-3.5 text-slate-900">{/^(INV|CN)-/i.test(r.appliesTo) ? <DocId id={r.appliesTo} /> : r.appliesTo}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[13px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-3">
                        {r.kind === "invoice" && (
                          <button
                            type="button"
                            disabled={!payable || busy === r.id}
                            onClick={() => (r.paymentLink && payable ? copy(r.paymentLink).then((ok) => setNotice({ text: ok ? `Payment link copied · ${r.number}` : `Payment link · ${r.number}`, url: r.paymentLink })) : generateLink(r))}
                            title={payable ? "Create a link the client can pay with" : "Nothing left to pay on this invoice"}
                            className="text-[13px] font-semibold text-[#1F5FAE] border border-[#C9DBF5] bg-[#F4F8FE] hover:bg-[#E6EEFA] px-2.5 py-1 rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {busy === r.id ? "Creating…" : r.paymentLink && payable ? "Copy pay link" : "Generate payment link"}
                          </button>
                        )}
                        <button type="button" onClick={() => openPdf(r)} className="text-[#1F5FAE] underline underline-offset-2 hover:text-[#174A88]">
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[15px] text-slate-500 px-6 py-4 m-0 border-t border-slate-100">
          Invoices and credit notes are created on the trip&apos;s Accounting tab, never here. This list is for finding and exporting them. The
          internal credit-note reason shows on hover for admins only.
        </p>
      </div>
    </div>
  );
}
