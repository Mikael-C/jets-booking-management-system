"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Booking,
  BookingStatus,
  UserRole,
  AgentRequest,
  ClientRecord,
  RequestStatus,
  FlightLeg,
  OperatorRecord,
  AuditLogEntry,
  Notification,
  SourcingOption,
  RequestMessage
} from "@/types/aviation";
import { initialBookings, defaultOperator } from "@/data/initialBookings";
import { initialClients } from "@/data/clients";
import { initialAgentRequests } from "@/data/initialRequests";
import { fleetData } from "@/data/fleet";
import { findAirportByCode } from "@/data/airports";
import { calculatePricing, calculateDistanceNm, estimateFlightTimeMinutes, formatFlightTime } from "@/lib/pricingCalculator";

export type DocumentType = "quotation" | "invoice" | "flight_brief" | "charter_agreement" | "passenger_manifest" | "credit_note";

export interface UserProfile {
  name: string;
  email: string;
  role: UserRole;
  title: string;
}

export const initialOperators: OperatorRecord[] = [
  {
    id: "op-1",
    legalName: "VistaJet Aviation Malta Ltd",
    tradingName: "VistaJet",
    aocNumber: "MT-03",
    aocAuthority: "TM-CAD (Transport Malta)",
    aocExpiry: "2027-11-30",
    baseIcao: "LMML",
    salesContact: "Hélène de Courcy",
    salesEmail: "charter@vistajet.com",
    opsPhone: "+356 2125 6000",
    opsEmail: "ops@vistajet.com",
    status: "approved",
    insuranceExpiry: "2027-05-15",
    safetyRating: "ARGUS Platinum",
    safetyRatingProvider: "ARGUS International",
    notes: "Preferred heavy and ultra-long range fleet operator. Global coverage guaranteed.",
    qualificationChecklist: [
      { id: "doc-1", docType: "Air Operator Certificate (AOC)", status: "pass", expiryDate: "2027-11-30" },
      { id: "doc-2", docType: "Aircraft registered on AOC", status: "pass" },
      { id: "doc-3", docType: "Certificate of Airworthiness (ARC)", status: "pass", expiryDate: "2027-04-10" },
      { id: "doc-4", docType: "Third Party & Passenger Liability Insurance", status: "pass", expiryDate: "2027-05-15" },
      { id: "doc-5", docType: "Independent Safety Audit Rating", status: "pass", notes: "ARGUS Platinum certified" },
      { id: "doc-6", docType: "Crew Licensing, Medicals & Recurrent Training", status: "pass" },
      { id: "doc-7", docType: "24/7 Operations Control Center (OCC)", status: "pass" },
      { id: "doc-8", docType: "No Sub-Charter without Prior Consent Clause", status: "pass" },
      { id: "doc-9", docType: "Master Charter Broker Agreement Signed", status: "pass" }
    ],
    createdAt: "2026-01-15T09:00:00Z"
  },
  {
    id: "op-2",
    legalName: "GlobeAir AG",
    tradingName: "GlobeAir",
    aocNumber: "A-123",
    aocAuthority: "Austro Control (Austria)",
    aocExpiry: "2026-11-20",
    baseIcao: "LOWL",
    salesContact: "Bernhard Mayr",
    salesEmail: "sales@globeair.com",
    opsPhone: "+43 7221 727 400",
    opsEmail: "ops@globeair.com",
    status: "approved_with_conditions",
    insuranceExpiry: "2026-11-28",
    safetyRating: "IS-BAO Stage 3",
    safetyRatingProvider: "IBAC",
    notes: "Approved for Citation Mustang fleet only. Subject to annual insurance update renewal.",
    qualificationChecklist: [
      { id: "doc-1", docType: "Air Operator Certificate (AOC)", status: "pass", expiryDate: "2026-11-20" },
      { id: "doc-2", docType: "Aircraft registered on AOC", status: "pass" },
      { id: "doc-3", docType: "Certificate of Airworthiness (ARC)", status: "pass", expiryDate: "2027-02-18" },
      { id: "doc-4", docType: "Third Party & Passenger Liability Insurance", status: "pending", expiryDate: "2026-11-28", notes: "Renewal policy pending receipt" },
      { id: "doc-5", docType: "Independent Safety Audit Rating", status: "pass", notes: "IS-BAO Stage 3 verified" },
      { id: "doc-6", docType: "Crew Licensing, Medicals & Recurrent Training", status: "pass" },
      { id: "doc-7", docType: "24/7 Operations Control Center (OCC)", status: "pass" },
      { id: "doc-8", docType: "No Sub-Charter without Prior Consent Clause", status: "pass" },
      { id: "doc-9", docType: "Master Charter Broker Agreement Signed", status: "pass" }
    ],
    createdAt: "2026-02-10T11:30:00Z"
  },
  {
    id: "op-3",
    legalName: "Alpine Jet Services SAS",
    tradingName: "Alpine Jet Services",
    aocNumber: "FR.AOC.0842",
    aocAuthority: "DGAC (France)",
    aocExpiry: "2026-10-30",
    baseIcao: "LFLB",
    salesContact: "Jean-Philippe Moreau",
    salesEmail: "charter@alpinejet.fr",
    opsPhone: "+33 479 544 200",
    opsEmail: "dispatch@alpinejet.fr",
    status: "pending",
    insuranceExpiry: "2026-10-31",
    safetyRating: "Wyvern Registered",
    safetyRatingProvider: "Wyvern Wingman",
    notes: "Awaiting updated AOC renewal paperwork and signed broker agreement.",
    qualificationChecklist: [
      { id: "doc-1", docType: "Air Operator Certificate (AOC)", status: "pending", expiryDate: "2026-10-30" },
      { id: "doc-2", docType: "Aircraft registered on AOC", status: "pass" },
      { id: "doc-3", docType: "Certificate of Airworthiness (ARC)", status: "pass", expiryDate: "2027-01-15" },
      { id: "doc-4", docType: "Third Party & Passenger Liability Insurance", status: "pending", expiryDate: "2026-10-31" },
      { id: "doc-5", docType: "Independent Safety Audit Rating", status: "pass" },
      { id: "doc-6", docType: "Crew Licensing, Medicals & Recurrent Training", status: "pass" },
      { id: "doc-7", docType: "24/7 Operations Control Center (OCC)", status: "pass" },
      { id: "doc-8", docType: "No Sub-Charter without Prior Consent Clause", status: "pending" },
      { id: "doc-9", docType: "Master Charter Broker Agreement Signed", status: "pending" }
    ],
    createdAt: "2026-09-01T14:15:00Z"
  }
];

export const initialNotifications: Notification[] = [
  {
    id: "notif-1",
    type: "warning",
    title: "AOC Expiry Warning",
    message: "Alpine Jet Services AOC (FR.AOC.0842) expires in 9 days (30.10.2026). Renewal verification required.",
    timestamp: "10 mins ago",
    read: false,
    entityId: "op-3",
    entityType: "operator"
  },
  {
    id: "notif-2",
    type: "info",
    title: "New Agent RFQ Received",
    message: "Marcus Vance submitted a quote request for LSGG ⇄ LIMJ (Edward Brinkmann, 4 pax).",
    timestamp: "25 mins ago",
    read: false,
    entityId: "req-1",
    entityType: "request"
  },
  {
    id: "notif-3",
    type: "warning",
    title: "Quote Expiration Approaching",
    message: "Trip PEU842-001 proposal expires in less than 24 hours (02.10.2026 19:53z). Follow up with client.",
    timestamp: "1 hour ago",
    read: false,
    entityId: "booking-peu842",
    entityType: "quote"
  },
  {
    id: "notif-4",
    type: "success",
    title: "Wire Transfer Verified",
    message: "Payment of €18,450.00 received for Trip PEU842-001 from Brinkmann Global Capital.",
    timestamp: "3 hours ago",
    read: true,
    entityId: "booking-peu842",
    entityType: "payment"
  },
  {
    id: "notif-5",
    type: "info",
    title: "Insurance Renewal Due",
    message: "GlobeAir AG third party liability policy certificate requires renewal by 28.11.2026.",
    timestamp: "Yesterday",
    read: true,
    entityId: "op-2",
    entityType: "operator"
  }
];

export const initialAuditLog: AuditLogEntry[] = [
  {
    id: "aud-1",
    timestamp: "2026-10-21 21:45:10",
    userEmail: "admin@orbelo.com",
    userName: "Capt. Alexander Vance",
    action: "STATUS_UPDATE",
    entityType: "Booking",
    entityId: "PEU842-001",
    details: "Changed status from 'quote_sent' to 'confirmed' upon client signing"
  },
  {
    id: "aud-2",
    timestamp: "2026-10-21 20:30:15",
    userEmail: "finance@orbelo.com",
    userName: "Elena Rostova",
    action: "PAYMENT_RECORDED",
    entityType: "Payment",
    entityId: "INV-00106020",
    details: "Recorded wire transfer of €18,450.00 (Ref: RLB-8492041)"
  },
  {
    id: "aud-3",
    timestamp: "2026-10-21 19:12:00",
    userEmail: "ops@orbelo.com",
    userName: "David Schneider",
    action: "DISPATCH_CHECKLIST",
    entityType: "Checklist",
    entityId: "PEU842-001",
    details: "Completed verification: 'Aircraft Airworthiness & ARC Validity Verified'"
  },
  {
    id: "aud-4",
    timestamp: "2026-10-21 18:05:44",
    userEmail: "admin@orbelo.com",
    userName: "Capt. Alexander Vance",
    action: "PRICE_OVERRIDE",
    entityType: "Quote",
    entityId: "PEU842-001",
    details: "Applied margin discount override of 5% for VIP client account"
  },
  {
    id: "aud-5",
    timestamp: "2026-10-21 16:20:00",
    userEmail: "ops@orbelo.com",
    userName: "David Schneider",
    action: "PASSPORT_DATA_VIEW",
    entityType: "Passenger",
    entityId: "p1-manifest",
    details: "Accessed passport details for lead passenger Edward Brinkmann for APIS filing"
  },
  {
    id: "aud-6",
    timestamp: "2026-10-21 14:10:22",
    userEmail: "agent@orbelo.com",
    userName: "Marcus Vance",
    action: "REQUEST_SUBMITTED",
    entityType: "AgentRequest",
    entityId: "req-1",
    details: "Submitted charter quotation request for route LSGG ⇄ LIMJ"
  },
  {
    id: "aud-7",
    timestamp: "2026-10-21 11:00:05",
    userEmail: "admin@orbelo.com",
    userName: "Capt. Alexander Vance",
    action: "OPERATOR_QUALIFICATION",
    entityType: "Operator",
    entityId: "op-2",
    details: "Updated qualification status to 'approved_with_conditions' pending insurance renewal"
  },
  {
    id: "aud-8",
    timestamp: "2026-10-21 09:00:00",
    userEmail: "super_admin@orbelo.com",
    userName: "Maximilian von Bern",
    action: "USER_LOGIN",
    entityType: "Security",
    entityId: "SESSION-9921",
    details: "Authenticated via SSO with Role Super Admin"
  }
];

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
  updateBookingPaymentStatus: (bookingId: string, paymentStatus: Booking["paymentStatus"]) => void;
  toggleChecklistItem: (bookingId: string, stepId: string) => void;
  convertQuoteToBooked: (bookingId: string) => void;

  // Agent Requests
  agentRequests: AgentRequest[];
  addAgentRequest: (reqData: Omit<AgentRequest, "id" | "createdAt" | "status">) => AgentRequest;
  updateAgentRequestStatus: (reqId: string, status: RequestStatus, bookingId?: string, adminNotes?: string) => void;
  updateAgentRequestAvinodeId: (reqId: string, avInodeId: string) => void;
  addSourcingOption: (reqId: string, option: Omit<SourcingOption, "id" | "createdAt">) => void;
  addMessage: (reqId: string, message: Omit<RequestMessage, "id" | "timestamp">) => void;
  fulfillRequest: (req: AgentRequest) => void;

  // Clients
  clients: ClientRecord[];
  addClient: (client: ClientRecord) => void;
  prefillClientForQuote: ClientRecord | null;
  setPrefillClientForQuote: (c: ClientRecord | null) => void;

  // Operators
  operators: OperatorRecord[];
  addOperator: (op: OperatorRecord) => void;
  updateOperatorStatus: (opId: string, status: OperatorRecord["status"]) => void;
  updateOperatorChecklist: (opId: string, docId: string, status: "pass" | "fail" | "pending", notes?: string) => void;

  // Audit Log
  auditLog: AuditLogEntry[];
  addAuditEntry: (entry: Omit<AuditLogEntry, "id" | "timestamp">) => void;

  // Notifications
  notifications: Notification[];
  markNotificationRead: (id: string) => void;

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
  const [operators, setOperators] = useState<OperatorRecord[]>(initialOperators);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(initialAuditLog);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

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
      const savedOperators = localStorage.getItem("orbelo_operators_v2");
      if (savedOperators) {
        setOperators(JSON.parse(savedOperators));
      }
      const savedAudit = localStorage.getItem("orbelo_audit_v2");
      if (savedAudit) {
        setAuditLog(JSON.parse(savedAudit));
      }
      const savedNotifs = localStorage.getItem("orbelo_notifications_v2");
      if (savedNotifs) {
        setNotifications(JSON.parse(savedNotifs));
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
      localStorage.setItem("orbelo_operators_v2", JSON.stringify(operators));
      localStorage.setItem("orbelo_audit_v2", JSON.stringify(auditLog));
      localStorage.setItem("orbelo_notifications_v2", JSON.stringify(notifications));
    } catch {
      // Ignore
    }
  }, [bookings, agentRequests, clients, operators, auditLog, notifications]);

  const addAuditEntry = (entry: Omit<AuditLogEntry, "id" | "timestamp">) => {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19)
    };
    setAuditLog((prev) => [newEntry, ...prev]);
  };

  const getRoleDetails = (targetRole: UserRole, email?: string, name?: string) => {
    switch (targetRole) {
      case "super_admin":
        return {
          name: name || "Maximilian von Bern",
          email: email || "admin@orbelo.com",
          title: "Chief Executive Officer & Super Admin"
        };
      case "finance":
        return {
          name: name || "Elena Rostova",
          email: email || "finance@orbelo.com",
          title: "Chief Financial Officer & Finance Desk"
        };
      case "operations":
        return {
          name: name || "David Schneider",
          email: email || "ops@orbelo.com",
          title: "Flight Dispatch & Ground Operations"
        };
      case "agent":
        return {
          name: name || "Marcus Vance",
          email: email || "agent@orbelo.com",
          title: "Executive Charter Broker"
        };
      case "admin":
      default:
        return {
          name: name || "Capt. Alexander Vance",
          email: email || "admin@orbelo.com",
          title: "Flight Operations Director"
        };
    }
  };

  const login = (newRole: UserRole, email?: string, name?: string) => {
    const details = getRoleDetails(newRole, email, name);
    const user: UserProfile = {
      role: newRole,
      name: details.name,
      email: details.email,
      title: details.title
    };
    setCurrentUser(user);
    setRoleState(newRole);
    setIsAuthenticated(true);
    setActiveNav(newRole === "agent" ? "request_quote" : "bookings");

    addAuditEntry({
      userEmail: details.email,
      userName: details.name,
      action: "USER_LOGIN",
      entityType: "Security",
      entityId: `AUTH-${Date.now().toString().slice(-4)}`,
      details: `User logged in with role: ${newRole}`
    });
  };

  const logout = () => {
    if (currentUser) {
      addAuditEntry({
        userEmail: currentUser.email,
        userName: currentUser.name,
        action: "USER_LOGOUT",
        entityType: "Security",
        entityId: `AUTH-${Date.now().toString().slice(-4)}`,
        details: "User logged out successfully"
      });
    }
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
      const details = getRoleDetails(newRole, currentUser.email, currentUser.name);
      setCurrentUser({
        ...currentUser,
        role: newRole,
        title: details.title
      });
    }
    setActiveNav(newRole === "agent" ? "request_quote" : "bookings");
  };

  const openDocument = (booking: Booking, docType: DocumentType) => {
    setActiveBooking(booking);
    setActiveDocType(docType);
    setIsDocumentModalOpen(true);

    if (currentUser) {
      addAuditEntry({
        userEmail: currentUser.email,
        userName: currentUser.name,
        action: "DOCUMENT_VIEWED",
        entityType: "Document",
        entityId: booking.tripNumber,
        details: `Opened document ${docType} for trip ${booking.tripNumber}`
      });
    }
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
    if (currentUser) {
      addAuditEntry({
        userEmail: currentUser.email,
        userName: currentUser.name,
        action: "BOOKING_CREATED",
        entityType: "Booking",
        entityId: newBooking.tripNumber,
        details: `Created charter booking ${newBooking.tripNumber} (${newBooking.client.fullName})`
      });
    }
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

    if (currentUser) {
      addAuditEntry({
        userEmail: currentUser.email,
        userName: currentUser.name,
        action: "STATUS_UPDATE",
        entityType: "Booking",
        entityId: bookingId,
        details: `Updated booking status to: ${status}`
      });
    }
  };

  const updateBookingPaymentStatus = (bookingId: string, paymentStatus: Booking["paymentStatus"]) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, paymentStatus, updatedAt: new Date().toISOString() } : b))
    );
    if (activeBooking && activeBooking.id === bookingId) {
      setActiveBooking((prev) => (prev ? { ...prev, paymentStatus } : null));
    }
    if (selectedBookingForDetail && selectedBookingForDetail.id === bookingId) {
      setSelectedBookingForDetail((prev) => (prev ? { ...prev, paymentStatus } : null));
    }

    if (currentUser) {
      addAuditEntry({
        userEmail: currentUser.email,
        userName: currentUser.name,
        action: "PAYMENT_STATUS_UPDATE",
        entityType: "Booking",
        entityId: bookingId,
        details: `Updated payment status to: ${paymentStatus}`
      });
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
            completedBy: nextCompleted ? (role === "agent" ? "Handling Agent" : "Flight Dispatcher") : undefined
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
              completedBy: nextCompleted ? (role === "agent" ? "Handling Agent" : "Flight Dispatcher") : undefined
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
              completedBy: nextCompleted ? (role === "agent" ? "Handling Agent" : "Flight Dispatcher") : undefined
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
      priority: reqData.priority || "normal",
      sourcingOptions: reqData.sourcingOptions || [],
      messages: reqData.messages || [],
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

    // Create a notification for admin
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      type: "info",
      title: "New Agent RFQ Received",
      message: `${newReq.agentName} submitted a ${newReq.type} request for ${newReq.route} (${newReq.clientName}).`,
      timestamp: "Just now",
      read: false,
      entityId: newReq.id,
      entityType: "request"
    };
    setNotifications((prev) => [newNotif, ...prev]);

    addAuditEntry({
      userEmail: newReq.agentEmail,
      userName: newReq.agentName,
      action: "REQUEST_SUBMITTED",
      entityType: "AgentRequest",
      entityId: newReq.id,
      details: `Submitted ${newReq.type} request for route ${newReq.route}`
    });

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

    if (currentUser) {
      addAuditEntry({
        userEmail: currentUser.email,
        userName: currentUser.name,
        action: "REQUEST_STATUS_UPDATE",
        entityType: "AgentRequest",
        entityId: reqId,
        details: `Updated request status to ${status}${adminNotes ? ` (${adminNotes})` : ""}`
      });
    }
  };

  const updateAgentRequestAvinodeId = (reqId: string, avInodeId: string) => {
    setAgentRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, avInodeId } : r))
    );
  };

  const addSourcingOption = (reqId: string, option: Omit<SourcingOption, "id" | "createdAt">) => {
    const newOption: SourcingOption = {
      ...option,
      id: `src-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString()
    };

    setAgentRequests((prev) =>
      prev.map((r) => {
        if (r.id !== reqId) return r;
        const existing = r.sourcingOptions || [];
        return {
          ...r,
          status: r.status === "pending" ? "in_sourcing" : r.status,
          sourcingOptions: [newOption, ...existing]
        };
      })
    );

    if (currentUser) {
      addAuditEntry({
        userEmail: currentUser.email,
        userName: currentUser.name,
        action: "SOURCING_LOG_ADDED",
        entityType: "AgentRequest",
        entityId: reqId,
        details: `Added sourcing option: ${newOption.operatorName} (${newOption.aircraftType}) - ${newOption.currency} ${newOption.price}`
      });
    }
  };

  const addMessage = (reqId: string, message: Omit<RequestMessage, "id" | "timestamp">) => {
    const newMsg: RequestMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setAgentRequests((prev) =>
      prev.map((r) => {
        if (r.id !== reqId) return r;
        const existing = r.messages || [];
        return {
          ...r,
          messages: [...existing, newMsg]
        };
      })
    );

    if (currentUser) {
      addAuditEntry({
        userEmail: currentUser.email,
        userName: currentUser.name,
        action: "MESSAGE_POSTED",
        entityType: "AgentRequest",
        entityId: reqId,
        details: `Message from ${message.senderName}: "${message.content.substring(0, 40)}${message.content.length > 40 ? "..." : ""}"`
      });
    }
  };

  const fulfillRequest = (req: AgentRequest) => {
    const existingBooking = bookings.find((b) => b.id === req.bookingId || b.id === req.generatedBookingId);
    if (existingBooking) {
      updateAgentRequestStatus(req.id, "completed", existingBooking.id, "Generated & dispatched to agent");
      const docType: DocumentType =
        req.type === "quote" ? "quotation" : req.type === "flight_brief" ? "flight_brief" : "invoice";
      openDocument(existingBooking, docType);
      return;
    }

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
      paymentStatus: "unpaid",
      quoteStatus: req.type === "quote" ? "sent" : undefined,
      quoteVersion: 1,
      sourcingOptions: req.sourcingOptions || [],
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
    if (currentUser) {
      addAuditEntry({
        userEmail: currentUser.email,
        userName: currentUser.name,
        action: "CLIENT_CREATED",
        entityType: "Client",
        entityId: client.id,
        details: `Created client account: ${client.fullName} (${client.companyName || "Private"})`
      });
    }
  };

  const addOperator = (op: OperatorRecord) => {
    setOperators((prev) => [op, ...prev]);
    if (currentUser) {
      addAuditEntry({
        userEmail: currentUser.email,
        userName: currentUser.name,
        action: "OPERATOR_ADDED",
        entityType: "Operator",
        entityId: op.id,
        details: `Added new operator: ${op.legalName} (${op.aocNumber})`
      });
    }
  };

  const updateOperatorStatus = (opId: string, status: OperatorRecord["status"]) => {
    setOperators((prev) =>
      prev.map((op) => (op.id === opId ? { ...op, status } : op))
    );
    if (currentUser) {
      addAuditEntry({
        userEmail: currentUser.email,
        userName: currentUser.name,
        action: "OPERATOR_STATUS_CHANGED",
        entityType: "Operator",
        entityId: opId,
        details: `Updated operator status to: ${status}`
      });
    }
  };

  const updateOperatorChecklist = (
    opId: string,
    docId: string,
    status: "pass" | "fail" | "pending",
    notes?: string
  ) => {
    setOperators((prev) =>
      prev.map((op) => {
        if (op.id !== opId) return op;
        const updatedChecklist = op.qualificationChecklist.map((doc) =>
          doc.id === docId ? { ...doc, status, ...(notes !== undefined ? { notes } : {}) } : doc
        );
        return { ...op, qualificationChecklist: updatedChecklist };
      })
    );
    if (currentUser) {
      addAuditEntry({
        userEmail: currentUser.email,
        userName: currentUser.name,
        action: "OPERATOR_DOC_CHECKED",
        entityType: "Operator",
        entityId: opId,
        details: `Updated qualification doc ${docId} to ${status}`
      });
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const resetToDefaultData = () => {
    setBookings(initialBookings);
    setClients(initialClients);
    setAgentRequests(initialAgentRequests);
    setOperators(initialOperators);
    setAuditLog(initialAuditLog);
    setNotifications(initialNotifications);
    try {
      localStorage.removeItem("orbelo_bookings_v2");
      localStorage.removeItem("orbelo_requests_v2");
      localStorage.removeItem("orbelo_clients_v2");
      localStorage.removeItem("orbelo_operators_v2");
      localStorage.removeItem("orbelo_audit_v2");
      localStorage.removeItem("orbelo_notifications_v2");
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
        updateBookingPaymentStatus,
        toggleChecklistItem,
        convertQuoteToBooked,
        agentRequests,
        addAgentRequest,
        updateAgentRequestStatus,
        updateAgentRequestAvinodeId,
        addSourcingOption,
        addMessage,
        fulfillRequest,
        clients,
        addClient,
        prefillClientForQuote,
        setPrefillClientForQuote,
        operators,
        addOperator,
        updateOperatorStatus,
        updateOperatorChecklist,
        auditLog,
        addAuditEntry,
        notifications,
        markNotificationRead,
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
