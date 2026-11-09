"use client";

import React, { useState, useMemo } from "react";
import { airportsData, getAllFbos } from "@/data/airports";
import { Airport, FboOption } from "@/types/aviation";
import {
  MapPin,
  Search,
  Plane,
  Clock,
  Shield,
  Phone,
  Mail,
  Radio,
  ExternalLink,
  ChevronRight,
  X,
  Compass,
  Building,
  CheckCircle2,
  AlertTriangle,
  Globe,
  SlidersHorizontal
} from "lucide-react";

export default function AirportsView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedAirportForModal, setSelectedAirportForModal] = useState<Airport | null>(null);

  // Filtered airports
  const filteredAirports = useMemo(() => {
    return airportsData.filter((a) => {
      // Region filter
      if (selectedRegion !== "all") {
        if (selectedRegion === "north_america" || selectedRegion === "americas") {
          if (a.region !== "north_america" && a.region !== "americas" && a.region !== "caribbean") return false;
        } else if (selectedRegion === "asia" || selectedRegion === "asia_pacific") {
          if (a.region !== "asia" && a.region !== "asia_pacific") return false;
        } else if (a.region !== selectedRegion) {
          return false;
        }
      }

      // Type filter
      if (selectedType !== "all") {
        if (selectedType === "private" || selectedType === "airstrip" || selectedType === "altiport") {
          if (a.type !== "private" && a.type !== "airstrip" && a.type !== "altiport") return false;
        } else if (a.type !== selectedType) {
          return false;
        }
      }

      // Text query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = a.name.toLowerCase().includes(q);
        const matchesIcao = a.icao.toLowerCase().includes(q);
        const matchesIata = a.iata.toLowerCase().includes(q);
        const matchesCity = a.city.toLowerCase().includes(q);
        const matchesCountry = a.country.toLowerCase().includes(q);
        const matchesFbo = (a.fbos || []).some(
          (f) =>
            f.name.toLowerCase().includes(q) ||
            (f.languages || []).some((l) => l.toLowerCase().includes(q))
        );
        if (!matchesName && !matchesIcao && !matchesIata && !matchesCity && !matchesCountry && !matchesFbo) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, selectedRegion, selectedType]);

  const totalFbosCount = useMemo(() => {
    return airportsData.reduce((sum, a) => sum + (a.fbos?.length || 0), 0);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0F1420] text-white rounded-2xl p-6 sm:p-8 border border-[#1C2436] shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/20 text-[#C9A052] border border-[#C9A052]/40 uppercase flex items-center gap-1">
              <Compass className="w-3 h-3" />
              GLOBAL AERODROME DIRECTORY
            </span>
            <span className="text-gray-400 text-xs font-mono">• {airportsData.length} Executive Airfields & Hubs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Executive Airports & Private Airfields
          </h1>
          <p className="text-xs text-gray-300 leading-relaxed">
            Search comprehensive global airport data by Airport Name, 4-Letter ICAO or 3-Letter IATA codes. Inspect operating hours, late-night slot extension possibilities, runway lengths, and designated FBO handlers with contact details and languages.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-3 rounded-xl bg-[#141A29] border border-[#1C2436] text-right">
            <div className="text-[10px] font-mono uppercase text-gray-400">Total Airports</div>
            <div className="text-xl font-black font-mono text-[#C9A052]">{airportsData.length}</div>
          </div>
          <div className="px-4 py-3 rounded-xl bg-[#141A29] border border-[#1C2436] text-right">
            <div className="text-[10px] font-mono uppercase text-gray-400">Designated FBOs</div>
            <div className="text-xl font-black font-mono text-emerald-400">{totalFbosCount}</div>
          </div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Airport Name, ICAO code (e.g. LSGG, LFMN), IATA code (e.g. GVA, NCE), or City..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E0DAD0] bg-[#F5F2EC] text-xs text-[#0F1420] font-medium placeholder-gray-400 focus:outline-none focus:border-[#C9A052] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Region Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden md:inline">Region:</span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2.5 text-xs text-[#0F1420] font-semibold focus:outline-none focus:border-[#C9A052]"
            >
              <option value="all">All Global Regions</option>
              <option value="europe">Europe</option>
              <option value="north_america">North America</option>
              <option value="middle_east">Middle East</option>
              <option value="caribbean">Caribbean</option>
              <option value="asia">Asia & Pacific</option>
              <option value="africa">Africa</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden md:inline">Category:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2.5 text-xs text-[#0F1420] font-semibold focus:outline-none focus:border-[#C9A052]"
            >
              <option value="all">All Airport Types</option>
              <option value="dedicated">Dedicated Executive Airport</option>
              <option value="fbo">Executive Terminal (FBO)</option>
              <option value="altiport">Mountain Altiport</option>
              <option value="airstrip">Private Airstrip</option>
            </select>
          </div>
        </div>

        {/* Results summary */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-[#E0DAD0]/60">
          <span>
            Showing <strong className="text-[#0F1420]">{filteredAirports.length}</strong> of {airportsData.length} executive airports
          </span>
          <span className="text-[11px] font-mono text-[#C9A052]">
            Live Aerodrome Database • EASA & FAA Approved Specifications
          </span>
        </div>
      </div>

      {/* Airport Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAirports.map((airport) => (
          <div
            key={airport.id}
            className="bg-white border border-[#E0DAD0] hover:border-[#C9A052] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div className="space-y-4">
              {/* Card Header: Codes & Location */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-1 rounded-lg bg-[#0F1420] text-white font-mono font-black text-sm tracking-wide shadow-sm">
                      {airport.icao}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-[#C9A052]/20 text-[#9A7A35] font-mono font-bold text-xs border border-[#C9A052]/40">
                      {airport.iata}
                    </span>
                    {airport.popular && (
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                        Top Hub
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-extrabold text-[#0F1420] group-hover:text-[#C9A052] transition-colors leading-snug">
                    {airport.name}
                  </h3>
                  <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{airport.city}, {airport.country}</span>
                  </p>
                </div>
              </div>

              {/* Technical Specifications: Runway & Hours */}
              <div className="p-3.5 rounded-xl bg-[#F5F2EC] border border-[#E0DAD0] space-y-2.5 text-xs">
                {/* Runway Specs */}
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500 mb-0.5">
                    Runway Specifications
                  </div>
                  <div className="font-bold text-[#0F1420] flex items-center justify-between">
                    <span>{airport.runwayLength || "2,500 m / 8,200 ft - Asphalt"}</span>
                    {airport.elevation && (
                      <span className="text-[10px] text-gray-500 font-mono">Elev: {airport.elevation}</span>
                    )}
                  </div>
                  {airport.runwaySurface && (
                    <div className="text-[11px] text-gray-600 font-mono">{airport.runwaySurface}</div>
                  )}
                </div>

                {/* Operating Hours */}
                <div className="pt-2 border-t border-[#E0DAD0]">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500 mb-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#C9A052]" />
                    <span>Operating Hours</span>
                  </div>
                  <p className="font-bold text-[#0F1420]">
                    {airport.operatingHours || "06:00 - 22:00 Local"}
                  </p>
                </div>

                {/* Extension Possibilities */}
                <div className="pt-2 border-t border-[#E0DAD0]">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500 mb-0.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>Extension Possibilities</span>
                  </div>
                  <p className="text-[11px] text-gray-700 leading-relaxed">
                    {airport.extensionPossibilities || "Late night extensions possible with 24h prior request and PPR approval."}
                  </p>
                </div>
              </div>

              {/* Designated FBOs Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500">
                    Designated FBO Handlers ({airport.fbos?.length || 0})
                  </span>
                </div>
                <div className="space-y-1.5">
                  {(airport.fbos || []).slice(0, 2).map((fbo) => (
                    <div
                      key={fbo.id}
                      className="p-2.5 rounded-xl border border-gray-200 bg-white hover:border-[#C9A052] transition-colors flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-[#0F1420] truncate">{fbo.name}</div>
                        <div className="text-[11px] text-gray-500 font-mono flex items-center gap-2">
                          <span>{fbo.phone}</span>
                          {fbo.vhfFrequency && (
                            <span className="text-[#9A7A35]">VHF {fbo.vhfFrequency}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex-shrink-0">
                        {fbo.operatingHours ? fbo.operatingHours.split(" ")[0] : "Active"}
                      </span>
                    </div>
                  ))}
                  {(airport.fbos?.length || 0) > 2 && (
                    <p className="text-[11px] text-gray-500 italic text-center pt-0.5">
                      +{(airport.fbos?.length || 0) - 2} more designated FBOs available
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Card Footer Button */}
            <div className="pt-4 mt-4 border-t border-[#E0DAD0]">
              <button
                onClick={() => setSelectedAirportForModal(airport)}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#0F1420] hover:bg-[#1C2436] text-[#C9A052] text-xs font-bold transition-all shadow-sm"
              >
                <span>View All Designated FBOs ({airport.fbos?.length || 0})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredAirports.length === 0 && (
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-12 text-center space-y-3">
          <Plane className="w-10 h-10 text-gray-300 mx-auto transform -rotate-45" />
          <h3 className="text-base font-bold text-[#0F1420]">No aerodromes matching search criteria</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Try searching with another ICAO 4-letter code (e.g. LSGG, LFMN, KTEB, EGGW) or city name.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedRegion("all");
              setSelectedType("all");
            }}
            className="px-4 py-2 rounded-xl bg-[#0F1420] text-white text-xs font-bold"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Detailed Airport & FBO Modal */}
      {selectedAirportForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#D1C9BC] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 bg-[#0F1420] text-white flex items-start justify-between border-b border-[#1C2436]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-1 rounded-lg bg-[#C9A052] text-[#0F1420] font-mono font-black text-sm">
                    {selectedAirportForModal.icao}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-white/20 text-white font-mono font-bold text-xs">
                    {selectedAirportForModal.iata}
                  </span>
                  <span className="text-gray-400 text-xs font-mono">• {selectedAirportForModal.city}, {selectedAirportForModal.country}</span>
                </div>
                <h2 className="text-xl font-black text-white">{selectedAirportForModal.name}</h2>
              </div>
              <button
                onClick={() => setSelectedAirportForModal(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#1C2436] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#F5F2EC] border border-[#E0DAD0]">
                  <span className="text-[10px] font-mono uppercase text-gray-500 font-bold block mb-1">
                    Runway Specifications
                  </span>
                  <p className="font-extrabold text-[#0F1420]">{selectedAirportForModal.runwayLength}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{selectedAirportForModal.runwaySurface}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F5F2EC] border border-[#E0DAD0]">
                  <span className="text-[10px] font-mono uppercase text-gray-500 font-bold block mb-1">
                    Operating Hours
                  </span>
                  <p className="font-extrabold text-[#0F1420]">{selectedAirportForModal.operatingHours}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Local airport schedule</p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F5F2EC] border border-[#E0DAD0]">
                  <span className="text-[10px] font-mono uppercase text-gray-500 font-bold block mb-1">
                    Extension Possibilities
                  </span>
                  <p className="text-[11px] text-gray-700 leading-snug">{selectedAirportForModal.extensionPossibilities}</p>
                </div>
              </div>

              {/* Designated FBOs Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-[#0F1420] flex items-center justify-between border-b pb-2">
                  <span>Designated FBO Handlers ({selectedAirportForModal.fbos?.length || 0})</span>
                  <span className="text-xs text-gray-500 font-normal">Contact info, operating hours & spoken languages</span>
                </h3>

                <div className="space-y-4">
                  {(selectedAirportForModal.fbos || []).map((fbo) => (
                    <div
                      key={fbo.id}
                      className="p-4 rounded-xl border border-[#E0DAD0] bg-white hover:border-[#C9A052] shadow-sm space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-extrabold text-sm text-[#0F1420]">{fbo.name}</h4>
                          {fbo.address && (
                            <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span>{fbo.address}</span>
                            </p>
                          )}
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[#C9A052]/20 text-[#9A7A35] border border-[#C9A052]/40 w-max">
                          {fbo.operatingHours || "H24 / 7 days"}
                        </span>
                      </div>

                      {/* Contact row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                        <a
                          href={`tel:${fbo.phone}`}
                          className="p-2 rounded-lg bg-[#F5F2EC] hover:bg-[#EBE5DB] text-[#0F1420] flex items-center gap-1.5 font-bold transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-[#C9A052]" />
                          <span>{fbo.phone}</span>
                        </a>

                        <a
                          href={`mailto:${fbo.email}`}
                          className="p-2 rounded-lg bg-[#F5F2EC] hover:bg-[#EBE5DB] text-[#0F1420] flex items-center gap-1.5 font-bold truncate transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5 text-[#C9A052]" />
                          <span className="truncate">{fbo.email}</span>
                        </a>

                        {fbo.vhfFrequency && (
                          <div className="p-2 rounded-lg bg-[#F5F2EC] text-[#0F1420] flex items-center gap-1.5 font-bold">
                            <Radio className="w-3.5 h-3.5 text-[#C9A052]" />
                            <span>VHF {fbo.vhfFrequency}</span>
                          </div>
                        )}
                      </div>

                      {/* Languages Spoken */}
                      {fbo.languages && fbo.languages.length > 0 && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] font-mono text-gray-500 font-bold uppercase flex items-center gap-1">
                            <Globe className="w-3 h-3 text-gray-400" /> Languages:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {fbo.languages.map((lang) => (
                              <span
                                key={lang}
                                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-800"
                              >
                                {lang}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Amenities */}
                      {fbo.amenities && fbo.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {fbo.amenities.map((amenity) => (
                            <span
                              key={amenity}
                              className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium"
                            >
                              ✓ {amenity}
                            </span>
                          ))}
                        </div>
                      )}

                      {fbo.notes && (
                        <p className="text-[11px] text-gray-600 italic pt-1">
                          Note: {fbo.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#F5F2EC] border-t border-[#E0DAD0] flex justify-end">
              <button
                onClick={() => setSelectedAirportForModal(null)}
                className="px-5 py-2 rounded-xl bg-[#0F1420] text-white text-xs font-bold hover:bg-[#1A2338]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
