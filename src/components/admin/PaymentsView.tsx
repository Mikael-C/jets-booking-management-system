"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import DocId from "@/components/ui/DocId";
import { downloadCsv, money, shortDay } from "@/lib/financeDocs";

interface PayRow {
  id: string;
  kind: "payment" | "invoice";
  bookingId: string;
  paymentId?: string;
  status: "paid" | "proof_uploaded" | "awaiting" | "overdue";
  trip: string;
  tripToken: string;
  departure: string | null;
  client: string;
  clientEmail?: string;
  invoice: string;
  purpose: string;
  amount: number;
  currency: string;
  due: string | null;
  method: string;
  methodKey: "card" | "bank_transfer";
  proofName: string;
  proofUrl: string;
  paymentLink?: string;
  date: string | null;
}

interface Kpis {
  received: number;
  receivedCount: number;
  month: string;
  awaiting: number;
  awaitingTrips: number;
  overdue: number;
  soonUnpaidCount: number;
  soonUnpaidFirst: { trip: string; amount: number; currency: string } | null;
}

type Filter = "open" | "proof" | "paid" | "overdue" | "card" | "bank";

const thCls = "text-left text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500 px-4 py-3 whitespace-nowrap";
const labelCls = "block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-1.5";
const inputCls =
  "w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500";

const statusPill = (r: PayRow) => {
  if (r.status === "paid") return { text: "Paid", cls: "bg-emerald-50 text-emerald-700" };
  if (r.status === "proof_uploaded") return { text: "Proof uploaded · confirm", cls: "bg-amber-50 text-amber-800" };
  if (r.status === "overdue") return { text: "Overdue", cls: "bg-rose-50 text-rose-700" };
  return { text: r.methodKey === "card" ? "Awaiting card" : "Awaiting wire", cls: "bg-amber-50 text-amber-800" };
};

const flightLabel = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
  const base = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  return days >= 0 && days <= 7 ? `${base} · in ${days} d` : base;
};

export default function PaymentsView() {
  const [rows, setRows] = useState<PayRow[]>([]);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [errorText, setErrorText] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("open");
  const [sort, setSort] = useState<"newest" | "oldest" | "due">("newest");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [form, setForm] = useState({ rowId: "", amount: "", method: "bank_transfer" as "bank_transfer" | "card", reference: "", date: new Date().toISOString().slice(0, 10) });
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.registry.payments();
      setRows(Array.isArray(res?.data?.rows) ? res.data.rows : []);
      setKpis(res?.data?.kpis || null);
      setState("ready");
    } catch (err: any) {
      setErrorText(err?.message || "The server could not be reached.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(
    () => ({
      open: rows.filter((r) => r.status !== "paid").length,
      proof: rows.filter((r) => r.status === "proof_uploaded").length
    }),
    [rows]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rows.filter((r) => {
      if (filter === "open" && r.status === "paid") return false;
      if (filter === "proof" && r.status !== "proof_uploaded") return false;
      if (filter === "paid" && r.status !== "paid") return false;
      if (filter === "overdue" && r.status !== "overdue") return false;
      if (filter === "card" && r.methodKey !== "card") return false;
      if (filter === "bank" && r.methodKey !== "bank_transfer") return false;
      if (!q) return true;
      return [r.trip, r.invoice, r.client, r.purpose].some((x) => String(x || "").toLowerCase().includes(q));
    });
    list = [...list].sort((a, b) => {
      if (sort === "due") return new Date(a.due || "2999-01-01").getTime() - new Date(b.due || "2999-01-01").getTime();
      const diff = new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
      return sort === "newest" ? diff : -diff;
    });
    // Things to do first: proof to confirm, then overdue, then awaiting, then paid
    const rank = { proof_uploaded: 0, overdue: 1, awaiting: 2, paid: 3 } as const;
    if (filter === "open") list.sort((a, b) => rank[a.status] - rank[b.status]);
    return list;
  }, [rows, query, filter, sort]);

  const confirm = async (r: PayRow) => {
    if (!r.paymentId) return;
    setBusy(r.id);
    try {
      await api.registry.confirmPayment(r.bookingId, r.paymentId);
      setNotice(`Payment on ${r.invoice} confirmed as received.`);
      await load();
    } catch (err: any) {
      setNotice(err?.message || "Could not confirm the payment.");
    } finally {
      setBusy(null);
    }
  };

  const remind = async (r: PayRow) => {
    setBusy(r.id);
    try {
      const res = await api.registry.remind(r.bookingId, r.invoice);
      setNotice(res.data.emailed ? `Reminder for ${r.invoice} emailed to ${res.data.to}.` : `Reminder for ${r.invoice} logged. No email was sent (no client email or mail not set up).`);
    } catch (err: any) {
      setNotice(err?.message || "Could not send the reminder.");
    } finally {
      setBusy(null);
    }
  };

  const openRows = rows.filter((r) => r.kind === "invoice");

  const openRecord = (row?: PayRow) => {
    const target = row || openRows[0];
    setForm({
      rowId: target?.id || "",
      amount: target ? String(target.amount) : "",
      method: "bank_transfer",
      reference: "",
      date: new Date().toISOString().slice(0, 10)
    });
    setFormError("");
    setIsRecordOpen(true);
  };

  const submitRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = openRows.find((r) => r.id === form.rowId);
    const amount = parseFloat(form.amount.replace(/[^0-9.]/g, ""));
    if (!target) return setFormError("Pick the invoice the payment is for.");
    if (!(amount > 0)) return setFormError("Type the amount received.");
    setBusy("record");
    try {
      await api.registry.recordPayment(target.bookingId, {
        invoiceNumber: target.invoice,
        amount,
        method: form.method,
        reference: form.reference,
        receivedAt: new Date(`${form.date}T12:00:00Z`).toISOString()
      });
      setIsRecordOpen(false);
      setNotice(`Payment of ${money(amount, target.currency)} recorded on ${target.invoice}.`);
      await load();
    } catch (err: any) {
      setFormError(err?.message || "Could not record the payment.");
    } finally {
      setBusy(null);
    }
  };

  const exportCsv = () =>
    downloadCsv(`payments-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Status", "Trip", "Flight", "Invoice", "Client", "Purpose", "Amount", "Currency", "Due", "Method", "Proof"],
      ...filtered.map((r) => [statusPill(r).text, r.trip, r.departure ? r.departure.slice(0, 10) : "", r.invoice, r.client, r.purpose, r.amount.toFixed(2), r.currency, r.due ? r.due.slice(0, 10) : "", r.method, r.proofName])
    ]);

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

  const kpiCell = (title: string, value: string, sub: React.ReactNode, tone = "text-slate-500") => (
    <div className="px-6 py-5 border-slate-200 [&:not(:last-child)]:border-r">
      <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">{title}</div>
      <div className="text-[30px] font-bold text-slate-900 mt-1 leading-tight">{value}</div>
      <div className={`text-[14px] mt-0.5 ${tone}`}>{sub}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[30px] font-bold text-slate-900 m-0">Payments</h1>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => openRecord()}
            disabled={openRows.length === 0}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 px-4 py-2.5 rounded-lg text-[15px] font-semibold shadow-sm disabled:opacity-50"
          >
            Record payment
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 px-4 py-2.5 rounded-lg text-[15px] font-semibold shadow-sm"
          >
            Export
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCell(
          `Received · ${kpis?.month || new Date().toLocaleDateString("en-GB", { month: "short" }).toUpperCase()}`,
          money(kpis?.received || 0).replace(/\.00$/, ""),
          `${kpis?.receivedCount || 0} payment${kpis?.receivedCount === 1 ? "" : "s"}`
        )}
        {kpiCell("Awaiting", money(kpis?.awaiting || 0).replace(/\.00$/, ""), `${kpis?.awaitingTrips || 0} trip${kpis?.awaitingTrips === 1 ? "" : "s"}`, "text-amber-700")}
        {kpiCell("Overdue", money(kpis?.overdue || 0).replace(/\.00$/, ""), "", "text-rose-700")}
        {kpiCell(
          "Flies within 3 days, unpaid",
          String(kpis?.soonUnpaidCount || 0),
          kpis?.soonUnpaidFirst ? (
            <span className="inline-flex items-baseline gap-1">
              <DocId id={kpis.soonUnpaidFirst.trip} className="[&>span]:!text-amber-700" /> · {money(kpis.soonUnpaidFirst.amount, kpis.soonUnpaidFirst.currency).replace(/\.00$/, "")}
            </span>
          ) : (
            ""
          ),
          "text-amber-700"
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search trip, invoice, client..."
          className="w-full sm:w-[340px] bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
        />
        {pill("open", `Open ${counts.open}`)}
        {pill("proof", `Proof uploaded ${counts.proof}`)}
        {pill("paid", "Paid")}
        {pill("overdue", "Overdue")}
        {pill("card", "Card")}
        {pill("bank", "Bank transfer")}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[15px] text-slate-500">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-[15px] text-slate-900 focus:outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="due">Due soonest</option>
          </select>
        </div>
      </div>

      {notice && (
        <div className="flex items-center justify-between gap-3 bg-[#EEF4FD] border border-[#C9DBF5] rounded-lg px-4 py-2.5 text-sm text-slate-800">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-slate-500 hover:text-slate-800 text-xs">
            Close
          </button>
        </div>
      )}

      {isRecordOpen && (
        <form onSubmit={submitRecord} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[17px] font-bold text-slate-900 m-0">Record payment</h3>
            <button type="button" onClick={() => setIsRecordOpen(false)} className="text-sm text-slate-500 hover:text-slate-800">
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <label className={labelCls}>Invoice</label>
              <select
                value={form.rowId}
                onChange={(e) => {
                  const r = openRows.find((x) => x.id === e.target.value);
                  setForm({ ...form, rowId: e.target.value, amount: r ? String(r.amount) : form.amount });
                }}
                className={inputCls}
              >
                {openRows.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.invoice} · {r.client} · {money(r.amount, r.currency)} open
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Amount received</label>
              <input inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Method</label>
              <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as typeof form.method })} className={inputCls}>
                <option value="bank_transfer">Bank transfer</option>
                <option value="card">Card</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Received on</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls} />
            </div>
            <div className="md:col-span-5">
              <label className={labelCls}>Bank reference</label>
              <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Optional" className={inputCls} />
            </div>
          </div>
          {formError && <p className="text-sm text-rose-700 m-0">{formError}</p>}
          <div className="flex justify-end">
            <button type="submit" disabled={busy === "record"} className="bg-[#0B1320] hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
              {busy === "record" ? "Saving…" : "Save payment"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[15px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className={thCls}>Status</th>
                <th className={thCls}>Trip · flight</th>
                <th className={thCls}>Invoice</th>
                <th className={thCls}>Client</th>
                <th className={thCls}>Purpose</th>
                <th className={`${thCls} text-right`}>Amount</th>
                <th className={thCls}>Due</th>
                <th className={thCls}>Method</th>
                <th className={thCls}>Proof</th>
                <th className={thCls}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state === "loading" && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400 text-sm">
                    Loading payments…
                  </td>
                </tr>
              )}
              {state === "error" && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-sm text-rose-700">
                    {errorText}{" "}
                    <button type="button" onClick={() => { setState("loading"); load(); }} className="underline">
                      Try again
                    </button>
                  </td>
                </tr>
              )}
              {state === "ready" && filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400 text-sm">
                    Nothing here.
                  </td>
                </tr>
              )}
              {filtered.map((r) => {
                const st = statusPill(r);
                return (
                  <tr key={r.id} className="align-top hover:bg-slate-50/60">
                    <td className="px-4 py-3.5">
                      <span className={`text-[14px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${st.cls}`}>{st.text}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link href={`/trips/${r.tripToken}/accounting`} className="hover:underline">
                        <DocId id={r.trip} />
                      </Link>
                      <div className="text-[14px] text-slate-500">{flightLabel(r.departure)}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <DocId id={r.invoice} />
                    </td>
                    <td className="px-4 py-3.5 text-slate-900">{r.client}</td>
                    <td className="px-4 py-3.5 text-slate-900">{r.purpose}</td>
                    <td className="px-4 py-3.5 text-slate-900 text-right whitespace-nowrap">{money(r.amount, r.currency)}</td>
                    <td className="px-4 py-3.5 text-slate-900 whitespace-nowrap">{shortDay(r.due)}</td>
                    <td className="px-4 py-3.5 text-slate-900 whitespace-nowrap">{r.method}</td>
                    <td className="px-4 py-3.5">
                      {r.proofUrl ? (
                        <a href={r.proofUrl} download={r.proofName || "proof"} target="_blank" rel="noopener noreferrer" className="text-[#1F5FAE] underline underline-offset-2">
                          {r.proofName || "proof"}
                        </a>
                      ) : (
                        <span className="text-slate-700">{r.proofName || "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      {r.status === "proof_uploaded" && (
                        <button type="button" disabled={busy === r.id} onClick={() => confirm(r)} className="font-semibold text-[#1F5FAE] hover:underline disabled:opacity-50">
                          {busy === r.id ? "Saving…" : "Confirm received"}
                        </button>
                      )}
                      {(r.status === "awaiting" || r.status === "overdue") && (
                        <span className="inline-flex items-center gap-3">
                          <button type="button" disabled={busy === r.id} onClick={() => remind(r)} className="font-semibold text-[#1F5FAE] hover:underline disabled:opacity-50">
                            {busy === r.id ? "Sending…" : "Remind"}
                          </button>
                          <button type="button" onClick={() => openRecord(r)} className="text-[13px] text-slate-500 hover:text-slate-800 hover:underline">
                            Record
                          </button>
                        </span>
                      )}
                      {r.status === "paid" && (
                        <Link href={`/trips/${r.tripToken}/accounting`} className="text-[#1F5FAE] underline underline-offset-2">
                          Open
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[15px] text-slate-500 px-6 py-4 m-0 border-t border-slate-100">
          Amber = waiting for money or for you to confirm a wire. Green = received (card payments turn green automatically). Two or three days
          before a flight with money still open, the admin and the linked Curator are notified.
        </p>
      </div>
    </div>
  );
}
