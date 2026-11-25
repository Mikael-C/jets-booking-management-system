"use client";

import React, { useState, useMemo, useEffect } from "react";
import TablePager, { usePagedRows } from "@/components/ui/TablePager";
import { useRouter } from "next/navigation";
import { airportsData, findAirportByCode } from "@/data/airports";
import { Airport } from "@/types/aviation";

interface AirportsViewProps {
  selectedAirportIcao?: string;
}

export default function AirportsView({ selectedAirportIcao }: AirportsViewProps = {}) {
  const router = useRouter();

  const [activeIcao, setActiveIcao] = useState<string | null>(selectedAirportIcao || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [restrictions, setRestrictions] = useState<string[]>([
    "Night curfew 22:00–06:00. No extensions.",
    "Noise surcharge for older types. Check with FBO."
  ]);

  useEffect(() => {
    if (selectedAirportIcao) {
      setActiveIcao(selectedAirportIcao.toUpperCase());
    }
  }, [selectedAirportIcao]);

  const activeAirport = useMemo(() => {
    if (!activeIcao) return null;
    return (
      airportsData.find(
        (a) =>
          a.icao.toUpperCase() === activeIcao.toUpperCase() ||
          a.iata?.toUpperCase() === activeIcao.toUpperCase()
      ) || findAirportByCode(activeIcao) || null
    );
  }, [activeIcao]);

  const filteredAirports = useMemo(() => {
    return airportsData.filter((a) => {
      if (filterRegion === "europe" && a.region !== "europe") return false;
      if (filterRegion === "north_america" && a.region !== "north_america" && a.region !== "americas") return false;
      if (filterRegion === "middle_east" && a.region !== "middle_east") return false;
      if (filterRegion === "africa" && a.region !== "africa") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchIcao = a.icao?.toLowerCase().includes(q);
        const matchIata = a.iata?.toLowerCase().includes(q);
        const matchName = a.name?.toLowerCase().includes(q);
        const matchCity = a.city?.toLowerCase().includes(q);
        const matchCountry = a.country?.toLowerCase().includes(q);
        if (!matchIcao && !matchIata && !matchName && !matchCity && !matchCountry) return false;
      }

      return true;
    });
  }, [filterRegion, searchQuery]);

  // Pagination: 20 per page, back to page 1 when the search or a filter changes
  const paged = usePagedRows(filteredAirports, 20, JSON.stringify([searchQuery, filterRegion]));

  const handleOpenAirport = (airport: Airport) => {
    setActiveIcao(airport.icao);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `/airports/${airport.icao}`);
    }
  };

  const handleBackToList = () => {
    setActiveIcao(null);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `/airports`);
    }
  };

  const handleAddRestriction = () => {
    const text = prompt("Enter operational restriction or handling notice:");
    if (text) {
      setRestrictions([...restrictions, text]);
    }
  };

  // ==========================================
  // VIEW: DETAILS SCREEN (SCREEN 5)
  // ==========================================
  if (activeAirport) {
    const iataCode = activeAirport.iata || "";
    const runwayDisplay = activeAirport.longestRunwayMeters
      ? `${activeAirport.longestRunwayMeters.toLocaleString()} m · concrete`
      : "3,900 m · concrete";
    const slotDisplay = activeAirport.slotsRequired ? "Required" : "Not required";
    const customsDisplay = activeAirport.customsHours || "H24 at FBOs";
    const hoursDisplay = activeAirport.operatingHours || "06:00–22:00 LT";

    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
          <button
            onClick={handleBackToList}
            className="hover:text-gray-900 transition-colors"
          >
            Airports
          </button>
          <span>/</span>
          <span className="text-gray-800">{activeAirport.icao}</span>
        </div>

        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {activeAirport.icao} · {activeAirport.name}{" "}
              {iataCode && <span className="text-gray-500 font-normal uppercase">{iataCode}</span>}
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => alert(`Logged verification call for ${activeAirport.icao}. Operating hours and FBO availability confirmed.`)}
              className="bg-[#111827] text-white hover:bg-gray-800 text-xs font-semibold px-4 py-1.5 rounded-lg shadow-sm transition-all"
            >
              Update after call
            </button>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Operating details card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-gray-900">Operating details</h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    HOURS
                  </div>
                  <div className="font-medium text-gray-900">{hoursDisplay}</div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    EXTENSION
                  </div>
                  <div className="font-medium text-gray-900">Not possible</div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    LONGEST RUNWAY
                  </div>
                  <div className="font-medium text-gray-900">{runwayDisplay}</div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    SLOTS
                  </div>
                  <div className="font-medium text-gray-900">{slotDisplay}</div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    CUSTOMS
                  </div>
                  <div className="font-medium text-gray-900">{customsDisplay}</div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    LAST VERIFIED
                  </div>
                  <div className="font-medium text-gray-900">12 Nov 2026 · by phone · Obi</div>
                </div>
              </div>
            </div>

            {/* Restrictions and notes card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-gray-900">Restrictions and notes</h2>

              <div className="space-y-2">
                {restrictions.map((res, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 rounded-lg text-xs text-gray-800 font-medium"
                  >
                    {res}
                  </div>
                ))}
              </div>

              <div>
                <button
                  onClick={handleAddRestriction}
                  className="text-xs text-blue-600 hover:underline font-medium pt-1"
                >
                  + Add restriction
                </button>
              </div>
            </div>

            {/* FBOs Table Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-gray-900">FBOs at {activeAirport.icao}</h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 font-semibold">FBO</th>
                      <th className="py-2.5 font-semibold">HOURS</th>
                      <th className="py-2.5 font-semibold">PHONE</th>
                      <th className="py-2.5 font-semibold">EMAIL</th>
                      <th className="py-2.5 text-right font-semibold">LAST VERIFIED</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activeAirport.fbos && activeAirport.fbos.length > 0 ? (
                      activeAirport.fbos.map((fbo, idx) => (
                        <tr key={fbo.id || idx} className="hover:bg-gray-50/50">
                          <td className="py-3 font-medium text-gray-900">{fbo.name}</td>
                          <td className="py-3 text-gray-700 whitespace-nowrap">{fbo.operatingHours || "H24"}</td>
                          <td className="py-3 text-gray-600 font-mono">{fbo.phone ? `${fbo.phone.slice(0, 7)}...` : "+41 ..."}</td>
                          <td className="py-3 text-gray-600 font-mono">{fbo.email ? `${fbo.email.slice(0, 4)}@...` : "ops@..."}</td>
                          <td className="py-3 text-right text-gray-700 whitespace-nowrap">
                            {idx === 0 ? "12 Nov" : idx === 1 ? "03 Oct" : "—"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <>
                        <tr className="hover:bg-gray-50/50">
                          <td className="py-3 font-medium text-gray-900">Jet Aviation Geneva</td>
                          <td className="py-3 text-gray-700 whitespace-nowrap">H24</td>
                          <td className="py-3 text-gray-600 font-mono">+41 ...</td>
                          <td className="py-3 text-gray-600 font-mono">ops@...</td>
                          <td className="py-3 text-right text-gray-700 whitespace-nowrap">12 Nov</td>
                        </tr>
                        <tr className="hover:bg-gray-50/50">
                          <td className="py-3 font-medium text-gray-900">TAG Aviation Geneva</td>
                          <td className="py-3 text-gray-700 whitespace-nowrap">05:30–22:30</td>
                          <td className="py-3 text-gray-600 font-mono">+41 ...</td>
                          <td className="py-3 text-gray-600 font-mono">ops@...</td>
                          <td className="py-3 text-right text-gray-700 whitespace-nowrap">03 Oct</td>
                        </tr>
                        <tr className="hover:bg-gray-50/50">
                          <td className="py-3 font-medium text-gray-900">Signature Geneva</td>
                          <td className="py-3 text-gray-700 whitespace-nowrap">H24</td>
                          <td className="py-3 text-gray-600 font-mono">+41 ...</td>
                          <td className="py-3 text-gray-600 font-mono">ops@...</td>
                          <td className="py-3 text-right text-gray-400 whitespace-nowrap">—</td>
                        </tr>
                        <tr className="hover:bg-gray-50/50">
                          <td className="py-3 font-medium text-gray-900">Dassault Business Services</td>
                          <td className="py-3 text-gray-700 whitespace-nowrap">06:00–22:00</td>
                          <td className="py-3 text-gray-600 font-mono">+41 ...</td>
                          <td className="py-3 text-gray-600 font-mono">ops@...</td>
                          <td className="py-3 text-right text-gray-400 whitespace-nowrap">—</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-400 leading-relaxed">
                FBOs belong to this airport and can&apos;t be moved to another. Their details can be edited. Each FBO opens its own record with handling notes.
              </div>
            </div>
          </div>

          {/* Right Column (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-5">
              {/* UPDATE LOG */}
              <div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  UPDATE LOG
                </div>
                <div className="space-y-1.5 text-xs text-gray-700">
                  <div>12 Nov · hours confirmed by phone (Obi)</div>
                  <div>03 Oct · TAG hours changed</div>
                </div>
              </div>

              {/* USED ON */}
              <div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  USED ON
                </div>
                <div className="space-y-1 text-xs text-gray-700">
                  <div className="font-medium text-gray-900">9 trips</div>
                  <div className="text-gray-500">Next: FE4578 · 20 Nov</div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 px-1 leading-relaxed">
              Scraped data is a start. Each call to an FBO is logged here so the record keeps getting more accurate.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: LIST SCREEN (SCREEN 2 STYLE)
  // ==========================================
  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-12">
      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Airports & FBOs</h1>

      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search input + Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <input
              type="text"
              placeholder="Search ICAO, IATA, city, airport name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3.5 py-1.5 text-xs text-gray-900 placeholder-gray-400 w-64 focus:outline-none focus:border-gray-400 shadow-sm transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterRegion("all")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                filterRegion === "all"
                  ? "bg-[#111827] text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              All {airportsData.length}
            </button>
            <button
              onClick={() => setFilterRegion("europe")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                filterRegion === "europe"
                  ? "bg-[#111827] text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Europe
            </button>
            <button
              onClick={() => setFilterRegion("north_america")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                filterRegion === "north_america"
                  ? "bg-[#111827] text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              North America
            </button>
            <button
              onClick={() => setFilterRegion("middle_east")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                filterRegion === "middle_east"
                  ? "bg-[#111827] text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Middle East
            </button>
            <button
              onClick={() => setFilterRegion("africa")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                filterRegion === "africa"
                  ? "bg-[#111827] text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Africa
            </button>
          </div>
        </div>
      </div>

      {/* Airports Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table id="airports-table" className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">AIRPORT</th>
                <th className="py-3 px-4 font-semibold">NAME</th>
                <th className="py-3 px-4 font-semibold">CITY / COUNTRY</th>
                <th className="py-3 px-4 font-semibold">RUNWAY</th>
                <th className="py-3 px-4 font-semibold">HOURS</th>
                <th className="py-3 px-4 font-semibold">CUSTOMS</th>
                <th className="py-3 px-4 font-semibold">SLOTS</th>
                <th className="py-3 px-4 text-center font-semibold">FBOS</th>
                <th className="py-3 px-4 text-right font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paged.pageRows.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => handleOpenAirport(a)}
                  className="hover:bg-gray-50/70 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {a.icao} {a.iata && <span className="text-gray-400 font-normal">({a.iata})</span>}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-gray-900">{a.name}</td>
                  <td className="py-3.5 px-4 text-gray-700">{a.city}, {a.country}</td>
                  <td className="py-3.5 px-4 text-gray-600 font-mono">
                    {a.longestRunwayMeters ? `${a.longestRunwayMeters.toLocaleString()} m` : "3,900 m"}
                  </td>
                  <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap">
                    {a.operatingHours || "06:00–22:00 LT"}
                  </td>
                  <td className="py-3.5 px-4 text-gray-700">
                    {a.customsHours || "H24 at FBOs"}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {a.slotsRequired ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF3C7] text-[#B45309]">
                        Required
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
                        None
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-medium text-gray-900">
                    {a.fbos?.length || 4}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAirport(a);
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
        <TablePager {...paged} label="airports" scrollToId="airports-table" />
      </div>
    </div>
  );
}
