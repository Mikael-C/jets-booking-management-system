"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAviation } from "@/lib/aviationContext";
import { Booking, FlightLeg, AdditionalServices, TripType, Aircraft, PetDetails, LuggageDetails } from "@/types/aviation";
import { airportsData, findAirportByCode, getAirportFbos } from "@/data/airports";
import AirportSearchSelect from "@/components/common/AirportSearchSelect";
import { fleetData } from "@/data/fleet";
import { defaultOperator } from "@/data/initialBookings";
import {
  calculatePricing,
  formatCurrency,
  estimateFlightTimeMinutes,
  formatFlightTime,
  calculateDistanceNm
} from "@/lib/pricingCalculator";
import { calculateLegArrivalAndTz } from "@/lib/aviationTimezones";
import { getQuoteIterationGroupKey } from "@/lib/quoteIterations";
import {
  FileText,
  Search,
  Plus,
  Plane,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ScrollText,
  Check,
  ChevronRight,
  Eye,
  Calendar,
  Image as ImageIcon,
  Building,
  User,
  ArrowRight,
  Receipt,
  Compass,
  FileCheck,
  SlidersHorizontal,
  X,
  Upload,
  Camera,
  Sparkles,
  Shield,
  Landmark,
  Dog,
  Briefcase,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Send,
  Lock
} from "lucide-react";

export default function QuotesView() {
  const {
    bookings,
    addBooking,
    openDocument,
    convertQuoteToBooked,
    sendQuoteToAgent,
    setSelectedBookingForDetail,
    setActiveNav,
    accounts,
    contacts,
    currentUser,
    addAuditEntry,
    refreshBookings,
    bookingToRevise,
    setBookingToRevise,
    clients,
    reviseQuote,
    reviseBookingWithCreditNote,
    advanceQuoteToContract
  } = useAviation();

  const [activeTab, setActiveTab] = useState<"list" | "builder">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedQuoteForDocs, setSelectedQuoteForDocs] = useState<Booking | null>(null);

  const [expandedTripIds, setExpandedTripIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    void refreshBookings();
  }, []);

  // Active quotes: has quoteReference/status and NOT yet booked as a confirmed booking
  const quotesList = useMemo(() => {
    const bookedQuoteFamilies = new Set(
      bookings
        .filter((booking) => booking.isBooked || ["confirmed", "dispatched", "in_flight", "completed", "flown"].includes(booking.status))
        .map(getQuoteIterationGroupKey)
    );
    return bookings.filter((b) =>
      (b.quoteReference || b.quoteStatus || ["draft", "quote_sent", "client_review"].includes(b.status))
      && !b.isBooked
      && !bookedQuoteFamilies.has(getQuoteIterationGroupKey(b))
    );
  }, [bookings]);

  // Quote iterations are grouped by their quote family, never by the collision-prone trip suffix.
  const tripGroupedQuotes = useMemo(() => {
    const getVersion = (booking: Booking) => {
      if (booking.quoteVersion) return booking.quoteVersion;
      const match = (booking.quoteId || booking.quoteReference || "").match(/-(?:V)?(\d+)$/i);
      return match ? Number(match[1]) : 1;
    };
    const tripMap = new Map<string, { latest: Booking; allRevisions: Booking[] }>();
    for (const b of quotesList) {
      const tId = getQuoteIterationGroupKey(b);
      const existing = tripMap.get(tId);
      if (!existing) {
        tripMap.set(tId, { latest: b, allRevisions: [b] });
      } else {
        existing.allRevisions.push(b);
        // Latest = highest quoteVersion, or most recently created
        const curVer = getVersion(b);
        const prevVer = getVersion(existing.latest);
        if (curVer > prevVer) existing.latest = b;
      }
    }
    return Array.from(tripMap.values()).map(g => ({
      ...g,
      allRevisions: g.allRevisions.sort((a, b) => getVersion(b) - getVersion(a)),
    }));
  }, [quotesList]);

  const filteredTripGroups = useMemo(() => {
    return tripGroupedQuotes.filter(({ latest: b }) => {
      if (statusFilter !== "all") {
        if (statusFilter === "draft" && b.quoteStatus !== "draft" && b.status !== "draft") return false;
        if (statusFilter === "sent" && b.quoteStatus !== "sent" && b.status !== "quote_sent") return false;
        if (statusFilter === "accepted" && b.quoteStatus !== "accepted" && b.status !== "confirmed") return false;
      }

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchRef = (b.quoteReference || b.quoteId || "").toLowerCase().includes(q);
        const matchTrip = (b.tripNumber || b.tripId || "").toLowerCase().includes(q);
        const matchClient = (b.client.fullName || "").toLowerCase().includes(q);
        const matchAircraft = (b.aircraft.name || "").toLowerCase().includes(q);
        const matchRoute = (b.legs || []).some(
          (l) =>
            l.origin.icao.toLowerCase().includes(q) ||
            l.destination.icao.toLowerCase().includes(q) ||
            l.origin.city.toLowerCase().includes(q) ||
            l.destination.city.toLowerCase().includes(q)
        );
        if (!matchRef && !matchTrip && !matchClient && !matchAircraft && !matchRoute) return false;
      }

      return true;
    });
  }, [tripGroupedQuotes, statusFilter, searchQuery]);

  const toggleTripExpand = (tripId: string) => {
    setExpandedTripIds(prev => {
      const next = new Set(prev);
      if (next.has(tripId)) next.delete(tripId); else next.add(tripId);
      return next;
    });
  };

  // ================= QUOTE BUILDER & REVISION STATE =================
  const [quoteReference, setQuoteReference] = useState("");
  const [contractDate, setContractDate] = useState("01.10.2026");
  const [quoteExpirationDate, setQuoteExpirationDate] = useState("02.10.2026, 19:53z");
  const [tripType, setTripType] = useState<TripType>("round_trip");
  const [currency, setCurrency] = useState<"EUR" | "USD" | "GBP" | "CHF">("EUR");
  const [quoteStatus, setQuoteStatus] = useState<"Draft" | "Sent" | "Pending" | "Accepted" | "Declined">("Draft");
  const [accountNumber, setAccountNumber] = useState("ACC-21737");

  // Client Details
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [clientName, setClientName] = useState("Edward Brinkmann");
  const [companyName, setCompanyName] = useState("Brinkmann Capital SAM");
  const [vatNumber, setVatNumber] = useState("US-8492041");
  const [clientEmail, setClientEmail] = useState("ebrinkmann@bgcapital.com");
  const [clientPhone, setClientPhone] = useState("+377 97 97 12 00");
  const [clientAddress, setClientAddress] = useState("7 Boulevard Albert 1er, Monaco");
  const [clientCityCountry, setClientCityCountry] = useState("FL 34104 Naples, United States");

  // Aircraft Selection & IMAGE CUSTOMIZATION
  const [selectedAircraftId, setSelectedAircraftId] = useState("cessna-citation-mustang");
  const [aircraftSearchQuery, setAircraftSearchQuery] = useState("");
  const [isAircraftPickerOpen, setIsAircraftPickerOpen] = useState(false);

  // Manual Aircraft Overrides
  const [aircraftNameOverride, setAircraftNameOverride] = useState("");
  const [yearOfManufactureOverride, setYearOfManufactureOverride] = useState("");
  const [yearOfRefurbishmentOverride, setYearOfRefurbishmentOverride] = useState("");
  const [passengerSeatsOverride, setPassengerSeatsOverride] = useState<number | "">("");
  const [toiletteOverride, setToiletteOverride] = useState<boolean>(true);
  const [smokingCabinOverride, setSmokingCabinOverride] = useState<boolean>(false);

  // Custom Aircraft Images
  const [customExteriorImage, setCustomExteriorImage] = useState("");
  const [customInteriorImage, setCustomInteriorImage] = useState("");
  const [hasCustomExterior, setHasCustomExterior] = useState(false);
  const [hasCustomInterior, setHasCustomInterior] = useState(false);
  const [isDraggingExterior, setIsDraggingExterior] = useState(false);
  const [isDraggingInterior, setIsDraggingInterior] = useState(false);
  const [imageUploadFeedback, setImageUploadFeedback] = useState<string | null>(null);

  const exteriorFileInputRef = React.useRef<HTMLInputElement>(null);
  const interiorFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageFileChange = (file: File | undefined, type: "exterior" | "interior") => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageUploadFeedback("Please select a valid image file (PNG, JPG, WEBP)");
      setTimeout(() => setImageUploadFeedback(null), 3000);
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setImageUploadFeedback("Image file is too large (maximum 15 MB)");
      setTimeout(() => setImageUploadFeedback(null), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        if (type === "exterior") {
          setCustomExteriorImage(result);
          setHasCustomExterior(true);
          setImageUploadFeedback("✓ Aircraft exterior photo successfully updated!");
        } else {
          setCustomInteriorImage(result);
          setHasCustomInterior(true);
          setImageUploadFeedback("✓ VIP cabin interior photo successfully updated!");
        }
        setTimeout(() => setImageUploadFeedback(null), 3500);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetImage = (type: "exterior" | "interior", e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (type === "exterior") {
      setCustomExteriorImage(currentAircraft.imageExterior || "");
      setHasCustomExterior(false);
      setImageUploadFeedback("Reverted exterior photo to fleet default");
    } else {
      setCustomInteriorImage(currentAircraft.imageInterior || "");
      setHasCustomInterior(false);
      setImageUploadFeedback("Reverted cabin photo to fleet default");
    }
    setTimeout(() => setImageUploadFeedback(null), 3000);
  };

  // Base Aircraft Selection
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

  // Sync initial aircraft specs when aircraft changes
  useEffect(() => {
    if (currentAircraft) {
      setAircraftNameOverride(currentAircraft.name);
      setYearOfManufactureOverride(String(currentAircraft.yearOfManufacture || "2020"));
      setYearOfRefurbishmentOverride(String(currentAircraft.yearOfRefurbishment || "Recent"));
      setPassengerSeatsOverride(currentAircraft.passengers);
      setToiletteOverride(currentAircraft.toilette !== false);
      setSmokingCabinOverride(!!currentAircraft.smokingCabin);
      if (!hasCustomExterior) {
        setCustomExteriorImage(currentAircraft.imageExterior || "");
      }
      if (!hasCustomInterior) {
        setCustomInteriorImage(currentAircraft.imageInterior || "");
      }
    }
  }, [selectedAircraftId, currentAircraft, hasCustomExterior, hasCustomInterior]);

  // Effective Aircraft with manual overrides
  const effectiveAircraft: Aircraft = useMemo(() => {
    return {
      ...currentAircraft,
      name: aircraftNameOverride || currentAircraft.name,
      yearOfManufacture: yearOfManufactureOverride || currentAircraft.yearOfManufacture,
      yearOfRefurbishment: yearOfRefurbishmentOverride || currentAircraft.yearOfRefurbishment || "Recent",
      passengers: typeof passengerSeatsOverride === "number" ? passengerSeatsOverride : currentAircraft.passengers,
      toilette: toiletteOverride,
      smokingCabin: smokingCabinOverride,
      imageExterior: customExteriorImage || currentAircraft.imageExterior,
      imageInterior: customInteriorImage || currentAircraft.imageInterior
    };
  }, [
    currentAircraft,
    aircraftNameOverride,
    yearOfManufactureOverride,
    yearOfRefurbishmentOverride,
    passengerSeatsOverride,
    toiletteOverride,
    smokingCabinOverride,
    customExteriorImage,
    customInteriorImage
  ]);

  // Subtabs for legs: "routing" | "pets" | "luggage" | "handling"
  const [activeLegTabs, setActiveLegTabs] = useState<Record<number, "routing" | "pets" | "luggage" | "handling">>({});

  // Flight Legs state with FBOs, Pets, Luggage
  const [legs, setLegs] = useState<
    Array<{
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
      durationOverrideMinutes?: number;
    }>
  >([
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

  // Additional Services
  const [vipCatering, setVipCatering] = useState(true);
  const [limousineService, setLimousineService] = useState(true);
  const [luxuryCarRental, setLuxuryCarRental] = useState(false);
  const [helicopterService, setHelicopterService] = useState(false);
  const [deicingInsurance, setDeicingInsurance] = useState<"none" | "at_reservation" | "within_48h">("none");
  const [carbonOffset, setCarbonOffset] = useState<"none" | "neutral" | "positive" | "double_neutral">("neutral");

  // Pricing Overrides
  const [overridePricing, setOverridePricing] = useState(false);
  const [customFlightPrice, setCustomFlightPrice] = useState<number>(11500);
  const [customAirportFees, setCustomAirportFees] = useState<number>(1140);
  const [customPassengerFees, setCustomPassengerFees] = useState<number>(80);
  const [customAdditionalServices, setCustomAdditionalServices] = useState<number>(0);

  // Validation
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate from bookingToRevise if revising
  useEffect(() => {
    if (bookingToRevise) {
      setActiveTab("builder");
      setQuoteReference(bookingToRevise.quoteReference || bookingToRevise.quoteId || "");
      setClientName(bookingToRevise.client.fullName);
      setCompanyName(bookingToRevise.client.companyName || "Brinkmann Capital SAM");
      setVatNumber(bookingToRevise.client.vatNumber || "US-8492041");
      setClientEmail(bookingToRevise.client.email);
      setClientPhone(bookingToRevise.client.phone);
      setClientAddress(bookingToRevise.client.streetAddress);
      setClientCityCountry(bookingToRevise.client.cityPostalCountry || bookingToRevise.client.streetAddress);
      setAccountNumber(bookingToRevise.accountNumber || "ACC-21737");
      if (bookingToRevise.tripType) setTripType(bookingToRevise.tripType);
      if (bookingToRevise.pricing?.currency) setCurrency(bookingToRevise.pricing.currency as any);
      setVipCatering(Boolean(bookingToRevise.services?.vipCateringDetails));
      setLimousineService(Boolean(bookingToRevise.services?.limousineService));
      setLuxuryCarRental(Boolean(bookingToRevise.services?.luxuryCarRental));
      setHelicopterService(Boolean(bookingToRevise.services?.helicopterService));
      setDeicingInsurance(bookingToRevise.services?.deicingInsurance || "none");
      setCarbonOffset(bookingToRevise.services?.carbonOffset || "none");
      if (bookingToRevise.isBooked && bookingToRevise.pricing) {
        setOverridePricing(true);
        setCustomFlightPrice(bookingToRevise.pricing.flightPrice || 0);
        setCustomAirportFees(bookingToRevise.pricing.airportFees || 0);
        setCustomPassengerFees(bookingToRevise.pricing.passengerFees || 0);
        setCustomAdditionalServices(bookingToRevise.pricing.additionalServicesTotal || 0);
      }
      if (bookingToRevise.aircraft) {
        setSelectedAircraftId(bookingToRevise.aircraft.id);
        setAircraftNameOverride(bookingToRevise.aircraft.name);
        setYearOfManufactureOverride(String(bookingToRevise.aircraft.yearOfManufacture || "2020"));
        setYearOfRefurbishmentOverride(String(bookingToRevise.aircraft.yearOfRefurbishment || "Recent"));
        setPassengerSeatsOverride(bookingToRevise.aircraft.passengers);
        setToiletteOverride(bookingToRevise.aircraft.toilette !== false);
        setSmokingCabinOverride(!!bookingToRevise.aircraft.smokingCabin);
      }
      if (bookingToRevise.aircraftCustomImages?.exterior) {
        setCustomExteriorImage(bookingToRevise.aircraftCustomImages.exterior);
        setHasCustomExterior(true);
      } else {
        setCustomExteriorImage(bookingToRevise.aircraft.imageExterior || "");
        setHasCustomExterior(false);
      }
      if (bookingToRevise.aircraftCustomImages?.interior) {
        setCustomInteriorImage(bookingToRevise.aircraftCustomImages.interior);
        setHasCustomInterior(true);
      } else {
        setCustomInteriorImage(bookingToRevise.aircraft.imageInterior || "");
        setHasCustomInterior(false);
      }
      if (bookingToRevise.legs && bookingToRevise.legs.length > 0) {
        setLegs(
          bookingToRevise.legs.filter((l) => !l.isCancelled).map((l) => ({
            originIcao: l.origin.icao,
            destIcao: l.destination.icao,
            flightDate: l.flightDate,
            departureTime: l.departureTimeLocal || "11:00",
            arrivalTime: l.arrivalTimeLocal || "12:15",
            paxCount: l.paxCount || 2,
            depHandlerName: l.departureHandling?.name || "Jet Aviation Geneva",
            depHandlerPhone: l.departureHandling?.phone || "+41 58 158 1811",
            depHandlerEmail: l.departureHandling?.email || "gvafbo@jetaviation.com",
            arrHandlerName: l.arrivalHandling?.name || "Ags Ops Executive Handling",
            arrHandlerPhone: l.arrivalHandling?.phone || "+39 010 601 5412",
            arrHandlerEmail: l.arrivalHandling?.email || "dutymanager@airport.genova.it",
            pets: l.pets,
            luggage: l.luggage
          }))
        );
      }
    } else {
      setQuoteReference("");
    }
  }, [bookingToRevise]);

  // Client / Account selector sync
  const handleClientSelectChange = (id: string) => {
    setSelectedClientId(id);
    const foundClient = clients?.find((c) => c.id === id);
    if (foundClient) {
      setClientName(foundClient.fullName);
      setCompanyName(foundClient.companyName || "");
      setClientEmail(foundClient.email);
      setClientPhone(foundClient.phone);
      setClientAddress(foundClient.streetAddress);
      setClientCityCountry(foundClient.cityPostalCountry);
      setVatNumber(foundClient.vatNumber || "");
      if (foundClient.accountNumber) {
        setAccountNumber(foundClient.accountNumber);
      }
      return;
    }
    const foundAcc = accounts?.find((a) => a.id === id);
    if (foundAcc) {
      setClientName(foundAcc.preferredContactName || foundAcc.name);
      setCompanyName(foundAcc.name);
      setClientEmail(foundAcc.preferredContactEmail || foundAcc.email);
      setClientPhone(foundAcc.preferredContactPhone || foundAcc.phone);
      setClientAddress(foundAcc.billingAddress || foundAcc.country);
      setClientCityCountry(foundAcc.country);
      setAccountNumber(foundAcc.accountNumber);
      if (foundAcc.vatTaxNumber) setVatNumber(foundAcc.vatTaxNumber);
    }
  };

  // Add Leg with default FBOs
  const handleAddLeg = () => {
    const lastLeg = legs[legs.length - 1];
    const originIcao = lastLeg ? lastLeg.destIcao : "LSGG";
    const destIcao = "LFMN";
    const origAirport = findAirportByCode(originIcao);
    const destAirport = findAirportByCode(destIcao);

    const dist = calculateDistanceNm(
      origAirport.coordinates?.lat || 46.2,
      origAirport.coordinates?.lng || 6.1,
      destAirport.coordinates?.lat || 43.6,
      destAirport.coordinates?.lng || 7.2
    );
    const flightMinutes = estimateFlightTimeMinutes(dist);

    const origFbos = getAirportFbos(originIcao);
    const destFbos = getAirportFbos(destIcao);

    const depFbo = origFbos[0] || {
      name: `${origAirport.name} FBO`,
      phone: "+41 58 158 1811",
      email: `ops@${originIcao.toLowerCase()}.handling.aero`
    };

    const arrFbo = destFbos[0] || {
      name: `${destAirport.name} FBO`,
      phone: "+33 4 93 21 38 10",
      email: `ops@${destIcao.toLowerCase()}.handling.aero`
    };

    setLegs((prev) => [
      ...prev,
      {
        originIcao,
        destIcao,
        flightDate: lastLeg ? lastLeg.flightDate : "2026-10-20",
        departureTime: "11:00",
        arrivalTime: "12:15",
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

  // Remove Leg
  const handleRemoveLeg = (idx: number) => {
    if (legs.length <= 1) return;
    setLegs((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleLegChange = (idx: number, field: string, val: any) => {
    setLegs((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };

      if (field === "originIcao") {
        const origFbos = getAirportFbos(val);
        const primaryFbo = origFbos[0];
        if (primaryFbo) {
          updated[idx].depHandlerName = primaryFbo.name;
          updated[idx].depHandlerPhone = primaryFbo.phone;
          updated[idx].depHandlerEmail = primaryFbo.email;
        }
      }

      if (field === "destIcao") {
        const destFbos = getAirportFbos(val);
        const primaryFbo = destFbos[0];
        if (primaryFbo) {
          updated[idx].arrHandlerName = primaryFbo.name;
          updated[idx].arrHandlerPhone = primaryFbo.phone;
          updated[idx].arrHandlerEmail = primaryFbo.email;
        }
      }

      if (field === "departureTime" || field === "originIcao" || field === "destIcao" || (field as string) === "durationOverrideMinutes") {
        const orig = findAirportByCode(field === "originIcao" ? val : updated[idx].originIcao);
        const dest = findAirportByCode(field === "destIcao" ? val : updated[idx].destIcao);
        const dist = calculateDistanceNm(
          orig.coordinates?.lat || 46.2,
          orig.coordinates?.lng || 6.1,
          dest.coordinates?.lat || 44.4,
          dest.coordinates?.lng || 8.8
        );
        const defaultMinutes = estimateFlightTimeMinutes(dist);
        const durationMinutes = updated[idx].durationOverrideMinutes || defaultMinutes;
        const depTime = field === "departureTime" ? val : updated[idx].departureTime;
        const tzInfo = calculateLegArrivalAndTz(orig, dest, depTime || "11:00", durationMinutes);
        updated[idx].arrivalTime = tzInfo.arrivalTimeLocal;
      }

      return updated;
    });
  };

  // Compiled Legs
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
      const defaultMinutes = estimateFlightTimeMinutes(dist);
      const minutes = leg.durationOverrideMinutes || defaultMinutes;
      const tzInfo = calculateLegArrivalAndTz(originAirport, destAirport, leg.departureTime || "11:00", minutes);
      return {
        legNumber: idx + 1,
        flightDate: leg.flightDate,
        origin: originAirport,
        destination: destAirport,
        departureTimeLocal: leg.departureTime,
        arrivalTimeLocal: leg.arrivalTime || tzInfo.arrivalTimeLocal,
        flightTimeMinutes: minutes,
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
        flightTimeFormatted: formatFlightTime(minutes),
        paxCount: leg.paxCount,
        flightNumber: `PEU842`,
        aircraftRegistration: effectiveAircraft.registration || "OE-FFB",
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
        },
        distanceNm: dist,
        pets: leg.pets,
        luggage: leg.luggage
      };
    });
  }, [legs, effectiveAircraft, clientName]);

  // Pricing calculations
  const autoPricing = useMemo(() => {
    const services: AdditionalServices = {
      limousineService,
      luxuryCarRental,
      helicopterService,
      vipCateringDetails: vipCatering ? "Taittinger Champagne, premium snacks and artisanal canapés" : undefined,
      deicingInsurance,
      deicingCostPerLeg: deicingInsurance === "at_reservation" ? 400 : deicingInsurance === "within_48h" ? 800 : 0,
      carbonOffset,
      carbonOffsetRatePerHour: carbonOffset === "neutral" ? 33 : carbonOffset === "positive" ? 50 : carbonOffset === "double_neutral" ? 66 : 0
    };
    return calculatePricing(effectiveAircraft, compiledLegs, services, currency);
  }, [effectiveAircraft, compiledLegs, limousineService, luxuryCarRental, helicopterService, vipCatering, deicingInsurance, carbonOffset, currency]);

  const effectivePricing = useMemo(() => {
    if (!overridePricing) return autoPricing;
    return {
      flightPrice: customFlightPrice,
      airportFees: customAirportFees,
      passengerFees: customPassengerFees,
      dayOfWeekDiscount: autoPricing.dayOfWeekDiscount,
      inboundPassengerTax: autoPricing.inboundPassengerTax,
      outboundPassengerTax: autoPricing.outboundPassengerTax,
      additionalServicesTotal: customAdditionalServices,
      subtotal:
        customFlightPrice +
        customAirportFees +
        customPassengerFees +
        autoPricing.dayOfWeekDiscount +
        autoPricing.inboundPassengerTax +
        autoPricing.outboundPassengerTax +
        customAdditionalServices,
      vatRate: 0,
      vatAmount: 0,
      totalFlightPrice:
        customFlightPrice +
        customAirportFees +
        customPassengerFees +
        autoPricing.dayOfWeekDiscount +
        autoPricing.inboundPassengerTax +
        autoPricing.outboundPassengerTax +
        customAdditionalServices,
      currency
    };
  }, [overridePricing, autoPricing, customFlightPrice, customAirportFees, customPassengerFees, customAdditionalServices, currency]);

  useEffect(() => {
    if (!overridePricing) {
      setCustomFlightPrice(autoPricing.flightPrice);
      setCustomAirportFees(autoPricing.airportFees);
      setCustomPassengerFees(autoPricing.passengerFees);
      setCustomAdditionalServices(autoPricing.additionalServicesTotal);
    }
  }, [autoPricing, overridePricing]);

  // Helper to build booking record
  const createBookingRecord = (isBookedFlight: boolean, advanceToContract: boolean = false): Booking => {
    return {
      id: "",
      tripId: bookingToRevise?.tripId || "",
      quoteGroupId: bookingToRevise?.quoteGroupId || "",
      quoteId: bookingToRevise?.quoteId || "",
      isBooked: Boolean(bookingToRevise?.isBooked) || isBookedFlight,
      tripNumber: "",
      quoteReference: "",
      invoiceNumber: "",
      accountNumber: accountNumber || "ACC-21737",
      contractDate,
      quoteExpirationDate,
      paymentDueDate: "10.10.2026",
      status: bookingToRevise?.isBooked ? "confirmed" : isBookedFlight ? "confirmed" : advanceToContract ? "contract_sent" : (quoteStatus === "Sent" ? "quote_sent" : "draft"),
      quoteStatus: bookingToRevise?.isBooked || isBookedFlight ? "accepted" : (advanceToContract ? "accepted" : (quoteStatus.toLowerCase() as any)),
      quoteVersion: bookingToRevise?.quoteVersion || 1,
      paymentStatus: "unpaid",
      tripType,
      aircraft: effectiveAircraft,
      aircraftCustomImages: {
        exterior: customExteriorImage,
        interior: customInteriorImage
      },
      client: {
        fullName: clientName || "Lead Passenger",
        companyName,
        email: clientEmail,
        phone: clientPhone,
        streetAddress: clientAddress,
        cityPostalCountry: clientCityCountry,
        vatNumber,
        accountNumber
      },
      operator: defaultOperator,
      legs: compiledLegs.map((l) => ({
        ...l,
        flightNumber: ""
      })),
      pricing: effectivePricing,
      services: {
        limousineService,
        luxuryCarRental,
        helicopterService,
        vipCateringDetails: vipCatering ? "Taittinger Champagne, premium snacks and artisanal canapés" : undefined,
        deicingInsurance,
        deicingCostPerLeg: deicingInsurance === "at_reservation" ? 400 : 800,
        carbonOffset,
        carbonOffsetRatePerHour: 33
      },
      checklist: bookingToRevise?.checklist || [
        { id: "step-1", label: "AOC & Safety Audit Verification", category: "safety", isCompleted: true, requiredForDispatch: true },
        { id: "step-2", label: "Slots & Ground Handling Confirmation", category: "ground", isCompleted: false, requiredForDispatch: true },
        { id: "step-3", label: "Passenger Manifest APIS Cleared", category: "passengers", isCompleted: false, requiredForDispatch: true }
      ],
      tripActionAudit: [
        {
          id: `act-${Date.now()}`,
          action: isBookedFlight ? "QUOTE_CONFIRMED_BOOKED" : (bookingToRevise ? "QUOTE_REVISED" : "QUOTE_GENERATED"),
          details: `${bookingToRevise ? "Revised" : "Generated"} Quotation for ${clientName}. Total: ${formatCurrency(effectivePricing.totalFlightPrice, currency)}. Customized aircraft images and station FBOs attached.`,
          timestamp: new Date().toLocaleString(),
          author: currentUser?.name || "Operations Desk",
          docType: isBookedFlight ? "charter_agreement" : "quotation"
        },
        ...(bookingToRevise?.tripActionAudit || [])
      ],
      createdAt: bookingToRevise?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  // Submit & Generate Quote
  const handleGenerateQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    if (!clientName.trim()) errors.push("Client / Account Name is required.");
    if (!clientEmail.trim() || !clientEmail.includes("@")) errors.push("Valid Client Email is required.");
    if (!clientPhone.trim()) errors.push("Client Telephone is required.");

    legs.forEach((leg, idx) => {
      if (!leg.originIcao.trim()) errors.push(`Leg #${idx + 1}: Departure Airport ICAO is required.`);
      if (!leg.destIcao.trim()) errors.push(`Leg #${idx + 1}: Destination Airport ICAO is required.`);
      if (!leg.flightDate.trim()) errors.push(`Leg #${idx + 1}: Flight Date is required.`);
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    setIsSubmitting(true);
    try {
      const wasRevising = Boolean(bookingToRevise);
      const draft = createBookingRecord(false, false);
      if (bookingToRevise?.isBooked) {
        const supplementalAmount = effectivePricing.totalFlightPrice - bookingToRevise.pricing.totalFlightPrice;
        if (!Number.isFinite(supplementalAmount) || supplementalAmount <= 0) {
          setValidationErrors(["Add a positive-priced item above the original booking total to create a supplemental booking revision."]);
          return;
        }
        const supplementalPricing = {
          ...effectivePricing,
          flightPrice: 0,
          airportFees: 0,
          passengerFees: 0,
          dayOfWeekDiscount: 0,
          inboundPassengerTax: 0,
          outboundPassengerTax: 0,
          additionalServicesTotal: supplementalAmount,
          subtotal: supplementalAmount,
          vatAmount: 0,
          totalFlightPrice: supplementalAmount
        };
        const revisedBooking = await reviseBookingWithCreditNote(
          bookingToRevise.id,
          {
            ...draft,
            pricing: supplementalPricing,
            isBooked: true,
            isSupplementalRevision: true,
            status: "confirmed",
            quoteStatus: "accepted",
            revisionAdjustments: [{
              id: `supplement-${Date.now()}`,
              label: "Additional booking items",
              amount: supplementalAmount
            }]
          },
          "Supplemental booking items"
        );
        if (!revisedBooking) throw new Error("Only the latest active booking can be revised.");
        setBookingToRevise(null);
        setActiveTab("list");
        setActiveNav("bookings");
        openDocument(revisedBooking, "invoice");
        return;
      }
      const newBooking = bookingToRevise
        ? await reviseQuote(bookingToRevise.id, draft)
        : await addBooking(draft);
      addAuditEntry({
        userEmail: currentUser?.email || "admin@orbelo.com",
        userName: currentUser?.name || "Operations Team",
        action: wasRevising ? "QUOTE_REVISED" : "QUOTE_GENERATED",
        entityType: "Quote",
        entityId: newBooking.quoteReference || newBooking.id,
        details: `${wasRevising ? "Revised" : "Generated"} official quotation for ${clientName} (${newBooking.quoteReference}), Total: ${formatCurrency(effectivePricing.totalFlightPrice, currency)}`
      });
      if (wasRevising) setActiveTab("list");
      setBookingToRevise(null);
      openDocument(newBooking, "quotation");
    } catch (error) {
      setValidationErrors([error instanceof Error ? error.message : "The revised quote could not be saved. Please try again."]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Advance Quote -> Contract
  const handleProceedToContract = async () => {
    setValidationErrors([]);
    setIsSubmitting(true);
    try {
      const wasRevising = Boolean(bookingToRevise);
      const draft = createBookingRecord(false, true);
      const newBooking = bookingToRevise
        ? await advanceQuoteToContract(bookingToRevise.id, draft)
        : await addBooking(draft);
      addAuditEntry({
        userEmail: currentUser?.email || "admin@orbelo.com",
        userName: currentUser?.name || "Operations Team",
        action: "QUOTE_ADVANCED_TO_CONTRACT",
        entityType: "Contract",
        entityId: newBooking.quoteReference || newBooking.id,
        details: `Quotation ${newBooking.quoteReference} advanced to Contract stage for ${clientName}.`
      });
      if (wasRevising) setActiveTab("list");
      setBookingToRevise(null);
      openDocument(newBooking, "charter_agreement");
    } catch (error) {
      setValidationErrors([error instanceof Error ? error.message : "The revised quote could not be saved. Please try again."]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert Quote directly to Confirmed Booking
  const handleConfirmAndBookFlight = async () => {
    setValidationErrors([]);
    setIsSubmitting(true);
    try {
      const draft = createBookingRecord(true, false);
      const newBooking = bookingToRevise
        ? await convertQuoteToBooked(bookingToRevise.id, draft)
        : await addBooking(draft);
      addAuditEntry({
        userEmail: currentUser?.email || "admin@orbelo.com",
        userName: currentUser?.name || "Operations Team",
        action: "QUOTE_CONVERTED_TO_BOOKING",
        entityType: "Booking",
        entityId: newBooking.tripId || newBooking.tripNumber || newBooking.id,
        details: `Locked in confirmed flight booking [${newBooking.tripId || newBooking.tripNumber}] for ${clientName}. Total: ${formatCurrency(effectivePricing.totalFlightPrice, currency)}`
      });
      setBookingToRevise(null);
      setSelectedBookingForDetail(newBooking);
      setActiveNav("bookings");
    } catch (error) {
      setValidationErrors([error instanceof Error ? error.message : "The revised quote could not be saved. Please try again."]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert Quote directly to Confirmed Booking from list view
  const handleBookQuote = async (b: Booking) => {
    try {
      await convertQuoteToBooked(b.id);
      setActiveNav("bookings");
    } catch (error) {
      setValidationErrors([error instanceof Error ? error.message : "The quote could not be booked."]);
      setActiveTab("builder");
    }
  };

  // Revise Quote action
  const handleStartRevise = (b: Booking) => {
    setBookingToRevise(b);
    setActiveTab("builder");
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-[#0F1420] text-white rounded-2xl p-6 sm:p-8 border border-[#1C2436] shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/20 text-[#C9A052] border border-[#C9A052]/40 uppercase flex items-center gap-1">
              <FileText className="w-3 h-3" />
              COMMERCIAL PROPOSALS & QUOTATIONS
            </span>
            <span className="text-gray-400 text-xs font-mono">• {quotesList.length} Generated Proposals</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Quotation Management & Generator
          </h1>
          <p className="text-xs text-gray-300 leading-relaxed">
            Review all generated proposals with official ID numbers, execute charter contract agreements, convert directly to confirmed flight bookings, or revise routes and customize aircraft exterior and cabin imagery.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#141A29] border border-[#1C2436]">
          <button
            onClick={() => {
              setBookingToRevise(null);
              setActiveTab("list");
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "list" ? "bg-[#C9A052] text-[#0F1420] shadow-sm font-black" : "text-gray-300 hover:text-white"
            }`}
          >
            All Generated Quotes ({quotesList.length})
          </button>
          <button
            onClick={() => setActiveTab("builder")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "builder" ? "bg-[#C9A052] text-[#0F1420] shadow-sm font-black" : "text-gray-300 hover:text-white"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{bookingToRevise?.isBooked ? "Revise Booking" : bookingToRevise ? "Revise Quote" : "Create Quote"}</span>
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Quote ID (e.g. QTE-2026-842), Client Name, Aircraft, or Airport Code..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E0DAD0] bg-[#F5F2EC] text-xs text-[#0F1420] font-medium placeholder-gray-400 focus:outline-none focus:border-[#C9A052] focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === "all" ? "bg-[#0F1420] text-white" : "bg-[#F5F2EC] text-gray-700 hover:bg-[#EBE5DB]"
                }`}
              >
                All Proposals
              </button>
              <button
                onClick={() => setStatusFilter("sent")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === "sent" ? "bg-[#0F1420] text-white" : "bg-[#F5F2EC] text-gray-700 hover:bg-[#EBE5DB]"
                }`}
              >
                Active Sent
              </button>
              <button
                onClick={() => setStatusFilter("accepted")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === "accepted" ? "bg-[#0F1420] text-white" : "bg-[#F5F2EC] text-gray-700 hover:bg-[#EBE5DB]"
                }`}
              >
                Booked Contracts
              </button>
            </div>
          </div>

          {/* Quotes Trip Groups */}
          <div className="overflow-x-auto">
            <div className="min-w-[980px]">
              <div className="grid grid-cols-[minmax(130px,1fr)_minmax(110px,1fr)_minmax(145px,1.2fr)_52px_minmax(100px,auto)_270px] items-center gap-3 rounded-t-xl border border-[#E0DAD0] bg-[#F5F2EC] px-5 py-3 text-[10px] font-mono font-bold uppercase tracking-wider text-[#0F1420]/70">
                <span>Trip ID</span>
                <span>Route</span>
                <span>Account</span>
                <span>Pax</span>
                <span>Price</span>
                <span className="text-right">Actions</span>
              </div>
              <div className="space-y-2">
            {filteredTripGroups.map(({ latest: quote, allRevisions }) => {
              const tId = quote.tripId || quote.id;
              const isExpanded = expandedTripIds.has(tId);
              const hasMultipleRevisions = allRevisions.length > 1;
              const isLatestCancelled = quote.isCancelled;
              const isContractSent = quote.status === "contract_sent";
              const isBooked = quote.isBooked ||
                ["confirmed", "dispatched", "in_flight", "completed", "flown"].includes(quote.status);

              return (false ? (
                <div key={tId} className="bg-white border border-[#E0DAD0] hover:border-[#C9A052]/60 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden">
                  {/* Main Quote Card */}
                  <div className="p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 group">
                    {/* Left: ID & Route Information */}
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      {/* Aircraft Thumbnail */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden border border-[#E0DAD0] bg-[#141A29] flex-shrink-0 relative">
                        <img
                          src={quote.aircraftCustomImages?.exterior || quote.aircraft.imageExterior}
                          alt={quote.aircraft.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-1">
                          <span className="text-[9px] font-mono font-bold text-white uppercase truncate">
                            {quote.aircraft.registration || "OE-FFB"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Trip ID */}
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#0F1420] text-[#C9A052]">
                            {quote.tripId || "Pending server assignment"}
                          </span>
                          {/* Latest Quote ID */}
                          <span className="font-mono text-xs font-black text-[#0F1420] px-2.5 py-0.5 rounded bg-[#F5F2EC] border border-[#E0DAD0]">
                            {quote.quoteId || quote.quoteReference || "Pending server assignment"}
                          </span>
                          {(quote.quoteVersion ?? 1) > 1 && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">
                              Rev. {quote.quoteVersion}
                            </span>
                          )}
                          <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                            isLatestCancelled
                              ? "bg-red-100 text-red-800 border-red-300"
                              : isContractSent
                              ? "bg-blue-100 text-blue-800 border-blue-300"
                              : "bg-amber-100 text-amber-800 border-amber-300"
                          }`}>
                            {isLatestCancelled ? "CANCELLED / SUPERSEDED" : isContractSent ? "CONTRACT ISSUED" : "QUOTATION ACTIVE"}
                          </span>
                          {/* Revisions badge */}
                          {hasMultipleRevisions && (
                            <button
                              type="button"
                              onClick={() => toggleTripExpand(tId)}
                              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1 hover:bg-purple-200 transition-colors"
                            >
                              {allRevisions.length} Iterations
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold text-[#0F1420]">
                            {quote.legs[0]?.origin.city || "Geneva"} ({quote.legs[0]?.origin.icao})
                          </h3>
                          <span className="text-[#C9A052] font-bold">⇄</span>
                          <h3 className="text-base font-extrabold text-[#0F1420]">
                            {quote.legs[quote.legs.length - 1]?.destination.city || "Genoa"} ({quote.legs[quote.legs.length - 1]?.destination.icao})
                          </h3>
                          {quote.legs.length > 2 && (
                            <span className="text-xs text-gray-400 font-mono">+{quote.legs.length - 1} legs</span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span className="font-semibold text-[#0F1420] flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            <span>{quote.client.fullName}</span>
                          </span>
                          <span>•</span>
                          <span className="font-medium flex items-center gap-1">
                            <Plane className="w-3.5 h-3.5 text-gray-400" />
                            <span>{quote.aircraft.name}</span>
                          </span>
                          <span>•</span>
                          <span className="font-mono text-gray-500">
                            Expires: {quote.quoteExpirationDate || "48 Hours"}
                          </span>
                          {quote.agentName && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-[#C9A052]">Agent: {quote.agentName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Price & Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-100">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] font-mono text-gray-500 uppercase block">Total Flight Price</span>
                        <div className="text-xl font-black font-mono text-[#0F1420]">
                          {formatCurrency(quote.pricing.totalFlightPrice, quote.pricing.currency || "EUR")}
                        </div>
                        <span className="text-[10px] font-mono text-emerald-700">0% VAT §6 Abs. 1 Zif. 3</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Send Quote to Agent */}
                        {!isLatestCancelled && (
                          <button
                            onClick={() => {
                              sendQuoteToAgent(quote.id);
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] font-extrabold text-xs shadow-sm transition-all cursor-pointer"
                            title="Email the quotation PDF to the assigned agent"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Send to Agent</span>
                          </button>
                        )}

                        {/* Contract Agreement Button */}
                        <button
                          onClick={() => openDocument(quote, "charter_agreement")}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141A29] hover:bg-[#1C2436] text-[#C9A052] font-bold text-xs shadow-sm transition-all cursor-pointer"
                          title="Open or execute Master Charter Agreement"
                        >
                          <ScrollText className="w-3.5 h-3.5" />
                          <span>Contract</span>
                        </button>

                        {/* Book Button */}
                        {!isLatestCancelled && (
                          <button
                            onClick={() => handleBookQuote(quote)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer"
                            title="Convert quotation to confirmed booking"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Book</span>
                          </button>
                        )}

                        {/* Revise Button */}
                        {!isLatestCancelled && (
                          <button
                            onClick={() => handleStartRevise(quote)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F5F2EC] hover:bg-[#EBE5DB] text-[#0F1420] border border-[#E0DAD0] font-bold text-xs shadow-sm transition-all cursor-pointer"
                            title="Revise route, aircraft images, and pricing"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-[#C9A052]" />
                            <span>Revise</span>
                          </button>
                        )}

                        {/* View Documents */}
                        <button
                          onClick={() => setSelectedQuoteForDocs(quote)}
                          className="p-2 rounded-xl bg-[#F5F2EC] hover:bg-[#EBE5DB] text-[#0F1420] border border-[#E0DAD0] transition-colors"
                          title="View documents (Briefs, Invoices, Agreements, Credit Notes)"
                        >
                          <FileText className="w-4 h-4 text-[#C9A052]" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Revisions Sublevel */}
                  {hasMultipleRevisions && isExpanded && (
                    <div className="border-t border-[#E0DAD0] bg-[#FAFAF8]">
                      <div className="px-5 py-2.5 flex items-center gap-2 text-[11px] font-mono font-bold uppercase text-gray-400 tracking-wider border-b border-[#E0DAD0]">
                        <Clock className="w-3.5 h-3.5 text-[#C9A052]" />
                        All Iterations for Trip {quote.tripId || quote.tripNumber}
                      </div>
                      <div className="divide-y divide-[#E0DAD0]">
                        {allRevisions.map((rev) => {
                          const isActive = !rev.isCancelled;
                          const isLatest = rev.id === quote.id;
                          return (
                            <div key={rev.id} className={`px-6 py-3 flex items-center justify-between gap-4 text-xs transition-colors ${!isActive ? "opacity-60 bg-gray-50" : "bg-white hover:bg-[#FDFCFA]"}`}>
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                {!isActive ? (
                                  <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono font-bold text-[#0F1420]">
                                      {rev.quoteId || rev.quoteReference || `Iteration ${rev.quoteVersion || 1}`}
                                    </span>
                                    {isLatest && (
                                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        Latest Active
                                      </span>
                                    )}
                                    {!isActive && (
                                      <span className="text-[10px] font-mono text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                                        Cancelled · {rev.cancellationReason || "Superseded"}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">
                                    Created: {new Date(rev.createdAt || "").toLocaleDateString()} · {formatCurrency(rev.pricing.totalFlightPrice, rev.pricing.currency || "EUR")}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {/* Always: view PDF */}
                                <button
                                  onClick={() => openDocument(rev, "quotation")}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F5F2EC] hover:bg-[#EBE5DB] text-[#0F1420] font-bold text-[11px] border border-[#E0DAD0] transition-colors"
                                >
                                  <Eye className="w-3 h-3 text-[#C9A052]" />
                                  View PDF
                                </button>
                                {/* Only latest active can be acted on */}
                                {isLatest && isActive && (
                                  <>
                                    <button
                                      onClick={() => handleStartRevise(rev)}
                                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0F1420] text-[#C9A052] font-bold text-[11px] border border-[#1C2436] hover:bg-[#1C2436] transition-colors"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      Revise
                                    </button>
                                    <button
                                      onClick={() => handleBookQuote(rev)}
                                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      Book
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div key={tId} className="overflow-hidden rounded-xl border border-[#E0DAD0] bg-white">
                  <div className="grid grid-cols-[minmax(130px,1fr)_minmax(110px,1fr)_minmax(145px,1.2fr)_52px_minmax(100px,auto)_270px] items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleTripExpand(tId)}
                      aria-expanded={isExpanded}
                      className="col-span-5 grid grid-cols-[minmax(130px,1fr)_minmax(110px,1fr)_minmax(145px,1.2fr)_52px_minmax(100px,auto)] items-center gap-3 px-5 py-4 text-left hover:bg-[#FAF8F5]"
                    >
                      <span className="flex min-w-0 flex-col font-semibold text-[#0F1420]">
                        <span className="truncate">Trip ID ({quote.tripId || "Pending assignment"})</span>
                        <span className="truncate text-[10px] font-normal text-gray-500">
                          {quote.quoteId || quote.quoteReference || "Quote ID pending"}
                          {hasMultipleRevisions && ` · ${allRevisions.length} iterations`}
                        </span>
                      </span>
                      <span className="truncate text-gray-600">
                        {quote.legs[0]?.origin.icao || "—"} - {quote.legs[quote.legs.length - 1]?.destination.icao || "—"}
                      </span>
                      <span className="truncate text-gray-700">
                        {quote.client.companyName || quote.client.fullName || "Account unavailable"}
                      </span>
                      <span className="font-mono text-gray-700">{quote.legs[0]?.paxCount ?? "—"}</span>
                      <span className="truncate font-mono font-bold text-[#0F1420]">
                        {formatCurrency(quote.pricing.totalFlightPrice, quote.pricing.currency || "EUR")}
                      </span>
                    </button>
                    <div className="flex items-center justify-end gap-1 whitespace-nowrap pr-2">
                      <button
                        type="button"
                        onClick={() => openDocument(quote, "quotation")}
                        className="rounded-lg bg-[#C9A052] px-2 py-1.5 text-[9px] font-bold text-[#0F1420] hover:bg-[#B88F42]"
                        title="Generate or view the quotation"
                      >
                        Generate Quote
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartRevise(quote)}
                        disabled={isLatestCancelled}
                        className="rounded-lg border border-[#E0DAD0] bg-[#F5F2EC] px-2 py-1.5 text-[9px] font-bold text-[#0F1420] hover:bg-[#EBE5DB] disabled:cursor-not-allowed disabled:opacity-45"
                        title={isLatestCancelled ? "Cancelled quotes cannot be revised" : "Revise this quote"}
                      >
                        Revise Quote
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBookQuote(quote)}
                        disabled={isLatestCancelled || isBooked}
                        className="rounded-lg bg-emerald-600 px-2 py-1.5 text-[9px] font-bold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-45"
                        title={isBooked ? "This quote is already booked" : "Book this quote"}
                      >
                        Book
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-[#E0DAD0] bg-[#FAF8F5]">
                      {allRevisions.map((revision) => {
                        const isLatest = revision.id === quote.id;
                        const route = `${revision.legs[0]?.origin.icao || "—"} - ${revision.legs[revision.legs.length - 1]?.destination.icao || "—"}`;
                        return (
                          <div key={revision.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[#E0DAD0] px-5 py-3 last:border-b-0">
                            <span className="font-semibold text-[#0F1420]">
                              Trip ID ({revision.tripId || quote.tripId || "Pending assignment"})
                            </span>
                            <span className="text-gray-500">{revision.quoteId || revision.quoteReference}</span>
                            <span className="text-gray-500">{route}</span>
                            <span className="min-w-0 flex-1 text-gray-700">
                              {revision.client.companyName || revision.client.fullName || "Account unavailable"}
                            </span>
                            <span className="font-mono text-gray-600">
                              {revision.legs[0]?.paxCount ?? "—"} Pax
                            </span>
                            <span className="font-mono font-bold text-[#0F1420]">
                              {formatCurrency(revision.pricing.totalFlightPrice, revision.pricing.currency || "EUR")}
                            </span>
                            {isLatest ? (
                              <button
                                type="button"
                                onClick={() => handleStartRevise(revision)}
                                className="rounded-lg border border-[#E0DAD0] bg-white px-3 py-1.5 text-xs font-bold text-[#0F1420] hover:border-[#C9A052]"
                              >
                                Revise
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openDocument(revision, "quotation")}
                                className="rounded-lg border border-[#E0DAD0] bg-white px-3 py-1.5 text-xs font-bold text-[#0F1420] hover:border-[#C9A052]"
                              >
                                View PDF
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ));
            })}
          </div>
            </div>
          </div>

          {filteredTripGroups.length === 0 && (
            <div className="bg-white border border-[#E0DAD0] rounded-2xl p-12 text-center space-y-3">
              <FileText className="w-10 h-10 text-gray-300 mx-auto" />
              <h3 className="text-base font-bold text-[#0F1420]">No active quotes matching filters</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                No quotation records found. Booked proposals appear in Bookings. Click below to create a new quote.
              </p>
              <button
                onClick={() => setActiveTab("builder")}
                className="px-4 py-2 rounded-xl bg-[#0F1420] text-white text-xs font-bold"
              >
                + Create New Quote
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ================= QUOTE BUILDER & REVISION VIEW ================= */
        <form onSubmit={handleGenerateQuoteSubmit} className="space-y-6">
          {/* Top Banner Notice */}
          {bookingToRevise && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold">
                <RotateCcw className="w-4 h-4 text-[#C9A052]" />
                <span>
                  {bookingToRevise.isBooked
                    ? `Adding a separately priced booking revision to ${bookingToRevise.bookingRevisionId || bookingToRevise.tripNumber}.`
                    : `Revising Existing Proposal: ${bookingToRevise.quoteReference || bookingToRevise.tripNumber}. Altering routes will supersede previous itineraries and adjust accounting automatically.`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBookingToRevise(null);
                  setActiveTab("list");
                }}
                className="text-xs text-amber-800 underline font-bold cursor-pointer"
              >
                Cancel Revision
              </button>
            </div>
          )}

          {/* Validation Warnings */}
          {validationErrors.length > 0 && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-red-900 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs text-red-800">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>Important fields must be filled before quotation submission:</span>
              </div>
              <ul className="list-disc list-inside text-xs text-red-700 pl-1 space-y-0.5">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* ORBELO CHARTER ENGINE Banner Header */}
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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

          {/* SECTION 1: Quotation Details & Client */}
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0DAD0]">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-[#C9A052]" />
                <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                  1. Quotation Details & Client
                </h3>
              </div>

              {/* Quick Select Client Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#0F1420]/70 font-semibold hidden sm:inline">
                  Quick Select Client:
                </span>
                <select
                  value={selectedClientId}
                  onChange={(e) => handleClientSelectChange(e.target.value)}
                  className="bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-1.5 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
                >
                  <option value="">-- Choose Client or Account --</option>
                  {clients?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} {c.companyName ? `(${c.companyName})` : ""}
                    </option>
                  ))}
                  {accounts?.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.accountNumber})
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
                  Quote ID (assigned on save)
                </label>
                <input
                  type="text"
                  value={quoteReference || "Assigned by the server when saved"}
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
                  title="Account number is assigned to the selected client or account"
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
                  <option value="Accepted">Accepted</option>
                  <option value="Declined">Declined</option>
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

          {/* SECTION 2: Aircraft Selection & Specifications */}
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
                    className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-700 font-mono font-bold cursor-pointer"
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
                          if (!hasCustomExterior) setCustomExteriorImage(jet.imageExterior || "");
                          if (!hasCustomInterior) setCustomInteriorImage(jet.imageInterior || "");
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

            {/* Clean Selected Aircraft Preview Card */}
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
                    <span>Speed: <strong>{effectiveAircraft.cruiseSpeed || "450 ktas"}</strong></span>
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
                className="px-3.5 py-2 rounded-xl border border-[#E0DAD0] bg-white hover:bg-[#F5F2EC] text-xs font-bold text-[#0F1420] transition-colors shadow-xs cursor-pointer"
              >
                {isAircraftPickerOpen ? "Hide Dropdown" : "Browse / Switch Aircraft"}
              </button>
            </div>

            {/* Manual Aircraft Details Overrides */}
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

              {/* Feedback alert after image upload or reset */}
              {imageUploadFeedback && (
                <div className="p-3 rounded-xl bg-[#C9A052]/10 border border-[#C9A052]/40 text-[#0F1420] text-xs font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C9A052] flex-shrink-0" />
                    <span>{imageUploadFeedback}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setImageUploadFeedback(null)}
                    className="text-gray-400 hover:text-gray-600 text-xs p-1"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Hidden file inputs */}
              <input
                type="file"
                ref={exteriorFileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleImageFileChange(e.target.files?.[0], "exterior");
                  e.target.value = "";
                }}
              />
              <input
                type="file"
                ref={interiorFileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleImageFileChange(e.target.files?.[0], "interior");
                  e.target.value = "";
                }}
              />

              {/* Exterior & Interior Image Cards (Click to Upload, Hover Camera, NO URL textboxes) */}
              <div className="pt-3 border-t border-[#E0DAD0] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Exterior Photo Card */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono uppercase text-[#0F1420]/70 flex items-center gap-1 font-bold">
                      <ImageIcon className="w-3 h-3 text-[#C9A052]" />
                      Aircraft Exterior Photo
                    </label>
                    <div className="flex items-center gap-2">
                      {hasCustomExterior ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" /> Custom Photo
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-gray-500">Fleet Standard</span>
                      )}
                      {hasCustomExterior && (
                        <button
                          type="button"
                          onClick={(e) => handleResetImage("exterior", e)}
                          className="text-[10px] font-mono text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-2.5 h-2.5" /> Reset
                        </button>
                      )}
                    </div>
                  </div>

                  <div
                    onClick={() => exteriorFileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingExterior(true);
                    }}
                    onDragLeave={() => setIsDraggingExterior(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingExterior(false);
                      handleImageFileChange(e.dataTransfer.files?.[0], "exterior");
                    }}
                    className={`h-40 rounded-xl overflow-hidden border-2 border-dashed relative cursor-pointer group transition-all ${
                      isDraggingExterior
                        ? "border-[#C9A052] bg-[#C9A052]/15 scale-[1.01]"
                        : "border-[#E0DAD0] hover:border-[#C9A052] bg-[#141A29]"
                    }`}
                    title="Click to replace aircraft exterior image"
                  >
                    <img
                      src={customExteriorImage || currentAircraft.imageExterior}
                      alt="Exterior"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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

                {/* Interior Photo Card */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono uppercase text-[#0F1420]/70 flex items-center gap-1 font-bold">
                      <ImageIcon className="w-3 h-3 text-[#C9A052]" />
                      VIP Cabin Interior Photo
                    </label>
                    <div className="flex items-center gap-2">
                      {hasCustomInterior ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" /> Custom Photo
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-gray-500">Fleet Standard</span>
                      )}
                      {hasCustomInterior && (
                        <button
                          type="button"
                          onClick={(e) => handleResetImage("interior", e)}
                          className="text-[10px] font-mono text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-2.5 h-2.5" /> Reset
                        </button>
                      )}
                    </div>
                  </div>

                  <div
                    onClick={() => interiorFileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingInterior(true);
                    }}
                    onDragLeave={() => setIsDraggingInterior(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingInterior(false);
                      handleImageFileChange(e.dataTransfer.files?.[0], "interior");
                    }}
                    className={`h-40 rounded-xl overflow-hidden border-2 border-dashed relative cursor-pointer group transition-all ${
                      isDraggingInterior
                        ? "border-[#C9A052] bg-[#C9A052]/15 scale-[1.01]"
                        : "border-[#E0DAD0] hover:border-[#C9A052] bg-[#141A29]"
                    }`}
                    title="Click to replace cabin interior image"
                  >
                    <img
                      src={customInteriorImage || currentAircraft.imageInterior}
                      alt="Interior"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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

          {/* SECTION 3: Flight Routing, Airport Names & Respective FBO Handling */}
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F1420] text-white hover:bg-[#1A2338] text-xs font-bold transition-all shadow-sm cursor-pointer"
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
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
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
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
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
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
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
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
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
                            className="flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-800 bg-red-100 hover:bg-red-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* TAB 1: Routing & Airport Selection */}
                    {currentTab === "routing" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 text-xs">
                          {/* Origin Airport */}
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                              Origin Airport
                            </label>
                            <AirportSearchSelect
                              value={leg.originIcao}
                              onChange={(val) => handleLegChange(index, "originIcao", val)}
                            />
                            <p className="text-[10px] text-gray-500 mt-1 truncate">
                              {origAirport.name} ({origAirport.country})
                            </p>
                          </div>

                          {/* Destination Airport */}
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                              Destination Airport
                            </label>
                            <AirportSearchSelect
                              value={leg.destIcao}
                              onChange={(val) => handleLegChange(index, "destIcao", val)}
                            />
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
          </div>

          {/* SECTION 4: Concierge & Additional Services */}
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
                    checked={limousineService}
                    onChange={(e) => setLimousineService(e.target.checked)}
                    className="rounded text-[#C9A052] focus:ring-[#C9A052]"
                  />
                  <span className="font-medium text-[#0F1420]">VIP Limousine Service</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl border border-[#E0DAD0] bg-[#FDFCFA] hover:bg-[#F5F2EC] cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={luxuryCarRental}
                    onChange={(e) => setLuxuryCarRental(e.target.checked)}
                    className="rounded text-[#C9A052] focus:ring-[#C9A052]"
                  />
                  <span className="font-medium text-[#0F1420]">Luxury Car Rental</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl border border-[#E0DAD0] bg-[#FDFCFA] hover:bg-[#F5F2EC] cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={helicopterService}
                    onChange={(e) => setHelicopterService(e.target.checked)}
                    className="rounded text-[#C9A052] focus:ring-[#C9A052]"
                  />
                  <span className="font-medium text-[#0F1420]">Helicopter Connection</span>
                </label>
              </div>
            </div>

            {/* Cancellation Policy Placeholder */}
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

          {/* SECTION 5: Commercial Pricing Breakdown */}
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

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs font-mono">
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
                <label className="block text-[10px] text-gray-500 mb-1">Additional Services / Items</label>
                <input
                  type="number"
                  value={effectivePricing.additionalServicesTotal}
                  onChange={(e) => setCustomAdditionalServices(Number(e.target.value))}
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

              {/* End-to-End Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("list")}
                  className="py-3 px-4 rounded-xl border border-gray-600 hover:border-gray-400 text-xs font-bold text-gray-300 hover:text-white transition-all cursor-pointer"
                >
                  Back to Quotes List
                </button>

                {/* Action 1: Generate Quote PDF */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-3 px-5 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Save Quotation and Open Official PDF Document"
                >
                  <FileText className="w-4 h-4" />
                  <span>{isSubmitting ? "Saving..." : bookingToRevise?.isBooked ? "Save Booking Revision" : bookingToRevise ? "Compile Revised Quote" : "Generate Quote PDF"}</span>
                </button>

                {/* Action 2: Advance Quote -> Contract */}
                {!bookingToRevise?.isBooked && <button
                  type="button"
                  onClick={handleProceedToContract}
                  disabled={isSubmitting}
                  className="py-3 px-4 rounded-xl bg-[#1C2436] hover:bg-[#28324a] text-white border border-gray-600 font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Save Quote and Advance to Contract Agreement"
                >
                  <ScrollText className="w-4 h-4 text-[#C9A052]" />
                  <span>Proceed to Contract</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C9A052]" />
                </button>}

                {/* Action 3: Contract -> Booked Contract */}
                {!bookingToRevise?.isBooked && <button
                  type="button"
                  onClick={handleConfirmAndBookFlight}
                  disabled={isSubmitting}
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Lock in Confirmed Booking with Assigned Call Sign & Trip ID"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Book Flight</span>
                </button>}
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
      )}

      {/* Show Other Documents Modal */}
      {selectedQuoteForDocs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#D1C9BC] space-y-4">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#C9A052] font-bold">
                  ASSOCIATED CHARTER DOCUMENTS
                </span>
                <h3 className="text-lg font-black text-[#0F1420]">
                  Documents for {selectedQuoteForDocs.quoteReference || selectedQuoteForDocs.tripNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedQuoteForDocs(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => {
                  setSelectedQuoteForDocs(null);
                  openDocument(selectedQuoteForDocs, "quotation");
                }}
                className="w-full p-3 rounded-xl bg-[#F5F2EC] hover:bg-[#EBE5DB] flex items-center justify-between transition-colors text-xs font-bold text-[#0F1420]"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-[#C9A052]" />
                  <span>Official Quotation PDF</span>
                </div>
                <span className="text-[11px] font-mono text-gray-500">DOC-1 (Quotation)</span>
              </button>

              <button
                onClick={() => {
                  setSelectedQuoteForDocs(null);
                  openDocument(selectedQuoteForDocs, "charter_agreement");
                }}
                className="w-full p-3 rounded-xl bg-[#F5F2EC] hover:bg-[#EBE5DB] flex items-center justify-between transition-colors text-xs font-bold text-[#0F1420]"
              >
                <div className="flex items-center gap-2.5">
                  <ScrollText className="w-4 h-4 text-[#C9A052]" />
                  <span>Charter Agreement Contract</span>
                </div>
                <span className="text-[11px] font-mono text-gray-500">Agreement Contract</span>
              </button>

              <button
                onClick={() => {
                  setSelectedQuoteForDocs(null);
                  openDocument(selectedQuoteForDocs, "flight_brief");
                }}
                className="w-full p-3 rounded-xl bg-[#F5F2EC] hover:bg-[#EBE5DB] flex items-center justify-between transition-colors text-xs font-bold text-[#0F1420]"
              >
                <div className="flex items-center gap-2.5">
                  <Compass className="w-4 h-4 text-[#C9A052]" />
                  <span>Flight Brief & Operational Dispatch</span>
                </div>
                <span className="text-[11px] font-mono text-gray-500">Crew & Handlers</span>
              </button>

              <button
                onClick={() => {
                  setSelectedQuoteForDocs(null);
                  openDocument(selectedQuoteForDocs, "invoice");
                }}
                className="w-full p-3 rounded-xl bg-[#F5F2EC] hover:bg-[#EBE5DB] flex items-center justify-between transition-colors text-xs font-bold text-[#0F1420]"
              >
                <div className="flex items-center gap-2.5">
                  <Receipt className="w-4 h-4 text-[#C9A052]" />
                  <span>Commercial Tax Invoice</span>
                </div>
                <span className="text-[11px] font-mono text-gray-500">Tax Invoice</span>
              </button>

              <button
                onClick={() => {
                  setSelectedQuoteForDocs(null);
                  openDocument(selectedQuoteForDocs, "credit_note");
                }}
                className="w-full p-3 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-between transition-colors text-xs font-bold text-red-900 border border-red-200"
              >
                <div className="flex items-center gap-2.5">
                  <RotateCcw className="w-4 h-4 text-red-600" />
                  <span>Credit Note & Settlement Document</span>
                </div>
                <span className="text-[11px] font-mono text-red-700">Credit Adjustment</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
