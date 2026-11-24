"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Booking } from "@/types/aviation";
import { api } from "@/lib/api";
import DocId from "@/components/ui/DocId";
import { creditNoteDocBooking, invoiceDocBooking, money } from "@/lib/financeDocs";

interface LedgerInvoice {
  number: string;
  amount: number;
  paid: number;
  credited: number;
  open: number;
  status: string;
  purpose?: string;
  line?: string;
  paymentLink?: { url: string } | null;
}

interface LedgerRow {
  id: string;
  at: string | null;
  version: string;
  document: string;
  docType: "invoice" | "credit_note" | "payment" | "version";
  line: string;
  amount: number;
  status: string;
  statusText: string;
  proofName?: string;
  proofUrl?: string;
  paymentId?: string;
  internalNote?: string;
}

interface Ledger {
  bookingId: string;
  currency: string;
  versionLabel: string;
  totals: { invoiced: number; credited: number; netDue: number; received: number; openBalance: number };
  invoices: LedgerInvoice[];
  creditNotes: { number: string; amount: number; against: string; reasonCategory: string; internalNote: string; issuedAt: string; direction: string }[];
  rows: LedgerRow[];
  nextCreditNoteNumber: string;
}

interface Props {
  trip: Booking;
  openDocument: (booking: Booking, docType: "invoice" | "credit_note" | "quotation" | "flight_brief") => void;
  /** Called after the ledger changes so the trip page refreshes its own copy of the booking. */
  onChanged?: (ledger: Ledger) => void;
}

const REASONS = ["Cancellation", "Complimentary service", "Price correction", "Goodwill"] as const;
const OUTPUTS = [
  ["credit_only", "Credit note only"],
  ["invoice_remainder", "Invoice for remainder"],
  ["both", "Both"]
] as const;

const labelCls = "block text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-1.5";
const inputCls =
  "w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400";
const thCls = "text-left text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500 py-3 pr-3 whitespace-nowrap";

const statusCls = (r: LedgerRow) => {
  if (["paid", "received", "credited"].includes(r.status)) return "bg-emerald-50 text-emerald-700";
  if (r.status === "overdue") return "bg-rose-50 text-rose-700";
  if (["unpaid", "part_paid", "proof_uploaded"].includes(r.status)) return "bg-amber-50 text-amber-800 border border-amber-200";
  return "bg-slate-100 text-slate-700";
};

const parseMoney = (v: string) => Math.max(0, parseFloat(String(v).replace(/[^0-9.]/g, "")) || 0);

export default function TripAccountingTab({ trip, openDocument, onChanged }: Props) {
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [errorText, setErrorText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; tone: "info" | "error"; url?: string } | null>(null);

  // New credit note form
  const [against, setAgainst] = useState("");
  const [reason, setReason] = useState<(typeof REASONS)[number]>("Cancellation");
  const [feePct, setFeePct] = useState("50");
  const [amountText, setAmountText] = useState("");
  const [amountTouched, setAmountTouched] = useState(false);
  const [internalNote, setInternalNote] = useState("");
  const [output, setOutput] = useState<(typeof OUTPUTS)[number][0]>("credit_only");

  // Record payment form
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payForm, setPayForm] = useState({ invoice: "", amount: "", method: "bank_transfer" as "bank_transfer" | "card", reference: "" });

  const apply = (l: Ledger) => {
    setLedger(l);
    setState("ready");
    onChanged?.(l);
  };

  const load = useCallback(async () => {
    try {
      const res = await api.registry.ledger(trip.id);
      setLedger(res.data);
      setState("ready");
    } catch (err: any) {
      setErrorText(err?.message || "The server could not be reached.");
      setState("error");
    }
  }, [trip.id]);

  useEffect(() => {
    setState("loading");
    load();
  }, [load]);

  const creditable = useMemo(
    () => (ledger?.invoices || []).filter((i) => !["combined", "void"].includes(i.status) && i.amount - i.credited > 0.005),
    [ledger]
  );
  const openInvoices = useMemo(() => (ledger?.invoices || []).filter((i) => i.open > 0.005 && !["combined", "void"].includes(i.status)), [ledger]);

  useEffect(() => {
    if (!creditable.length) return;
    if (!creditable.some((i) => i.number === against)) setAgainst(creditable[0].number);
  }, [creditable, against]);

  const target = creditable.find((i) => i.number === against);
  const creditableLeft = target ? Math.round((target.amount - target.credited) * 100) / 100 : 0;
  const fee = Math.min(100, Math.max(0, parseFloat(feePct) || 0));
  const suggested = reason === "Cancellation" ? Math.round(creditableLeft * (1 - fee / 100) * 100) / 100 : creditableLeft;

  // Cancellation: credit follows the fee until the amount is typed by hand
  useEffect(() => {
    if (!amountTouched) setAmountText(target ? suggested.toFixed(2) : "");
  }, [suggested, target, amountTouched]);

  const creditAmount = parseMoney(amountText);
  const totals = ledger?.totals;
  // Same net effect for every output: with "remainder", the full credit is offset by the new invoice for what is left
  const netAfter = totals ? Math.round((totals.netDue - creditAmount) * 100) / 100 : 0;
  const refundOwed = totals ? Math.max(0, Math.round((totals.received - netAfter) * 100) / 100) : 0;

  const docBookingForInvoice = (number: string) => {
    const inv = ledger?.invoices.find((i) => i.number === number);
    return inv ? invoiceDocBooking(trip, { number: inv.number, amount: inv.amount }) : trip;
  };

  const run = async (key: string, fn: () => Promise<{ data: Ledger }>, success: string, after?: (l: Ledger) => void) => {
    setBusy(key);
    setNotice(null);
    try {
      const res = await fn();
      apply(res.data);
      setNotice({ text: success, tone: "info" });
      after?.(res.data);
    } catch (err: any) {
      setNotice({ text: err?.message || "That did not work. Try again.", tone: "error" });
    } finally {
      setBusy(null);
    }
  };

  const createCreditNote = () => {
    if (!target) return setNotice({ text: "There is no invoice left to credit on this trip.", tone: "error" });
    if (!(creditAmount > 0)) return setNotice({ text: "Type a credit amount.", tone: "error" });
    if (creditAmount > creditableLeft + 0.005)
      return setNotice({ text: `The credit can't be more than ${money(creditableLeft, ledger?.currency)} left on ${target.number}.`, tone: "error" });
    const number = ledger?.nextCreditNoteNumber || "";
    run(
      "credit",
      () =>
        api.registry.createCreditNote(trip.id, {
          against: target.number,
          reasonCategory: reason,
          cancellationFeePct: reason === "Cancellation" ? fee : 0,
          amount: creditAmount,
          internalNote,
          output
        }),
      `Credit note ${number} created against ${target.number}.`,
      (l) => {
        setAmountTouched(false);
        setInternalNote("");
        const note = l.creditNotes.find((n) => n.number === number);
        if (note && output !== "invoice_remainder") {
          openDocument(creditNoteDocBooking(trip, { number: note.number, amount: note.amount, against: note.against, reasonCategory: note.reasonCategory, issuedAt: note.issuedAt }), "credit_note");
        } else if (output === "invoice_remainder") {
          const remainder = [...l.invoices].reverse().find((i) => i.line?.includes(number));
          if (remainder) openDocument(invoiceDocBooking(trip, { number: remainder.number, amount: remainder.amount }), "invoice");
        }
      }
    );
  };

  const payLink = async (number: string) => {
    setBusy(`link-${number}`);
    try {
      const res = await api.registry.paymentLink(trip.id, number, window.location.origin);
      let copied = false;
      try {
        await navigator.clipboard.writeText(res.data.url);
        copied = true;
      } catch {
        copied = false;
      }
      setNotice({ text: `${copied ? "Payment link copied" : "Payment link ready"} for ${number} · ${money(res.data.amount, res.data.currency)}`, tone: "info", url: res.data.url });
      await load();
    } catch (err: any) {
      setNotice({ text: err?.message || "The payment link could not be created.", tone: "error" });
    } finally {
      setBusy(null);
    }
  };

  const recordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseMoney(payForm.amount);
    if (!payForm.invoice) return setNotice({ text: "Pick the invoice the payment is for.", tone: "error" });
    if (!(amount > 0)) return setNotice({ text: "Type the amount received.", tone: "error" });
    run(
      "pay",
      () => api.registry.recordPayment(trip.id, { invoiceNumber: payForm.invoice, amount, method: payForm.method, reference: payForm.reference }),
      `Payment of ${money(amount, ledger?.currency)} recorded on ${payForm.invoice}.`,
      () => setIsPayOpen(false)
    );
  };

  if (state === "loading") {
    return <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-400">Loading the trip&apos;s accounts…</div>;
  }
  if (state === "error" || !ledger || !totals) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-rose-700">
        {errorText || "The accounts could not be loaded."}{" "}
        <button type="button" onClick={() => { setState("loading"); load(); }} className="underline">
          Try again
        </button>
      </div>
    );
  }

  const cur = ledger.currency;
  const kpi = (label: string, value: number, tone = "text-slate-900") => (
    <div className="bg-white border border-slate-200 rounded-xl px-6 py-5">
      <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</div>
      <div className={`font-mono text-[24px] font-semibold mt-2 ${tone}`}>{money(value, cur)}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpi("Invoiced", totals.invoiced)}
        {kpi("Credited", totals.credited)}
        {kpi("Net due", totals.netDue)}
        {kpi("Received", totals.received)}
        {totals.openBalance < -0.005
          ? kpi("Refund owed", -totals.openBalance, "text-rose-700")
          : kpi("Open balance", totals.openBalance, totals.openBalance > 0.005 ? "text-amber-600" : "text-emerald-700")}
      </div>

      {notice && (
        <div
          className={`flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-2.5 text-sm ${
            notice.tone === "error" ? "bg-rose-50 border border-rose-200 text-rose-800" : "bg-[#EEF4FD] border border-[#C9DBF5] text-slate-800"
          }`}
        >
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
          <button type="button" onClick={() => setNotice(null)} className="text-xs opacity-70 hover:opacity-100">
            Close
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-6 items-start">
        {/* Trip ledger */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h3 className="text-[19px] font-bold text-slate-900 m-0">Trip ledger · latest first</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPayForm({ invoice: openInvoices[0]?.number || "", amount: openInvoices[0] ? String(openInvoices[0].open) : "", method: "bank_transfer", reference: "" });
                  setIsPayOpen((v) => !v);
                }}
                disabled={openInvoices.length === 0}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 px-3.5 py-2 rounded-lg text-[15px] disabled:opacity-40"
              >
                Record payment
              </button>
              <button
                type="button"
                disabled={openInvoices.length < 2 || busy === "combine"}
                title={openInvoices.length < 2 ? "Needs at least two open invoices" : "One invoice for everything still open"}
                onClick={() =>
                  run("combine", () => api.registry.combine(trip.id), "Open invoices combined into one.", (l) => {
                    const combined = [...l.invoices].reverse().find((i) => i.status !== "combined" && i.line?.startsWith("Combined"));
                    if (combined) openDocument(invoiceDocBooking(trip, { number: combined.number, amount: combined.amount }), "invoice");
                  })
                }
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 px-3.5 py-2 rounded-lg text-[15px] disabled:opacity-40"
              >
                {busy === "combine" ? "Combining…" : "Combine into one invoice"}
              </button>
            </div>
          </div>

          {isPayOpen && (
            <form onSubmit={recordPayment} className="mb-4 bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div className="sm:col-span-2">
                <label className={labelCls}>Invoice</label>
                <select
                  value={payForm.invoice}
                  onChange={(e) => {
                    const inv = openInvoices.find((i) => i.number === e.target.value);
                    setPayForm({ ...payForm, invoice: e.target.value, amount: inv ? String(inv.open) : payForm.amount });
                  }}
                  className={inputCls}
                >
                  {openInvoices.map((i) => (
                    <option key={i.number} value={i.number}>
                      {i.number} · {money(i.open, cur)} open
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Amount</label>
                <input inputMode="decimal" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Method</label>
                <select value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value as typeof payForm.method })} className={inputCls}>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="card">Card</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className={labelCls}>Reference</label>
                <input value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} placeholder="Optional" className={inputCls} />
              </div>
              <button type="submit" disabled={busy === "pay"} className="bg-[#0B1320] hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-[15px] font-semibold disabled:opacity-50">
                {busy === "pay" ? "Saving…" : "Save payment"}
              </button>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-[15px]">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className={thCls}>Version</th>
                  <th className={thCls}>Document</th>
                  <th className={thCls}>Line</th>
                  <th className={`${thCls} text-right`}>Amount</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledger.rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-sm text-slate-400">
                      No invoices yet. The charter invoice is created when the quote is booked.
                    </td>
                  </tr>
                )}
                {ledger.rows.map((r) => {
                  const inv = r.docType === "invoice" ? ledger.invoices.find((i) => i.number === r.document) : undefined;
                  return (
                    <tr key={r.id} className="align-top" title={r.docType === "credit_note" && r.internalNote ? `Internal: ${r.internalNote}` : undefined}>
                      <td className="py-3.5 pr-3 font-mono text-[14px] text-slate-700 whitespace-nowrap">{r.version}</td>
                      <td className="py-3.5 pr-3 font-mono text-[14px] text-slate-700 whitespace-nowrap">{r.document}</td>
                      <td className="py-3.5 pr-3 text-slate-800 min-w-[160px]">{r.line}</td>
                      <td className="py-3.5 pr-3 font-mono text-[14px] text-slate-900 text-right whitespace-nowrap">{money(r.amount, cur)}</td>
                      <td className="py-3.5 pr-3">
                        <span className={`text-[14px] px-2 py-0.5 rounded whitespace-nowrap ${statusCls(r)}`}>{r.statusText}</span>
                      </td>
                      <td className="py-3.5 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end gap-1 text-[13px]">
                          {r.docType === "invoice" && (
                            <button type="button" onClick={() => openDocument(docBookingForInvoice(r.document), "invoice")} className="text-[#1F5FAE] hover:underline">
                              PDF
                            </button>
                          )}
                          {r.docType === "invoice" && inv && inv.open > 0.005 && !["combined", "void"].includes(inv.status) && (
                            <button type="button" disabled={busy === `link-${inv.number}`} onClick={() => payLink(inv.number)} className="text-[#1F5FAE] hover:underline disabled:opacity-50">
                              {busy === `link-${inv.number}` ? "Creating…" : inv.paymentLink?.url ? "Copy pay link" : "Pay link"}
                            </button>
                          )}
                          {r.docType === "credit_note" && (
                            <button
                              type="button"
                              onClick={() => {
                                const n = ledger.creditNotes.find((x) => x.number === r.document);
                                if (n) openDocument(creditNoteDocBooking(trip, { number: n.number, amount: n.amount, against: n.against, reasonCategory: n.reasonCategory, issuedAt: n.issuedAt }), "credit_note");
                              }}
                              className="text-[#1F5FAE] hover:underline"
                            >
                              PDF
                            </button>
                          )}
                          {r.docType === "payment" && r.proofUrl && (
                            <a href={r.proofUrl} download={r.proofName || "proof"} target="_blank" rel="noopener noreferrer" className="text-[#1F5FAE] hover:underline">
                              Proof
                            </a>
                          )}
                          {r.docType === "payment" && r.status === "proof_uploaded" && r.paymentId && (
                            <button
                              type="button"
                              disabled={busy === `confirm-${r.paymentId}`}
                              onClick={() => run(`confirm-${r.paymentId}`, () => api.registry.confirmPayment(trip.id, r.paymentId as string), "Payment confirmed as received.")}
                              className="font-semibold text-[#1F5FAE] hover:underline disabled:opacity-50"
                            >
                              Confirm received
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[14px] text-slate-500 mt-4 mb-0">
            A revision that only changes route or time adds no amount, so nothing is counted twice. Every money movement is its own line with its
            own number.
          </p>
        </div>

        {/* New credit note */}
        <div id="new-credit-note-card" className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 scroll-mt-6">
          <h3 className="text-[19px] font-bold text-slate-900 m-0">
            New credit note · <span className="font-semibold">{ledger.nextCreditNoteNumber}</span>
          </h3>

          {creditable.length === 0 ? (
            <p className="text-sm text-slate-500 m-0">There is no invoice left to credit on this trip.</p>
          ) : (
            <>
              <div>
                <label className={labelCls}>Against</label>
                <select
                  value={against}
                  onChange={(e) => {
                    setAgainst(e.target.value);
                    setAmountTouched(false);
                  }}
                  className={inputCls}
                >
                  {creditable.map((i) => (
                    <option key={i.number} value={i.number}>
                      {i.number} · {money(i.amount, cur)} · {i.status.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Reason (internal, not printed)</label>
                <div className="flex flex-wrap gap-2">
                  {REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setReason(r);
                        setAmountTouched(false);
                      }}
                      className={`px-4 py-2 rounded-lg text-[15px] transition-colors ${
                        reason === r ? "bg-[#0B1320] text-white" : "bg-white border border-slate-200 text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Cancellation fee</label>
                  <div className="relative">
                    <input
                      inputMode="decimal"
                      disabled={reason !== "Cancellation"}
                      value={reason === "Cancellation" ? feePct : "0"}
                      onChange={(e) => {
                        setFeePct(e.target.value.replace(/[^0-9.]/g, ""));
                        setAmountTouched(false);
                      }}
                      className={`${inputCls} pr-8 disabled:bg-slate-50 disabled:text-slate-400`}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Credit amount</label>
                  <input
                    inputMode="decimal"
                    value={amountText}
                    onChange={(e) => {
                      setAmountText(e.target.value);
                      setAmountTouched(true);
                    }}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Internal note</label>
                <input
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder={reason === "Cancellation" ? "e.g. Client cancelled 16 Nov, 4 days before flight." : "Why this credit is given"}
                  className={inputCls}
                />
              </div>

              <div className="bg-slate-50 rounded-lg px-4 py-3 space-y-1.5 text-[14px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoiced</span>
                  <span className="font-mono text-slate-900">{money(totals.invoiced, cur)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">This credit note</span>
                  <span className="font-mono text-slate-900">{money(-creditAmount, cur)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Net due after</span>
                  <span className="font-mono text-slate-900">{money(netAfter, cur)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Received</span>
                  <span className="font-mono text-slate-900">{money(totals.received, cur)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-700">Refund owed to client</span>
                  <span className={`font-mono ${refundOwed > 0 ? "text-rose-700" : "text-slate-900"}`}>{money(refundOwed, cur)}</span>
                </div>
              </div>

              <div>
                <label className={labelCls}>Output</label>
                <div className="flex flex-wrap gap-2">
                  {OUTPUTS.map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setOutput(key)}
                      className={`px-4 py-2 rounded-lg text-[15px] transition-colors ${
                        output === key ? "bg-[#0B1320] text-white" : "bg-white border border-slate-200 text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {output !== "credit_only" && target && creditableLeft - creditAmount > 0.005 && (
                  <p className="text-[13px] text-slate-500 mt-2 mb-0">
                    {target.number} is credited in full and a new invoice of {money(creditableLeft - creditAmount, cur)} is issued for the remainder.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={createCreditNote}
                disabled={busy === "credit" || !(creditAmount > 0)}
                className="w-full bg-[#0B1320] hover:bg-slate-800 text-white px-4 py-3 rounded-lg text-[15px] font-semibold disabled:opacity-50"
              >
                {busy === "credit" ? "Creating…" : `Create credit note ${ledger.nextCreditNoteNumber}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
