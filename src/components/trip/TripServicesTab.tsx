"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Booking, TripServiceItem, TripServiceType } from "@/types/aviation";
import { deriveTripServices, formatDay, formatMoney, makeActivity } from "./tripTabUtils";

interface TripServicesTabProps {
  trip: Booking;
  onSave: (updates: Partial<Booking>) => void;
  /** Issues a credit note on the trip (saved with the trip) and returns the updated booking. */
  issueCreditNote: (
    bookingId: string,
    note: {
      amount?: number;
      reason: string;
      clientOwes: number;
      weOweClient: number;
      netBalance: number;
      originalTotal?: number;
      newTotal?: number;
    },
    extraUpdates?: Partial<Booking>
  ) => { creditNoteNumber: string; booking: Booking | null };
  onOpenCreditNote: (booking: Booking) => void;
  userName: string;
}

const labelCls = "block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1";
const inputCls =
  "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-50 disabled:text-slate-500";
const pillCls = (on: boolean) =>
  `px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all ${
    on ? "bg-[#0B1320] text-white border-[#0B1320]" : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
  }`;

const STATUS: Record<TripServiceItem["status"], { label: string; cls: string }> = {
  requested: { label: "Requested", cls: "bg-amber-50 text-amber-800 border-amber-200/70" },
  requested_operator: { label: "Requested from operator", cls: "bg-slate-100 text-slate-700 border-slate-200/70" },
  confirmed: { label: "Confirmed with supplier", cls: "bg-emerald-50 text-emerald-700 border-emerald-200/70" },
  cancelled: { label: "Cancelled", cls: "bg-rose-50 text-rose-700 border-rose-200/70" }
};

const parseMoney = (v: string) => Math.max(0, parseFloat(String(v).replace(/[^0-9.]/g, "")) || 0);

export default function TripServicesTab({ trip, onSave, issueCreditNote, onOpenCreditNote, userName }: TripServicesTabProps) {
  const legs = trip.legs || [];
  const currency = trip.pricing?.currency || "EUR";
  const saved: TripServiceItem[] = useMemo(() => trip.tripServices ?? deriveTripServices(trip), [trip]);
  const [items, setItems] = useState<TripServiceItem[]>(saved);
  const [priceDrafts, setPriceDrafts] = useState<Record<string, { client?: string; supplier?: string }>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  useEffect(() => {
    setItems(saved);
  }, [saved]);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3500);
  };

  const legLabel = (n?: number) => {
    if (!n) return legs.length > 1 ? "all legs" : "leg 1";
    const l = legs[n - 1];
    return l ? `leg ${n}` : `leg ${n}`;
  };

  const titleFor = (s: TripServiceItem) => {
    const where =
      s.timing && s.airport
        ? ` · ${s.timing === "both" ? "arrival and departure" : `on ${s.timing}`} ${s.airport}`
        : s.timing
        ? ` · on ${s.timing}`
        : "";
    if (s.type === "limousine") return `VIP limousine · ${legLabel(s.legNumber)}${where}`;
    if (s.type === "helicopter") return `Helicopter transfer · ${legLabel(s.legNumber)}${where}`;
    if (s.type === "catering") return `Catering · ${legLabel(s.legNumber)}`;
    return `${s.title || "Custom service"}${s.legNumber ? ` · ${legLabel(s.legNumber)}` : ""}`;
  };

  const persist = (next: TripServiceItem[], activityText?: string, extra: Partial<Booking> = {}) => {
    setItems(next);
    onSave({
      tripServices: next,
      ...(activityText
        ? { itineraryActivity: [makeActivity(userName, activityText, "other", "services"), ...(trip.itineraryActivity || [])] }
        : {}),
      ...extra
    });
  };

  const patchLocal = (id: string, patch: Partial<TripServiceItem>) =>
    setItems((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  /** Saves a field change (on blur, or right away for selects and pills). */
  const commit = (id: string, patch: Partial<TripServiceItem> = {}) => {
    const next = items.map((s) => (s.id === id ? { ...s, ...patch } : s));
    if (JSON.stringify(next) === JSON.stringify(saved)) return;
    persist(next);
  };

  // ---------- add ----------
  const addService = (type: TripServiceType) => {
    const firstLeg = legs[0];
    const pax = firstLeg?.passengers?.length || firstLeg?.paxCount || 1;
    const base: TripServiceItem = {
      id: `svc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      legNumber: type === "catering" && legs.length > 1 ? 0 : 1,
      clientPrice: 0,
      supplierCost: 0,
      status: "requested",
      source: "added",
      billing: "not_billed",
      addedAt: new Date().toISOString(),
      addedBy: userName
    };
    let item: TripServiceItem = base;
    if (type === "limousine") {
      item = { ...base, timing: "arrival", airport: firstLeg?.destination?.icao, location: "", vehicle: "Luxury", passengers: pax };
    } else if (type === "helicopter") {
      item = {
        ...base,
        timing: "arrival",
        airport: firstLeg?.destination?.icao,
        from: firstLeg?.destination?.name || firstLeg?.destination?.icao || "",
        to: "",
        helicopterType: "Twin-engine, e.g. AW109",
        passengers: pax,
        luggage: ""
      };
    } else if (type === "catering") {
      item = { ...base, menu: "VIP menu 1", dietary: "", included: false, status: "requested_operator" };
    } else {
      item = { ...base, title: "Custom service", instructions: "" };
    }
    persist([item, ...items], `${titleFor(item)} added`);
    flash("Service added. Fill in the details, then generate the credit note for the client.");
  };

  // ---------- credit notes ----------
  const totals = () => {
    const total = Number(trip.pricing?.totalFlightPrice) || 0;
    const services = Number(trip.pricing?.additionalServicesTotal) || 0;
    const subtotal = Number(trip.pricing?.subtotal) || total;
    return { total, services, subtotal };
  };

  const generateCreditNoteForAdded = (s: TripServiceItem) => {
    const price = s.included ? 0 : Number(s.clientPrice) || 0;
    if (price <= 0) {
      flash("Set a client price first (or the service is included, so there is nothing to bill).");
      return;
    }
    const { total, services, subtotal } = totals();
    const label = titleFor(s);
    const res = issueCreditNote(
      trip.id,
      {
        amount: price,
        reason: `Added service · ${label}`,
        clientOwes: price,
        weOweClient: 0,
        netBalance: price,
        originalTotal: total,
        newTotal: total + price
      },
      {
        pricing: { ...trip.pricing, additionalServicesTotal: services + price, subtotal: subtotal + price, totalFlightPrice: total + price },
        manualServices: [
          ...(trip.manualServices || []),
          { id: `svc-line-${s.id}`, name: label, price, details: [s.location, s.vehicle, s.menu, s.instructions].filter(Boolean).join(" · ") }
        ]
      }
    );
    const next = items.map((x) => (x.id === s.id ? { ...x, billing: "credit_note" as const, creditNoteNumber: res.creditNoteNumber } : x));
    persist(next, `Credit note ${res.creditNoteNumber} for ${label} · ${formatMoney(price, currency)}`);
    if (res.booking) onOpenCreditNote(res.booking);
  };

  const cancelService = (s: TripServiceItem) => {
    setConfirmCancel(null);
    const label = titleFor(s);
    // Not billed yet: simply remove it
    if (s.billing === "not_billed") {
      persist(items.filter((x) => x.id !== s.id), `${label} removed`);
      return;
    }
    const price = s.included ? 0 : Number(s.clientPrice) || 0;
    if (price <= 0) {
      persist(items.map((x) => (x.id === s.id ? { ...x, status: "cancelled" as const } : x)), `${label} cancelled`);
      return;
    }
    // Billed (in the quote or by credit note): credit the client back
    const { total, services, subtotal } = totals();
    const res = issueCreditNote(
      trip.id,
      {
        amount: price,
        reason: `Cancelled service · ${label}`,
        clientOwes: 0,
        weOweClient: price,
        netBalance: -price,
        originalTotal: total,
        newTotal: Math.max(0, total - price)
      },
      {
        pricing: {
          ...trip.pricing,
          additionalServicesTotal: Math.max(0, services - price),
          subtotal: Math.max(0, subtotal - price),
          totalFlightPrice: Math.max(0, total - price)
        }
      }
    );
    const next = items.map((x) =>
      x.id === s.id ? { ...x, status: "cancelled" as const, cancelCreditNoteNumber: res.creditNoteNumber } : x
    );
    persist(next, `${label} cancelled · credit note ${res.creditNoteNumber} · ${formatMoney(price, currency)} back to the client`);
    if (res.booking) onOpenCreditNote(res.booking);
  };

  const commitPrice = (s: TripServiceItem, which: "client" | "supplier") => {
    const draft = priceDrafts[s.id]?.[which];
    if (draft === undefined) return;
    const value = parseMoney(draft);
    setPriceDrafts((prev) => ({ ...prev, [s.id]: { ...prev[s.id], [which]: undefined } }));
    commit(s.id, which === "client" ? { clientPrice: value } : { supplierCost: value });
  };

  const priceInput = (s: TripServiceItem, which: "client" | "supplier", locked: boolean) => {
    const raw = which === "client" ? s.clientPrice : s.supplierCost;
    const draft = priceDrafts[s.id]?.[which];
    return (
      <input
        type="text"
        inputMode="decimal"
        disabled={locked}
        value={draft !== undefined ? draft : formatMoney(raw, currency)}
        onFocus={() => setPriceDrafts((prev) => ({ ...prev, [s.id]: { ...prev[s.id], [which]: raw ? String(raw) : "" } }))}
        onChange={(e) => setPriceDrafts((prev) => ({ ...prev, [s.id]: { ...prev[s.id], [which]: e.target.value } }))}
        onBlur={() => commitPrice(s, which)}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        className={inputCls}
      />
    );
  };

  const legSelect = (s: TripServiceItem, locked: boolean, allowAll: boolean) => (
    <select
      value={s.legNumber ?? 0}
      disabled={locked}
      onChange={(e) => {
        const n = parseInt(e.target.value, 10);
        const leg = legs[n - 1];
        const airport = s.timing === "departure" ? leg?.origin?.icao : leg?.destination?.icao;
        commit(s.id, { legNumber: n, ...(s.timing ? { airport } : {}) });
      }}
      className={inputCls}
    >
      {allowAll && legs.length > 1 && <option value={0}>All legs</option>}
      {legs.map((l, i) => (
        <option key={i} value={i + 1}>
          Leg {i + 1} · {l.origin?.icao} → {l.destination?.icao}
        </option>
      ))}
    </select>
  );

  const timingPills = (s: TripServiceItem, locked: boolean) => (
    <div className="flex items-center gap-1.5 flex-wrap">
      {(["arrival", "departure", "both"] as const).map((t) => (
        <button
          key={t}
          type="button"
          disabled={locked}
          onClick={() => {
            const leg = legs[(s.legNumber || 1) - 1];
            commit(s.id, { timing: t, airport: t === "departure" ? leg?.origin?.icao : leg?.destination?.icao });
          }}
          className={pillCls(s.timing === t)}
        >
          {t === "arrival" ? "On arrival" : t === "departure" ? "On departure" : "Both"}
        </button>
      ))}
    </div>
  );

  const text = (s: TripServiceItem, field: keyof TripServiceItem, placeholder: string, locked = false) => (
    <input
      type="text"
      disabled={locked}
      value={String((s[field] as any) ?? "")}
      onChange={(e) => patchLocal(s.id, { [field]: e.target.value } as Partial<TripServiceItem>)}
      onBlur={() => commit(s.id)}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      placeholder={placeholder}
      className={inputCls}
    />
  );

  const footerFor = (s: TripServiceItem) => {
    const parts: string[] = [];
    if (s.source === "quote") parts.push(`From the quote${trip.quoteId ? ` ${trip.quoteId}` : ""} · included in the quoted total`);
    else parts.push(`Added ${formatDay(s.addedAt)}${s.addedBy ? ` by ${s.addedBy}` : ""}`);
    if (s.billing === "not_billed" && s.status !== "cancelled") parts.push("not billed yet");
    if (s.creditNoteNumber) parts.push(`credit note ${s.creditNoteNumber}`);
    if (s.cancelCreditNoteNumber) parts.push(`cancelled · credit note ${s.cancelCreditNoteNumber}`);
    return parts.join(" · ");
  };

  const active = items.filter((s) => s.status !== "cancelled");
  const cancelled = items.filter((s) => s.status === "cancelled");

  const renderCard = (s: TripServiceItem) => {
    const isCancelled = s.status === "cancelled";
    const priceLocked = isCancelled || s.billing !== "not_billed";
    const st = STATUS[s.status];
    return (
      <div key={s.id} className={`bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm space-y-4 ${isCancelled ? "opacity-70" : ""}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {s.type === "custom" ? (
            <input
              type="text"
              disabled={isCancelled}
              value={s.title || ""}
              onChange={(e) => patchLocal(s.id, { title: e.target.value })}
              onBlur={() => commit(s.id)}
              className="text-sm font-bold text-slate-900 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-slate-500 focus:outline-none py-0.5 min-w-[200px]"
            />
          ) : (
            <h3 className="text-sm font-bold text-slate-900 m-0">{titleFor(s)}</h3>
          )}
          {isCancelled ? (
            <span className={`border text-[11px] font-medium px-2.5 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
          ) : (
            <select
              value={s.status}
              onChange={(e) => commit(s.id, { status: e.target.value as TripServiceItem["status"] })}
              className={`border text-[11px] font-medium px-2.5 py-1 rounded-full cursor-pointer focus:outline-none ${st.cls}`}
            >
              <option value="requested">Requested</option>
              <option value="requested_operator">Requested from operator</option>
              <option value="confirmed">Confirmed with supplier</option>
            </select>
          )}
        </div>

        {s.type === "limousine" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className={labelCls}>Leg</label>
              {legSelect(s, isCancelled, false)}
            </div>
            <div className="lg:col-span-3">
              <label className={labelCls}>When</label>
              {timingPills(s, isCancelled)}
            </div>
            <div>
              <label className={labelCls}>{s.timing === "departure" ? "Pick-up" : "Drop-off"}</label>
              {text(s, "location", "e.g. Hotel des Bergues, Geneva", isCancelled)}
            </div>
            <div>
              <label className={labelCls}>Vehicle</label>
              <select
                value={s.vehicle || "Luxury"}
                disabled={isCancelled}
                onChange={(e) => commit(s.id, { vehicle: e.target.value })}
                className={inputCls}
              >
                {["Sedan", "SUV", "Van", "Luxury", "Armoured SUV"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Passengers</label>
              <input
                type="number"
                min={1}
                disabled={isCancelled}
                value={s.passengers ?? ""}
                onChange={(e) => patchLocal(s.id, { passengers: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                onBlur={() => commit(s.id)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Client price</label>
              {priceInput(s, "client", priceLocked)}
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={labelCls}>Special instructions</label>
              {text(s, "instructions", "e.g. Meet at aircraft, name board", isCancelled)}
            </div>
            <div>
              <label className={labelCls}>Supplier cost (admin only)</label>
              {priceInput(s, "supplier", isCancelled)}
            </div>
          </div>
        )}

        {s.type === "helicopter" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className={labelCls}>Leg</label>
              {legSelect(s, isCancelled, false)}
            </div>
            <div className="lg:col-span-3">
              <label className={labelCls}>When</label>
              {timingPills(s, isCancelled)}
            </div>
            <div>
              <label className={labelCls}>From</label>
              {text(s, "from", "e.g. LFMN Nice", isCancelled)}
            </div>
            <div>
              <label className={labelCls}>To</label>
              {text(s, "to", "e.g. Monaco Heliport", isCancelled)}
            </div>
            <div>
              <label className={labelCls}>Helicopter type</label>
              {text(s, "helicopterType", "Twin-engine, e.g. AW109", isCancelled)}
            </div>
            <div>
              <label className={labelCls}>Passengers</label>
              <input
                type="number"
                min={1}
                disabled={isCancelled}
                value={s.passengers ?? ""}
                onChange={(e) => patchLocal(s.id, { passengers: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                onBlur={() => commit(s.id)}
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Luggage</label>
              {text(s, "luggage", "e.g. 4 cabin bags, 2 soft suitcases", isCancelled)}
            </div>
            <div>
              <label className={labelCls}>Client price</label>
              {priceInput(s, "client", priceLocked)}
            </div>
            <div>
              <label className={labelCls}>Supplier cost (admin only)</label>
              {priceInput(s, "supplier", isCancelled)}
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <label className={labelCls}>Special requests</label>
              {text(s, "instructions", "e.g. Landing permission at the hotel helipad", isCancelled)}
            </div>
          </div>
        )}

        {s.type === "catering" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className={labelCls}>Leg</label>
              {legSelect(s, isCancelled, true)}
            </div>
            <div>
              <label className={labelCls}>Menu</label>
              {text(s, "menu", "e.g. VIP menu 2 · light lunch", isCancelled)}
            </div>
            <div>
              <label className={labelCls}>Dietary notes</label>
              {text(s, "dietary", "e.g. 1 vegetarian", isCancelled)}
            </div>
            <div>
              <label className={labelCls}>Client price</label>
              {s.included ? (
                <div className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600">Included</div>
              ) : (
                priceInput(s, "client", priceLocked)
              )}
              {!priceLocked && (
                <label className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(s.included)}
                    onChange={(e) => commit(s.id, { included: e.target.checked })}
                    className="w-3.5 h-3.5 accent-[#1F6FEB]"
                  />
                  Included in the charter price
                </label>
              )}
            </div>
          </div>
        )}

        {s.type === "custom" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className={labelCls}>Leg</label>
              {legSelect(s, isCancelled, true)}
            </div>
            <div className="sm:col-span-1 lg:col-span-3">
              <label className={labelCls}>Details</label>
              {text(s, "instructions", "What the client gets", isCancelled)}
            </div>
            <div>
              <label className={labelCls}>Client price</label>
              {priceInput(s, "client", priceLocked)}
            </div>
            <div>
              <label className={labelCls}>Supplier cost (admin only)</label>
              {priceInput(s, "supplier", isCancelled)}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="text-[11px] text-slate-400">{footerFor(s)}</div>
          {!isCancelled && (
            <div className="flex items-center gap-2">
              {s.billing === "not_billed" && (
                <button
                  type="button"
                  onClick={() => generateCreditNoteForAdded(s)}
                  className="bg-[#0B1320] hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm"
                >
                  Generate credit note
                </button>
              )}
              {s.billing === "credit_note" && (
                <span className="text-[11px] font-medium text-emerald-700">✓ Billed on credit note {s.creditNoteNumber}</span>
              )}
              {confirmCancel === s.id ? (
                <span className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-slate-600">
                    {s.billing === "not_billed"
                      ? "Remove this service?"
                      : `Cancel and credit ${formatMoney(s.included ? 0 : s.clientPrice, currency)} back?`}
                  </span>
                  <button type="button" onClick={() => cancelService(s)} className="font-semibold text-rose-700 hover:underline">
                    Yes
                  </button>
                  <button type="button" onClick={() => setConfirmCancel(null)} className="font-semibold text-slate-600 hover:underline">
                    No
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmCancel(s.id)}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium"
                >
                  {s.billing === "not_billed" ? "Remove" : "Cancel service"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {toast && <div className="fixed bottom-6 right-6 z-50 bg-[#0B1320] text-white text-sm px-4 py-2.5 rounded-lg shadow-xl">{toast}</div>}

      <div className="flex items-center gap-2 flex-wrap">
        {(
          [
            ["limousine", "+ VIP limousine"],
            ["helicopter", "+ Helicopter transfer"],
            ["catering", "+ Catering"],
            ["custom", "+ Custom service"]
          ] as const
        ).map(([type, label]) => (
          <button
            key={type}
            type="button"
            onClick={() => addService(type)}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-colors"
          >
            {label}
          </button>
        ))}
      </div>

      {active.length === 0 && (
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm text-xs text-slate-500">
          No services on this trip yet. Add one with the buttons above; it is billed to the client with a credit note.
        </div>
      )}
      {active.map(renderCard)}

      {!active.some((s) => s.type === "helicopter") && (
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm space-y-2">
          <h3 className="text-sm font-bold text-slate-900 m-0">Helicopter transfer</h3>
          <p className="text-xs text-slate-400 leading-relaxed m-0">
            Not requested. When added: leg · on arrival / on departure / both · passengers · helicopter type · from and to · luggage ·
            special requests · client price · supplier cost.
          </p>
        </div>
      )}

      {cancelled.length > 0 && (
        <div className="space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Cancelled</div>
          {cancelled.map(renderCard)}
        </div>
      )}
    </div>
  );
}
