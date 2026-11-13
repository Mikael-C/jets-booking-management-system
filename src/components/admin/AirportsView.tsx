"use client";

import React, { useState, useMemo, useDeferredValue } from "react";
import { useAirportDirectory } from "@/lib/airportDirectory";
import { rankAirports } from "@/lib/airportSearch";
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
  SlidersHorizontal,
  Plus,
  Edit2,
  Trash2
} from "lucide-react";

export default function AirportsView() {
  const [airportsData, saveAirportDirectory, directoryLoaded] = useAirportDirectory();
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const isSearchPending = searchQuery !== deferredSearchQuery;
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAirportForModal, setSelectedAirportForModal] = useState<Airport | null>(null);
  const [editingFboId, setEditingFboId] = useState<string | null>(null);
  const [fboDraft, setFboDraft] = useState<Partial<FboOption>>({});
  const pageSize = 50;

  // Filtered airports
  const filteredAirports = useMemo(() => {
    const airportsMatchingFilters = airportsData.filter((a) => {
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

      return true;
    });
    return rankAirports(airportsMatchingFilters, deferredSearchQuery, true);
  }, [airportsData, deferredSearchQuery, selectedRegion, selectedType]);
  const pageCount = Math.max(1, Math.ceil(filteredAirports.length / pageSize));
  const visibleAirports = isSearchPending
    ? []
    : filteredAirports.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalFbosCount = useMemo(() => {
    return airportsData.reduce((sum, a) => sum + (a.fbos?.length || 0), 0);
  }, [airportsData]);

  const saveFbo = () => {
    if (!selectedAirportForModal || !fboDraft.name?.trim() || !fboDraft.phone?.trim() || !fboDraft.email?.trim()) return;
    const airport = airportsData.find((item) => item.id === selectedAirportForModal.id) || selectedAirportForModal;
    const id = editingFboId === "new" ? `fbo-${airport.icao.toLowerCase()}-${Date.now()}` : editingFboId!;
    const fbo: FboOption = {
      id,
      name: fboDraft.name.trim(),
      phone: fboDraft.phone.trim(),
      email: fboDraft.email.trim(),
      airportIcao: airport.icao,
      airportName: airport.name,
      vhfFrequency: fboDraft.vhfFrequency?.trim(),
      address: fboDraft.address?.trim(),
      operatingHours: fboDraft.operatingHours?.trim(),
      languages: fboDraft.languages,
      amenities: fboDraft.amenities,
      notes: fboDraft.notes?.trim()
    };
    const next = airportsData.map((item) => item.id !== airport.id ? item : {
      ...item,
      fbos: editingFboId === "new"
        ? [...(item.fbos || []), fbo]
        : (item.fbos || []).map((existing) => existing.id === id ? fbo : existing)
    });
    saveAirportDirectory(next);
    setSelectedAirportForModal(next.find((item) => item.id === airport.id) || null);
    setEditingFboId(null);
    setFboDraft({});
  };

  const removeFbo = (fboId: string) => {
    if (!selectedAirportForModal) return;
    const airport = airportsData.find((item) => item.id === selectedAirportForModal.id) || selectedAirportForModal;
    const next = airportsData.map((item) => item.id === airport.id
      ? { ...item, fbos: (item.fbos || []).filter((fbo) => fbo.id !== fboId) }
      : item
    );
    saveAirportDirectory(next);
    setSelectedAirportForModal(next.find((item) => item.id === airport.id) || null);
    setEditingFboId(null);
  };

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
            <span className="text-gray-400 text-xs font-mono">• {airportsData.length} aerodromes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Executive Airports & Private Airfields
          </h1>
          <p className="text-xs text-gray-300 leading-relaxed">
            Search global airport and airfield records by name, airport code, IATA code, city, or country. Runway, operating-hour, and handling details are shown only when available in the directory.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-3 rounded-xl bg-[#141A29] border border-[#1C2436] text-right">
            <div className="text-[10px] font-mono uppercase text-gray-400">Total Aerodromes</div>
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Airport Name, ICAO code (e.g. LSGG, LFMN), IATA code (e.g. GVA, NCE), or City..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E0DAD0] bg-[#F5F2EC] text-xs text-[#0F1420] font-medium placeholder-gray-400 focus:outline-none focus:border-[#C9A052] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
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
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                setCurrentPage(1);
              }}
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
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2.5 text-xs text-[#0F1420] font-semibold focus:outline-none focus:border-[#C9A052]"
            >
              <option value="all">All Airport Types</option>
              <option value="airport">Large / Medium Airport</option>
              <option value="airstrip">Small Airport / Airstrip</option>
              <option value="heliport">Heliport</option>
              <option value="seaplane_base">Seaplane Base</option>
              <option value="balloonport">Balloonport</option>
              <option value="dedicated">Dedicated Executive Airport</option>
              <option value="fbo">Executive Terminal (FBO)</option>
              <option value="altiport">Mountain Altiport</option>
            </select>
          </div>
        </div>

        {/* Results summary */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-[#E0DAD0]/60">
          {isSearchPending ? (
            <span>Searching airports…</span>
          ) : (
            <span>
              Showing <strong className="text-[#0F1420]">{filteredAirports.length}</strong> of {airportsData.length} aerodromes
            </span>
          )}
        </div>
      </div>

      {/* Airport Directory List */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F2EC] text-[#0F1420]/70 font-mono text-[10px] uppercase tracking-wider border-b border-[#E0DAD0]">
              <tr>
                <th className="px-4 py-3">Airport</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Runway / Hours</th>
                <th className="px-4 py-3">FBO Facilities</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0DAD0]">
        {isSearchPending ? (
          <tr>
            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
              Searching airports…
            </td>
          </tr>
        ) : (
        visibleAirports.map((airport) => (
          <tr
            key={airport.id}
            onClick={() => directoryLoaded && setSelectedAirportForModal(airport)}
            className={`${directoryLoaded ? "cursor-pointer hover:bg-[#FAF8F5]" : "opacity-60"} transition-colors`}
          >
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-[#0F1420] text-white font-mono font-black text-sm tracking-wide shadow-sm">
                      {airport.icao}
                    </span>
                    {airport.iata && (
                      <span className="px-2 py-0.5 rounded-lg bg-[#C9A052]/20 text-[#9A7A35] font-mono font-bold text-xs border border-[#C9A052]/40">
                        {airport.iata}
                      </span>
                    )}
                    {airport.popular && (
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                        Top Hub
                      </span>
                    )}
              </div>
              <p className="mt-1 font-bold text-[#0F1420]">{airport.name}</p>
            </td>
            <td className="px-4 py-3 text-gray-600">
              <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#C9A052]" />{airport.city}, {airport.country}</div>
              <div className="mt-1 text-[10px] font-mono text-gray-400">{airport.region || "Global"}</div>
            </td>
            <td className="px-4 py-3">
              <div className="font-semibold text-[#0F1420]">{airport.runwayLength || "Runway details unavailable"}</div>
              <div className="mt-1 text-gray-500">{airport.operatingHours || "Operating hours unavailable"}</div>
            </td>
            <td className="px-4 py-3">
              <span className="font-bold text-[#0F1420]">{airport.fbos?.length || 0} FBO{airport.fbos?.length === 1 ? "" : "s"}</span>
              <div className="mt-1 max-w-xs truncate text-gray-500">{(airport.fbos || []).map((fbo) => fbo.name).join(", ") || "No linked FBOs"}</div>
            </td>
            <td className="px-4 py-3 text-right">
              <button
                type="button"
                disabled={!directoryLoaded}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedAirportForModal(airport);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0F1420] text-[#C9A052] text-xs font-bold disabled:opacity-50"
              >
                View airport <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </td>
          </tr>
        ))
        )}
            </tbody>
          </table>
        </div>
      </div>

      {!isSearchPending && filteredAirports.length > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Page {currentPage} of {pageCount}
            {!directoryLoaded && " · Loading full airport directory…"}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-[#E0DAD0] px-3 py-1.5 font-semibold disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
              disabled={currentPage === pageCount}
              className="rounded-lg border border-[#E0DAD0] px-3 py-1.5 font-semibold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {!isSearchPending && filteredAirports.length === 0 && (
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-12 text-center space-y-3">
          <Plane className="w-10 h-10 text-gray-300 mx-auto transform -rotate-45" />
          <h3 className="text-base font-bold text-[#0F1420]">No aerodromes matching search criteria</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Try another airport code (e.g. LSGG, LFMN, KTEB, EGGW) or search by city name.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedRegion("all");
              setSelectedType("all");
              setCurrentPage(1);
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
                  {selectedAirportForModal.iata && (
                    <span className="px-2 py-0.5 rounded-lg bg-white/20 text-white font-mono font-bold text-xs">
                      {selectedAirportForModal.iata}
                    </span>
                  )}
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
                  <p className="font-extrabold text-[#0F1420]">{selectedAirportForModal.runwayLength || "Not available"}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{selectedAirportForModal.runwaySurface || "Surface details not available"}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F5F2EC] border border-[#E0DAD0]">
                  <span className="text-[10px] font-mono uppercase text-gray-500 font-bold block mb-1">
                    Operating Hours
                  </span>
                  <p className="font-extrabold text-[#0F1420]">{selectedAirportForModal.operatingHours || "Not available"}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Confirm current hours with the airport operator.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F5F2EC] border border-[#E0DAD0]">
                  <span className="text-[10px] font-mono uppercase text-gray-500 font-bold block mb-1">
                    Extension Possibilities
                  </span>
                  <p className="text-[11px] text-gray-700 leading-snug">{selectedAirportForModal.extensionPossibilities || "Not available"}</p>
                </div>
              </div>

              {/* Designated FBOs Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-[#0F1420] flex items-center justify-between border-b pb-2 gap-3">
                  <span>Designated FBO Handlers ({selectedAirportForModal.fbos?.length || 0})</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFboId("new");
                      setFboDraft({ name: "", phone: "", email: "", vhfFrequency: "", address: "", operatingHours: "", languages: [], amenities: [], notes: "" });
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0F1420] text-[#C9A052] text-[10px] font-bold"
                  >
                    <Plus className="w-3 h-3" /> Add FBO
                  </button>
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
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[#C9A052]/20 text-[#9A7A35] border border-[#C9A052]/40 w-max">
                            {fbo.operatingHours || "Hours not listed"}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFboId(fbo.id);
                              setFboDraft({ ...fbo });
                            }}
                            className="p-1.5 rounded-lg border border-[#E0DAD0] text-gray-600 hover:text-[#0F1420]"
                            aria-label={`Edit ${fbo.name}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Remove ${fbo.name} from ${selectedAirportForModal.icao}?`)) removeFbo(fbo.id);
                            }}
                            className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                            aria-label={`Remove ${fbo.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
                {editingFboId && (
                  <div className="rounded-xl border border-[#C9A052]/50 bg-[#FAF8F5] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-[#0F1420]">{editingFboId === "new" ? "Add FBO" : "Edit FBO"}</h4>
                      <span className="text-[10px] font-mono text-gray-500">{selectedAirportForModal.icao} · {selectedAirportForModal.name}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {([
                        ["name", "FBO name"],
                        ["phone", "Phone"],
                        ["email", "Email"],
                        ["vhfFrequency", "VHF frequency"],
                        ["address", "Address"],
                        ["operatingHours", "Operating hours"]
                      ] as const).map(([field, label]) => (
                        <label key={field} className="space-y-1">
                          <span className="block text-[10px] font-mono uppercase text-gray-500">{label}</span>
                          <input
                            value={String(fboDraft[field] || "")}
                            onChange={(event) => setFboDraft((prev) => ({ ...prev, [field]: event.target.value }))}
                            type={field === "email" ? "email" : "text"}
                            required={field === "name" || field === "phone" || field === "email"}
                            className="w-full rounded-lg border border-[#E0DAD0] bg-white px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                          />
                        </label>
                      ))}
                      <label className="space-y-1 sm:col-span-2">
                        <span className="block text-[10px] font-mono uppercase text-gray-500">Languages (comma-separated)</span>
                        <input
                          value={(fboDraft.languages || []).join(", ")}
                          onChange={(event) => setFboDraft((prev) => ({ ...prev, languages: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))}
                          className="w-full rounded-lg border border-[#E0DAD0] bg-white px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                        />
                      </label>
                      <label className="space-y-1 sm:col-span-2">
                        <span className="block text-[10px] font-mono uppercase text-gray-500">Amenities (comma-separated)</span>
                        <input
                          value={(fboDraft.amenities || []).join(", ")}
                          onChange={(event) => setFboDraft((prev) => ({ ...prev, amenities: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))}
                          className="w-full rounded-lg border border-[#E0DAD0] bg-white px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                        />
                      </label>
                      <label className="space-y-1 sm:col-span-2">
                        <span className="block text-[10px] font-mono uppercase text-gray-500">Notes</span>
                        <textarea
                          rows={2}
                          value={fboDraft.notes || ""}
                          onChange={(event) => setFboDraft((prev) => ({ ...prev, notes: event.target.value }))}
                          className="w-full rounded-lg border border-[#E0DAD0] bg-white px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                        />
                      </label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => { setEditingFboId(null); setFboDraft({}); }} className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600">Cancel</button>
                      <button
                        type="button"
                        disabled={!fboDraft.name?.trim() || !fboDraft.phone?.trim() || !fboDraft.email?.trim()}
                        onClick={saveFbo}
                        className="px-3 py-1.5 rounded-lg bg-[#C9A052] text-[#0F1420] text-xs font-bold disabled:opacity-50"
                      >
                        Save FBO
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#F5F2EC] border-t border-[#E0DAD0] flex justify-end">
              <button
                onClick={() => {
                  setSelectedAirportForModal(null);
                  setEditingFboId(null);
                  setFboDraft({});
                }}
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
