"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Booking, CrewMember, FlightLeg, ItineraryActivityEntry, OpeningHoursOverride } from "@/types/aviation";
import {
  airportCity,
  arrivalFor,
  checkLegOpeningHours,
  computeFlightMinutes,
  fboLabel,
  fbosFor,
  formatClock,
  formatDay,
  formatDuration,
  formatLegDate,
  formatMoney,
  formatStamp,
  fromMinutes,
  joinPlaces,
  legFlightMinutes,
  legHasArrivalLimo,
  makeActivity,
  normalizeTime,
  toMinutes,
  updateFboHoursInDirectory
} from "./tripTabUtils";

interface TripItineraryTabProps {
  trip: Booking;
  /** Saves changes to the trip (local state + backend). */
  onSave: (updates: Partial<Booking>) => void;
  /** Opens the flight brief for the given (filtered) booking. */
  onOpenBrief: (bookingForBrief: Booking) => void;
  /** Notifies the Curator that a brief was generated. */
  onSendBriefToCurator: (legNumbers: number[]) => void;
  userName: string;
  companyName: string;
  briefNumber: string;
}

type ContactChoice = NonNullable<FlightLeg["briefContact"]>;

interface OverrideDraft {
  confirmedBy: OpeningHoursOverride["confirmedBy"];
  reference: string;
  cost: string;
  addCost: boolean;
  updateDirectory: boolean;
  attachmentName: string;
}

const labelCls = "block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-1.5";
const inputCls =
  "w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500";
const pillCls = (on: boolean) =>
  `px-3 py-1.5 rounded-full border text-[13px] transition-all ${
    on ? "bg-[#0B1320] text-white border-[#0B1320]" : "bg-white text-slate-800 border-slate-300 hover:border-slate-500"
  }`;

const crewOf = (leg: FlightLeg, role: CrewMember["role"]) => (leg.crew || []).find((c) => c.role === role);

const setCrew = (leg: FlightLeg, role: CrewMember["role"], patch: Partial<CrewMember>): CrewMember[] => {
  const crew = [...(leg.crew || [])];
  const i = crew.findIndex((c) => c.role === role);
  if (i >= 0) crew[i] = { ...crew[i], ...patch };
  else crew.push({ role, name: "", phone: "", ...patch });
  return crew.filter((c) => c.name || c.phone);
};

const usesSameCrew = (leg: FlightLeg, idx: number) =>
  idx > 0 && (leg.sameCrewAsPreviousLeg ?? (leg.crew || []).length === 0);

/** Same-crew legs always carry the crew of the leg before them. */
const normalizeCrew = (legs: FlightLeg[]): FlightLeg[] => {
  const out = legs.map((l) => ({ ...l }));
  for (let i = 1; i < out.length; i++) {
    if (usesSameCrew(out[i], i)) out[i].crew = (out[i - 1].crew || []).map((c) => ({ ...c }));
  }
  return out;
};

export default function TripItineraryTab({
  trip,
  onSave,
  onOpenBrief,
  onSendBriefToCurator,
  userName,
  companyName,
  briefNumber
}: TripItineraryTabProps) {
  const [legs, setLegs] = useState<FlightLeg[]>(() => trip.legs || []);
  const [overrideDrafts, setOverrideDrafts] = useState<Record<number, OverrideDraft>>({});
  const [briefLegs, setBriefLegs] = useState<number[]>(() =>
    (trip.legs || []).map((l, i) => (l.aircraftRegistration && l.flightNumber ? i : -1)).filter((i) => i >= 0)
  );
  const [briefWarning, setBriefWarning] = useState<{ mode: "open" | "send"; issues: string[] } | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);
  const activityRef = useRef<HTMLDivElement>(null);
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  // Keep in step with the saved trip (another tab, a revision, or the backend)
  useEffect(() => {
    setLegs(trip.legs || []);
  }, [trip.legs]);

  // "Flight brief" in the header opens the generate card here (…/itinerary#generate-flight-brief)
  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== "#generate-flight-brief") return;
    const t = window.setTimeout(() => {
      document.getElementById("generate-flight-brief")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => window.clearTimeout(t);
  }, []);

  const activity = trip.itineraryActivity || [];
  const saved = trip.legs || [];

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3500);
  };

  const save = (nextLegs: FlightLeg[], entries: ItineraryActivityEntry[] = [], extra: Partial<Booking> = {}) => {
    const normalized = normalizeCrew(nextLegs);
    setLegs(normalized);
    onSave({
      legs: normalized,
      ...(entries.length > 0 ? { itineraryActivity: [...entries.reverse(), ...activity] } : {}),
      ...extra
    });
  };

  const patchLocal = (idx: number, patch: Partial<FlightLeg>) => {
    setLegs((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const legName = (idx: number) => `Leg ${idx + 1}`;

  // ---------- times ----------
  const commitDeparture = (idx: number) => {
    const before = saved[idx];
    const typed = legs[idx]?.departureTimeLocal;
    const next = normalizeTime(typed);
    if (!before) return;
    if (!next) {
      patchLocal(idx, { departureTimeLocal: before.departureTimeLocal });
      flash("Type the time as HH:MM, e.g. 09:30");
      return;
    }
    const old = normalizeTime(before.departureTimeLocal) || before.departureTimeLocal;
    if (next === old) {
      patchLocal(idx, { departureTimeLocal: before.departureTimeLocal });
      return;
    }
    // Departure edited: arrival moves with it, flight time kept
    const flight = legFlightMinutes(before) ?? 0;
    const newArr = arrivalFor(before, next, flight);
    const updated: FlightLeg = {
      ...before,
      departureTimeLocal: next,
      arrivalTimeLocal: newArr,
      departureEdited: true,
      originalDepartureTimeLocal: before.originalDepartureTimeLocal || old,
      flightTimeMinutes: flight,
      flightTimeFormatted: formatDuration(flight)
    };
    const nextLegs = legs.map((l, i) => (i === idx ? updated : l));
    save(nextLegs, [
      makeActivity(
        userName,
        `${legName(idx)} departure ${old} → ${next} · arrival moved to ${newArr} (flight time kept ${formatDuration(flight)})`,
        "time_fbo",
        `leg ${idx + 1} departure time`
      )
    ]);
  };

  const commitArrival = (idx: number) => {
    const before = saved[idx];
    const typed = legs[idx]?.arrivalTimeLocal;
    const next = normalizeTime(typed);
    if (!before) return;
    if (!next) {
      patchLocal(idx, { arrivalTimeLocal: before.arrivalTimeLocal });
      flash("Type the time as HH:MM, e.g. 10:35");
      return;
    }
    const old = normalizeTime(before.arrivalTimeLocal) || before.arrivalTimeLocal;
    if (next === old) {
      patchLocal(idx, { arrivalTimeLocal: before.arrivalTimeLocal });
      return;
    }
    // Arrival edited: departure stays, flight time recalculates
    const oldFlight = legFlightMinutes(before);
    const newFlight = computeFlightMinutes(before, before.departureTimeLocal, next) ?? 0;
    const updated: FlightLeg = {
      ...before,
      arrivalTimeLocal: next,
      arrivalEdited: true,
      originalArrivalTimeLocal: before.originalArrivalTimeLocal || old,
      originalFlightTimeFormatted: before.originalFlightTimeFormatted || formatDuration(oldFlight),
      flightTimeMinutes: newFlight,
      flightTimeFormatted: formatDuration(newFlight)
    };
    const nextLegs = legs.map((l, i) => (i === idx ? updated : l));
    save(nextLegs, [
      makeActivity(
        userName,
        `${legName(idx)} arrival ${old} → ${next} · flight time ${formatDuration(oldFlight)} → ${formatDuration(newFlight)}`,
        "time_fbo",
        `leg ${idx + 1} arrival time`
      )
    ]);
  };

  // ---------- FBOs ----------
  const changeFbo = (idx: number, side: "departure" | "arrival", fboName: string) => {
    const leg = legs[idx];
    if (!leg) return;
    const airport = side === "departure" ? leg.origin : leg.destination;
    const current = side === "departure" ? leg.departureHandling : leg.arrivalHandling;
    if (current?.name === fboName) return;
    const fbo = fbosFor(airport?.icao).find((f) => f.name === fboName);
    if (!fbo) return;
    const handling = {
      name: fbo.name,
      airportCode: airport?.icao || "",
      phone: fbo.phone,
      email: fbo.email,
      vhfFrequency: fbo.vhfFrequency,
      address: fbo.address
    };
    const updated: FlightLeg =
      side === "departure"
        ? { ...leg, departureHandling: handling, departureFboChanged: true }
        : {
            ...leg,
            arrivalHandling: handling,
            arrivalFboChanged: true,
            // remember where the limousine pickup was booked before the first change
            limoPickupFbo: leg.limoPickupFbo || current?.name
          };
    save(
      legs.map((l, i) => (i === idx ? updated : l)),
      [
        makeActivity(
          userName,
          `${legName(idx)} ${side} FBO ${current?.name || "—"} → ${fbo.name}`,
          "time_fbo",
          `leg ${idx + 1} ${side} FBO`
        )
      ]
    );
  };

  const updatePickup = (idx: number) => {
    const leg = legs[idx];
    const fboName = leg?.arrivalHandling?.name;
    if (!leg || !fboName) return;
    save(
      legs.map((l, i) => (i === idx ? { ...l, limoPickupFbo: fboName } : l)),
      [makeActivity(userName, `${legName(idx)} limousine pickup updated to ${fboName}`, "time_fbo", `leg ${idx + 1} limousine pickup`)]
    );
    flash(`Pickup point updated to ${fboName}`);
  };

  // ---------- registration, flight number, crew ----------
  const commitText = (idx: number, field: "aircraftRegistration" | "flightNumber", label: string) => {
    const before = saved[idx];
    const value = (legs[idx]?.[field] || "").trim().toUpperCase();
    if (!before || value === (before[field] || "")) {
      if (before && legs[idx]?.[field] !== before[field]) patchLocal(idx, { [field]: before[field] } as Partial<FlightLeg>);
      return;
    }
    save(
      legs.map((l, i) => (i === idx ? { ...l, [field]: value } : l)),
      [makeActivity(userName, `${legName(idx)} ${label} ${before[field] || "—"} → ${value || "—"}`, "other", `leg ${idx + 1} ${label}`)]
    );
  };

  const commitCrew = (idx: number) => {
    const before = saved[idx];
    const now = legs[idx];
    if (!before || !now) return;
    if (JSON.stringify(before.crew || []) === JSON.stringify(now.crew || [])) return;
    save(legs, [makeActivity(userName, `${legName(idx)} crew details updated`, "other", `leg ${idx + 1} crew`)]);
  };

  const setBriefContact = (idx: number, choice: ContactChoice) => {
    const leg = legs[idx];
    if (!leg || leg.briefContact === choice) return;
    const names: Record<ContactChoice, string> = { crew_mobile: "crew mobile", desk_24_7: "24/7 desk", none: "none" };
    save(
      legs.map((l, i) => (i === idx ? { ...l, briefContact: choice } : l)),
      [makeActivity(userName, `${legName(idx)} contact on the brief → ${names[choice]}`, "other", `leg ${idx + 1} brief contact`)]
    );
  };

  const toggleSameCrew = (idx: number, on: boolean) => {
    const prev = legs[idx - 1];
    save(
      legs.map((l, i) =>
        i === idx ? { ...l, sameCrewAsPreviousLeg: on, crew: on ? (prev?.crew || []).map((c) => ({ ...c })) : l.crew } : l
      ),
      [makeActivity(userName, `${legName(idx)} ${on ? "uses the same crew as" : "has its own crew, no longer"} leg ${idx}`, "other", `leg ${idx + 1} crew`)]
    );
  };

  // ---------- opening hours override ----------
  const draftFor = (idx: number): OverrideDraft =>
    overrideDrafts[idx] || { confirmedBy: "fbo", reference: "", cost: "", addCost: true, updateDirectory: false, attachmentName: "" };

  const patchDraft = (idx: number, patch: Partial<OverrideDraft>) =>
    setOverrideDrafts((prev) => ({ ...prev, [idx]: { ...draftFor(idx), ...patch } }));

  const applyOverride = (idx: number) => {
    const leg = legs[idx];
    if (!leg) return;
    const d = draftFor(idx);
    const cost = Math.max(0, parseFloat(d.cost.replace(/[^0-9.]/g, "")) || 0);
    const check = checkLegOpeningHours(leg);
    const override: OpeningHoursOverride = {
      confirmedBy: d.confirmedBy,
      reference: d.reference.trim(),
      extensionCost: cost,
      addCostToTrip: d.addCost && cost > 0,
      updateDirectory: d.updateDirectory,
      attachmentName: d.attachmentName || undefined,
      overriddenAt: new Date().toISOString(),
      overriddenBy: userName
    };
    const who = d.confirmedBy === "fbo" ? "FBO" : d.confirmedBy === "airport" ? "Airport" : "Operator";
    const extra: Partial<Booking> = {};
    let costText = "";
    if (override.addCostToTrip) {
      const label = `Opening-hours extension · ${legName(idx)} · ${check.closedPlace?.name || leg.destination?.icao || ""}`;
      extra.revisionAdjustments = [...(trip.revisionAdjustments || []), { id: `adj-oh-${Date.now()}`, label, amount: cost }];
      extra.manualServices = [
        ...(trip.manualServices || []),
        { id: `svc-oh-${Date.now()}`, name: label, price: cost, details: `Confirmed by ${who.toLowerCase()} · ${override.reference || "no reference"} · supplementary invoice` }
      ];
      costText = ` · ${formatMoney(cost, trip.pricing?.currency)} added to the trip`;
    }
    if (override.updateDirectory && check.closedPlace?.kind === "fbo") {
      const fbo = fbosFor(check.closedPlace.icao).find((f) => f.name === check.closedPlace?.name);
      const closeMin = (toMinutes(check.closedPlace.time) ?? 0) + 30;
      const openPart = (fbo?.operatingHours || "").match(/(\d{1,2}[:.]\d{2})/)?.[1] || "06:00";
      updateFboHoursInDirectory(check.closedPlace.icao, check.closedPlace.name, `${openPart} - ${fromMinutes(closeMin)} LT (extended)`);
    }
    save(
      legs.map((l, i) => (i === idx ? { ...l, openingHoursOverride: override } : l)),
      [
        makeActivity(
          userName,
          `Opening-hours override · ${legName(idx)} · ${who} confirmed${override.reference ? ` (${override.reference})` : ""}${costText}${
            override.updateDirectory ? " · FBO hours updated in the directory" : ""
          }`,
          "override",
          `leg ${idx + 1} override`
        )
      ],
      extra
    );
    setOverrideDrafts((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
    flash(override.addCostToTrip ? "Override saved · supplementary invoice needed for the extension" : "Override saved for this leg");
  };

  const removeOverride = (idx: number) => {
    save(
      legs.map((l, i) => (i === idx ? { ...l, openingHoursOverride: undefined } : l)),
      [makeActivity(userName, `Opening-hours override removed · ${legName(idx)}`, "override", `leg ${idx + 1} override removed`)]
    );
  };

  // ---------- changes since the last brief ----------
  const changesSinceBrief = useMemo(() => {
    if (!trip.lastBriefIssuedAt) return [] as ItineraryActivityEntry[];
    const since = new Date(trip.lastBriefIssuedAt).getTime();
    return activity.filter((a) => a.group !== "brief" && new Date(a.at).getTime() > since).reverse();
  }, [activity, trip.lastBriefIssuedAt]);

  const changeSummaries = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    changesSinceBrief.forEach((c) => {
      const s = c.summary || c.text;
      if (!seen.has(s)) {
        seen.add(s);
        out.push(s);
      }
    });
    return out;
  }, [changesSinceBrief]);

  // ---------- flight brief ----------
  const legIssues = (idx: number): string[] => {
    const l = legs[idx];
    if (!l) return [];
    const issues: string[] = [];
    if (!l.aircraftRegistration) issues.push(`${legName(idx)} has no registration`);
    if (!l.flightNumber) issues.push(`${legName(idx)} has no flight number`);
    return issues;
  };

  const legsLabel = (indexes: number[]) => {
    const n = [...indexes].sort((a, b) => a - b).map((i) => i + 1);
    if (n.length === 0) return "";
    if (n.length === 1) return `Leg ${n[0]}`;
    const consecutive = n.every((v, i) => i === 0 || v === n[i - 1] + 1);
    return consecutive ? `Legs ${n[0]}–${n[n.length - 1]}` : `Legs ${n.join(", ")}`;
  };

  const generateBrief = (mode: "open" | "send", force = false, indexes = briefLegs) => {
    const chosen = [...indexes].sort((a, b) => a - b);
    if (chosen.length === 0) {
      flash("Tick at least one leg for the brief");
      return;
    }
    const issues = chosen.flatMap(legIssues);
    if (issues.length > 0 && !force) {
      setBriefWarning({ mode, issues });
      return;
    }
    setBriefWarning(null);
    const resolved = normalizeCrew(legs);
    const briefBooking: Booking = {
      ...trip,
      legs: chosen.map((i) => resolved[i]).filter(Boolean),
      ...({ briefLegLabel: legsLabel(chosen) } as any)
    };
    onOpenBrief(briefBooking);
    const legNumbers = chosen.map((i) => i + 1);
    const now = new Date().toISOString();
    onSave({
      lastBriefIssuedAt: now,
      lastBriefLegs: legNumbers,
      itineraryActivity: [
        makeActivity(
          userName,
          `Flight brief ${mode === "send" ? "issued and sent to Curator" : "issued"} · ${legsLabel(chosen)}`,
          "brief",
          "brief"
        ),
        ...activity
      ]
    });
    if (mode === "send") onSendBriefToCurator(legNumbers);
  };

  const sendUpdatedBrief = () => {
    const lastLegs = (trip.lastBriefLegs || []).map((n) => n - 1).filter((i) => i >= 0 && i < legs.length);
    generateBrief("send", false, lastLegs.length > 0 ? lastLegs : legs.map((_, i) => i));
  };

  // ---------- activity groups ----------
  const activityView = useMemo(() => {
    type Item = { kind: "group"; key: string; day: string; entries: ItineraryActivityEntry[] } | { kind: "single"; entry: ItineraryActivityEntry };
    const items: Item[] = [];
    activity.forEach((a) => {
      if (a.group === "time_fbo") {
        const day = formatDay(a.at);
        const last = items[items.length - 1];
        if (last && last.kind === "group" && last.day === day) last.entries.push(a);
        else items.push({ kind: "group", key: `${day}-${a.id}`, day, entries: [a] });
      } else {
        items.push({ kind: "single", entry: a });
      }
    });
    return items;
  }, [activity]);

  const reviewChanges = () => {
    const first = activityView.find((i) => i.kind === "group");
    if (first && first.kind === "group") setOpenGroups((prev) => ({ ...prev, [first.key]: true }));
    activityRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (legs.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-500">
        This trip has no legs yet. Legs are added on the quote.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0B1320] text-white text-sm px-4 py-2.5 rounded-lg shadow-xl">{toast}</div>
      )}

      {legs.map((leg, idx) => {
        const savedLeg = saved[idx] || leg;
        const hours = checkLegOpeningHours(savedLeg);
        const hasOverride = Boolean(savedLeg.openingHoursOverride);
        const isProblem = (hours.level === "red" || hours.level === "amber") && !hasOverride;
        const depFbos = fbosFor(leg.origin?.icao);
        const arrFbos = fbosFor(leg.destination?.icao);
        const flight = legFlightMinutes(savedLeg);
        const sameCrew = usesSameCrew(leg, idx);
        const crewSource = sameCrew ? normalizeCrew(legs)[idx] : leg;
        const captain = crewOf(crewSource, "CMDR");
        const fo = crewOf(crewSource, "F/O");
        const fa = crewOf(crewSource, "Cabin Attendant");
        const contact: ContactChoice = leg.briefContact || "crew_mobile";
        const draft = draftFor(idx);
        const showLimoBanner =
          Boolean(savedLeg.arrivalFboChanged) &&
          legHasArrivalLimo(trip, idx) &&
          Boolean(savedLeg.limoPickupFbo) &&
          savedLeg.limoPickupFbo !== savedLeg.arrivalHandling?.name;

        // Next leg departing before this one arrives (same day)
        const nextLeg = saved[idx + 1];
        const nextDepBeforeArrival =
          nextLeg &&
          nextLeg.flightDate === savedLeg.flightDate &&
          (toMinutes(nextLeg.departureTimeLocal) ?? 9999) < (toMinutes(savedLeg.arrivalTimeLocal) ?? -1);

        let internalNote = "—";
        if (savedLeg.arrivalEdited && savedLeg.originalFlightTimeFormatted) internalNote = `was ${savedLeg.originalFlightTimeFormatted} (standard)`;
        else if (savedLeg.departureEdited && savedLeg.originalDepartureTimeLocal) internalNote = `departure was ${savedLeg.originalDepartureTimeLocal}`;
        else if (flight !== null) internalNote = `${formatDuration(flight)} (standard)`;

        return (
          <div
            key={`leg-${idx}`}
            className={`bg-white rounded-xl p-5 sm:p-6 shadow-2xs border ${isProblem ? "border-red-300" : "border-slate-200"}`}
          >
            <div className="flex items-baseline justify-between gap-3 mb-4">
              <h3 className="text-[17px] font-bold text-slate-900 m-0">
                Leg {idx + 1} · {leg.origin?.icao} {airportCity(leg.origin)} → {leg.destination?.icao} {airportCity(leg.destination)}
              </h3>
              <span className="text-[13px] text-slate-500 whitespace-nowrap">{formatLegDate(leg.flightDate)}</span>
            </div>

            {/* Times */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className={labelCls}>
                  Departs (LT)
                  {savedLeg.departureEdited && (
                    <span className="ml-1.5 align-middle text-[10px] font-bold tracking-wider text-[#1F5FAE] bg-[#E6EEFA] px-1.5 py-0.5 rounded">
                      EDITED
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={leg.departureTimeLocal || ""}
                  onChange={(e) => patchLocal(idx, { departureTimeLocal: e.target.value })}
                  onBlur={() => commitDeparture(idx)}
                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  placeholder="HH:MM"
                  className={`${inputCls} ${savedLeg.departureEdited ? "border-[#7FA6DE]" : ""}`}
                />
              </div>
              <div>
                <label className={labelCls}>
                  Arrives (LT)
                  {savedLeg.arrivalEdited && (
                    <span className="ml-1.5 align-middle text-[10px] font-bold tracking-wider text-[#1F5FAE] bg-[#E6EEFA] px-1.5 py-0.5 rounded">
                      EDITED
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={leg.arrivalTimeLocal || ""}
                  onChange={(e) => patchLocal(idx, { arrivalTimeLocal: e.target.value })}
                  onBlur={() => commitArrival(idx)}
                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  placeholder="HH:MM"
                  className={`${inputCls} ${savedLeg.arrivalEdited ? "border-[#7FA6DE]" : ""}`}
                />
              </div>
              <div>
                <label className={labelCls}>Flight time</label>
                <div className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900">
                  {formatDuration(flight)}
                </div>
              </div>
              <div>
                <label className={labelCls}>Internal</label>
                <div className="text-[13px] text-slate-500 pt-2">{internalNote}</div>
              </div>
            </div>

            {/* FBOs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <div>
                <label className={labelCls}>
                  Departure FBO
                  {savedLeg.departureFboChanged && (
                    <span className="ml-1.5 align-middle text-[10px] font-bold tracking-wider text-[#1F5FAE] bg-[#E6EEFA] px-1.5 py-0.5 rounded">
                      CHANGED
                    </span>
                  )}
                </label>
                <select
                  value={leg.departureHandling?.name || ""}
                  onChange={(e) => changeFbo(idx, "departure", e.target.value)}
                  className={`${inputCls} cursor-pointer`}
                >
                  {!depFbos.some((f) => f.name === leg.departureHandling?.name) && (
                    <option value={leg.departureHandling?.name || ""}>
                      {leg.departureHandling?.name ? fboLabel(leg.origin, leg.departureHandling.name) : "No FBO chosen"}
                    </option>
                  )}
                  {depFbos.map((f) => (
                    <option key={f.id} value={f.name}>
                      {fboLabel(leg.origin, f.name)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>
                  Arrival FBO
                  {savedLeg.arrivalFboChanged && (
                    <span className="ml-1.5 align-middle text-[10px] font-bold tracking-wider text-[#1F5FAE] bg-[#E6EEFA] px-1.5 py-0.5 rounded">
                      CHANGED
                    </span>
                  )}
                </label>
                <select
                  value={leg.arrivalHandling?.name || ""}
                  onChange={(e) => changeFbo(idx, "arrival", e.target.value)}
                  className={`${inputCls} cursor-pointer ${savedLeg.arrivalFboChanged ? "border-[#7FA6DE]" : ""}`}
                >
                  {!arrFbos.some((f) => f.name === leg.arrivalHandling?.name) && (
                    <option value={leg.arrivalHandling?.name || ""}>
                      {leg.arrivalHandling?.name ? fboLabel(leg.destination, leg.arrivalHandling.name) : "No FBO chosen"}
                    </option>
                  )}
                  {arrFbos.map((f) => (
                    <option key={f.id} value={f.name}>
                      {fboLabel(leg.destination, f.name)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {showLimoBanner && (
              <div className="mt-3 bg-[#FCEFD2] rounded-lg px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
                <span className="text-[14px] text-amber-900">
                  ▲ VIP limousine on arrival was booked to {savedLeg.limoPickupFbo}. Update the pickup point to{" "}
                  {savedLeg.arrivalHandling?.name}?
                </span>
                <button
                  type="button"
                  onClick={() => updatePickup(idx)}
                  className="bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm"
                >
                  Update pickup
                </button>
              </div>
            )}

            {/* Registration & flight number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <div>
                <label className={labelCls}>Registration</label>
                <input
                  type="text"
                  value={leg.aircraftRegistration || ""}
                  onChange={(e) => patchLocal(idx, { aircraftRegistration: e.target.value.toUpperCase() })}
                  onBlur={() => commitText(idx, "aircraftRegistration", "registration")}
                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  placeholder="Missing"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Flight number</label>
                <input
                  type="text"
                  value={leg.flightNumber || ""}
                  onChange={(e) => patchLocal(idx, { flightNumber: e.target.value.toUpperCase() })}
                  onBlur={() => commitText(idx, "flightNumber", "flight number")}
                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  placeholder="Missing"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Crew */}
            <div className="mt-4 border border-slate-200 rounded-xl p-4">
              {idx > 0 && sameCrew ? (
                <div className="space-y-3">
                  <label className="flex flex-wrap items-center gap-2.5 cursor-pointer select-none">
                    <Switch on onChange={() => toggleSameCrew(idx, false)} />
                    <span className="text-[15px] font-bold text-slate-900">Same crew as leg {idx}</span>
                    <span className="text-[13px] text-slate-500">
                      {[captain?.name, fo?.name, fa?.name].filter(Boolean).join(" · ") || "No crew entered on leg " + idx + " yet"}
                    </span>
                  </label>
                  <ContactRow
                    value={contact}
                    onChange={(c) => setBriefContact(idx, c)}
                    companyName={companyName}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    {idx > 0 ? (
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <Switch on={false} onChange={() => toggleSameCrew(idx, true)} />
                        <span className="text-[15px] font-bold text-slate-900">Same crew as leg {idx}</span>
                      </label>
                    ) : (
                      <span className="text-[15px] font-bold text-slate-900">Crew</span>
                    )}
                    <span className="text-[13px] text-slate-500">from the operator · any field can stay empty</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className={labelCls}>Captain</label>
                      <input
                        type="text"
                        value={captain?.name || ""}
                        onChange={(e) => patchLocal(idx, { crew: setCrew(leg, "CMDR", { name: e.target.value }) })}
                        onBlur={() => commitCrew(idx)}
                        placeholder="Capt. name"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>First officer</label>
                      <input
                        type="text"
                        value={fo?.name || ""}
                        onChange={(e) => patchLocal(idx, { crew: setCrew(leg, "F/O", { name: e.target.value }) })}
                        onBlur={() => commitCrew(idx)}
                        placeholder="FO name"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Flight attendant</label>
                      <input
                        type="text"
                        value={fa?.name || ""}
                        onChange={(e) => patchLocal(idx, { crew: setCrew(leg, "Cabin Attendant", { name: e.target.value }) })}
                        onBlur={() => commitCrew(idx)}
                        placeholder="None on this flight"
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <ContactRow value={contact} onChange={(c) => setBriefContact(idx, c)} companyName={companyName} />
                  {contact === "crew_mobile" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className={labelCls}>Captain mobile</label>
                        <input
                          type="tel"
                          value={captain?.phone || ""}
                          onChange={(e) => patchLocal(idx, { crew: setCrew(leg, "CMDR", { phone: e.target.value }) })}
                          onBlur={() => commitCrew(idx)}
                          placeholder="Optional"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>First officer mobile</label>
                        <input
                          type="tel"
                          value={fo?.phone || ""}
                          onChange={(e) => patchLocal(idx, { crew: setCrew(leg, "F/O", { phone: e.target.value }) })}
                          onBlur={() => commitCrew(idx)}
                          placeholder="Optional"
                          className={inputCls}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {nextDepBeforeArrival && (
              <div className="mt-3 text-[13px] text-amber-800">
                ▲ Leg {idx + 2} departs at {nextLeg?.departureTimeLocal}, before this leg arrives ({savedLeg.arrivalTimeLocal}).
              </div>
            )}

            {/* Opening hours check */}
            {hours.level === "ok" && (
              <div className="mt-4 text-[13px] text-emerald-700">✓ {joinPlaces(hours.openPlaces)} open at these times</div>
            )}
            {hours.level === "unknown" && (
              <div className="mt-4 text-[13px] text-slate-500">Opening hours not on file for these airports and FBOs.</div>
            )}

            {(hours.level === "red" || hours.level === "amber") && hasOverride && savedLeg.openingHoursOverride && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-[13px] text-slate-700">
                <span>
                  ✓ Opening hours overridden ·{" "}
                  {savedLeg.openingHoursOverride.confirmedBy === "fbo"
                    ? "FBO"
                    : savedLeg.openingHoursOverride.confirmedBy === "airport"
                    ? "Airport"
                    : "Operator"}{" "}
                  confirmed
                  {savedLeg.openingHoursOverride.reference ? ` · ${savedLeg.openingHoursOverride.reference}` : ""}
                  {savedLeg.openingHoursOverride.addCostToTrip
                    ? ` · ${formatMoney(savedLeg.openingHoursOverride.extensionCost, trip.pricing?.currency)} added`
                    : ""}
                  {savedLeg.openingHoursOverride.attachmentName ? ` · ${savedLeg.openingHoursOverride.attachmentName}` : ""}
                </span>
                <button type="button" onClick={() => removeOverride(idx)} className="text-[#1F5FAE] hover:underline">
                  Remove override
                </button>
              </div>
            )}

            {isProblem && (
              <div className="mt-4 space-y-4">
                <div
                  className={`rounded-lg px-4 py-2.5 text-[15px] ${
                    hours.level === "red" ? "bg-[#FDE8E8] text-red-800" : "bg-[#FCEFD2] text-amber-900"
                  }`}
                >
                  <strong>{hours.headline}</strong> {hours.detail}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)_200px] gap-4 items-end">
                  <div>
                    <label className={labelCls}>Confirmed by</label>
                    <div className="flex items-center gap-2">
                      {(["airport", "fbo", "operator"] as const).map((c) => (
                        <button key={c} type="button" onClick={() => patchDraft(idx, { confirmedBy: c })} className={pillCls(draft.confirmedBy === c)}>
                          {c === "fbo" ? "FBO" : c === "airport" ? "Airport" : "Operator"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Name or reference</label>
                    <input
                      type="text"
                      value={draft.reference}
                      onChange={(e) => patchDraft(idx, { reference: e.target.value })}
                      placeholder="e.g. Execujet ops · A. Bello · email 17 Nov 11:48"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Extension cost</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={draft.cost}
                      onChange={(e) => patchDraft(idx, { cost: e.target.value })}
                      placeholder="€ 0.00"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] text-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={draft.addCost}
                      onChange={(e) => patchDraft(idx, { addCost: e.target.checked })}
                      className="w-4 h-4 accent-[#1F6FEB]"
                    />
                    <span>
                      Add cost to this trip{" "}
                      <span className="text-[12px] text-slate-500">(creates the next version and a supplementary invoice)</span>
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={draft.updateDirectory}
                      onChange={(e) => patchDraft(idx, { updateDirectory: e.target.checked })}
                      disabled={hours.closedPlace?.kind !== "fbo"}
                      className="w-4 h-4 accent-[#1F6FEB]"
                    />
                    <span>Also update FBO hours in the directory</span>
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[14px] text-slate-800">
                    Attachment{" "}
                    <button
                      type="button"
                      onClick={() => fileInputs.current[idx]?.click()}
                      className="text-[#1F5FAE] underline underline-offset-2"
                    >
                      {draft.attachmentName || "+ Attach confirmation"}
                    </button>
                    <input
                      ref={(el) => {
                        fileInputs.current[idx] = el;
                      }}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) patchDraft(idx, { attachmentName: f.name });
                        e.target.value = "";
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => applyOverride(idx)}
                    className="bg-[#0B1320] hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm"
                  >
                    Override for this leg
                  </button>
                </div>
                <p className="text-[12px] text-slate-500 m-0">
                  Never blocks work. Without the directory update the override stays on this trip only and the FBO record stays
                  red for other trips.
                </p>
              </div>
            )}
          </div>
        );
      })}

      {/* Changes since the last brief */}
      {trip.lastBriefIssuedAt && changeSummaries.length > 0 && (
        <div className="bg-[#EEF4FD] border border-[#C9DBF5] rounded-xl px-5 py-4 flex flex-wrap items-center justify-between gap-4">
          <p className="m-0 text-[15px] text-slate-800 flex-1 min-w-[240px]">
            <strong>
              {changeSummaries.length} {changeSummaries.length === 1 ? "change" : "changes"} since the last brief
            </strong>{" "}
            ({formatStamp(trip.lastBriefIssuedAt)}): {changeSummaries.join(", ")}. Nothing has been sent yet.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={reviewChanges}
              className="bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm"
            >
              Review changes
            </button>
            <button
              type="button"
              onClick={sendUpdatedBrief}
              className="bg-[#0B1320] hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm"
            >
              Send updated brief
            </button>
          </div>
        </div>
      )}

      {/* Generate flight brief */}
      <div id="generate-flight-brief" className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <h3 className="text-[17px] font-bold text-slate-900 m-0">Generate flight brief</h3>
          <span className="text-[13px] text-slate-500">opens here from &ldquo;Flight brief&rdquo;, no pop-up</span>
        </div>
        <div className="space-y-2">
          {legs.map((leg, idx) => {
            const resolved = normalizeCrew(legs)[idx];
            const checked = briefLegs.includes(idx);
            return (
              <label key={`brief-${idx}`} className="flex items-start gap-2.5 text-[15px] text-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) =>
                    setBriefLegs((prev) => (e.target.checked ? [...prev, idx] : prev.filter((i) => i !== idx)))
                  }
                  className="w-4 h-4 mt-1 accent-[#1F6FEB]"
                />
                <span>
                  Leg {idx + 1} · {leg.origin?.icao} → {leg.destination?.icao} · {formatLegDate(leg.flightDate)}{" "}
                  {normalizeTime(leg.departureTimeLocal) || leg.departureTimeLocal} · {leg.aircraftType || trip.aircraft?.name || "Aircraft TBC"} · reg{" "}
                  {resolved.aircraftRegistration ? resolved.aircraftRegistration : <span className="text-red-600">missing</span>} · flight no.{" "}
                  {resolved.flightNumber ? resolved.flightNumber : <span className="text-red-600">missing</span>}
                </span>
              </label>
            );
          })}
        </div>

        {briefWarning && (
          <div className="mt-4 bg-[#FCEFD2] rounded-lg px-4 py-3 text-[14px] text-amber-900 space-y-2">
            <div>
              <strong>Check before generating:</strong> {briefWarning.issues.join("; ")}.
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => generateBrief(briefWarning.mode, true)}
                className="bg-[#0B1320] hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-[13px] font-semibold"
              >
                Generate anyway
              </button>
              <button
                type="button"
                onClick={() => setBriefWarning(null)}
                className="bg-white border border-slate-200 text-slate-900 px-3 py-1.5 rounded-lg text-[13px] font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => generateBrief("open")}
            disabled={briefLegs.length === 0}
            className="bg-[#0B1320] hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm disabled:opacity-50"
          >
            Generate brief{briefLegs.length > 0 ? ` · ${legsLabel(briefLegs)}` : ""}
          </button>
          <button
            type="button"
            onClick={() => generateBrief("send")}
            disabled={briefLegs.length === 0}
            className="bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm disabled:opacity-50"
          >
            Generate and send to Curator
          </button>
          <span className="text-[13px] text-slate-500 flex-1 min-w-[220px]">
            Number {briefNumber} · footer &ldquo;{legsLabel(briefLegs) || "Leg 1"}&rdquo;. A leg without registration or flight number shows a
            warning before generating.
          </span>
        </div>
      </div>

      {/* Activity */}
      <div ref={activityRef} className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs scroll-mt-6">
        <h3 className="text-[17px] font-bold text-slate-900 m-0 mb-3">Activity</h3>
        {activityView.length === 0 && <p className="text-[14px] text-slate-500 m-0">No changes yet.</p>}
        <div className="space-y-3">
          {activityView.map((item, i) => {
            if (item.kind === "group") {
              const open = openGroups[item.key] ?? i === 0;
              return (
                <div key={item.key} className="border border-slate-200 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setOpenGroups((prev) => ({ ...prev, [item.key]: !open }))}
                    className="w-full text-left px-3.5 py-2.5 text-[15px] text-slate-900"
                  >
                    <span className="inline-block w-4">{open ? "▾" : "▸"}</span>
                    <strong>
                      Time and FBO changes · {item.day} · {item.entries.length} {item.entries.length === 1 ? "change" : "changes"}
                    </strong>{" "}
                    <span className="text-[13px] text-slate-500">· saved, no new version</span>
                  </button>
                  {open && (
                    <div className="px-3.5 pb-3 space-y-1">
                      {item.entries.map((e) => (
                        <div key={e.id} className="text-[13px] text-slate-500">
                          {formatClock(e.at)} · {e.by} · {e.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <div key={item.entry.id} className="text-[15px] text-slate-800">
                {formatStamp(item.entry.at)} · {item.entry.text}
              </div>
            );
          })}
        </div>
        <p className="text-[12px] text-slate-500 mt-4 mb-0">
          Changing the date of a leg creates a new version. Same-day time changes are saved and grouped here; documents always print
          the current time only.
        </p>
      </div>
    </div>
  );
}

function Switch({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={(e) => {
        e.preventDefault();
        onChange();
      }}
      className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors flex-shrink-0 ${on ? "bg-[#0B1320]" : "bg-slate-300"}`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-[18px]" : "translate-x-0.5"}`} />
    </button>
  );
}

function ContactRow({
  value,
  onChange,
  companyName
}: {
  value: ContactChoice;
  onChange: (c: ContactChoice) => void;
  companyName: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mr-1">Contact on the brief</span>
      {(
        [
          ["crew_mobile", "Crew mobile"],
          ["desk_24_7", "24/7 desk"],
          ["none", "None"]
        ] as const
      ).map(([key, label]) => (
        <button key={key} type="button" onClick={() => onChange(key)} className={pillCls(value === key)}>
          {label}
        </button>
      ))}
      {value === "desk_24_7" && (
        <span className="text-[13px] text-slate-500 ml-1">prints the {companyName} 24/7 number instead of crew numbers</span>
      )}
      {value === "none" && <span className="text-[13px] text-slate-500 ml-1">no crew or desk number on the brief</span>}
    </div>
  );
}
