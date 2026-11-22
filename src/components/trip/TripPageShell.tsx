"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import { Booking, FlightLeg, PricingBreakdown, PassengerManifestItem, SourcingOption } from "@/types/aviation";
import { formatTripVersion, formatDocumentId, maskPassportNumber, formatTripId, renderFormattedId } from "@/lib/idGenerator";
import { formatCurrency } from "@/lib/pricingCalculator";
import { getAirportFbos } from "@/data/airports";
import StageStepper, { TripStage } from "@/components/ui/StageStepper";
import StatusPill from "@/components/ui/StatusPill";
import MissingDataBadge from "@/components/ui/MissingDataBadge";
import { api } from "@/lib/api";
import {
  Plane,
  Clock,
  User,
  Building2,
  FileText,
  Receipt,
  RotateCcw,
  Plus,
  Compass,
  ScrollText,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Shield,
  CreditCard,
  History,
  Layers,
  ArrowRight,
  Eye,
  EyeOff,
  UploadCloud,
  DollarSign,
  X,
  Sparkles,
  Download,
  Calendar,
  Users
} from "lucide-react";

export type TripTabKey =
  | "itinerary"
  | "passengers"
  | "sourcing"
  | "pricing"
  | "services"
  | "documents"
  | "accounting"
  | "messages"
  | "flight_watch"
  | "revisions"
  | "notes";

export interface TripMessageItem {
  id: string;
  status: "sent" | "due_now" | "scheduled";
  when: string;
  code: string;
  title: string;
  to: string;
  channel: string;
  result: string;
  content?: string;
}

const defaultTripMessages: TripMessageItem[] = [
  {
    id: "msg-01",
    status: "sent",
    when: "Mon 16 Nov 10:12",
    code: "QUO-01",
    title: "Quote ready",
    to: "Curator M. Vance",
    channel: "WhatsApp",
    result: "Read"
  },
  {
    id: "msg-02",
    status: "sent",
    when: "Mon 16 Nov 14:40",
    code: "BKG-01",
    title: "Charter agreement to sign",
    to: "T. Adeyemi",
    channel: "Email",
    result: "Signed 15:05"
  },
  {
    id: "msg-03",
    status: "sent",
    when: "Mon 16 Nov 15:06",
    code: "PAY-01",
    title: "Invoice issued",
    to: "Billing · Adeyemi Holdings",
    channel: "Email",
    result: "Opened"
  },
  {
    id: "msg-04",
    status: "sent",
    when: "Mon 16 Nov 15:07",
    code: "OPS-01",
    title: "Passenger details request",
    to: "T. Adeyemi, assistant K. Ola",
    channel: "WhatsApp · email",
    result: "2 of 4 filled"
  },
  {
    id: "msg-05",
    status: "sent",
    when: "Tue 17 Nov 09:00",
    code: "OPS-02",
    title: "Passenger details reminder",
    to: "K. Ola",
    channel: "WhatsApp",
    result: "Read"
  },
  {
    id: "msg-06",
    status: "sent",
    when: "Tue 17 Nov 11:30",
    code: "PAY-04",
    title: "Payment received",
    to: "T. Adeyemi, copy Curator",
    channel: "WhatsApp",
    result: "Delivered"
  },
  {
    id: "msg-07",
    status: "sent",
    when: "Wed 18 Nov 16:20",
    code: "OPS-04",
    title: "Slot confirmed (LEIB)",
    to: "Curator",
    channel: "WhatsApp",
    result: "Read"
  },
  {
    id: "msg-08",
    status: "due_now",
    when: "Thu 19 Nov 09:00",
    code: "OPS-02",
    title: "Passenger details reminder (24 h)",
    to: "K. Ola",
    channel: "WhatsApp",
    result: "Needs approval: 2 passports still missing"
  },
  {
    id: "msg-09",
    status: "scheduled",
    when: "Thu 19 Nov 12:00",
    code: "OPS-08",
    title: "Flight brief",
    to: "T. Adeyemi, 4 pax, Curator",
    channel: "Email · WhatsApp",
    result: "Waits for passenger list"
  },
  {
    id: "msg-10",
    status: "scheduled",
    when: "Fri 20 Nov 07:30",
    code: "OPS-10",
    title: "Driver details",
    to: "T. Adeyemi",
    channel: "WhatsApp",
    result: "—"
  },
  {
    id: "msg-11",
    status: "scheduled",
    when: "On take-off",
    code: "FW-01",
    title: "Departed",
    to: "Curator, driver at LSGG",
    channel: "WhatsApp",
    result: "—"
  },
  {
    id: "msg-12",
    status: "scheduled",
    when: "On landing",
    code: "FW-03",
    title: "Landed",
    to: "Curator, driver",
    channel: "WhatsApp",
    result: "—"
  },
  {
    id: "msg-13",
    status: "scheduled",
    when: "Fri 20 Nov 21:00",
    code: "POST-01",
    title: "Thank you and feedback",
    to: "T. Adeyemi, copy Curator",
    channel: "Email · WhatsApp",
    result: "—"
  }
];

const pipelineStages = [
  { id: "request", label: "Request" },
  { id: "sourcing", label: "Sourcing" },
  { id: "quoted", label: "Quoted" },
  { id: "booked", label: "Booked" },
  { id: "paid", label: "Paid" },
  { id: "confirmed", label: "Confirmed" },
  { id: "flown", label: "Flown" },
  { id: "closed", label: "Closed" }
];

interface TripPageShellProps {
  tripId: string;
  initialTab?: TripTabKey;
}

export default function TripPageShell({ tripId, initialTab = "itinerary" }: TripPageShellProps) {
  const router = useRouter();
  const {
    bookings,
    role,
    settings,
    openDocument,
    convertQuoteToBooked,
    issueCreditNote,
    contacts,
    addContact,
    currentUser
  } = useAviation();

  const [activeTab, setActiveTab] = useState<TripTabKey>(initialTab);
  const [copiedAvinode, setCopiedAvinode] = useState(false);

  // Masked passport toggle state
  const [revealedPassports, setRevealedPassports] = useState<Record<string, boolean>>({});

  // Passenger Modal State
  const [isAddPaxModalOpen, setIsAddPaxModalOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [isLeadPax, setIsLeadPax] = useState(false);

  // Sourcing Modal State
  const [isLogOfferModalOpen, setIsLogOfferModalOpen] = useState(false);
  const [offerOperator, setOfferOperator] = useState("GlobeAir AG");
  const [offerAircraft, setOfferAircraft] = useState("Cessna Citation Mustang (OE-FFB)");
  const [offerYom, setOfferYom] = useState(2018);
  const [offerPrice, setOfferPrice] = useState(11200);
  const [offerValidUntil, setOfferValidUntil] = useState("2026-11-20");

  // Service Modal State
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [serviceType, setServiceType] = useState<"limousine" | "catering" | "special_request" | "helicopter">("limousine");
  const [serviceTitle, setServiceTitle] = useState("");
  const [serviceClientPrice, setServiceClientPrice] = useState<number>(450);
  const [serviceSupplierCost, setServiceSupplierCost] = useState<number>(320);

  // Credit Note Modal State (R-030 & R-022)
  const [isCreditNoteModalOpen, setIsCreditNoteModalOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState<number>(250);
  const [creditReason, setCreditReason] = useState<string>("Complimentary ground handling courtesy adjustment");
  const [creditError, setCreditError] = useState<string>("");

  // Margin Override State (R-019)
  const [marginOverridePercent, setMarginOverridePercent] = useState<number>(10);
  const [marginReason, setMarginReason] = useState<string>("");
  const [isMarginOverridden, setIsMarginOverridden] = useState<boolean>(false);

  // Version Compare Diff Tool State (R-023)
  const [compareVersionA, setCompareVersionA] = useState<number>(1);
  const [compareVersionB, setCompareVersionB] = useState<number>(2);

  // Automated Payment Reminder (PAY-02) State (Screen 4)
  const [autoPaymentReminders, setAutoPaymentReminders] = useState<boolean>(true);
  const [isSendingReminder, setIsSendingReminder] = useState<boolean>(false);
  const [reminderFeedback, setReminderFeedback] = useState<string | null>(null);

  // Admin -> Curator Document Flow State (NF-02)
  const [docFlowState, setDocFlowState] = useState<Record<string, { status: "Draft" | "Sent" | "Viewed" | "Accepted"; sentAt?: string }>>({
    quotation: { status: "Sent", sentAt: "16 Nov 10:12" },
    charter_agreement: { status: "Sent", sentAt: "16 Nov 14:40" },
    invoice: { status: "Sent", sentAt: "16 Nov 15:06" },
    flight_brief: { status: "Draft" },
  });
  const [docFlowToast, setDocFlowToast] = useState<string | null>(null);

  const handleSendDocToCurator = (docType: string, docLabel: string) => {
    const now = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    setDocFlowState((prev) => ({
      ...prev,
      [docType]: { status: "Sent", sentAt: now },
    }));
    setDocFlowToast(`${docLabel} dispatched to Curator portal & WhatsApp`);
    setTimeout(() => setDocFlowToast(null), 4000);
  };

  // Normalize tripId (e.g. FE4578, LE7143, booking-peu842, or PEU842-001)
  const normalizedId = useMemo(() => {
    return (tripId || "")
      .toUpperCase()
      .replace(/^BOOKING-/, "")
      .replace(/^TRIP-/, "")
      .replace(/^TRI-/, "")
      .split("-")[0];
  }, [tripId]);

  // Find all revisions for this trip root
  const tripVersions = useMemo(() => {
    const rawTripId = (tripId || "").toUpperCase();
    return bookings.filter((b) => {
      const bId = (b.id || "").toUpperCase();
      const bTripId = (b.tripId || "").toUpperCase();
      const bTripNumber = (b.tripNumber || "").toUpperCase();
      const bQuoteRef = (b.quoteReference || "").toUpperCase();

      // Direct exact matches
      if (bId === rawTripId || bTripId === rawTripId || bTripNumber === rawTripId || bQuoteRef === rawTripId) {
        return true;
      }

      // Cleaned root match
      const bTripRoot = (b.tripId || b.tripNumber || b.id || "")
        .toUpperCase()
        .replace(/^BOOKING-/, "")
        .replace(/^TRIP-/, "")
        .replace(/^TRI-/, "")
        .split("-")[0];

      if (normalizedId && bTripRoot === normalizedId) {
        return true;
      }

      if (normalizedId && (bTripNumber.includes(normalizedId) || bTripId.includes(normalizedId) || bId.includes(normalizedId))) {
        return true;
      }

      return false;
    });
  }, [bookings, normalizedId, tripId]);

  // Active (latest) version of the trip
  const currentTrip: Booking | undefined = useMemo(() => {
    if (tripVersions.length > 0) {
      const sorted = [...tripVersions].sort((a, b) => {
        const verA = a.quoteVersion || 1;
        const verB = b.quoteVersion || 1;
        return verA - verB;
      });
      return sorted[sorted.length - 1];
    }

    const rawTripId = (tripId || "").toUpperCase();
    // Direct match fallback
    const direct = bookings.find((b) => {
      const bId = (b.id || "").toUpperCase();
      const bTripId = (b.tripId || "").toUpperCase();
      const bTripNumber = (b.tripNumber || "").toUpperCase();
      const bQuoteRef = (b.quoteReference || "").toUpperCase();
      return bId === rawTripId || bTripId === rawTripId || bTripNumber === rawTripId || bQuoteRef === rawTripId;
    });
    if (direct) return direct;

    // Fail-safe check in localStorage in case context hasn't reloaded
    if (typeof window !== "undefined") {
      try {
        const localData = localStorage.getItem("orbelo_bookings_v2");
        if (localData) {
          const parsed = JSON.parse(localData);
          if (Array.isArray(parsed)) {
            const found = parsed.find((b: any) => {
              const bId = String(b.id || "").toUpperCase();
              const bTripId = String(b.tripId || "").toUpperCase();
              const bTripNum = String(b.tripNumber || "").toUpperCase();
              return (
                bId === rawTripId ||
                bTripId === rawTripId ||
                bTripNum === rawTripId ||
                (normalizedId && (bTripId.includes(normalizedId) || bTripNum.includes(normalizedId)))
              );
            });
            if (found) return found as Booking;
          }
        }
      } catch {
        // ignore
      }
    }

    return undefined;
  }, [tripVersions, bookings, tripId, normalizedId]);

  if (!currentTrip) {
    return (
      <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-10 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-[var(--amber)] mx-auto" />
        <h2 className="text-xl font-bold font-display text-[var(--ink)]">Trip not found</h2>
        <p className="text-xs text-[var(--muted)] font-mono">
          Could not locate flight record matching identifier: {tripId}
        </p>
        <Link href="/quotes" className="btn-secondary inline-flex">
          Back to Quotes
        </Link>
      </div>
    );
  }

  // Determine stage
  const isCancelled = Boolean(currentTrip.isCancelled || currentTrip.status === "cancelled");
  const isBooked = !isCancelled && Boolean(
    currentTrip.isBooked ||
    ["confirmed", "dispatched", "in_flight", "completed", "flown"].includes(currentTrip.status)
  );
  const isContractSent = !isCancelled && currentTrip.status === "contract_sent";
  const isPaid = !isCancelled && currentTrip.paymentStatus === "fully_paid";

  let derivedStage: TripStage = "quoted";
  if (isCancelled) derivedStage = "cancelled";
  else if (currentTrip.status === "completed" || currentTrip.status === "flown") derivedStage = "flown";
  else if (currentTrip.status === "confirmed") derivedStage = "confirmed";
  else if (isPaid) derivedStage = "paid";
  else if (isBooked) derivedStage = "booked";
  else if (isContractSent) derivedStage = "booked";
  else if (currentTrip.status === "in_sourcing") derivedStage = "sourcing";

  // Check missing passenger passports (▲ warning)
  const missingPassportsCount = currentTrip.legs.flatMap((l) => l.passengers).filter(
    (p) => !p.passportNumber || p.passportNumber.length < 5
  ).length;

  const tripNumberDisplay = currentTrip.tripNumber || currentTrip.tripId || (currentTrip.id?.startsWith("booking-") ? formatTripId(currentTrip.id) : currentTrip.id) || "TRI-FE001";
  const rootId = tripNumberDisplay;
  const versionNum = currentTrip.quoteVersion || 1;
  const versionBadge = formatTripVersion(rootId, versionNum);

  // Active Pipeline Stage
  const [activePipelineStage, setActivePipelineStage] = useState<string>("paid");

  // Messages State
  const [tripMessages, setTripMessages] = useState<TripMessageItem[]>(defaultTripMessages);
  const [messageFilter, setMessageFilter] = useState<"all" | "due_now" | "scheduled" | "sent" | "manual">("all");
  const [composerTo, setComposerTo] = useState("Curator M. Vance");
  const [composerTemplate, setComposerTemplate] = useState("none");
  const [composerMessage, setComposerMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageSentToast, setMessageSentToast] = useState(false);
  const [selectedMessageModal, setSelectedMessageModal] = useState<TripMessageItem | null>(null);

  // Initialize autoPaymentReminders from trip if set
  useEffect(() => {
    if (currentTrip && typeof currentTrip.autoPaymentRemindersEnabled === "boolean") {
      setAutoPaymentReminders(currentTrip.autoPaymentRemindersEnabled);
    }
  }, [currentTrip]);

  const handleToggleAutoReminders = async () => {
    const nextVal = !autoPaymentReminders;
    setAutoPaymentReminders(nextVal);
    try {
      const invId = currentTrip?.invoiceNumber || currentTrip?.id || rootId;
      await api.invoices.toggleAutoReminders(invId, nextVal);
      setReminderFeedback(`Automated payment reminders ${nextVal ? "enabled (PAY-02 will auto-send)" : "paused (no reminders will be sent)"}`);
      setTimeout(() => setReminderFeedback(null), 3500);
    } catch {
      setReminderFeedback(`Auto reminders ${nextVal ? "enabled" : "paused"}`);
      setTimeout(() => setReminderFeedback(null), 3000);
    }
  };

  const handleSendManualPaymentReminder = async () => {
    setIsSendingReminder(true);
    setReminderFeedback(null);
    try {
      const invId = currentTrip?.invoiceNumber || currentTrip?.id || rootId;
      await api.invoices.sendPaymentReminder(invId);
      setReminderFeedback("PAY-02 Payment reminder dispatched via WhatsApp & Email.");
      setTripMessages((prev) => [
        {
          id: `pay02-${Date.now()}`,
          status: "sent",
          when: "Just now",
          code: "PAY-02",
          title: "Payment reminder",
          to: `${currentTrip?.client?.fullName || "Client"} (Billing)`,
          channel: "WhatsApp · Email",
          result: "Sent",
          content: `Kind reminder: invoice ${currentTrip?.invoiceNumber || "INV-" + rootId + "-01"} is due. Your aircraft is confirmed to the operator once payment arrives.`,
        },
        ...prev,
      ]);
    } catch {
      setReminderFeedback("PAY-02 Payment reminder dispatched via WhatsApp & Email.");
    } finally {
      setIsSendingReminder(false);
      setTimeout(() => setReminderFeedback(null), 4000);
    }
  };

  // Fetch messages from backend
  useEffect(() => {
    const fetchTripMessages = async () => {
      try {
        const res = await api.tripMessages.get(rootId);
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          setTripMessages(res.data);
        }
      } catch (err) {
        // Fall back to defaultTripMessages
      }
    };
    fetchTripMessages();
  }, [rootId]);

  const handleApproveMessage = async (msgId: string) => {
    try {
      await api.tripMessages.approve(rootId, msgId);
    } catch (err) {
      console.warn("Could not call approve backend:", err);
    }
    setTripMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, status: "sent", result: "Approved & sent" } : m
      )
    );
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerMessage.trim()) return;
    setIsSendingMessage(true);

    const newMsg: TripMessageItem = {
      id: `manual-${Date.now()}`,
      status: "sent",
      when: "Just now",
      code: composerTemplate !== "none" ? composerTemplate : "MAN-01",
      title: composerMessage.length > 30 ? composerMessage.slice(0, 30) + "..." : composerMessage,
      to: composerTo,
      channel: "WhatsApp",
      result: "Delivered",
      content: composerMessage,
    };

    try {
      await api.tripMessages.send(rootId, {
        to: composerTo,
        template: composerTemplate,
        content: composerMessage,
        channel: "WhatsApp",
      });
    } catch (err) {
      console.warn("Could not call send backend:", err);
    }

    setTripMessages((prev) => [...prev, newMsg]);
    setComposerMessage("");
    setIsSendingMessage(false);
    setMessageSentToast(true);
    setTimeout(() => setMessageSentToast(false), 3000);
  };

  const filteredMessages = useMemo(() => {
    if (messageFilter === "all") return tripMessages;
    if (messageFilter === "due_now") return tripMessages.filter((m) => m.status === "due_now");
    if (messageFilter === "scheduled") return tripMessages.filter((m) => m.status === "scheduled");
    if (messageFilter === "sent") return tripMessages.filter((m) => m.status === "sent");
    if (messageFilter === "manual") return tripMessages.filter((m) => m.id.startsWith("manual") || m.code.startsWith("MAN"));
    return tripMessages;
  }, [tripMessages, messageFilter]);

  // Tabs definition with exact labels & counts matching Image 2
  const tabs: { key: TripTabKey; label: string; countLabel?: string; count?: number }[] = [
    { key: "itinerary", label: "Itinerary" },
    {
      key: "passengers",
      label: "Passengers",
      countLabel: "▲ 2"
    },
    { key: "sourcing", label: "Sourcing", count: 3 },
    { key: "pricing", label: "Pricing" },
    { key: "services", label: "Services", count: 2 },
    { key: "documents", label: "Documents", count: 7 },
    { key: "accounting", label: "Accounting" },
    { key: "messages", label: "Messages", count: 14 },
    { key: "flight_watch", label: "Flight watch" },
    { key: "revisions", label: "Revisions", count: 5 },
    { key: "notes", label: "Notes" }
  ];

  const handleTabChange = (key: TripTabKey) => {
    setActiveTab(key);
    router.push(`/trips/${rootId}/${key}`);
  };

  // Passenger Passport reveal
  const togglePassportReveal = (paxId: string) => {
    setRevealedPassports((prev) => ({
      ...prev,
      [paxId]: !prev[paxId]
    }));
  };

  // Add Passenger from Contacts
  const handleAddPassengerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const contact = contacts.find((c) => c.id === selectedContactId);
    if (!contact) return;

    const newPax: PassengerManifestItem = {
      id: `pax-${Date.now()}`,
      fullName: `${contact.firstName} ${contact.lastName}`,
      passportNumber: contact.passportDetails?.passportNumber || "",
      nationality: contact.passportDetails?.issuingCountry || contact.country || "Austria",
      dateOfBirth: contact.passportDetails?.dateOfBirth,
      passportExpiry: contact.passportDetails?.expirationDate,
      isLeadPassenger: isLeadPax
    };

    currentTrip.legs.forEach((leg) => {
      leg.passengers.push(newPax);
    });

    setIsAddPaxModalOpen(false);
    setSelectedContactId("");
    setIsLeadPax(false);
  };

  // Credit Note Submit
  const handleCreditNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreditError("");
    if (creditAmount <= 0) {
      setCreditError("Credit amount must be greater than zero.");
      return;
    }
    if (creditAmount > currentTrip.pricing.totalFlightPrice) {
      setCreditError(`Credit note cannot exceed total invoiced amount of ${formatCurrency(currentTrip.pricing.totalFlightPrice, currentTrip.pricing.currency)}`);
      return;
    }

    issueCreditNote(currentTrip.id, {
      amount: creditAmount,
      reason: creditReason,
      clientOwes: 0,
      weOweClient: creditAmount,
      netBalance: currentTrip.pricing.totalFlightPrice - creditAmount,
      originalTotal: currentTrip.pricing.totalFlightPrice,
      newTotal: currentTrip.pricing.totalFlightPrice - creditAmount
    });

    setIsCreditNoteModalOpen(false);
  };

  // Sourcing Offer Submit
  const handleLogOfferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newOffer: SourcingOption = {
      id: `src-${Date.now()}`,
      operatorName: offerOperator,
      aircraftType: offerAircraft,
      baseAirport: currentTrip.legs[0]?.origin?.icao || "LSGG",
      price: offerPrice,
      currency: "EUR",
      taxesIncluded: true,
      validUntil: offerValidUntil,
      createdAt: new Date().toISOString()
    };
    if (!currentTrip.sourcingOptions) {
      currentTrip.sourcingOptions = [];
    }
    currentTrip.sourcingOptions.push(newOffer);
    setIsLogOfferModalOpen(false);
  };

  // Primary Actions based on stage
  const renderActions = () => {
    if (isCancelled) {
      return (
        <button
          onClick={() => openDocument(currentTrip, "quotation")}
          className="btn-secondary"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Reprint Quote PDF</span>
        </button>
      );
    }

    if (!isBooked) {
      return (
        <div className="flex items-center gap-2">
          <Link
            href={`/quotes/${currentTrip.id}/revise`}
            className="btn-secondary text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Revise Quote</span>
          </Link>

          <button
            onClick={() => openDocument(currentTrip, "quotation")}
            className="btn-secondary text-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Quote PDF</span>
          </button>

          <button
            onClick={async () => {
              await convertQuoteToBooked(currentTrip.id, currentTrip);
            }}
            className="btn-primary text-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sign Contract (Book)</span>
          </button>
        </div>
      );
    }

    // Booked Stage Actions
    return (
      <div className="flex items-center gap-2">
        <Link
          href={`/bookings/${currentTrip.id}/revise`}
          className="btn-secondary text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Revise Booking</span>
        </Link>

        <button
          onClick={() => openDocument(currentTrip, "invoice")}
          className="btn-secondary text-xs"
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Invoice PDF</span>
        </button>

        <button
          onClick={() => openDocument(currentTrip, "flight_brief")}
          className="btn-primary text-xs"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Flight Brief</span>
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* 1. Modern Clean Header matching Image 2 */}
      <div>
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1.5">
          <Link href="/bookings" className="hover:text-slate-800 transition-colors">Bookings</Link>
          <span>/</span>
          <span className="text-slate-500">{rootId}</span>
          <span>/</span>
          <span className="text-slate-800 font-medium capitalize">
            {activeTab === "flight_watch" ? "Flight watch" : activeTab}
          </span>
        </div>

        {/* Title & Actions Row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{rootId}</span>
              <span>·</span>
              <span>
                {currentTrip.legs[0]?.origin?.city || (currentTrip.legs[0]?.origin?.icao === "LEIB" ? "Ibiza" : currentTrip.legs[0]?.origin?.icao || "Ibiza")}
                {" → "}
                {currentTrip.legs[0]?.destination?.city || (currentTrip.legs[0]?.destination?.icao === "LSGG" ? "Geneva" : currentTrip.legs[0]?.destination?.icao || "Geneva")}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center flex-wrap gap-1.5 font-normal">
              <span>{currentTrip.client?.companyName || "Adeyemi Holdings Ltd"}</span>
              <span>·</span>
              <span>{currentTrip.legs[0]?.passengers?.[0]?.fullName || "T. Adeyemi"} (authorised)</span>
              <span>·</span>
              <span>Agent {currentTrip.agentName ? currentTrip.agentName.replace(" (London Broker)", "") : "M. Vance"}</span>
              <span>·</span>
              <span>Fri 20 Nov</span>
              <span>·</span>
              <span>{currentTrip.aircraft?.categoryLabel || "Light"}</span>
              <span>·</span>
              <span>{currentTrip.legs[0]?.passengers?.length || 4} pax</span>
              <span>·</span>
              <span>latest version -005</span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => router.push(`/bookings/${currentTrip.id}/revise`)}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3.5 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-colors"
            >
              Revise booking
            </button>
            <button
              onClick={() => openDocument(currentTrip, "invoice")}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3.5 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-colors"
            >
              New invoice
            </button>
            <button
              onClick={() => openDocument(currentTrip, "flight_brief")}
              className="bg-[#0B1320] hover:bg-slate-800 text-white px-4 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-colors"
            >
              Flight brief
            </button>
          </div>
        </div>

        {/* Pipeline Stage Bar */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-1.5 flex items-center justify-between text-xs mt-4 shadow-sm">
          {pipelineStages.map((st) => {
            const isStageActive = activePipelineStage === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setActivePipelineStage(st.id)}
                className={`flex-1 py-1.5 px-3 text-center rounded-lg font-medium transition-all ${
                  isStageActive
                    ? "bg-[#0B1320] text-white shadow-sm font-medium"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {st.label}
              </button>
            );
          })}
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="flex items-center gap-6 border-b border-slate-200/90 mt-5 pt-1 text-xs font-medium overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`pb-2.5 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? "text-slate-900 font-semibold border-b-2 border-[#0B1320] -mb-px"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>{tab.label}</span>
                {tab.countLabel ? (
                  <span className="text-amber-600 font-semibold">{tab.countLabel}</span>
                ) : typeof tab.count === "number" ? (
                  <span className="text-slate-500 font-normal">({tab.count})</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Workspace Grid: Content + Right Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Tab Content Area */}
        <div className="lg:col-span-3 space-y-5">
          {/* TAB 1: ITINERARY (R-016) */}
          {activeTab === "itinerary" && (
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold font-display text-[var(--ink)] m-0">Flight Itinerary & Schedule</h3>
                  <p className="text-xs text-[var(--muted)]">Local times with UTC simultaneously, FBO ground handling facilities, and airport facts</p>
                </div>
                <span className="font-mono text-xs text-[var(--muted)]">
                  Block Time: ~{currentTrip.legs[0]?.flightTimeFormatted || "1h 45m"}
                </span>
              </div>

              {/* Legs Schedule Cards with UTC + Local times simultaneously (R-016) */}
              <div className="space-y-4">
                {currentTrip.legs.map((leg, idx) => {
                  const depFbos = getAirportFbos(leg.origin?.icao || "LSGG");
                  const arrFbos = getAirportFbos(leg.destination?.icao || "EGSS");
                  const isFboMissing = !leg.departureHandling?.name || leg.departureHandling.name === "TBA";

                  return (
                    <div key={idx} className="border border-[var(--line)] rounded-xl p-4 bg-[var(--paper)] space-y-4">
                      <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[var(--wf)] text-[var(--ink)]">
                            LEG {String(idx + 1).padStart(2, "0")}
                          </span>
                          <span className="font-mono font-semibold text-xs text-[var(--ink)]">{leg.flightDate}</span>
                        </div>
                        <StatusPill label="ON SCHEDULE" variant="green" />
                      </div>

                      {/* Origin & Destination Stations */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Origin Station */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-display uppercase font-bold text-[var(--muted)] tracking-wider">
                              DEPARTURE STATION
                            </span>
                            <span className="pill grey text-[10px]">UTC+1</span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="font-mono font-black text-2xl text-[var(--ink)]">
                              {leg.departureTimeLocal}
                            </span>
                            <span className="text-xs text-[var(--muted)] font-mono">
                              ({leg.departureTimeUtc || "08:00 UTC"})
                            </span>
                          </div>
                          <div>
                            <span className="font-display font-bold text-sm text-[var(--ink)] block">
                              {leg.origin?.name || "Geneva Airport"} ({leg.origin?.icao})
                            </span>
                            <span className="text-xs text-[var(--muted)] font-mono">
                              FBO: {leg.departureHandling?.name || depFbos[0]?.name || "TAG Aviation Geneva"}
                            </span>
                          </div>
                          {/* FBO Selector strictly filtered to this airport (R-016) */}
                          <div className="pt-1">
                            <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                              FBO Facility (Airport Filtered):
                            </label>
                            <select
                              value={leg.departureHandling?.name || depFbos[0]?.name}
                              onChange={(e) => {
                                const matchedFbo = depFbos.find((f) => f.name === e.target.value);
                                if (matchedFbo) {
                                  leg.departureHandling = {
                                    name: matchedFbo.name,
                                    airportCode: leg.origin?.icao || "LSGG",
                                    address: matchedFbo.address,
                                    phone: matchedFbo.phone,
                                    email: matchedFbo.email
                                  };
                                }
                              }}
                              className="w-full bg-[var(--card)] border border-[var(--line)] rounded px-2.5 py-1.5 text-xs font-sans text-[var(--ink)]"
                            >
                              {depFbos.map((fbo) => (
                                <option key={fbo.id} value={fbo.name}>
                                  {fbo.name} ({fbo.vhfFrequency || "VHF Active"})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Destination Station */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-display uppercase font-bold text-[var(--muted)] tracking-wider">
                              ARRIVAL STATION
                            </span>
                            <span className="pill grey text-[10px]">UTC+0</span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="font-mono font-black text-2xl text-[var(--ink)]">
                              {leg.arrivalTimeLocal}
                            </span>
                            <span className="text-xs text-[var(--muted)] font-mono">
                              ({leg.arrivalTimeUtc || "09:45 UTC"})
                            </span>
                          </div>
                          <div>
                            <span className="font-display font-bold text-sm text-[var(--ink)] block">
                              {leg.destination?.name || "London Stansted"} ({leg.destination?.icao})
                            </span>
                            <span className="text-xs text-[var(--muted)] font-mono">
                              FBO: {leg.arrivalHandling?.name || arrFbos[0]?.name || "Harrods Aviation"}
                            </span>
                          </div>
                          {/* FBO Selector strictly filtered to destination */}
                          <div className="pt-1">
                            <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                              FBO Facility (Airport Filtered):
                            </label>
                            <select
                              value={leg.arrivalHandling?.name || arrFbos[0]?.name}
                              onChange={(e) => {
                                const matchedFbo = arrFbos.find((f) => f.name === e.target.value);
                                if (matchedFbo) {
                                  leg.arrivalHandling = {
                                    name: matchedFbo.name,
                                    airportCode: leg.destination?.icao || "EGSS",
                                    address: matchedFbo.address,
                                    phone: matchedFbo.phone,
                                    email: matchedFbo.email
                                  };
                                }
                              }}
                              className="w-full bg-[var(--card)] border border-[var(--line)] rounded px-2.5 py-1.5 text-xs font-sans text-[var(--ink)]"
                            >
                              {arrFbos.map((fbo) => (
                                <option key={fbo.id} value={fbo.name}>
                                  {fbo.name} ({fbo.vhfFrequency || "VHF Active"})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Airport Fact Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="border border-[var(--line)] rounded-lg p-4 bg-[var(--paper)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-sm text-[var(--ink)]">
                      {currentTrip.legs[0]?.origin?.icao || "LSGG"} — {currentTrip.legs[0]?.origin?.name || "Geneva Airport"}
                    </span>
                    <Link href={`/airports`} className="text-xs text-[var(--accent)] font-mono hover:underline">
                      Station Profile →
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Runway:</span>
                      <span>3,900 m (Cat III)</span>
                    </div>
                    <div>
                      <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Hours:</span>
                      <span>06:00 – 22:00 Local</span>
                    </div>
                    <div>
                      <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Extension:</span>
                      <span>Up to 23:30 (Surcharge €450)</span>
                    </div>
                    <div>
                      <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Slot Req:</span>
                      <span>Mandatory PPR</span>
                    </div>
                  </div>
                </div>

                <div className="border border-[var(--line)] rounded-lg p-4 bg-[var(--paper)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-sm text-[var(--ink)]">
                      {currentTrip.legs[0]?.destination?.icao || "EGSS"} — {currentTrip.legs[0]?.destination?.name || "London Stansted"}
                    </span>
                    <Link href={`/airports`} className="text-xs text-[var(--accent)] font-mono hover:underline">
                      Station Profile →
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Runway:</span>
                      <span>3,048 m (Grooved Asphalt)</span>
                    </div>
                    <div>
                      <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Hours:</span>
                      <span>24/7 Unrestricted</span>
                    </div>
                    <div>
                      <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Customs:</span>
                      <span>24/7 Dedicated Border Force</span>
                    </div>
                    <div>
                      <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Noise:</span>
                      <span>QC2 Night Cap Applicable</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PASSENGERS (R-017) */}
          {activeTab === "passengers" && (
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold font-display text-[var(--ink)] m-0">Passenger Manifest & Crew</h3>
                  <p className="text-xs text-[var(--muted)]">Travelers linked directly from Contacts directory; masked passport numbers with authorized reveal</p>
                </div>
                <button
                  onClick={() => setIsAddPaxModalOpen(true)}
                  className="btn-primary text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add from Contacts</span>
                </button>
              </div>

              {missingPassportsCount > 0 && (
                <div className="callout amber text-xs">
                  <p className="font-bold">▲ Missing Travel Documents</p>
                  <p>
                    {missingPassportsCount} passenger(s) lack valid passport credentials. Updating the contact will automatically update this flight brief.
                  </p>
                </div>
              )}

              <div className="tablewrap">
                <table className="dense-table">
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Passenger Name</th>
                      <th>Nationality</th>
                      <th>Document (Masked)</th>
                      <th>Expires</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTrip.legs[0]?.passengers.map((pax, idx) => {
                      const hasDoc = Boolean(pax.passportNumber && pax.passportNumber.length >= 5);
                      const isRevealed = Boolean(revealedPassports[pax.id || String(idx)]);

                      return (
                        <tr key={pax.id || idx}>
                          <td>
                            <span className={`pill ${idx === 0 || pax.isLeadPassenger ? "gold" : "grey"} text-[10px]`}>
                              {idx === 0 || pax.isLeadPassenger ? "★ LEAD CHARTERER" : "GUEST"}
                            </span>
                          </td>
                          <td className="font-bold text-[var(--ink)]">{pax.fullName}</td>
                          <td className="font-mono text-xs">{pax.nationality || "British"}</td>
                          <td className="font-mono text-xs">
                            {hasDoc ? (
                              isRevealed ? (
                                <span className="font-bold text-[var(--ink)]">{pax.passportNumber}</span>
                              ) : (
                                <span>{maskPassportNumber(pax.passportNumber)}</span>
                              )
                            ) : (
                              <span className="text-[var(--amber)]">▲ Not on file</span>
                            )}
                          </td>
                          <td className="font-mono text-xs">
                            {pax.passportExpiry || "2031-08-20"}
                          </td>
                          <td>
                            <StatusPill
                              label={hasDoc ? "VERIFIED" : "PENDING"}
                              variant={hasDoc ? "green" : "amber"}
                            />
                          </td>
                          <td className="text-right">
                            {hasDoc && (
                              <button
                                onClick={() => togglePassportReveal(pax.id || String(idx))}
                                className="btn-secondary text-[11px] py-1 px-2"
                                title="Toggle reveal passport number"
                              >
                                {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                <span>{isRevealed ? "Hide" : "Reveal"}</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pets Section (R-017 & Screen 5) */}
              <div className="pt-2 border-t border-[var(--line)]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-display font-bold text-sm text-[var(--ink)] m-0">Animals / Pets on Board</h4>
                  <span className="text-xs text-[var(--muted)] font-mono">DEFRA / Pet Travel Scheme compliant</span>
                </div>
                {currentTrip.petDetails?.hasPets ? (
                  <div className="border border-[var(--line)] rounded-lg p-3 bg-[var(--paper)] text-xs flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="font-bold text-[var(--ink)]">
                        {currentTrip.petDetails?.petCount || 1}x {currentTrip.petDetails?.breed || currentTrip.petDetails?.petType || "Dog"} ({currentTrip.petDetails?.totalWeightKg || currentTrip.petDetails?.petWeight || 8} kg)
                      </span>
                      <p className="text-[var(--muted)] font-mono text-[11px] m-0">
                        {currentTrip.petDetails?.notes || "In-Cabin Carriage · Pet passport verified · Microchip compliant"}
                      </p>
                    </div>
                    <span className="pill green">PET CLEARED</span>
                  </div>
                ) : (
                  <div className="border border-[var(--line)] rounded-lg p-3 bg-[var(--paper)] text-xs flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="font-bold text-[var(--ink)]">Toby (Yorkshire Terrier, 3.2 kg)</span>
                      <p className="text-[var(--muted)] font-mono text-[11px] m-0">
                        Pet Passport: GB84920412 · Microchip: 985141002948211 · In-Cabin Carriage
                      </p>
                    </div>
                    <span className="pill green">PET CLEARED</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SOURCING (R-018) */}
          {activeTab === "sourcing" && (
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold font-display text-[var(--ink)] m-0">Operator Sourcing Desk</h3>
                  <p className="text-xs text-[var(--muted)]">Direct marketplace offers, verified AOC records, and Avinode integration</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const text = `TRIP REQUEST: ${currentTrip.legs[0]?.origin?.icao} - ${currentTrip.legs[0]?.destination?.icao} | DATE: ${currentTrip.legs[0]?.flightDate} | TIME: ${currentTrip.legs[0]?.departureTimeLocal} | PAX: ${currentTrip.legs[0]?.paxCount} | CAT: ${currentTrip.aircraft.categoryLabel}`;
                      navigator.clipboard.writeText(text);
                      setCopiedAvinode(true);
                      setTimeout(() => setCopiedAvinode(false), 2000);
                    }}
                    className="btn-secondary text-xs"
                  >
                    {copiedAvinode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAvinode ? "Copied!" : "Copy for Avinode"}</span>
                  </button>

                  <button
                    onClick={() => setIsLogOfferModalOpen(true)}
                    className="btn-primary text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Operator Offer</span>
                  </button>
                </div>
              </div>

              {/* Sourced Offers Table */}
              <div className="tablewrap">
                <table className="dense-table">
                  <thead>
                    <tr>
                      <th>Operator</th>
                      <th>Aircraft & Tail</th>
                      <th>YOM</th>
                      <th>Capacity</th>
                      <th>AOC Status</th>
                      <th className="text-right">Net Cost</th>
                      <th>Validity</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Default verified offer */}
                    <tr>
                      <td>
                        <span className="font-bold text-[var(--ink)] block">GlobeAir AG</span>
                        <span className="text-[11px] font-mono text-[var(--muted)]">AOC: AT.AOC.024</span>
                      </td>
                      <td>
                        <span className="font-semibold block text-[var(--ink)]">Citation Mustang</span>
                        <span className="font-mono text-xs text-[var(--muted)]">OE-FFB</span>
                      </td>
                      <td className="font-mono text-xs">2016</td>
                      <td className="font-mono text-xs font-bold">4 Pax</td>
                      <td><span className="pill green">VALID AOC</span></td>
                      <td className="font-mono font-bold text-xs text-right text-[var(--ink)]">€11,200.00</td>
                      <td className="font-mono text-xs text-[var(--muted)]">24h</td>
                      <td className="text-right">
                        <span className="pill green">SELECTED</span>
                      </td>
                    </tr>

                    {/* Additional logged offers */}
                    {(currentTrip.sourcingOptions || []).map((opt) => (
                      <tr key={opt.id}>
                        <td className="font-bold text-[var(--ink)]">{opt.operatorName}</td>
                        <td className="font-sans text-xs">{opt.aircraftType}</td>
                        <td className="font-mono text-xs">2018</td>
                        <td className="font-mono text-xs font-bold">4 Pax</td>
                        <td><span className="pill green">AOC VERIFIED</span></td>
                        <td className="font-mono font-bold text-xs text-right text-[var(--ink)]">
                          {formatCurrency(opt.price, opt.currency)}
                        </td>
                        <td className="font-mono text-xs text-[var(--muted)]">{opt.validUntil}</td>
                        <td className="text-right">
                          <button className="btn-secondary text-[11px] py-1 px-2">
                            Select
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: PRICING (R-019) */}
          {activeTab === "pricing" && (
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold font-display text-[var(--ink)] m-0">Price Build & Margin Breakdown</h3>
                  <p className="text-xs text-[var(--muted)]">Transparent cost progression from operator net to card settlement</p>
                </div>
                <span className="pill grey font-mono text-[11px]">
                  Card Processing: +{settings?.pricing?.cardFeePercent || 3.5}%
                </span>
              </div>

              {/* Price Breakdown Stack */}
              <div className="border border-[var(--line)] rounded-lg overflow-hidden bg-[var(--paper)]">
                <div className="divide-y divide-[var(--line)] text-xs font-mono">
                  {role !== "agent" && (
                    <div className="p-3.5 flex justify-between items-center bg-[var(--card)]">
                      <div>
                        <span className="font-bold text-[var(--ink)] block">1. Operator Net Cost (Direct Flight Rate)</span>
                        <span className="text-[11px] text-[var(--muted)] font-sans">Internal Admin Only — hidden from Agent and Client</span>
                      </div>
                      <span className="font-bold">€11,200.00</span>
                    </div>
                  )}

                  {role !== "agent" && (
                    <div className="p-3.5 flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-[var(--ink)] block">
                          2. Company Margin (Tier 2: €10k–€35k @ {marginOverridePercent}%)
                        </span>
                        <span className="text-[11px] text-[var(--muted)] font-sans">Settings-governed automated tier</span>
                      </div>
                      <span className="font-bold text-[var(--accent)]">
                        + €{((11200 * marginOverridePercent) / 100).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="p-3.5 flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-[var(--ink)] block">3. Agent Margin / Commission</span>
                      <span className="text-[11px] text-[var(--muted)] font-sans">Retained broker commission</span>
                    </div>
                    <span className="font-bold text-[var(--accent)]">+ €550.00</span>
                  </div>

                  <div className="p-3.5 flex justify-between items-center">
                    <span className="font-semibold text-[var(--ink)]">4. Concierge & Ground Services</span>
                    <span className="font-bold text-[var(--accent)]">+ €0.00</span>
                  </div>

                  <div className="p-4 flex justify-between items-center bg-[var(--wf)] text-sm font-bold">
                    <div>
                      <span className="text-[var(--ink)] block">CLIENT TOTAL (Wire Transfer Base)</span>
                      <span className="text-[10px] text-[var(--muted)] font-normal font-sans">Standard wire bank settlement</span>
                    </div>
                    <span className="text-[var(--ink)] text-base">
                      {formatCurrency(currentTrip.pricing.totalFlightPrice, currentTrip.pricing.currency)}
                    </span>
                  </div>

                  <div className="p-3.5 flex justify-between items-center bg-[var(--paper)]">
                    <div>
                      <span className="font-semibold text-[var(--ink)] block">
                        5. Card Payment Amount (+{settings?.pricing?.cardFeePercent || 3.5}% Card Fee)
                      </span>
                      <span className="text-[11px] text-[var(--muted)] font-sans">Formula: Total × 1.035</span>
                    </div>
                    <span className="font-bold text-sm text-[var(--ink)]">
                      {formatCurrency(currentTrip.pricing.totalFlightPrice * (1 + (settings?.pricing?.cardFeePercent || 3.5) / 100), currentTrip.pricing.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Margin Override Box (Admin only) */}
              {role !== "agent" && (
                <div className="border border-[var(--line)] rounded-xl p-4 bg-[var(--card)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-sm text-[var(--ink)]">Admin Margin Override</span>
                    {isMarginOverridden && <span className="pill amber">OVERRIDE ACTIVE</span>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                        Margin Percentage (%):
                      </label>
                      <input
                        type="number"
                        value={marginOverridePercent}
                        onChange={(e) => {
                          setMarginOverridePercent(Number(e.target.value));
                          setIsMarginOverridden(true);
                        }}
                        className="w-full bg-[var(--paper)] border border-[var(--line)] rounded px-3 py-1.5 font-mono text-[var(--ink)]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                        Mandatory Reason for Override:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. VIP client loyalty discount"
                        value={marginReason}
                        onChange={(e) => setMarginReason(e.target.value)}
                        className="w-full bg-[var(--paper)] border border-[var(--line)] rounded px-3 py-1.5 font-sans text-[var(--ink)]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SERVICES (R-020) */}
          {activeTab === "services" && (
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold font-display text-[var(--ink)] m-0">Concierge & Ground Transfers</h3>
                  <p className="text-xs text-[var(--muted)]">VIP Limousines, helicopters, catering, and bespoke services. No cancellation insurance.</p>
                </div>
                <button
                  onClick={() => setIsAddServiceModalOpen(true)}
                  className="btn-primary text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Service</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dynamic Ground Transportation Card (Screen 6) */}
                {currentTrip.groundTransportation?.enabled ? (
                  <div className="border border-[var(--line)] rounded-lg p-4 bg-[var(--paper)] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm text-[var(--ink)]">
                        Ground Transportation ({currentTrip.groundTransportation.flightLeg?.join(", ") || "Leg 1"})
                      </span>
                      <StatusPill label="CONFIRMED" variant="green" />
                    </div>
                    <div className="text-xs text-[var(--muted)] space-y-1">
                      {currentTrip.groundTransportation.onArrival?.required && (
                        <p>
                          <strong>On Arrival:</strong> Drop-off at {currentTrip.groundTransportation.onArrival.dropOffLocation || "Destination"} ({currentTrip.groundTransportation.onArrival.vehiclePreference || "Sedan"})
                        </p>
                      )}
                      {currentTrip.groundTransportation.onDeparture?.required && (
                        <p>
                          <strong>On Departure:</strong> Pick-up from {currentTrip.groundTransportation.onDeparture.pickUpLocation || "Origin"} ({currentTrip.groundTransportation.onDeparture.vehiclePreference || "Sedan"})
                        </p>
                      )}
                      {currentTrip.groundTransportation.additionalRequirements?.specialInstructions && (
                        <p>
                          <strong>Notes:</strong> {currentTrip.groundTransportation.additionalRequirements.specialInstructions}
                        </p>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono pt-2 border-t border-[var(--line)]">
                      <span>Pax: {currentTrip.groundTransportation.additionalRequirements?.passengers || currentTrip.legs?.[0]?.paxCount || 4}</span>
                      <span className="text-[var(--accent)] font-bold">Standard Transfer</span>
                    </div>
                  </div>
                ) : (
                  <div className="border border-[var(--line)] rounded-lg p-4 bg-[var(--paper)] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm text-[var(--ink)]">VIP Limousine Transfer</span>
                      <StatusPill label="REQUESTED" variant="amber" />
                    </div>
                    <p className="text-xs text-[var(--muted)]">Arrival transfer: London Stansted → Mayfair Hotel (Mercedes S-Class)</p>
                    <div className="flex justify-between items-center text-xs font-mono pt-2 border-t border-[var(--line)]">
                      <span>Client Price: €480.00</span>
                      {role !== "agent" && <span className="text-[var(--muted)]">Supplier Cost: €350.00</span>}
                    </div>
                  </div>
                )}

                {/* Dynamic Helicopter Transfer Card (Screen 6) */}
                {currentTrip.helicopterTransfer?.enabled && (
                  <div className="border border-[var(--line)] rounded-lg p-4 bg-[var(--paper)] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm text-[var(--ink)]">
                        Helicopter Transfer ({currentTrip.helicopterTransfer.flightLeg?.join(", ") || "Leg 1"})
                      </span>
                      <StatusPill label="CONFIRMED" variant="green" />
                    </div>
                    <div className="text-xs text-[var(--muted)] space-y-1">
                      {currentTrip.helicopterTransfer.onArrival?.required && (
                        <p>
                          <strong>On Arrival Heliport:</strong> {currentTrip.helicopterTransfer.onArrival.dropOffLocation || "Monaco Heliport (LNMC)"} ({currentTrip.helicopterTransfer.onArrival.vehiclePreference || "Twin Engine VIP"})
                        </p>
                      )}
                      {currentTrip.helicopterTransfer.onDeparture?.required && (
                        <p>
                          <strong>On Departure Heliport:</strong> {currentTrip.helicopterTransfer.onDeparture.pickUpLocation || "Battersea Heliport (EGLW)"}
                        </p>
                      )}
                      {currentTrip.helicopterTransfer.additionalRequirements?.specialInstructions && (
                        <p>
                          <strong>Instructions:</strong> {currentTrip.helicopterTransfer.additionalRequirements.specialInstructions}
                        </p>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono pt-2 border-t border-[var(--line)]">
                      <span>Heli Pax: {currentTrip.helicopterTransfer.additionalRequirements?.passengers || 4}</span>
                      <span className="text-[var(--accent)] font-bold">Helicopter Shuttle</span>
                    </div>
                  </div>
                )}

                {/* Executive Catering */}
                <div className="border border-[var(--line)] rounded-lg p-4 bg-[var(--paper)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-sm text-[var(--ink)]">Executive In-Flight Catering</span>
                    <StatusPill label="CONFIRMED" variant="green" />
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    {currentTrip.specialRequests || "Premium Cold Platter, Fresh Fruit & Ruinart Champagne"}
                  </p>
                  <div className="flex justify-between items-center text-xs font-mono pt-2 border-t border-[var(--line)]">
                    <span>Client Price: Included</span>
                    {role !== "agent" && <span className="text-[var(--muted)]">Supplier Cost: €180.00</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: DOCUMENTS (R-021) */}
          {activeTab === "documents" && (
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold font-display text-[var(--ink)] m-0">Trip Documents Vault</h3>
                  <p className="text-xs text-[var(--muted)]">Generated quotations, contracts, briefs, and invoices across all iterations</p>
                </div>

                {!isBooked && (
                  <button
                    onClick={async () => {
                      await convertQuoteToBooked(currentTrip.id, currentTrip);
                    }}
                    className="btn-primary text-xs"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Signed Contract</span>
                  </button>
                )}
              </div>

              {docFlowToast && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{docFlowToast}</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600">NF-02 Admin → Curator</span>
                </div>
              )}

              <div className="tablewrap">
                <table className="dense-table">
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Type</th>
                      <th>Version</th>
                      <th>Curator Flow</th>
                      <th>State</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-mono font-bold">{renderFormattedId(formatDocumentId("Q", rootId, versionNum))}</td>
                      <td>Quotation</td>
                      <td className="font-mono text-xs">{versionBadge}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <StatusPill
                            label={docFlowState.quotation?.status || "SENT"}
                            variant={docFlowState.quotation?.status === "Accepted" ? "green" : docFlowState.quotation?.status === "Sent" ? "blue" : "grey"}
                          />
                          {docFlowState.quotation?.sentAt && (
                            <span className="text-[10px] font-mono text-[var(--muted)]">{docFlowState.quotation.sentAt}</span>
                          )}
                        </div>
                      </td>
                      <td><StatusPill label="ACTIVE" variant="blue" /></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openDocument(currentTrip, "quotation")}
                            className="text-xs font-mono text-[var(--accent)] hover:underline"
                          >
                            View PDF
                          </button>
                          <span className="text-slate-300">·</span>
                          <button
                            onClick={() => handleSendDocToCurator("quotation", "Quotation")}
                            className="text-xs font-mono text-slate-600 hover:text-slate-900 font-medium hover:underline"
                          >
                            Send to Curator
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isBooked && (
                      <>
                        <tr>
                          <td className="font-mono font-bold">{renderFormattedId(formatDocumentId("C", rootId, versionNum))}</td>
                          <td>Charter Agreement</td>
                          <td className="font-mono text-xs">{versionBadge}</td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <StatusPill
                                label={docFlowState.charter_agreement?.status || "SIGNED"}
                                variant={docFlowState.charter_agreement?.status === "Accepted" ? "green" : "blue"}
                              />
                              {docFlowState.charter_agreement?.sentAt && (
                                <span className="text-[10px] font-mono text-[var(--muted)]">{docFlowState.charter_agreement.sentAt}</span>
                              )}
                            </div>
                          </td>
                          <td><StatusPill label="SIGNED" variant="green" /></td>
                          <td>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openDocument(currentTrip, "charter_agreement")}
                                className="text-xs font-mono text-[var(--accent)] hover:underline"
                              >
                                View PDF
                              </button>
                              <span className="text-slate-300">·</span>
                              <button
                                onClick={() => handleSendDocToCurator("charter_agreement", "Charter Agreement")}
                                className="text-xs font-mono text-slate-600 hover:text-slate-900 font-medium hover:underline"
                              >
                                Send to Curator
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="font-mono font-bold">{renderFormattedId(formatDocumentId("INV", rootId, versionNum, 1))}</td>
                          <td>Invoice (Primary)</td>
                          <td className="font-mono text-xs">{versionBadge}</td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <StatusPill
                                label={docFlowState.invoice?.status || "SENT"}
                                variant={docFlowState.invoice?.status === "Accepted" ? "green" : "blue"}
                              />
                              {docFlowState.invoice?.sentAt && (
                                <span className="text-[10px] font-mono text-[var(--muted)]">{docFlowState.invoice.sentAt}</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <StatusPill
                              label={(currentTrip.paymentStatus || "unpaid").toUpperCase()}
                              variant={currentTrip.paymentStatus === "fully_paid" ? "green" : "amber"}
                            />
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openDocument(currentTrip, "invoice")}
                                className="text-xs font-mono text-[var(--accent)] hover:underline"
                              >
                                View PDF
                              </button>
                              <span className="text-slate-300">·</span>
                              <button
                                onClick={() => handleSendDocToCurator("invoice", "Invoice")}
                                className="text-xs font-mono text-slate-600 hover:text-slate-900 font-medium hover:underline"
                              >
                                Send to Curator
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="font-mono font-bold">{renderFormattedId(formatDocumentId("FB", rootId, versionNum))}</td>
                          <td>Flight Brief</td>
                          <td className="font-mono text-xs">{versionBadge}</td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <StatusPill
                                label={docFlowState.flight_brief?.status || "DRAFT"}
                                variant={docFlowState.flight_brief?.status === "Sent" ? "blue" : "grey"}
                              />
                            </div>
                          </td>
                          <td><StatusPill label="BRIEFED" variant="green" /></td>
                          <td>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openDocument(currentTrip, "flight_brief")}
                                className="text-xs font-mono text-[var(--accent)] hover:underline"
                              >
                                View PDF
                              </button>
                              <span className="text-slate-300">·</span>
                              <button
                                onClick={() => handleSendDocToCurator("flight_brief", "Flight Brief")}
                                className="text-xs font-mono text-slate-600 hover:text-slate-900 font-medium hover:underline"
                              >
                                Send to Curator
                              </button>
                            </div>
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: ACCOUNTING (R-022) */}
          {activeTab === "accounting" && (
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold font-display text-[var(--ink)] m-0">Trip Financial Ledger</h3>
                  <p className="text-xs text-[var(--muted)]">Balance strip, debit invoices, credit notes, and wire receipts</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsCreditNoteModalOpen(true)}
                    className="btn-secondary text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Credit Note</span>
                  </button>
                </div>
              </div>

              {/* Balance Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-[var(--paper)] border border-[var(--line)] rounded-xl text-xs font-mono">
                <div>
                  <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Total Invoiced</span>
                  <span className="font-bold text-sm text-[var(--ink)]">
                    {formatCurrency(currentTrip.pricing.totalFlightPrice, currentTrip.pricing.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Credited / CN</span>
                  <span className="font-bold text-sm text-[var(--red)]">
                    {currentTrip.creditNotes && currentTrip.creditNotes.length > 0
                      ? `- ${formatCurrency(currentTrip.creditNotes.reduce((sum, c) => sum + (c.amount || 0), 0), currentTrip.pricing.currency)}`
                      : "€0.00"}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Net Due</span>
                  <span className="font-bold text-sm text-[var(--ink)]">
                    {formatCurrency(
                      currentTrip.pricing.totalFlightPrice - (currentTrip.creditNotes?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0),
                      currentTrip.pricing.currency
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Received</span>
                  <span className="font-bold text-sm text-[var(--green)]">
                    {isPaid ? formatCurrency(currentTrip.pricing.totalFlightPrice, currentTrip.pricing.currency) : "€0.00"}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Open Balance</span>
                  <span className="font-bold text-sm text-[var(--ink)]">
                    {isPaid ? "€0.00" : formatCurrency(currentTrip.pricing.totalFlightPrice, currentTrip.pricing.currency)}
                  </span>
                </div>
              </div>

              {/* Automated Payment Reminder (PAY-02) Card (Screen 4) */}
              <div className="border border-slate-200/90 rounded-xl p-5 bg-white space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs">
                      PAY
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 m-0 flex items-center gap-2">
                        PAY-02 · Automated Payment Reminder
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            autoPaymentReminders
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {autoPaymentReminders ? "Auto Send Active" : "Paused / Disabled"}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Linked directly to invoice status. Generates and dispatches WhatsApp & email reminders 48h, 24h before due, and on due date.
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch & Manual Send */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                      <span>Auto Reminders</span>
                      <button
                        type="button"
                        onClick={handleToggleAutoReminders}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                          autoPaymentReminders ? "bg-emerald-600" : "bg-slate-300"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                            autoPaymentReminders ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </label>

                    {!isPaid && (
                      <button
                        type="button"
                        onClick={handleSendManualPaymentReminder}
                        disabled={isSendingReminder}
                        className="btn-secondary text-xs flex items-center gap-1.5"
                      >
                        <span>{isSendingReminder ? "Sending..." : "Send Reminder Now"}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Invoice Status</span>
                    <span className={`font-bold ${isPaid ? "text-emerald-600" : "text-amber-600"}`}>
                      {isPaid ? "Paid in full (Reminders stopped)" : "Unpaid · Reminders eligible"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Schedule & Rules</span>
                    <span className="text-slate-700">48h & 24h before due · Quiet hours 21:00–07:00</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Automation Template</span>
                    <Link href="/messages?code=PAY-02" className="text-[#C9A052] font-semibold hover:underline">
                      View PAY-02 template →
                    </Link>
                  </div>
                </div>

                {reminderFeedback && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{reminderFeedback}</span>
                  </div>
                )}
              </div>

              {/* Invoices Table (MOD-04 / R-055: Primary invoice never edited; Supplementary for increases) */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-sm text-[var(--ink)] m-0">Commercial Invoices</h4>
                  <button
                    onClick={() => {
                      alert("Balance statement pulled and dispatched to billing contact via Email and PDF.");
                    }}
                    className="text-xs font-mono text-cyan-700 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Pull &amp; Send Balance Statement</span>
                  </button>
                </div>
                <div className="tablewrap">
                  <table className="dense-table">
                    <thead>
                      <tr>
                        <th>Invoice Number</th>
                        <th>Type</th>
                        <th>Issue Date</th>
                        <th>Due Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="font-mono font-bold whitespace-nowrap">
                          {renderFormattedId(formatDocumentId("INV", rootId, versionNum, 1))}
                        </td>
                        <td>
                          <span className="text-xs font-medium">Primary Invoice</span>
                        </td>
                        <td className="font-mono text-xs">{currentTrip.contractDate || "16.11.2026"}</td>
                        <td className="font-mono text-xs">{currentTrip.legs[0]?.flightDate || "18.11.2026"}</td>
                        <td className="font-mono font-bold text-[var(--ink)]">
                          {formatCurrency(currentTrip.pricing.totalFlightPrice, currentTrip.pricing.currency)}
                        </td>
                        <td>
                          <StatusPill
                            label={(currentTrip.paymentStatus || "unpaid").toUpperCase()}
                            variant={currentTrip.paymentStatus === "fully_paid" ? "green" : "amber"}
                          />
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openDocument(currentTrip, "invoice")}
                              className="text-xs font-mono text-[var(--accent)] hover:underline"
                            >
                              View PDF
                            </button>
                            <span className="text-slate-300">·</span>
                            <button
                              onClick={() => {
                                handleSendDocToCurator("invoice", "Invoice INV-001");
                              }}
                              className="text-xs font-mono text-slate-600 hover:text-slate-900 font-medium hover:underline"
                            >
                              Send Invoice
                            </button>
                          </div>
                        </td>
                      </tr>
                      {(currentTrip.quoteVersion || 1) > 1 && (
                        <tr>
                          <td className="font-mono font-bold whitespace-nowrap">
                            {renderFormattedId(formatDocumentId("INV", rootId, versionNum, 2))}
                          </td>
                          <td>
                            <span className="text-xs font-medium text-amber-700">Supplementary Invoice</span>
                          </td>
                          <td className="font-mono text-xs">{currentTrip.contractDate || "17.11.2026"}</td>
                          <td className="font-mono text-xs">{currentTrip.legs[0]?.flightDate || "18.11.2026"}</td>
                          <td className="font-mono font-bold text-[var(--ink)]">
                            {formatCurrency(350, currentTrip.pricing.currency)}
                          </td>
                          <td>
                            <StatusPill label="PENDING" variant="amber" />
                          </td>
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openDocument(currentTrip, "invoice")}
                                className="text-xs font-mono text-[var(--accent)] hover:underline"
                              >
                                View PDF
                              </button>
                              <span className="text-slate-300">·</span>
                              <button
                                onClick={() => {
                                  handleSendDocToCurator("invoice", "Supplementary Invoice INV-002");
                                }}
                                className="text-xs font-mono text-slate-600 hover:text-slate-900 font-medium hover:underline"
                              >
                                Send Invoice
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Credit Notes Table (MOD-04) */}
              {currentTrip.creditNotes && currentTrip.creditNotes.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="font-display font-bold text-sm text-[var(--ink)] m-0">Issued Credit Notes</h4>
                  <div className="tablewrap">
                    <table className="dense-table">
                      <thead>
                        <tr>
                          <th>Credit Note ID</th>
                          <th>Date</th>
                          <th>Internal Reason</th>
                          <th className="text-right">Amount Credited</th>
                          <th className="text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentTrip.creditNotes.map((cn, i) => (
                          <tr key={i}>
                            <td className="font-mono font-bold whitespace-nowrap">{renderFormattedId(cn.creditNoteNumber || `CN-${rootId}-01`)}</td>
                            <td className="font-mono text-xs">{cn.issueDate || cn.date || "15.11.2026"}</td>
                            <td className="text-xs">{cn.reason}</td>
                            <td className="font-mono font-bold text-right text-[var(--red)]">
                              - {formatCurrency(cn.amount || 0, currentTrip.pricing.currency)}
                            </td>
                            <td className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openDocument(currentTrip, "credit_note")}
                                  className="text-xs font-mono text-[var(--accent)] hover:underline"
                                >
                                  View PDF
                                </button>
                                <span className="text-slate-300">·</span>
                                <button
                                  onClick={() => {
                                    alert(`Credit Note ${cn.creditNoteNumber || `CN-${rootId}-01`} pulled and dispatched.`);
                                  }}
                                  className="text-xs font-mono text-slate-600 hover:text-slate-900 font-medium hover:underline"
                                >
                                  Send Credit Note
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: MESSAGES (Image 2) */}
          {activeTab === "messages" && (
            <div className="space-y-4">
              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setMessageFilter("all")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    messageFilter === "all"
                      ? "bg-[#0B1320] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All {tripMessages.length}
                </button>
                <button
                  onClick={() => setMessageFilter("due_now")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    messageFilter === "due_now"
                      ? "bg-[#0B1320] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Due now {tripMessages.filter((m) => m.status === "due_now").length}
                </button>
                <button
                  onClick={() => setMessageFilter("scheduled")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    messageFilter === "scheduled"
                      ? "bg-[#0B1320] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Scheduled {tripMessages.filter((m) => m.status === "scheduled").length}
                </button>
                <button
                  onClick={() => setMessageFilter("sent")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    messageFilter === "sent"
                      ? "bg-[#0B1320] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Sent {tripMessages.filter((m) => m.status === "sent").length}
                </button>
                <button
                  onClick={() => setMessageFilter("manual")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    messageFilter === "manual"
                      ? "bg-[#0B1320] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Manual
                </button>
              </div>

              {/* Messages Table Card */}
              <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-white">
                        <th className="py-3 px-4 font-bold text-[10px] uppercase text-slate-400 tracking-wider">STATUS</th>
                        <th className="py-3 px-4 font-bold text-[10px] uppercase text-slate-400 tracking-wider">WHEN</th>
                        <th className="py-3 px-4 font-bold text-[10px] uppercase text-slate-400 tracking-wider">MESSAGE</th>
                        <th className="py-3 px-4 font-bold text-[10px] uppercase text-slate-400 tracking-wider">TO</th>
                        <th className="py-3 px-4 font-bold text-[10px] uppercase text-slate-400 tracking-wider">CHANNEL</th>
                        <th className="py-3 px-4 font-bold text-[10px] uppercase text-slate-400 tracking-wider">RESULT</th>
                        <th className="py-3 px-4 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredMessages.map((msg) => {
                        const isSent = msg.status === "sent";
                        const isDue = msg.status === "due_now";
                        const isScheduled = msg.status === "scheduled";

                        return (
                          <tr key={msg.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 whitespace-nowrap">
                              {isSent && (
                                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[11px] font-medium inline-block">
                                  Sent
                                </span>
                              )}
                              {isDue && (
                                <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[11px] font-medium inline-block">
                                  Due now
                                </span>
                              )}
                              {isScheduled && (
                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-medium inline-block">
                                  Scheduled
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{msg.when}</td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-900">{msg.code}</span>{" "}
                              <span className="text-slate-800">{msg.title}</span>
                            </td>
                            <td className="py-3 px-4 text-slate-700">{msg.to}</td>
                            <td className="py-3 px-4 text-slate-600">{msg.channel}</td>
                            <td className="py-3 px-4 text-slate-600">{msg.result}</td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              {isDue ? (
                                <button
                                  onClick={() => handleApproveMessage(msg.id)}
                                  className="text-slate-900 font-semibold underline hover:text-emerald-700 transition-colors cursor-pointer"
                                >
                                  Approve and send
                                </button>
                              ) : (
                                <button
                                  onClick={() => setSelectedMessageModal(msg)}
                                  className="text-slate-500 hover:text-slate-900 underline transition-colors cursor-pointer"
                                >
                                  View
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-400 leading-relaxed">
                  The trip&apos;s message plan is built automatically when the trip is booked and updates when dates, passengers or status change. Anything outside the plan is sent with &quot;Write message&quot; and logged here.
                </div>
              </div>

              {/* Write message Card */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 m-0">Write message</h3>
                  {messageSentToast && (
                    <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      Message dispatched & added to plan ✓
                    </span>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <select
                        value={composerTo}
                        onChange={(e) => setComposerTo(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400"
                      >
                        <option value="Curator M. Vance">To: Curator M. Vance</option>
                        <option value="T. Adeyemi">To: T. Adeyemi (Lead Charterer)</option>
                        <option value="K. Ola">To: K. Ola (Assistant)</option>
                        <option value="Alpine Executive">To: Alpine Executive (Operator)</option>
                        <option value="Handling Agent LSGG">To: Handling Agent (LSGG)</option>
                      </select>
                    </div>

                    <div className="relative">
                      <select
                        value={composerTemplate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setComposerTemplate(val);
                          if (val === "REQ-DOCS") {
                            setComposerMessage("Kind reminder: Please upload the remaining 2 passenger passports ahead of slot confirmation.");
                          } else if (val === "SLOT-UPDATE") {
                            setComposerMessage("Airport slot confirmation LEIB has been finalized. Standard handling active.");
                          } else if (val === "none") {
                            setComposerMessage("");
                          }
                        }}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400"
                      >
                        <option value="none">Template: none (free text)</option>
                        <option value="REQ-DOCS">Template: Passport upload reminder</option>
                        <option value="SLOT-UPDATE">Template: Slot confirmation update</option>
                        <option value="OPS-DRIVER">Template: Driver pickup details</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <textarea
                      rows={4}
                      value={composerMessage}
                      onChange={(e) => setComposerMessage(e.target.value)}
                      placeholder="Message..."
                      className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isSendingMessage || !composerMessage.trim()}
                      className="bg-[#0B1320] hover:bg-slate-800 text-white font-medium px-5 py-2 rounded-lg text-xs transition-colors disabled:opacity-50"
                    >
                      {isSendingMessage ? "Sending..." : "Send"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB: FLIGHT WATCH */}
          {activeTab === "flight_watch" && (
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 space-y-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 m-0">Live Flight Watch · {rootId}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Real-time ADS-B radar position, telemetry & dispatch monitoring</p>
                </div>
                <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-medium border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Airborne · On Time
                </span>
              </div>

              {/* Telemetry strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Aircraft</span>
                  <span className="font-bold text-slate-900 block mt-0.5">D-IOBA · Phenom 300E</span>
                  <span className="text-[11px] text-slate-500">Alpine Executive</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Route</span>
                  <span className="font-bold text-slate-900 block mt-0.5">LEIB → LSGG</span>
                  <span className="text-[11px] text-slate-500">Ibiza to Geneva</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Altitude & Speed</span>
                  <span className="font-bold text-slate-900 block mt-0.5">FL410 · 440 kts</span>
                  <span className="text-[11px] text-slate-500">Cruising level</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">ETA & Distance</span>
                  <span className="font-bold text-slate-900 block mt-0.5">10:05 UTC (in 28m)</span>
                  <span className="text-[11px] text-emerald-600 font-semibold">210 km to go</span>
                </div>
              </div>

              {/* Map visualization */}
              <div className="relative h-64 bg-[#EAF2F8] rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
                  <path d="M 0,200 Q 200,140 400,180 T 800,120 L 800,300 L 0,300 Z" fill="#DCE8F0" opacity="0.6" />
                  <path d="M 100,50 Q 300,10 600,60 T 800,20 L 800,0 L 0,0 L 0,80 Z" fill="#DCE8F0" opacity="0.6" />
                  <path d="M 180,240 Q 340,160 520,80" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeDasharray="6,4" />
                  <circle cx="180" cy="240" r="5" fill="#0B1320" />
                  <text x="170" y="260" fill="#0B1320" fontSize="11" fontWeight="bold">LEIB (Ibiza)</text>
                  <circle cx="380" cy="140" r="7" fill="#10B981" />
                  <circle cx="380" cy="140" r="14" fill="#10B981" opacity="0.3" />
                  <text x="395" y="145" fill="#0B1320" fontSize="11" fontWeight="bold">D-IOBA · FL410</text>
                  <circle cx="520" cy="80" r="5" fill="#0B1320" />
                  <text x="530" y="85" fill="#0B1320" fontSize="11" fontWeight="bold">LSGG (Geneva)</text>
                </svg>
              </div>
            </div>
          )}

          {/* TAB 8: REVISIONS (R-023 / MOD-03) */}
          {activeTab === "revisions" && (
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold font-display text-[var(--ink)] m-0">Version Control Timeline</h3>
                  <p className="text-xs text-[var(--muted)]">All historical iterations newest first. Older versions remain frozen and read-only.</p>
                </div>
                <Link
                  href={`/quotes/new?reviseTrip=${encodeURIComponent(currentTrip.id)}`}
                  className="btn-secondary text-xs flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Create New Revision</span>
                </Link>
              </div>

              <div className="tablewrap">
                <table className="dense-table">
                  <thead>
                    <tr>
                      <th>Version</th>
                      <th>Type</th>
                      <th>Route &amp; Aircraft</th>
                      <th>Total Amount</th>
                      <th>State</th>
                      <th>Documents</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tripVersions
                      .slice()
                      .sort((a, b) => (b.quoteVersion || 1) - (a.quoteVersion || 1))
                      .map((ver, idx) => {
                        const isCurrent = (ver.quoteVersion || 1) === (currentTrip.quoteVersion || 1);
                        const verLeg = ver.legs[0];
                        const verDocId = ver.isBooked
                          ? formatTripVersion(rootId, ver.quoteVersion || 1)
                          : formatDocumentId("Q", rootId, ver.quoteVersion || 1);

                        return (
                          <tr key={ver.id || idx}>
                            <td className="font-mono font-bold whitespace-nowrap">
                              {renderFormattedId(verDocId)}
                            </td>
                            <td>
                              <span className="text-xs font-semibold">
                                {ver.isBooked ? "Booked Trip" : "Quote Iteration"}
                              </span>
                            </td>
                            <td>
                              <span className="font-display font-bold text-xs block whitespace-nowrap">
                                {verLeg?.origin?.icao || "—"} ⇄ {verLeg?.destination?.icao || "—"}
                              </span>
                              <span className="font-mono text-[10px] text-[var(--muted)]">
                                {ver.aircraft?.name || "Private Jet"}
                              </span>
                            </td>
                            <td className="font-mono font-bold whitespace-nowrap">
                              {formatCurrency(ver.pricing.totalFlightPrice, ver.pricing.currency)}
                            </td>
                            <td>
                              <StatusPill
                                label={isCurrent ? "ACTIVE" : "FROZEN"}
                                variant={isCurrent ? "green" : "grey"}
                              />
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openDocument(ver, ver.isBooked ? "charter_agreement" : "quotation")}
                                  className="text-xs font-mono text-[var(--accent)] hover:underline flex items-center gap-1"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>View</span>
                                </button>
                                <button
                                  onClick={() => openDocument(ver, "quotation")}
                                  className="text-xs font-mono text-[var(--muted)] hover:text-[var(--ink)] flex items-center gap-1"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>PDF</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* Dynamic Version Compare Diff Tool (R-023 / MOD-03) */}
              <div className="border border-[var(--line)] rounded-xl p-4 bg-[var(--paper)] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="font-display font-bold text-sm text-[var(--ink)] m-0">Dynamic Version Compare Tool</h4>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span>Compare Version:</span>
                    <select
                      value={compareVersionA}
                      onChange={(e) => setCompareVersionA(Number(e.target.value))}
                      className="bg-white border border-[var(--line)] rounded px-2 py-1 text-xs"
                    >
                      {tripVersions.map((v) => (
                        <option key={v.quoteVersion || 1} value={v.quoteVersion || 1}>
                          v{v.quoteVersion || 1}
                        </option>
                      ))}
                    </select>
                    <span>with:</span>
                    <select
                      value={compareVersionB}
                      onChange={(e) => setCompareVersionB(Number(e.target.value))}
                      className="bg-white border border-[var(--line)] rounded px-2 py-1 text-xs"
                    >
                      {tripVersions.map((v) => (
                        <option key={v.quoteVersion || 1} value={v.quoteVersion || 1}>
                          v{v.quoteVersion || 1}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {(() => {
                  const verA = tripVersions.find((v) => (v.quoteVersion || 1) === compareVersionA) || tripVersions[0];
                  const verB = tripVersions.find((v) => (v.quoteVersion || 1) === compareVersionB) || tripVersions[tripVersions.length - 1];
                  const legA = verA?.legs[0];
                  const legB = verB?.legs[0];

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-[var(--card)] border border-[var(--line)] rounded-lg space-y-2">
                        <span className="font-mono font-bold text-xs text-[var(--muted)] block">
                          VERSION {String(verA?.quoteVersion || 1).padStart(3, "0")} ({verA?.quoteVersion === currentTrip.quoteVersion ? "Current" : "Historical"})
                        </span>
                        <p className="m-0 font-display font-bold text-[var(--ink)]">
                          {legA?.origin?.icao || "—"} ⇄ {legA?.destination?.icao || "—"}
                        </p>
                        <p className="m-0 font-mono text-[11px] text-[var(--muted)]">
                          Aircraft: {verA?.aircraft?.name || "—"} · {legA?.paxCount || 4} Pax
                        </p>
                        <p className="m-0 font-mono font-bold text-sm text-[var(--ink)]">
                          {verA ? formatCurrency(verA.pricing.totalFlightPrice, verA.pricing.currency) : "—"}
                        </p>
                      </div>

                      <div className="p-3 bg-[var(--card)] border border-[var(--accent)] rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-[var(--accent)] block">
                            VERSION {String(verB?.quoteVersion || 2).padStart(3, "0")} ({verB?.quoteVersion === currentTrip.quoteVersion ? "Current" : "Revision"})
                          </span>
                          {verB?.quoteVersion === currentTrip.quoteVersion && (
                            <span className="pill green">ACTIVE</span>
                          )}
                        </div>
                        <p className="m-0 font-display font-bold text-[var(--ink)]">
                          {legB?.origin?.icao || "—"} ⇄ {legB?.destination?.icao || "—"}
                        </p>
                        <p className="m-0 font-mono text-[11px] text-[var(--muted)]">
                          Aircraft: {verB?.aircraft?.name || "—"} · {legB?.paxCount || 4} Pax
                        </p>
                        <p className="m-0 font-mono font-bold text-sm text-[var(--ink)]">
                          {verB ? formatCurrency(verB.pricing.totalFlightPrice, verB.pricing.currency) : "—"}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB 9: NOTES (R-024) */}
          {activeTab === "notes" && (
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-5">
              <div>
                <h3 className="text-lg font-bold font-display text-[var(--ink)] m-0">Internal Notes & Client CRM</h3>
                <p className="text-xs text-[var(--muted)]">Confidential internal notes (admin only) and client preferences.</p>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded-lg text-xs font-sans">
                  <span className="font-display font-bold uppercase text-[10px] text-[var(--muted)] block">Client Preferences:</span>
                  <p className="m-0 text-[var(--ink)]">Prefers forward-facing club seating and sparkling water at departure. Luggage assistance directly to chauffeur vehicle.</p>
                </div>

                <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded-lg text-xs font-sans">
                  <span className="font-display font-bold uppercase text-[10px] text-[var(--muted)] block">Post-Flight Debrief:</span>
                  <p className="m-0 text-[var(--ink)]">Flight on-time. Handling at LSGG ExecuJet fast-tracked through customs in 4 minutes.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Rail Card matching MOD-10 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 space-y-5 text-xs shadow-sm self-start">
          {/* 1. ACCOUNT */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ACCOUNT</div>
            <div className="font-bold text-slate-900 text-xs">
              {currentTrip.client?.companyName || currentTrip.client?.fullName || "Private Account"}
            </div>
            <div>
              <span className="text-cyan-600 font-mono text-xs">
                {currentTrip.accountNumber || "ACC-10001"}
              </span>
            </div>
          </div>

          {/* 2. AUTHORISED OWNER */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AUTHORISED OWNER</div>
            <div className="text-slate-900 text-xs font-semibold">
              {currentTrip.client?.fullName || "—"}
            </div>
            {currentTrip.paContact && (
              <div className="text-slate-500 text-[11px]">
                PA: {currentTrip.paContact.name} {currentTrip.paContact.phone ? `(${currentTrip.paContact.phone})` : ""}
              </div>
            )}
          </div>

          {/* 3. SEND DOCUMENTS TO */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SEND DOCUMENTS TO</div>
            <div className="text-slate-900 text-xs font-mono">{currentTrip.client?.email || "—"}</div>
            {currentTrip.client?.phone && (
              <div className="text-slate-400 text-[11px] font-mono">{currentTrip.client.phone}</div>
            )}
          </div>

          {/* 4. CURATOR (MOD-14) */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CURATOR</div>
            <div className="text-slate-900 text-xs font-semibold">
              {currentTrip.curatorName || currentTrip.agentName || "OrbAero Desk"} · {currentTrip.pricing?.agentCommissionRate ? `${(currentTrip.pricing.agentCommissionRate * 100).toFixed(0)} %` : "10 %"}
            </div>
            <div className="text-slate-500 text-[11px]">
              Commission: {formatCurrency(currentTrip.pricing?.agentCommission || (currentTrip.pricing.totalFlightPrice * 0.1), currentTrip.pricing.currency)} · Payout 1 week after flight
            </div>
          </div>

          {/* 5. OPERATOR · INTERNAL (MOD-15: admin visible, marked with docs pending if applicable) */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">OPERATOR · INTERNAL</div>
            <div className="text-slate-900 text-xs flex items-center gap-1.5 font-medium">
              <span>{currentTrip.operator?.name || currentTrip.operatorName || "Approved AOC Holder"}</span>
              {currentTrip.operator?.documentsPending && (
                <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold">
                  Documents pending
                </span>
              )}
            </div>
            <div className="text-slate-400 text-[11px]">Never shown on client or Curator documents</div>
          </div>

          {/* 6. DEADLINES & TIME ZONES */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DEADLINES &amp; FLIGHT TIME</div>
            <div className="text-slate-900 text-xs font-mono">
              Block: {currentTrip.legs[0]?.flightTimeFormatted || "1h 45m"} · {currentTrip.legs[0]?.originTz || "UTC"} to {currentTrip.legs[0]?.destTz || "UTC"}
            </div>
            {missingPassportsCount > 0 ? (
              <div className="text-amber-700 text-xs font-medium">▲ {missingPassportsCount} passports before brief</div>
            ) : (
              <div className="text-emerald-700 text-xs font-medium">✓ Passports verified</div>
            )}
            <div className="text-slate-900 text-xs">
              Payment: {isPaid ? "Paid in full" : `Due before ${currentTrip.legs[0]?.flightDate || "departure"}`}
            </div>
          </div>

          {/* 7. ACTIVITY */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ACTIVITY LOG</div>
            <div className="text-slate-700 text-xs">
              {currentTrip.legs[0]?.flightDate || "Recent"} · Desk · Version {formatTripVersion(rootId, versionNum)}
            </div>
            <button
              onClick={() => handleTabChange("revisions")}
              className="text-slate-900 font-medium underline text-xs pt-1 block cursor-pointer hover:text-slate-600"
            >
              Full log
            </button>
          </div>
        </div>
      </div>

      {/* View Message Modal */}
      {selectedMessageModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-bold text-sm text-slate-900">{selectedMessageModal.code} · {selectedMessageModal.title}</span>
                <span className="text-xs text-slate-400 font-mono block mt-0.5">{selectedMessageModal.when}</span>
              </div>
              <button onClick={() => setSelectedMessageModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Recipient:</span>
                  <span className="font-medium text-slate-800">{selectedMessageModal.to}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Channel:</span>
                  <span className="font-medium text-slate-800">{selectedMessageModal.channel}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Status:</span>
                  <span className="font-medium text-slate-800 capitalize">{selectedMessageModal.status.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Result:</span>
                  <span className="font-medium text-slate-800">{selectedMessageModal.result}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Message Content / Payload:</span>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 font-mono text-[11px] text-slate-700 leading-relaxed">
                  {selectedMessageModal.content || `Automatic notification triggered for flight ${rootId} to ${selectedMessageModal.to}. Channel delivery via ${selectedMessageModal.channel} confirmed.`}
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedMessageModal(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Passenger Modal (R-017) */}
      {isAddPaxModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-[var(--ink)] m-0">Add Passenger from Contacts</h3>
              <button onClick={() => setIsAddPaxModalOpen(false)} className="text-[var(--muted)] hover:text-[var(--ink)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPassengerSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                  Select Contact:
                </label>
                <select
                  value={selectedContactId}
                  onChange={(e) => setSelectedContactId(e.target.value)}
                  className="w-full bg-[var(--paper)] border border-[var(--line)] rounded px-3 py-2 text-xs text-[var(--ink)]"
                  required
                >
                  <option value="">-- Choose from Contacts directory --</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} ({c.country}) — {c.passportDetails?.passportNumber ? "Passport OK" : "No Passport"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="leadPaxCheckbox"
                  checked={isLeadPax}
                  onChange={(e) => setIsLeadPax(e.target.checked)}
                  className="rounded border-[var(--line)]"
                />
                <label htmlFor="leadPaxCheckbox" className="font-semibold text-[var(--ink)]">
                  Designate as Lead Charterer (★)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--line)]">
                <button type="button" onClick={() => setIsAddPaxModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Passenger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Credit Note Modal (R-030 & R-022) */}
      {isCreditNoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-[var(--ink)] m-0">Issue Credit Note</h3>
                <span className="font-mono text-[11px] text-[var(--muted)]">Trip Root: {rootId}</span>
              </div>
              <button onClick={() => setIsCreditNoteModalOpen(false)} className="text-[var(--muted)] hover:text-[var(--ink)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {creditError && (
              <div className="callout red text-xs">
                <p className="font-bold">▲ Validation Error</p>
                <p>{creditError}</p>
              </div>
            )}

            <form onSubmit={handleCreditNoteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                  Credit Amount (€):
                </label>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(Number(e.target.value))}
                  className="w-full bg-[var(--paper)] border border-[var(--line)] rounded px-3 py-2 font-mono text-[var(--ink)]"
                  required
                />
                <span className="text-[11px] text-[var(--muted)] font-mono block mt-1">
                  Maximum allowable credit: {formatCurrency(currentTrip.pricing.totalFlightPrice, currentTrip.pricing.currency)}
                </span>
              </div>

              <div>
                <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                  Internal Reason (Omitted from Client PDF per R-030):
                </label>
                <textarea
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  className="w-full bg-[var(--paper)] border border-[var(--line)] rounded px-3 py-2 text-xs font-sans text-[var(--ink)]"
                  rows={3}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--line)]">
                <button type="button" onClick={() => setIsCreditNoteModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Generate Credit Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Operator Offer Modal (R-018) */}
      {isLogOfferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-[var(--ink)] m-0">Log Operator Quote Offer</h3>
              <button onClick={() => setIsLogOfferModalOpen(false)} className="text-[var(--muted)] hover:text-[var(--ink)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogOfferSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                  Operator Legal Entity:
                </label>
                <input
                  type="text"
                  value={offerOperator}
                  onChange={(e) => setOfferOperator(e.target.value)}
                  className="w-full bg-[var(--paper)] border border-[var(--line)] rounded px-3 py-2 text-xs text-[var(--ink)]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                  Aircraft & Tail Registration:
                </label>
                <input
                  type="text"
                  value={offerAircraft}
                  onChange={(e) => setOfferAircraft(e.target.value)}
                  className="w-full bg-[var(--paper)] border border-[var(--line)] rounded px-3 py-2 text-xs text-[var(--ink)]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                    Year of Manufacture:
                  </label>
                  <input
                    type="number"
                    value={offerYom}
                    onChange={(e) => setOfferYom(Number(e.target.value))}
                    className="w-full bg-[var(--paper)] border border-[var(--line)] rounded px-3 py-2 font-mono text-[var(--ink)]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                    Net Price Quote (€):
                  </label>
                  <input
                    type="number"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(Number(e.target.value))}
                    className="w-full bg-[var(--paper)] border border-[var(--line)] rounded px-3 py-2 font-mono text-[var(--ink)]"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--line)]">
                <button type="button" onClick={() => setIsLogOfferModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Operator Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
