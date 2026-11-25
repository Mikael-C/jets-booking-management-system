"use client";

import React, { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toaster";
import type { TaxRule } from "@/lib/taxes";

const TYPE_LABEL: Record<string, string> = { VAT: "VAT", US_FET: "US FET", EXEMPT: "Exempt", OUTSIDE_SCOPE: "Outside scope" };
const APPLIES_LABEL: Record<string, string> = {
  domestic: "Domestic leg (departure and arrival in this country)",
  international: "International leg",
  segment: "Per passenger, per domestic leg",
  any: "Any line given this code"
};

const empty = {
  code: "",
  jurisdiction: "",
  type: "VAT",
  appliesTo: "domestic",
  rateType: "percent",
  rate: "",
  currency: "",
  effectiveFrom: new Date().toISOString().slice(0, 10),
  effectiveTo: "",
  wording: "",
  source: ""
};

const inputCls = "w-full border border-[var(--line)] rounded-md px-2.5 py-1.5 text-xs bg-white";

/** Settings · Taxes (R-091): the table the tax adviser keeps. */
export default function TaxRulesPanel() {
  const [rows, setRows] = useState<TaxRule[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [draft, setDraft] = useState<any | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [edit, setEdit] = useState<any>({});
  const [rateFor, setRateFor] = useState<string | null>(null);
  const [newRate, setNewRate] = useState({ rate: "", effectiveFrom: "", wording: "" });
  const [historyFor, setHistoryFor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.taxRules.list();
      setRows(Array.isArray(res?.data) ? res.data : []);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn: () => Promise<any>, ok: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      toast(ok);
      await load();
      return true;
    } catch (err: any) {
      toast(err?.message || "That did not work.", "error");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const toConfirm = rows.filter((r) => r.status !== "confirmed").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold font-display text-[var(--ink)] m-0">Taxes</h3>
          <p className="text-xs text-[var(--muted)] max-w-2xl">
            Kept by the tax adviser. Tax is decided leg by leg from the departure and arrival countries: a domestic leg uses that country&apos;s row,
            an international leg the exempt row and its wording. Tax is charged on the leg&apos;s full charter price; margins never print. A row
            &ldquo;To confirm&rdquo; is never used on a live document. A rate change is a new row with a start date; issued quotes keep their rates.
          </p>
        </div>
        <button type="button" onClick={() => setDraft({ ...empty })} className="btn-primary text-xs">
          Add a row
        </button>
      </div>

      {toConfirm > 0 && (
        <div className="callout amber text-[12px]">
          {toConfirm} row{toConfirm === 1 ? "" : "s"} to confirm before go-live. Quotes with a domestic leg in those countries cannot be sent until the
          adviser confirms the row.
        </div>
      )}

      {draft && (
        <div className="border border-[var(--line)] rounded-xl p-4 space-y-3 bg-slate-50/60">
          <div className="text-sm font-bold">New row</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <label className="text-[11px] font-semibold text-[var(--muted)]">
              Code
              <input className={inputCls} value={draft.code} placeholder="FR-VAT-DOM" onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })} />
            </label>
            <label className="text-[11px] font-semibold text-[var(--muted)]">
              Jurisdiction
              <input className={inputCls} value={draft.jurisdiction} placeholder="France" onChange={(e) => setDraft({ ...draft, jurisdiction: e.target.value })} />
            </label>
            <label className="text-[11px] font-semibold text-[var(--muted)]">
              Type
              <select className={inputCls} value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
                {Object.entries(TYPE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[11px] font-semibold text-[var(--muted)]">
              When it applies
              <select className={inputCls} value={draft.appliesTo} onChange={(e) => setDraft({ ...draft, appliesTo: e.target.value })}>
                {Object.entries(APPLIES_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[11px] font-semibold text-[var(--muted)]">
              Rate
              <div className="flex gap-1.5">
                <input className={inputCls} type="number" step="0.01" value={draft.rate} onChange={(e) => setDraft({ ...draft, rate: e.target.value })} />
                <select className={inputCls} value={draft.rateType} onChange={(e) => setDraft({ ...draft, rateType: e.target.value })}>
                  <option value="percent">%</option>
                  <option value="per_pax">per passenger</option>
                </select>
              </div>
            </label>
            <label className="text-[11px] font-semibold text-[var(--muted)]">
              Effective from
              <input className={inputCls} type="date" value={draft.effectiveFrom} onChange={(e) => setDraft({ ...draft, effectiveFrom: e.target.value })} />
            </label>
            <label className="text-[11px] font-semibold text-[var(--muted)]">
              Effective to
              <input className={inputCls} type="date" value={draft.effectiveTo} onChange={(e) => setDraft({ ...draft, effectiveTo: e.target.value })} />
            </label>
            <label className="text-[11px] font-semibold text-[var(--muted)]">
              Source
              <input className={inputCls} value={draft.source} placeholder="Adviser memo, date" onChange={(e) => setDraft({ ...draft, source: e.target.value })} />
            </label>
          </div>
          <label className="block text-[11px] font-semibold text-[var(--muted)]">
            Wording the invoice must print
            <textarea className={inputCls} rows={2} value={draft.wording} onChange={(e) => setDraft({ ...draft, wording: e.target.value })} />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              className="btn-primary text-xs"
              onClick={async () => {
                const ok = await run(() => api.taxRules.create({ ...draft, rate: Number(draft.rate) || 0 }), `Row ${draft.code} added · to confirm.`);
                if (ok) setDraft(null);
              }}
            >
              Save row
            </button>
            <button type="button" className="btn-secondary text-xs" onClick={() => setDraft(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {state === "loading" && <div className="text-xs text-[var(--muted)]">Loading the tax table…</div>}
      {state === "error" && (
        <div className="callout amber text-[12px]">
          The tax table could not be loaded from the server.{" "}
          <button type="button" className="underline" onClick={load}>
            Try again
          </button>
        </div>
      )}

      {state === "ready" && (
        <div className="overflow-x-auto border border-[var(--line)] rounded-xl">
          <table className="w-full text-[12px]">
            <thead className="bg-slate-50 text-[10.5px] uppercase tracking-wider text-[var(--muted)]">
              <tr>
                <th className="text-left px-3 py-2">Jurisdiction · type</th>
                <th className="text-left px-3 py-2">When it applies</th>
                <th className="text-right px-3 py-2">Rate</th>
                <th className="text-left px-3 py-2">Effective</th>
                <th className="text-left px-3 py-2">Wording on the invoice</th>
                <th className="text-left px-3 py-2">Status · source</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isEditing = editing === r.code;
                return (
                  <React.Fragment key={r.code}>
                    <tr className="border-t border-[var(--line)] align-top">
                      <td className="px-3 py-2.5">
                        <div className="font-semibold">{r.jurisdiction}</div>
                        <div className="text-[var(--muted)] font-mono text-[11px]">
                          {TYPE_LABEL[r.type] || r.type} · {r.code}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[var(--muted)]">{APPLIES_LABEL[r.appliesTo] || r.appliesTo}</td>
                      <td className="px-3 py-2.5 text-right font-mono whitespace-nowrap">
                        {r.rateType === "per_pax" ? `${r.currency || ""} ${r.rate} / pax` : `${r.rate} %`}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {r.effectiveFrom || "—"}
                        {r.effectiveTo ? ` → ${r.effectiveTo}` : " →"}
                      </td>
                      <td className="px-3 py-2.5 max-w-[260px]">
                        {isEditing ? (
                          <textarea className={inputCls} rows={2} value={edit.wording ?? r.wording ?? ""} onChange={(e) => setEdit({ ...edit, wording: e.target.value })} />
                        ) : (
                          r.wording || <span className="text-[var(--muted)]">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                            r.status === "confirmed" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {r.status === "confirmed" ? "Confirmed" : "To confirm"}
                        </span>
                        {isEditing ? (
                          <input className={`${inputCls} mt-1`} value={edit.source ?? r.source ?? ""} onChange={(e) => setEdit({ ...edit, source: e.target.value })} />
                        ) : (
                          <div className="text-[var(--muted)] text-[11px] mt-1">{r.source || "—"}</div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-right space-x-2">
                        {isEditing ? (
                          <>
                            {r.status !== "confirmed" && (
                              <input
                                className={`${inputCls} !w-20 inline-block`}
                                type="number"
                                step="0.01"
                                value={edit.rate ?? r.rate}
                                onChange={(e) => setEdit({ ...edit, rate: e.target.value })}
                              />
                            )}
                            <button
                              type="button"
                              className="text-blue-700 font-semibold"
                              onClick={async () => {
                                const patch = { ...edit, ...(edit.rate !== undefined ? { rate: Number(edit.rate) } : {}) };
                                const ok = await run(() => api.taxRules.update(r.code, patch), `${r.code} saved.`);
                                if (ok) {
                                  setEditing(null);
                                  setEdit({});
                                }
                              }}
                            >
                              Save
                            </button>
                            <button type="button" className="text-[var(--muted)]" onClick={() => (setEditing(null), setEdit({}))}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            {r.status === "confirmed" ? (
                              <button type="button" className="text-[var(--muted)] hover:text-[var(--ink)]" onClick={() => run(() => api.taxRules.unconfirm(r.code), `${r.code} marked to confirm.`)}>
                                Unconfirm
                              </button>
                            ) : (
                              <button type="button" className="text-emerald-700 font-semibold" onClick={() => run(() => api.taxRules.confirm(r.code), `${r.code} confirmed.`)}>
                                Confirm
                              </button>
                            )}
                            <button type="button" className="text-blue-700" onClick={() => (setEditing(r.code), setEdit({}))}>
                              Edit
                            </button>
                            {r.type !== "EXEMPT" && r.type !== "OUTSIDE_SCOPE" && (
                              <button
                                type="button"
                                className="text-blue-700"
                                onClick={() => {
                                  setRateFor(rateFor === r.code ? null : r.code);
                                  setNewRate({ rate: String(r.rate), effectiveFrom: "", wording: r.wording || "" });
                                }}
                              >
                                New rate
                              </button>
                            )}
                            <button type="button" className="text-[var(--muted)]" onClick={() => setHistoryFor(historyFor === r.code ? null : r.code)}>
                              Log
                            </button>
                            {r.status !== "confirmed" && (
                              <button
                                type="button"
                                className="text-red-700"
                                onClick={() => {
                                  if (window.confirm(`Remove ${r.code}? It was never confirmed.`)) run(() => api.taxRules.remove(r.code), `${r.code} removed.`);
                                }}
                              >
                                Remove
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                    {rateFor === r.code && (
                      <tr className="bg-slate-50/70">
                        <td colSpan={7} className="px-3 py-3">
                          <div className="flex flex-wrap items-end gap-3">
                            <label className="text-[11px] font-semibold text-[var(--muted)]">
                              New rate {r.rateType === "per_pax" ? "(per passenger)" : "(%)"}
                              <input className={inputCls} type="number" step="0.01" value={newRate.rate} onChange={(e) => setNewRate({ ...newRate, rate: e.target.value })} />
                            </label>
                            <label className="text-[11px] font-semibold text-[var(--muted)]">
                              Starts on
                              <input className={inputCls} type="date" value={newRate.effectiveFrom} onChange={(e) => setNewRate({ ...newRate, effectiveFrom: e.target.value })} />
                            </label>
                            <label className="text-[11px] font-semibold text-[var(--muted)] flex-1 min-w-[220px]">
                              Wording
                              <input className={inputCls} value={newRate.wording} onChange={(e) => setNewRate({ ...newRate, wording: e.target.value })} />
                            </label>
                            <button
                              type="button"
                              className="btn-primary text-xs"
                              disabled={busy}
                              onClick={async () => {
                                const ok = await run(
                                  () => api.taxRules.newRate(r.code, { rate: Number(newRate.rate) || 0, effectiveFrom: newRate.effectiveFrom, wording: newRate.wording }),
                                  `New rate from ${newRate.effectiveFrom} added · to confirm. ${r.code} ends the day before.`
                                );
                                if (ok) setRateFor(null);
                              }}
                            >
                              Add new rate
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {historyFor === r.code && (
                      <tr className="bg-slate-50/70">
                        <td colSpan={7} className="px-3 py-2 text-[11px] text-[var(--muted)]">
                          {(r.history || []).length === 0
                            ? "No changes logged."
                            : (r.history || [])
                                .slice()
                                .reverse()
                                .map((h, i) => (
                                  <div key={i}>
                                    {new Date(h.at).toLocaleString("en-GB")} · {h.by} · {h.what}
                                  </div>
                                ))}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
