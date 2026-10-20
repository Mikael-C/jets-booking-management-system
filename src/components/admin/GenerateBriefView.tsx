"use client";

import React, { useState, useEffect } from "react";
import { useAviation } from "@/lib/aviationContext";
import { Booking, FlightLeg, CrewMember, HandlingAgent, PassengerManifestItem } from "@/types/aviation";
import { airportsData, findAirportByCode } from "@/data/airports";
import { fleetData } from "@/data/fleet";
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
  ChevronRight
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
  passengerNames: string;
  depHandlerName: string;
  depHandlerPhone: string;
  depHandlerEmail: string;
  arrHandlerName: string;
  arrHandlerPhone: string;
  arrHandlerEmail: string;
}

export default function GenerateBriefView() {
  const { bookings, openDocument } = useAviation();

  const [selectedBookingId, setSelectedBookingId] = useState<string>(bookings[0]?.id || "");
  const selectedBooking = bookings.find((b) => b.id === selectedBookingId) || bookings[0];

  // Document Identifiers (Flight Brief DETAILS box)
  const [contractDate, setContractDate] = useState("30/06/2026");
  const [tripNumber, setTripNumber] = useState("ZFL433");
  const [accountNumber, setAccountNumber] = useState("284169");
  const [quoteExpirationDate, setQuoteExpirationDate] = useState("1/07/2026");

  // TO Section (Client details)
  const [clientName, setClientName] = useState("Somaco SAM");
  const [streetAddress, setStreetAddress] = useState("5, av. Princesse Grace - MC98000");
  const [cityCountry, setCityCountry] = useState("Monaco, Monaco");

  // FROM Section (Operator details)
  const [operatorName, setOperatorName] = useState("GlobeAir AG");
  const [repName, setRepName] = useState("Ezeokeke, Obiefuna");
  const [operatorEmail, setOperatorEmail] = useState("customercare@globeair.com");
  const [operatorPhone, setOperatorPhone] = useState("+43 7221727400");
  const [operatorVat, setOperatorVat] = useState("ATU 63357619");

  // JET DETAILS Section
  const [aircraftName, setAircraftName] = useState("Embraer Phenom 100");
  const [aircraftRegistration, setAircraftRegistration] = useState("F-HSBL");
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

      setOperatorName(b.operator.companyName);
      setRepName(b.operator.representativeName);
      setOperatorEmail(b.operator.supportEmail);
      setOperatorPhone(b.operator.supportPhone);
      setOperatorVat(b.operator.vatNumber);

      setAircraftName(b.aircraft.name);
      setAircraftRegistration(b.aircraft.registration || "F-HSBL");
      setYearOfManufacture(String(b.aircraft.yearOfManufacture || "2015"));
      setYearOfRefurbishment(String(b.aircraft.yearOfRefurbishment || "0"));
      setPassengerSeats(b.aircraft.passengers || 5);
      setSmokingCabin(b.aircraft.smokingCabin || false);
      setToilette(b.aircraft.toilette !== false);

      if (b.legs && b.legs.length > 0) {
        setLegs(
          b.legs.map((leg, idx) => {
            const cmdr = leg.crew.find((c) => c.role === "CMDR") || {
              name: "Steffen AZAM",
              phone: "+33 6 61 39 47 63"
            };
            const fo = leg.crew.find((c) => c.role === "F/O") || {
              name: "Franklin BONNIVEAU",
              phone: "+33 6 61 39 47 00"
            };
            const pNames = leg.passengers.map((p) => p.fullName).join(", ") || b.client.fullName;

            return {
              legNumber: idx + 1,
              flightDate: leg.flightDate,
              originIcao: leg.origin.icao,
              destIcao: leg.destination.icao,
              departureTime: leg.departureTimeLocal.replace(" h", "").trim(),
              arrivalTime: leg.arrivalTimeLocal.replace(" h", "").trim(),
              flightTimeFormatted: leg.flightTimeFormatted,
              paxCount: leg.paxCount || 2,
              flightNumber: leg.flightNumber || "PEA501",
              aircraftRegistration: leg.aircraftRegistration || b.aircraft.registration || "F-HSBL",
              cmdrName: cmdr.name,
              cmdrPhone: cmdr.phone,
              foName: fo.name,
              foPhone: fo.phone || "",
              passengerNames: pNames,
              depHandlerName: leg.departureHandling.name || "Aviavip",
              depHandlerPhone: leg.departureHandling.phone || "+33 493 213737",
              depHandlerEmail: leg.departureHandling.email || "ops@handling.aero",
              arrHandlerName: leg.arrivalHandling.name || "Airport Altenrhein",
              arrHandlerPhone: leg.arrivalHandling.phone || "+41 71 858 5165",
              arrHandlerEmail: leg.arrivalHandling.email || "ops@handling.aero"
            };
          })
        );
      }
    }
  };

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

  const handleGenerateBrief = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

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
          { role: "F/O", name: leg.foName, phone: leg.foPhone }
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

    setSuccess(true);
    openDocument(selectedBooking, "flight_brief");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
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

        {/* Trip Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-[#0F1420]/70">Trip:</span>
          <select
            value={selectedBookingId}
            onChange={(e) => handleBookingChange(e.target.value)}
            className="bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
          >
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.tripNumber} ({b.client.fullName} • {b.aircraft.name})
              </option>
            ))}
          </select>
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
                onChange={(e) => setTripNumber(e.target.value)}
                required
                placeholder="ZFL433"
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
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
                    <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                      From (ICAO)
                    </label>
                    <input
                      type="text"
                      placeholder="LFMN"
                      value={leg.originIcao}
                      onChange={(e) => handleLegChange(index, "originIcao", e.target.value)}
                      required
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                      To (ICAO)
                    </label>
                    <input
                      type="text"
                      placeholder="LSZR"
                      value={leg.destIcao}
                      onChange={(e) => handleLegChange(index, "destIcao", e.target.value)}
                      required
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
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
                    </div>
                  </div>

                  {/* Passenger Manifest for this leg */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase text-[#0F1420]">
                      <Users className="w-3.5 h-3.5 text-[#C9A052]" />
                      <span>Passenger Manifest (Leg #{index + 1})</span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-gray-500 mb-0.5">
                        Passenger Names (Comma-separated)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="e.g. Luca Cesare Armando Ceretti, Marc Edouard Dwek"
                        value={leg.passengerNames}
                        onChange={(e) => handleLegChange(index, "passengerNames", e.target.value)}
                        className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                      />
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
                      <span className="text-[10px] font-mono font-bold uppercase text-[#9A7A35]">
                        Departure Handler: {leg.originIcao}
                      </span>
                      <input
                        type="text"
                        placeholder="Agent Name (e.g. Aviavip)"
                        value={leg.depHandlerName}
                        onChange={(e) => handleLegChange(index, "depHandlerName", e.target.value)}
                        className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="tel"
                          placeholder="Phone: +33 493 213737"
                          value={leg.depHandlerPhone}
                          onChange={(e) => handleLegChange(index, "depHandlerPhone", e.target.value)}
                          className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                        />
                        <input
                          type="email"
                          placeholder="Email: nce.executive@aviapartner.aero"
                          value={leg.depHandlerEmail}
                          onChange={(e) => handleLegChange(index, "depHandlerEmail", e.target.value)}
                          className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                        />
                      </div>
                    </div>

                    {/* Arrival Handler */}
                    <div className="p-3 bg-[#F9F8F5] rounded-xl border border-[#E0DAD0] space-y-2">
                      <span className="text-[10px] font-mono font-bold uppercase text-[#9A7A35]">
                        Arrival Handler: {leg.destIcao}
                      </span>
                      <input
                        type="text"
                        placeholder="Agent Name (e.g. Airport Altenrhein)"
                        value={leg.arrHandlerName}
                        onChange={(e) => handleLegChange(index, "arrHandlerName", e.target.value)}
                        className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="tel"
                          placeholder="Phone: +41 71 858 5165"
                          value={leg.arrHandlerPhone}
                          onChange={(e) => handleLegChange(index, "arrHandlerPhone", e.target.value)}
                          className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                        />
                        <input
                          type="email"
                          placeholder="Email: c-office@peoples.ch"
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
            className="py-3.5 px-8 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Generate & Open Flight Brief PDF</span>
          </button>
        </div>
      </form>
    </div>
  );
}
