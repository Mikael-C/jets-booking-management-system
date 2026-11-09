"use client";

import React, { useState, useMemo } from "react";
import { getAllFbos } from "@/data/airports";
import {
  Building2,
  Search,
  Phone,
  Mail,
  Radio,
  Clock,
  Globe,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  X,
  Compass,
  Filter
} from "lucide-react";

export default function FbosView() {
  const allFbos = useMemo(() => getAllFbos(), []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [h24Only, setH24Only] = useState(false);

  // Extract all unique languages across all FBOs
  const availableLanguages = useMemo(() => {
    const set = new Set<string>();
    allFbos.forEach((f) => {
      (f.languages || []).forEach((l) => set.add(l));
    });
    return Array.from(set).sort();
  }, [allFbos]);

  const filteredFbos = useMemo(() => {
    return allFbos.filter((f) => {
      // H24 filter
      if (h24Only && !(f.operatingHours || "").toLowerCase().includes("h24")) {
        return false;
      }

      // Language filter
      if (selectedLanguage !== "all") {
        if (!f.languages || !f.languages.includes(selectedLanguage)) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = f.name.toLowerCase().includes(q);
        const matchesAirport = f.airportName.toLowerCase().includes(q);
        const matchesIcao = f.airportIcao.toLowerCase().includes(q);
        const matchesIata = f.airportIata.toLowerCase().includes(q);
        const matchesCity = f.city.toLowerCase().includes(q);
        const matchesCountry = f.country.toLowerCase().includes(q);
        const matchesLang = (f.languages || []).some((l) => l.toLowerCase().includes(q));
        if (!matchesName && !matchesAirport && !matchesIcao && !matchesIata && !matchesCity && !matchesCountry && !matchesLang) {
          return false;
        }
      }

      return true;
    });
  }, [allFbos, searchQuery, selectedLanguage, h24Only]);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-[#0F1420] text-white rounded-2xl p-6 sm:p-8 border border-[#1C2436] shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/20 text-[#C9A052] border border-[#C9A052]/40 uppercase flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              EXECUTIVE GROUND HANDLING & FBO DIRECTORY
            </span>
            <span className="text-gray-400 text-xs font-mono">• {allFbos.length} Designated FBO Stations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Fixed-Base Operators (FBOs)
          </h1>
          <p className="text-xs text-gray-300 leading-relaxed">
            Global directory of designated private jet handling stations and VIP general aviation terminals. Direct telephone desks, VHF ramp frequencies, operating schedules, and multilingual handler capabilities.
          </p>
        </div>

        <div className="px-5 py-4 rounded-xl bg-[#141A29] border border-[#1C2436] text-right">
          <div className="text-[10px] font-mono uppercase text-gray-400">Total FBO Desks</div>
          <div className="text-2xl font-black font-mono text-[#C9A052]">{allFbos.length}</div>
          <div className="text-[11px] text-emerald-400 font-mono mt-0.5">Worldwide Network</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search FBO name, airport code (e.g. LSGG, TEB, FAB), city, or language..."
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

          {/* Language filter */}
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-400 hidden sm:inline" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2.5 text-xs text-[#0F1420] font-semibold focus:outline-none focus:border-[#C9A052]"
            >
              <option value="all">All Spoken Languages</option>
              {availableLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* 24/7 Filter Toggle */}
          <button
            onClick={() => setH24Only(!h24Only)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${
              h24Only
                ? "bg-[#0F1420] text-[#C9A052] border-[#0F1420]"
                : "bg-[#F5F2EC] text-gray-700 border-[#E0DAD0] hover:border-[#C9A052]"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>H24 / 24-Hour Stations Only</span>
          </button>
        </div>

        {/* Counter */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-[#E0DAD0]/60">
          <span>
            Displaying <strong className="text-[#0F1420]">{filteredFbos.length}</strong> FBO handlers
          </span>
          <span className="text-[11px] font-mono text-[#C9A052]">
            EASA & FAA Part-145 Certified Ground Operations
          </span>
        </div>
      </div>

      {/* FBO Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredFbos.map((fbo) => (
          <div
            key={fbo.id}
            className="bg-white border border-[#E0DAD0] hover:border-[#C9A052] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group space-y-4"
          >
            <div className="space-y-3">
              {/* Header: Airport ICAO/IATA + FBO Name */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded-lg bg-[#0F1420] text-white font-mono font-black text-xs">
                      {fbo.airportIcao}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-[#C9A052]/20 text-[#9A7A35] font-mono font-bold text-xs border border-[#C9A052]/40">
                      {fbo.airportIata}
                    </span>
                    <span className="text-gray-500 text-[11px] truncate">{fbo.city}, {fbo.country}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-[#0F1420] group-hover:text-[#C9A052] transition-colors leading-snug">
                    {fbo.name}
                  </h3>
                  <p className="text-[11px] text-gray-500 truncate">{fbo.airportName}</p>
                </div>
              </div>

              {/* Operating Hours Badge */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F5F2EC] border border-[#E0DAD0] text-xs">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#C9A052]" /> Operating Hours:
                </span>
                <span className="font-extrabold text-[#0F1420] font-mono">
                  {fbo.operatingHours || "06:00 - 22:00 Local"}
                </span>
              </div>

              {/* Contact Information Buttons */}
              <div className="space-y-2 text-xs font-mono">
                <a
                  href={`tel:${fbo.phone}`}
                  className="p-2.5 rounded-xl bg-white border border-gray-200 hover:border-[#C9A052] hover:bg-[#F5F2EC] text-[#0F1420] flex items-center justify-between font-bold transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#C9A052]" />
                    <span>{fbo.phone}</span>
                  </span>
                  <span className="text-[10px] font-sans text-gray-400">Direct Desk</span>
                </a>

                <a
                  href={`mailto:${fbo.email}`}
                  className="p-2.5 rounded-xl bg-white border border-gray-200 hover:border-[#C9A052] hover:bg-[#F5F2EC] text-[#0F1420] flex items-center justify-between font-bold transition-all truncate"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-[#C9A052] flex-shrink-0" />
                    <span className="truncate">{fbo.email}</span>
                  </span>
                  <span className="text-[10px] font-sans text-gray-400 flex-shrink-0 ml-2">Email Handling</span>
                </a>

                {fbo.vhfFrequency && (
                  <div className="p-2.5 rounded-xl bg-white border border-gray-200 text-[#0F1420] flex items-center justify-between font-bold">
                    <span className="flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-[#C9A052]" />
                      <span>VHF Frequency: {fbo.vhfFrequency}</span>
                    </span>
                    <span className="text-[10px] font-sans text-gray-400">Ramp Ops</span>
                  </div>
                )}
              </div>

              {/* Languages Spoken */}
              {fbo.languages && fbo.languages.length > 0 && (
                <div className="pt-1">
                  <div className="text-[10px] font-mono text-gray-500 font-bold uppercase mb-1.5 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-gray-400" />
                    <span>Languages Spoken</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {fbo.languages.map((lang) => (
                      <span
                        key={lang}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-[#0F1420]"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Amenities tags */}
              {fbo.amenities && fbo.amenities.length > 0 && (
                <div className="pt-1">
                  <div className="text-[10px] font-mono text-gray-500 font-bold uppercase mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>VIP Amenities</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {fbo.amenities.slice(0, 3).map((amenity) => (
                      <span
                        key={amenity}
                        className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200"
                      >
                        ✓ {amenity}
                      </span>
                    ))}
                    {fbo.amenities.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] text-gray-500 font-mono">
                        +{fbo.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {fbo.notes && (
                <p className="text-[11px] text-gray-600 italic pt-1 border-t border-gray-100">
                  {fbo.notes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredFbos.length === 0 && (
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-12 text-center space-y-3">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-[#0F1420]">No FBO handlers matching filters</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Try resetting your search query or selecting "All Spoken Languages".
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedLanguage("all");
              setH24Only(false);
            }}
            className="px-4 py-2 rounded-xl bg-[#0F1420] text-white text-xs font-bold"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
