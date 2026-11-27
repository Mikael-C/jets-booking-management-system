"use client";

import React, { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Booking } from "@/types/aviation";
import type { DocumentType } from "@/lib/aviationContext";
import { creditNoteDocBooking, invoiceDocBooking } from "@/lib/financeDocs";

interface RevisionRow {
  version: number;
  label: string;
  bookingId: string;
  mongoId: string;
  type: "Quote" | "Booking";
  whatChanged: string;
  reason: string;
  amountChange: number;
  amountIsTotal: boolean;
  currency: string;
  state: "current" | "booked" | "amended" | "superseded" | "cancelled" | "cancelled_route";
  stateLabel: string;
  by: string;
  byFull: string;
  at: string | null;
  documents: { quote: boolean; invoice: boolean; brief: boolean; creditNote: boolean };
  /** This revision's own document: the full invoice for the first booking, else the change (invoice or credit note). */
  revisionInvoice?: { kind: "invoice" | "credit_note"; number: string; amount: number; currency: string; note?: any } | null;
  /** The booking's running total up to and including this revision. */
  totalInvoice?: { kind: "invoice"; number: string; amount: number; currency: string; parts: string[] } | null;
}

interface RevisionsData {
  rows: RevisionRow[];
  latestVersion: number | null;
  token: string;
  count: number;
  compare: { from: number; to: number; lines: string[]; missing?: boolean };
}

interface Props {
  trip: Booking;
  bookings: Booking[];
  normalize: (raw: any) => Booking;
  openDocument: (booking: Booking, type: DocumentType) => void;
  /** Opens the Accounting tab at the new credit note card. */
  onCreditNote: () => void;
  /** Reports the number of versions (for the tab label and header). */
  onLoaded?: (count: number, latestVersion: number | null) => void;
}

const SYMBOL: Record<string, string> = { EUR: "€", USD: "$", GBP: "£", CHF: "CHF" };
const money = (n: number, c: string) =>
  `${SYMBOL[c] || c} ${Math.abs(Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const day = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

const STATE_CLS: Record<RevisionRow["state"], string> = {
  current: "text-emerald-600 font-medium",
  booked: "bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[11px]",
  amended: "bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[11px]",
  superseded: "bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px]",
  cancelled: "bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded text-[11px]",
  cancelled_route: "bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded text-[11px]"
};

export default function TripRevisionsTab({ trip, bookings, normalize, openDocument, onCreditNote, onLoaded }: Props) {
  const [data, setData] = useState<RevisionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diffFrom, setDiffFrom] = useState<number | "">("");
  const [diffTo, setDiffTo] = useState<number | "">("");
  const [comparing, setComparing] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);

  const load = useCallback(
    async (from?: number, to?: number) => {
      const res = await api.registry.revisions(trip.id, from, to);
      return res.data as RevisionsData;
    },
    [trip.id]
  );

  useEffect(() => {
    let alive = true;
    setLoading(true);
    load()
      .then((d) => {
        if (!alive) return;
        setData(d);
        setError(null);
        setDiffFrom(d.compare?.from || "");
        setDiffTo(d.compare?.to || "");
        onLoaded?.(d.count, d.latestVersion);
      })
      .catch((err: any) => alive && setError(err?.message || "The revisions could not be loaded."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // Reload when this trip changes or gets a new version
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.id, trip.quoteVersion, trip.updatedAt]);

  const showDifferences = async () => {
    if (!diffFrom || !diffTo) return;
    setComparing(true);
    try {
      const d = await load(Number(diffFrom), Number(diffTo));
      setData((prev) => (prev ? { ...prev, compare: d.compare } : d));
    } catch (err: any) {
      setError(err?.message || "The versions could not be compared.");
    } finally {
      setComparing(false);
    }
  };

  /** The saved version itself, so its documents print with that version's details. */
  const versionBooking = async (row: RevisionRow): Promise<Booking> => {
    const local = bookings.find((b) => b.id === row.bookingId || (b as any)._id === row.mongoId);
    if (local) return local;
    if (row.bookingId === trip.id) return trip;
    const res = await api.bookings.get(row.mongoId || row.bookingId);
    return normalize(res.data);
  };

  const open = async (row: RevisionRow, type: DocumentType) => {
    setOpening(`${row.label}-${type}`);
    try {
      openDocument(await versionBooking(row), type);
    } catch {
      openDocument(trip, type);
    } finally {
      setOpening(null);
    }
  };

  /** Only this revision: its own invoice, or its credit note when the price went down. */
  const openRevisionInvoice = async (row: RevisionRow) => {
    const ri = row.revisionInvoice;
    if (!ri) return;
    setOpening(`${row.label}-rev`);
    try {
      const base = await versionBooking(row).catch(() => trip);
      if (ri.kind === "credit_note") {
        openDocument(
          creditNoteDocBooking(base, {
            number: ri.number,
            amount: ri.amount,
            against: row.totalInvoice?.number,
            reasonCategory: row.reason || `Revision ${row.label}`,
            issuedAt: ri.note?.issueDate || ri.note?.date || row.at || undefined
          }),
          "credit_note"
        );
      } else {
        openDocument(
          invoiceDocBooking(base, {
            number: ri.number,
            amount: ri.amount,
            exact: true,
            title: row.amountIsTotal ? "Private charter flight" : `Booking revision ${row.label}`,
            description: row.amountIsTotal ? "" : `Additional charge for this revision only${row.reason ? ` · ${row.reason}` : ""}`
          }),
          "invoice"
        );
      }
    } finally {
      setOpening(null);
    }
  };

  /** The whole booking: every booked revision up to this one, added together. */
  const openTotalInvoice = async (row: RevisionRow) => {
    const ti = row.totalInvoice;
    if (!ti) return;
    setOpening(`${row.label}-total`);
    try {
      const base = await versionBooking(row).catch(() => trip);
      openDocument(
        invoiceDocBooking(base, {
          number: ti.number,
          amount: ti.amount,
          exact: true,
          title: "Private charter flight · total",
          description: ti.parts.length > 1 ? `Booking total including revisions ${ti.parts.join(", ")}` : ""
        }),
        "invoice"
      );
    } finally {
      setOpening(null);
    }
  };

  const docBtn = (key: string, text: string, onClick: () => void, title?: string) => (
    <button type="button" disabled={opening === key} onClick={onClick} title={title} className="hover:underline disabled:opacity-50">
      {text}
    </button>
  );

  const invoiceLinks = (row: RevisionRow) => (
    <>
      {row.revisionInvoice &&
        !row.amountIsTotal &&
        docBtn(
          `${row.label}-rev`,
          row.revisionInvoice.kind === "credit_note" ? "Revision credit" : "Revision invoice",
          () => openRevisionInvoice(row),
          `${row.revisionInvoice.number} · ${money(row.revisionInvoice.amount, row.revisionInvoice.currency)} (this revision only)`
        )}
      {row.totalInvoice &&
        docBtn(
          `${row.label}-total`,
          row.amountIsTotal ? "Invoice" : "Total invoice",
          () => openTotalInvoice(row),
          `${row.totalInvoice.number} · ${money(row.totalInvoice.amount, row.totalInvoice.currency)} (whole booking)`
        )}
    </>
  );

  const link = (row: RevisionRow, type: DocumentType, text: string) => (
    <button
      type="button"
      disabled={opening === `${row.label}-${type}`}
      onClick={() => open(row, type)}
      className="hover:underline disabled:opacity-50"
    >
      {text}
    </button>
  );

  const rows = data?.rows || [];
  const versions = [...rows].sort((a, b) => a.version - b.version);

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 m-0">Revisions · latest first</h3>
          <span className="text-xs text-slate-400">Quote and booking versions share one sequence</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 pr-3">VERSION</th>
                <th className="py-2.5 px-3">TYPE</th>
                <th className="py-2.5 px-3">WHAT CHANGED</th>
                <th className="py-2.5 px-3">REASON</th>
                <th className="py-2.5 px-3 text-right">AMOUNT CHANGE</th>
                <th className="py-2.5 px-3">STATE</th>
                <th className="py-2.5 px-3">BY · WHEN</th>
                <th className="py-2.5 pl-3">GENERATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && !data && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400">
                    Loading revisions…
                  </td>
                </tr>
              )}
              {!loading && error && !data && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-rose-600">
                    {error}
                  </td>
                </tr>
              )}
              {data && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400">
                    No versions saved for this trip yet.
                  </td>
                </tr>
              )}
              {rows.map((row) => {
                const isCurrent = row.state === "current";
                const amount = row.amountIsTotal
                  ? money(row.amountChange, row.currency)
                  : row.amountChange === 0
                    ? money(0, row.currency)
                    : `${row.amountChange > 0 ? "+" : "−"} ${money(row.amountChange, row.currency)}`;
                return (
                  <tr key={`${row.label}-${row.bookingId}`}>
                    <td className="py-3 pr-3 font-mono font-bold text-slate-900 whitespace-nowrap">{row.label}</td>
                    <td className="py-3 px-3 whitespace-nowrap">{row.type}</td>
                    <td className="py-3 px-3">{row.whatChanged}</td>
                    <td className={`py-3 px-3 whitespace-nowrap ${row.reason ? "" : "text-slate-400"}`}>{row.reason || "—"}</td>
                    <td className="py-3 px-3 text-right font-mono whitespace-nowrap">{amount}</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={STATE_CLS[row.state] || STATE_CLS.superseded}>{row.stateLabel}</span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600" title={row.byFull}>
                      {row.by}
                      {row.at ? ` · ${day(row.at)}` : ""}
                    </td>
                    <td className="py-3 pl-3 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
                        {isCurrent ? (
                          <>
                            {link(row, "quotation", "Quote")}
                            {row.totalInvoice ? invoiceLinks(row) : row.documents.invoice && link(row, "invoice", "Invoice")}
                            {row.documents.creditNote && (
                              <button type="button" onClick={onCreditNote} className="hover:underline">
                                Credit
                              </button>
                            )}
                          </>
                        ) : row.type === "Quote" ? (
                          link(row, "quotation", "Quote PDF")
                        ) : (
                          <>
                            {row.totalInvoice ? invoiceLinks(row) : row.amountIsTotal && link(row, "invoice", "Invoice PDF")}
                            {link(row, "flight_brief", "Brief PDF")}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-400 pt-2 leading-relaxed m-0">
          Revise always opens the full form with the latest details. Saving with &quot;Complete Booking&quot; creates the next number, saves it
          and brings you back here (R-008). A booking revision adds to or subtracts from the booking rather than replacing it: each one has its own revision invoice (or credit note) and the total invoice for the whole booking.
        </p>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 m-0">Compare versions</h3>

        {versions.length < 2 ? (
          <p className="text-xs text-slate-400 m-0">There is only one version of this trip so far.</p>
        ) : (
          <>
            <div className="flex items-center gap-3 flex-wrap text-xs">
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">FROM</label>
                <select
                  value={diffFrom}
                  onChange={(e) => setDiffFrom(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                >
                  {versions.map((v) => (
                    <option key={v.label} value={v.version}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">TO</label>
                <select
                  value={diffTo}
                  onChange={(e) => setDiffTo(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                >
                  {versions.map((v) => (
                    <option key={v.label} value={v.version}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={showDifferences}
                disabled={comparing || !diffFrom || !diffTo}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
              >
                {comparing ? "Comparing…" : "Show differences"}
              </button>
            </div>

            <div className="bg-slate-50/70 border border-slate-100 rounded-lg p-3 text-xs text-slate-700 space-y-1">
              {data?.compare?.lines?.length ? (
                data.compare.lines.map((line, i) => <div key={i}>{line}</div>)
              ) : (
                <div className="text-slate-400">{data?.compare?.missing ? "One of these versions could not be found." : "No differences."}</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
