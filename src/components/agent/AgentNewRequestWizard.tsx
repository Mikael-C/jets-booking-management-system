"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import CuratorAirportInput from "./CuratorAirportInput";
import { AddClientModal, CuratorClient } from "./AgentClientsView";
import { GhostButton, GoldButton, announceTokens, cardCls, fieldCls, goldLinkCls, labelCls } from "./curatorUi";

const STEPS = ["Client", "Route & dates", "Aircraft", "Passengers, luggage, pets", "Services", "Margin & send"];
const CATEGORIES = ["Light", "Midsize", "Super midsize", "Heavy", "Ultra long range"];
const CATEGORY_FROM_KEY: Record<string, string> = { light: "Light", midsize: "Midsize", "super-midsize": "Super midsize", large: "Heavy", "ultra-long-range": "Ultra long range" };
const VEHICLES = ["Sedan", "SUV", "Van", "Luxury"];
const FLEX = ["Fixed", "± 1 hour", "± 2 hours", "± 3 hours", "Same day"];
const SPECIES = ["Dog", "Cat", "Bird", "Other"];
const TRAVELS = ["In cabin", "Carrier", "Hold"];

type TripType = "one_way" | "round_trip" | "multi_leg";
interface Leg {
  from: string;
  to: string;
  date: string;
  time: string;
  flex: string;
}
interface LegAircraft {
  category: string;
  model: string;
  why: string;
}
interface Pet {
  name: string;
  species: string;
  breed: string;
  weightKg: string;
  travels: string;
}
interface GroundLeg {
  selected: boolean;
  arrival: { enabled: boolean; location: string; vehicle: string };
  departure: { enabled: boolean; location: string; vehicle: string };
  passengers: string;
  special: string;
}
interface HeliLeg {
  selected: boolean;
  passengers: string;
  type: string;
  from: string;
  to: string;
  luggage: string;
}
interface ExtraTransfer {
  pickup: string;
  dropoff: string;
  when: string;
  vehicle: string;
}

const emptyLeg = (): Leg => ({ from: "", to: "", date: "", time: "", flex: "Fixed" });
const emptyGround = (): GroundLeg => ({
  selected: false,
  arrival: { enabled: true, location: "", vehicle: "Sedan" },
  departure: { enabled: false, location: "", vehicle: "SUV" },
  passengers: "",
  special: ""
});
const emptyHeli = (): HeliLeg => ({ selected: false, passengers: "", type: "Twin-engine", from: "", to: "", luggage: "" });
const dayShort = (iso: string) => {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

const pillCls = (on: boolean, size: "md" | "sm" = "md") =>
  `rounded-full border font-semibold transition-colors ${size === "md" ? "px-5 py-2 text-[15px]" : "px-4 py-1.5 text-[14px]"} ${
    on ? "bg-[#C9A24A] border-[#C9A24A] text-[#0B121C]" : "bg-transparent border-[#2A3749] text-[#D5DCE5] hover:border-[#3A4A60]"
  }`;
const boxCls = "border border-[#263345] rounded-xl p-5";
const legTitleCls = "font-mono font-bold text-[15px] text-white mb-3";
const checkCls = "w-4 h-4 accent-[#2F7BF6]";

function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer text-[17px] text-white select-none">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className={checkCls} />
      {children}
    </label>
  );
}

export default function AgentNewRequestWizard() {
  const router = useRouter();
  const params = useSearchParams();

  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // 1 · Client
  const [clients, setClients] = useState<CuratorClient[] | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [client, setClient] = useState<CuratorClient | null>(null);
  const [adding, setAdding] = useState(false);

  // 2 · Route & dates
  const initialTrip: TripType = params?.get("trip") === "one_way" ? "one_way" : params?.get("trip") === "multi_leg" ? "multi_leg" : params?.get("from") ? "round_trip" : "one_way";
  const [tripType, setTripType] = useState<TripType>(initialTrip);
  const [legs, setLegs] = useState<Leg[]>([{ ...emptyLeg(), from: params?.get("from") || "", to: params?.get("to") || "", date: params?.get("date") || "" }]);
  const [ret, setRet] = useState<Leg>({ ...emptyLeg(), date: params?.get("date") || "" });

  // 3 · Aircraft
  const prefCategory = CATEGORY_FROM_KEY[params?.get("category") || ""] || "";
  const [aircraftMode, setAircraftMode] = useState<"same" | "per_leg">("same");
  const [aircraft, setAircraft] = useState<LegAircraft[]>([{ category: prefCategory, model: "", why: "" }]);

  // 4 · Passengers, luggage, pets
  const [passengers, setPassengers] = useState(params?.get("pax") || "");
  const [suitcases, setSuitcases] = useState("");
  const [oversize, setOversize] = useState("");
  const [hasPets, setHasPets] = useState(false);
  const [pets, setPets] = useState<Pet[]>([{ name: "", species: "Dog", breed: "", weightKg: "", travels: "In cabin" }]);

  // 5 · Services
  const [ground, setGround] = useState<GroundLeg[]>([]);
  const [groundOpen, setGroundOpen] = useState(0);
  const [groundExtra, setGroundExtra] = useState<ExtraTransfer[]>([]);
  const [heli, setHeli] = useState<HeliLeg[]>([]);
  const [heliExtra, setHeliExtra] = useState<(HeliLeg & { when: string })[]>([]);
  const [catering, setCatering] = useState(false);
  const [deicing, setDeicing] = useState(false);
  const [meetAssist, setMeetAssist] = useState(false);
  const [notes, setNotes] = useState("");

  // 6 · Margin & send
  const [marginPct, setMarginPct] = useState("8");
  const [balance, setBalance] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [needTokens, setNeedTokens] = useState(false);

  const loadClients = async (selectId?: string) => {
    try {
      const res = await api.curator.clients();
      const list: CuratorClient[] = res.data || [];
      setClients(list);
      setClientError(null);
      const want = selectId || params?.get("client");
      if (want) {
        const found = list.find((c) => c.id === want);
        if (found) setClient(found);
      }
    } catch (err: any) {
      setClientError(err?.message || "Your clients could not be loaded.");
    }
  };
  useEffect(() => {
    loadClients();
    api.curator
      .me()
      .then((res) => setBalance(Number(res?.data?.tokens) || 0))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Legs as flown: a round trip adds the return leg. */
  const flightLegs: Leg[] = useMemo(() => {
    if (tripType === "round_trip") return [legs[0], { ...ret, from: legs[0].to, to: legs[0].from }];
    if (tripType === "one_way") return [legs[0]];
    return legs;
  }, [tripType, legs, ret]);

  // Keep the per-leg lists the same length as the legs
  useEffect(() => {
    const n = flightLegs.length;
    setAircraft((prev) => (prev.length === n ? prev : Array.from({ length: n }, (_, i) => prev[i] || { ...prev[0], model: "", why: "" })));
    setGround((prev) => (prev.length === n ? prev : Array.from({ length: n }, (_, i) => prev[i] || emptyGround())));
    setHeli((prev) => (prev.length === n ? prev : Array.from({ length: n }, (_, i) => prev[i] || emptyHeli())));
  }, [flightLegs.length]);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = clients || [];
    if (!q) return list.slice(0, 8);
    return list.filter((c) => [c.name, c.authorisedPerson, c.assistant, c.email].some((v) => String(v || "").toLowerCase().includes(q)));
  }, [clients, search]);

  const tokenCost = flightLegs.length;

  const validate = (s: number): string | null => {
    if (s === 1 && !client) return "Pick the client first.";
    if (s === 2) {
      for (let i = 0; i < flightLegs.length; i++) {
        const l = flightLegs[i];
        if (!l.from || !l.to) return `Leg ${i + 1}: pick both airports.`;
        if (l.from === l.to) return `Leg ${i + 1}: departure and destination are the same.`;
        if (!l.date) return `Leg ${i + 1}: add the date.`;
      }
      for (let i = 1; i < flightLegs.length; i++) {
        if (flightLegs[i].date < flightLegs[i - 1].date) return `Leg ${i + 1} is dated before leg ${i}.`;
      }
    }
    if (s === 3) {
      const list = aircraftMode === "same" ? [aircraft[0]] : aircraft;
      if (list.some((a) => !a || !a.category)) return aircraftMode === "same" ? "Pick a category." : "Pick a category for every leg.";
    }
    if (s === 4) {
      if (!(Number(passengers) >= 1)) return "Add the number of passengers.";
      if (hasPets && !pets.some((p) => p.species || p.breed)) return "Add the pet details, or untick Travelling with pets.";
    }
    return null;
  };

  const go = (target: number) => {
    if (target > step) {
      for (let s = step; s < target; s++) {
        const msg = validate(s);
        if (msg) {
          setStep(s);
          setError(msg);
          return;
        }
      }
    }
    setError(null);
    setStep(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    for (let s = 1; s <= 5; s++) {
      const msg = validate(s);
      if (msg) {
        setStep(s);
        setError(msg);
        return;
      }
    }
    setSending(true);
    setError(null);
    setNeedTokens(false);
    const aircraftList = aircraftMode === "same" ? flightLegs.map(() => aircraft[0]) : aircraft;
    try {
      await api.curator.createRequest({
        clientId: client!.id,
        tripType,
        legs: flightLegs.map((l) => ({ ...l, pax: Number(passengers) })),
        passengers: Number(passengers),
        aircraftMode,
        legAircraft: aircraftList,
        suitcases: Number(suitcases) || 0,
        oversizeItems: oversize,
        hasPets,
        pets: hasPets ? pets.map((p) => ({ ...p, weightKg: Number(p.weightKg) || 0 })) : [],
        ground: {
          enabled: ground.some((g) => g.selected) || groundExtra.length > 0,
          legs: ground.map((g, i) => ({ ...g, leg: i + 1, passengers: Number(g.passengers) || Number(passengers) })),
          extra: groundExtra
        },
        helicopter: {
          enabled: heli.some((h) => h.selected) || heliExtra.length > 0,
          legs: heli.map((h, i) => ({ ...h, leg: i + 1, when: "on arrival", passengers: Number(h.passengers) || Number(passengers) })),
          extra: heliExtra
        },
        catering,
        deicing,
        meetAssist,
        notes,
        marginPct: Number(marginPct) || 0
      });
      announceTokens();
      router.push("/agent/requests");
    } catch (err: any) {
      if (err?.code === "INSUFFICIENT_TOKENS") setNeedTokens(true);
      setError(err?.message || "The request could not be sent.");
    } finally {
      setSending(false);
    }
  };

  const updateLeg = (i: number, patch: Partial<Leg>) => setLegs((prev) => prev.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const updateAircraft = (i: number, patch: Partial<LegAircraft>) => setAircraft((prev) => prev.map((a, j) => (j === i ? { ...a, ...patch } : a)));
  const updateGround = (i: number, patch: Partial<GroundLeg>) => setGround((prev) => prev.map((g, j) => (j === i ? { ...g, ...patch } : g)));
  const updateHeli = (i: number, patch: Partial<HeliLeg>) => setHeli((prev) => prev.map((h, j) => (j === i ? { ...h, ...patch } : h)));
  const legHead = (i: number) => `Leg ${i + 1} · ${flightLegs[i]?.from || "—"} → ${flightLegs[i]?.to || "—"}`;

  const nextLabel = step < 6 ? `Next: ${STEPS[step]}` : "";
  const nav = (
    <div className="flex items-center gap-3 mt-6">
      {step > 1 && <GhostButton onClick={() => go(step - 1)}>Back</GhostButton>}
      {step < 6 && <GoldButton onClick={() => go(step + 1)}>{nextLabel}</GoldButton>}
    </div>
  );

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[32px] leading-tight font-bold text-white tracking-tight m-0">New request</h1>
          <p className="text-[15px] text-[#93A1B5] mt-1.5 mb-0">
            {step === 1 ? "Pick an existing client; details fill in automatically." : `Step ${step} of 6${client ? ` · ${client.name}` : ""}`}
          </p>
        </div>
        <Link href="/agent/estimate" className={`${goldLinkCls} mt-3 whitespace-nowrap`}>
          Price estimate
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">
        <div className="space-y-1">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const active = n === step;
            return (
              <button
                key={label}
                type="button"
                onClick={() => go(n)}
                className={`w-full text-left px-5 py-3 rounded-xl text-[18px] transition-colors ${
                  active ? "bg-[#16233A] text-white font-bold" : "text-[#A8B3C2] hover:text-white"
                }`}
              >
                {n} · {label}
              </button>
            );
          })}
        </div>

        <div className={`${cardCls} p-7`}>
          {/* ───────── 1 · Client ───────── */}
          {step === 1 && (
            <div>
              <h2 className="text-[20px] font-bold text-white mt-0 mb-5">Who is the client?</h2>
              <label className={labelCls}>Search my clients</label>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, owner or email" className={`${fieldCls} py-3`} />
              {clientError && <div className="text-[14px] text-[#F08C8C] mt-3">{clientError}</div>}
              {clients && filteredClients.length > 0 && (
                <div className="mt-4 border border-[#263345] rounded-xl overflow-hidden">
                  {filteredClients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setClient(c)}
                      className={`w-full text-left px-5 py-3.5 border-b border-[#263345] last:border-0 transition-colors ${
                        client?.id === c.id ? "bg-[#16233A]" : "hover:bg-white/[0.03]"
                      }`}
                    >
                      <span className="text-[18px] font-bold text-white">{c.name}</span>
                      <span className="text-[15px] text-[#A8B3C2]">
                        {" "}
                        · {c.authorisedPerson} ({c.type === "Person" ? "client" : "owner"}){c.assistant ? ` · ${c.assistant} (assistant)` : ""} · {c.trips}{" "}
                        trip{c.trips === 1 ? "" : "s"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {clients && filteredClients.length === 0 && (
                <div className="mt-4 text-[15px] text-[#93A1B5]">{search ? "No client matches." : "You have no clients yet."}</div>
              )}
              <p className="text-[15px] text-[#A8B3C2] mt-4 mb-0">
                Not in your list?{" "}
                <button type="button" onClick={() => setAdding(true)} className="text-[#C9A24A] underline underline-offset-4">
                  Add a new client
                </button>
                : company, authorised owner, assistant (optional), email, WhatsApp.
              </p>
              {client && (
                <div className="mt-5 border border-[#263345] rounded-xl px-6 py-5 bg-[#0F1724]">
                  <div className="text-[15px] text-[#A8B3C2]">Selected</div>
                  <div className="text-[20px] font-bold text-white mt-2">{client.name}</div>
                  <div className="text-[15px] text-[#A8B3C2] mt-2">
                    Authorised owner: {client.authorisedPerson} · Documents to: {client.documentsTo}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ───────── 2 · Route & dates ───────── */}
          {step === 2 && (
            <div>
              <h2 className="text-[20px] font-bold text-white mt-0 mb-5">Route &amp; dates</h2>
              <div className="flex flex-wrap gap-3 mb-5">
                {(
                  [
                    ["one_way", "One way"],
                    ["round_trip", "Round trip"],
                    ["multi_leg", "Multi-leg"]
                  ] as [TripType, string][]
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setTripType(k);
                      if (k === "multi_leg" && legs.length < 2) setLegs((prev) => [...prev, { ...emptyLeg(), from: prev[0].to }]);
                      if (k !== "multi_leg") setLegs((prev) => [prev[0]]);
                    }}
                    className={pillCls(tripType === k)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                {legs.map((l, i) => (
                  <div key={i} className={boxCls}>
                    <div className="flex items-center justify-between">
                      <div className={legTitleCls}>Leg {i + 1}</div>
                      {tripType === "multi_leg" && legs.length > 2 && (
                        <button type="button" onClick={() => setLegs((prev) => prev.filter((_, j) => j !== i))} className="text-[13px] text-[#F08C8C]">
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>From</label>
                        <CuratorAirportInput value={l.from} onChange={(code) => updateLeg(i, { from: code })} />
                      </div>
                      <div>
                        <label className={labelCls}>To</label>
                        <CuratorAirportInput value={l.to} onChange={(code) => updateLeg(i, { to: code })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className={labelCls}>Date</label>
                        <input type="date" value={l.date} onChange={(e) => updateLeg(i, { date: e.target.value })} className={fieldCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Departure (local)</label>
                        <input type="time" value={l.time} onChange={(e) => updateLeg(i, { time: e.target.value })} className={fieldCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Flexibility</label>
                        <select value={l.flex} onChange={(e) => updateLeg(i, { flex: e.target.value })} className={fieldCls}>
                          {FLEX.map((f) => (
                            <option key={f}>{f}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                {tripType === "round_trip" && (
                  <div className={boxCls}>
                    <div className={legTitleCls}>
                      Leg 2 · return · {legs[0].to || "—"} → {legs[0].from || "—"}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className={labelCls}>Date</label>
                        <input type="date" value={ret.date} onChange={(e) => setRet({ ...ret, date: e.target.value })} className={fieldCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Departure (local)</label>
                        <input type="time" value={ret.time} onChange={(e) => setRet({ ...ret, time: e.target.value })} className={fieldCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Flexibility</label>
                        <select value={ret.flex} onChange={(e) => setRet({ ...ret, flex: e.target.value })} className={fieldCls}>
                          {FLEX.map((f) => (
                            <option key={f}>{f}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
                {tripType === "multi_leg" && (
                  <GhostButton onClick={() => setLegs((prev) => [...prev, { ...emptyLeg(), from: prev[prev.length - 1].to }])}>+ Add leg</GhostButton>
                )}
              </div>
              <p className="text-[15px] text-[#A8B3C2] mt-5 mb-0">Each leg uses 1 token when the request is sent.</p>
            </div>
          )}

          {/* ───────── 3 · Aircraft ───────── */}
          {step === 3 && (
            <div>
              <h2 className="text-[20px] font-bold text-white mt-0 mb-5">Aircraft</h2>
              {flightLegs.length > 1 && (
                <div className="flex flex-wrap gap-3 mb-5">
                  <button type="button" onClick={() => setAircraftMode("same")} className={pillCls(aircraftMode === "same")}>
                    Same aircraft on all legs
                  </button>
                  <button type="button" onClick={() => setAircraftMode("per_leg")} className={pillCls(aircraftMode === "per_leg")}>
                    Different aircraft per leg
                  </button>
                </div>
              )}
              <div className="space-y-4">
                {(aircraftMode === "same" ? [0] : flightLegs.map((_, i) => i)).map((i) => {
                  const a = aircraft[i] || { category: "", model: "", why: "" };
                  const l = flightLegs[i];
                  return (
                    <div key={i} className={boxCls}>
                      <div className={legTitleCls}>
                        {aircraftMode === "same"
                          ? flightLegs.length > 1
                            ? `All ${flightLegs.length} legs`
                            : `Leg 1 · ${l.from || "—"} → ${l.to || "—"}${l.date ? ` · ${dayShort(l.date)}` : ""}`
                          : `Leg ${i + 1} · ${l.from || "—"} → ${l.to || "—"}${l.date ? ` · ${dayShort(l.date)}` : ""}`}
                      </div>
                      <div className="flex flex-wrap gap-2.5 mb-4">
                        {CATEGORIES.map((c) => (
                          <button key={c} type="button" onClick={() => updateAircraft(i, { category: c })} className={pillCls(a.category === c)}>
                            {c}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Preferred model (optional)</label>
                          <input value={a.model} onChange={(e) => updateAircraft(i, { model: e.target.value })} className={fieldCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Why (optional)</label>
                          <input value={a.why} onChange={(e) => updateAircraft(i, { why: e.target.value })} className={fieldCls} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[15px] text-[#A8B3C2] mt-5 mb-0">
                The desk sees each leg&apos;s wish in the quote builder, already filled in, and can quote one aircraft per leg. The quote PDF shows the aircraft
                and photos for each leg.
              </p>
            </div>
          )}

          {/* ───────── 4 · Passengers, luggage, pets ───────── */}
          {step === 4 && (
            <div>
              <h2 className="text-[20px] font-bold text-white mt-0 mb-5">Passengers, luggage, pets</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Passengers</label>
                  <input type="number" min={1} value={passengers} onChange={(e) => setPassengers(e.target.value)} className={`${fieldCls} py-3`} />
                </div>
                <div>
                  <label className={labelCls}>Suitcases</label>
                  <input type="number" min={0} value={suitcases} onChange={(e) => setSuitcases(e.target.value)} className={`${fieldCls} py-3`} />
                </div>
                <div>
                  <label className={labelCls}>Oversize items</label>
                  <input value={oversize} onChange={(e) => setOversize(e.target.value)} placeholder="e.g. Golf bag ×1" className={`${fieldCls} py-3`} />
                </div>
              </div>
              <div className="mt-5">
                <Check checked={hasPets} onChange={setHasPets}>
                  Travelling with pets
                </Check>
              </div>
              {hasPets && (
                <div className={`${boxCls} mt-4`}>
                  <div className="space-y-4">
                    {pets.map((p, i) => {
                      const set = (patch: Partial<Pet>) => setPets((prev) => prev.map((x, j) => (j === i ? { ...x, ...patch } : x)));
                      return (
                        <div key={i} className="grid grid-cols-[28px_1fr] gap-3 items-end">
                          <div className="text-[16px] font-bold text-white pb-3">{i + 1}</div>
                          <div className="grid grid-cols-2 md:grid-cols-[1fr_1fr_1fr_0.5fr_1fr_auto] gap-3 items-end">
                            <div>
                              <label className={labelCls}>Name (optional)</label>
                              <input value={p.name} onChange={(e) => set({ name: e.target.value })} className={fieldCls} />
                            </div>
                            <div>
                              <label className={labelCls}>Species</label>
                              <select value={p.species} onChange={(e) => set({ species: e.target.value })} className={fieldCls}>
                                {SPECIES.map((s) => (
                                  <option key={s}>{s}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className={labelCls}>Breed</label>
                              <input value={p.breed} onChange={(e) => set({ breed: e.target.value })} className={fieldCls} />
                            </div>
                            <div>
                              <label className={labelCls}>Weight kg</label>
                              <input type="number" min={0} value={p.weightKg} onChange={(e) => set({ weightKg: e.target.value })} className={fieldCls} />
                            </div>
                            <div>
                              <label className={labelCls}>Travels</label>
                              <select value={p.travels} onChange={(e) => set({ travels: e.target.value })} className={fieldCls}>
                                {TRAVELS.map((s) => (
                                  <option key={s}>{s}</option>
                                ))}
                              </select>
                            </div>
                            {pets.length > 1 ? (
                              <button type="button" onClick={() => setPets((prev) => prev.filter((_, j) => j !== i))} className="text-[13px] text-[#F08C8C] pb-3">
                                Remove
                              </button>
                            ) : (
                              <span />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <GhostButton className="mt-4" onClick={() => setPets((prev) => [...prev, { name: "", species: "Dog", breed: "", weightKg: "", travels: "In cabin" }])}>
                    + Add pet
                  </GhostButton>
                </div>
              )}
            </div>
          )}

          {/* ───────── 5 · Services ───────── */}
          {step === 5 && (
            <div>
              <h2 className="text-[20px] font-bold text-white mt-0 mb-5">Services</h2>

              <div className={`${boxCls} mb-5`}>
                <h3 className="text-[18px] font-bold text-white mt-0 mb-4">Ground transportation</h3>
                <div className="flex flex-wrap gap-6 mb-4">
                  {flightLegs.map((_, i) => (
                    <Check
                      key={i}
                      checked={Boolean(ground[i]?.selected)}
                      onChange={(v) => {
                        updateGround(i, { selected: v });
                        if (v) setGroundOpen(i);
                      }}
                    >
                      Leg {i + 1}
                    </Check>
                  ))}
                </div>
                <div className="space-y-3">
                  {ground.map((g, i) =>
                    !g.selected ? null : groundOpen !== i ? (
                      <button key={i} type="button" onClick={() => setGroundOpen(i)} className="block text-left text-[15px] text-[#A8B3C2] hover:text-white">
                        {legHead(i)} — {g.arrival.enabled || g.departure.enabled ? "same checklist" : "no transfer chosen"} (collapsed)
                      </button>
                    ) : (
                      <div key={i} className={boxCls}>
                        <div className={legTitleCls}>{legHead(i)}</div>
                        {(["arrival", "departure"] as const).map((k, n) => (
                          <div key={k} className="mb-4">
                            <Check checked={g[k].enabled} onChange={(v) => updateGround(i, { [k]: { ...g[k], enabled: v } } as Partial<GroundLeg>)}>
                              {n + 1} · {k === "arrival" ? "On arrival · drop-off" : "On departure · pick-up"}
                            </Check>
                            {g[k].enabled && (
                              <div className="mt-3">
                                <label className={labelCls}>{k === "arrival" ? "Drop-off location" : "Pick-up location"}</label>
                                <div className="flex flex-col md:flex-row gap-3">
                                  <input
                                    value={g[k].location}
                                    onChange={(e) => updateGround(i, { [k]: { ...g[k], location: e.target.value } } as Partial<GroundLeg>)}
                                    className={`${fieldCls} flex-1`}
                                  />
                                  <div className="flex gap-2 shrink-0">
                                    {VEHICLES.map((v) => (
                                      <button
                                        key={v}
                                        type="button"
                                        onClick={() => updateGround(i, { [k]: { ...g[k], vehicle: v } } as Partial<GroundLeg>)}
                                        className={pillCls(g[k].vehicle === v, "sm")}
                                      >
                                        {v}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-3">
                          <div>
                            <label className={labelCls}>Passengers</label>
                            <input
                              type="number"
                              min={1}
                              value={g.passengers}
                              placeholder={passengers}
                              onChange={(e) => updateGround(i, { passengers: e.target.value })}
                              className={fieldCls}
                            />
                          </div>
                          <div>
                            <label className={labelCls}>Special requests</label>
                            <input value={g.special} onChange={(e) => updateGround(i, { special: e.target.value })} className={fieldCls} />
                          </div>
                        </div>
                      </div>
                    )
                  )}
                  {groundExtra.map((x, i) => {
                    const set = (patch: Partial<ExtraTransfer>) => setGroundExtra((prev) => prev.map((y, j) => (j === i ? { ...y, ...patch } : y)));
                    return (
                      <div key={`gx-${i}`} className={boxCls}>
                        <div className="flex items-center justify-between">
                          <div className={legTitleCls}>Extra transfer {i + 1}</div>
                          <button type="button" onClick={() => setGroundExtra((prev) => prev.filter((_, j) => j !== i))} className="text-[13px] text-[#F08C8C]">
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className={labelCls}>Pick-up</label>
                            <input value={x.pickup} onChange={(e) => set({ pickup: e.target.value })} className={fieldCls} />
                          </div>
                          <div>
                            <label className={labelCls}>Drop-off</label>
                            <input value={x.dropoff} onChange={(e) => set({ dropoff: e.target.value })} className={fieldCls} />
                          </div>
                          <div>
                            <label className={labelCls}>When</label>
                            <input value={x.when} onChange={(e) => set({ when: e.target.value })} placeholder="e.g. 6 Dec 19:00" className={fieldCls} />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          {VEHICLES.map((v) => (
                            <button key={v} type="button" onClick={() => set({ vehicle: v })} className={pillCls(x.vehicle === v, "sm")}>
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <GhostButton className="mt-4" onClick={() => setGroundExtra((prev) => [...prev, { pickup: "", dropoff: "", when: "", vehicle: "Sedan" }])}>
                  + Add another transfer
                </GhostButton>
              </div>

              <div className={`${boxCls} mb-5`}>
                <h3 className="text-[18px] font-bold text-white mt-0 mb-4">Helicopter transfer</h3>
                <div className="flex flex-wrap gap-6 mb-4">
                  {flightLegs.map((_, i) => (
                    <Check
                      key={i}
                      checked={Boolean(heli[i]?.selected)}
                      onChange={(v) => updateHeli(i, { selected: v, from: heli[i]?.from || flightLegs[i]?.to || "" })}
                    >
                      Leg {i + 1}
                    </Check>
                  ))}
                </div>
                <div className="space-y-3">
                  {[...heli.map((h, i) => ({ h, i, extra: false as const })), ...heliExtra.map((h, i) => ({ h, i, extra: true as const }))].map(({ h, i, extra }) => {
                    if (!extra && !h.selected) return null;
                    const set = (patch: Partial<HeliLeg & { when: string }>) =>
                      extra ? setHeliExtra((prev) => prev.map((y, j) => (j === i ? { ...y, ...patch } : y))) : updateHeli(i, patch);
                    return (
                      <div key={`${extra ? "hx" : "h"}-${i}`} className={boxCls}>
                        <div className="flex items-center justify-between">
                          <div className={legTitleCls}>{extra ? `Extra helicopter transfer ${i + 1}` : `Leg ${i + 1} · on arrival`}</div>
                          {extra && (
                            <button type="button" onClick={() => setHeliExtra((prev) => prev.filter((_, j) => j !== i))} className="text-[13px] text-[#F08C8C]">
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-[120px_1fr_1fr_1fr] gap-3">
                          <div>
                            <label className={labelCls}>Passengers</label>
                            <input type="number" min={1} value={h.passengers} placeholder={passengers} onChange={(e) => set({ passengers: e.target.value })} className={fieldCls} />
                          </div>
                          <div>
                            <label className={labelCls}>Helicopter type</label>
                            <select value={h.type} onChange={(e) => set({ type: e.target.value })} className={fieldCls}>
                              {["Twin-engine", "Single-engine", "VIP twin-engine (AW139 / EC155)"].map((t) => (
                                <option key={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className={labelCls}>From</label>
                            <input value={h.from} onChange={(e) => set({ from: e.target.value })} className={fieldCls} />
                          </div>
                          <div>
                            <label className={labelCls}>To</label>
                            <input value={h.to} onChange={(e) => set({ to: e.target.value })} className={fieldCls} />
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className={labelCls}>Luggage</label>
                          <input value={h.luggage} onChange={(e) => set({ luggage: e.target.value })} className={fieldCls} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <GhostButton className="mt-4" onClick={() => setHeliExtra((prev) => [...prev, { ...emptyHeli(), selected: true, when: "" }])}>
                  + Add another helicopter transfer
                </GhostButton>
              </div>

              <div className="flex flex-wrap gap-8">
                <Check checked={catering} onChange={setCatering}>
                  Catering
                </Check>
                <Check checked={deicing} onChange={setDeicing}>
                  De-icing protection
                </Check>
                <Check checked={meetAssist} onChange={setMeetAssist}>
                  Meet &amp; assist at terminal
                </Check>
              </div>
              <p className="text-[15px] text-[#A8B3C2] mt-3 mb-0">No prices here: the desk prices each service in the quote.</p>
            </div>
          )}

          {/* ───────── 6 · Margin & send ───────── */}
          {step === 6 && (
            <div>
              <h2 className="text-[20px] font-bold text-white mt-0 mb-5">Margin &amp; send</h2>
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-end">
                <div>
                  <label className={labelCls}>Your margin %</label>
                  <input type="number" min={0} max={30} step={0.5} value={marginPct} onChange={(e) => setMarginPct(e.target.value)} className={`${fieldCls} py-3`} />
                </div>
                <p className="text-[15px] text-[#A8B3C2] m-0 pb-3">Added on top of the net price. The client sees only the final price.</p>
              </div>
              <div className={`${boxCls} mt-5 space-y-2 text-[16px]`}>
                <div className="text-white">
                  <span className="text-[#A8B3C2]">Client:</span> {client?.name || "—"}
                </div>
                {flightLegs.map((l, i) => (
                  <div key={i} className="text-white">
                    <span className="text-[#A8B3C2]">Leg {i + 1}:</span> <span className="font-mono">{l.from} → {l.to}</span> · {dayShort(l.date)}
                    {l.time ? ` ${l.time} LT` : ""} ·{" "}
                    {(aircraftMode === "same" ? aircraft[0] : aircraft[i])?.category || "any category"}
                    {(aircraftMode === "same" ? aircraft[0] : aircraft[i])?.model ? ` (${(aircraftMode === "same" ? aircraft[0] : aircraft[i])?.model})` : ""}
                  </div>
                ))}
                <div className="text-white">
                  <span className="text-[#A8B3C2]">Passengers:</span> {passengers || "—"} · {suitcases || 0} suitcases{oversize ? ` · ${oversize}` : ""}
                  {hasPets ? ` · ${pets.length} pet${pets.length === 1 ? "" : "s"}` : ""}
                </div>
                <div className="text-white">
                  <span className="text-[#A8B3C2]">Services:</span>{" "}
                  {[
                    ground.some((g) => g.selected) || groundExtra.length ? "ground transport" : "",
                    heli.some((h) => h.selected) || heliExtra.length ? "helicopter" : "",
                    catering ? "catering" : "",
                    deicing ? "de-icing protection" : "",
                    meetAssist ? "meet & assist" : ""
                  ]
                    .filter(Boolean)
                    .join(", ") || "none"}
                </div>
              </div>
              <div className="mt-5">
                <label className={labelCls}>Note to the desk (optional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={`${fieldCls} resize-none`} />
              </div>
              <p className="text-[15px] text-[#A8B3C2] mt-5 mb-0">
                This request uses <strong className="text-white">{tokenCost} token{tokenCost === 1 ? "" : "s"}</strong> (1 per leg).
                {balance !== null ? ` Your balance: ${balance}.` : ""}
              </p>
              {error && (
                <div className="mt-4 text-[14px] text-[#F08C8C]">
                  {error}{" "}
                  {needTokens && (
                    <Link href="/agent/tokens" className={goldLinkCls}>
                      Buy tokens
                    </Link>
                  )}
                </div>
              )}
              <div className="flex items-center gap-3 mt-6">
                <GhostButton onClick={() => go(5)}>Back</GhostButton>
                <GoldButton onClick={submit} disabled={sending}>
                  {sending ? "Sending…" : `Send request · ${tokenCost} token${tokenCost === 1 ? "" : "s"}`}
                </GoldButton>
              </div>
            </div>
          )}

          {step < 6 && error && <div className="mt-4 text-[14px] text-[#F08C8C]">{error}</div>}
          {step < 6 && nav}
        </div>
      </div>

      {adding && (
        <AddClientModal
          onClose={() => setAdding(false)}
          onSaved={(id) => {
            setAdding(false);
            loadClients(id);
          }}
        />
      )}
    </div>
  );
}
