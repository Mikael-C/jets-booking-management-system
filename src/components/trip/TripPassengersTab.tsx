"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Booking, FlightLeg, PassengerManifestItem, WeaponClearanceLine, WeaponOnBoardRecord } from "@/types/aviation";
import { X } from "lucide-react";
import {
  contactFullName,
  findContactForPassenger,
  makeActivity,
  maskDocument,
  resolvePassenger
} from "./tripTabUtils";

interface TripPassengersTabProps {
  trip: Booking;
  contacts: any[];
  onSave: (updates: Partial<Booking>) => void;
  userName: string;
}

const thCls = "text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 px-3 py-2.5 whitespace-nowrap";
const labelCls = "block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-1.5";
const inputCls =
  "w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500";
const pillCls = (on: boolean) =>
  `px-4 py-1.5 rounded-full border text-[15px] transition-all ${
    on ? "bg-[#0B1320] text-white border-[#0B1320]" : "bg-white text-slate-800 border-slate-300 hover:border-slate-500"
  }`;

// Who usually signs off weapons at an airport, by country
const WEAPON_AUTHORITIES: Record<string, string> = {
  spain: "Guardia Civil",
  switzerland: "fedpol / airport police",
  "united kingdom": "Police · Home Office",
  france: "Police aux frontières / Douane",
  italy: "Polizia di Frontiera",
  germany: "Bundespolizei",
  austria: "Polizei / Austro Control",
  nigeria: "Nigeria Police Force · FAAN AVSEC",
  ghana: "Ghana Police Service",
  "united arab emirates": "Dubai Police / GCAA",
  monaco: "Sûreté Publique",
  portugal: "PSP / SEF",
  greece: "Hellenic Police",
  "united states": "TSA / CBP",
  "saudi arabia": "Ministry of Interior",
  qatar: "Ministry of Interior"
};

const authorityFor = (country?: string) => WEAPON_AUTHORITIES[(country || "").trim().toLowerCase()] || "Police / customs";

const defaultClearances = (leg: FlightLeg, operatorName: string): WeaponClearanceLine[] => [
  {
    id: `wcl-dep-${Date.now()}`,
    label: `Departure · ${leg.origin?.country || "Country"} (${leg.origin?.icao || "—"})`,
    authority: authorityFor(leg.origin?.country),
    status: "pending"
  },
  {
    id: `wcl-arr-${Date.now()}`,
    label: `Arrival · ${leg.destination?.country || "Country"} (${leg.destination?.icao || "—"})`,
    authority: authorityFor(leg.destination?.country),
    status: "pending"
  },
  { id: `wcl-op-${Date.now()}`, label: "Operator approval", authority: operatorName || "Operator", status: "pending" }
];

const statusPill = (status: WeaponClearanceLine["status"]) =>
  status === "cleared"
    ? "bg-emerald-50 text-emerald-700"
    : status === "refused"
    ? "bg-red-50 text-red-700"
    : "bg-[#FCEFD2] text-amber-800";

export default function TripPassengersTab({ trip, contacts, onSave, userName }: TripPassengersTabProps) {
  const legs = trip.legs || [];
  const sameManifest = trip.sameManifestAllLegs ?? true;
  const [manifestLeg, setManifestLeg] = useState(0);
  const [weaponLeg, setWeaponLeg] = useState(0);
  const [query, setQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [weaponDraft, setWeaponDraft] = useState<WeaponOnBoardRecord | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const uploadRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const activeLegIdx = sameManifest ? 0 : Math.min(manifestLeg, Math.max(0, legs.length - 1));
  const activeLeg = legs[activeLegIdx];
  const weaponLegIdx = Math.min(weaponLeg, Math.max(0, legs.length - 1));
  const savedWeapons = legs[weaponLegIdx]?.weapons;

  // Local copy of the weapon form while typing; saved on blur
  useEffect(() => {
    setWeaponDraft(savedWeapons ? { ...savedWeapons, clearances: [...(savedWeapons.clearances || [])] } : null);
  }, [savedWeapons, weaponLegIdx]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setIsSearchOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const manifest = useMemo(
    () => (activeLeg?.passengers || []).map((p, i) => ({ raw: p, info: resolvePassenger(p, contacts, i) })),
    [activeLeg, contacts]
  );

  const authorisedName = (trip.authorisedOwnerName || trip.client?.fullName || "").toLowerCase();

  // Pets travelling: pets on the passengers' contacts, or the trip's pet details
  const pets = useMemo(() => {
    if (!trip.petDetails?.hasPets) return [] as { id: string; line: string; weight?: number; doc?: string; complete: boolean }[];
    const fromContacts = manifest.flatMap(({ raw }) => {
      const c = findContactForPassenger(raw, contacts);
      return (c?.pets || []).map((pet: any) => ({
        id: `${c.id}-${pet.id}`,
        line: [pet.petName, String(pet.petType || "").toLowerCase(), pet.breed, "in cabin"].filter(Boolean).join(" · "),
        weight: pet.weightKg,
        doc: pet.passportCertificateNumber,
        complete: Boolean(pet.passportCertificateNumber)
      }));
    });
    if (fromContacts.length > 0) return fromContacts.slice(0, Math.max(1, trip.petDetails.petCount || fromContacts.length));
    const p = trip.petDetails;
    return [
      {
        id: "trip-pet",
        line: [p.petType || "Pet", p.breed, p.notes || "in cabin"].filter(Boolean).join(" · "),
        weight: p.totalWeightKg || p.petWeight,
        doc: undefined,
        complete: false
      }
    ];
  }, [trip.petDetails, manifest, contacts]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const onBoard = new Set(manifest.map((m) => m.info.contactId).filter(Boolean));
    const accountId = (trip.accountNumber || "").toLowerCase();
    return contacts
      .filter((c) => !onBoard.has(c.id))
      .filter((c) => {
        if (!q) return true;
        return contactFullName(c).toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q);
      })
      .sort((a, b) => {
        // People on this trip's account first
        const aAcc = (a.associatedAccountName || "").toLowerCase() === (trip.client?.companyName || "").toLowerCase() || (a.associatedAccountId || "").toLowerCase() === accountId;
        const bAcc = (b.associatedAccountName || "").toLowerCase() === (trip.client?.companyName || "").toLowerCase() || (b.associatedAccountId || "").toLowerCase() === accountId;
        return Number(bAcc) - Number(aAcc) || contactFullName(a).localeCompare(contactFullName(b));
      })
      .slice(0, 8);
  }, [query, contacts, manifest, trip.accountNumber, trip.client?.companyName]);

  const writeManifest = (nextPassengers: PassengerManifestItem[], text: string) => {
    const nextLegs = legs.map((l, i) =>
      sameManifest || i === activeLegIdx ? { ...l, passengers: nextPassengers, paxCount: nextPassengers.length } : l
    );
    onSave({
      legs: nextLegs,
      itineraryActivity: [makeActivity(userName, text, "manifest", "manifest"), ...(trip.itineraryActivity || [])]
    });
  };

  const addContact = (c: any) => {
    const pp = c.passportDetails;
    const current = activeLeg?.passengers || [];
    const pax: PassengerManifestItem = {
      id: `pax-${Date.now()}`,
      contactId: c.id,
      fullName: contactFullName(c),
      passportNumber: pp?.passportNumber || "",
      nationality: c.nationality || pp?.issuingCountry || "",
      dateOfBirth: pp?.dateOfBirth,
      passportExpiry: pp?.expirationDate,
      isLeadPassenger: current.length === 0
    };
    writeManifest([...current, pax], `${pax.fullName} added to the manifest${sameManifest ? "" : ` · leg ${activeLegIdx + 1}`}`);
    setQuery("");
    setIsSearchOpen(false);
  };

  const removePassenger = (paxId: string, name: string) => {
    const current = activeLeg?.passengers || [];
    const next = current.filter((p, i) => String(p.id || `pax-${i}`) !== paxId);
    if (next.length > 0 && !next.some((p) => p.isLeadPassenger)) next[0] = { ...next[0], isLeadPassenger: true };
    writeManifest(next, `${name} removed from the manifest${sameManifest ? "" : ` · leg ${activeLegIdx + 1}`}`);
  };

  const setSameManifest = (on: boolean) => {
    const base = legs[activeLegIdx]?.passengers || [];
    const nextLegs = on ? legs.map((l) => ({ ...l, passengers: base.map((p) => ({ ...p })), paxCount: base.length })) : legs;
    onSave({
      legs: nextLegs,
      sameManifestAllLegs: on,
      itineraryActivity: [
        makeActivity(userName, on ? "Same manifest on all legs" : "Manifest edited per leg", "manifest", "manifest"),
        ...(trip.itineraryActivity || [])
      ]
    });
    if (!on) setManifestLeg(0);
  };

  // ---------- weapons ----------
  const operatorName = trip.legOperators?.[weaponLegIdx]?.operatorName || trip.operator?.companyName || "Operator";

  const saveWeapons = (record: WeaponOnBoardRecord | undefined, text?: string) => {
    const nextLegs = legs.map((l, i) => (i === weaponLegIdx ? { ...l, weapons: record } : l));
    onSave({
      legs: nextLegs,
      ...(text
        ? { itineraryActivity: [makeActivity(userName, text, "manifest", `leg ${weaponLegIdx + 1} weapons`), ...(trip.itineraryActivity || [])] }
        : {})
    });
  };

  const setWeaponOnBoard = (on: boolean) => {
    const leg = legs[weaponLegIdx];
    if (!leg) return;
    if (on) {
      const record: WeaponOnBoardRecord = savedWeapons
        ? { ...savedWeapons, onBoard: true }
        : { onBoard: true, type: "", serialOrPermit: "", ammunition: "", clearances: defaultClearances(leg, operatorName) };
      saveWeapons(record, `Weapon on board · leg ${weaponLegIdx + 1}`);
    } else {
      saveWeapons(savedWeapons ? { ...savedWeapons, onBoard: false } : undefined, `No weapon on board · leg ${weaponLegIdx + 1}`);
    }
  };

  const commitWeaponDraft = (draft: WeaponOnBoardRecord | null = weaponDraft) => {
    if (!draft) return;
    if (JSON.stringify(draft) === JSON.stringify(savedWeapons)) return;
    saveWeapons(draft);
  };

  const patchWeapon = (patch: Partial<WeaponOnBoardRecord>, commitNow = false) => {
    if (!weaponDraft) return;
    const next = { ...weaponDraft, ...patch };
    setWeaponDraft(next);
    if (commitNow) commitWeaponDraft(next);
  };

  const patchClearance = (id: string, patch: Partial<WeaponClearanceLine>, commitNow = false) => {
    if (!weaponDraft) return;
    const next = { ...weaponDraft, clearances: weaponDraft.clearances.map((c) => (c.id === id ? { ...c, ...patch } : c)) };
    setWeaponDraft(next);
    if (commitNow) commitWeaponDraft(next);
  };

  const cycleStatus = (line: WeaponClearanceLine) => {
    const order: WeaponClearanceLine["status"][] = ["pending", "cleared", "refused"];
    const next = order[(order.indexOf(line.status) + 1) % order.length];
    if (!weaponDraft) return;
    const record = { ...weaponDraft, clearances: weaponDraft.clearances.map((c) => (c.id === line.id ? { ...c, status: next } : c)) };
    setWeaponDraft(record);
    saveWeapons(record, `${line.label} · weapon clearance ${next}`);
  };

  const addOverflight = () => {
    if (!weaponDraft) return;
    const next = {
      ...weaponDraft,
      clearances: [
        ...weaponDraft.clearances,
        { id: `ovf-${Date.now()}`, label: "Overflight · ", authority: "", status: "pending" as const }
      ]
    };
    setWeaponDraft(next);
    commitWeaponDraft(next);
  };

  const removeClearance = (id: string) => {
    if (!weaponDraft) return;
    const next = { ...weaponDraft, clearances: weaponDraft.clearances.filter((c) => c.id !== id) };
    setWeaponDraft(next);
    commitWeaponDraft(next);
  };

  const firstPending = weaponDraft?.onBoard ? weaponDraft.clearances.find((c) => c.status !== "cleared") : undefined;

  // ---------- totals ----------
  const knownWeights = manifest.map((m) => m.info.weightKg).filter((w): w is number => typeof w === "number" && w > 0);
  const unknownWeights = manifest.length - knownWeights.length;
  const totalWeight = knownWeights.reduce((s, w) => s + w, 0);
  const luggage = activeLeg?.luggage;
  const hard = luggage?.standardSuitcases || 0;
  const soft = luggage ? Math.max(0, (luggage.pieceCount || 0) - hard) : 0;

  return (
    <div className="space-y-5">
      {/* Manifest */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-visible">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-[17px] font-bold text-slate-900 m-0">
              Manifest · {sameManifest ? (legs.length > 1 ? "all legs" : "leg 1") : `leg ${activeLegIdx + 1}`}
            </h3>
            {!sameManifest && legs.length > 1 && (
              <div className="flex items-center gap-1.5">
                {legs.map((_, i) => (
                  <button
                    key={`mleg-${i}`}
                    type="button"
                    onClick={() => setManifestLeg(i)}
                    className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${
                      activeLegIdx === i ? "bg-[#0B1320] text-white border-[#0B1320]" : "bg-white text-slate-700 border-slate-300"
                    }`}
                  >
                    Leg {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80" ref={searchRef}>
              <input
                type="text"
                value={query}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                placeholder="Add from Contacts: type a name..."
                className={inputCls}
              />
              {isSearchOpen && (
                <div className="absolute right-0 left-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-72 overflow-y-auto">
                  {searchResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => addContact(c)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                    >
                      <div className="text-[14px] font-semibold text-slate-900">{contactFullName(c)}</div>
                      <div className="text-[12px] text-slate-500">
                        {[c.associatedAccountName, c.passportDetails?.passportNumber ? "passport on file" : "no passport on file"]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </button>
                  ))}
                  {searchResults.length === 0 && (
                    <div className="px-3.5 py-3 text-[13px] text-slate-500">
                      No contact found. Use &ldquo;New contact&rdquo; to add the person first.
                    </div>
                  )}
                </div>
              )}
            </div>
            <Link
              href="/contacts"
              className="bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm whitespace-nowrap"
            >
              New contact
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className={`${thCls} w-16`}></th>
                <th className={thCls}>Passenger</th>
                <th className={thCls}>Gender</th>
                <th className={thCls}>Weight</th>
                <th className={thCls}>Document</th>
                <th className={thCls}>Nationality</th>
                <th className={thCls}>Expires</th>
                <th className={thCls}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {manifest.map(({ info }) => {
                const isAuthorised = info.fullName.toLowerCase() === authorisedName;
                return (
                  <tr key={info.id} className="group align-top">
                    <td className="px-3 py-3">
                      {info.isLead && (
                        <span className="text-[12px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">Lead</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {info.contactId ? (
                        <Link href={`/contacts/${info.contactId}`} className="text-[#1F5FAE] underline underline-offset-2 hover:text-[#174A88]">
                          {info.fullName}
                        </Link>
                      ) : (
                        <span className="text-slate-900">{info.fullName}</span>
                      )}
                      {isAuthorised && <div className="text-[13px] text-slate-500">Authorised person</div>}
                    </td>
                    <td className="px-3 py-3 text-slate-800">{info.gender}</td>
                    <td className="px-3 py-3 text-slate-800 whitespace-nowrap">{info.weightKg ? `${info.weightKg} kg` : "—"}</td>
                    <td className="px-3 py-3">
                      {info.documentNumber ? (
                        <div className="text-slate-800 leading-tight">
                          {info.documentType || "Passport"}
                          <div className="font-mono text-[13px]">{maskDocument(info.documentNumber)}</div>
                        </div>
                      ) : (
                        <span className="text-amber-700">▲ No document</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-slate-800">{info.documentNumber ? info.nationality || "—" : "—"}</td>
                    <td className="px-3 py-3 text-slate-800 whitespace-nowrap">{info.documentNumber ? info.expires || "—" : "—"}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-between gap-2">
                        {info.complete ? (
                          <span className="text-[12px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">Complete</span>
                        ) : info.documentNumber ? (
                          <span className="text-[12px] font-semibold text-amber-800 bg-[#FCEFD2] px-2.5 py-1 rounded-full whitespace-nowrap">
                            ▲ Expiry missing
                          </span>
                        ) : (
                          <span className="text-[12px] font-semibold text-amber-800 bg-[#FCEFD2] px-2.5 py-1 rounded-full whitespace-nowrap">
                            ▲ Passport missing
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removePassenger(info.id, info.fullName)}
                          title="Remove from manifest"
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pets.map((pet) => (
                <tr key={pet.id} className="align-top">
                  <td className="px-3 py-3">
                    <span className="text-[12px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">Pet</span>
                  </td>
                  <td className="px-3 py-3 text-slate-900">{pet.line}</td>
                  <td className="px-3 py-3 text-slate-800">—</td>
                  <td className="px-3 py-3 text-slate-800">{pet.weight ? `${pet.weight} kg` : "—"}</td>
                  <td className="px-3 py-3">
                    {pet.doc ? (
                      <div className="text-slate-800 leading-tight">
                        Pet passport
                        <div className="font-mono text-[13px]">{maskDocument(pet.doc)}</div>
                      </div>
                    ) : (
                      <span className="text-amber-700">▲ No document</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-slate-800">—</td>
                  <td className="px-3 py-3 text-slate-800">—</td>
                  <td className="px-3 py-3">
                    {pet.complete ? (
                      <span className="text-[12px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">Complete</span>
                    ) : (
                      <span className="text-[12px] font-semibold text-amber-800 bg-[#FCEFD2] px-2.5 py-1 rounded-full whitespace-nowrap">
                        ▲ Pet passport missing
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {manifest.length === 0 && pets.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-6 text-[14px] text-slate-500">
                    No passengers yet. Add them from Contacts.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[13px] text-slate-500 px-5 py-3.5 m-0 border-t border-slate-100">
          Passengers can only be picked from Contacts, never typed in here, so their documents follow them into every trip. Clicking a
          name opens the contact. The ▲ stays until the details are added to the contact.
        </p>
      </div>

      {/* Weapons on board */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-[17px] font-bold text-slate-900 m-0">Weapons on board · leg {weaponLegIdx + 1}</h3>
            {legs.length > 1 && (
              <div className="flex items-center gap-1.5">
                {legs.map((_, i) => (
                  <button
                    key={`wleg-${i}`}
                    type="button"
                    onClick={() => setWeaponLeg(i)}
                    className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${
                      weaponLegIdx === i ? "bg-[#0B1320] text-white border-[#0B1320]" : "bg-white text-slate-700 border-slate-300"
                    }`}
                  >
                    Leg {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="text-[13px] text-slate-500">internal and operator manifest only · never on the client brief</span>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-[15px] font-bold text-slate-900">Weapon on board</span>
            <button type="button" onClick={() => setWeaponOnBoard(true)} className={pillCls(Boolean(savedWeapons?.onBoard))}>
              Yes
            </button>
            <button type="button" onClick={() => setWeaponOnBoard(false)} className={pillCls(!savedWeapons?.onBoard)}>
              No
            </button>
          </div>

          {weaponDraft?.onBoard && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className={labelCls}>Carried by</label>
                  <select
                    value={weaponDraft.carriedByPassengerId || ""}
                    onChange={(e) => {
                      const m = manifest.find((x) => x.info.id === e.target.value);
                      patchWeapon({ carriedByPassengerId: e.target.value, carriedByName: m?.info.fullName || "" }, true);
                    }}
                    className={`${inputCls} cursor-pointer`}
                  >
                    <option value="">Choose passenger</option>
                    {(legs[weaponLegIdx]?.passengers || []).map((p, i) => {
                      const info = resolvePassenger(p, contacts, i);
                      return (
                        <option key={info.id} value={info.id}>
                          {info.fullName}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Type</label>
                  <input
                    type="text"
                    value={weaponDraft.type || ""}
                    onChange={(e) => patchWeapon({ type: e.target.value })}
                    onBlur={() => commitWeaponDraft()}
                    placeholder="Pistol, unloaded, cased"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Serial / permit no.</label>
                  <input
                    type="text"
                    value={weaponDraft.serialOrPermit || ""}
                    onChange={(e) => patchWeapon({ serialOrPermit: e.target.value })}
                    onBlur={() => commitWeaponDraft()}
                    placeholder="[from permit]"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Ammunition</label>
                  <input
                    type="text"
                    value={weaponDraft.ammunition || ""}
                    onChange={(e) => patchWeapon({ ammunition: e.target.value })}
                    onBlur={() => commitWeaponDraft()}
                    placeholder="Separate · 30 rounds"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-lg">
                <table className="w-full text-[14px]">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className={thCls}>Clearance</th>
                      <th className={thCls}>Authority</th>
                      <th className={thCls}>Status</th>
                      <th className={thCls}>Reference</th>
                      <th className={thCls}>Document</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {weaponDraft.clearances.map((line) => {
                      const isOverflight = line.id.startsWith("ovf-");
                      return (
                        <tr key={line.id}>
                          <td className="px-3 py-2.5 text-slate-900">
                            {isOverflight ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={line.label}
                                  onChange={(e) => patchClearance(line.id, { label: e.target.value })}
                                  onBlur={() => commitWeaponDraft()}
                                  className="w-full bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-slate-500 py-0.5"
                                />
                                <button type="button" onClick={() => removeClearance(line.id)} title="Remove" className="text-slate-400 hover:text-red-600">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              line.label
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-slate-800">
                            <input
                              type="text"
                              value={line.authority}
                              onChange={(e) => patchClearance(line.id, { authority: e.target.value })}
                              onBlur={() => commitWeaponDraft()}
                              className="w-full bg-transparent focus:outline-none focus:border-b focus:border-slate-400 py-0.5"
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => cycleStatus(line)}
                              title="Click to change the status"
                              className={`text-[12px] font-semibold px-2.5 py-1 rounded-full capitalize ${statusPill(line.status)}`}
                            >
                              {line.status}
                            </button>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[13px] text-slate-800">
                            <input
                              type="text"
                              value={line.reference || ""}
                              onChange={(e) => patchClearance(line.id, { reference: e.target.value })}
                              onBlur={() => commitWeaponDraft()}
                              placeholder="—"
                              className="w-full bg-transparent focus:outline-none focus:border-b focus:border-slate-400 py-0.5 placeholder:text-slate-400"
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => uploadRefs.current[line.id]?.click()}
                              className="text-[#1F5FAE] underline underline-offset-2 hover:text-[#174A88]"
                            >
                              {line.documentName || "+ Upload"}
                            </button>
                            <input
                              ref={(el) => {
                                uploadRefs.current[line.id] = el;
                              }}
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) patchClearance(line.id, { documentName: f.name }, true);
                                e.target.value = "";
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {firstPending && (
                <div className="bg-[#FCEFD2] rounded-lg px-4 py-2.5 text-[14px] text-amber-900">
                  ▲ {firstPending.label.split(" · ")[0]} clearance {firstPending.status === "refused" ? "refused" : "pending"}. Shown on the trip
                  and the Overview until every line is Cleared. Never blocks work.
                </div>
              )}

              <p className="text-[13px] text-slate-500 m-0">
                <button type="button" onClick={addOverflight} className="text-[#1F5FAE] hover:underline">
                  + Add an overflight country
                </button>{" "}
                if its rules need it. Weapon details go on the operator manifest; the client flight brief does not show them.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Total passenger weight</div>
          <div className="text-[26px] font-bold text-slate-900 mt-1.5">
            {knownWeights.length > 0 ? `${totalWeight} kg` : "—"}
            {unknownWeights > 0 && knownWeights.length > 0 ? ` + ${unknownWeights} unknown` : ""}
            {knownWeights.length === 0 && manifest.length > 0 ? ` ${manifest.length} unknown` : ""}
          </div>
          <div className="text-[13px] text-slate-500 mt-0.5">Needed by operator for weight and balance</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Luggage</div>
          <div className="text-[26px] font-bold text-slate-900 mt-1.5">{luggage ? `${hard} hard · ${soft} soft` : "Not given"}</div>
          <div className="text-[13px] text-slate-500 mt-0.5">
            {luggage
              ? `≈ ${luggage.totalWeightKg || 0} kg${trip.aircraft?.baggageVolume ? ` · hold ${trip.aircraft.baggageVolume}` : ""}`
              : "Ask the client before the brief"}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Same manifest on all legs</div>
          <div className="text-[26px] font-bold text-slate-900 mt-1.5">{sameManifest ? "Yes" : "No"}</div>
          {legs.length > 1 ? (
            <button
              type="button"
              onClick={() => setSameManifest(!sameManifest)}
              className="text-[14px] text-[#1F5FAE] underline underline-offset-2 hover:text-[#174A88] mt-0.5"
            >
              {sameManifest ? "Edit per leg" : `Use the leg ${activeLegIdx + 1} manifest on all legs`}
            </button>
          ) : (
            <div className="text-[13px] text-slate-500 mt-0.5">One leg on this trip</div>
          )}
        </div>
      </div>
    </div>
  );
}
