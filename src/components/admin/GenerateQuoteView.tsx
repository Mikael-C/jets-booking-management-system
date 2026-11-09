"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAviation } from "@/lib/aviationContext";
import { airportsData, findAirportByCode, getAirportFbos, getDefaultHandlingAgent, searchAirports } from "@/data/airports";
import { fleetData } from "@/data/fleet";
import { defaultOperator } from "@/data/initialBookings";
import { Booking, FlightLeg, AdditionalServices, TripType, PetDetails, LuggageDetails, Airport, FboOption } from "@/types/aviation";
import {
  calculatePricing,
  calculateDistanceNm,
  formatFlightTime,
  estimateFlightTimeMinutes,
  formatCurrency,
  calculateCardFee
} from "@/lib/pricingCalculator";
import {
  Plane,
  User,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  Building,
  Mail,
  Phone,
  FileText,
  Shield,
  MapPin,
  RefreshCw,
  Landmark,
  Receipt,
  Check,
  ChevronDown,
  ChevronUp,
  Layers,
  Percent,
  AlertTriangle,
  Briefcase,
  Dog,
  CreditCard,
  ArrowRight,
  Search,
  Image as ImageIcon,
  ScrollText,
  CheckSquare
} from "lucide-react";

interface QuoteLegInput {
  originIcao: string;
  destIcao: string;
  flightDate: string;
  departureTime: string;
  arrivalTime: string;
  paxCount: number;
  depHandlerName: string;
  depHandlerPhone: string;
  depHandlerEmail: string;
  arrHandlerName: string;
  arrHandlerPhone: string;
  arrHandlerEmail: string;
  pets?: PetDetails;
  luggage?: LuggageDetails;
}

export default function GenerateQuoteView() {
  const { clients, addBooking, openDocument, prefillClientForQuote, setPrefillClientForQuote, currentUser, addAuditEntry, operators, setActiveNav } = useAviation();

  // Operator selection (OPR-3: only approved operators selectable)
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>("op-1");

  // Document & Contract Identifiers (Page 1 Details Box)
  const [contractDate, setContractDate] = useState("01.10.2026");
  const [tripNumber, setTripNumber] = useState("PEU842-001");
  const [accountNumber, setAccountNumber] = useState("ACC-21737");
  const [quoteExpirationDate, setQuoteExpirationDate] = useState("02.10.2026, 19:53z");
  const [tripType, setTripType] = useState<TripType>("round_trip");
  const [currency, setCurrency] = useState<"EUR" | "USD" | "GBP" | "CHF">("EUR");

  // Margin Rules & Commission
  const [isMarginPanelOpen, setIsMarginPanelOpen] = useState(false);
  const [marginType, setMarginType] = useState<"percentage" | "fixed">("percentage");
  const [marginValue, setMarginValue] = useState<number>(12); // default 12% company margin
  const [commissionPct, setCommissionPct] = useState<number>(8); // default 8% agent commission
  const [quoteStatus, setQuoteStatus] = useState<"Draft" | "Sent" | "Pending" | "Undecided">("Draft");
  const [activeLegTabs, setActiveLegTabs] = useState<Record<number, "routing" | "pets" | "luggage" | "handling">>({});

  // Client Details (Page 1 TO Box)
  const [selectedClientId, setSelectedClientId] = useState<string>(
    prefillClientForQuote ? prefillClientForQuote.id : clients[0]?.id || ""
  );
  const [clientName, setClientName] = useState(prefillClientForQuote?.fullName || "Edward Brinkmann");
  const [companyName, setCompanyName] = useState(prefillClientForQuote?.companyName || "Brinkmann Capital SAM");
  const [clientEmail, setClientEmail] = useState(prefillClientForQuote?.email || "e.brinkmann@luxurycap.com");
  const [clientPhone, setClientPhone] = useState(prefillClientForQuote?.phone || "+1 239 555 0192");
  const [clientAddress, setClientAddress] = useState(prefillClientForQuote?.streetAddress || "3606 Enterprise Ave");
  const [clientCityCountry, setClientCityCountry] = useState(
    prefillClientForQuote?.cityPostalCountry || "FL-34104 Naples, United States"
  );
  const [vatNumber, setVatNumber] = useState(prefillClientForQuote?.vatNumber || "US-8492041");

  // ================= Aircraft Selection & Manual Overrides =================
  const [selectedAircraftId, setSelectedAircraftId] = useState("cessna-citation-mustang");
  const [aircraftSearchQuery, setAircraftSearchQuery] = useState("");
  const [isAircraftPickerOpen, setIsAircraftPickerOpen] = useState(false);

  const currentAircraft = useMemo(() => {
    return fleetData.find((a) => a.id === selectedAircraftId) || fleetData[0];
  }, [selectedAircraftId]);

  // Filtered aircraft list for searchable dropdown
  const filteredFleet = useMemo(() => {
    if (!aircraftSearchQuery.trim()) return fleetData.slice(0, 30);
    const q = aircraftSearchQuery.toLowerCase().trim();
    return fleetData.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.manufacturer.toLowerCase().includes(q) ||
        a.categoryLabel.toLowerCase().includes(q) ||
        String(a.passengers).includes(q)
    );
  }, [aircraftSearchQuery]);

  // Manual Overrides (Year of Make, Refurbishment, Seats, Smoking Cabin, Photos)
  const [aircraftNameOverride, setAircraftNameOverride] = useState("");
  const [yearOfManufactureOverride, setYearOfManufactureOverride] = useState("");
  const [yearOfRefurbishmentOverride, setYearOfRefurbishmentOverride] = useState("");
  const [passengerSeatsOverride, setPassengerSeatsOverride] = useState<number | "">("");
  const [toiletteOverride, setToiletteOverride] = useState<boolean>(true);
  const [smokingCabinOverride, setSmokingCabinOverride] = useState<boolean>(false);
  const [exteriorImageOverride, setExteriorImageOverride] = useState<string>("");
  const [interiorImageOverride, setInteriorImageOverride] = useState<string>("");

  // Sync initial aircraft specs when aircraft changes
  useEffect(() => {
    if (currentAircraft) {
      setAircraftNameOverride(currentAircraft.name);
      setYearOfManufactureOverride(String(currentAircraft.yearOfManufacture || "2020"));
      setYearOfRefurbishmentOverride(String(currentAircraft.yearOfRefurbishment || "Recent"));
      setPassengerSeatsOverride(currentAircraft.passengers);
      setToiletteOverride(currentAircraft.toilette !== false);
      setSmokingCabinOverride(!!currentAircraft.smokingCabin);
      setExteriorImageOverride(currentAircraft.imageExterior || "");
      setInteriorImageOverride(currentAircraft.imageInterior || "");
    }
  }, [selectedAircraftId]);

  // Initial Legs with airport names and respective FBOs (NO callsign on quote)
  const [legs, setLegs] = useState<QuoteLegInput[]>([
    {
      originIcao: "LSGG",
      destIcao: "LIMJ",
      flightDate: "2026-10-03",
      departureTime: "11:00",
      arrivalTime: "11:55",
      paxCount: 2,
      depHandlerName: "Jet Aviation Geneva",
      depHandlerPhone: "+41 58 158 1811",
      depHandlerEmail: "gvafbo@jetaviation.com",
      arrHandlerName: "Ags Ops Executive Handling",
      arrHandlerPhone: "+39 010 601 5412",
      arrHandlerEmail: "dutymanager@airport.genova.it"
    },
    {
      originIcao: "LIMJ",
      destIcao: "LSGG",
      flightDate: "2026-10-06",
      departureTime: "15:00",
      arrivalTime: "16:04",
      paxCount: 2,
      depHandlerName: "Ags Ops Executive Handling",
      depHandlerPhone: "+39 010 601 5412",
      depHandlerEmail: "dutymanager@airport.genova.it",
      arrHandlerName: "Jet Aviation Geneva",
      arrHandlerPhone: "+41 58 158 1811",
      arrHandlerEmail: "gvafbo@jetaviation.com"
    }
  ]);

  // Additional Services (De-icing removed as requested)
  const [services, setServices] = useState<AdditionalServices>({
    limousineService: false,
    luxuryCarRental: false,
    helicopterService: false,
    vipCateringDetails: "Complimentary Taittinger Champagne, premium snacks and artisanal canapés",
    deicingInsurance: "none",
    deicingCostPerLeg: 0,
    carbonOffset: "neutral",
    carbonOffsetRatePerHour: 33,
    cancellationInsurance: false
  });

  // Custom Pricing Line Item Overrides
  const [overridePricing, setOverridePricing] = useState(false);
  const [customFlightPrice, setCustomFlightPrice] = useState<number>(11500);
  const [customAirportFees, setCustomAirportFees] = useState<number>(1140);
  const [customPassengerFees, setCustomPassengerFees] = useState<number>(80);
  const [customDayOfWeekDiscount, setCustomDayOfWeekDiscount] = useState<number>(-250);
  const [customInboundTax, setCustomInboundTax] = useState<number>(200);
  const [customOutboundTax, setCustomOutboundTax] = useState<number>(200);
  const [customAdditionalServices, setCustomAdditionalServices] = useState<number>(0);

  // Bank & Remittance Details (Orbelo Aviation Management)
  const [bankName, setBankName] = useState(defaultOperator.bankName);
  const [iban, setIban] = useState(defaultOperator.iban);
  const [bic, setBic] = useState(defaultOperator.bic);
  const [accountHolder, setAccountHolder] = useState(defaultOperator.accountHolder);
  const [repName, setRepName] = useState(defaultOperator.representativeName);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // When prefill client is provided via CRM
  useEffect(() => {
    if (prefillClientForQuote) {
      setSelectedClientId(prefillClientForQuote.id);
      setClientName(prefillClientForQuote.fullName);
      setCompanyName(prefillClientForQuote.companyName || "");
      setClientEmail(prefillClientForQuote.email);
      setClientPhone(prefillClientForQuote.phone);
      setClientAddress(prefillClientForQuote.streetAddress);
      setClientCityCountry(prefillClientForQuote.cityPostalCountry);
      setVatNumber(prefillClientForQuote.vatNumber || "");
      if (prefillClientForQuote.accountNumber) {
        setAccountNumber(prefillClientForQuote.accountNumber);
      }
    }
  }, [prefillClientForQuote]);

  const handleClientSelectChange = (id: string) => {
    setSelectedClientId(id);
    const found = clients.find((c) => c.id === id);
    if (found) {
      setClientName(found.fullName);
      setCompanyName(found.companyName || "");
      setClientEmail(found.email);
      setClientPhone(found.phone);
      setClientAddress(found.streetAddress);
      setClientCityCountry(found.cityPostalCountry);
      setVatNumber(found.vatNumber || "");
      if (found.accountNumber) {
        setAccountNumber(found.accountNumber);
      }
    }
  };

  const handleRegenerateNumbers = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setTripNumber(`PEU${randomSuffix}-001`);
    setAccountNumber(`ACC-${Math.floor(20000 + Math.random() * 80000)}`);
  };

  // Helper to add leg with default respective FBOs
  const handleAddLeg = () => {
    const lastLeg = legs[legs.length - 1];
    const originIcao = lastLeg ? lastLeg.destIcao : "LSGG";
    const destIcao = "LFPB";
    const origAirport = findAirportByCode(originIcao);
    const destAirport = findAirportByCode(destIcao);

    const dist = calculateDistanceNm(
      origAirport.coordinates?.lat || 46.2,
      origAirport.coordinates?.lng || 6.1,
      destAirport.coordinates?.lat || 48.9,
      destAirport.coordinates?.lng || 2.4
    );
    const flightMinutes = estimateFlightTimeMinutes(dist);

    const depFbo = (origAirport.fbos && origAirport.fbos[0]) || {
      name: `${origAirport.name} FBO`,
      phone: "+41 58 158 1811",
      email: `ops@${originIcao.toLowerCase()}.handling.aero`
    };

    const arrFbo = (destAirport.fbos && destAirport.fbos[0]) || {
      name: `${destAirport.name} FBO`,
      phone: "+33 1 48 62 00 00",
      email: `ops@${destIcao.toLowerCase()}.handling.aero`
    };

    setLegs([
      ...legs,
      {
        originIcao,
        destIcao,
        flightDate: lastLeg ? lastLeg.flightDate : new Date().toISOString().split("T")[0],
        departureTime: "14:00",
        arrivalTime: "15:15",
        paxCount: lastLeg ? lastLeg.paxCount : 2,
        depHandlerName: depFbo.name,
        depHandlerPhone: depFbo.phone,
        depHandlerEmail: depFbo.email,
        arrHandlerName: arrFbo.name,
        arrHandlerPhone: arrFbo.phone,
        arrHandlerEmail: arrFbo.email
      }
    ]);
  };

  const handleRemoveLeg = (idx: number) => {
    if (legs.length <= 1) return;
    setLegs(legs.filter((_, i) => i !== idx));
  };

  const handleLegChange = (idx: number, field: keyof QuoteLegInput, val: any) => {
    const updated = [...legs];
    updated[idx] = { ...updated[idx], [field]: val };

    // Auto-update handling agents and arrival times when origin or dest changes
    if (field === "originIcao") {
      const origAirport = findAirportByCode(val);
      const primaryFbo = origAirport.fbos && origAirport.fbos[0];
      if (primaryFbo) {
        updated[idx].depHandlerName = primaryFbo.name;
        updated[idx].depHandlerPhone = primaryFbo.phone;
        updated[idx].depHandlerEmail = primaryFbo.email;
      }
    }

    if (field === "destIcao") {
      const destAirport = findAirportByCode(val);
      const primaryFbo = destAirport.fbos && destAirport.fbos[0];
      if (primaryFbo) {
        updated[idx].arrHandlerName = primaryFbo.name;
        updated[idx].arrHandlerPhone = primaryFbo.phone;
        updated[idx].arrHandlerEmail = primaryFbo.email;
      }
    }

    if (field === "departureTime" || field === "originIcao" || field === "destIcao") {
      const orig = findAirportByCode(field === "originIcao" ? val : updated[idx].originIcao);
      const dest = findAirportByCode(field === "destIcao" ? val : updated[idx].destIcao);
      const dist = calculateDistanceNm(
        orig.coordinates?.lat || 46.2,
        orig.coordinates?.lng || 6.1,
        dest.coordinates?.lat || 44.4,
        dest.coordinates?.lng || 8.8
      );
      const flightMinutes = estimateFlightTimeMinutes(dist);
      const depTime = field === "departureTime" ? val : updated[idx].departureTime;
      const [hStr, mStr] = depTime.split(":");
      const depMinutes = (parseInt(hStr, 10) || 10) * 60 + (parseInt(mStr, 10) || 0);
      const arrTotalMin = depMinutes + flightMinutes;
      const arrH = String(Math.floor(arrTotalMin / 60) % 24).padStart(2, "0");
      const arrM = String(arrTotalMin % 60).padStart(2, "0");
      updated[idx].arrivalTime = `${arrH}:${arrM}`;
    }

    setLegs(updated);
  };

  // Compile full flight legs (No callsign on quote)
  const compiledLegs: FlightLeg[] = useMemo(() => {
    return legs.map((leg, idx) => {
      const originAirport = findAirportByCode(leg.originIcao);
      const destAirport = findAirportByCode(leg.destIcao);
      const dist = calculateDistanceNm(
        originAirport.coordinates?.lat || 46.2,
        originAirport.coordinates?.lng || 6.1,
        destAirport.coordinates?.lat || 44.4,
        destAirport.coordinates?.lng || 8.8
      );
      const flightMinutes = estimateFlightTimeMinutes(dist);

      return {
        legNumber: idx + 1,
        flightDate: leg.flightDate,
        origin: originAirport,
        destination: destAirport,
        departureTimeLocal: leg.departureTime.includes("h") ? leg.departureTime : `${leg.departureTime} h`,
        arrivalTimeLocal: leg.arrivalTime.includes("h") ? leg.arrivalTime : `${leg.arrivalTime} h`,
        flightTimeFormatted: formatFlightTime(flightMinutes),
        paxCount: leg.paxCount,
        flightNumber: "", // NO callsign on quote without booking!
        aircraftRegistration: currentAircraft.registration || "",
        distanceNm: dist,
        pets: leg.pets,
        luggage: leg.luggage,
        crew: [
          { role: "CMDR", name: "Capt. Marcus Vance", phone: "+44 7700 900120" },
          { role: "F/O", name: "Elena Rostova", phone: "+44 7700 900125" },
          { role: "Cabin Attendant", name: "Sophie Laurent", phone: "+33 6 42 19 88 02" }
        ],
        passengers: [
          { id: `p-${idx}-1`, fullName: clientName || "Lead Passenger", isLeadPassenger: true }
        ],
        departureHandling: {
          name: leg.depHandlerName || `${originAirport.name} FBO`,
          airportCode: originAirport.icao,
          phone: leg.depHandlerPhone || "+41 58 158 1811",
          email: leg.depHandlerEmail || `ops@${originAirport.icao.toLowerCase()}.handling.aero`
        },
        arrivalHandling: {
          name: leg.arrHandlerName || `${destAirport.name} FBO`,
          airportCode: destAirport.icao,
          phone: leg.arrHandlerPhone || "+39 010 601 5412",
          email: leg.arrHandlerEmail || `ops@${destAirport.icao.toLowerCase()}.handling.aero`
        }
      };
    });
  }, [legs, currentAircraft, clientName]);

  // Effective Aircraft with manual overrides
  const effectiveAircraft = useMemo(() => {
    return {
      ...currentAircraft,
      name: aircraftNameOverride || currentAircraft.name,
      yearOfManufacture: yearOfManufactureOverride || currentAircraft.yearOfManufacture,
      yearOfRefurbishment: yearOfRefurbishmentOverride || currentAircraft.yearOfRefurbishment || "Recent",
      passengers: typeof passengerSeatsOverride === "number" ? passengerSeatsOverride : currentAircraft.passengers,
      toilette: toiletteOverride,
      smokingCabin: smokingCabinOverride,
      imageExterior: exteriorImageOverride || currentAircraft.imageExterior,
      imageInterior: interiorImageOverride || currentAircraft.imageInterior
    };
  }, [
    currentAircraft,
    aircraftNameOverride,
    yearOfManufactureOverride,
    yearOfRefurbishmentOverride,
    passengerSeatsOverride,
    toiletteOverride,
    smokingCabinOverride,
    exteriorImageOverride,
    interiorImageOverride
  ]);

  // Pricing calculation
  const autoPricing = useMemo(() => {
    return calculatePricing(effectiveAircraft, compiledLegs, services, currency);
  }, [effectiveAircraft, compiledLegs, services, currency]);

  const effectivePricing = overridePricing
    ? {
        flightPrice: customFlightPrice,
        airportFees: customAirportFees,
        passengerFees: customPassengerFees,
        dayOfWeekDiscount: customDayOfWeekDiscount,
        inboundPassengerTax: customInboundTax,
        outboundPassengerTax: customOutboundTax,
        additionalServicesTotal: customAdditionalServices,
        subtotal:
          customFlightPrice +
          customAirportFees +
          customPassengerFees +
          customDayOfWeekDiscount +
          customInboundTax +
          customOutboundTax +
          customAdditionalServices,
        vatRate: 0,
        vatAmount: 0,
        totalFlightPrice:
          customFlightPrice +
          customAirportFees +
          customPassengerFees +
          customDayOfWeekDiscount +
          customInboundTax +
          customOutboundTax +
          customAdditionalServices,
        currency
      }
    : autoPricing;

  useEffect(() => {
    if (!overridePricing) {
      setCustomFlightPrice(autoPricing.flightPrice);
      setCustomAirportFees(autoPricing.airportFees);
      setCustomPassengerFees(autoPricing.passengerFees);
      setCustomDayOfWeekDiscount(autoPricing.dayOfWeekDiscount);
      setCustomInboundTax(autoPricing.inboundPassengerTax);
      setCustomOutboundTax(autoPricing.outboundPassengerTax);
      setCustomAdditionalServices(autoPricing.additionalServicesTotal);
    }
  }, [autoPricing, overridePricing]);

  // Helper to build official Booking record
  const createBookingObject = (isBookedFlight: boolean): Booking => {
    // Callsign and Trip Number only created on confirmed booking!
    const generatedTripNumber = isBookedFlight ? (tripNumber || `ORB-${Math.floor(100 + Math.random() * 900)}`) : "";
    const quoteRef = tripNumber ? `QTE-${tripNumber.replace("PEU", "").replace("ORB-", "")}` : `QTE-${Date.now().toString().slice(-6)}`;
    const uniqueInvoiceNumber = `INV-2026-${Date.now().toString().slice(-6)}`;
    const statusVal = isBookedFlight ? "confirmed" : (quoteStatus === "Sent" ? "quote_sent" : "draft");
    const quoteStatusVal = isBookedFlight ? "accepted" : (quoteStatus.toLowerCase() as any);
    const cardFee = calculateCardFee(effectivePricing.totalFlightPrice);

    return {
      id: `booking-${Date.now()}`,
      tripNumber: generatedTripNumber,
      quoteReference: quoteRef,
      invoiceNumber: uniqueInvoiceNumber,
      accountNumber,
      contractDate,
      quoteExpirationDate,
      paymentDueDate: new Date(Date.now() + 86400000 * 3).toLocaleDateString("de-DE"),
      status: statusVal,
      quoteStatus: quoteStatusVal,
      quoteVersion: 1,
      commissionPercentage: commissionPct,
      paymentStatus: "unpaid",
      tripType,
      aircraft: effectiveAircraft,
      client: {
        fullName: clientName || "VIP Client",
        companyName,
        streetAddress: clientAddress || "3606 Enterprise Ave",
        cityPostalCountry: clientCityCountry || "FL-34104 Naples, United States",
        phone: clientPhone || "+1 239 555 0192",
        email: clientEmail || "client@orbelo.com",
        vatNumber,
        accountNumber
      },
      operator: {
        ...defaultOperator,
        representativeName: repName || defaultOperator.representativeName,
        bankName: bankName || defaultOperator.bankName,
        iban: iban || defaultOperator.iban,
        bic: bic || defaultOperator.bic,
        accountHolder: accountHolder || defaultOperator.accountHolder
      },
      legs: compiledLegs.map(l => ({
        ...l,
        flightNumber: isBookedFlight ? (generatedTripNumber || "ORB-101") : "" // Callsign only on booked contract!
      })),
      pricing: effectivePricing,
      services,
      cardFeePercentage: 3.5,
      cardFeeAmount: cardFee.feeAmount,
      totalWithCardFee: cardFee.totalWithFee,
      checklist: [
        { id: "step-1", label: "Aircraft Airworthiness & ARC Validity Verified", category: "aircraft", isCompleted: true, completedAt: "01.10.2026, 08:30", completedBy: "Flight Dispatcher", requiredForDispatch: true },
        { id: "step-2", label: "ATC Eurocontrol Flight Plan Filed & Accepted", category: "permits", isCompleted: true, completedAt: "01.10.2026, 08:45", completedBy: "Flight Dispatcher", requiredForDispatch: true },
        { id: "step-3", label: "Origin & Destination FBO Ramp Handling Booked", category: "ground", isCompleted: true, requiredForDispatch: true },
        { id: "step-4", label: "Airport Slots & PPR Cleared", category: "permits", isCompleted: false, requiredForDispatch: true },
        { id: "step-5", label: "Jet A-1 Fuel Uplift & Release Ordered", category: "ground", isCompleted: false, requiredForDispatch: true },
        { id: "step-6", label: "Crew Duty Time & Fatigue Risk Assessment Validated", category: "crew", isCompleted: true, completedAt: "01.10.2026, 09:00", completedBy: "Crew Ops", requiredForDispatch: true }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  const handleGenerateQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const newBooking = createBookingObject(false);
    addBooking(newBooking);
    addAuditEntry({
      userEmail: currentUser?.email || "admin@orbelo.com",
      userName: currentUser?.name || "Operations Team",
      action: "QUOTE_GENERATED",
      entityType: "Quote",
      entityId: newBooking.quoteReference || newBooking.id,
      details: `Generated official quotation for ${clientName || "Client"} (${newBooking.quoteReference}), Total: ${formatCurrency(effectivePricing.totalFlightPrice, currency)} [Status: ${quoteStatus}]`
    });
    setSuccessMessage(`Official Quotation [${newBooking.quoteReference}] successfully compiled and saved!`);
    openDocument(newBooking, "quotation");
  };

  // Flow Step 2: Quote -> Contract
  const handleProceedToContract = () => {
    const newBooking = createBookingObject(false);
    addBooking(newBooking);
    addAuditEntry({
      userEmail: currentUser?.email || "admin@orbelo.com",
      userName: currentUser?.name || "Operations Team",
      action: "QUOTE_ADVANCED_TO_CONTRACT",
      entityType: "Contract",
      entityId: newBooking.quoteReference || newBooking.id,
      details: `Quotation ${newBooking.quoteReference} advanced to Contract stage for ${clientName}.`
    });
    setSuccessMessage(`Quotation ${newBooking.quoteReference} created! Opening Contract Generator...`);
    setTimeout(() => {
      setActiveNav("generate_contract");
    }, 400);
  };

  // Flow Step 3: Direct to Booked Contract
  const handleConfirmAndBookFlight = () => {
    const newBooking = createBookingObject(true);
    addBooking(newBooking);
    addAuditEntry({
      userEmail: currentUser?.email || "admin@orbelo.com",
      userName: currentUser?.name || "Operations Team",
      action: "FLIGHT_CONFIRMED",
      entityType: "Booking",
      entityId: newBooking.tripNumber,
      details: `Quotation confirmed and booked as official flight ${newBooking.tripNumber} (Callsign: ${newBooking.tripNumber}) for ${clientName}.`
    });
    setSuccessMessage(`Flight Confirmed! Booked Contract #${newBooking.tripNumber} created with assigned Callsign.`);
    setTimeout(() => {
      setActiveNav("bookings");
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 select-none">
      
      {/* View Header */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/15 text-[#9A7A35] border border-[#C9A052]/30">
              ORBELO CHARTER ENGINE
            </span>
            <span className="text-xs text-[#0F1420]/60 font-mono">Bespoke Proposal Pipeline</span>
          </div>
          <h2 className="text-xl font-black text-[#0F1420] tracking-tight">
            Generate Official Private Jet Quotation
          </h2>
          <p className="text-xs text-[#0F1420]/65 mt-0.5">
            Configure client details, aircraft specifications, flight routing, station FBOs, and commercial pricing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#0F1420]/70">Currency:</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CHF">CHF</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleRegenerateNumbers}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F5F2EC] hover:bg-[#EAE6DE] border border-[#E0DAD0] text-xs font-mono font-bold text-[#0F1420]"
            title="Generate new Quote & Account numbers"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#C9A052]" />
            <span>Regenerate IDs</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Quote Creation Form */}
      <form onSubmit={handleGenerateQuote} className="space-y-6">
        
        {/* SECTION 1: Document Reference & Client Information */}
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E0DAD0]">
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-[#C9A052]" />
              <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                1. Quotation Details & Client
              </h3>
            </div>

            {/* Quick Prefill from CRM */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#0F1420]/70 font-semibold hidden sm:inline">
                Quick Select Client:
              </span>
              <select
                value={selectedClientId}
                onChange={(e) => handleClientSelectChange(e.target.value)}
                className="bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-1.5 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} {c.companyName ? `(${c.companyName})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Document Reference Identifiers */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 p-4 bg-[#F5F2EC] rounded-xl border border-[#E0DAD0]">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                Trip Type
              </label>
              <select
                value={tripType}
                onChange={(e) => setTripType(e.target.value as any)}
                className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              >
                <option value="round_trip">Round Trip</option>
                <option value="one_way">One-Way Charter</option>
                <option value="multi_leg">Multi-Leg Itinerary</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                Contract Date
              </label>
              <input
                type="text"
                value={contractDate}
                onChange={(e) => setContractDate(e.target.value)}
                required
                className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                Quote Reference
              </label>
              <input
                type="text"
                value={tripNumber}
                onChange={(e) => setTripNumber(e.target.value)}
                required
                className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
                className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                Quote Expiration
              </label>
              <input
                type="text"
                value={quoteExpirationDate}
                onChange={(e) => setQuoteExpirationDate(e.target.value)}
                required
                className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-red-600 focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                Quote Status
              </label>
              <select
                value={quoteStatus}
                onChange={(e) => setQuoteStatus(e.target.value as any)}
                className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Pending">Pending</option>
                <option value="Undecided">Undecided</option>
              </select>
            </div>
          </div>

          {/* Client Details Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Client Name / Lead Passenger *
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Client VAT / Tax ID
              </label>
              <input
                type="text"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                placeholder="e.g. US-8492041 or GB303612155"
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                required
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Telephone / Mobile *
              </label>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                required
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Street Address
              </label>
              <input
                type="text"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                City, State / Postal Code & Country
              </label>
              <input
                type="text"
                value={clientCityCountry}
                onChange={(e) => setClientCityCountry(e.target.value)}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Searchable Aircraft Dropdown & Manual Overrides (Clean Layout) */}
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E0DAD0]">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#C9A052]" />
              <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                2. Aircraft Selection & Specifications
              </h3>
            </div>
            <span className="text-xs text-[#0F1420]/70 font-mono">
              Selected: <strong className="text-[#0F1420]">{effectiveAircraft.name}</strong>
            </span>
          </div>

          {/* Searchable Aircraft Selector (Input + Dropdown) */}
          <div className="relative">
            <label className="block text-xs font-mono font-bold uppercase text-[#0F1420] mb-1.5">
              Search Aircraft Fleet (Type to Filter)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Type aircraft name (e.g., Mustang, Phenom, Global, Citation, Falcon, 8 seats)..."
                value={aircraftSearchQuery}
                onChange={(e) => {
                  setAircraftSearchQuery(e.target.value);
                  setIsAircraftPickerOpen(true);
                }}
                onFocus={() => setIsAircraftPickerOpen(true)}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-4 py-2.5 pl-10 text-xs font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052] shadow-xs"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              {isAircraftPickerOpen && (
                <button
                  type="button"
                  onClick={() => setIsAircraftPickerOpen(false)}
                  className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-700 font-mono font-bold"
                >
                  Close ✕
                </button>
              )}
            </div>

            {/* Filtered Dropdown Results List */}
            {isAircraftPickerOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 max-h-72 overflow-y-auto bg-white border border-[#E0DAD0] rounded-xl shadow-2xl z-50 divide-y divide-gray-100">
                {filteredFleet.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-500">
                    No aircraft found matching "{aircraftSearchQuery}".
                  </div>
                ) : (
                  filteredFleet.map((jet) => (
                    <div
                      key={jet.id}
                      onClick={() => {
                        setSelectedAircraftId(jet.id);
                        setAircraftNameOverride(jet.name);
                        setPassengerSeatsOverride(jet.passengers);
                        setYearOfManufactureOverride(String(jet.yearOfManufacture || "2020"));
                        setYearOfRefurbishmentOverride(String(jet.yearOfRefurbishment || "Recent"));
                        setExteriorImageOverride(jet.imageExterior || "");
                        setInteriorImageOverride(jet.imageInterior || "");
                        setIsAircraftPickerOpen(false);
                      }}
                      className={`p-3 flex items-center justify-between hover:bg-[#F5F2EC] cursor-pointer transition-colors ${
                        selectedAircraftId === jet.id ? "bg-[#F5F2EC] border-l-4 border-[#C9A052]" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={jet.imageExterior}
                          alt=""
                          className="w-12 h-8 rounded object-cover border border-gray-200"
                        />
                        <div>
                          <div className="font-extrabold text-xs text-[#0F1420]">{jet.name}</div>
                          <div className="text-[11px] text-gray-500">
                            {jet.manufacturer} • {jet.categoryLabel}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-[11px] font-mono">
                        <span className="font-bold text-[#0F1420]">{jet.passengers} Seats</span>
                        <div className="text-[#9A7A35] font-bold">€{jet.pricePerHour.toLocaleString()}/hr</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Clean Selected Aircraft Preview Card (Replaces Busy Grid of All Aircraft) */}
          <div className="p-4 rounded-xl border border-[#C9A052]/40 bg-[#FAF9F6] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-24 h-16 rounded-lg overflow-hidden border border-[#E0DAD0] shadow-sm relative bg-gray-100 flex-shrink-0">
                <img
                  src={effectiveAircraft.imageExterior}
                  alt={effectiveAircraft.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-[#0F1420]">{effectiveAircraft.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/15 text-[#9A7A35] border border-[#C9A052]/30">
                    {effectiveAircraft.categoryLabel}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{effectiveAircraft.manufacturer}</p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-[#0F1420]/80 mt-1">
                  <span>Capacity: <strong>{effectiveAircraft.passengers} Seats</strong></span>
                  <span>•</span>
                  <span>Speed: <strong>{effectiveAircraft.cruiseSpeed}</strong></span>
                  <span>•</span>
                  <span>Range: <strong>{effectiveAircraft.range} nm</strong></span>
                  <span>•</span>
                  <span>Rate: <strong>€{effectiveAircraft.pricePerHour.toLocaleString()}/hr</strong></span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAircraftPickerOpen(!isAircraftPickerOpen)}
              className="px-3.5 py-2 rounded-xl border border-[#E0DAD0] bg-white hover:bg-[#F5F2EC] text-xs font-bold text-[#0F1420] transition-colors shadow-xs"
            >
              {isAircraftPickerOpen ? "Hide Dropdown" : "Browse / Switch Aircraft"}
            </button>
          </div>

          {/* Manual Aircraft Details Overrides (Year of make, refurbishment date, seats, smoking cabin, pictures) */}
          <div className="p-4 bg-[#F5F2EC] rounded-xl border border-[#E0DAD0] space-y-3">
            <div className="flex items-center justify-between border-b border-[#E0DAD0] pb-2">
              <span className="text-[11px] font-mono font-bold uppercase text-[#0F1420]">
                Manual Aircraft Overrides (Year of Make, Refurbishment, Seats, Smoking & Photos)
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Customizes proposal PDF</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                  Model Label
                </label>
                <input
                  type="text"
                  value={aircraftNameOverride}
                  onChange={(e) => setAircraftNameOverride(e.target.value)}
                  className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                  Year of Make (YOM)
                </label>
                <input
                  type="text"
                  placeholder="2020"
                  value={yearOfManufactureOverride}
                  onChange={(e) => setYearOfManufactureOverride(e.target.value)}
                  className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                  Refurbishment Date
                </label>
                <input
                  type="text"
                  placeholder="2024 / Recent"
                  value={yearOfRefurbishmentOverride}
                  onChange={(e) => setYearOfRefurbishmentOverride(e.target.value)}
                  className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                  Passenger Seats
                </label>
                <input
                  type="number"
                  placeholder={String(currentAircraft.passengers)}
                  value={passengerSeatsOverride}
                  onChange={(e) => setPassengerSeatsOverride(e.target.value ? Number(e.target.value) : "")}
                  className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                  Smoking Cabin
                </label>
                <select
                  value={smokingCabinOverride ? "yes" : "no"}
                  onChange={(e) => setSmokingCabinOverride(e.target.value === "yes")}
                  className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                >
                  <option value="no">Strictly Non-Smoking</option>
                  <option value="yes">Smoking Allowed</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                  Enclosed Lavatory
                </label>
                <select
                  value={toiletteOverride ? "yes" : "no"}
                  onChange={(e) => setToiletteOverride(e.target.value === "yes")}
                  className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                >
                  <option value="yes">YES</option>
                  <option value="no">NO</option>
                </select>
              </div>
            </div>

            {/* Custom Pictures Input (Exterior & Interior) */}
            <div className="pt-2 border-t border-[#E0DAD0] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 text-[#C9A052]" />
                  Custom Exterior Photo URL
                </label>
                <input
                  type="text"
                  placeholder="https://... (Aircraft exterior photo URL)"
                  value={exteriorImageOverride}
                  onChange={(e) => setExteriorImageOverride(e.target.value)}
                  className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 text-[#C9A052]" />
                  Custom Interior Photo URL
                </label>
                <input
                  type="text"
                  placeholder="https://... (Aircraft cabin interior photo URL)"
                  value={interiorImageOverride}
                  onChange={(e) => setInteriorImageOverride(e.target.value)}
                  className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Flight Routing, Airport Names & Respective FBOs */}
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E0DAD0]">
            <div className="flex items-center gap-2.5">
              <Plane className="w-4 h-4 text-[#C9A052]" />
              <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                3. Flight Routing, Airport Names & Respective FBO Handling
              </h3>
            </div>

            <button
              type="button"
              onClick={handleAddLeg}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F1420] text-white hover:bg-[#1A2338] text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-[#C9A052]" />
              <span>Add Flight Leg</span>
            </button>
          </div>

          <div className="space-y-5">
            {legs.map((leg, index) => {
              const currentTab = activeLegTabs[index] || "routing";
              const setTab = (tab: "routing" | "pets" | "luggage" | "handling") => {
                setActiveLegTabs((prev) => ({ ...prev, [index]: tab }));
              };

              const origAirport = findAirportByCode(leg.originIcao);
              const destAirport = findAirportByCode(leg.destIcao);
              const origFbos = getAirportFbos(leg.originIcao);
              const destFbos = getAirportFbos(leg.destIcao);

              return (
                <div
                  key={index}
                  className="p-5 rounded-2xl bg-[#F5F2EC] border border-[#E0DAD0] space-y-4 shadow-sm"
                >
                  {/* Leg Header Badge & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E0DAD0] pb-3 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-[#0F1420] text-[#C9A052] font-mono font-bold text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-xs font-mono font-extrabold text-[#0F1420]">
                        Flight Leg #{index + 1}: {origAirport.city} ({origAirport.icao}) → {destAirport.city} ({destAirport.icao})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Per-Leg Tab Selector Buttons */}
                      <div className="flex items-center bg-white border border-[#E0DAD0] rounded-xl p-1 text-xs">
                        <button
                          type="button"
                          onClick={() => setTab("routing")}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
                            currentTab === "routing"
                              ? "bg-[#0F1420] text-[#C9A052] shadow-sm"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          <Plane className="w-3.5 h-3.5" />
                          <span>Routing</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTab("pets")}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
                            currentTab === "pets"
                              ? "bg-[#0F1420] text-[#C9A052] shadow-sm"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          <Dog className="w-3.5 h-3.5" />
                          <span>Pets {leg.pets?.hasPets ? "(✓)" : ""}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTab("luggage")}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
                            currentTab === "luggage"
                              ? "bg-[#0F1420] text-[#C9A052] shadow-sm"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>Luggage {leg.luggage?.standardSuitcases ? `(${leg.luggage.standardSuitcases})` : ""}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTab("handling")}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
                            currentTab === "handling"
                              ? "bg-[#0F1420] text-[#C9A052] shadow-sm"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          <Building className="w-3.5 h-3.5" />
                          <span>FBO</span>
                        </button>
                      </div>

                      {legs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLeg(index)}
                          className="flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-800 bg-red-100 hover:bg-red-200 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* TAB 1: Routing & Airport Selection with Respective FBOs */}
                  {currentTab === "routing" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 text-xs">
                        {/* Origin Airport */}
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                            Origin Airport
                          </label>
                          <select
                            value={leg.originIcao}
                            onChange={(e) => handleLegChange(index, "originIcao", e.target.value)}
                            className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-2 text-xs text-[#0F1420] font-mono font-bold focus:outline-none focus:border-[#C9A052]"
                          >
                            {airportsData.map((a) => (
                              <option key={a.icao} value={a.icao}>
                                [{a.icao}] {a.city} — {a.name}
                              </option>
                            ))}
                          </select>
                          <p className="text-[10px] text-gray-500 mt-1 truncate">
                            {origAirport.name} ({origAirport.country})
                          </p>
                        </div>

                        {/* Destination Airport */}
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                            Destination Airport
                          </label>
                          <select
                            value={leg.destIcao}
                            onChange={(e) => handleLegChange(index, "destIcao", e.target.value)}
                            className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-2 text-xs text-[#0F1420] font-mono font-bold focus:outline-none focus:border-[#C9A052]"
                          >
                            {airportsData.map((a) => (
                              <option key={a.icao} value={a.icao}>
                                [{a.icao}] {a.city} — {a.name}
                              </option>
                            ))}
                          </select>
                          <p className="text-[10px] text-gray-500 mt-1 truncate">
                            {destAirport.name} ({destAirport.country})
                          </p>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                            Flight Date
                          </label>
                          <input
                            type="date"
                            value={leg.flightDate}
                            onChange={(e) => handleLegChange(index, "flightDate", e.target.value)}
                            required
                            className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs text-[#0F1420] font-mono focus:outline-none focus:border-[#C9A052]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                            Passengers (Pax)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={19}
                            value={leg.paxCount}
                            onChange={(e) => handleLegChange(index, "paxCount", Number(e.target.value))}
                            required
                            className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs text-[#0F1420] font-mono font-bold focus:outline-none focus:border-[#C9A052]"
                          />
                        </div>
                      </div>

                      {/* Station Times and Respective FBO Dropdowns */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-white/70 p-3.5 rounded-xl border border-[#E0DAD0]">
                        <div>
                          <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                            Departure Time (LT)
                          </label>
                          <input
                            type="text"
                            placeholder="11:00"
                            value={leg.departureTime}
                            onChange={(e) => handleLegChange(index, "departureTime", e.target.value)}
                            required
                            className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs text-[#0F1420] font-mono font-bold focus:outline-none focus:border-[#C9A052]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                            Arrival Time (LT)
                          </label>
                          <input
                            type="text"
                            placeholder="11:55"
                            value={leg.arrivalTime}
                            onChange={(e) => handleLegChange(index, "arrivalTime", e.target.value)}
                            required
                            className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs text-[#0F1420] font-mono font-bold focus:outline-none focus:border-[#C9A052]"
                          />
                        </div>

                        {/* Departure FBO Dropdown for Origin Airport */}
                        <div>
                          <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1 flex items-center gap-1">
                            <Building className="w-3 h-3 text-[#C9A052]" />
                            Departure Station FBO
                          </label>
                          <select
                            value={leg.depHandlerName}
                            onChange={(e) => {
                              const selectedFbo = origFbos.find((f) => f.name === e.target.value);
                              if (selectedFbo) {
                                handleLegChange(index, "depHandlerName", selectedFbo.name);
                                handleLegChange(index, "depHandlerPhone", selectedFbo.phone);
                                handleLegChange(index, "depHandlerEmail", selectedFbo.email);
                              } else {
                                handleLegChange(index, "depHandlerName", e.target.value);
                              }
                            }}
                            className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs text-[#0F1420] font-bold focus:outline-none focus:border-[#C9A052]"
                          >
                            {origFbos.map((fbo) => (
                              <option key={fbo.id} value={fbo.name}>
                                {fbo.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Arrival FBO Dropdown for Destination Airport */}
                        <div>
                          <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1 flex items-center gap-1">
                            <Building className="w-3 h-3 text-[#C9A052]" />
                            Arrival Station FBO
                          </label>
                          <select
                            value={leg.arrHandlerName}
                            onChange={(e) => {
                              const selectedFbo = destFbos.find((f) => f.name === e.target.value);
                              if (selectedFbo) {
                                handleLegChange(index, "arrHandlerName", selectedFbo.name);
                                handleLegChange(index, "arrHandlerPhone", selectedFbo.phone);
                                handleLegChange(index, "arrHandlerEmail", selectedFbo.email);
                              } else {
                                handleLegChange(index, "arrHandlerName", e.target.value);
                              }
                            }}
                            className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs text-[#0F1420] font-bold focus:outline-none focus:border-[#C9A052]"
                          >
                            {destFbos.map((fbo) => (
                              <option key={fbo.id} value={fbo.name}>
                                {fbo.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Pets */}
                  {currentTab === "pets" && (
                    <div className="p-4 bg-white rounded-xl border border-[#E0DAD0] space-y-3 text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <span className="font-bold font-mono text-[#0F1420] uppercase flex items-center gap-1.5">
                          <Dog className="w-4 h-4 text-[#C9A052]" />
                          In-Cabin & Cargo Pet Carriage for Leg #{index + 1}
                        </span>
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-[#0F1420]">
                          <input
                            type="checkbox"
                            checked={!!leg.pets?.hasPets}
                            onChange={(e) =>
                              handleLegChange(index, "pets", {
                                ...leg.pets,
                                hasPets: e.target.checked,
                                petCount: leg.pets?.petCount || 1,
                                totalWeightKg: leg.pets?.totalWeightKg || 12,
                                petType: leg.pets?.petType || "Dog / Falcon"
                              })
                            }
                            className="rounded text-[#C9A052] focus:ring-[#C9A052] h-4 w-4"
                          />
                          <span>Pets Travelling on this Leg</span>
                        </label>
                      </div>

                      {leg.pets?.hasPets && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                          <div>
                            <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Pet Count</label>
                            <input
                              type="number"
                              min={1}
                              value={leg.pets.petCount || 1}
                              onChange={(e) =>
                                handleLegChange(index, "pets", {
                                  ...leg.pets,
                                  petCount: Number(e.target.value)
                                })
                              }
                              className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 font-bold outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Total Weight (kg)</label>
                            <input
                              type="number"
                              min={1}
                              value={leg.pets.totalWeightKg || 12}
                              onChange={(e) =>
                                handleLegChange(index, "pets", {
                                  ...leg.pets,
                                  totalWeightKg: Number(e.target.value)
                                })
                              }
                              className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 font-bold outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Breed / Type</label>
                            <input
                              type="text"
                              value={leg.pets.petType || ""}
                              onChange={(e) =>
                                handleLegChange(index, "pets", {
                                  ...leg.pets,
                                  petType: e.target.value
                                })
                              }
                              className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: Luggage */}
                  {currentTab === "luggage" && (
                    <div className="p-4 bg-white rounded-xl border border-[#E0DAD0] space-y-3 text-xs">
                      <span className="font-bold font-mono text-[#0F1420] uppercase flex items-center gap-1.5 pb-2 border-b border-gray-100">
                        <Briefcase className="w-4 h-4 text-[#C9A052]" />
                        Luggage Estimates & Dimensions for Leg #{index + 1}
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Suitcases</label>
                          <input
                            type="number"
                            min={0}
                            value={leg.luggage?.standardSuitcases ?? 2}
                            onChange={(e) =>
                              handleLegChange(index, "luggage", {
                                ...leg.luggage,
                                standardSuitcases: Number(e.target.value)
                              })
                            }
                            className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 font-bold outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Total Pieces</label>
                          <input
                            type="number"
                            min={0}
                            value={leg.luggage?.pieceCount ?? 4}
                            onChange={(e) =>
                              handleLegChange(index, "luggage", {
                                ...leg.luggage,
                                pieceCount: Number(e.target.value)
                              })
                            }
                            className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 font-bold outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Weight (kg)</label>
                          <input
                            type="number"
                            min={0}
                            value={leg.luggage?.totalWeightKg ?? 50}
                            onChange={(e) =>
                              handleLegChange(index, "luggage", {
                                ...leg.luggage,
                                totalWeightKg: Number(e.target.value)
                              })
                            }
                            className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 font-bold outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: Ground Handling Agent Details */}
                  {currentTab === "handling" && (
                    <div className="bg-white p-4 rounded-xl border border-[#E0DAD0] space-y-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase text-[#0F1420]">
                        <Building className="w-3.5 h-3.5 text-[#C9A052]" />
                        <span>FBO Ground Handling Contact Details for Leg #{index + 1}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        {/* Departure Handler */}
                        <div className="p-3 bg-[#F9F8F5] rounded-xl border border-[#E0DAD0] space-y-2">
                          <span className="text-[10px] font-mono font-bold uppercase text-[#9A7A35]">
                            Departure FBO ({origAirport.name})
                          </span>
                          <input
                            type="text"
                            value={leg.depHandlerName}
                            onChange={(e) => handleLegChange(index, "depHandlerName", e.target.value)}
                            className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1 text-xs text-[#0F1420] font-bold"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="tel"
                              value={leg.depHandlerPhone}
                              onChange={(e) => handleLegChange(index, "depHandlerPhone", e.target.value)}
                              className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1 text-xs font-mono"
                            />
                            <input
                              type="email"
                              value={leg.depHandlerEmail}
                              onChange={(e) => handleLegChange(index, "depHandlerEmail", e.target.value)}
                              className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1 text-xs"
                            />
                          </div>
                        </div>

                        {/* Arrival Handler */}
                        <div className="p-3 bg-[#F9F8F5] rounded-xl border border-[#E0DAD0] space-y-2">
                          <span className="text-[10px] font-mono font-bold uppercase text-emerald-800">
                            Arrival FBO ({destAirport.name})
                          </span>
                          <input
                            type="text"
                            value={leg.arrHandlerName}
                            onChange={(e) => handleLegChange(index, "arrHandlerName", e.target.value)}
                            className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1 text-xs text-[#0F1420] font-bold"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="tel"
                              value={leg.arrHandlerPhone}
                              onChange={(e) => handleLegChange(index, "arrHandlerPhone", e.target.value)}
                              className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1 text-xs font-mono"
                            />
                            <input
                              type="email"
                              value={leg.arrHandlerEmail}
                              onChange={(e) => handleLegChange(index, "arrHandlerEmail", e.target.value)}
                              className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 4: Concierge & Additional Services (De-Icing Options Removed as Requested) */}
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E0DAD0]">
            <Shield className="w-4 h-4 text-[#C9A052]" />
            <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[#0F1420]">
              4. Concierge Services, Ground Transportation & Cancellation Policy
            </h3>
          </div>

          {/* Ground Transfers & Helicopter */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold uppercase text-[#0F1420]">
              VIP Ground Transfers & Concierge Options
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <label className="flex items-center gap-2 p-3 rounded-xl border border-[#E0DAD0] bg-[#FDFCFA] hover:bg-[#F5F2EC] cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={services.limousineService}
                  onChange={(e) => setServices({ ...services, limousineService: e.target.checked })}
                  className="rounded text-[#C9A052] focus:ring-[#C9A052]"
                />
                <span className="font-medium text-[#0F1420]">VIP Limousine Service</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-[#E0DAD0] bg-[#FDFCFA] hover:bg-[#F5F2EC] cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={services.luxuryCarRental}
                  onChange={(e) => setServices({ ...services, luxuryCarRental: e.target.checked })}
                  className="rounded text-[#C9A052] focus:ring-[#C9A052]"
                />
                <span className="font-medium text-[#0F1420]">Luxury Car Rental</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-[#E0DAD0] bg-[#FDFCFA] hover:bg-[#F5F2EC] cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={services.helicopterService}
                  onChange={(e) => setServices({ ...services, helicopterService: e.target.checked })}
                  className="rounded text-[#C9A052] focus:ring-[#C9A052]"
                />
                <span className="font-medium text-[#0F1420]">Helicopter Connection</span>
              </label>
            </div>
          </div>

          {/* Cancellation Policy Placeholder (User Request: "Cancellation Policy: Will be updated later") */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F1420] font-mono">
                Cancellation Policy
              </span>
              <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                Will be updated later
              </span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Cancellation Policy: Will be updated later. Standard private aviation charter terms apply. Final cancellation policy terms will be confirmed in the contract.
            </p>
          </div>
        </div>

        {/* SECTION 5: Commercial Pricing Breakdown & Remittance */}
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E0DAD0]">
            <div className="flex items-center gap-2.5">
              <Landmark className="w-4 h-4 text-[#C9A052]" />
              <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                5. Commercial Pricing & Remittance Details
              </h3>
            </div>

            <label className="flex items-center gap-2 text-xs font-mono font-bold text-[#0F1420] cursor-pointer">
              <input
                type="checkbox"
                checked={overridePricing}
                onChange={(e) => setOverridePricing(e.target.checked)}
                className="rounded text-[#C9A052] focus:ring-[#C9A052]"
              />
              <span>Manual Price Override</span>
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <label className="block text-[10px] text-gray-500 mb-1">Base Flight Price</label>
              <input
                type="number"
                value={effectivePricing.flightPrice}
                onChange={(e) => setCustomFlightPrice(Number(e.target.value))}
                disabled={!overridePricing}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-bold text-[#0F1420] disabled:bg-[#F5F2EC]"
              />
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 mb-1">Airport & Handling Fees</label>
              <input
                type="number"
                value={effectivePricing.airportFees}
                onChange={(e) => setCustomAirportFees(Number(e.target.value))}
                disabled={!overridePricing}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-bold text-[#0F1420] disabled:bg-[#F5F2EC]"
              />
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 mb-1">Passenger Surcharges</label>
              <input
                type="number"
                value={effectivePricing.passengerFees}
                onChange={(e) => setCustomPassengerFees(Number(e.target.value))}
                disabled={!overridePricing}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-bold text-[#0F1420] disabled:bg-[#F5F2EC]"
              />
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 mb-1">Total Charter Flight Price</label>
              <div className="w-full bg-[#FAF9F6] border border-[#C9A052]/40 rounded-xl px-3 py-2 text-xs font-black text-[#9A7A35]">
                {formatCurrency(effectivePricing.totalFlightPrice, currency)}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 6: Submission & Action Flow Buttons */}
        <div className="bg-[#0F1420] text-white border border-[#1C2436] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#1C2436]">
            <div>
              <span className="text-xs uppercase font-mono tracking-wider text-[#C9A052] font-bold">
                FINAL TOTAL CHARTER FLIGHT PRICE
              </span>
              <h3 className="text-3xl font-black text-white font-mono mt-0.5">
                {formatCurrency(effectivePricing.totalFlightPrice, currency)}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Subtotal: {formatCurrency(effectivePricing.subtotal, currency)} • International Aviation VAT Exempt 0%
              </p>
            </div>

            {/* End-to-End Action Buttons: Quote -> Contract -> Booked Contract */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Action 1: Generate Quote PDF */}
              <button
                type="submit"
                className="py-3 px-4 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                title="Save Quotation and Open Official PDF Document"
              >
                <FileText className="w-4 h-4" />
                <span>Generate Quote PDF</span>
              </button>

              {/* Action 2: Advance Quote -> Contract */}
              <button
                type="button"
                onClick={handleProceedToContract}
                className="py-3 px-4 rounded-xl bg-[#1C2436] hover:bg-[#28324a] text-white border border-gray-600 font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                title="Save Quote and Advance to Contract Generation"
              >
                <ScrollText className="w-4 h-4 text-[#C9A052]" />
                <span>Proceed to Contract</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C9A052]" />
              </button>

              {/* Action 3: Contract -> Booked Contract (Assigns Call Sign & Trip ID) */}
              <button
                type="button"
                onClick={handleConfirmAndBookFlight}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                title="Lock in Confirmed Booking with Assigned Call Sign & Trip ID"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Book Flight</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
            <div>
              <span className="text-gray-400 text-[10px]">BASE FLIGHT</span>
              <p className="font-bold text-gray-200">{formatCurrency(effectivePricing.flightPrice, currency)}</p>
            </div>
            <div>
              <span className="text-gray-400 text-[10px]">AIRPORT FEES</span>
              <p className="font-bold text-gray-200">{formatCurrency(effectivePricing.airportFees, currency)}</p>
            </div>
            <div>
              <span className="text-gray-400 text-[10px]">PASSENGER FEES</span>
              <p className="font-bold text-gray-200">{formatCurrency(effectivePricing.passengerFees, currency)}</p>
            </div>
            <div>
              <span className="text-gray-400 text-[10px]">SERVICES</span>
              <p className="font-bold text-gray-200">{formatCurrency(effectivePricing.additionalServicesTotal, currency)}</p>
            </div>
            <div>
              <span className="text-[#C9A052] text-[10px]">ALL-INCLUSIVE TOTAL</span>
              <p className="font-black text-[#C9A052] text-sm">{formatCurrency(effectivePricing.totalFlightPrice, currency)}</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
