"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAviation } from "@/lib/aviationContext";
import { Booking, FlightLeg, CrewMember, HandlingAgent, PassengerManifestItem } from "@/types/aviation";
import { airportsData, findAirportByCode, getAirportFbos } from "@/data/airports";
import { fleetData } from "@/data/fleet";
import { defaultOperator } from "@/data/initialBookings";
import {
  Compass,
  Plane,
  User,
  Shield,
  Clock,
  MapPin,
  CheckCircle2,
  FileText,
  AlertCircle,
  Building,
  Phone,
  Mail,
  Plus,
  Trash2,
  Calendar,
  Users,
  Sparkles,
  ChevronRight,
  Search,
  Eye,
  Edit2,
  X,
  ArrowRight,
  Lock
} from "lucide-react";

interface EditableLegBrief {
  legNumber: number;
  flightDate: string;
  originIcao: string;
  destIcao: string;
  departureTime: string;
  arrivalTime: string;
  flightTimeFormatted: string;
  paxCount: number;
  flightNumber: string;
  aircraftRegistration: string;
  cmdrName: string;
  cmdrPhone: string;
  foName: string;
  foPhone: string;
  faName?: string;
  faPhone?: string;
  passengerNames: string;
  depHandlerName: string;
  depHandlerPhone: string;
  depHandlerEmail: string;
  arrHandlerName: string;
  arrHandlerPhone: string;
  arrHandlerEmail: string;
}

export default function GenerateBriefView() {
  const { bookings, openDocument, contacts, createFlightBrief, getFlightBriefs, syncPassengerToContact } = useAviation();

  const [activeTab, setActiveTab] = useState<"list" | "builder">("list");
  const [listSearchQuery, setListSearchQuery] = useState("");
  const [listStatusFilter, setListStatusFilter] = useState("all");

  // All Flight Briefs list from bookings
  const briefsList = useMemo(() => {
    return bookings.filter((b) => b.tripNumber && b.legs && b.legs.length > 0);
  }, [bookings]);

  const filteredBriefs = useMemo(() => {
    return briefsList.filter((b) => {
      if (listStatusFilter !== "all") {
        if (listStatusFilter === "dispatched" && b.status !== "dispatched") return false;
        if (listStatusFilter === "confirmed" && b.status !== "confirmed") return false;
        if (listStatusFilter === "completed" && b.status !== "completed") return false;
      }
      if (listSearchQuery.trim() !== "") {
        const q = listSearchQuery.toLowerCase().trim();
        const matchTrip = (b.tripNumber || "").toLowerCase().includes(q);
        const matchClient = (b.client?.fullName || "").toLowerCase().includes(q);
        const matchAircraft = (b.aircraft?.name || "").toLowerCase().includes(q);
        const matchReg = (b.aircraft?.registration || "").toLowerCase().includes(q);
        const matchRoute = (b.legs || []).some(
          (l) =>
            (l.origin?.icao || "").toLowerCase().includes(q) ||
            (l.destination?.icao || "").toLowerCase().includes(q) ||
            (l.origin?.city || "").toLowerCase().includes(q) ||
            (l.destination?.city || "").toLowerCase().includes(q)
        );
        if (!matchTrip && !matchClient && !matchAircraft && !matchReg && !matchRoute) return false;
      }
      return true;
    });
  }, [briefsList, listStatusFilter, listSearchQuery]);

  // Search input: live filter by Trip ID or Client's Name
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [selectedBookingId, setSelectedBookingId] = useState<string>(bookings[0]?.id || "");
  const selectedBooking = bookings.find((b) => b.id === selectedBookingId) || bookings[0];

  // Document Identifiers (Flight Brief DETAILS box)
  const [contractDate, setContractDate] = useState("30/06/2026");
  const [tripNumber, setTripNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("ACC-21737");
  const [quoteExpirationDate, setQuoteExpirationDate] = useState("1/07/2026");

  // TO Section (Client details)
  const [clientName, setClientName] = useState("Edward Brinkmann");
  const [streetAddress, setStreetAddress] = useState("3606 Enterprise Ave");
  const [cityCountry, setCityCountry] = useState("FL-34104 Naples, United States");

  // FROM Section (Operator details)
  const [operatorName, setOperatorName] = useState(defaultOperator.companyName);
  const [repName, setRepName] = useState(defaultOperator.representativeName);
  const [operatorEmail, setOperatorEmail] = useState(defaultOperator.supportEmail);
  const [operatorPhone, setOperatorPhone] = useState(defaultOperator.supportPhone);
  const [operatorVat, setOperatorVat] = useState(defaultOperator.vatNumber);

  // JET DETAILS Section
  const [aircraftName, setAircraftName] = useState("Cessna Citation Mustang");
  const [aircraftRegistration, setAircraftRegistration] = useState("OE-FFB");
  const [yearOfManufacture, setYearOfManufacture] = useState("2015");
  const [yearOfRefurbishment, setYearOfRefurbishment] = useState("0");
  const [passengerSeats, setPassengerSeats] = useState(5);
  const [smokingCabin, setSmokingCabin] = useState(false);
  const [toilette, setToilette] = useState(true);

  // ROUTING Legs Array (matches PDF Flight Brief routing with Crew, Manifest, Handling per leg)
  const [legs, setLegs] = useState<EditableLegBrief[]>([
    {
      legNumber: 1,
      flightDate: "03/07/2026",
      originIcao: "LFMN",
      destIcao: "LSZR",
      departureTime: "08:00",
      arrivalTime: "09:15",
      flightTimeFormatted: "1h 15m",
      paxCount: 2,
      flightNumber: "PEA501",
      aircraftRegistration: "F-HSBL",
      cmdrName: "Steffen AZAM",
      cmdrPhone: "+33 6 61 39 47 63",
      foName: "Franklin BONNIVEAU",
      foPhone: "+33 6 61 39 47 00",
      faName: "Claire Dupont",
      faPhone: "+33 6 44 19 88 03",
      passengerNames: "Luca Cesare Armando Ceretti, Marc Edouard Dwek",
      depHandlerName: "Aviavip",
      depHandlerPhone: "+33 493 213737",
      depHandlerEmail: "nce.executive@aviapartner.aero",
      arrHandlerName: "Airport Altenrhein",
      arrHandlerPhone: "+41 71 858 5165",
      arrHandlerEmail: "c-office@peoples.ch"
    },
    {
      legNumber: 2,
      flightDate: "03/07/2026",
      originIcao: "LSZR",
      destIcao: "LFMN",
      departureTime: "16:00",
      arrivalTime: "17:15",
      flightTimeFormatted: "1h 15m",
      paxCount: 2,
      flightNumber: "PEA501",
      aircraftRegistration: "F-HSBL",
      cmdrName: "Steffen AZAM",
      cmdrPhone: "+33 6 61 39 47 63",
      foName: "Franklin BONNIVEAU",
      foPhone: "+33 6 61 39 47 00",
      faName: "Claire Dupont",
      faPhone: "+33 6 44 19 88 03",
      passengerNames: "Luca Cesare Armando Ceretti, Marc Edouard Dwek",
      depHandlerName: "Airport Altenrhein",
      depHandlerPhone: "+41 71 858 5165",
      depHandlerEmail: "c-office@peoples.ch",
      arrHandlerName: "Aviavip",
      arrHandlerPhone: "+33 493 213737",
      arrHandlerEmail: "nce.executive@aviapartner.aero"
    }
  ]);

  const [operationalNotes, setOperationalNotes] = useState(
    "Eurocontrol slot filed and confirmed. APIS & Passports submitted. VIP ramp transfer requested upon arrival."
  );

  const [success, setSuccess] = useState(false);

  // Filter bookings by Trip ID or Client's Name
  const matchingBookings = bookings.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const tripMatch = (b.tripNumber || "").toLowerCase().includes(q);
    const quoteMatch = (b.quoteReference || "").toLowerCase().includes(q);
    const clientMatch = (b.client?.fullName || "").toLowerCase().includes(q);
    const companyMatch = (b.client?.companyName || "").toLowerCase().includes(q);
    const aircraftMatch = (b.aircraft?.name || "").toLowerCase().includes(q);
    const routeMatch = (b.legs || []).some(
      (l) =>
        (l.origin?.icao || "").toLowerCase().includes(q) ||
        (l.destination?.icao || "").toLowerCase().includes(q) ||
        (l.origin?.city || "").toLowerCase().includes(q) ||
        (l.destination?.city || "").toLowerCase().includes(q)
    );
    return tripMatch || quoteMatch || clientMatch || companyMatch || aircraftMatch || routeMatch;
  });

  // Sync state when picking a booking
  const handleBookingChange = (id: string) => {
    setSelectedBookingId(id);
    const b = bookings.find((item) => item.id === id);
    if (b) {
      setContractDate(b.contractDate);
      setTripNumber(b.tripNumber);
      setAccountNumber(b.accountNumber);
      setQuoteExpirationDate(b.quoteExpirationDate);

      setClientName(b.client.fullName);
      setStreetAddress(b.client.streetAddress);
      setCityCountry(b.client.cityPostalCountry);

      setOperatorName(b.operator?.companyName || defaultOperator.companyName);
      setRepName(b.operator?.representativeName || defaultOperator.representativeName);
      setOperatorEmail(b.operator?.supportEmail || defaultOperator.supportEmail);
      setOperatorPhone(b.operator?.supportPhone || defaultOperator.supportPhone);
      setOperatorVat(b.operator?.vatNumber || defaultOperator.vatNumber);

      setAircraftName(b.aircraft?.name || "Cessna Citation Mustang");
      setAircraftRegistration(b.aircraft?.registration || "OE-FFB");
      setYearOfManufacture(String(b.aircraft?.yearOfManufacture || "2015"));
      setYearOfRefurbishment(String(b.aircraft?.yearOfRefurbishment || "0"));
      setPassengerSeats(b.aircraft?.passengers || 5);
      setSmokingCabin(b.aircraft?.smokingCabin || false);
      setToilette(b.aircraft?.toilette !== false);

      if (b.legs && b.legs.length > 0) {
        setLegs(
          b.legs.map((leg, idx) => {
            const cmdr = leg.crew?.find((c) => c.role === "CMDR") || {
              name: "Capt. Alexander Vance",
              phone: "+44 7700 900842"
            };
            const fo = leg.crew?.find((c) => c.role === "F/O") || {
              name: "Marcus Lindqvist",
              phone: "+44 7700 900890"
            };
            const fa = leg.crew?.find((c) => c.role === "Cabin Attendant") || {
              name: "Claire Dupont",
              phone: "+33 6 44 19 88 03"
            };
            const pNames = leg.passengers?.map((p) => p.fullName).join(", ") || b.client?.fullName || "VIP Passenger";

            const originIcao = leg.origin?.icao || (leg as any).fromIcao || "LSGG";
            const destIcao = leg.destination?.icao || (leg as any).toIcao || "LIMJ";
            const depFbos = getAirportFbos(originIcao);
            const arrFbos = getAirportFbos(destIcao);

            return {
              legNumber: idx + 1,
              flightDate: leg.flightDate || "03/07/2026",
              originIcao,
              destIcao,
              departureTime: (leg.departureTimeLocal || "10:00").replace(" h", "").trim(),
              arrivalTime: (leg.arrivalTimeLocal || "11:00").replace(" h", "").trim(),
              flightTimeFormatted: leg.flightTimeFormatted || "1h 00m",
              paxCount: leg.paxCount || 2,
              flightNumber: leg.flightNumber || b.tripNumber || "ORB842",
              aircraftRegistration: leg.aircraftRegistration || b.aircraft?.registration || "OE-FFB",
              cmdrName: cmdr.name,
              cmdrPhone: cmdr.phone,
              foName: fo.name,
              foPhone: fo.phone || "",
              faName: fa.name,
              faPhone: fa.phone || "",
              passengerNames: pNames,
              depHandlerName: leg.departureHandling?.name || depFbos[0]?.name || "VIP Handling",
              depHandlerPhone: leg.departureHandling?.phone || depFbos[0]?.phone || "+41 22 717 8400",
              depHandlerEmail: leg.departureHandling?.email || depFbos[0]?.email || "gva@fbo.aero",
              arrHandlerName: leg.arrivalHandling?.name || arrFbos[0]?.name || "VIP Handling",
              arrHandlerPhone: leg.arrivalHandling?.phone || arrFbos[0]?.phone || "+39 010 601 5459",
              arrHandlerEmail: leg.arrivalHandling?.email || arrFbos[0]?.email || "ops@fbo.aero"
            };
          })
        );
      }
    }
  };

  // Mount effect: load initial booking
  useEffect(() => {
    if (selectedBookingId) {
      handleBookingChange(selectedBookingId);
    }
  }, []);

  const handleLegChange = (idx: number, field: keyof EditableLegBrief, value: any) => {
    const updated = [...legs];
    updated[idx] = { ...updated[idx], [field]: value };
    setLegs(updated);
  };

  const handleAddLeg = () => {
    const last = legs[legs.length - 1];
    setLegs([
      ...legs,
      {
        legNumber: legs.length + 1,
        flightDate: last ? last.flightDate : "03/07/2026",
        originIcao: last ? last.destIcao : "LSGG",
        destIcao: "LFMN",
        departureTime: "14:00",
        arrivalTime: "15:15",
        flightTimeFormatted: "1h 15m",
        paxCount: last ? last.paxCount : 2,
        flightNumber: last ? last.flightNumber : "PEA501",
        aircraftRegistration: aircraftRegistration || "F-HSBL",
        cmdrName: last ? last.cmdrName : "Steffen AZAM",
        cmdrPhone: last ? last.cmdrPhone : "+33 6 61 39 47 63",
        foName: last ? last.foName : "Franklin BONNIVEAU",
        foPhone: last ? last.foPhone : "+33 6 61 39 47 00",
        faName: last ? (last.faName || "Claire Dupont") : "Claire Dupont",
        faPhone: last ? (last.faPhone || "+33 6 44 19 88 03") : "+33 6 44 19 88 03",
        passengerNames: last ? last.passengerNames : clientName,
        depHandlerName: "Executive FBO",
        depHandlerPhone: "+33 493 213737",
        depHandlerEmail: "ops@fbo.aero",
        arrHandlerName: "Airport Altenrhein",
        arrHandlerPhone: "+41 71 858 5165",
        arrHandlerEmail: "c-office@peoples.ch"
      }
    ]);
  };

  const handleRemoveLeg = (idx: number) => {
    if (legs.length <= 1) return;
    setLegs(legs.filter((_, i) => i !== idx).map((l, i) => ({ ...l, legNumber: i + 1 })));
  };

  // Important fields validation
  const validationErrors: string[] = [];
  if (!tripNumber.trim()) validationErrors.push("Trip ID / Number is required");
  if (!aircraftRegistration.trim()) validationErrors.push("Aircraft Tail Registration is required");
  if (!clientName.trim()) validationErrors.push("Client Name is required");

  legs.forEach((leg, i) => {
    if (!leg.flightDate.trim()) validationErrors.push(`Leg #${i + 1}: Flight Date is required`);
    if (!leg.originIcao.trim()) validationErrors.push(`Leg #${i + 1}: Origin Airport is required`);
    if (!leg.destIcao.trim()) validationErrors.push(`Leg #${i + 1}: Destination Airport is required`);
    if (!leg.departureTime.trim()) validationErrors.push(`Leg #${i + 1}: Departure Time is required`);
    if (!leg.cmdrName.trim()) validationErrors.push(`Leg #${i + 1}: Pilot / Commander Name is required`);
    if (!leg.passengerNames.trim()) validationErrors.push(`Leg #${i + 1}: At least one Passenger name is required`);
  });

  const isFormValid = validationErrors.length === 0;

  const handleGenerateBrief = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !selectedBooking) return;

    // Build FlightLeg array matching the template
    const compiledLegs: FlightLeg[] = legs.map((leg) => {
      const origAirport = findAirportByCode(leg.originIcao);
      const destAirport = findAirportByCode(leg.destIcao);

      const parsedPassengers: PassengerManifestItem[] = leg.passengerNames
        .split(",")
        .map((p, pIdx) => ({
          id: `pax-${leg.legNumber}-${pIdx}`,
          fullName: p.trim(),
          isLeadPassenger: pIdx === 0
        }))
        .filter((p) => p.fullName.length > 0);

      return {
        legNumber: leg.legNumber,
        flightDate: leg.flightDate,
        origin: origAirport,
        destination: destAirport,
        departureTimeLocal: leg.departureTime.includes("h") ? leg.departureTime : `${leg.departureTime} h`,
        arrivalTimeLocal: leg.arrivalTime.includes("h") ? leg.arrivalTime : `${leg.arrivalTime} h`,
        flightTimeFormatted: leg.flightTimeFormatted || "1h 15m",
        paxCount: leg.paxCount,
        flightNumber: leg.flightNumber,
        aircraftRegistration: leg.aircraftRegistration || aircraftRegistration,
        crew: [
          { role: "CMDR", name: leg.cmdrName, phone: leg.cmdrPhone },
          { role: "F/O", name: leg.foName, phone: leg.foPhone },
          { role: "Cabin Attendant", name: leg.faName || "Claire Dupont", phone: leg.faPhone || "+33 6 44 19 88 03" }
        ],
        passengers: parsedPassengers.length > 0 ? parsedPassengers : [{ id: "p1", fullName: clientName, isLeadPassenger: true }],
        departureHandling: {
          name: leg.depHandlerName,
          airportCode: leg.originIcao,
          phone: leg.depHandlerPhone,
          email: leg.depHandlerEmail
        },
        arrivalHandling: {
          name: leg.arrHandlerName,
          airportCode: leg.destIcao,
          phone: leg.arrHandlerPhone,
          email: leg.arrHandlerEmail
        }
      };
    });

    // Update the booking object in place
    selectedBooking.contractDate = contractDate;
    selectedBooking.tripNumber = tripNumber;
    selectedBooking.accountNumber = accountNumber;
    selectedBooking.quoteExpirationDate = quoteExpirationDate;

    selectedBooking.client.fullName = clientName;
    selectedBooking.client.streetAddress = streetAddress;
    selectedBooking.client.cityPostalCountry = cityCountry;

    selectedBooking.operator.companyName = operatorName;
    selectedBooking.operator.representativeName = repName;
    selectedBooking.operator.supportEmail = operatorEmail;
    selectedBooking.operator.supportPhone = operatorPhone;
    selectedBooking.operator.vatNumber = operatorVat;

    selectedBooking.aircraft.name = aircraftName;
    selectedBooking.aircraft.registration = aircraftRegistration;
    selectedBooking.aircraft.yearOfManufacture = yearOfManufacture;
    selectedBooking.aircraft.yearOfRefurbishment = yearOfRefurbishment;
    selectedBooking.aircraft.passengers = passengerSeats;
    selectedBooking.aircraft.smokingCabin = smokingCabin;
    selectedBooking.aircraft.toilette = toilette;

    selectedBooking.legs = compiledLegs;

    createFlightBrief(selectedBooking).then((saved) => {
      // Automatically sync passengers to contacts linked to the account
      compiledLegs.forEach((leg) => {
        leg.passengers.forEach((pax) => {
          if (pax.fullName && pax.fullName.trim()) {
            syncPassengerToContact(
              pax,
              selectedBooking.accountNumber || selectedBooking.client.accountNumber,
              selectedBooking.client.fullName,
              selectedBooking.tripId || selectedBooking.tripNumber
            );
          }
        });
      });

      setSuccess(true);
      setActiveTab("list");
      openDocument(saved, "flight_brief");
    });
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-[#0F1420] text-white rounded-2xl p-6 sm:p-8 border border-[#1C2436] shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/20 text-[#C9A052] border border-[#C9A052]/40 uppercase flex items-center gap-1">
              <Compass className="w-3 h-3" />
              OPERATIONS DISPATCH CENTER • FLIGHT BRIEFS
            </span>
            <span className="text-gray-400 text-xs font-mono">• {briefsList.length} Active Flight Briefs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Flight Operations Briefs & Generator
          </h1>
          <p className="text-xs text-gray-300 leading-relaxed">
            Review all prepared operational flight briefs, crew assignments, and passenger manifests, view and download official briefs, or generate a new flight operations brief.
          </p>
        </div>

        {/* Tab Switcher at Top Right */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#141A29] border border-[#1C2436]">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "list"
                ? "bg-[#C9A052] text-[#0F1420] shadow-sm font-black"
                : "text-gray-300 hover:text-white"
            }`}
          >
            All Generated Briefs ({briefsList.length})
          </button>
          <button
            onClick={() => setActiveTab("builder")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "builder"
                ? "bg-[#C9A052] text-[#0F1420] shadow-sm font-black"
                : "text-gray-300 hover:text-white"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate New Brief</span>
          </button>
        </div>
      </div>

      {activeTab === "list" ? (
        <div className="space-y-5">
          {/* Search & Status Filters */}
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={listSearchQuery}
                onChange={(e) => setListSearchQuery(e.target.value)}
                placeholder="Search by Trip ID (e.g. PEU842-001), Client, Aircraft, or Airport code..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E0DAD0] bg-[#F5F2EC] text-xs text-[#0F1420] font-medium placeholder-gray-400 focus:outline-none focus:border-[#C9A052] focus:bg-white transition-all"
              />
              {listSearchQuery && (
                <button
                  onClick={() => setListSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setListStatusFilter("all")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  listStatusFilter === "all" ? "bg-[#0F1420] text-white" : "bg-[#F5F2EC] text-gray-700 hover:bg-[#EBE5DB]"
                }`}
              >
                All Missions
              </button>
              <button
                onClick={() => setListStatusFilter("confirmed")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  listStatusFilter === "confirmed" ? "bg-[#0F1420] text-white" : "bg-[#F5F2EC] text-gray-700 hover:bg-[#EBE5DB]"
                }`}
              >
                Confirmed
              </button>
              <button
                onClick={() => setListStatusFilter("dispatched")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  listStatusFilter === "dispatched" ? "bg-[#0F1420] text-white" : "bg-[#F5F2EC] text-gray-700 hover:bg-[#EBE5DB]"
                }`}
              >
                Dispatched
              </button>
              <button
                onClick={() => setListStatusFilter("completed")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  listStatusFilter === "completed" ? "bg-[#0F1420] text-white" : "bg-[#F5F2EC] text-gray-700 hover:bg-[#EBE5DB]"
                }`}
              >
                Completed
              </button>
            </div>
          </div>

          {/* Flight Briefs List Cards */}
          <div className="space-y-4">
            {filteredBriefs.map((brief) => {
              const isDispatched = brief.status === "dispatched" || brief.status === "in_flight";
              const isCompleted = brief.status === "completed" || brief.status === "flown";
              const cmdrName = brief.legs[0]?.crew?.find((c) => c.role === "CMDR")?.name || "Capt. Alexander Vance";
              const paxCount = brief.legs[0]?.passengers?.length || brief.legs[0]?.paxCount || 2;

              return (
                <div
                  key={brief.id}
                  className="bg-white border border-[#E0DAD0] hover:border-[#C9A052] rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 group"
                >
                  {/* Left: Trip ID & Route */}
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#E0DAD0] flex items-center justify-center flex-shrink-0 group-hover:border-[#C9A052] transition-colors">
                      <Compass className="w-6 h-6 text-[#C9A052]" />
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-black text-[#0F1420] px-2.5 py-0.5 rounded bg-[#F5F2EC] border border-[#E0DAD0]">
                          {brief.tripNumber}
                        </span>
                        <span className="text-xs font-mono text-gray-500 font-bold">
                          Tail: {brief.aircraft.registration || "OE-FFB"}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                            isCompleted
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : isDispatched
                              ? "bg-blue-100 text-blue-800 border-blue-300"
                              : "bg-amber-100 text-amber-800 border-amber-300"
                          }`}
                        >
                          {isCompleted ? "MISSION COMPLETED" : isDispatched ? "DISPATCHED / ACTIVE" : "READY FOR DISPATCH"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-[#0F1420]">
                          {brief.legs[0]?.origin.city || "Geneva"} ({brief.legs[0]?.origin.icao})
                        </h3>
                        <span className="text-[#C9A052] font-bold">⇄</span>
                        <h3 className="text-base font-extrabold text-[#0F1420]">
                          {brief.legs[0]?.destination.city || "Genoa"} ({brief.legs[0]?.destination.icao})
                        </h3>
                        {brief.legs.length > 2 && (
                          <span className="text-xs text-gray-400 font-mono">+{brief.legs.length - 1} legs</span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span className="font-semibold text-[#0F1420] flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span>{brief.client.fullName}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span>{paxCount} Pax Manifest</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <Shield className="w-3.5 h-3.5 text-gray-400" />
                          <span>PIC: {cmdrName}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Aircraft & Actions */}
                  <div className="flex items-center justify-between lg:justify-end gap-4 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                    <div className="text-left lg:text-right">
                      <div className="text-[10px] font-mono text-gray-400 uppercase">Assigned Aircraft</div>
                      <div className="text-sm font-black text-[#0F1420]">
                        {brief.aircraft.name}
                      </div>
                      <div className="text-[10px] font-mono text-gray-500">
                        {brief.legs.length} Leg(s) Scheduled
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openDocument(brief, "flight_brief")}
                        className="px-3.5 py-2 rounded-xl bg-[#0F1420] hover:bg-[#1A2338] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                        title="View official flight operations brief PDF"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#C9A052]" />
                        <span>View PDF</span>
                      </button>

                      <button
                        onClick={() => {
                          handleBookingChange(brief.id);
                          setActiveTab("builder");
                        }}
                        className="px-3 py-2 rounded-xl bg-[#F5F2EC] hover:bg-[#EBE5DB] text-[#0F1420] text-xs font-bold transition-all border border-[#E0DAD0] flex items-center gap-1 cursor-pointer"
                        title="Reconfigure or edit flight brief details"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredBriefs.length === 0 && (
              <div className="bg-white border border-[#E0DAD0] rounded-2xl p-12 text-center space-y-4">
                <Compass className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="text-base font-bold text-[#0F1420]">No Flight Briefs Found</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  No active flight briefs matched your search criteria. Generate a new operational flight brief.
                </p>
                <button
                  onClick={() => setActiveTab("builder")}
                  className="px-5 py-2.5 rounded-xl bg-[#C9A052] text-[#0F1420] font-black text-xs transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Generate New Brief</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Flight Brief Builder Form */
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
          {/* Back to List Navigation Banner */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveTab("list")}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#0F1420] hover:text-[#C9A052] transition-colors bg-white px-4 py-2 rounded-xl border border-[#E0DAD0] shadow-sm cursor-pointer"
            >
              ← Back to All Flight Briefs
            </button>
            <span className="text-xs font-mono text-gray-500">Brief Compiler Mode</span>
          </div>

          {/* View Header */}
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/15 text-[#9A7A35] border border-[#C9A052]/30">
                  OPERATIONS DISPATCH CENTER
                </span>
                <span className="text-xs text-[#0F1420]/60">Flight Brief PDF Generator</span>
              </div>
              <h2 className="text-xl font-black text-[#0F1420] tracking-tight">
                Generate Flight Operations Brief
              </h2>
              <p className="text-xs text-[#0F1420]/65 mt-0.5">
                Prepare mission operational brief for flight crew, handling agents, passenger manifest, and dispatch center.
              </p>
            </div>

            {/* Quick Trip Selector Fallback */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#0F1420]/70">Active Trip:</span>
              <select
                value={selectedBookingId}
                onChange={(e) => handleBookingChange(e.target.value)}
                className="bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              >
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.tripNumber} ({b.client?.fullName} • {b.aircraft?.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

      {/* Primary Search Bar: Search by Trip ID or Client's Name */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-5 shadow-sm space-y-3 relative">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F1420] flex items-center gap-2">
            <Search className="w-4 h-4 text-[#C9A052]" />
            Search Flights by Trip ID or Client's Name
          </label>
          <span className="text-[11px] text-gray-500 font-mono">
            {matchingBookings.length} matching missions
          </span>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Type Trip ID (e.g. PEU842, ZFL433) or Client Name (e.g. Edward Brinkmann, Somaco)..."
            className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl pl-10 pr-20 py-3 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052] transition-all shadow-inner"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setIsSearchOpen(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-mono text-gray-500 hover:text-gray-900 bg-gray-200 hover:bg-gray-300 rounded"
            >
              Clear
            </button>
          )}

          {/* Floating Live Results Dropdown */}
          {isSearchOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E0DAD0] rounded-xl shadow-2xl z-40 max-h-72 overflow-y-auto divide-y divide-[#E0DAD0]">
              {matchingBookings.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-500">
                  No flights found matching "{searchQuery}".
                </div>
              ) : (
                matchingBookings.map((b) => {
                  const firstLeg = b.legs?.[0];
                  return (
                    <div
                      key={b.id}
                      onClick={() => {
                        handleBookingChange(b.id);
                        setIsSearchOpen(false);
                        setSearchQuery("");
                      }}
                      className={`p-3.5 hover:bg-[#F5F2EC] cursor-pointer transition-colors flex items-center justify-between text-xs ${
                        b.id === selectedBookingId ? "bg-[#C9A052]/10 border-l-4 border-[#C9A052]" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="font-mono font-black text-[#0F1420] text-sm">
                            {b.tripNumber}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {b.quoteReference || b.id}
                          </span>
                        </div>
                        <div className="border-l border-gray-300 pl-3">
                          <p className="font-bold text-[#0F1420]">{b.client?.fullName}</p>
                          {b.client?.companyName && (
                            <p className="text-[10px] text-gray-500">{b.client.companyName}</p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-bold text-[#C9A052] text-xs">
                          {firstLeg?.origin?.icao || (firstLeg as any)?.fromIcao || "---"} → {firstLeg?.destination?.icao || (firstLeg as any)?.toIcao || "---"}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {b.aircraft?.name} • {firstLeg?.flightDate || b.contractDate}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Active Loaded Summary Bar */}
        <div className="flex items-center justify-between text-xs bg-[#F5F2EC] px-3.5 py-2 rounded-xl border border-[#E0DAD0]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase font-mono text-gray-500 font-bold">Selected Trip:</span>
            <span className="font-mono font-bold text-[#0F1420] bg-white px-2 py-0.5 rounded border border-[#E0DAD0]">{tripNumber}</span>
            <span className="text-gray-400">•</span>
            <span className="font-bold text-[#0F1420]">{clientName}</span>
            <span className="text-gray-400">•</span>
            <span className="font-mono text-gray-600">{aircraftName} ({aircraftRegistration})</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
            Loaded for Flight Brief
          </span>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Flight Brief for {tripNumber} ({clientName}) compiled and opened successfully!</span>
          </div>
        </div>
      )}

      <form onSubmit={handleGenerateBrief} className="space-y-6">
        
        {/* SECTION 1: Document Metadata & Details Box */}
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E0DAD0]">
            <FileText className="w-4 h-4 text-[#C9A052]" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
              1. Brief Document References (DETAILS Box)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Contract Date
              </label>
              <input
                type="text"
                value={contractDate}
                onChange={(e) => setContractDate(e.target.value)}
                required
                placeholder="30/06/2026"
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Trip No.
              </label>
              <input
                type="text"
                value={tripNumber}
                readOnly
                placeholder="Assigned by the server"
                title="Trip number is assigned by the backend"
                className="w-full bg-gray-100 border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-[#0F1420] cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Account No.
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
                placeholder="284169"
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Quote Expiration
              </label>
              <input
                type="text"
                value={quoteExpirationDate}
                onChange={(e) => setQuoteExpirationDate(e.target.value)}
                required
                placeholder="1/07/2026"
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-red-600 focus:outline-none focus:border-[#C9A052]"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: TO & FROM Entities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* TO: Client Information */}
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E0DAD0]">
              <User className="w-4 h-4 text-[#C9A052]" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                2. Client / Passenger Party (TO)
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  Client / Company Name
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  placeholder="Somaco SAM"
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="5, av. Princesse Grace - MC98000"
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  City & Country
                </label>
                <input
                  type="text"
                  value={cityCountry}
                  onChange={(e) => setCityCountry(e.target.value)}
                  placeholder="Monaco, Monaco"
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>
            </div>
          </div>

          {/* FROM: Flight Operations Center */}
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E0DAD0]">
              <Building className="w-4 h-4 text-[#C9A052]" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                3. Operations Provider (FROM)
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                    Representative
                  </label>
                  <input
                    type="text"
                    value={repName}
                    onChange={(e) => setRepName(e.target.value)}
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={operatorEmail}
                    onChange={(e) => setOperatorEmail(e.target.value)}
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                    Support Phone
                  </label>
                  <input
                    type="tel"
                    value={operatorPhone}
                    onChange={(e) => setOperatorPhone(e.target.value)}
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  VAT Number
                </label>
                <input
                  type="text"
                  value={operatorVat}
                  onChange={(e) => setOperatorVat(e.target.value)}
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Jet Details (Aircraft Specifications) */}
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E0DAD0]">
            <Plane className="w-4 h-4 text-[#C9A052]" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
              4. Aircraft Specifications (JET DETAILS Box)
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 text-xs">
            <div className="col-span-2">
              <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                Aircraft Model
              </label>
              <input
                type="text"
                value={aircraftName}
                onChange={(e) => setAircraftName(e.target.value)}
                required
                placeholder="Embraer Phenom 100"
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                Registration / Tail
              </label>
              <input
                type="text"
                value={aircraftRegistration}
                onChange={(e) => setAircraftRegistration(e.target.value)}
                required
                placeholder="F-HSBL"
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                Year of Manufacture
              </label>
              <input
                type="text"
                value={yearOfManufacture}
                onChange={(e) => setYearOfManufacture(e.target.value)}
                placeholder="2015"
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                Year of Refurbishment
              </label>
              <input
                type="text"
                value={yearOfRefurbishment}
                onChange={(e) => setYearOfRefurbishment(e.target.value)}
                placeholder="0"
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                Passenger Seats
              </label>
              <input
                type="number"
                min={1}
                max={19}
                value={passengerSeats}
                onChange={(e) => setPassengerSeats(Number(e.target.value))}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                Toilette
              </label>
              <select
                value={toilette ? "yes" : "no"}
                onChange={(e) => setToilette(e.target.value === "yes")}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-2.5 py-2 text-xs font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              >
                <option value="yes">YES</option>
                <option value="no">NO</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 4: ROUTING, CREW, PASSENGERS & FBO HANDLING PER LEG */}
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E0DAD0]">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#C9A052]" />
              <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                5. Routing Itinerary, Assigned Crew & Ground Handling (Per Leg)
              </h3>
            </div>

            <button
              type="button"
              onClick={handleAddLeg}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F1420] text-white hover:bg-[#1A2338] text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-[#C9A052]" />
              <span>Add Brief Leg</span>
            </button>
          </div>

          <div className="space-y-6">
            {legs.map((leg, index) => (
              <div
                key={index}
                className="p-5 rounded-2xl bg-[#F5F2EC] border border-[#E0DAD0] space-y-4 shadow-sm"
              >
                {/* Leg Header */}
                <div className="flex items-center justify-between border-b border-[#E0DAD0] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-[#0F1420] text-[#C9A052] font-mono font-bold text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-xs font-mono font-extrabold text-[#0F1420]">
                      Brief Leg #{index + 1}: {leg.originIcao} → {leg.destIcao} ({leg.flightDate})
                    </span>
                  </div>

                  {legs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLeg(index)}
                      className="flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-800 bg-red-100 hover:bg-red-200 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove Leg</span>
                    </button>
                  )}
                </div>

                {/* Leg Itinerary Grid: Date, Origin, Dest, Dep, Arr, Duration, Pax, Callsign, Reg */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-9 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                      Date
                    </label>
                    <input
                      type="text"
                      placeholder="03/07/2026"
                      value={leg.flightDate}
                      onChange={(e) => handleLegChange(index, "flightDate", e.target.value)}
                      required
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                      <Lock className="w-3 h-3 text-[#C9A052]" />
                      <span>From (Airport) — Locked Route</span>
                    </label>
                    <div className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-2.5 py-2 text-xs font-mono font-bold text-[#0F1420] flex items-center justify-between" title="Origin airport is locked to confirmed booking routing. To change, revise the booking.">
                      <div className="truncate">
                        <span className="text-[#C9A052] font-black mr-1.5">[{leg.originIcao}]</span>
                        <span>{findAirportByCode(leg.originIcao)?.city || leg.originIcao} — {findAirportByCode(leg.originIcao)?.name || ""}</span>
                      </div>
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#0F1420]/10 text-gray-600 flex-shrink-0 ml-1">LOCKED</span>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                      <Lock className="w-3 h-3 text-[#C9A052]" />
                      <span>To (Airport) — Locked Route</span>
                    </label>
                    <div className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-2.5 py-2 text-xs font-mono font-bold text-[#0F1420] flex items-center justify-between" title="Destination airport is locked to confirmed booking routing. To change, revise the booking.">
                      <div className="truncate">
                        <span className="text-[#C9A052] font-black mr-1.5">[{leg.destIcao}]</span>
                        <span>{findAirportByCode(leg.destIcao)?.city || leg.destIcao} — {findAirportByCode(leg.destIcao)?.name || ""}</span>
                      </div>
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#0F1420]/10 text-gray-600 flex-shrink-0 ml-1">LOCKED</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                      Departure
                    </label>
                    <input
                      type="text"
                      placeholder="08:00"
                      value={leg.departureTime}
                      onChange={(e) => handleLegChange(index, "departureTime", e.target.value)}
                      required
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                      Arrival
                    </label>
                    <input
                      type="text"
                      placeholder="09:15"
                      value={leg.arrivalTime}
                      onChange={(e) => handleLegChange(index, "arrivalTime", e.target.value)}
                      required
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                      Flight Time
                    </label>
                    <input
                      type="text"
                      placeholder="1h 15m"
                      value={leg.flightTimeFormatted}
                      onChange={(e) => handleLegChange(index, "flightTimeFormatted", e.target.value)}
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                      Pax Count
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={leg.paxCount}
                      onChange={(e) => handleLegChange(index, "paxCount", Number(e.target.value))}
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                      Flight #
                    </label>
                    <input
                      type="text"
                      placeholder="PEA501"
                      value={leg.flightNumber}
                      onChange={(e) => handleLegChange(index, "flightNumber", e.target.value)}
                      required
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                      Tail Reg.
                    </label>
                    <input
                      type="text"
                      placeholder="F-HSBL"
                      value={leg.aircraftRegistration}
                      onChange={(e) => handleLegChange(index, "aircraftRegistration", e.target.value)}
                      required
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                </div>

                {/* Crew & Passenger Manifest Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-3.5 rounded-xl border border-[#E0DAD0]">
                  {/* Crew Assignment for this leg */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase text-[#0F1420]">
                      <Shield className="w-3.5 h-3.5 text-[#C9A052]" />
                      <span>Assigned Crew (Leg #{index + 1})</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-gray-500 mb-0.5">CMDR Name</label>
                        <input
                          type="text"
                          placeholder="Steffen AZAM"
                          value={leg.cmdrName}
                          onChange={(e) => handleLegChange(index, "cmdrName", e.target.value)}
                          className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-gray-500 mb-0.5">CMDR Phone</label>
                        <input
                          type="tel"
                          placeholder="+33 6 61 39 47 63"
                          value={leg.cmdrPhone}
                          onChange={(e) => handleLegChange(index, "cmdrPhone", e.target.value)}
                          className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-gray-500 mb-0.5">F/O Name</label>
                        <input
                          type="text"
                          placeholder="Franklin BONNIVEAU"
                          value={leg.foName}
                          onChange={(e) => handleLegChange(index, "foName", e.target.value)}
                          className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-gray-500 mb-0.5">F/O Phone</label>
                        <input
                          type="tel"
                          placeholder="+33 6 61 39 47 00"
                          value={leg.foPhone}
                          onChange={(e) => handleLegChange(index, "foPhone", e.target.value)}
                          className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-gray-500 mb-0.5">Flight Attendant Name</label>
                        <input
                          type="text"
                          placeholder="Claire Dupont"
                          value={leg.faName || ""}
                          onChange={(e) => handleLegChange(index, "faName", e.target.value)}
                          className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-gray-500 mb-0.5">Flight Attendant Phone</label>
                        <input
                          type="tel"
                          placeholder="+33 6 44 19 88 03"
                          value={leg.faPhone || ""}
                          onChange={(e) => handleLegChange(index, "faPhone", e.target.value)}
                          className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Passenger Manifest for this leg */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase text-[#0F1420]">
                      <Users className="w-3.5 h-3.5 text-[#C9A052]" />
                      <span>Passenger Manifest (Leg #{index + 1})</span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-mono uppercase text-gray-500">
                          Select from Contacts Directory
                        </label>
                        <span className="text-[10px] text-[#C9A052] font-mono">
                          {contacts.length} Contacts available
                        </span>
                      </div>
                      <select
                        onChange={(e) => {
                          const contactId = e.target.value;
                          if (!contactId) return;
                          const found = contacts.find((c) => c.id === contactId);
                          if (found) {
                            const fullName = [found.firstName, found.middleName, found.lastName].filter(Boolean).join(" ");
                            const current = leg.passengerNames.trim();
                            const updatedNames = current ? `${current}, ${fullName}` : fullName;
                            handleLegChange(index, "passengerNames", updatedNames);
                          }
                          e.target.value = "";
                        }}
                        className="w-full bg-white border border-[#C9A052]/50 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#0F1420] focus:outline-none focus:border-[#C9A052] mb-2"
                      >
                        <option value="">-- Add Passenger From Contacts Directory --</option>
                        {contacts.map((c) => {
                          const fullName = [c.firstName, c.middleName, c.lastName].filter(Boolean).join(" ");
                          const bioDocNumber = c.bioIdType === "passport"
                            ? c.passportDetails?.passportNumber
                            : c.bioIdType === "id"
                            ? c.idDetails?.idNumber
                            : c.visaDetails?.visaNumber;
                          const bioInfo = c.bioIdType ? `[${c.bioIdType.toUpperCase()}: ${bioDocNumber || "On File"}]` : "";
                          const weightInfo = c.weightKg ? `(${c.weightKg} kg)` : "";
                          return (
                            <option key={c.id} value={c.id}>
                              {fullName} {c.country ? `• ${c.country}` : ""} {bioInfo} {weightInfo}
                            </option>
                          );
                        })}
                      </select>

                      <label className="block text-[10px] font-mono uppercase text-gray-500 mb-0.5">
                        Passenger Names (Or type custom names, comma-separated) *
                      </label>
                      <textarea
                        rows={3}
                        placeholder="e.g. Luca Cesare Armando Ceretti, Marc Edouard Dwek"
                        value={leg.passengerNames}
                        onChange={(e) => handleLegChange(index, "passengerNames", e.target.value)}
                        className={`w-full bg-[#FDFCFA] border rounded-lg px-2.5 py-1.5 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052] ${
                          !leg.passengerNames.trim() ? "border-amber-400 bg-amber-50/20" : "border-[#E0DAD0]"
                        }`}
                      />
                      {!leg.passengerNames.trim() && (
                        <p className="text-[10px] text-amber-700 font-mono mt-0.5">
                          * Warning: Passenger manifest cannot be empty for flight brief.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ground Handling Agents for this Leg (Departure & Arrival) */}
                <div className="bg-white p-3.5 rounded-xl border border-[#E0DAD0] space-y-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase text-[#0F1420]">
                    <Building className="w-3.5 h-3.5 text-[#C9A052]" />
                    <span>FBO Ground Handling Contacts (Leg #{index + 1})</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Departure Handler */}
                    <div className="p-3 bg-[#F9F8F5] rounded-xl border border-[#E0DAD0] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase text-[#9A7A35]">
                          Departure Handler: {leg.originIcao}
                        </span>
                        {getAirportFbos(leg.originIcao).length > 0 && (
                          <span className="text-[9px] text-gray-500 font-mono">
                            {getAirportFbos(leg.originIcao).length} FBOs available
                          </span>
                        )}
                      </div>

                      {/* Airport FBO Directory Picker */}
                      {getAirportFbos(leg.originIcao).length > 0 && (
                        <select
                          onChange={(e) => {
                            const found = getAirportFbos(leg.originIcao).find((f) => f.id === e.target.value);
                            if (found) {
                              const updated = [...legs];
                              updated[index].depHandlerName = found.name;
                              updated[index].depHandlerPhone = found.phone || "";
                              updated[index].depHandlerEmail = found.email || "";
                              setLegs(updated);
                            }
                          }}
                          className="w-full bg-white border border-[#C9A052]/50 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                        >
                          <option value="">-- Quick Select from Airport FBO Directory --</option>
                          {getAirportFbos(leg.originIcao).map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} {f.phone ? `• ${f.phone}` : ""}
                            </option>
                          ))}
                        </select>
                      )}

                      <input
                        type="text"
                        placeholder="Agent Name (e.g. Jet Aviation)"
                        value={leg.depHandlerName}
                        onChange={(e) => handleLegChange(index, "depHandlerName", e.target.value)}
                        className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="tel"
                          placeholder="Phone: +41 22 717 8400"
                          value={leg.depHandlerPhone}
                          onChange={(e) => handleLegChange(index, "depHandlerPhone", e.target.value)}
                          className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                        />
                        <input
                          type="email"
                          placeholder="Email: gva@jetaviation.com"
                          value={leg.depHandlerEmail}
                          onChange={(e) => handleLegChange(index, "depHandlerEmail", e.target.value)}
                          className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                        />
                      </div>
                    </div>

                    {/* Arrival Handler */}
                    <div className="p-3 bg-[#F9F8F5] rounded-xl border border-[#E0DAD0] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase text-[#9A7A35]">
                          Arrival Handler: {leg.destIcao}
                        </span>
                        {getAirportFbos(leg.destIcao).length > 0 && (
                          <span className="text-[9px] text-gray-500 font-mono">
                            {getAirportFbos(leg.destIcao).length} FBOs available
                          </span>
                        )}
                      </div>

                      {/* Airport FBO Directory Picker */}
                      {getAirportFbos(leg.destIcao).length > 0 && (
                        <select
                          onChange={(e) => {
                            const found = getAirportFbos(leg.destIcao).find((f) => f.id === e.target.value);
                            if (found) {
                              const updated = [...legs];
                              updated[index].arrHandlerName = found.name;
                              updated[index].arrHandlerPhone = found.phone || "";
                              updated[index].arrHandlerEmail = found.email || "";
                              setLegs(updated);
                            }
                          }}
                          className="w-full bg-white border border-[#C9A052]/50 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                        >
                          <option value="">-- Quick Select from Airport FBO Directory --</option>
                          {getAirportFbos(leg.destIcao).map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} {f.phone ? `• ${f.phone}` : ""}
                            </option>
                          ))}
                        </select>
                      )}

                      <input
                        type="text"
                        placeholder="Agent Name (e.g. Genoa Aviation Services)"
                        value={leg.arrHandlerName}
                        onChange={(e) => handleLegChange(index, "arrHandlerName", e.target.value)}
                        className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="tel"
                          placeholder="Phone: +39 010 601 5459"
                          value={leg.arrHandlerPhone}
                          onChange={(e) => handleLegChange(index, "arrHandlerPhone", e.target.value)}
                          className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                        />
                        <input
                          type="email"
                          placeholder="Email: ops@genoa-aviation.it"
                          value={leg.arrHandlerEmail}
                          onChange={(e) => handleLegChange(index, "arrHandlerEmail", e.target.value)}
                          className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 5: Operational Notes */}
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E0DAD0]">
            <Clock className="w-4 h-4 text-[#C9A052]" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
              6. Flight Dispatch Notes & Handling Instructions
            </h3>
          </div>

          <textarea
            rows={3}
            value={operationalNotes}
            onChange={(e) => setOperationalNotes(e.target.value)}
            className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl p-3 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
          />
        </div>

        {/* Warning Validation Alert if important fields are missing */}
        {!isFormValid && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/60 text-amber-900 shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-900">
                Submission Blocked — Required Important Operational Fields Missing ({validationErrors.length})
              </h4>
            </div>
            <p className="text-xs text-amber-800">
              Please complete all critical flight dispatch fields before generating the official Flight Brief PDF:
            </p>
            <ul className="list-disc list-inside text-xs font-mono text-amber-900 space-y-0.5 pl-2">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Submission Action Bar */}
        <div className="bg-[#0F1420] text-white border border-[#1C2436] rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-mono tracking-wider text-[#C9A052] font-bold">
              READY FOR OPERATIONAL DISPATCH
            </span>
            <p className="text-sm font-bold text-white font-mono mt-0.5">
              Trip {tripNumber} • {legs.length} Leg(s) • Tail {aircraftRegistration} • {clientName}
            </p>
            <p className="text-xs text-gray-400">
              Compliant with EASA Part-CAT & Austrian Aviation standards
            </p>
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            className={`py-3.5 px-8 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 ${
              isFormValid
                ? "bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] cursor-pointer"
                : "bg-gray-800 text-gray-400 border border-gray-700 cursor-not-allowed opacity-75"
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>{isFormValid ? "Generate & Open Flight Brief PDF" : "Complete Required Fields to Generate"}</span>
          </button>
        </div>
      </form>
    </div>
  )}
</div>
  );
}
