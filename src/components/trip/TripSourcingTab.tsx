"use client";

import React, { useMemo, useState } from "react";
import { Booking, OperatorRecord, SourcingOption } from "@/types/aviation";
import { Check } from "lucide-react";
import { formatMoney, makeActivity, normalizeTime } from "./tripTabUtils";

interface TripSourcingTabProps {
  trip: Booking;
  operators: OperatorRecord[];
  onSave: (updates: Partial<Booking>) => void;
  userName: string;
}

const thCls = "text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 px-3 py-3 whitespace-nowrap";
const labelCls = "block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-1.5";
const inputCls =
  "w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500";

const CURRENT_OFFER_ID = "current-operator";

const shortDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

const receivedLabel = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} ${d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit"
  })}`;
};

const availabilityPill = (opt: SourcingOption) => {
  switch (opt.availability) {
    case "rechecked":
      return { cls: "bg-emerald-50 text-emerald-700", text: `Rechecked ${shortDate(opt.availabilityCheckedAt)}`.trim() };
    case "available":
      return { cls: "bg-emerald-50 text-emerald-700", text: `Available ${shortDate(opt.availabilityCheckedAt)}`.trim() };
    case "declined":
      return { cls: "bg-red-50 text-red-700", text: `Declined ${shortDate(opt.availabilityCheckedAt)}`.trim() };
    default:
      return { cls: "bg-slate-100 text-slate-600", text: "Not checked" };
  }
};

const emptyForm = {
  operatorName: "",
  aircraftType: "",
  aircraftRegistration: "",
  aircraftYear: "",
  refurbYear: "",
  baseAirport: "",
  price: "",
  availability: "not_checked" as NonNullable<SourcingOption["availability"]>,
  safetyRating: "",
  photoUrls: "",
  validUntil: "",
  isPreferred: false
};

export default function TripSourcingTab({ trip, operators, onSave, userName }: TripSourcingTabProps) {
  const [copied, setCopied] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const currency = trip.pricing?.currency || "EUR";
  const legs = trip.legs || [];
  const stored = trip.sourcingOptions || [];

  // The operator already on the trip shows as the selected offer until offers are logged against it
  const offers: SourcingOption[] = useMemo(() => {
    const hasSelected = stored.some((o) => o.selected);
    const list = [...stored];
    const currentName = trip.operator?.companyName;
    const alreadyListed = list.some((o) => currentName && o.operatorName === currentName);
    if (currentName && !alreadyListed) {
      list.unshift({
        id: CURRENT_OFFER_ID,
        operatorName: currentName,
        aircraftType: trip.aircraft?.name || legs[0]?.aircraftType || "",
        aircraftRegistration: legs[0]?.aircraftRegistration || trip.aircraft?.registration,
        aircraftYear: trip.aircraft?.yearOfManufacture,
        refurbYear: trip.aircraft?.yearOfRefurbishment,
        baseAirport: "",
        price: trip.pricing?.operatorCost || trip.pricing?.flightPrice || 0,
        currency,
        taxesIncluded: true,
        validUntil: "",
        createdAt: trip.createdAt,
        receivedAt: trip.createdAt,
        availability: "not_checked",
        selected: !hasSelected,
        isPreferred: operators.some(
          (op) => (op.tradingName === currentName || op.legalName === currentName) && op.status === "approved"
        )
      });
    }
    return list;
  }, [stored, trip.operator?.companyName, trip.aircraft, trip.pricing, trip.createdAt, legs, currency, operators]);

  const materialize = (list: SourcingOption[]) =>
    list.map((o) => (o.id === CURRENT_OFFER_ID ? { ...o, id: `src-current-${Date.now()}` } : o));

  // ---------- request for the marketplace ----------
  const marketplaceRows = useMemo(() => {
    const rows: { label: string; value: string; mono?: boolean }[] = [];
    legs.forEach((leg, i) => {
      const prefix = legs.length > 1 ? `Leg ${i + 1} · ` : "";
      const date = leg.flightDate ? new Date(`${leg.flightDate}T00:00:00`) : null;
      const dateText =
        date && !isNaN(date.getTime())
          ? date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
          : leg.flightDate || "";
      rows.push({
        label: `${prefix}Departure`,
        value: `${leg.origin?.icao || "—"} · ${dateText} · ${normalizeTime(leg.departureTimeLocal) || leg.departureTimeLocal || "—"} LT (±2 h)`,
        mono: true
      });
      rows.push({ label: `${prefix}Arrival`, value: leg.destination?.icao || "—", mono: true });
    });
    const paxCount = legs[0]?.passengers?.length || legs[0]?.paxCount || 0;
    const pet = trip.petDetails?.hasPets
      ? ` + ${trip.petDetails.petCount || 1} ${String(trip.petDetails.petType || "pet").toLowerCase()}${
          trip.petDetails.totalWeightKg ? ` (${trip.petDetails.totalWeightKg} kg, in cabin)` : " (in cabin)"
        }`
      : "";
    rows.push({ label: "Passengers", value: `${paxCount}${pet}` });
    const lav = (trip as any).lavatoryType || (trip.aircraft as any)?.lavatoryType;
    rows.push({
      label: "Category",
      value: [trip.aircraft?.categoryLabel || "—", lav ? `${String(lav).toLowerCase()} lavatory preferred` : ""].filter(Boolean).join(" · ")
    });
    const lug = legs[0]?.luggage;
    if (lug) {
      const hard = lug.standardSuitcases || 0;
      const soft = Math.max(0, (lug.pieceCount || 0) - hard);
      rows.push({
        label: "Luggage",
        value: [
          hard ? `${hard} hard suitcases${lug.dimensionsDescription ? ` (${lug.dimensionsDescription})` : ""}` : "",
          soft ? `${soft} soft bags` : "",
          lug.specialLuggageDescription || ""
        ]
          .filter(Boolean)
          .join(", ") || `${lug.pieceCount} pieces`
      });
    } else {
      rows.push({ label: "Luggage", value: "Not given" });
    }
    const notes = [
      trip.services?.deicingInsurance && trip.services.deicingInsurance !== "none" ? "De-icing protection if offered" : "",
      (trip as any).notesToOperator || ""
    ]
      .filter(Boolean)
      .join(" · ");
    rows.push({ label: "Notes to operator", value: notes || "—" });
    return rows;
  }, [legs, trip]);

  const copyForAvinode = async () => {
    const text = marketplaceRows.map((r) => `${r.label}: ${r.value}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for browsers without clipboard permission
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      document.body.removeChild(area);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  // ---------- offers ----------
  const selectOffer = (opt: SourcingOption) => {
    if (opt.selected) return;
    const list = materialize(offers).map((o) => ({ ...o, selected: o.id === opt.id || (opt.id === CURRENT_OFFER_ID && o.id.startsWith("src-current-")) }));
    const chosen = list.find((o) => o.selected) || opt;
    // The selected offer feeds Pricing (cost) and the quote (aircraft, year, photos)
    const updates: Partial<Booking> = {
      sourcingOptions: list,
      pricing: { ...trip.pricing, operatorCost: chosen.price },
      operator: { ...trip.operator, companyName: chosen.operatorName },
      aircraft: {
        ...trip.aircraft,
        name: chosen.aircraftType || trip.aircraft?.name,
        yearOfManufacture: chosen.aircraftYear ?? trip.aircraft?.yearOfManufacture,
        yearOfRefurbishment: chosen.refurbYear ?? trip.aircraft?.yearOfRefurbishment,
        ...(chosen.aircraftRegistration ? { registration: chosen.aircraftRegistration } : {})
      },
      itineraryActivity: [
        makeActivity(
          userName,
          `Operator offer selected · ${chosen.operatorName} · ${chosen.aircraftType} · ${formatMoney(chosen.price, chosen.currency)}`,
          "sourcing",
          "operator offer"
        ),
        ...(trip.itineraryActivity || [])
      ]
    };
    onSave(updates);
  };

  const cycleAvailability = (opt: SourcingOption) => {
    const order: NonNullable<SourcingOption["availability"]>[] = ["not_checked", "rechecked", "declined"];
    const current = opt.availability || "not_checked";
    const next = order[(order.indexOf(current) + 1) % order.length];
    const list = materialize(offers).map((o) =>
      o.id === opt.id || (opt.id === CURRENT_OFFER_ID && o.id.startsWith("src-current-") && o.operatorName === opt.operatorName)
        ? { ...o, availability: next, availabilityCheckedAt: next === "not_checked" ? undefined : new Date().toISOString() }
        : o
    );
    onSave({ sourcingOptions: list });
  };

  const submitResponse = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(form.price.replace(/[^0-9.]/g, ""));
    if (!form.operatorName.trim() || !form.aircraftType.trim() || !price) {
      setFormError("Operator, aircraft and cost are needed.");
      return;
    }
    const photoUrls = form.photoUrls
      .split(/[\s,]+/)
      .map((u) => u.trim())
      .filter((u) => /^https?:\/\//i.test(u));
    const op = operators.find((o) => o.tradingName === form.operatorName || o.legalName === form.operatorName);
    const offer: SourcingOption = {
      id: `src-${Date.now()}`,
      operatorId: op?.id,
      operatorName: form.operatorName.trim(),
      aircraftType: form.aircraftType.trim(),
      aircraftRegistration: form.aircraftRegistration.trim().toUpperCase() || undefined,
      aircraftYear: form.aircraftYear.trim() || undefined,
      refurbYear: form.refurbYear.trim() || undefined,
      baseAirport: form.baseAirport.trim().toUpperCase() || op?.baseIcao || "",
      price,
      currency,
      taxesIncluded: true,
      validUntil: form.validUntil,
      availability: form.availability,
      availabilityCheckedAt: form.availability === "not_checked" ? undefined : new Date().toISOString(),
      safetyRating: form.safetyRating.trim() || op?.safetyRating || undefined,
      photoUrls,
      photosCount: photoUrls.length,
      isPreferred: form.isPreferred || op?.status === "approved",
      receivedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      selected: false
    };
    onSave({
      sourcingOptions: [...materialize(offers), offer],
      itineraryActivity: [
        makeActivity(userName, `Operator response logged · ${offer.operatorName} · ${formatMoney(price, currency)}`, "sourcing", "operator response"),
        ...(trip.itineraryActivity || [])
      ]
    });
    setForm(emptyForm);
    setFormError("");
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Request for the marketplace */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-[17px] font-bold text-slate-900 m-0">Request for the marketplace</h3>
          <button
            type="button"
            onClick={copyForAvinode}
            className="bg-[#0B1320] hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm inline-flex items-center gap-1.5"
          >
            {copied && <Check className="w-4 h-4" />}
            {copied ? "Copied" : "Copy for Avinode"}
          </button>
        </div>
        <div className="bg-slate-50 rounded-lg px-5 py-4 grid grid-cols-[minmax(120px,200px)_minmax(0,1fr)] gap-x-6 gap-y-2.5">
          {marketplaceRows.map((r) => (
            <React.Fragment key={r.label}>
              <div className="text-[14px] text-slate-500">{r.label}</div>
              <div className={`text-[15px] text-slate-900 ${r.mono ? "font-mono" : ""}`}>{r.value}</div>
            </React.Fragment>
          ))}
        </div>
        <p className="text-[13px] text-slate-500 mt-3 mb-0">
          Same field order as the marketplace form. No client name or Curator mark-up is ever included.
        </p>
      </div>

      {/* Operator offers */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-slate-100">
          <h3 className="text-[17px] font-bold text-slate-900 m-0">Operator offers</h3>
          <button
            type="button"
            onClick={() => setIsFormOpen((v) => !v)}
            className="bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm"
          >
            {isFormOpen ? "Close" : "Log operator response"}
          </button>
        </div>

        {isFormOpen && (
          <form onSubmit={submitResponse} className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/60 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className={labelCls}>Operator</label>
                <input
                  list="sourcing-operators"
                  value={form.operatorName}
                  onChange={(e) => setForm({ ...form, operatorName: e.target.value })}
                  placeholder="Search or type"
                  className={inputCls}
                />
                <datalist id="sourcing-operators">
                  {operators.map((o) => (
                    <option key={o.id} value={o.tradingName || o.legalName} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className={labelCls}>Aircraft</label>
                <input value={form.aircraftType} onChange={(e) => setForm({ ...form, aircraftType: e.target.value })} placeholder="e.g. CJ3+" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Registration</label>
                <input
                  value={form.aircraftRegistration}
                  onChange={(e) => setForm({ ...form, aircraftRegistration: e.target.value })}
                  placeholder="Optional"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Cost ({currency})</label>
                <input
                  inputMode="decimal"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="6,441.00"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Built</label>
                <input value={form.aircraftYear} onChange={(e) => setForm({ ...form, aircraftYear: e.target.value })} placeholder="2019" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Refurbished</label>
                <input value={form.refurbYear} onChange={(e) => setForm({ ...form, refurbYear: e.target.value })} placeholder="2024" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Base (ICAO)</label>
                <input
                  value={form.baseAirport}
                  onChange={(e) => setForm({ ...form, baseAirport: e.target.value.toUpperCase() })}
                  placeholder="LEPA"
                  maxLength={4}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Availability</label>
                <select
                  value={form.availability}
                  onChange={(e) => setForm({ ...form, availability: e.target.value as typeof form.availability })}
                  className={`${inputCls} cursor-pointer`}
                >
                  <option value="not_checked">Not checked</option>
                  <option value="rechecked">Rechecked today</option>
                  <option value="declined">Declined</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Safety</label>
                <input value={form.safetyRating} onChange={(e) => setForm({ ...form, safetyRating: e.target.value })} placeholder="ARGUS Gold" className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Photo links</label>
                <input
                  value={form.photoUrls}
                  onChange={(e) => setForm({ ...form, photoUrls: e.target.value })}
                  placeholder="https://… (comma separated)"
                  className={inputCls}
                />
              </div>
              <label className="flex items-center gap-2 text-[14px] text-slate-800 self-end pb-2">
                <input
                  type="checkbox"
                  checked={form.isPreferred}
                  onChange={(e) => setForm({ ...form, isPreferred: e.target.checked })}
                  className="w-4 h-4 accent-[#1F6FEB]"
                />
                Preferred operator
              </label>
            </div>
            {formError && <p className="text-sm text-red-600 m-0">{formError}</p>}
            <div className="flex justify-end">
              <button type="submit" className="bg-[#0B1320] hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                Save response
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-[14px] min-w-[1080px]">
            <thead className="border-b border-slate-100">
              <tr>
                <th className={thCls}>Use</th>
                <th className={thCls}>Operator · internal</th>
                <th className={thCls}>Aircraft</th>
                <th className={thCls}>Built / refurb.</th>
                <th className={thCls}>Base</th>
                <th className={thCls}>Cost</th>
                <th className={thCls}>Availability</th>
                <th className={thCls}>Safety</th>
                <th className={thCls}>Photos</th>
                <th className={thCls}>Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {offers.map((opt) => {
                const pill = availabilityPill(opt);
                const photos = opt.photoUrls?.length || opt.photosCount || 0;
                return (
                  <tr key={opt.id} className={`align-top ${opt.selected ? "bg-[#EEF4FD]" : ""}`}>
                    <td className="px-3 py-3.5">
                      <input
                        type="radio"
                        name="sourcing-offer"
                        checked={Boolean(opt.selected)}
                        onChange={() => selectOffer(opt)}
                        className="w-4 h-4 accent-[#1F6FEB] cursor-pointer"
                        aria-label={`Use ${opt.operatorName}`}
                      />
                    </td>
                    <td className="px-3 py-3.5 text-slate-900">
                      {opt.operatorName}
                      {opt.isPreferred && (
                        <div>
                          <span className="inline-block mt-1 text-[12px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Preferred
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-slate-900">{opt.aircraftType || "—"}</td>
                    <td className="px-3 py-3.5 text-slate-900 whitespace-nowrap">
                      {opt.aircraftYear || "—"} / {opt.refurbYear || "—"}
                    </td>
                    <td className="px-3 py-3.5 font-mono text-slate-900">{opt.baseAirport || "—"}</td>
                    <td className="px-3 py-3.5 text-slate-900 whitespace-nowrap">{formatMoney(opt.price, opt.currency)}</td>
                    <td className="px-3 py-3.5">
                      <button
                        type="button"
                        onClick={() => cycleAvailability(opt)}
                        title="Click after checking availability with the operator"
                        className={`text-[12px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${pill.cls}`}
                      >
                        {pill.text}
                      </button>
                    </td>
                    <td className="px-3 py-3.5 text-slate-900">{opt.safetyRating || "—"}</td>
                    <td className="px-3 py-3.5">
                      {photos > 0 && opt.photoUrls?.[0] ? (
                        <a
                          href={opt.photoUrls[0]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1F5FAE] underline underline-offset-2"
                        >
                          {photos}
                        </a>
                      ) : (
                        <span className="text-slate-500">{photos || "—"}</span>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-slate-900 whitespace-nowrap">{receivedLabel(opt.receivedAt || opt.createdAt)}</td>
                  </tr>
                );
              })}
              {offers.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-6 text-[14px] text-slate-500">
                    No offers yet. Copy the request for the marketplace, then log each operator&apos;s response here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[13px] text-slate-500 px-5 sm:px-6 py-3.5 m-0 border-t border-slate-100">
          The selected offer feeds Pricing (cost) and the quote (aircraft, year, photos). Preferred operators receive each request first.
          Others are added by hand.
        </p>
      </div>
    </div>
  );
}

