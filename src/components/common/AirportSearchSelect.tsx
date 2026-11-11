"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useAirportDirectory } from "@/lib/airportDirectory";
import { Airport } from "@/types/aviation";
import { Search, X, ChevronDown, Check, MapPin, Building } from "lucide-react";

interface AirportSearchSelectProps {
  value: string;
  onChange: (icao: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function AirportSearchSelect({
  value,
  onChange,
  placeholder = "Search or select airport...",
  className = "",
  disabled = false,
}: AirportSearchSelectProps) {
  const [airportsData] = useAirportDirectory();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find currently selected airport
  const selectedAirport = useMemo(() => {
    return (
      airportsData.find(
        (a) => a.icao.toUpperCase() === (value || "").toUpperCase()
      ) || null
    );
  }, [value, airportsData]);

  // Filter airports matching the same comprehensive logic as AirportsView
  const filteredAirports = useMemo(() => {
    if (!searchQuery.trim()) {
      return airportsData;
    }
    const q = searchQuery.toLowerCase().trim();
    return airportsData.filter((a) => {
      const matchesName = a.name.toLowerCase().includes(q);
      const matchesIcao = a.icao.toLowerCase().includes(q);
      const matchesIata = a.iata.toLowerCase().includes(q);
      const matchesCity = a.city.toLowerCase().includes(q);
      const matchesCountry = a.country.toLowerCase().includes(q);
      const matchesFbo = (a.fbos || []).some(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.phone.toLowerCase().includes(q) ||
          f.email.toLowerCase().includes(q) ||
          (f.languages || []).some((l) => l.toLowerCase().includes(q))
      );
      return (
        matchesName ||
        matchesIcao ||
        matchesIata ||
        matchesCity ||
        matchesCountry ||
        matchesFbo
      );
    });
  }, [searchQuery, airportsData]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSelectAirport = (icao: string) => {
    onChange(icao);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Closed Trigger Field */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full bg-white border border-[#E0DAD0] hover:border-[#C9A052] rounded-lg px-2.5 py-2 text-xs text-[#0F1420] font-mono font-bold focus:outline-none focus:border-[#C9A052] flex items-center justify-between text-left transition-all shadow-sm ${
          isOpen ? "border-[#C9A052] ring-1 ring-[#C9A052]/30" : ""
        } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate mr-2">
          {selectedAirport ? (
            <span className="truncate">
              [{selectedAirport.icao}] {selectedAirport.city} — {selectedAirport.name}
            </span>
          ) : (
            <span className="text-gray-400 font-sans font-normal truncate">
              {placeholder}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-500 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#C9A052]" : ""
          }`}
        />
      </button>

      {/* Popover Dropdown with Search Bar */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full min-w-[280px] sm:min-w-[360px] md:min-w-[420px] max-w-[480px] bg-white border border-[#E0DAD0] rounded-xl shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* Search Bar - matching Image 2 & AirportsView */}
          <div className="relative mb-2">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && filteredAirports.length > 0) {
                  event.preventDefault();
                  handleSelectAirport(filteredAirports[0].icao);
                }
              }}
              placeholder="Search by Airport Name, ICAO code (e.g. LSGG, LFMN), IATA code, or City..."
              aria-label="Search airports by name, airport code, or city"
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-[#E0DAD0] bg-[#F5F2EC] text-xs text-[#0F1420] font-medium placeholder-gray-400 focus:outline-none focus:border-[#C9A052] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Stats / Filter Info */}
          <div className="flex items-center justify-between px-1 pb-1.5 text-[10px] font-mono text-gray-400 border-b border-[#E0DAD0]/60 mb-1">
            <span>
              Showing {filteredAirports.length} of {airportsData.length} airports
            </span>
            <span className="text-[9px] uppercase tracking-wider">
              ICAO • IATA • CITY
            </span>
          </div>

          {/* Scrollable Airports List */}
          <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredAirports.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">
                <MapPin className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
                <p className="font-semibold text-gray-600">No airports found</p>
                <p className="text-[11px] mt-0.5 text-gray-400">
                  Try searching by ICAO (e.g. LSGG), IATA (e.g. GVA), or city
                </p>
              </div>
            ) : (
              filteredAirports.map((airport) => {
                const isSelected =
                  airport.icao.toUpperCase() === (value || "").toUpperCase();
                return (
                  <button
                    key={airport.icao}
                    type="button"
                    onClick={() => handleSelectAirport(airport.icao)}
                    className={`w-full text-left p-2 rounded-lg transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-[#0F1420] text-white shadow-sm"
                        : "hover:bg-[#F5F2EC] text-[#0F1420]"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className={`px-1.5 py-0.5 rounded font-mono font-bold text-[11px] ${
                            isSelected
                              ? "bg-[#C9A052] text-[#0F1420]"
                              : "bg-[#0F1420] text-[#C9A052]"
                          }`}
                        >
                          {airport.icao}
                        </span>
                        <span
                          className={`px-1 py-0.5 rounded font-mono text-[10px] font-semibold ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-[#C9A052]/20 text-[#9A7A35] border border-[#C9A052]/40"
                          }`}
                        >
                          {airport.iata}
                        </span>
                        {airport.popular && (
                          <span
                            className={`text-[9px] font-mono uppercase px-1 py-0.2 rounded font-bold ${
                              isSelected
                                ? "bg-emerald-500/30 text-emerald-300 border border-emerald-400/30"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            }`}
                          >
                            Hub
                          </span>
                        )}
                        <span className="text-xs font-bold truncate">
                          {airport.city}
                        </span>
                      </div>
                      <div
                        className={`text-[10px] truncate ${
                          isSelected ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        {airport.name} ({airport.country})
                        {airport.fbos && airport.fbos.length > 0 && (
                          <span className="ml-1 opacity-80">
                            • {airport.fbos.length} FBO
                            {airport.fbos.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-[#C9A052] shrink-0 ml-1" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
