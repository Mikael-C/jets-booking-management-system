"use client";

import React, { useState, useMemo, useRef, useEffect, useDeferredValue } from "react";
import { Aircraft } from "@/types/aviation";
import { fleetData } from "@/data/fleet";
import { Search, X, ChevronDown, Check, Plane } from "lucide-react";

interface AircraftSearchSelectProps {
  value: string; // aircraft id or name
  onChange: (aircraft: Aircraft) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const CATEGORIES = [
  "All",
  "Turboprop",
  "Entry level",
  "Light",
  "Midsize",
  "Super mid",
  "Heavy",
  "Ultra long range",
];

export default function AircraftSearchSelect({
  value,
  onChange,
  placeholder = "Search or select aircraft...",
  className = "",
  disabled = false,
}: AircraftSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find currently selected aircraft
  const selectedAircraft = useMemo(() => {
    return (
      fleetData.find(
        (ac) =>
          ac.id.toLowerCase() === (value || "").toLowerCase() ||
          ac.name.toLowerCase() === (value || "").toLowerCase()
      ) || fleetData[0]
    );
  }, [value]);

  // Filter fleet based on category and search query
  const filteredFleet = useMemo(() => {
    const q = deferredSearchQuery.trim().toLowerCase();
    return fleetData.filter((ac) => {
      // Category match
      if (selectedCategory !== "All") {
        const cat = (ac.categoryLabel || ac.category || "").toLowerCase();
        if (!cat.includes(selectedCategory.toLowerCase())) {
          return false;
        }
      }
      // Query match
      if (!q) return true;
      const name = (ac.name || "").toLowerCase();
      const mfr = (ac.manufacturer || "").toLowerCase();
      const cat = (ac.categoryLabel || ac.category || "").toLowerCase();
      const pax = `${ac.passengers} pax`;
      return name.includes(q) || mfr.includes(q) || cat.includes(q) || pax.includes(q);
    });
  }, [deferredSearchQuery, selectedCategory]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setSearchQuery("");
      setSelectedCategory("All");
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSelect = (aircraft: Aircraft) => {
    onChange(aircraft);
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
        className={`w-full bg-[var(--paper)] border border-[var(--line)] hover:border-gray-400 rounded-lg px-3 py-2 text-xs text-[var(--ink)] font-sans font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 flex items-center justify-between text-left transition-all shadow-2xs ${
          isOpen ? "border-blue-500 ring-1 ring-blue-500/30" : ""
        } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 truncate mr-2">
          <Plane className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          {selectedAircraft ? (
            <span className="truncate">
              <strong className="font-semibold text-gray-900">{selectedAircraft.name}</strong>{" "}
              <span className="text-gray-500">
                ({selectedAircraft.categoryLabel} • {selectedAircraft.passengers} pax)
              </span>
            </span>
          ) : (
            <span className="text-gray-400 font-normal truncate">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-blue-600" : ""
          }`}
        />
      </button>

      {/* Popover Dropdown with Search Bar */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full min-w-[320px] sm:min-w-[420px] md:min-w-[480px] bg-white border border-gray-200 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* Search Bar */}
          <div className="relative mb-2.5">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filteredFleet.length > 0) {
                  e.preventDefault();
                  handleSelect(filteredFleet[0]);
                }
              }}
              placeholder="Search aircraft model, manufacturer, category..."
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-gray-300 bg-gray-50 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
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

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 border-b border-gray-100 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`text-[11px] px-2.5 py-0.5 rounded-full whitespace-nowrap transition-all font-medium ${
                  selectedCategory === cat
                    ? "bg-gray-900 text-white font-semibold shadow-2xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Quick Header */}
          <div className="flex items-center justify-between px-1 pb-1 text-[10px] font-mono text-gray-400 mb-1">
            <span>Showing {filteredFleet.length} models</span>
            <span>MODEL • CATEGORY • CAPACITY</span>
          </div>

          {/* Scrollable Aircraft List */}
          <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredFleet.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                <Plane className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
                <p className="font-semibold text-gray-600">No aircraft matching "{searchQuery}"</p>
                <p className="text-[11px] mt-0.5 text-gray-400">
                  Try searching by model (e.g. Challenger, King Air, Phenom) or category
                </p>
              </div>
            ) : (
              filteredFleet.map((aircraft) => {
                const isSelected = selectedAircraft?.id === aircraft.id;
                return (
                  <button
                    key={aircraft.id}
                    type="button"
                    onClick={() => handleSelect(aircraft)}
                    className={`w-full text-left p-2 rounded-lg transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 text-blue-900 border border-blue-200"
                        : "hover:bg-gray-50 text-gray-800"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-xs text-gray-900 truncate">
                          {aircraft.name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200 shrink-0">
                          {aircraft.categoryLabel || aircraft.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 font-sans flex items-center gap-2">
                        <span>{aircraft.passengers} passengers</span>
                        <span>•</span>
                        <span>{aircraft.rangeLabel || `${aircraft.range} km`}</span>
                        {aircraft.cruiseSpeed && (
                          <>
                            <span>•</span>
                            <span>{aircraft.cruiseSpeed}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600 shrink-0" />
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
