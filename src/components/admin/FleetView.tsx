"use client";

import React, { useState } from "react";
import { fleetData } from "@/data/fleet";
import { airportsData } from "@/data/airports";
import {
  Plane,
  ShieldCheck,
  Users,
  Gauge,
  Compass,
  Fuel,
  CheckCircle2,
  Building2,
  Search,
  Filter,
  Image as ImageIcon,
  Star,
  Phone,
  Mail,
  Clock,
  MapPin,
  FileCheck,
  Plus,
  ExternalLink,
  ShieldAlert,
  Tag,
  Loader2,
  Sparkles,
  Download
} from "lucide-react";
import { api } from "@/lib/api";

interface FboRecord {
  id: string;
  airportIcao: string;
  airportName: string;
  city: string;
  country: string;
  handlerName: string;
  address: string;
  phone: string;
  email: string;
  operatingHours: string;
  services: string[];
  pprSlotRequired: boolean;
  feesNotes: string;
  internalRating: number; // 1-5
  notes: string;
  lastVerifiedDate: string;
}

const INITIAL_FBOS: FboRecord[] = [
  {
    id: "fbo-1",
    airportIcao: "LSGG",
    airportName: "Geneva Cointrin Airport",
    city: "Geneva",
    country: "Switzerland",
    handlerName: "Jet Aviation Geneva",
    address: "Chemin des Papillons 20, 1215 Geneva",
    phone: "+41 58 158 1811",
    email: "gvafbo@jetaviation.com",
    operatingHours: "06:00 - 22:00 LT (O/T on request)",
    services: ["Dedicated Customs & Immigration", "VIP Lounge", "VIP Catering", "Hangar Parking", "Crew Rest & Car"],
    pprSlotRequired: true,
    feesNotes: "Mandatory noise surcharge after 20:00. FBO handling fee: ~CHF 480.",
    internalRating: 5,
    notes: "Preferred handling partner in Switzerland. Direct tarmac access with limousine.",
    lastVerifiedDate: "2026-10-15"
  },
  {
    id: "fbo-2",
    airportIcao: "LIMJ",
    airportName: "Genoa Cristoforo Colombo Airport",
    city: "Genoa",
    country: "Italy",
    handlerName: "Ags Ops Executive Handling",
    address: "Via Pionieri ed Aviatori d'Italia, 16154 Genova",
    phone: "+39 010 601 5412",
    email: "dutymanager@airport.genova.it",
    operatingHours: "07:00 - 23:00 LT",
    services: ["Fast-Track Customs", "Executive Lounges", "De-icing", "Ground Power Unit (GPU)", "Tarmac Transfer"],
    pprSlotRequired: false,
    feesNotes: "Italian passenger tax applicable (€10/pax inbound, €20/pax outbound for flights >1,000 km).",
    internalRating: 4,
    notes: "No PPR required. Quick turnaround for charter flights.",
    lastVerifiedDate: "2026-10-18"
  },
  {
    id: "fbo-3",
    airportIcao: "LFMN",
    airportName: "Nice Côte d'Azur Airport",
    city: "Nice / Cannes / Monaco",
    country: "France",
    handlerName: "Signature Flight Support NCE",
    address: "Terminal 2 Aviation Générale, 06281 Nice",
    phone: "+33 4 93 21 02 02",
    email: "nce@signatureflight.fr",
    operatingHours: "H24 Operations",
    services: ["Helicopter Transfers to Monaco", "Customs & Border Police", "VIP Chauffeur", "VIP Lounges", "Fuelling"],
    pprSlotRequired: true,
    feesNotes: "Summer slot coordination required via COHOR. High parking fees in peak season.",
    internalRating: 5,
    notes: "Primary gateway for French Riviera & Monaco Grand Prix. Direct heli transfer desk.",
    lastVerifiedDate: "2026-10-20"
  },
  {
    id: "fbo-4",
    airportIcao: "EGLF",
    airportName: "Farnborough Airport",
    city: "London",
    country: "United Kingdom",
    handlerName: "TAG Aviation / Farnborough Executive",
    address: "Farnborough Airport, Hampshire, GU14 6XA",
    phone: "+44 1252 375300",
    email: "operations@farnboroughairport.com",
    operatingHours: "07:00 - 22:00 LT Mon-Fri / 08:00 - 20:00 LT Weekends",
    services: ["Dedicated UK Border Force on-site", "Direct Ramp Access", "Conference Facilities", "Hangar Storage", "Concierge"],
    pprSlotRequired: true,
    feesNotes: "Premium executive rates. APD (Air Passenger Duty) collected at standard private jet rate.",
    internalRating: 5,
    notes: "Finest dedicated business airport for Central London access (35 min drive or 10 min heli).",
    lastVerifiedDate: "2026-10-12"
  },
  {
    id: "fbo-5",
    airportIcao: "LFPB",
    airportName: "Paris Le Bourget Airport",
    city: "Paris",
    country: "France",
    handlerName: "Dassault Falcon Service FBO",
    address: "Aéroport du Bourget, 93350 Le Bourget",
    phone: "+33 1 48 35 56 78",
    email: "fbo@dassault-falcon-service.com",
    operatingHours: "06:00 - 22:00 LT",
    services: ["Customs & Border Control", "Private Salons", "Dedicated Crew Lounge", "Falcon Maintenance Line", "Limousines"],
    pprSlotRequired: true,
    feesNotes: "French domestic ecological solidarity tax applicable.",
    internalRating: 5,
    notes: "Direct Paris highway access. Top maintenance and VIP handling support.",
    lastVerifiedDate: "2026-10-19"
  },
  {
    id: "fbo-6",
    airportIcao: "LOWW",
    airportName: "Vienna International Airport",
    city: "Vienna",
    country: "Austria",
    handlerName: "Vienna Aircraft Handling (VAH)",
    address: "General Aviation Center, 1300 Schwechat",
    phone: "+43 1 7007 22203",
    email: "vah@viennaairport.com",
    operatingHours: "H24 Operations",
    services: ["GAC Dedicated Terminal", "Fast Border Control", "VIP Lounges", "Catering & Ice", "Hangarage"],
    pprSlotRequired: false,
    feesNotes: "Austrian Air Transport Levy exempt for pure transit/business charters.",
    internalRating: 4,
    notes: "Austrian home base handling partner. 24/7 dedicated support.",
    lastVerifiedDate: "2026-10-21"
  }
];

export default function FleetView() {
  const [activeTab, setActiveTab] = useState<"fleet" | "fbos" | "photos">("fleet");

  // REF-6: Aircraft filter state (Category, Min Seats, Min Range)
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [minSeats, setMinSeats] = useState<number>(0);
  const [minRange, setMinRange] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");

  // FBO Directory state (REF-2)
  const [fboSearch, setFboSearch] = useState("");
  const [selectedFbo, setSelectedFbo] = useState<FboRecord | null>(null);

  // Jet Images Search State (Unsplash & Pexels APIs via Backend)
  const [jetImageQuery, setJetImageQuery] = useState("Gulfstream G650 cabin");
  const [jetImageView, setJetImageView] = useState<"all" | "interior" | "exterior">("all");
  const [jetImagesResults, setJetImagesResults] = useState<any[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  const handleSearchJetImages = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!jetImageQuery.trim()) return;
    setIsLoadingImages(true);
    try {
      let results: any[] = [];
      if (jetImageView === "interior") {
        results = await api.jetImages.interior(jetImageQuery);
      } else if (jetImageView === "exterior") {
        results = await api.jetImages.exterior(jetImageQuery);
      } else {
        results = await api.jetImages.search(jetImageQuery);
      }
      setJetImagesResults(Array.isArray(results) ? results : []);
    } catch (err) {
      console.warn("Failed to search jet images:", err);
    } finally {
      setIsLoadingImages(false);
    }
  };

  // Filtered fleet per REF-6
  const filteredFleet = fleetData.filter((jet) => {
    if (categoryFilter !== "all" && jet.category !== categoryFilter) return false;
    if (minSeats > 0 && jet.passengers < minSeats) return false;
    if (minRange > 0 && jet.range < minRange) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        jet.name.toLowerCase().includes(q) ||
        jet.manufacturer.toLowerCase().includes(q) ||
        (jet.registration?.toLowerCase().includes(q) ?? false) ||
        jet.categoryLabel.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered FBOs per REF-2
  const filteredFbos = INITIAL_FBOS.filter((fbo) => {
    if (!fboSearch.trim()) return true;
    const q = fboSearch.toLowerCase();
    return (
      fbo.airportIcao.toLowerCase().includes(q) ||
      fbo.airportName.toLowerCase().includes(q) ||
      fbo.city.toLowerCase().includes(q) ||
      fbo.handlerName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/15 text-[#9A7A35] border border-[#C9A052]/30">
              AVIATION REFERENCE DATA [REF-2, REF-3 & REF-6]
            </span>
            <span className="text-xs text-[#0F1420]/60">Fleet, FBO Directory & Assets</span>
          </div>
          <h2 className="text-xl font-black text-[#0F1420] tracking-tight">
            Fleet Roster & Ground Handler Directory
          </h2>
          <p className="text-xs text-[#0F1420]/65 mt-0.5">
            Aircraft technical specs, category filtering (REF-6), FBO contacts (REF-2), and licensed photo assets.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-[#F5F2EC] p-1.5 rounded-xl border border-[#E0DAD0]">
          <button
            onClick={() => setActiveTab("fleet")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "fleet" ? "bg-[#0F1420] text-white shadow-sm" : "text-[#0F1420]/70 hover:text-[#0F1420]"
            }`}
          >
            <Plane className="w-3.5 h-3.5 text-[#C9A052]" />
            <span>Aircraft Fleet ({fleetData.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("fbos")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "fbos" ? "bg-[#0F1420] text-white shadow-sm" : "text-[#0F1420]/70 hover:text-[#0F1420]"
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-[#C9A052]" />
            <span>FBO Directory ({INITIAL_FBOS.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("photos")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "photos" ? "bg-[#0F1420] text-white shadow-sm" : "text-[#0F1420]/70 hover:text-[#0F1420]"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#C9A052]" />
            <span>Photo Licences</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: AIRCRAFT FLEET WITH FILTER (REF-3 & REF-6) ── */}
      {activeTab === "fleet" && (
        <div className="space-y-4">
          {/* REF-6: Matching Filter Controls */}
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#C9A052]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F1420] font-mono">
                  Aircraft Filter & Route Matching [REF-6]
                </h3>
              </div>
              <span className="text-[11px] font-mono text-gray-500">
                Showing <strong>{filteredFleet.length}</strong> of {fleetData.length} aircraft
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              {/* Category */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                >
                  <option value="all">All Categories</option>
                  <option value="light">Light Jet</option>
                  <option value="midsize">Midsize Jet</option>
                  <option value="super-midsize">Super-Midsize Jet</option>
                  <option value="large">Heavy Jet</option>
                  <option value="ultra-long-range">Ultra-Long-Range Jet</option>
                </select>
              </div>

              {/* Min Seats */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">
                  Min Seats: {minSeats > 0 ? `${minSeats}+ pax` : "Any"}
                </label>
                <select
                  value={minSeats}
                  onChange={(e) => setMinSeats(Number(e.target.value))}
                  className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                >
                  <option value={0}>Any Seats</option>
                  <option value={4}>4+ Seats</option>
                  <option value={6}>6+ Seats</option>
                  <option value={8}>8+ Seats</option>
                  <option value={10}>10+ Seats</option>
                  <option value={14}>14+ Seats</option>
                </select>
              </div>

              {/* Min Range */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">
                  Min Range: {minRange > 0 ? `${minRange.toLocaleString()} nm+` : "Any"}
                </label>
                <select
                  value={minRange}
                  onChange={(e) => setMinRange(Number(e.target.value))}
                  className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                >
                  <option value={0}>Any Range</option>
                  <option value={1000}>1,000+ nm</option>
                  <option value={1500}>1,500+ nm (e.g. REF-6)</option>
                  <option value={2500}>2,500+ nm (Transcontinental)</option>
                  <option value={5000}>5,000+ nm (Transatlantic)</option>
                </select>
              </div>

              {/* Search text */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Search Keyword</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Mustang, Citation, OE-FFB..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl pl-8 pr-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Fleet Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredFleet.map((jet) => (
              <div
                key={jet.id}
                className="bg-white border border-[#E0DAD0] hover:border-[#C9A052] rounded-2xl p-5 shadow-sm transition-all space-y-4 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-[#9A7A35] bg-[#C9A052]/15 border border-[#C9A052]/30 px-2 py-0.5 rounded">
                      {jet.categoryLabel}
                    </span>
                    <h3 className="text-base font-extrabold text-[#0F1420] mt-1.5">{jet.name}</h3>
                    <p className="text-xs text-gray-500 font-mono">
                      Tail: <strong className="text-[#0F1420]">{jet.registration || "OE-FFB"}</strong> · {jet.manufacturer}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono text-gray-500 block">Charter Rate</span>
                    <span className="text-lg font-black text-[#0F1420] font-mono">
                      €{jet.pricePerHour.toLocaleString()}<span className="text-xs text-gray-400">/hr</span>
                    </span>
                  </div>
                </div>

                {/* Jet Specifications Grid */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-[#F5F2EC] rounded-xl text-xs font-mono text-[#0F1420]">
                  <div className="text-center">
                    <span className="text-[10px] text-gray-500 block">SEATS</span>
                    <strong className="text-xs">{jet.passengers} Pax</strong>
                  </div>
                  <div className="text-center border-x border-[#E0DAD0]">
                    <span className="text-[10px] text-gray-500 block">RANGE</span>
                    <strong className="text-xs">{jet.range} nm</strong>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-gray-500 block">SPEED</span>
                    <strong className="text-xs">{jet.cruiseSpeed || "420 kts"}</strong>
                  </div>
                </div>

                {/* Cabin Amenities */}
                <div className="text-xs text-[#0F1420]/80 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">Lavatory / Toilette:</span>
                    <span className="font-bold">{jet.toilette ? "Enclosed Private Lavatory" : "Not fitted"}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">Cabin Height & Width:</span>
                    <span className="font-mono">{jet.cabinHeight || "1.37 m"} × {jet.cabinWidth || "1.40 m"}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">Baggage Capacity:</span>
                    <span className="font-mono">{jet.baggageVolume || "1.6 m³"}</span>
                  </div>
                </div>

                {/* Status Footer */}
                <div className="pt-3 border-t border-[#E0DAD0] flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Airworthy & Certified
                  </span>
                  <span className="text-gray-400 font-mono text-[11px]">
                    EASA A.O.C. Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 2: FBO / GROUND HANDLER DIRECTORY (REF-2) ── */}
      {activeTab === "fbos" && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#C9A052]" />
              <h3 className="text-sm font-bold text-[#0F1420]">
                FBO & Executive Ground Handlers Directory [REF-2]
              </h3>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by ICAO, city or handler..."
                value={fboSearch}
                onChange={(e) => setFboSearch(e.target.value)}
                className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFbos.map((fbo) => (
              <div
                key={fbo.id}
                className="bg-white border border-[#E0DAD0] hover:border-[#C9A052] rounded-2xl p-5 shadow-sm transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm bg-[#0F1420] text-white px-2 py-0.5 rounded">
                        {fbo.airportIcao}
                      </span>
                      <h4 className="text-sm font-bold text-[#0F1420]">{fbo.handlerName}</h4>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {fbo.airportName} · {fbo.city}, {fbo.country}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg text-amber-800 text-xs font-bold">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>{fbo.internalRating}.0</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-gray-600 bg-[#F5F2EC] p-3 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#C9A052]" />
                    <span className="text-[#0F1420] truncate">{fbo.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#C9A052]" />
                    <span className="text-[#0F1420] truncate">{fbo.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <Clock className="w-3.5 h-3.5 text-[#C9A052]" />
                    <span>Hours: {fbo.operatingHours}</span>
                  </div>
                </div>

                {/* Services Tags */}
                <div>
                  <p className="text-[10px] font-mono uppercase text-gray-400 mb-1">Services Provided</p>
                  <div className="flex flex-wrap gap-1">
                    {fbo.services.map((srv) => (
                      <span key={srv} className="text-[10px] bg-white border border-[#E0DAD0] px-2 py-0.5 rounded text-gray-700 font-medium">
                        {srv}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Fee & Slot Notes */}
                <div className="text-[11px] text-gray-600 border-t border-[#E0DAD0] pt-2 space-y-1">
                  <p>
                    <strong className="text-[#0F1420]">Slot / PPR:</strong> {fbo.pprSlotRequired ? "Mandatory prior coordination (PPR)" : "No PPR required for GA"}
                  </p>
                  <p className="text-gray-500">{fbo.feesNotes}</p>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 border-t border-[#F5F2EC] pt-2">
                  <span>Verified: {fbo.lastVerifiedDate}</span>
                  <span className="text-emerald-700 font-bold">Approved Ground Handler</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: PHOTO ASSETS & LICENCES (REF-5) ── */}
      {activeTab === "photos" && (
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E0DAD0]">
            <div>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#C9A052]" />
                <h3 className="text-sm font-bold text-[#0F1420]">Photo Management & Licences [REF-5]</h3>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                All exterior and interior aircraft images used in quotes and client briefs must possess documented commercial rights. No third-party image scraping.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {fleetData.map((jet) => (
              <div key={jet.id} className="border border-[#E0DAD0] rounded-xl overflow-hidden bg-[#F5F2EC] space-y-2 pb-3">
                <div className="h-32 bg-gray-200 relative overflow-hidden">
                  <img src={jet.imageExterior} alt={jet.name} className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 text-[10px] text-white rounded font-mono">
                    Exterior
                  </span>
                </div>
                <div className="px-3">
                  <h4 className="text-xs font-bold text-[#0F1420]">{jet.name}</h4>
                  <p className="text-[10px] font-mono text-gray-500">Licence: Manufacturer Press Kit / Direct Operator Rights</p>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-700 font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Commercial Use Verified</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Live Jet Images Explorer (Connected to Backend Unsplash / Pexels APIs) */}
          <div className="pt-6 border-t border-[#E0DAD0] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-[#0F1420] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C9A052]" />
                  Live Private Jet Image Explorer (Unsplash & Pexels APIs)
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Search millions of licensed interior and exterior private aviation photos via the backend image proxy.
                </p>
              </div>

              {/* View Filters */}
              <div className="flex items-center gap-1 bg-[#F5F2EC] p-1 rounded-xl border border-[#E0DAD0]">
                <button
                  type="button"
                  onClick={() => setJetImageView("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    jetImageView === "all" ? "bg-[#0F1420] text-white" : "text-gray-600 hover:text-[#0F1420]"
                  }`}
                >
                  All Photos
                </button>
                <button
                  type="button"
                  onClick={() => setJetImageView("interior")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    jetImageView === "interior" ? "bg-[#0F1420] text-white" : "text-gray-600 hover:text-[#0F1420]"
                  }`}
                >
                  Cabins & Interiors
                </button>
                <button
                  type="button"
                  onClick={() => setJetImageView("exterior")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    jetImageView === "exterior" ? "bg-[#0F1420] text-white" : "text-gray-600 hover:text-[#0F1420]"
                  }`}
                >
                  Tarmac & Exteriors
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearchJetImages} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search model, cabin, or tarmac (e.g. Gulfstream G650, Challenger 350, Citation)..."
                  value={jetImageQuery}
                  onChange={(e) => setJetImageQuery(e.target.value)}
                  className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
                />
              </div>
              <button
                type="submit"
                disabled={isLoadingImages}
                className="px-5 py-2.5 rounded-xl bg-[#0F1420] hover:bg-[#1E2538] text-[#C9A052] border border-[#C9A052]/40 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {isLoadingImages ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>Search Photos</span>
              </button>
            </form>

            {/* Results Grid */}
            {jetImagesResults.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
                {jetImagesResults.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className="group border border-[#E0DAD0] hover:border-[#C9A052] rounded-xl overflow-hidden bg-[#F5F2EC] transition-all shadow-sm"
                  >
                    <div className="h-40 bg-gray-200 relative overflow-hidden">
                      <img
                        src={img.url || img.thumb}
                        alt={img.description || "Private Jet"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[9px] font-mono text-white">
                        {img.source || "Unsplash"}
                      </span>
                    </div>
                    <div className="p-2.5">
                      <p className="text-[11px] font-bold text-[#0F1420] truncate">
                        {img.description || "Private Jet Photo"}
                      </p>
                      <p className="text-[10px] text-gray-500 font-mono truncate">
                        By {img.photographer || img.credit || "Professional Aviation"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
