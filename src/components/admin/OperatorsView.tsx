"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import { OperatorRecord } from "@/types/aviation";

interface OperatorsViewProps {
  selectedOperatorId?: string;
}

export default function OperatorsView({ selectedOperatorId }: OperatorsViewProps = {}) {
  const router = useRouter();
  const { operators, updateOperatorStatus, addAuditEntry, currentUser } = useAviation();

  const [activeOpId, setActiveOpId] = useState<string | null>(selectedOperatorId || null);
  const [activeTab, setActiveTab] = useState<"compliance" | "fleet" | "offers" | "trips_flown" | "contacts">("compliance");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPill, setFilterPill] = useState<"all" | "approved" | "preferred" | "pending" | "suspended">("all");

  useEffect(() => {
    if (selectedOperatorId) {
      setActiveOpId(selectedOperatorId);
    }
  }, [selectedOperatorId]);

  const activeOperator = useMemo(() => {
    if (!activeOpId) return null;
    return (
      operators.find(
        (o) =>
          o.id === activeOpId ||
          o.tradingName?.toLowerCase().replace(/\s+/g, "-") === activeOpId.toLowerCase() ||
          o.tradingName?.toLowerCase().includes(activeOpId.toLowerCase()) ||
          o.legalName?.toLowerCase().includes(activeOpId.toLowerCase())
      ) || operators[0] || null
    );
  }, [activeOpId, operators]);

  const filteredOperators = useMemo(() => {
    return operators.filter((op) => {
      if (filterPill === "approved" && op.status !== "approved") return false;
      if (filterPill === "preferred" && op.safetyRating !== "ARGUS Platinum" && !op.tradingName.toLowerCase().includes("alpine")) return false;
      if (filterPill === "pending" && op.status !== "pending") return false;
      if (filterPill === "suspended" && op.status !== "suspended") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = op.tradingName?.toLowerCase().includes(q) || op.legalName?.toLowerCase().includes(q);
        const matchAoc = op.aocNumber?.toLowerCase().includes(q);
        const matchBase = op.baseIcao?.toLowerCase().includes(q);
        if (!matchName && !matchAoc && !matchBase) return false;
      }
      return true;
    });
  }, [operators, filterPill, searchQuery]);

  const handleOpenOperator = (op: OperatorRecord) => {
    setActiveOpId(op.id);
    setActiveTab("compliance");
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `/operators/${op.id}`);
    }
  };

  const handleBackToList = () => {
    setActiveOpId(null);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `/operators`);
    }
  };

  // ==========================================
  // VIEW: DETAILS SCREEN (SCREEN 2)
  // ==========================================
  if (activeOperator) {
    const isPreferred = activeOperator.safetyRating === "ARGUS Platinum" || activeOperator.tradingName.toLowerCase().includes("alpine");
    const aocDisplay = `AOC ${activeOperator.aocNumber || "ES-xxx"} · ${activeOperator.aocAuthority || "AESA"}`;

    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
          <button
            onClick={handleBackToList}
            className="hover:text-gray-900 transition-colors"
          >
            Operators
          </button>
          <span>/</span>
          <span className="text-gray-800">{activeOperator.tradingName}</span>
        </div>

        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {activeOperator.tradingName}{" "}
              <span className="text-gray-500 font-normal">· Internal only</span>
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                Approved
              </span>
              {isPreferred && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
                  Preferred
                </span>
              )}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700">
                {aocDisplay}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => alert(`Editing qualification parameters for ${activeOperator.tradingName}`)}
              className="bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 text-xs font-medium px-4 py-1.5 rounded-lg shadow-sm transition-all"
            >
              Edit
            </button>
            <button
              onClick={() => {
                if (confirm(`Suspend commercial operations with ${activeOperator.tradingName}?`)) {
                  updateOperatorStatus(activeOperator.id, "suspended");
                }
              }}
              className="bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 text-xs font-medium px-4 py-1.5 rounded-lg shadow-sm transition-all"
            >
              Suspend
            </button>
          </div>
        </div>

        {/* Tabs Row */}
        <div className="flex items-center gap-6 border-b border-gray-200 text-xs">
          <button
            onClick={() => setActiveTab("compliance")}
            className={`pb-2.5 font-medium transition-colors ${
              activeTab === "compliance"
                ? "border-b-2 border-black text-gray-900 font-bold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Compliance
          </button>
          <button
            onClick={() => setActiveTab("fleet")}
            className={`pb-2.5 font-medium transition-colors ${
              activeTab === "fleet"
                ? "border-b-2 border-black text-gray-900 font-bold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Fleet (4)
          </button>
          <button
            onClick={() => setActiveTab("offers")}
            className={`pb-2.5 font-medium transition-colors ${
              activeTab === "offers"
                ? "border-b-2 border-black text-gray-900 font-bold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Offers (12)
          </button>
          <button
            onClick={() => setActiveTab("trips_flown")}
            className={`pb-2.5 font-medium transition-colors ${
              activeTab === "trips_flown"
                ? "border-b-2 border-black text-gray-900 font-bold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Trips flown (5)
          </button>
          <button
            onClick={() => setActiveTab("contacts")}
            className={`pb-2.5 font-medium transition-colors ${
              activeTab === "contacts"
                ? "border-b-2 border-black text-gray-900 font-bold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Contacts
          </button>
        </div>

        {/* Tab 1: COMPLIANCE (Screen 2 Layout) */}
        {activeTab === "compliance" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
                <h2 className="text-sm font-bold text-gray-900">Compliance · 9 of 9</h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 text-[11px] uppercase tracking-wider">
                        <th className="py-2.5 font-semibold">DOCUMENT</th>
                        <th className="py-2.5 font-semibold">REFERENCE</th>
                        <th className="py-2.5 font-semibold">EXPIRES</th>
                        <th className="py-2.5 font-semibold">STATUS</th>
                        <th className="py-2.5 text-right font-semibold"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr className="hover:bg-gray-50/50">
                        <td className="py-3 font-medium text-gray-900">Air Operator Certificate</td>
                        <td className="py-3 text-gray-600 font-mono">ES-xxx · AESA</td>
                        <td className="py-3 text-gray-700 whitespace-nowrap">30 Nov 2027</td>
                        <td className="py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                            Verified
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <a href="#" onClick={(e) => { e.preventDefault(); alert("Viewing Air Operator Certificate PDF"); }} className="text-blue-600 hover:underline font-medium">PDF</a>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50/50">
                        <td className="py-3 font-medium text-gray-900">Operating specifications</td>
                        <td className="py-3 text-gray-600 font-mono">Ops Spec rev 12</td>
                        <td className="py-3 text-gray-700 whitespace-nowrap">30 Nov 2027</td>
                        <td className="py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                            Verified
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <a href="#" onClick={(e) => { e.preventDefault(); alert("Viewing Ops Spec PDF"); }} className="text-blue-600 hover:underline font-medium">PDF</a>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50/50">
                        <td className="py-3 font-medium text-gray-900">Liability insurance</td>
                        <td className="py-3 text-gray-600">Min. € 25 m</td>
                        <td className="py-3 text-gray-700 whitespace-nowrap">15 May 2027</td>
                        <td className="py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                            Verified
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <a href="#" onClick={(e) => { e.preventDefault(); alert("Viewing Liability Insurance Certificate PDF"); }} className="text-blue-600 hover:underline font-medium">PDF</a>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50/50">
                        <td className="py-3 font-medium text-gray-900">Us named as additional insured</td>
                        <td className="py-3 text-gray-600">Certificate</td>
                        <td className="py-3 text-gray-700 whitespace-nowrap">15 May 2027</td>
                        <td className="py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                            Verified
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <a href="#" onClick={(e) => { e.preventDefault(); alert("Viewing Additional Insured Certificate PDF"); }} className="text-blue-600 hover:underline font-medium">PDF</a>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50/50">
                        <td className="py-3 font-medium text-gray-900">Safety audit</td>
                        <td className="py-3 text-gray-600">ARGUS Gold</td>
                        <td className="py-3 text-gray-700 whitespace-nowrap">01 Feb 2027</td>
                        <td className="py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                            Verified
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <a href="#" onClick={(e) => { e.preventDefault(); alert("Viewing Safety Audit PDF"); }} className="text-blue-600 hover:underline font-medium">PDF</a>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50/50">
                        <td className="py-3 font-medium text-gray-900">Charter terms signed</td>
                        <td className="py-3 text-gray-600">Framework agreement</td>
                        <td className="py-3 text-gray-400">—</td>
                        <td className="py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                            Verified
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <a href="#" onClick={(e) => { e.preventDefault(); alert("Viewing Signed Framework Agreement PDF"); }} className="text-blue-600 hover:underline font-medium">PDF</a>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50/50">
                        <td className="py-3 font-medium text-gray-900">Aircraft list with registrations</td>
                        <td className="py-3 text-gray-600">4 aircraft</td>
                        <td className="py-3 text-gray-400">—</td>
                        <td className="py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                            Verified
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <a href="#" onClick={(e) => { e.preventDefault(); alert("Viewing Fleet Registry PDF"); }} className="text-blue-600 hover:underline font-medium">PDF</a>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50/50">
                        <td className="py-3 font-medium text-gray-900">Bank details</td>
                        <td className="py-3 text-gray-600">IBAN on file</td>
                        <td className="py-3 text-gray-400">—</td>
                        <td className="py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                            Verified
                          </span>
                        </td>
                        <td className="py-3 text-right text-gray-400">—</td>
                      </tr>
                      <tr className="hover:bg-gray-50/50">
                        <td className="py-3 font-medium text-gray-900">Company registration</td>
                        <td className="py-3 text-gray-600">Registry extract</td>
                        <td className="py-3 text-gray-400">—</td>
                        <td className="py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                            Verified
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <a href="#" onClick={(e) => { e.preventDefault(); alert("Viewing Company Registration PDF"); }} className="text-blue-600 hover:underline font-medium">PDF</a>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-400 leading-relaxed">
                  An operator can only be selected on a trip when every document is verified and nothing has expired. Expiry within 60 days turns amber here and on the Operators list.
                </div>
              </div>
            </div>

            {/* Right Column (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-5">
                {/* BASE */}
                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    BASE
                  </div>
                  <div className="text-xs font-semibold text-gray-900">
                    {activeOperator.baseIcao || "LEPA"} Palma
                  </div>
                </div>

                {/* CONTACTS */}
                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    CONTACTS
                  </div>
                  <div className="space-y-0.5 text-xs text-gray-700">
                    <div>Ops desk {activeOperator.opsPhone || "+34 971 000 000"}</div>
                    <div className="text-gray-600">{activeOperator.opsEmail || "charter@alpine-exec.aero"}</div>
                  </div>
                </div>

                {/* PERFORMANCE */}
                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    PERFORMANCE
                  </div>
                  <div className="space-y-0.5 text-xs text-gray-700">
                    <div>12 offers · 5 flown</div>
                    <div className="text-gray-500">Avg. response 18 min</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: FLEET */}
        {activeTab === "fleet" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Managed Fleet (4 Aircraft)</h2>
            <div className="divide-y divide-gray-100 text-xs">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">Bombardier Challenger 350 · <span className="font-mono text-gray-600">EC-NFA</span></div>
                  <div className="text-gray-500">Super midsize · 9 seats · Enclosed lavatory · High-speed WiFi</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">Available</span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">Cessna Citation CJ3+ · <span className="font-mono text-gray-600">EC-MQL</span></div>
                  <div className="text-gray-500">Light jet · 7 seats · Enclosed lavatory · Based LEPA</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">Available</span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">Embraer Phenom 300E · <span className="font-mono text-gray-600">EC-KLM</span></div>
                  <div className="text-gray-500">Light jet · 8 seats · Enclosed lavatory · Bossa Nova interior</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">Available</span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">Gulfstream G450 · <span className="font-mono text-gray-600">EC-GLF</span></div>
                  <div className="text-gray-500">Heavy jet · 14 seats · Dual lavatories · Forward galley</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">Available</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: OFFERS */}
        {activeTab === "offers" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Sourcing Offers (12 Total)</h2>
            <div className="text-xs text-gray-500 py-3">
              12 charter offers submitted across requests. Average quote turnaround: 18 minutes.
            </div>
          </div>
        )}

        {/* Tab 4: TRIPS FLOWN */}
        {activeTab === "trips_flown" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Charter Flights Completed (5 Flown)</h2>
            <div className="divide-y divide-gray-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-mono font-medium text-gray-900">FE4578-005 · LEIB → LSGG</div>
                  <div className="text-gray-500">20 Nov 2026 · CJ3+ EC-MQL · Value € 8,250.00</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 text-emerald-700 font-medium">Flown</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: CONTACTS */}
        {activeTab === "contacts" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Operations & Charter Sales Contacts</h2>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-semibold text-gray-900">Charter Sales Desk (24/7)</div>
                <div className="text-gray-600">charter@alpine-exec.aero · +34 971 000 001</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-semibold text-gray-900">Flight Dispatch & Handling Coordination</div>
                <div className="text-gray-600">dispatch@alpine-exec.aero · +34 971 000 002</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW: LIST SCREEN (SCREEN 2 STYLE)
  // ==========================================
  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-12">
      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Operators</h1>

      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search input + Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <input
              type="text"
              placeholder="Search operator, AOC, base ICAO..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3.5 py-1.5 text-xs text-gray-900 placeholder-gray-400 w-64 focus:outline-none focus:border-gray-400 shadow-sm transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterPill("all")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                filterPill === "all"
                  ? "bg-[#111827] text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              All {operators.length}
            </button>
            <button
              onClick={() => setFilterPill("approved")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                filterPill === "approved"
                  ? "bg-[#111827] text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilterPill("preferred")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                filterPill === "preferred"
                  ? "bg-[#111827] text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Preferred
            </button>
          </div>
        </div>
      </div>

      {/* Operators Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">OPERATOR</th>
                <th className="py-3 px-4 font-semibold">AOC NUMBER</th>
                <th className="py-3 px-4 font-semibold">BASE</th>
                <th className="py-3 px-4 font-semibold">SAFETY RATING</th>
                <th className="py-3 px-4 font-semibold">COMPLIANCE</th>
                <th className="py-3 px-4 font-semibold">STATUS</th>
                <th className="py-3 px-4 text-right font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOperators.map((op) => (
                <tr
                  key={op.id}
                  onClick={() => handleOpenOperator(op)}
                  className="hover:bg-gray-50/70 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {op.tradingName}
                  </td>
                  <td className="py-3.5 px-4 text-gray-700 font-mono">{op.aocNumber}</td>
                  <td className="py-3.5 px-4 text-gray-600 font-mono">{op.baseIcao}</td>
                  <td className="py-3.5 px-4 text-gray-700">{op.safetyRating || "ARGUS Gold"}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                      9 of 9 verified
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                      Approved
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenOperator(op);
                      }}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
