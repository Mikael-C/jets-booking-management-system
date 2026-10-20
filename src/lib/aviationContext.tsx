"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Booking, BookingStatus, UserRole, AgentRequest, ClientRecord, RequestStatus, FlightLeg } from "@/types/aviation";
import { initialBookings, defaultOperator } from "@/data/initialBookings";
import { initialClients } from "@/data/clients";
import { initialAgentRequests } from "@/data/initialRequests";
import { fleetData } from "@/data/fleet";
import { findAirportByCode } from "@/data/airports";
import { calculatePricing, calculateDistanceNm, estimateFlightTimeMinutes, formatFlightTime } from "@/lib/pricingCalculator";

export type DocumentType = "quotation" | "invoice" | "flight_brief" | "charter_agreement";

interface UserProfile {
  name: string;
  email: string;
  role: UserRole;
  title: string;
}

interface AviationContextType {
  // Auth state
  isAuthenticated: boolean;
  currentUser: UserProfile | null;
  role: UserRole;
  login: (role: UserRole, email?: string, name?: string) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;

  // Navigation
  activeNav: string;
  setActiveNav: (nav: string) => void;

  // Bookings
  bookings: Booking[];
  activeBooking: Booking | null;
  activeDocType: DocumentType;
  isDocumentModalOpen: boolean;
  isChecklistDrawerOpen: boolean;
  isNewQuoteModalOpen: boolean;
  selectedBookingForDetail: Booking | null;
  setSelectedBookingForDetail: (b: Booking | null) => void;

  // Search & Filter
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;

  // Document & Drawer Actions
  openDocument: (booking: Booking, docType: DocumentType) => void;
  closeDocument: () => void;
  openChecklist: (booking: Booking) => void;
  closeChecklist: () => void;
  openNewQuoteModal: () => void;
  closeNewQuoteModal: () => void;
  addBooking: (booking: Booking) => void;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => void;
  toggleChecklistItem: (bookingId: string, stepId: string) => void;
  convertQuoteToBooked: (bookingId: string) => void;

  // Agent Requests
  agentRequests: AgentRequest[];
  addAgentRequest: (reqData: Omit<AgentRequest, "id" | "createdAt" | "status">) => AgentRequest;
  updateAgentRequestStatus: (reqId: string, status: RequestStatus, bookingId?: string, adminNotes?: string) => void;
  fulfillRequest: (req: AgentRequest) => void;

  // Clients
  clients: ClientRecord[];
  addClient: (client: ClientRecord) => void;
  prefillClientForQuote: ClientRecord | null;
  setPrefillClientForQuote: (c: ClientRecord | null) => void;

  // Reset
  resetToDefaultData: () => void;
}

const AviationContext = createContext<AviationContextType | undefined>(undefined);

export function AviationProvider({ children }: { children: React.ReactNode }) {
  // Auth state - starts unauthenticated so landing page is always the login page on load
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [role, setRoleState] = useState<UserRole>("admin");

  // Navigation
  const [activeNav, setActiveNav] = useState<string>("bookings");

  // Core Data
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [clients, setClients] = useState<ClientRecord[]>(initialClients);
  const [agentRequests, setAgentRequests] = useState<AgentRequest[]>(initialAgentRequests);

  // Modals & Active Selections
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<Booking | null>(null);
  const [activeDocType, setActiveDocType] = useState<DocumentType>("quotation");
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isChecklistDrawerOpen, setIsChecklistDrawerOpen] = useState(false);
  const [isNewQuoteModalOpen, setIsNewQuoteModalOpen] = useState(false);
  const [prefillClientForQuote, setPrefillClientForQuote] = useState<ClientRecord | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Load from localStorage on mount
  useEffect(() => {
    try {
      // Clear any persisted auth flags so the landing page is always the login page when app loads
      localStorage.removeItem("orbelo_is_authenticated");
      localStorage.removeItem("orbelo_current_user");

      const savedBookings = localStorage.getItem("orbelo_bookings_v2");
      if (savedBookings) {
        setBookings(JSON.parse(savedBookings));
      }
      const savedRequests = localStorage.getItem("orbelo_requests_v2");
      if (savedRequests) {
        setAgentRequests(JSON.parse(savedRequests));
      }
      const savedClients = localStorage.getItem("orbelo_clients_v2");
      if (savedClients) {
        setClients(JSON.parse(savedClients));
      }
    } catch {
      // Use defaults if parse fails
    }
  }, []);

  // Sync business records state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("orbelo_bookings_v2", JSON.stringify(bookings));
      localStorage.setItem("orbelo_requests_v2", JSON.stringify(agentRequests));
      localStorage.setItem("orbelo_clients_v2", JSON.stringify(clients));
    } catch {
      // Ignore
    }
  }, [bookings, agentRequests, clients]);

  const login = (newRole: UserRole, email?: string, name?: string) => {
    const user: UserProfile = {
      role: newRole,
      name: name || (newRole === "admin" ? "Capt. Alexander Vance" : "Marcus Vance"),
      email: email || (newRole === "admin" ? "admin@orbelo.com" : "agent@orbelo.com"),
      title: newRole === "admin" ? "Flight Operations Director" : "Executive Charter Broker"
    };
    setCurrentUser(user);
    setRoleState(newRole);
    setIsAuthenticated(true);
    setActiveNav(newRole === "admin" ? "bookings" : "request_quote");
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    try {
      localStorage.removeItem("orbelo_is_authenticated");
      localStorage.removeItem("orbelo_current_user");
    } catch {
      // Ignore
    }
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        role: newRole,
        title: newRole === "admin" ? "Flight Operations Director" : "Executive Charter Broker"
      });
    }
    setActiveNav(newRole === "admin" ? "bookings" : "request_quote");
  };

  const openDocument = (booking: Booking, docType: DocumentType) => {
    setActiveBooking(booking);
    setActiveDocType(docType);
    setIsDocumentModalOpen(true);
  };

  const closeDocument = () => {
    setIsDocumentModalOpen(false);
  };

  const openChecklist = (booking: Booking) => {
    setActiveBooking(booking);
    setIsChecklistDrawerOpen(true);
  };

  const closeChecklist = () => {
    setIsChecklistDrawerOpen(false);
  };

  const openNewQuoteModal = () => {
    setIsNewQuoteModalOpen(true);
  };

  const closeNewQuoteModal = () => {
    setIsNewQuoteModalOpen(false);
  };

  const addBooking = (newBooking: Booking) => {
    setBookings((prev) => [newBooking, ...prev]);
  };

  const updateBookingStatus = (bookingId: string, status: BookingStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status, updatedAt: new Date().toISOString() } : b))
    );
    if (activeBooking && activeBooking.id === bookingId) {
      setActiveBooking((prev) => (prev ? { ...prev, status } : null));
    }
    if (selectedBookingForDetail && selectedBookingForDetail.id === bookingId) {
      setSelectedBookingForDetail((prev) => (prev ? { ...prev, status } : null));
    }
  };

  const toggleChecklistItem = (bookingId: string, stepId: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        const updatedChecklist = b.checklist.map((item) => {
          if (item.id !== stepId) return item;
          const nextCompleted = !item.isCompleted;
          return {
            ...item,
            isCompleted: nextCompleted,
            completedAt: nextCompleted
              ? new Date().toLocaleString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })
              : undefined,
            completedBy: nextCompleted ? (role === "admin" ? "Flight Dispatcher" : "Handling Agent") : undefined
          };
        });
        return { ...b, checklist: updatedChecklist, updatedAt: new Date().toISOString() };
      })
    );

    if (activeBooking && activeBooking.id === bookingId) {
      setActiveBooking((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          checklist: prev.checklist.map((item) => {
            if (item.id !== stepId) return item;
            const nextCompleted = !item.isCompleted;
            return {
              ...item,
              isCompleted: nextCompleted,
              completedAt: nextCompleted
                ? new Date().toLocaleString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })
                : undefined,
              completedBy: nextCompleted ? (role === "admin" ? "Flight Dispatcher" : "Handling Agent") : undefined
            };
          })
        };
      });
    }

    if (selectedBookingForDetail && selectedBookingForDetail.id === bookingId) {
      setSelectedBookingForDetail((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          checklist: prev.checklist.map((item) => {
            if (item.id !== stepId) return item;
            const nextCompleted = !item.isCompleted;
            return {
              ...item,
              isCompleted: nextCompleted,
              completedAt: nextCompleted
                ? new Date().toLocaleString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })
                : undefined,
              completedBy: nextCompleted ? (role === "admin" ? "Flight Dispatcher" : "Handling Agent") : undefined
            };
          })
        };
      });
    }
  };

  const convertQuoteToBooked = (bookingId: string) => {
    updateBookingStatus(bookingId, "confirmed");
  };

  const addAgentRequest = (reqData: Omit<AgentRequest, "id" | "createdAt" | "status">): AgentRequest => {
    const newReq: AgentRequest = {
      ...reqData,
      id: `req-${Date.now()}`,
      createdAt: new Date().toLocaleString("de-DE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }),
      status: "pending"
    };
    setAgentRequests((prev) => [newReq, ...prev]);
    return newReq;
  };

  const updateAgentRequestStatus = (reqId: string, status: RequestStatus, bookingId?: string, adminNotes?: string) => {
    setAgentRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              status,
              ...(bookingId ? { generatedBookingId: bookingId } : {}),
              ...(adminNotes ? { adminNotes } : {})
            }
          : r
      )
    );
  };

  const fulfillRequest = (req: AgentRequest) => {
    // If request already has a booking, open it
    const existingBooking = bookings.find((b) => b.id === req.bookingId || b.id === req.generatedBookingId);
    if (existingBooking) {
      updateAgentRequestStatus(req.id, "completed", existingBooking.id, "Generated & dispatched to agent");
      const docType: DocumentType =
        req.type === "quote" ? "quotation" : req.type === "flight_brief" ? "flight_brief" : "invoice";
      openDocument(existingBooking, docType);
      return;
    }

    // Otherwise, create a brand new booking from the agent request details!
    const origCode = req.originIcao || "LSGG";
    const destCode = req.destIcao || "LFMN";
    const origAirport = findAirportByCode(origCode);
    const destAirport = findAirportByCode(destCode);
    const dist = calculateDistanceNm(
      origAirport.coordinates?.lat || 46.2,
      origAirport.coordinates?.lng || 6.1,
      destAirport.coordinates?.lat || 43.6,
      destAirport.coordinates?.lng || 7.2
    );
    const flightMinutes = estimateFlightTimeMinutes(dist);

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const newTripNumber = `PEU${randomSuffix}-001`;
    const newInvoiceNumber = `0010${Math.floor(6000 + Math.random() * 3000)}`;
    const newAccountNumber = `${Math.floor(200000 + Math.random() * 800000)}`;

    const matchedAircraft =
      fleetData.find((a) =>
        req.aircraftPreference?.toLowerCase().includes(a.name.toLowerCase()) ||
        req.aircraftPreference?.toLowerCase().includes(a.category.toLowerCase())
      ) || fleetData[0];

    const generatedLegs: FlightLeg[] = [
      {
        legNumber: 1,
        flightDate: req.flightDate || "2026-10-24",
        origin: origAirport,
        destination: destAirport,
        departureTimeLocal: req.departureTime ? `${req.departureTime} h` : "11:00 h",
        arrivalTimeLocal: "12:15 h",
        flightTimeFormatted: formatFlightTime(flightMinutes),
        paxCount: req.paxCount || 2,
        flightNumber: `PEU${randomSuffix}`,
        aircraftRegistration: matchedAircraft.registration || "OE-FFB",
        crew: [
          { role: "CMDR", name: "Capt. Audrain, Emmanuel", phone: "+43 664 8489 904" },
          { role: "F/O", name: "El Hassani Amrani, Hajar", phone: "+43 664 8489 928" }
        ],
        passengers: [
          { id: "p1", fullName: req.clientName, isLeadPassenger: true }
        ],
        departureHandling: {
          name: `${origAirport.name} FBO`,
          airportCode: origAirport.icao,
          phone: "+41 58 158 1811",
          email: `ops@${origAirport.icao.toLowerCase()}.handling.aero`
        },
        arrivalHandling: {
          name: `${destAirport.name} FBO`,
          airportCode: destAirport.icao,
          phone: "+33 493 213737",
          email: `ops@${destAirport.icao.toLowerCase()}.handling.aero`
        }
      }
    ];

    if (req.tripType === "round_trip" || req.returnFlightDate) {
      generatedLegs.push({
        legNumber: 2,
        flightDate: req.returnFlightDate || req.flightDate,
        origin: destAirport,
        destination: origAirport,
        departureTimeLocal: "16:00 h",
        arrivalTimeLocal: "17:15 h",
        flightTimeFormatted: formatFlightTime(flightMinutes),
        paxCount: req.paxCount || 2,
        flightNumber: `PEU${randomSuffix}`,
        aircraftRegistration: matchedAircraft.registration || "OE-FFB",
        crew: [
          { role: "CMDR", name: "Capt. Audrain, Emmanuel", phone: "+43 664 8489 904" },
          { role: "F/O", name: "El Hassani Amrani, Hajar", phone: "+43 664 8489 928" }
        ],
        passengers: [
          { id: "p2", fullName: req.clientName, isLeadPassenger: true }
        ],
        departureHandling: {
          name: `${destAirport.name} FBO`,
          airportCode: destAirport.icao,
          phone: "+33 493 213737",
          email: `ops@${destAirport.icao.toLowerCase()}.handling.aero`
        },
        arrivalHandling: {
          name: `${origAirport.name} FBO`,
          airportCode: origAirport.icao,
          phone: "+41 58 158 1811",
          email: `ops@${origAirport.icao.toLowerCase()}.handling.aero`
        }
      });
    }

    const calculatedPricing = calculatePricing(
      matchedAircraft,
      generatedLegs,
      {
        limousineService: !!req.limousineService,
        luxuryCarRental: !!req.luxuryCarRental,
        helicopterService: !!req.helicopterService,
        vipCateringDetails: req.specialRequests || "Complimentary VIP Catering",
        deicingInsurance: req.deicingInsurance || "none",
        deicingCostPerLeg: req.deicingInsurance === "at_reservation" ? 400 : req.deicingInsurance === "within_48h" ? 800 : 0,
        carbonOffset: req.carbonOffset || "neutral",
        carbonOffsetRatePerHour: 33,
        cancellationInsurance: !!req.cancellationInsurance
      },
      "EUR"
    );

    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      tripNumber: newTripNumber,
      invoiceNumber: newInvoiceNumber,
      accountNumber: newAccountNumber,
      contractDate: new Date().toLocaleDateString("de-DE"),
      quoteExpirationDate: new Date(Date.now() + 86400000 * 2).toLocaleDateString("de-DE") + ", 18:00z",
      paymentDueDate: req.invoiceDueDate || new Date(Date.now() + 86400000 * 3).toLocaleDateString("de-DE"),
      status: req.type === "quote" ? "quote_sent" : "confirmed",
      tripType: req.tripType || (req.returnFlightDate ? "round_trip" : "one_way"),
      aircraft: matchedAircraft,
      client: {
        fullName: req.clientName,
        companyName: req.companyName,
        streetAddress: req.clientAddress || "3606 Enterprise Ave",
        cityPostalCountry: req.clientCityCountry || "FL-34104 Naples, United States",
        phone: req.clientPhone,
        email: req.clientEmail,
        vatNumber: req.clientVatNumber
      },
      operator: defaultOperator,
      legs: generatedLegs,
      pricing: calculatedPricing,
      services: {
        limousineService: !!req.limousineService,
        luxuryCarRental: !!req.luxuryCarRental,
        helicopterService: !!req.helicopterService,
        vipCateringDetails: req.specialRequests || "Taittinger Champagne and fine hors d'oeuvres",
        deicingInsurance: req.deicingInsurance || "none",
        deicingCostPerLeg: req.deicingInsurance === "at_reservation" ? 400 : req.deicingInsurance === "within_48h" ? 800 : 0,
        carbonOffset: req.carbonOffset || "neutral",
        carbonOffsetRatePerHour: 33,
        cancellationInsurance: !!req.cancellationInsurance
      },
      checklist: [
        { id: "step-1", label: "Aircraft Airworthiness & ARC Validity Verified", category: "aircraft", isCompleted: true, completedAt: "Just now", completedBy: "Flight Dispatcher", requiredForDispatch: true },
        { id: "step-2", label: "ATC Eurocontrol Flight Plan Filed & Accepted", category: "permits", isCompleted: true, completedAt: "Just now", completedBy: "Flight Dispatcher", requiredForDispatch: true },
        { id: "step-3", label: "Origin & Destination FBO Ramp Handling Booked", category: "ground", isCompleted: false, requiredForDispatch: true },
        { id: "step-4", label: "Airport Slots & PPR Cleared", category: "permits", isCompleted: false, requiredForDispatch: true }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    addBooking(newBooking);
    updateAgentRequestStatus(req.id, "completed", newBooking.id, "Admin generated official document");
    const docType: DocumentType =
      req.type === "quote" ? "quotation" : req.type === "flight_brief" ? "flight_brief" : "invoice";
    openDocument(newBooking, docType);
  };

  const addClient = (client: ClientRecord) => {
    setClients((prev) => [client, ...prev]);
  };

  const resetToDefaultData = () => {
    setBookings(initialBookings);
    setClients(initialClients);
    setAgentRequests(initialAgentRequests);
    try {
      localStorage.removeItem("orbelo_bookings_v2");
      localStorage.removeItem("orbelo_requests_v2");
      localStorage.removeItem("orbelo_clients_v2");
    } catch {
      // Ignore
    }
  };

  return (
    <AviationContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        role,
        login,
        logout,
        setRole,
        activeNav,
        setActiveNav,
        bookings,
        activeBooking,
        activeDocType,
        isDocumentModalOpen,
        isChecklistDrawerOpen,
        isNewQuoteModalOpen,
        selectedBookingForDetail,
        setSelectedBookingForDetail,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        openDocument,
        closeDocument,
        openChecklist,
        closeChecklist,
        openNewQuoteModal,
        closeNewQuoteModal,
        addBooking,
        updateBookingStatus,
        toggleChecklistItem,
        convertQuoteToBooked,
        agentRequests,
        addAgentRequest,
        updateAgentRequestStatus,
        fulfillRequest,
        clients,
        addClient,
        prefillClientForQuote,
        setPrefillClientForQuote,
        resetToDefaultData
      }}
    >
      {children}
    </AviationContext.Provider>
  );
}

export function useAviation() {
  const context = useContext(AviationContext);
  if (!context) {
    throw new Error("useAviation must be used within an AviationProvider");
  }
  return context;
}
