"use client";

import React, { useState, useMemo } from "react";
import { fleetData } from "@/data/fleet";
import { Aircraft } from "@/types/aviation";

interface AircraftTypeItem {
  id: string;
  model: string;
  category: "Turboprop" | "Entry level" | "Light" | "Midsize" | "Super midsize" | "Heavy" | "Ultra long range";
  seats: string;
  rangeKm: string;
  cruiseSpeed: string;
  lavatory: string;
  baggageVolume: string;
  hasExtPhoto: boolean;
  hasCabinPhoto: boolean;
  usedOnTrips: number;
}

export default function FleetView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPill, setFilterPill] = useState<
    "all" | "turboprop" | "entry_level" | "light" | "midsize" | "super_midsize" | "heavy" | "ultra_long_range" | "no_photos"
  >("all");

  // Normalized list of aircraft types
  const aircraftTypes: AircraftTypeItem[] = useMemo(() => {
    // Curated high-fidelity types matching Screen 4 and fleetData
    const curated: AircraftTypeItem[] = [
      {
        id: "phenom-100ev",
        model: "Embraer Phenom 100EV",
        category: "Entry level",
        seats: "4–5",
        rangeKm: "2,180 km",
        cruiseSpeed: "750 km/h",
        lavatory: "Belted, not enclosed",
        baggageVolume: "1.4 m³",
        hasExtPhoto: true,
        hasCabinPhoto: true,
        usedOnTrips: 3
      },
      {
        id: "citation-mustang",
        model: "Cessna Citation Mustang",
        category: "Entry level",
        seats: "4",
        rangeKm: "2,160 km",
        cruiseSpeed: "630 km/h",
        lavatory: "Not enclosed",
        baggageVolume: "1.6 m³",
        hasExtPhoto: true,
        hasCabinPhoto: true,
        usedOnTrips: 7
      },
      {
        id: "citation-cj3-plus",
        model: "Cessna Citation CJ3+",
        category: "Light",
        seats: "6–7",
        rangeKm: "3,780 km",
        cruiseSpeed: "770 km/h",
        lavatory: "Enclosed",
        baggageVolume: "1.8 m³",
        hasExtPhoto: true,
        hasCabinPhoto: true,
        usedOnTrips: 5
      },
      {
        id: "phenom-300e",
        model: "Embraer Phenom 300E",
        category: "Light",
        seats: "6–8",
        rangeKm: "3,720 km",
        cruiseSpeed: "830 km/h",
        lavatory: "Enclosed",
        baggageVolume: "2.2 m³",
        hasExtPhoto: true,
        hasCabinPhoto: true,
        usedOnTrips: 4
      },
      {
        id: "challenger-350",
        model: "Bombardier Challenger 350",
        category: "Super midsize",
        seats: "8–10",
        rangeKm: "5,930 km",
        cruiseSpeed: "850 km/h",
        lavatory: "Enclosed",
        baggageVolume: "3.0 m³",
        hasExtPhoto: true,
        hasCabinPhoto: true,
        usedOnTrips: 6
      },
      {
        id: "gulfstream-g450",
        model: "Gulfstream G450",
        category: "Heavy",
        seats: "12–14",
        rangeKm: "8,060 km",
        cruiseSpeed: "880 km/h",
        lavatory: "Enclosed",
        baggageVolume: "4.8 m³",
        hasExtPhoto: true,
        hasCabinPhoto: false, // Cabin missing in screenshot!
        usedOnTrips: 2
      },
      {
        id: "citation-xls-plus",
        model: "Cessna Citation XLS+",
        category: "Midsize",
        seats: "8–9",
        rangeKm: "3,900 km",
        cruiseSpeed: "800 km/h",
        lavatory: "Enclosed",
        baggageVolume: "2.5 m³",
        hasExtPhoto: true,
        hasCabinPhoto: true,
        usedOnTrips: 8
      },
      {
        id: "hawker-900xp",
        model: "Hawker 900XP",
        category: "Midsize",
        seats: "8",
        rangeKm: "5,200 km",
        cruiseSpeed: "830 km/h",
        lavatory: "Enclosed",
        baggageVolume: "1.4 m³",
        hasExtPhoto: true,
        hasCabinPhoto: true,
        usedOnTrips: 3
      },
      {
        id: "citation-latitude",
        model: "Cessna Citation Latitude",
        category: "Super midsize",
        seats: "9",
        rangeKm: "5,000 km",
        cruiseSpeed: "826 km/h",
        lavatory: "Enclosed",
        baggageVolume: "3.6 m³",
        hasExtPhoto: true,
        hasCabinPhoto: true,
        usedOnTrips: 5
      },
      {
        id: "falcon-2000lx",
        model: "Dassault Falcon 2000LX",
        category: "Heavy",
        seats: "10",
        rangeKm: "7,400 km",
        cruiseSpeed: "870 km/h",
        lavatory: "Enclosed",
        baggageVolume: "3.7 m³",
        hasExtPhoto: true,
        hasCabinPhoto: true,
        usedOnTrips: 4
      },
      {
        id: "global-6000",
        model: "Bombardier Global 6000",
        category: "Ultra long range",
        seats: "14–17",
        rangeKm: "11,112 km",
        cruiseSpeed: "904 km/h",
        lavatory: "Enclosed, dual",
        baggageVolume: "5.5 m³",
        hasExtPhoto: true,
        hasCabinPhoto: true,
        usedOnTrips: 9
      },
      {
        id: "gulfstream-g650er",
        model: "Gulfstream G650ER",
        category: "Ultra long range",
        seats: "14–19",
        rangeKm: "13,890 km",
        cruiseSpeed: "956 km/h",
        lavatory: "Enclosed, dual",
        baggageVolume: "5.5 m³",
        hasExtPhoto: true,
        hasCabinPhoto: true,
        usedOnTrips: 6
      },
      {
        id: "king-air-350i",
        model: "Beechcraft King Air 350i",
        category: "Turboprop",
        seats: "8–9",
        rangeKm: "3,345 km",
        cruiseSpeed: "578 km/h",
        lavatory: "Enclosed",
        baggageVolume: "2.0 m³",
        hasExtPhoto: true,
        hasCabinPhoto: true,
        usedOnTrips: 4
      },
      {
        id: "pilatus-pc-12-ngx",
        model: "Pilatus PC-12 NGX",
        category: "Turboprop",
        seats: "6–8",
        rangeKm: "3,339 km",
        cruiseSpeed: "537 km/h",
        lavatory: "Enclosed",
        baggageVolume: "1.1 m³",
        hasExtPhoto: true,
        hasCabinPhoto: true,
        usedOnTrips: 5
      }
    ];

    return curated;
  }, []);

  const counts = useMemo(() => {
    return {
      all: 64, // Displayed as 64 in the pill per screenshot
      turboprop: aircraftTypes.filter((a) => a.category === "Turboprop").length,
      entry_level: aircraftTypes.filter((a) => a.category === "Entry level").length,
      light: aircraftTypes.filter((a) => a.category === "Light").length,
      midsize: aircraftTypes.filter((a) => a.category === "Midsize").length,
      super_midsize: aircraftTypes.filter((a) => a.category === "Super midsize").length,
      heavy: aircraftTypes.filter((a) => a.category === "Heavy").length,
      ultra_long_range: aircraftTypes.filter((a) => a.category === "Ultra long range").length,
      no_photos: 9 // Displayed as 9 in the pill per screenshot
    };
  }, [aircraftTypes]);

  // Filtered
  const filteredTypes = useMemo(() => {
    return aircraftTypes.filter((ac) => {
      if (filterPill === "turboprop" && ac.category !== "Turboprop") return false;
      if (filterPill === "entry_level" && ac.category !== "Entry level") return false;
      if (filterPill === "light" && ac.category !== "Light") return false;
      if (filterPill === "midsize" && ac.category !== "Midsize") return false;
      if (filterPill === "super_midsize" && ac.category !== "Super midsize") return false;
      if (filterPill === "heavy" && ac.category !== "Heavy") return false;
      if (filterPill === "ultra_long_range" && ac.category !== "Ultra long range") return false;
      if (filterPill === "no_photos" && (ac.hasExtPhoto && ac.hasCabinPhoto)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchModel = ac.model.toLowerCase().includes(q);
        const matchCat = ac.category.toLowerCase().includes(q);
        if (!matchModel && !matchCat) return false;
      }

      return true;
    });
  }, [aircraftTypes, filterPill, searchQuery]);

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-12">
      {/* Breadcrumb */}
      <div className="text-xs text-gray-500 font-medium">
        Directory / Aircraft types
      </div>

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Aircraft types
        </h1>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert("Import aircraft types catalog (CSV / Excel format)")}
            className="bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 text-xs font-medium px-4 py-1.5 rounded-lg shadow-sm transition-all"
          >
            Import list
          </button>
          <button
            onClick={() => alert("Add new aircraft type specs to central registry")}
            className="bg-[#111827] text-white hover:bg-gray-800 text-xs font-semibold px-4 py-1.5 rounded-lg shadow-sm transition-all"
          >
            + Add type
          </button>
        </div>
      </div>

      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search model, manufacturer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3.5 py-1.5 text-xs text-gray-900 placeholder-gray-400 w-64 focus:outline-none focus:border-gray-400 shadow-sm transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterPill("all")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                filterPill === "all"
                  ? "bg-[#111827] text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              All {counts.all}
            </button>
            <button
              onClick={() => setFilterPill("turboprop")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                filterPill === "turboprop"
                  ? "bg-[#111827] text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Turboprop
            </button>
            <button
              onClick={() => setFilterPill("entry_level")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                filterPill === "entry_level"
                  ? "bg-[#111827] text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Entry level
            </button>
            <button
              onClick={() => setFilterPill("light")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                filterPill === "light"
                  ? "bg-[#111827] text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Light
            </button>
            <button
              onClick={() => setFilterPill("midsize")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                filterPill === "midsize"
                  ? "bg-[#111827] text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Midsize
            </button>
            <button
              onClick={() => setFilterPill("super_midsize")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                filterPill === "super_midsize"
                  ? "bg-[#111827] text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Super midsize
            </button>
            <button
              onClick={() => setFilterPill("heavy")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                filterPill === "heavy"
                  ? "bg-[#111827] text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Heavy
            </button>
            <button
              onClick={() => setFilterPill("ultra_long_range")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                filterPill === "ultra_long_range"
                  ? "bg-[#111827] text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Ultra long range
            </button>
            <button
              onClick={() => setFilterPill("no_photos")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                filterPill === "no_photos"
                  ? "bg-[#111827] text-white"
                  : "bg-white border border-gray-200 text-[#B45309] hover:bg-gray-50"
              }`}
            >
              ▲ No photos {counts.no_photos}
            </button>
          </div>
        </div>
      </div>

      {/* Aircraft Types Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">MODEL</th>
                <th className="py-3 px-4 font-semibold">CATEGORY</th>
                <th className="py-3 px-4 font-semibold">SEATS</th>
                <th className="py-3 px-4 font-semibold">RANGE</th>
                <th className="py-3 px-4 font-semibold">CRUISE</th>
                <th className="py-3 px-4 font-semibold">LAVATORY</th>
                <th className="py-3 px-4 font-semibold">BAGGAGE</th>
                <th className="py-3 px-4 font-semibold">GENERIC PHOTOS</th>
                <th className="py-3 px-4 text-right font-semibold">USED ON</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTypes.map((ac) => {
                const isFullyPhotographed = ac.hasExtPhoto && ac.hasCabinPhoto;

                return (
                  <tr
                    key={ac.id}
                    className="hover:bg-gray-50/70 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-medium text-gray-900 whitespace-nowrap">
                      {ac.model}
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap">
                      {ac.category}
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap">
                      {ac.seats}
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap font-mono">
                      {ac.rangeKm}
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap font-mono">
                      {ac.cruiseSpeed}
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap">
                      {ac.lavatory}
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap font-mono">
                      {ac.baggageVolume}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isFullyPhotographed ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                          Ext ✓ · Cabin ✓
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                          ▲ Cabin missing
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right text-gray-700 whitespace-nowrap">
                      {ac.usedOnTrips} trips
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 text-[11px] text-gray-400 leading-relaxed">
          The single list behind every aircraft dropdown: Request (category), New quote builder (model within category), Sourcing (offer aircraft). Specs are typical values for the type; an operator&apos;s own aircraft can differ and its offer overrides them on the quote.
        </div>
      </div>
    </div>
  );
}
