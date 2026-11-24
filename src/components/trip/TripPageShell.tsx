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
import TripItineraryTab from "./TripItineraryTab";
import TripPassengersTab from "./TripPassengersTab";
import TripSourcingTab from "./TripSourcingTab";
import TripInfoRail, { ItineraryNotesRail } from "./TripInfoRail";
import { countMissingPassports, tripRouteLabel } from "./tripTabUtils";
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
    currentUser,
    accounts,
    operators,
    users,
    sendMessage,
    saveBookingChanges
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

  // Accounting Tab Credit Note Card State (Image 1)
  const [creditNoteReason, setCreditNoteReason] = useState<string>("Cancellation");
  const [cancellationFeePercent, setCancellationFeePercent] = useState<string>("50 %");
  const [creditNoteAmount, setCreditNoteAmount] = useState<string>("€ 4,000.00");
  const [creditNoteInternalNote, setCreditNoteInternalNote] = useState<string>("Client cancelled 16 Nov, 4 days before flight.");
  const [creditNoteOutput, setCreditNoteOutput] = useState<"Credit note only" | "Invoice for remainder" | "Both">("Both");

  // Margin Override State (R-019)
  const [marginOverridePercent, setMarginOverridePercent] = useState<number>(10);
  const [marginReason, setMarginReason] = useState<string>("");
  const [isMarginOverridden, setIsMarginOverridden] = useState<boolean>(false);

  // Version Compare Diff Tool State (R-023)
  const [compareVersionA, setCompareVersionA] = useState<number>(1);
  const [compareVersionB, setCompareVersionB] = useState<number>(2);
  const [diffFrom, setDiffFrom] = useState<string>("-003");
  const [diffTo, setDiffTo] = useState<string>("-005");
  const [newInternalNote, setNewInternalNote] = useState<string>("");
  const [internalNotesList, setInternalNotesList] = useState<{ meta: string; text: string }[]>([
    {
      meta: "14 Nov · Obi",
      text: "Client asked for a chauffeur at Geneva. Supplier confirmed Mercedes S-Class."
    },
    {
      meta: "13 Nov · Obi",
      text: "Route changed to Geneva. Dakar permit request withdrawn."
    }
  ]);
  const [clientPreferences, setClientPreferences] = useState<string[]>([
    "Prefers morning departures",
    "Always travels with dog (Toby, 3 kg)",
    "Still water only, no alcohol on board"
  ]);

  const handleAddInternalNote = () => {
    if (!newInternalNote.trim()) return;
    setInternalNotesList((prev) => [
      {
        meta: "Just now · Obi",
        text: newInternalNote.trim()
      },
      ...prev
    ]);
    setNewInternalNote("");
  };

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

  // Dynamic Real Counts for Tabs matching actual booking data
  const realPaxCount = (currentTrip as any).passengers?.length || currentTrip.legs?.[0]?.passengers?.length || (currentTrip as any).passengerCount || 4;
  const realSourcingCount = 1 + ((currentTrip as any).sourcingOptions?.length || 0);
  const realServicesCount = (currentTrip.groundTransportation?.enabled ? 1 : 0) + (currentTrip.helicopterTransfer?.enabled ? 1 : 0) + 1; // 1 for catering
  const realDocumentsCount = isBooked ? (3 + (tripVersions.length > 1 ? 1 : 0) + ((currentTrip as any).creditNotes?.length || 0)) : 1;
  const realMessagesCount = tripMessages.length;
  const realRevisionsCount = tripVersions.length;

  const tripMissingPassports = countMissingPassports(currentTrip, contacts as any[]);
  const tripSourcingCount =
    (currentTrip.sourcingOptions || []).length +
    (currentTrip.operator?.companyName &&
    !(currentTrip.sourcingOptions || []).some((o) => o.operatorName === currentTrip.operator?.companyName)
      ? 1
      : 0);
  const actorName = (currentUser?.name || "Admin").split(" ")[0];
  const briefNumber = `FB-${normalizedId || "TRIP"}-${String(versionNum).padStart(3, "0")}`;
  const saveTrip = (updates: Partial<Booking>) => {
    // Keep the activity log to a sensible size
    const capped = updates.itineraryActivity ? { ...updates, itineraryActivity: updates.itineraryActivity.slice(0, 300) } : updates;
    saveBookingChanges(currentTrip.id, capped);
  };
  const sendBriefToCurator = (legNumbers: number[]) => {
    if (!currentTrip.agentEmail && !currentTrip.agentName) return;
    sendMessage({
      channel: "broker_desk",
      recipientEmail: currentTrip.agentEmail,
      recipientName: currentTrip.agentName,
      recipientRole: "agent",
      content: `Flight brief ${briefNumber} for ${rootId} is ready (leg${legNumbers.length > 1 ? "s" : ""} ${legNumbers.join(", ")}).`,
      tripNumber: rootId
    }).catch(() => undefined);
  };

  // Tabs definition matching exact screenshot order: Itinerary, Passengers ▲2, Sourcing (3), Pricing, Services (2), Documents (7), Accounting, Revisions (5), Notes
  const tabs: { key: TripTabKey; label: string; countLabel?: string; count?: number }[] = [
    { key: "itinerary", label: "Itinerary" },
    { key: "passengers", label: "Passengers", countLabel: tripMissingPassports > 0 ? `▲${tripMissingPassports}` : undefined },
    { key: "sourcing", label: "Sourcing", count: tripSourcingCount > 0 ? tripSourcingCount : undefined },
    { key: "pricing", label: "Pricing" },
    { key: "services", label: "Services" },
    { key: "documents", label: "Documents" },
    { key: "accounting", label: "Accounting" },
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
    setTimeout(() => {
      openDocument(currentTrip, "credit_note");
    }, 200);
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
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-normal mb-1.5">
          <Link href="/bookings" className="hover:text-slate-800 transition-colors">Bookings</Link>
          <span>/</span>
          <span className="text-slate-500">{rootId.startsWith("TRI-") ? rootId : `TRI-${rootId}`}</span>
          <span>/</span>
          <span className="text-slate-500 font-normal capitalize">
            {activeTab === "flight_watch" ? "Flight watch" : activeTab === "revisions" ? "Revisions" : activeTab}
          </span>
        </div>

        {/* Title & Actions Row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{rootId.startsWith("TRI-") ? rootId : `TRI-${rootId}`}</span>
              <span>·</span>
              <span>{tripRouteLabel(currentTrip) || "Route to be confirmed"}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center flex-wrap gap-1.5 font-normal">
              <span>{currentTrip.client?.companyName || "Adeyemi Holdings Ltd"}</span>
              <span>·</span>
              <span>{currentTrip.legs[0]?.passengers?.[0]?.fullName || "T. Adeyemi"} (authorised)</span>
              <span>·</span>
              <span>Curator {currentTrip.agentName ? currentTrip.agentName.replace(" (London Broker)", "") : "M. Vance"}</span>
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

          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
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
            {activeTab === "accounting" ? (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("new-credit-note-card");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-[#0B1320] hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                New credit note
              </button>
            ) : (
              <button
                onClick={() => {
                  // The brief is generated on the Itinerary tab, no pop-up
                  if (activeTab === "itinerary") {
                    document.getElementById("generate-flight-brief")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  } else {
                    setActiveTab("itinerary");
                    router.push(`/trips/${rootId}/itinerary#generate-flight-brief`);
                  }
                }}
                className="bg-[#0B1320] hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-colors"
              >
                Flight brief
              </button>
            )}
          </div>
        </div>

        {/* Pipeline Stage Bar */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-1 flex items-center gap-1 text-xs mt-4 shadow-sm">
          {pipelineStages.map((st, idx) => {
            const activeIdx = pipelineStages.findIndex((s) => s.id === activePipelineStage);
            const isStageActive = activePipelineStage === st.id;
            const isPast = activeIdx !== -1 && idx < activeIdx;

            return (
              <button
                key={st.id}
                onClick={() => setActivePipelineStage(st.id)}
                className={`flex-1 py-1.5 px-3 text-center rounded-lg font-medium transition-all ${
                  isStageActive
                    ? "bg-[#0B1320] text-white shadow-sm font-semibold"
                    : isPast
                    ? "bg-[#edf2f7] text-slate-700 hover:bg-slate-200/80"
                    : "bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-50"
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
      <div className={`grid grid-cols-1 ${activeTab === "accounting" ? "lg:grid-cols-1" : "lg:grid-cols-4"} gap-6`}>
        {/* Main Tab Content Area */}
        <div className={`${activeTab === "accounting" ? "w-full" : "lg:col-span-3"} space-y-5`}>
          {/* TAB 1: ITINERARY · times, FBO, registration, crew and brief contact per leg */}
          {activeTab === "itinerary" && (
            <TripItineraryTab
              trip={currentTrip}
              onSave={saveTrip}
              onOpenBrief={(briefBooking) => openDocument(briefBooking, "flight_brief")}
              onSendBriefToCurator={sendBriefToCurator}
              userName={actorName}
              companyName={settings?.company?.name?.split(" ")[0] || "Orbelo"}
              briefNumber={briefNumber}
            />
          )}

          {/* TAB 2: PASSENGERS · manifest from Contacts, weapons on board, totals */}
          {activeTab === "passengers" && (
            <TripPassengersTab trip={currentTrip} contacts={contacts as any[]} onSave={saveTrip} userName={actorName} />
          )}

          {/* TAB 3: SOURCING · request for the marketplace and operator offers */}
          {activeTab === "sourcing" && (
            <TripSourcingTab trip={currentTrip} operators={operators} onSave={saveTrip} userName={actorName} />
          )}

          {/* TAB 4: PRICING (R-019) */}
          {activeTab === "pricing" && (
            <div className="space-y-5">
              {/* Top Row: Price Build & Settings for this trip */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left Card: Price build · version -005 */}
                <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 m-0">Price build · version -005</h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-start justify-between text-slate-700">
                      <div>
                        <span className="font-medium text-slate-800">Operator cost</span>
                        <span className="text-slate-400 ml-1.5 text-[11px]">Alpine Executive offer</span>
                      </div>
                      <span className="font-mono text-slate-900 font-medium">€ 6,441.00</span>
                    </div>

                    <div className="flex items-start justify-between text-slate-700">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-800">Company margin</span>
                          <span className="text-slate-400 text-[11px]">15 % · tier &lt; € 10k</span>
                        </div>
                        <span className="text-slate-400 text-[10px] block">admin only</span>
                      </div>
                      <span className="font-mono text-slate-900 font-medium">€ 966.00</span>
                    </div>

                    <div className="flex items-start justify-between text-slate-700">
                      <div>
                        <span className="font-medium text-slate-800">Curator mark-up</span>
                        <span className="text-slate-400 ml-1.5 text-[11px]">M. Vance · 8 %</span>
                      </div>
                      <span className="font-mono text-slate-900 font-medium">€ 593.00</span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-bold text-slate-900">
                      <span>Charter price</span>
                      <span className="font-mono text-slate-900">€ 8,000.00</span>
                    </div>

                    <div className="flex items-start justify-between text-slate-700">
                      <div>
                        <span className="font-medium text-slate-800">Pet fee</span>
                        <span className="text-slate-400 ml-1.5 text-[11px]">· leg 1</span>
                      </div>
                      <span className="font-mono text-slate-900">€ 0.00</span>
                    </div>

                    <div className="flex items-start justify-between text-slate-700">
                      <div>
                        <span className="font-medium text-slate-800">Chauffeur on arrival LSGG</span>
                        <span className="text-slate-400 ml-1.5 text-[11px]">added in -005</span>
                      </div>
                      <span className="font-mono text-slate-900">€ 250.00</span>
                    </div>

                    <div className="pt-3 border-t border-slate-200">
                      <div className="flex items-center justify-between text-sm font-bold text-slate-900">
                        <span>Client total</span>
                        <span className="font-mono text-base text-slate-900">€ 8,250.00</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                        <span>Card payment (+3.5 %)</span>
                        <span className="font-mono text-slate-600">€ 8,538.75 if paid by card</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Card: Settings for this trip */}
                <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 m-0">Settings for this trip</h3>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                        CURRENCY
                      </label>
                      <select
                        defaultValue="EUR"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      >
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                        <option value="GBP">GBP</option>
                        <option value="NGN">NGN</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                        PAYMENT
                      </label>
                      <select
                        defaultValue="Bank transfer"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      >
                        <option value="Bank transfer">Bank transfer</option>
                        <option value="Card (+3.5 %)">Card (+3.5 %)</option>
                        <option value="Crypto">Crypto</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                        COMPANY MARGIN OVERRIDE
                      </label>
                      <input
                        type="text"
                        placeholder="Leave empty to use tier"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                        REASON FOR OVERRIDE
                      </label>
                      <input
                        type="text"
                        placeholder="Required if overridden"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                    Margin tiers (from Settings): 15 % below € 10k · 10 % € 10k–35k · 8 % above € 35k.
                  </p>
                </div>
              </div>

              {/* Bottom Card: Who sees what */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-slate-900 m-0">Who sees what</h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 pr-4">LINE</th>
                        <th className="py-2.5 px-4">ADMIN</th>
                        <th className="py-2.5 px-4">CURATOR PORTAL</th>
                        <th className="py-2.5 pl-4">CLIENT QUOTE PDF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="py-2.5 pr-4 font-medium text-slate-800">Operator name and cost</td>
                        <td className="py-2.5 px-4 text-emerald-600 font-bold">✓</td>
                        <td className="py-2.5 px-4 text-slate-400">—</td>
                        <td className="py-2.5 pl-4 text-slate-400">—</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4 font-medium text-slate-800">Company margin</td>
                        <td className="py-2.5 px-4 text-emerald-600 font-bold">✓</td>
                        <td className="py-2.5 px-4 text-slate-400">—</td>
                        <td className="py-2.5 pl-4 text-slate-400">—</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4 font-medium text-slate-800">Curator mark-up</td>
                        <td className="py-2.5 px-4 text-emerald-600 font-bold">✓</td>
                        <td className="py-2.5 px-4 text-emerald-600 font-medium">✓ own only</td>
                        <td className="py-2.5 pl-4 text-slate-400">—</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4 font-medium text-slate-800">Net price to Curator (€ 7,407.00)</td>
                        <td className="py-2.5 px-4 text-emerald-600 font-bold">✓</td>
                        <td className="py-2.5 px-4 text-emerald-600 font-bold">✓</td>
                        <td className="py-2.5 pl-4 text-slate-400">—</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4 font-medium text-slate-800">Client total and services</td>
                        <td className="py-2.5 px-4 text-emerald-600 font-bold">✓</td>
                        <td className="py-2.5 px-4 text-emerald-600 font-bold">✓</td>
                        <td className="py-2.5 pl-4 text-emerald-600 font-bold">✓</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SERVICES (R-020) */}
          {activeTab === "services" && (
            <div className="space-y-4">
              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsAddServiceModalOpen(true)}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-colors"
                >
                  + VIP limousine
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddServiceModalOpen(true)}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-colors"
                >
                  + Helicopter transfer
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddServiceModalOpen(true)}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-colors"
                >
                  + Catering
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddServiceModalOpen(true)}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-colors"
                >
                  + Custom service
                </button>
              </div>

              {/* Card 1: VIP limousine · leg 1 · on arrival LSGG */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 m-0">VIP limousine · leg 1 · on arrival LSGG</h3>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                    Confirmed with supplier
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div className="sm:col-span-1 lg:col-span-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                      DROP-OFF
                    </label>
                    <input
                      type="text"
                      defaultValue="Hotel des Bergues, Geneva"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                      VEHICLE
                    </label>
                    <select
                      defaultValue="Luxury"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="Luxury">Luxury</option>
                      <option value="Premium Sedan">Premium Sedan</option>
                      <option value="Executive Van">Executive Van</option>
                      <option value="Armored SUV">Armored SUV</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                      PASSENGERS
                    </label>
                    <input
                      type="text"
                      defaultValue="4"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                      CLIENT PRICE
                    </label>
                    <input
                      type="text"
                      defaultValue="€ 250.00"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                      SPECIAL INSTRUCTIONS
                    </label>
                    <input
                      type="text"
                      defaultValue="Meet at aircraft, name board"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-1 lg:col-span-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                      SUPPLIER COST (ADMIN ONLY)
                    </label>
                    <input
                      type="text"
                      defaultValue="€ 180.00"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 pt-1">
                  Added in revision -005 · invoiced as INV-FE4578-005-1
                </div>
              </div>

              {/* Card 2: Catering · leg 1 */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 m-0">Catering · leg 1</h3>
                  <span className="bg-slate-100 text-slate-700 border border-slate-200/70 text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                    Requested from operator
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                      MENU
                    </label>
                    <select
                      defaultValue="VIP menu 2 · light lunch"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="VIP menu 2 · light lunch">VIP menu 2 · light lunch</option>
                      <option value="Executive Cold Platter">Executive Cold Platter</option>
                      <option value="Hot Gourmet Dinner">Hot Gourmet Dinner</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                      DIETARY NOTES
                    </label>
                    <input
                      type="text"
                      defaultValue="1 vegetarian"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                      CLIENT PRICE
                    </label>
                    <input
                      type="text"
                      defaultValue="Included"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Helicopter transfer */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm space-y-2">
                <h3 className="text-sm font-bold text-slate-900 m-0">Helicopter transfer</h3>
                <p className="text-xs text-slate-400 leading-relaxed m-0">
                  Not requested. When added: leg · on arrival / on departure / both · passengers · helicopter type · from and to · luggage · special requests · client price · supplier cost.
                </p>
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
                        {/* Consolidated All-Iterations Invoice Row */}
                        <tr>
                          <td className="font-mono font-bold">{renderFormattedId(`INV-${rootId}-ALL`)}</td>
                          <td>
                            <span className="font-semibold text-xs block text-[var(--ink)]">Consolidated Invoice (All Iterations)</span>
                            <span className="text-[10px] text-emerald-700 font-mono">Aggregated {tripVersions.length} iterations</span>
                          </td>
                          <td className="font-mono text-xs">ALL</td>
                          <td>
                            <StatusPill label="CONSOLIDATED" variant="green" />
                          </td>
                          <td>
                            <StatusPill label="ACTIVE" variant="green" />
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  const totalInvoiced = tripVersions.reduce((acc, v) => acc + (v.pricing?.totalFlightPrice || 0), 0);
                                  const consolidatedTrip: Booking = {
                                    ...currentTrip,
                                    id: `cons-${currentTrip.id}`,
                                    tripNumber: `${rootId}-ALL`,
                                    invoiceNumber: `INV-${rootId}-CONSOLIDATED`,
                                    pricing: {
                                      ...currentTrip.pricing,
                                      totalFlightPrice: totalInvoiced > 0 ? totalInvoiced : currentTrip.pricing.totalFlightPrice
                                    }
                                  };
                                  openDocument(consolidatedTrip, "invoice");
                                }}
                                className="text-xs font-mono text-[var(--accent)] hover:underline font-bold"
                              >
                                View Total PDF
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Issued Credit Notes in Documents Table */}
                        {(currentTrip.creditNotes || []).map((cn, idx) => (
                          <tr key={cn.creditNoteNumber || idx}>
                            <td className="font-mono font-bold text-rose-700">{renderFormattedId(cn.creditNoteNumber || `CN-${rootId}-0${idx + 1}`)}</td>
                            <td>Credit Note</td>
                            <td className="font-mono text-xs">{versionBadge}</td>
                            <td>
                              <StatusPill label="ISSUED" variant="amber" />
                            </td>
                            <td><StatusPill label="APPLIED" variant="blue" /></td>
                            <td>
                              <button
                                onClick={() => openDocument(currentTrip, "credit_note")}
                                className="text-xs font-mono text-rose-600 hover:underline"
                              >
                                View PDF
                              </button>
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: ACCOUNTING (Image 2) */}
          {activeTab === "accounting" && (
            <div className="space-y-5">
              {/* Top Financial Health Cards (5 metrics) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">INVOICED</span>
                  <span className="text-base font-bold text-slate-900 font-mono">€ 8,250.00</span>
                </div>
                <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">CREDITED</span>
                  <span className="text-base font-bold text-slate-900 font-mono">€ 0.00</span>
                </div>
                <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">NET DUE</span>
                  <span className="text-base font-bold text-slate-900 font-mono">€ 8,250.00</span>
                </div>
                <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">RECEIVED</span>
                  <span className="text-base font-bold text-slate-900 font-mono">€ 8,000.00</span>
                </div>
                <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">OPEN BALANCE</span>
                  <span className="text-base font-bold text-amber-600 font-mono">€ 250.00</span>
                </div>
              </div>

              {/* Split Content: Left is Trip Ledger, Right is Credit Note */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left: Trip ledger · latest first */}
                <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 m-0">Trip ledger · latest first</h3>
                    <button
                      type="button"
                      onClick={() => openDocument(currentTrip, "invoice")}
                      className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-colors"
                    >
                      Combine into one invoice
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                          <th className="py-2.5 pr-2">VERSION</th>
                          <th className="py-2.5 px-2">DOCUMENT</th>
                          <th className="py-2.5 px-2">LINE</th>
                          <th className="py-2.5 px-2 text-right">AMOUNT</th>
                          <th className="py-2.5 px-2">STATUS</th>
                          <th className="py-2.5 pl-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {/* Row 1 */}
                        <tr>
                          <td className="py-3 pr-2 font-mono text-slate-600 whitespace-nowrap">TRI-FE4578-005</td>
                          <td className="py-3 px-2 font-mono text-slate-500 whitespace-nowrap">INV-FE4578-005-1</td>
                          <td className="py-3 px-2">Additional service · chauffeur, Geneva arrival</td>
                          <td className="py-3 px-2 text-right font-mono whitespace-nowrap">€ 250.00</td>
                          <td className="py-3 px-2 whitespace-nowrap">
                            <span className="bg-amber-50 text-amber-800 border border-amber-200/80 rounded px-2 py-0.5 text-[11px] font-medium">
                              Unpaid · pay link sent
                            </span>
                          </td>
                          <td className="py-3 pl-2 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => openDocument(currentTrip, "invoice")}
                              className="text-xs text-blue-600 font-medium hover:underline"
                            >
                              PDF
                            </button>
                          </td>
                        </tr>

                        {/* Row 2 */}
                        <tr>
                          <td className="py-3 pr-2 font-mono text-slate-600 whitespace-nowrap">TRI-FE4578-004</td>
                          <td className="py-3 px-2 font-mono text-slate-400 whitespace-nowrap">—</td>
                          <td className="py-3 px-2">Route change Ibiza–Dakar → Ibiza–Geneva. Price unchanged, no new amount booked.</td>
                          <td className="py-3 px-2 text-right font-mono whitespace-nowrap">€ 0.00</td>
                          <td className="py-3 px-2 whitespace-nowrap">
                            <span className="bg-slate-100 text-slate-600 rounded px-2 py-0.5 text-[11px] font-medium">
                              Revision
                            </span>
                          </td>
                          <td className="py-3 pl-2 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => openDocument(currentTrip, "flight_brief")}
                              className="text-xs text-blue-600 font-medium hover:underline"
                            >
                              Brief
                            </button>
                          </td>
                        </tr>

                        {/* Row 3 */}
                        <tr>
                          <td className="py-3 pr-2 font-mono text-slate-600 whitespace-nowrap">TRI-FE4578-003</td>
                          <td className="py-3 px-2 font-mono text-slate-500 whitespace-nowrap">PAY-9012</td>
                          <td className="py-3 px-2">Wire received · ref TRI-FE4578 · proof attached</td>
                          <td className="py-3 px-2 text-right font-mono font-medium whitespace-nowrap">- € 8,000.00</td>
                          <td className="py-3 px-2 whitespace-nowrap">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded px-2 py-0.5 text-[11px] font-medium">
                              Received
                            </span>
                          </td>
                          <td className="py-3 pl-2 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => openDocument(currentTrip, "invoice")}
                              className="text-xs text-blue-600 font-medium hover:underline"
                            >
                              Proof
                            </button>
                          </td>
                        </tr>

                        {/* Row 4 */}
                        <tr>
                          <td className="py-3 pr-2 font-mono text-slate-600 whitespace-nowrap">TRI-FE4578-003</td>
                          <td className="py-3 px-2 font-mono text-slate-500 whitespace-nowrap">INV-FE4578-002-1</td>
                          <td className="py-3 px-2">Charter LEIB → GOBD, light jet, 4 pax (booked from quote -002)</td>
                          <td className="py-3 px-2 text-right font-mono whitespace-nowrap">€ 8,000.00</td>
                          <td className="py-3 px-2 whitespace-nowrap">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded px-2 py-0.5 text-[11px] font-medium">
                              Paid
                            </span>
                          </td>
                          <td className="py-3 pl-2 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => openDocument(currentTrip, "invoice")}
                              className="text-xs text-blue-600 font-medium hover:underline"
                            >
                              PDF
                            </button>
                          </td>
                        </tr>

                        {/* Row 5 */}
                        <tr>
                          <td className="py-3 pr-2 font-mono text-slate-600 whitespace-nowrap">TRI-FE4578-002</td>
                          <td className="py-3 px-2 font-mono text-slate-500 whitespace-nowrap">TRI-FE4578-002</td>
                          <td className="py-3 px-2">Quote · contract signed 12 Nov</td>
                          <td className="py-3 px-2 text-right font-mono whitespace-nowrap">€ 8,000.00</td>
                          <td className="py-3 px-2 whitespace-nowrap">
                            <span className="bg-slate-100 text-slate-700 rounded px-2 py-0.5 text-[11px] font-medium">
                              Booked → -003
                            </span>
                          </td>
                          <td className="py-3 pl-2 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => openDocument(currentTrip, "quotation")}
                              className="text-xs text-blue-600 font-medium hover:underline"
                            >
                              PDF
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="text-xs text-slate-400 pt-2 leading-relaxed m-0">
                    A revision that only changes route or time adds no amount, so nothing is counted twice. Every money movement is its own line with its own number.
                  </p>
                </div>

                {/* Right: New credit note · CN-FE4578-005-1 Card */}
                <div id="new-credit-note-card" className="lg:col-span-5 bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 m-0">New credit note · CN-FE4578-005-1</h3>

                  <div className="space-y-3.5 text-xs">
                    {/* AGAINST */}
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                        AGAINST
                      </label>
                      <select
                        defaultValue="INV-FE4578-002-1"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      >
                        <option value="INV-FE4578-002-1">INV-FE4578-002-1 · € 8,000.00 · paid</option>
                        <option value="INV-FE4578-005-1">INV-FE4578-005-1 · € 250.00 · unpaid</option>
                      </select>
                    </div>

                    {/* REASON (INTERNAL, NOT PRINTED) */}
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
                        REASON (INTERNAL, NOT PRINTED)
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {["Cancellation", "Complimentary service", "Price correction", "Goodwill"].map((r) => {
                          const isActive = creditNoteReason === r;
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setCreditNoteReason(r)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                isActive
                                  ? "bg-[#0B1320] text-white shadow-xs"
                                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {r}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* CANCELLATION FEE & CREDIT AMOUNT */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                          CANCELLATION FEE
                        </label>
                        <input
                          type="text"
                          value={cancellationFeePercent}
                          onChange={(e) => setCancellationFeePercent(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                          CREDIT AMOUNT
                        </label>
                        <input
                          type="text"
                          value={creditNoteAmount}
                          onChange={(e) => setCreditNoteAmount(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                    </div>

                    {/* INTERNAL NOTE */}
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                        INTERNAL NOTE
                      </label>
                      <input
                        type="text"
                        value={creditNoteInternalNote}
                        onChange={(e) => setCreditNoteInternalNote(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    {/* Calculation Summary */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                      <div className="flex justify-between items-center">
                        <span>Invoiced</span>
                        <span className="font-mono text-slate-800 font-medium">€ 8,250.00</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>This credit note</span>
                        <span className="font-mono text-slate-800 font-medium">- € 4,000.00</span>
                      </div>
                      <div className="flex justify-between items-center font-medium text-slate-800">
                        <span>Net due after</span>
                        <span className="font-mono">€ 4,250.00</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Received</span>
                        <span className="font-mono text-slate-800 font-medium">€ 8,000.00</span>
                      </div>
                      <div className="flex justify-between items-center font-bold text-blue-600 pt-1 border-t border-slate-100 text-xs">
                        <span>Refund owed to client</span>
                        <span className="font-mono text-sm">€ 3,750.00</span>
                      </div>
                    </div>

                    {/* OUTPUT */}
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
                        OUTPUT
                      </label>
                      <div className="flex items-center gap-1.5">
                        {(["Credit note only", "Invoice for remainder", "Both"] as const).map((opt) => {
                          const isActive = creditNoteOutput === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setCreditNoteOutput(opt)}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors text-center ${
                                isActive
                                  ? "bg-[#0B1320] text-white shadow-xs"
                                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="button"
                      onClick={() => {
                        alert("Credit note CN-FE4578-005-1 created and trip revised to -006.");
                      }}
                      className="w-full bg-[#0B1320] hover:bg-slate-800 text-white py-2.5 px-4 rounded-xl text-xs font-semibold shadow-sm transition-colors text-center"
                    >
                      Create credit note &amp; revise trip → -006
                    </button>
                  </div>
                </div>
              </div>
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
            <div className="space-y-5">
              {/* Table Card */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 m-0">Revisions · latest first</h3>
                  <span className="text-xs text-slate-400">Quote and booking versions share one sequence</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 pr-3">VERSION</th>
                        <th className="py-2.5 px-3">TYPE</th>
                        <th className="py-2.5 px-3">WHAT CHANGED</th>
                        <th className="py-2.5 px-3">REASON</th>
                        <th className="py-2.5 px-3 text-right">AMOUNT CHANGE</th>
                        <th className="py-2.5 px-3">STATE</th>
                        <th className="py-2.5 px-3">BY · WHEN</th>
                        <th className="py-2.5 pl-3">GENERATE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {/* Row 1: -005 */}
                      <tr>
                        <td className="py-3 pr-3 font-mono font-bold text-slate-900 whitespace-nowrap">-005</td>
                        <td className="py-3 px-3 whitespace-nowrap">Booking</td>
                        <td className="py-3 px-3">Chauffeur added on arrival LSGG</td>
                        <td className="py-3 px-3 whitespace-nowrap">Client request</td>
                        <td className="py-3 px-3 text-right font-mono whitespace-nowrap">+ € 250.00</td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="text-emerald-600 font-medium text-xs">Current</span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-slate-600">Obi · 14 Nov</td>
                        <td className="py-3 pl-3 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
                            <button onClick={() => openDocument(currentTrip, "quotation")} className="hover:underline">Quote</button>
                            <button onClick={() => openDocument(currentTrip, "invoice")} className="hover:underline">Invoice</button>
                            <button onClick={() => setIsCreditNoteModalOpen(true)} className="hover:underline">Credit note</button>
                            <button onClick={() => openDocument(currentTrip, "flight_brief")} className="hover:underline">Brief</button>
                          </div>
                        </td>
                      </tr>

                      {/* Row 2: -004 */}
                      <tr>
                        <td className="py-3 pr-3 font-mono font-bold text-slate-900 whitespace-nowrap">-004</td>
                        <td className="py-3 px-3 whitespace-nowrap">Booking</td>
                        <td className="py-3 px-3">Route LEIB → GOBD changed to LEIB → LSGG</td>
                        <td className="py-3 px-3 whitespace-nowrap">Client request</td>
                        <td className="py-3 px-3 text-right font-mono whitespace-nowrap">€ 0.00</td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px]">Superseded</span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-slate-600">Obi · 13 Nov</td>
                        <td className="py-3 pl-3 whitespace-nowrap">
                          <button onClick={() => openDocument(currentTrip, "flight_brief")} className="text-xs text-blue-600 font-medium hover:underline">
                            Brief PDF
                          </button>
                        </td>
                      </tr>

                      {/* Row 3: -003 */}
                      <tr>
                        <td className="py-3 pr-3 font-mono font-bold text-slate-900 whitespace-nowrap">-003</td>
                        <td className="py-3 px-3 whitespace-nowrap">Booking</td>
                        <td className="py-3 px-3">Booked from -002 · contract CA-FE4578-002 signed</td>
                        <td className="py-3 px-3 whitespace-nowrap text-slate-400">—</td>
                        <td className="py-3 px-3 text-right font-mono whitespace-nowrap">€ 8,000.00</td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded text-[11px]">
                            Cancelled route
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-slate-600">Obi · 12 Nov</td>
                        <td className="py-3 pl-3 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
                            <button onClick={() => openDocument(currentTrip, "invoice")} className="hover:underline">Invoice PDF</button>
                            <button onClick={() => openDocument(currentTrip, "flight_brief")} className="hover:underline">Brief PDF</button>
                          </div>
                        </td>
                      </tr>

                      {/* Row 4: -002 */}
                      <tr>
                        <td className="py-3 pr-3 font-mono font-bold text-slate-900 whitespace-nowrap">-002</td>
                        <td className="py-3 px-3 whitespace-nowrap">Quote</td>
                        <td className="py-3 px-3">Departure 12:00 → 10:00</td>
                        <td className="py-3 px-3 whitespace-nowrap">Client request</td>
                        <td className="py-3 px-3 text-right font-mono whitespace-nowrap">€ 0.00</td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[11px]">
                            Booked → -003
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-slate-600">Obi · 11 Nov</td>
                        <td className="py-3 pl-3 whitespace-nowrap">
                          <button onClick={() => openDocument(currentTrip, "quotation")} className="text-xs text-blue-600 font-medium hover:underline">
                            Quote PDF
                          </button>
                        </td>
                      </tr>

                      {/* Row 5: -001 */}
                      <tr>
                        <td className="py-3 pr-3 font-mono font-bold text-slate-900 whitespace-nowrap">-001</td>
                        <td className="py-3 px-3 whitespace-nowrap">Quote</td>
                        <td className="py-3 px-3">Created from request REQ-FE4578 (M. Vance)</td>
                        <td className="py-3 px-3 whitespace-nowrap text-slate-400">—</td>
                        <td className="py-3 px-3 text-right font-mono whitespace-nowrap">€ 8,000.00</td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px]">
                            Superseded
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-slate-600">Obi · 10 Nov</td>
                        <td className="py-3 pl-3 whitespace-nowrap">
                          <button onClick={() => openDocument(currentTrip, "quotation")} className="text-xs text-blue-600 font-medium hover:underline">
                            Quote PDF
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-xs text-slate-400 pt-2 leading-relaxed m-0">
                  Revise always opens the full form with the latest details. Saving with &quot;Complete Booking&quot; creates the next number, saves it and brings you back here (R-008). Old versions can&apos;t be revised again, but every document they produced can still be printed.
                </p>
              </div>

              {/* Compare Versions Card */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 m-0">Compare versions</h3>

                <div className="flex items-center gap-3 flex-wrap text-xs">
                  <div className="flex items-center gap-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">FROM</label>
                    <select
                      value={diffFrom}
                      onChange={(e) => setDiffFrom(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                    >
                      <option value="-001">-001</option>
                      <option value="-002">-002</option>
                      <option value="-003">-003</option>
                      <option value="-004">-004</option>
                      <option value="-005">-005</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">TO</label>
                    <select
                      value={diffTo}
                      onChange={(e) => setDiffTo(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                    >
                      <option value="-001">-001</option>
                      <option value="-002">-002</option>
                      <option value="-003">-003</option>
                      <option value="-004">-004</option>
                      <option value="-005">-005</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {}}
                    className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-colors"
                  >
                    Show differences
                  </button>
                </div>

                <div className="bg-slate-50/70 border border-slate-100 rounded-lg p-3 text-xs text-slate-700 space-y-1">
                  <div>Route: LEIB → GOBD → LEIB → LSGG</div>
                  <div>Services: + Chauffeur on arrival (€ 250.00)</div>
                  <div>Charter price: unchanged (€ 8,000.00)</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: NOTES (R-024) */}
          {activeTab === "notes" && (
            <div className="space-y-5">
              {/* Top 2 Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left Card: Internal notes */}
                <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 m-0">Internal notes</h3>

                  <div className="space-y-2">
                    <textarea
                      value={newInternalNote}
                      onChange={(e) => setNewInternalNote(e.target.value)}
                      placeholder="Add a note for the desk. Not visible to Curator or client."
                      rows={3}
                      className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 resize-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddInternalNote}
                        className="bg-[#0B1320] hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-colors"
                      >
                        Add note
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 pt-1">
                    {internalNotesList.map((note, idx) => (
                      <div key={idx} className="bg-slate-50/80 border border-slate-100 rounded-lg p-3">
                        <div className="text-xs text-slate-500 font-medium">{note.meta}</div>
                        <p className="text-xs text-slate-800 mt-1 m-0 leading-relaxed">{note.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Card: Client preferences · saved on the account */}
                <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 m-0">
                    Client preferences <span className="text-slate-400 font-normal text-xs">· saved on the account</span>
                  </h3>

                  <div className="space-y-2.5">
                    {clientPreferences.map((pref, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50/80 border border-slate-100 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-medium"
                      >
                        {pref}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const newPref = prompt("Enter client preference:");
                        if (newPref) setClientPreferences((p) => [...p, newPref]);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium pt-1 block cursor-pointer hover:underline"
                    >
                      + Add preference
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Card: After the flight */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-slate-900 m-0">After the flight</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                      ACTUAL DEPARTURE
                    </label>
                    <input
                      type="text"
                      defaultValue="—"
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                      DELAY / ISSUE
                    </label>
                    <select
                      defaultValue="None"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="None">None</option>
                      <option value="Weather">Weather</option>
                      <option value="Air Traffic Control">Air Traffic Control</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Pax late">Pax late</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                      CLIENT FEEDBACK
                    </label>
                    <input
                      type="text"
                      defaultValue="—"
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-400 pt-1 leading-relaxed m-0">
                  Filled after the flight. Feeds the account&apos;s history and the operator&apos;s record.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right rail: notes on the Itinerary tab, trip facts on the other tabs */}
        {activeTab !== "accounting" &&
          (activeTab === "itinerary" ? (
            <ItineraryNotesRail />
          ) : (
            <TripInfoRail
              trip={currentTrip}
              accounts={accounts}
              operators={operators}
              users={users}
              missingPassports={tripMissingPassports}
              onFullLog={() => handleTabChange("revisions")}
            />
          ))}
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
