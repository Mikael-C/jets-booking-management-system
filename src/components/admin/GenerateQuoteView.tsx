"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAviation } from "@/lib/aviationContext";
import { airportsData, findAirportByCode, getAirportFbos, getDefaultHandlingAgent, searchAirports } from "@/data/airports";
import AirportSearchSelect from "@/components/common/AirportSearchSelect";
import { fleetData } from "@/data/fleet";
import { defaultOperator } from "@/data/initialBookings";
import { Booking, FlightLeg, AdditionalServices, TripType, PetDetails, LuggageDetails, Airport, FboOption, Aircraft } from "@/types/aviation";
import {
  calculatePricing,
  calculateDistanceNm,
  formatFlightTime,
  estimateFlightTimeMinutes,
  formatCurrency,
  calculateCardFee
} from "@/lib/pricingCalculator";
import { calculateLegArrivalAndTz } from "@/lib/aviationTimezones";
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
  CheckSquare,
  Camera,
  Upload,
  RotateCcw,
  Lock
} from "lucide-react";

interface QuoteLegInput {
  originIcao: string;
  destIcao: string;
  aircraftId: string;
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
  durationOverrideMinutes?: number;
}

const DEFAULT_AIRCRAFT_ID = "cessna-citation-mustang";

function createQuoteLegInput(
  originIcao: string,
  destIcao: string,
  flightDate: string,
  paxCount: number,
  aircraftId: string,
  departureTime: string,
): QuoteLegInput {
  const originAirport = findAirportByCode(originIcao);
  const destinationAirport = findAirportByCode(destIcao);
  const distance = calculateDistanceNm(
    originAirport.coordinates?.lat || 46.2,
    originAirport.coordinates?.lng || 6.1,
    destinationAirport.coordinates?.lat || 44.4,
    destinationAirport.coordinates?.lng || 8.8,
  );
  const arrivalTime = calculateLegArrivalAndTz(
    originAirport,
    destinationAirport,
    departureTime,
    estimateFlightTimeMinutes(distance),
  ).arrivalTimeLocal;
  const departureFbo = originAirport.fbos?.[0];
  const arrivalFbo = destinationAirport.fbos?.[0];

  return {
    originIcao,
    destIcao,
    aircraftId,
    flightDate,
    departureTime,
    arrivalTime,
    paxCount,
    depHandlerName: departureFbo?.name || `${originAirport.name} FBO`,
    depHandlerPhone: departureFbo?.phone || "",
    depHandlerEmail: departureFbo?.email || "",
    arrHandlerName: arrivalFbo?.name || `${destinationAirport.name} FBO`,
    arrHandlerPhone: arrivalFbo?.phone || "",
    arrHandlerEmail: arrivalFbo?.email || "",
  };
}

function updateQuoteLegAirport(
  leg: QuoteLegInput,
  field: "originIcao" | "destIcao",
  code: string,
): QuoteLegInput {
  const airport = findAirportByCode(code);
  const fbo = airport.fbos?.[0];

  if (field === "originIcao") {
    return {
      ...leg,
      originIcao: code,
      depHandlerName: fbo?.name || `${airport.name} FBO`,
      depHandlerPhone: fbo?.phone || "",
      depHandlerEmail: fbo?.email || "",
    };
  }

  return {
    ...leg,
    destIcao: code,
    arrHandlerName: fbo?.name || `${airport.name} FBO`,
    arrHandlerPhone: fbo?.phone || "",
    arrHandlerEmail: fbo?.email || "",
  };
}

function updateQuoteLegArrival(leg: QuoteLegInput): QuoteLegInput {
  const originAirport = findAirportByCode(leg.originIcao);
  const destinationAirport = findAirportByCode(leg.destIcao);
  const distance = calculateDistanceNm(
    originAirport.coordinates?.lat || 46.2,
    originAirport.coordinates?.lng || 6.1,
    destinationAirport.coordinates?.lat || 44.4,
    destinationAirport.coordinates?.lng || 8.8,
  );
  const duration = leg.durationOverrideMinutes || estimateFlightTimeMinutes(distance);

  return {
    ...leg,
    arrivalTime: calculateLegArrivalAndTz(
      originAirport,
      destinationAirport,
      leg.departureTime || "11:00",
      duration,
    ).arrivalTimeLocal,
  };
}

export default function GenerateQuoteView() {
  const { clients, addBooking, openDocument, prefillClientForQuote, setPrefillClientForQuote, currentUser, addAuditEntry, operators, addOperator, setActiveNav } = useAviation();

  // Operator selection (NF-08: Add unlisted operator with "documents pending" flag)
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>("op-1");
  const [isAddOperatorOpen, setIsAddOperatorOpen] = useState(false);
  const [unlistedOperatorName, setUnlistedOperatorName] = useState("");
  const [unlistedOperatorCountry, setUnlistedOperatorCountry] = useState("");
  const [unlistedOperatorAoc, setUnlistedOperatorAoc] = useState("");
  const [unlistedOperatorEmail, setUnlistedOperatorEmail] = useState("");
  const [customOperators, setCustomOperators] = useState<Array<{ id: string; name: string; country: string; aocNumber?: string; documentsPending?: boolean }>>([]);

  // Document & Contract Identifiers (Page 1 Details Box)
  const [contractDate, setContractDate] = useState("01.10.2026");
  const [accountNumber, setAccountNumber] = useState("ACC-21737");
  const [quoteExpirationDate, setQuoteExpirationDate] = useState("02.10.2026, 19:53z");
  const [currency, setCurrency] = useState<"EUR" | "USD" | "GBP" | "CHF">("EUR");

  // Margin Rules & Commission (MOD-05: Margin tier by trip value: 10% on €11,200, override switch without reason)
  const [isMarginOverride, setIsMarginOverride] = useState(false);
  const [overrideMarginAmount, setOverrideMarginAmount] = useState<number>(1120);
  const [curatorMarkupPct, setCuratorMarkupPct] = useState<number>(8); // Curator mark-up on cost + company margin (5–12%)
  const [isMarginPanelOpen, setIsMarginPanelOpen] = useState(false);
  const [marginType, setMarginType] = useState<"percentage" | "fixed">("percentage");
  const [marginValue, setMarginValue] = useState<number>(10);
  const [commissionPct, setCommissionPct] = useState<number>(8);
  const [quoteStatus, setQuoteStatus] = useState<"Draft" | "Sent" | "Pending" | "Undecided">("Draft");
  const [activeLegTabs, setActiveLegTabs] = useState<Record<number, "routing" | "pets" | "luggage" | "handling">>({});

  // Itemized Passenger Fees (NF-21)
  const [itemizePassengerFees, setItemizePassengerFees] = useState(false);
  const [paxFeeLegOption, setPaxFeeLegOption] = useState<"leg1" | "leg2" | "both">("both");
  const [paxFeeCalculation, setPaxFeeCalculation] = useState<"per_pax" | "flat">("per_pax");
  const [paxFeeAmount, setPaxFeeAmount] = useState<number>(40);
  const [customPaxCount, setCustomPaxCount] = useState<number>(4);

  // Client Details (Page 1 TO Box) & PA Representative (MOD-05)
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

  // Separate PA / Representative Contact (MOD-05)
  const [isHandledByPa, setIsHandledByPa] = useState(false);
  const [paName, setPaName] = useState("");
  const [paEmail, setPaEmail] = useState("");
  const [paPhone, setPaPhone] = useState("");

  // Combined Operators List (NF-08)
  const allOperators = useMemo(() => {
    const list = [...(operators || [])];
    customOperators.forEach((co) => {
      if (!list.find((o) => o.id === co.id)) {
        list.push({
          id: co.id,
          name: co.name,
          country: co.country,
          aocNumber: co.aocNumber,
          rating: 4.8,
          isApproved: true,
          documentsPending: true,
          fleetCount: 2,
          contactEmail: co.aocNumber,
          notes: "Unlisted operator - Documents pending",
        } as any);
      }
    });
    return list;
  }, [operators, customOperators]);

  // Handler for adding unlisted operator (NF-08 / Auto-save to database)
  const handleAddCustomOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlistedOperatorName.trim()) return;
    const newId = `op-${Date.now()}`;
    const opName = unlistedOperatorName.trim();
    const aoc = unlistedOperatorAoc.trim() || `AOC-${Math.floor(1000 + Math.random() * 9000)}`;
    const country = unlistedOperatorCountry.trim() || "Malta";
    const newOp: any = {
      id: newId,
      name: opName,
      legalName: opName,
      tradingName: opName,
      country: country,
      aocNumber: aoc,
      aocAuthority: country,
      aocExpiry: "2028-12-31",
      baseIcao: "LSGG",
      salesContact: "Charter Desk",
      salesEmail: `ops@${opName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
      opsPhone: "+41 22 700 0000",
      opsEmail: `ops@${opName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
      status: "approved",
      documentsPending: true,
      notes: "Unlisted operator - Documents pending",
      qualificationChecklist: [
        { id: "doc-1", docType: "Air Operator Certificate (AOC)", status: "pending", expiryDate: "2028-12-31" }
      ],
      createdAt: new Date().toISOString()
    };
    addOperator(newOp);
    setCustomOperators((prev) => [...prev, newOp]);
    setSelectedOperatorId(newId);
    setUnlistedOperatorName("");
    setUnlistedOperatorCountry("");
    setUnlistedOperatorAoc("");
    setIsAddOperatorOpen(false);
  };

  // ================= Aircraft Selection & Manual Overrides =================
  const [selectedAircraftId, setSelectedAircraftId] = useState(DEFAULT_AIRCRAFT_ID);
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

  const exteriorFileRef = React.useRef<HTMLInputElement>(null);
  const interiorFileRef = React.useRef<HTMLInputElement>(null);

  const handleImageFileChange = (file: File | undefined, type: "exterior" | "interior") => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const res = e.target?.result as string;
      if (res) {
        if (type === "exterior") setExteriorImageOverride(res);
        else setInteriorImageOverride(res);
      }
    };
    reader.readAsDataURL(file);
  };

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
  const [routeState, setRouteState] = useState<{
    tripType: TripType;
    legs: QuoteLegInput[];
  }>({
    tripType: "round_trip",
    legs: [
      {
        originIcao: "LSGG",
        destIcao: "LIMJ",
        aircraftId: DEFAULT_AIRCRAFT_ID,
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
        aircraftId: DEFAULT_AIRCRAFT_ID,
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
    ]
  });
  const { tripType, legs } = routeState;

  const activeLegs = useMemo(() => {
    if (tripType === "one_way") return legs.slice(0, 1);
    if (tripType === "round_trip") return legs.slice(0, 2);
    return legs;
  }, [legs, tripType]);

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

  const handleAddLeg = () => {
    if (tripType !== "multi_leg") return;

    const lastLeg = activeLegs[activeLegs.length - 1];
    const originIcao = lastLeg ? lastLeg.destIcao : "LSGG";
    const destIcao = originIcao === "LFPB" ? "LFMN" : "LFPB";
    const newLeg = createQuoteLegInput(
      originIcao,
      destIcao,
      lastLeg?.flightDate || new Date().toISOString().slice(0, 10),
      lastLeg?.paxCount || 2,
      lastLeg?.aircraftId || selectedAircraftId,
      "14:00",
    );
    setRouteState((current) => ({
      ...current,
      legs: [...current.legs, newLeg],
    }));
  };

  const handleRemoveLeg = (idx: number) => {
    if (tripType !== "multi_leg" || activeLegs.length <= 2) return;
    setRouteState((current) => ({
      ...current,
      legs: current.legs.filter((_, i) => i !== idx),
    }));
    setActiveLegTabs({});
  };

  const handleTripTypeChange = (nextTripType: TripType) => {
    setActiveLegTabs({});
    setRouteState((current) => {
      const currentLegs = current.legs;
      const firstLeg =
        currentLegs[0] ||
        createQuoteLegInput("LSGG", "LIMJ", new Date().toISOString().slice(0, 10), 2, selectedAircraftId, "11:00");

      if (nextTripType === "one_way") {
        // In one-way, retain existing legs in memory so toggling back preserves return settings
        return {
          tripType: nextTripType,
          legs: [{ ...firstLeg, aircraftId: selectedAircraftId }, ...currentLegs.slice(1)],
        };
      }

      if (nextTripType === "round_trip") {
        // In round-trip, ensure return leg exists and has origin locked to outbound dest and dest locked to outbound origin
        const returnLeg =
          currentLegs[1] ||
          createQuoteLegInput(
            firstLeg.destIcao,
            firstLeg.originIcao,
            firstLeg.flightDate,
            firstLeg.paxCount,
            selectedAircraftId,
            "15:00",
          );

        const syncedReturnLeg = updateQuoteLegArrival(
          updateQuoteLegAirport(
            updateQuoteLegAirport(
              {
                ...returnLeg,
                aircraftId: selectedAircraftId,
                paxCount: firstLeg.paxCount,
              },
              "originIcao",
              firstLeg.destIcao,
            ),
            "destIcao",
            firstLeg.originIcao,
          ),
        );

        return {
          tripType: nextTripType,
          legs: [{ ...firstLeg, aircraftId: selectedAircraftId }, syncedReturnLeg, ...currentLegs.slice(2)],
        };
      }

      // nextTripType === "multi_leg"
      // Ensure at least 2 legs are available with full flexibility for airports and jets
      const secondLeg =
        currentLegs[1] ||
        createQuoteLegInput(
          firstLeg.destIcao,
          firstLeg.destIcao === "LFPB" ? "LFMN" : "LFPB",
          firstLeg.flightDate,
          firstLeg.paxCount,
          selectedAircraftId,
          "15:00",
        );

      return {
        tripType: nextTripType,
        legs: [firstLeg, secondLeg, ...currentLegs.slice(2)],
      };
    });
  };

  const handleGlobalAircraftChange = (aircraftId: string) => {
    setSelectedAircraftId(aircraftId);
    setRouteState((current) => ({
      ...current,
      legs: current.legs.map((leg) => ({ ...leg, aircraftId })),
    }));
  };

  const handleLegChange = (idx: number, field: keyof QuoteLegInput, val: any) => {
    setRouteState((current) => {
      const updated = [...current.legs];
      updated[idx] =
        field === "originIcao" || field === "destIcao"
          ? updateQuoteLegAirport(current.legs[idx], field, val)
          : { ...current.legs[idx], [field]: val };

      const shouldRecalculateArrival =
        field === "departureTime" ||
        field === "originIcao" ||
        field === "destIcao" ||
        field === "durationOverrideMinutes";
      if (shouldRecalculateArrival) {
        updated[idx] = updateQuoteLegArrival(updated[idx]);
      }

      // If round trip and changing outbound leg (idx 0), lock & sync return leg (idx 1)
      if (current.tripType === "round_trip" && idx === 0 && updated.length > 1) {
        if (field === "originIcao" || field === "destIcao") {
          const returnField = field === "originIcao" ? "destIcao" : "originIcao";
          updated[1] = updateQuoteLegArrival(
            updateQuoteLegAirport(updated[1], returnField, val),
          );
        }
        if (field === "paxCount") {
          updated[1] = { ...updated[1], paxCount: val };
        }
      }

      return { ...current, legs: updated };
    });
  };

  // Compile full flight legs (No callsign on quote)
  const compiledLegs: FlightLeg[] = useMemo(() => {
    return activeLegs.map((leg, idx) => {
      const legAircraft = fleetData.find((aircraft) => aircraft.id === leg.aircraftId) || currentAircraft;
      const originAirport = findAirportByCode(leg.originIcao);
      const destAirport = findAirportByCode(leg.destIcao);
      const dist = calculateDistanceNm(
        originAirport.coordinates?.lat || 46.2,
        originAirport.coordinates?.lng || 6.1,
        destAirport.coordinates?.lat || 44.4,
        destAirport.coordinates?.lng || 8.8
      );
      const defaultMinutes = estimateFlightTimeMinutes(dist);
      const flightMinutes = leg.durationOverrideMinutes || defaultMinutes;
      const tzInfo = calculateLegArrivalAndTz(originAirport, destAirport, leg.departureTime || "11:00", flightMinutes);

      return {
        legNumber: idx + 1,
        flightDate: leg.flightDate,
        origin: originAirport,
        destination: destAirport,
        departureTimeLocal: leg.departureTime.includes("h") ? leg.departureTime : `${leg.departureTime} h`,
        arrivalTimeLocal: (leg.arrivalTime || tzInfo.arrivalTimeLocal).includes("h") ? (leg.arrivalTime || tzInfo.arrivalTimeLocal) : `${leg.arrivalTime || tzInfo.arrivalTimeLocal} h`,
        flightTimeMinutes: flightMinutes,
        manualDurationMinutes: leg.durationOverrideMinutes,
        isDurationOverridden: Boolean(leg.durationOverrideMinutes),
        departureTimeUtc: tzInfo.departureTimeUtc,
        arrivalTimeUtc: tzInfo.arrivalTimeUtc,
        originTz: tzInfo.origTz.label,
        destTz: tzInfo.destTz.label,
        tzDiffHours: tzInfo.tzDiffHours,
        originTimezone: tzInfo.origTz.tzName,
        destinationTimezone: tzInfo.destTz.tzName,
        timezoneDifferenceHours: tzInfo.tzDiffHours,
        flightTimeFormatted: formatFlightTime(flightMinutes),
        paxCount: leg.paxCount,
        flightNumber: "", // NO callsign on quote without booking!
        aircraftRegistration: legAircraft.registration || "",
        aircraftType: legAircraft.name,
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
  }, [activeLegs, currentAircraft, clientName]);

  const aircraftByLeg = useMemo(() => {
    return activeLegs.reduce<Record<number, Aircraft>>((selectedAircraft, leg, idx) => {
      selectedAircraft[idx + 1] =
        fleetData.find((aircraft) => aircraft.id === leg.aircraftId) || currentAircraft;
      return selectedAircraft;
    }, {});
  }, [activeLegs, currentAircraft]);

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
    return calculatePricing(effectiveAircraft, compiledLegs, services, currency, aircraftByLeg);
  }, [effectiveAircraft, compiledLegs, services, currency, aircraftByLeg]);

  // Itemized Passenger Fee Calculation (NF-21)
  const calculatedPassengerFee = useMemo(() => {
    if (!itemizePassengerFees) return autoPricing.passengerFees;
    const legMultiplier = paxFeeLegOption === "both" ? (activeLegs.length || 2) : 1;
    if (paxFeeCalculation === "per_pax") {
      return paxFeeAmount * customPaxCount * legMultiplier;
    } else {
      return paxFeeAmount * legMultiplier;
    }
  }, [itemizePassengerFees, paxFeeLegOption, activeLegs.length, paxFeeCalculation, paxFeeAmount, customPaxCount, autoPricing.passengerFees]);

  const effectivePricing = useMemo(() => {
    if (overridePricing) {
      return {
        flightPrice: customFlightPrice,
        airportFees: customAirportFees,
        passengerFees: itemizePassengerFees ? calculatedPassengerFee : customPassengerFees,
        dayOfWeekDiscount: customDayOfWeekDiscount,
        inboundPassengerTax: customInboundTax,
        outboundPassengerTax: customOutboundTax,
        additionalServicesTotal: customAdditionalServices,
        subtotal:
          customFlightPrice +
          customAirportFees +
          (itemizePassengerFees ? calculatedPassengerFee : customPassengerFees) +
          customDayOfWeekDiscount +
          customInboundTax +
          customOutboundTax +
          customAdditionalServices,
        vatRate: 0,
        vatAmount: 0,
        totalFlightPrice:
          customFlightPrice +
          customAirportFees +
          (itemizePassengerFees ? calculatedPassengerFee : customPassengerFees) +
          customDayOfWeekDiscount +
          customInboundTax +
          customOutboundTax +
          customAdditionalServices,
        currency
      };
    }
    const paxDiff = itemizePassengerFees ? (calculatedPassengerFee - autoPricing.passengerFees) : 0;
    return {
      ...autoPricing,
      passengerFees: itemizePassengerFees ? calculatedPassengerFee : autoPricing.passengerFees,
      subtotal: autoPricing.subtotal + paxDiff,
      totalFlightPrice: autoPricing.totalFlightPrice + paxDiff,
      currency
    };
  }, [
    overridePricing,
    customFlightPrice,
    customAirportFees,
    customPassengerFees,
    customDayOfWeekDiscount,
    customInboundTax,
    customOutboundTax,
    customAdditionalServices,
    currency,
    autoPricing,
    itemizePassengerFees,
    calculatedPassengerFee
  ]);

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
    const statusVal = isBookedFlight ? "confirmed" : (quoteStatus === "Sent" ? "quote_sent" : "draft");
    const quoteStatusVal = isBookedFlight ? "accepted" : (quoteStatus.toLowerCase() as any);
    const cardFee = calculateCardFee(effectivePricing.totalFlightPrice);

    const chosenOp = allOperators.find((o) => o.id === selectedOperatorId);

    return {
      id: "",
      tripId: "",
      quoteGroupId: "",
      quoteId: "",
      tripNumber: "",
      quoteReference: "",
      invoiceNumber: "",
      isBooked: isBookedFlight,
      accountNumber,
      contractDate,
      quoteExpirationDate,
      paymentDueDate: new Date(Date.now() + 86400000 * 3).toLocaleDateString("de-DE"),
      status: statusVal,
      quoteStatus: quoteStatusVal,
      quoteVersion: 1,
      commissionPercentage: curatorMarkupPct,
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
      paContact: isHandledByPa && paName ? { name: paName, email: paEmail, phone: paPhone } : undefined,
      isHandledByPa,
      paName: isHandledByPa ? paName : undefined,
      paEmail: isHandledByPa ? paEmail : undefined,
      paPhone: isHandledByPa ? paPhone : undefined,
      operator: {
        ...defaultOperator,
        name: (chosenOp as any)?.name || (chosenOp as any)?.tradingName || (chosenOp as any)?.legalName || defaultOperator.name,
        country: (chosenOp as any)?.country || defaultOperator.country,
        documentsPending: Boolean((chosenOp as any)?.documentsPending),
        representativeName: repName || defaultOperator.representativeName,
        bankName: bankName || defaultOperator.bankName,
        iban: iban || defaultOperator.iban,
        bic: bic || defaultOperator.bic,
        accountHolder: accountHolder || defaultOperator.accountHolder
      },
      operatorName: (chosenOp as any)?.name || (chosenOp as any)?.tradingName || (chosenOp as any)?.legalName || defaultOperator.name,
      legs: compiledLegs.map(l => ({
        ...l,
        flightNumber: ""
      })),
      pricing: {
        ...effectivePricing,
        operatorCost: autoPricing.flightPrice,
        companyMargin: isMarginOverride ? overrideMarginAmount : Math.round(autoPricing.flightPrice * (autoPricing.flightPrice < 25000 ? 0.10 : autoPricing.flightPrice <= 60000 ? 0.08 : 0.06)),
        agentCommission: Math.round(autoPricing.flightPrice * (curatorMarkupPct / 100)),
        agentCommissionRate: curatorMarkupPct / 100,
      },
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

  const validateQuoteSum = (): boolean => {
    const flightPrice = effectivePricing.flightPrice;
    const airportFees = effectivePricing.airportFees;
    const passengerFees = effectivePricing.passengerFees;
    const discount = effectivePricing.dayOfWeekDiscount || 0;
    const taxes = (effectivePricing.inboundPassengerTax || 0) + (effectivePricing.outboundPassengerTax || 0);
    const services = effectivePricing.additionalServicesTotal || 0;
    const lineSum = flightPrice + airportFees + passengerFees + discount + taxes + services;
    const grandTotal = effectivePricing.totalFlightPrice;
    if (Math.abs(lineSum - grandTotal) > 0.01) {
      alert(`Validation Error (MOD-09): Individual PDF lines (${formatCurrency(lineSum, currency)}) do not match the total quote price (${formatCurrency(grandTotal, currency)}). Generation blocked.`);
      return false;
    }
    return true;
  };

  const handleGenerateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateQuoteSum()) return;
    const newBooking = await addBooking(createBookingObject(false));
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
  const handleProceedToContract = async () => {
    if (!validateQuoteSum()) return;
    const newBooking = await addBooking(createBookingObject(false));
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
  const handleConfirmAndBookFlight = async () => {
    const newBooking = await addBooking(createBookingObject(true));
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
                onChange={(e) => handleTripTypeChange(e.target.value as TripType)}
                className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                aria-label="Trip type"
              >
                <option value="round_trip">Round-Trip</option>
                <option value="one_way">One-Way Charter</option>
                <option value="multi_leg">Multiple Legs</option>
              </select>
              <p className="mt-1.5 text-[10px] leading-relaxed text-[#0F1420]/70" aria-live="polite">
                {tripType === "one_way" && "One-way route · 1 flight leg input"}
                {tripType === "round_trip" && "Round-trip route · 2 legs (return departure locked to leg 1 arrival)"}
                {tripType === "multi_leg" &&
                  `Multiple legs · ${activeLegs.length} flight legs (flexible airports & individual jet options per leg)`}
              </p>
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
                Quote ID (assigned on save)
              </label>
              <input
                type="text"
                value="Assigned by the server when saved"
                readOnly
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
                readOnly
                required
                title="Account number is assigned to the selected client"
                className="w-full bg-gray-100 border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-[#0F1420] cursor-not-allowed"
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

            {/* PA / Representative Contact (MOD-05) */}
            <div className="sm:col-span-2 md:col-span-3 pt-3 border-t border-[#E0DAD0]/60">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={isHandledByPa}
                  onChange={(e) => setIsHandledByPa(e.target.checked)}
                  className="rounded text-[#C9A052] focus:ring-[#C9A052]"
                />
                <span className="text-xs font-bold text-[#0F1420]">
                  Personal Assistant / Representative Contact (separate from Authorised Owner - MOD-05)
                </span>
              </label>

              {isHandledByPa && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-[#FAF9F6] border border-[#E0DAD0] rounded-xl mt-2">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                      PA / Rep Full Name *
                    </label>
                    <input
                      type="text"
                      value={paName}
                      onChange={(e) => setPaName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-3 py-1.5 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                      PA Direct Email *
                    </label>
                    <input
                      type="email"
                      value={paEmail}
                      onChange={(e) => setPaEmail(e.target.value)}
                      placeholder="s.jenkins@familyoffice.com"
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-3 py-1.5 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                      PA Mobile / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      value={paPhone}
                      onChange={(e) => setPaPhone(e.target.value)}
                      placeholder="+44 7700 900077"
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-3 py-1.5 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* OPERATOR SOURCING & FLEET PARTNER (NF-08, MOD-05, MOD-15) */}
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E0DAD0]">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-[#C9A052]" />
              <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                Operating Carrier / Sourced Operator (Admin Internal)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsAddOperatorOpen(!isAddOperatorOpen)}
              className="text-xs font-mono font-bold text-[#C9A052] hover:text-[#9A7A35] flex items-center gap-1.5"
            >
              <span>+ Add Unlisted Operator (NF-08)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Select Sourced Operator (AOC Holder)
              </label>
              <select
                value={selectedOperatorId}
                onChange={(e) => setSelectedOperatorId(e.target.value)}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-medium text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              >
                {allOperators.map((op: any) => (
                  <option key={op.id} value={op.id}>
                    {op.name || op.tradingName || op.legalName} {op.country ? `(${op.country})` : ""} {op.documentsPending ? "[DOCUMENTS PENDING]" : ""}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-[#0F1420]/60 italic">
                * Note (MOD-15): Carrier identity is masked on client/curator documents as &quot;approved AOC holder (the operating carrier)&quot;.
              </p>
            </div>

            {/* Selected Operator Status Pill */}
            {(() => {
              const op = allOperators.find((o) => o.id === selectedOperatorId) as any;
              return (
                <div className="p-3 bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#0F1420]">
                        {op?.name || op?.tradingName || op?.legalName || "Standard Partner Carrier"}
                      </span>
                      {op?.documentsPending ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Documents Pending
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          AOC Approved
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-[#0F1420]/70 block">
                      AOC: {op?.aocNumber || "AOC-EU-8921"} • Country: {op?.country || "Malta"}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Form to add an unlisted operator (NF-08) */}
          {isAddOperatorOpen && (
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3 mt-3">
              <span className="text-xs font-bold text-amber-900 block font-mono uppercase">
                Add New Unlisted Operator (Saved with &quot;Documents Pending&quot; Flag - NF-08)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Operator / Airline Name *"
                  value={unlistedOperatorName}
                  onChange={(e) => setUnlistedOperatorName(e.target.value)}
                  className="bg-white border border-[#E0DAD0] rounded-lg px-3 py-1.5 text-xs text-[#0F1420]"
                />
                <input
                  type="text"
                  placeholder="Country of AOC (e.g. Austria)"
                  value={unlistedOperatorCountry}
                  onChange={(e) => setUnlistedOperatorCountry(e.target.value)}
                  className="bg-white border border-[#E0DAD0] rounded-lg px-3 py-1.5 text-xs text-[#0F1420]"
                />
                <input
                  type="text"
                  placeholder="AOC Number (optional)"
                  value={unlistedOperatorAoc}
                  onChange={(e) => setUnlistedOperatorAoc(e.target.value)}
                  className="bg-white border border-[#E0DAD0] rounded-lg px-3 py-1.5 text-xs text-[#0F1420]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOperatorOpen(false)}
                  className="px-3 py-1 text-xs text-gray-600 hover:text-black"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomOperator}
                  className="px-4 py-1.5 bg-[#0F1420] text-white rounded-lg text-xs font-mono font-bold hover:bg-black"
                >
                  Save Operator (Pending Docs)
                </button>
              </div>
            </div>
          )}
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
              {tripType === "multi_leg" ? (
                <>Primary Fleet Baseline: <strong className="text-[#0F1420]">{effectiveAircraft.name}</strong></>
              ) : (
                <>Selected: <strong className="text-[#0F1420]">{effectiveAircraft.name}</strong></>
              )}
            </span>
          </div>

          {tripType === "multi_leg" && (
            <div className="p-3.5 bg-amber-500/10 border border-[#C9A052]/40 rounded-xl flex items-start gap-3 text-xs text-[#0F1420]">
              <Sparkles className="w-4 h-4 text-[#C9A052] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold font-mono uppercase text-[#9A7A35] block">
                  Multiple Legs Mode Active — Individual Jet Selection Enabled
                </span>
                <span className="text-[11px] text-[#0F1420]/80">
                  You can assign different aircraft to individual legs below in Section 3. The aircraft configured here sets the default proposal specifications and imagery.
                </span>
              </div>
            </div>
          )}

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
                        handleGlobalAircraftChange(jet.id);
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

            {/* Custom Pictures Input (Exterior & Interior) - Click to Upload */}
            <input
              type="file"
              ref={exteriorFileRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                handleImageFileChange(e.target.files?.[0], "exterior");
                e.target.value = "";
              }}
            />
            <input
              type="file"
              ref={interiorFileRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                handleImageFileChange(e.target.files?.[0], "interior");
                e.target.value = "";
              }}
            />

            <div className="pt-3 border-t border-[#E0DAD0] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono uppercase text-[#0F1420]/70 flex items-center gap-1 font-bold">
                    <ImageIcon className="w-3 h-3 text-[#C9A052]" />
                    Aircraft Exterior Photo
                  </label>
                  {exteriorImageOverride && exteriorImageOverride !== currentAircraft.imageExterior && (
                    <button
                      type="button"
                      onClick={() => setExteriorImageOverride(currentAircraft.imageExterior || "")}
                      className="text-[10px] font-mono text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> Reset
                    </button>
                  )}
                </div>
                <div
                  onClick={() => exteriorFileRef.current?.click()}
                  className="h-36 rounded-xl overflow-hidden border-2 border-dashed border-[#E0DAD0] hover:border-[#C9A052] bg-[#141A29] relative cursor-pointer group transition-all"
                  title="Click to replace aircraft exterior image"
                >
                  <img
                    src={exteriorImageOverride || currentAircraft.imageExterior}
                    alt="Exterior"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white text-center p-2">
                    <Camera className="w-5 h-5 text-[#C9A052]" />
                    <span className="text-[11px] font-bold">Click to Upload / Replace</span>
                    <span className="text-[9px] text-gray-300 font-mono">PNG, JPG, WEBP</span>
                  </div>
                  <div className="absolute bottom-1.5 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[9px] font-mono font-bold text-white flex items-center gap-1">
                    <Upload className="w-2.5 h-2.5 text-[#C9A052]" /> Click to replace
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono uppercase text-[#0F1420]/70 flex items-center gap-1 font-bold">
                    <ImageIcon className="w-3 h-3 text-[#C9A052]" />
                    VIP Cabin Interior Photo
                  </label>
                  {interiorImageOverride && interiorImageOverride !== currentAircraft.imageInterior && (
                    <button
                      type="button"
                      onClick={() => setInteriorImageOverride(currentAircraft.imageInterior || "")}
                      className="text-[10px] font-mono text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> Reset
                    </button>
                  )}
                </div>
                <div
                  onClick={() => interiorFileRef.current?.click()}
                  className="h-36 rounded-xl overflow-hidden border-2 border-dashed border-[#E0DAD0] hover:border-[#C9A052] bg-[#141A29] relative cursor-pointer group transition-all"
                  title="Click to replace cabin interior image"
                >
                  <img
                    src={interiorImageOverride || currentAircraft.imageInterior}
                    alt="Interior"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white text-center p-2">
                    <Camera className="w-5 h-5 text-[#C9A052]" />
                    <span className="text-[11px] font-bold">Click to Upload / Replace</span>
                    <span className="text-[9px] text-gray-300 font-mono">PNG, JPG, WEBP</span>
                  </div>
                  <div className="absolute bottom-1.5 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[9px] font-mono font-bold text-white flex items-center gap-1">
                    <Upload className="w-2.5 h-2.5 text-[#C9A052]" /> Click to replace
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Flight Routing, Airport Names & Respective FBOs */}
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#E0DAD0] gap-2">
            <div className="flex items-center gap-2.5">
              <Plane className="w-4 h-4 text-[#C9A052]" />
              <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                3. Flight Routing, Airport Names & Respective FBO Handling
              </h3>
              <span className="text-[10px] font-mono font-bold text-[#9A7A35] bg-[#C9A052]/10 border border-[#C9A052]/20 rounded-full px-2.5 py-1">
                {tripType === "one_way" && "1 LEG (ONE-WAY CHARTER)"}
                {tripType === "round_trip" && "2 LEGS (ROUND-TRIP ROUTE)"}
                {tripType === "multi_leg" && `${activeLegs.length} LEGS (MULTIPLE LEGS)`}
              </span>
            </div>

            {tripType === "multi_leg" && (
              <button
                type="button"
                onClick={handleAddLeg}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F1420] text-white hover:bg-[#1A2338] text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-[#C9A052]" />
                <span>Add Flight Leg</span>
              </button>
            )}
          </div>

          <div className="space-y-5">
            {activeLegs.map((leg, index) => {
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
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-[#0F1420] text-[#C9A052] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-xs font-mono font-extrabold text-[#0F1420]">
                        {tripType === "round_trip" && index === 0 && (
                          `Flight Leg #1 (Outbound): ${origAirport.city} (${origAirport.icao}) → ${destAirport.city} (${destAirport.icao})`
                        )}
                        {tripType === "round_trip" && index === 1 && (
                          `Flight Leg #2 (Return): ${origAirport.city} (${origAirport.icao}) → ${destAirport.city} (${destAirport.icao})`
                        )}
                        {tripType === "one_way" && (
                          `Flight Leg #1 (One-Way): ${origAirport.city} (${origAirport.icao}) → ${destAirport.city} (${destAirport.icao})`
                        )}
                        {tripType === "multi_leg" && (
                          `Flight Leg #${index + 1}: ${origAirport.city} (${origAirport.icao}) → ${destAirport.city} (${destAirport.icao})`
                        )}
                      </span>
                      {tripType === "round_trip" && index === 1 && (
                        <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 border border-amber-300 rounded px-2 py-0.5 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Return Route Locked
                        </span>
                      )}
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

                      {tripType === "multi_leg" && activeLegs.length > 2 && (
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
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 flex items-center gap-1">
                              <span>Origin Airport</span>
                              {tripType === "round_trip" && index === 1 && (
                                <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300 flex items-center gap-0.5">
                                  <Lock className="w-2.5 h-2.5" /> Locked to Leg 1 Arrival
                                </span>
                              )}
                            </label>
                          </div>
                          {tripType === "round_trip" && index === 1 ? (
                            <div className="w-full bg-[#EDE9DF]/80 border border-[#D5CEBF] rounded-lg px-2.5 py-2 text-xs text-[#0F1420] font-mono font-bold flex items-center justify-between shadow-xs cursor-not-allowed">
                              <span className="truncate">
                                [{origAirport.icao}] {origAirport.city} — {origAirport.name}
                              </span>
                              <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0 ml-2" />
                            </div>
                          ) : (
                            <AirportSearchSelect
                              value={leg.originIcao}
                              onChange={(val) => handleLegChange(index, "originIcao", val)}
                            />
                          )}
                          {tripType === "round_trip" && index === 1 ? (
                            <p className="mt-1 text-[10px] text-amber-800 font-medium">
                              Automatically locked to the arrival airport of Leg #1 ({origAirport.name}).
                            </p>
                          ) : (
                            <p className="text-[10px] text-gray-500 mt-1 truncate">
                              {origAirport.name} ({origAirport.country})
                            </p>
                          )}
                        </div>

                        {/* Destination Airport */}
                        <div className="md:col-span-2">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 flex items-center gap-1">
                              <span>Destination Airport</span>
                              {tripType === "round_trip" && index === 1 && (
                                <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300 flex items-center gap-0.5">
                                  <Lock className="w-2.5 h-2.5" /> Locked to Leg 1 Departure
                                </span>
                              )}
                            </label>
                          </div>
                          {tripType === "round_trip" && index === 1 ? (
                            <div className="w-full bg-[#EDE9DF]/80 border border-[#D5CEBF] rounded-lg px-2.5 py-2 text-xs text-[#0F1420] font-mono font-bold flex items-center justify-between shadow-xs cursor-not-allowed">
                              <span className="truncate">
                                [{destAirport.icao}] {destAirport.city} — {destAirport.name}
                              </span>
                              <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0 ml-2" />
                            </div>
                          ) : (
                            <AirportSearchSelect
                              value={leg.destIcao}
                              onChange={(val) => handleLegChange(index, "destIcao", val)}
                            />
                          )}
                          {tripType === "round_trip" && index === 1 ? (
                            <p className="mt-1 text-[10px] text-amber-800 font-medium">
                              Automatically locked to the departure airport of Leg #1 ({destAirport.name}).
                            </p>
                          ) : (
                            <p className="text-[10px] text-gray-500 mt-1 truncate">
                              {destAirport.name} ({destAirport.country})
                            </p>
                          )}
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

                      {/* Aircraft / Jet Selection for this leg */}
                      {tripType === "multi_leg" ? (
                        <div className="p-4 bg-white rounded-xl border border-[#C9A052]/50 shadow-sm space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-[#E0DAD0] pb-2.5">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-[#C9A052]" />
                              <label className="text-xs font-mono font-bold uppercase text-[#0F1420]">
                                Jet Option for Flight Leg #{index + 1}
                              </label>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-[#9A7A35] bg-[#C9A052]/10 border border-[#C9A052]/30 px-2.5 py-0.5 rounded-full">
                              Individual Leg Jet Selection Active
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-center">
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-mono text-gray-500 uppercase font-bold mb-1">
                                Change Jet for Leg #{index + 1} (Aircraft Fleet)
                              </label>
                              <select
                                value={leg.aircraftId}
                                onChange={(e) => handleLegChange(index, "aircraftId", e.target.value)}
                                className="w-full bg-[#FAF9F6] border border-[#E0DAD0] hover:border-[#C9A052] rounded-xl px-3 py-2 text-xs font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052] shadow-xs"
                              >
                                {fleetData.map((aircraft) => (
                                  <option key={aircraft.id} value={aircraft.id}>
                                    {aircraft.name} — {aircraft.categoryLabel} ({aircraft.passengers} seats · €{aircraft.pricePerHour.toLocaleString()}/hr)
                                  </option>
                                ))}
                              </select>
                              <p className="mt-1 text-[10px] text-gray-500">
                                This jet and hourly charter rate apply directly to Flight Leg #{index + 1}.
                              </p>
                            </div>

                            {/* Selected Aircraft Mini-Card for this leg */}
                            {(() => {
                              const legJet = fleetData.find((a) => a.id === leg.aircraftId) || currentAircraft;
                              const dist = calculateDistanceNm(
                                origAirport.coordinates?.lat || 46.2,
                                origAirport.coordinates?.lng || 6.1,
                                destAirport.coordinates?.lat || 44.4,
                                destAirport.coordinates?.lng || 8.8
                              );
                              const flightMins = leg.durationOverrideMinutes || estimateFlightTimeMinutes(dist);
                              const legFlightPrice = Math.round(Math.max(flightMins / 60, 1.2) * legJet.pricePerHour);

                              return (
                                <div className="p-3 rounded-xl bg-[#F5F2EC] border border-[#E0DAD0] flex items-center gap-3">
                                  <img
                                    src={legJet.imageExterior}
                                    alt={legJet.name}
                                    className="w-14 h-10 rounded-lg object-cover border border-[#E0DAD0] shrink-0"
                                  />
                                  <div className="min-w-0 flex-1 text-xs">
                                    <div className="font-extrabold text-[#0F1420] truncate">{legJet.name}</div>
                                    <div className="text-[10px] font-mono text-gray-500">
                                      {legJet.passengers} Seats • €{legJet.pricePerHour.toLocaleString()}/hr
                                    </div>
                                    <div className="text-[11px] font-mono font-bold text-[#9A7A35] mt-0.5">
                                      Leg Price: €{legFlightPrice.toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      ) : (
                        /* In One-Way or Round-Trip: Show assigned aircraft summary pill */
                        <div className="p-3 bg-white/80 rounded-xl border border-[#E0DAD0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <Plane className="w-4 h-4 text-[#C9A052]" />
                            <span className="font-mono text-xs text-[#0F1420]">
                              Assigned Jet: <strong>{effectiveAircraft.name}</strong> ({effectiveAircraft.passengers} seats · €{effectiveAircraft.pricePerHour.toLocaleString()}/hr)
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-gray-500 bg-[#F5F2EC] px-2 py-1 rounded border border-[#E0DAD0]">
                            {tripType === "round_trip" ? "Round-Trip Jet (Synced from Section 2)" : "Assigned in Section 2"}
                          </span>
                        </div>
                      )}

                      {/* Station Times, Duration Override, Timezones, and Respective FBO Dropdowns */}
                      {(() => {
                        const dist = calculateDistanceNm(
                          origAirport.coordinates?.lat || 46.2,
                          origAirport.coordinates?.lng || 6.1,
                          destAirport.coordinates?.lat || 44.4,
                          destAirport.coordinates?.lng || 8.8
                        );
                        const autoMin = estimateFlightTimeMinutes(dist);
                        const currentMin = leg.durationOverrideMinutes || autoMin;
                        const tzCalc = calculateLegArrivalAndTz(origAirport, destAirport, leg.departureTime || "11:00", currentMin);

                        return (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs bg-white/80 p-3.5 rounded-xl border border-[#E0DAD0]">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-[10px] font-mono font-bold uppercase text-[#0F1420]/70">
                                    Departure Time (LT)
                                  </label>
                                  <span className="text-[10px] font-mono text-gray-500 font-bold">
                                    {tzCalc.departureTimeUtc}
                                  </span>
                                </div>
                                <input
                                  type="text"
                                  placeholder="11:00"
                                  value={leg.departureTime}
                                  onChange={(e) => handleLegChange(index, "departureTime", e.target.value)}
                                  required
                                  className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs text-[#0F1420] font-mono font-bold focus:outline-none focus:border-[#C9A052]"
                                />
                                <span className="text-[9px] font-mono text-gray-400 mt-0.5 block">
                                  Zone: {tzCalc.origTz.tzName} ({tzCalc.origTz.label})
                                </span>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-[10px] font-mono font-bold uppercase text-[#0F1420]/70">
                                    Flight Duration Override
                                  </label>
                                  <span className="text-[10px] font-mono text-[#C9A052] font-bold">
                                    Auto: {formatFlightTime(autoMin)}
                                  </span>
                                </div>
                                <div className="relative">
                                  <input
                                    type="number"
                                    min={10}
                                    max={1200}
                                    placeholder={String(autoMin)}
                                    value={leg.durationOverrideMinutes || ""}
                                    onChange={(e) => {
                                      const v = e.target.value ? parseInt(e.target.value, 10) : undefined;
                                      handleLegChange(index, "durationOverrideMinutes" as any, v);
                                    }}
                                    className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs text-[#0F1420] font-mono font-bold focus:outline-none focus:border-[#C9A052]"
                                  />
                                  <span className="absolute right-2 top-1.5 text-[10px] font-mono text-gray-400">min</span>
                                </div>
                                <span className="text-[9px] font-mono text-gray-400 mt-0.5 block">
                                  {leg.durationOverrideMinutes ? `Manual: ${formatFlightTime(leg.durationOverrideMinutes)}` : "Estimated by distance"}
                                </span>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-[10px] font-mono font-bold uppercase text-[#0F1420]/70">
                                    Arrival Time (LT)
                                  </label>
                                  <span className="text-[10px] font-mono text-gray-500 font-bold">
                                    {tzCalc.arrivalTimeUtc}
                                  </span>
                                </div>
                                <input
                                  type="text"
                                  placeholder="11:55"
                                  value={leg.arrivalTime}
                                  onChange={(e) => handleLegChange(index, "arrivalTime", e.target.value)}
                                  required
                                  className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs text-[#0F1420] font-mono font-bold focus:outline-none focus:border-[#C9A052]"
                                />
                                <div className="flex items-center justify-between mt-0.5">
                                  <span className="text-[9px] font-mono text-gray-400">
                                    Zone: {tzCalc.destTz.tzName} ({tzCalc.destTz.label})
                                  </span>
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                                    {tzCalc.tzDiffLabel}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white/70 p-3.5 rounded-xl border border-[#E0DAD0]">
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
                        );
                      })()}
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

          {tripType === "multi_leg" && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAddLeg}
                className="w-full py-3.5 border-2 border-dashed border-[#C9A052]/50 hover:border-[#C9A052] bg-white/70 hover:bg-[#FAF9F6] text-[#0F1420] rounded-2xl flex items-center justify-center gap-2 text-xs font-bold font-mono transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4 text-[#C9A052]" />
                <span>+ Add Another Flight Leg (Flexible Airports & Jet Selection)</span>
              </button>
            </div>
          )}
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
                disabled={!overridePricing || itemizePassengerFees}
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

          {/* Internal Margin Tier & Override Switch (MOD-05, NF-01) */}
          <div className="p-4 bg-[#FAF9F6] border border-[#E0DAD0] rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E0DAD0] pb-2">
              <span className="text-xs font-mono font-bold uppercase text-[#0F1420]">
                Internal Margin Tier &amp; Curator Mark-up (MOD-05, NF-01)
              </span>
              <span className="text-[11px] font-mono text-[#9A7A35] font-bold">
                Tier: {effectivePricing.flightPrice < 25000 ? "10% (< €25k)" : effectivePricing.flightPrice <= 60000 ? "8% (€25k - €60k)" : "6% (> €60k)"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">
                  Company Margin (% tier or override)
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-[#0F1420]">
                    <input
                      type="checkbox"
                      checked={isMarginOverride}
                      onChange={(e) => setIsMarginOverride(e.target.checked)}
                      className="rounded text-[#C9A052] focus:ring-[#C9A052]"
                    />
                    <span>Override (Type Currency Amount)</span>
                  </label>
                  {isMarginOverride ? (
                    <input
                      type="number"
                      value={overrideMarginAmount}
                      onChange={(e) => setOverrideMarginAmount(Number(e.target.value))}
                      placeholder="e.g. 1120"
                      className="w-full bg-white border border-[#C9A052] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#0F1420]"
                    />
                  ) : (
                    <div className="text-xs font-bold text-gray-700 p-1.5 bg-gray-100 rounded">
                      {formatCurrency(Math.round(effectivePricing.flightPrice * (effectivePricing.flightPrice < 25000 ? 0.10 : effectivePricing.flightPrice <= 60000 ? 0.08 : 0.06)), currency)} (Automatic Tier)
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 mb-1">
                  Curator Mark-up (5% - 12%): <strong>{curatorMarkupPct}%</strong>
                </label>
                <input
                  type="range"
                  min="5"
                  max="12"
                  value={curatorMarkupPct}
                  onChange={(e) => setCuratorMarkupPct(Number(e.target.value))}
                  className="w-full accent-[#C9A052] cursor-pointer"
                />
                <span className="text-[10px] text-gray-500 block">
                  Amount: {formatCurrency(Math.round(effectivePricing.flightPrice * (curatorMarkupPct / 100)), currency)}
                </span>
              </div>

              <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 leading-snug">
                <strong>MOD-09 &amp; MOD-15 Notice:</strong> Internal company margin and Curator mark-up are folded directly into the charter price on client documents.
              </div>
            </div>
          </div>

          {/* Itemized Passenger Fees (NF-21) */}
          <div className="p-4 bg-[#FAF9F6] border border-[#E0DAD0] rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#E0DAD0] pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={itemizePassengerFees}
                  onChange={(e) => setItemizePassengerFees(e.target.checked)}
                  className="rounded text-[#C9A052] focus:ring-[#C9A052]"
                />
                <span className="text-xs font-mono font-bold uppercase text-[#0F1420]">
                  Itemize Passenger Fees (NF-21)
                </span>
              </label>
              {itemizePassengerFees && (
                <span className="text-xs font-mono font-bold text-[#9A7A35]">
                  Calculated Fee: {formatCurrency(calculatedPassengerFee, currency)}
                </span>
              )}
            </div>

            {itemizePassengerFees && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Applicable Legs</label>
                  <select
                    value={paxFeeLegOption}
                    onChange={(e) => setPaxFeeLegOption(e.target.value as any)}
                    className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs text-[#0F1420]"
                  >
                    <option value="both">Both Legs (All {activeLegs.length || 2} Legs)</option>
                    <option value="leg1">Leg 1 Only</option>
                    <option value="leg2">Leg 2 Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Fee Basis</label>
                  <select
                    value={paxFeeCalculation}
                    onChange={(e) => setPaxFeeCalculation(e.target.value as any)}
                    className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs text-[#0F1420]"
                  >
                    <option value="per_pax">Per Passenger</option>
                    <option value="flat">Flat per Leg</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Unit Fee ({currency})</label>
                  <input
                    type="number"
                    value={paxFeeAmount}
                    onChange={(e) => setPaxFeeAmount(Number(e.target.value))}
                    className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs text-[#0F1420]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Passenger Count</label>
                  <input
                    type="number"
                    value={customPaxCount}
                    disabled={paxFeeCalculation === "flat"}
                    onChange={(e) => setCustomPaxCount(Number(e.target.value))}
                    className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs text-[#0F1420] disabled:bg-gray-100"
                  />
                </div>
              </div>
            )}
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
