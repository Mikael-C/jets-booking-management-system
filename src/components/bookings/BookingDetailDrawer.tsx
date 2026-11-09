"use client";

import React, { useState } from "react";
import { useAviation } from "@/lib/aviationContext";
import { formatCurrency } from "@/lib/pricingCalculator";
import {
  X,
  Plane,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  FileText,
  Receipt,
  Compass,
  ScrollText,
  CheckCircle2,
  Square,
  AlertTriangle,
  PlaneTakeoff,
  MapPin,
  Sparkles,
  Phone,
  Mail,
  Building,
  RotateCcw,
  ArrowRight,
  AlertOctagon,
  PenTool,
  History,
  DollarSign,
  ExternalLink
} from "lucide-react";

export default function BookingDetailDrawer() {
  const {
    selectedBookingForDetail,
    setSelectedBookingForDetail,
    toggleChecklistItem,
    updateBookingStatus,
    openDocument,
    convertQuoteToBooked,
    signCharterContract,
    issueCreditNote,
    currentUser,
    setActiveNav,
    role
  } = useAviation();

  if (!selectedBookingForDetail) return null;
  const booking = selectedBookingForDetail;

  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditRevTotal, setCreditRevTotal] = useState<number>(booking.pricing.totalFlightPrice || 15000);
  const [cancellationFeeInput, setCancellationFeeInput] = useState<number>(0);
  const [complementaryInput, setComplementaryInput] = useState<number>(0);
  const [creditReasonInput, setCreditReasonInput] = useState<string>("Route revision & schedule adjustment");

  const [showSignModal, setShowSignModal] = useState(false);
  const [signerInput, setSignerInput] = useState(booking.client.fullName || "");

  const isBooked = ["confirmed", "dispatched", "in_flight", "completed"].includes(booking.status);
  const isContractStage = booking.status === "contract_sent";
  const isQuoteStage = !isBooked && !isContractStage;

  const totalSteps = booking.checklist.length;
  const completedSteps = booking.checklist.filter((s) => s.isCompleted).length;
  const percentComplete = Math.round((completedSteps / (totalSteps || 1)) * 100);
  const isAllRequiredDone = booking.checklist
    .filter((s) => s.requiredForDispatch)
    .every((s) => s.isCompleted);

  const getStatusBadge = (status: typeof booking.status) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            CONFIRMED BOOKING
          </span>
        );
      case "dispatched":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-100 text-indigo-800 border border-indigo-300 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-600" />
            DISPATCHED & CLEARED
          </span>
        );
      case "in_flight":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1.5 animate-pulse">
            <Plane className="w-3 h-3" />
            CURRENTLY IN FLIGHT
          </span>
        );
      case "completed":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-gray-200 text-gray-800 border border-gray-300 flex items-center gap-1.5">
            COMPLETED FLIGHT
          </span>
        );
      case "contract_sent":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1.5">
            <ScrollText className="w-3 h-3" />
            CONTRACT ISSUED
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            ACTIVE QUOTATION
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl h-full bg-[#FDFCFA] text-[#0F1420] flex flex-col shadow-2xl border-l border-[#D1C9BC] overflow-hidden">
        
        {/* Top Header */}
        <div className="p-6 bg-[#0F1420] text-white flex items-center justify-between border-b border-[#1C2436]">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#141A29] border border-[#C9A052]/40 text-[#C9A052]">
              <Plane className="w-6 h-6 transform -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[#C9A052] font-bold">
                  {isBooked ? "CONFIRMED CHARTER RECORD" : isContractStage ? "CONTRACT REVIEW STAGE" : "CHARTER QUOTATION"}
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-xs font-mono text-gray-300">Acc: {booking.accountNumber}</span>
              </div>
              <h2 className="text-xl font-black text-white flex items-center gap-2.5">
                {isBooked ? (
                  <>Trip {booking.tripNumber}</>
                ) : (
                  <>Quote Ref: {booking.quoteReference || (booking.tripNumber ? `QTE-${booking.tripNumber.replace(/\D/g, '') || booking.tripNumber}` : "QTE-PENDING")}</>
                )}
              </h2>
              <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                {isBooked ? (
                  <>Callsign: <strong className="text-white">{booking.legs[0]?.flightNumber || "PEU842"}</strong> • Tail: <strong className="text-white">{booking.aircraft.registration || "OE-FFB"}</strong></>
                ) : (
                  <span className="text-[#C9A052]">Flight call sign and Trip ID assigned upon booking confirmation</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {getStatusBadge(booking.status)}
            <button
              onClick={() => setSelectedBookingForDetail(null)}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#1C2436] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lifecycle Flow Stepper: Quote -> Contract -> Booked contract */}
        <div className="px-6 py-3.5 bg-[#141A29] border-b border-[#1C2436]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A052] font-bold">
              Charter Lifecycle Progression
            </span>
            <span className="text-[10px] font-mono text-gray-400">
              Flow: Quote → Contract → Booked Contract
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            {/* Step 1: Quote */}
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all flex-1 ${
                isQuoteStage
                  ? "bg-[#C9A052]/20 border-[#C9A052] text-[#C9A052] ring-1 ring-[#C9A052]"
                  : "bg-emerald-950/40 border-emerald-500/40 text-emerald-400"
              }`}
            >
              {isQuoteStage ? (
                <span className="h-5 w-5 rounded-full bg-[#C9A052] text-[#0F1420] text-[10px] font-black flex items-center justify-center flex-shrink-0">
                  1
                </span>
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <div className="text-[9px] uppercase font-mono tracking-wider opacity-70">Step 1</div>
                <div className="truncate text-xs">Quotation</div>
              </div>
            </div>

            <div className={`w-4 sm:w-8 h-0.5 ${!isQuoteStage ? "bg-emerald-500" : "bg-gray-700"}`} />

            {/* Step 2: Contract */}
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all flex-1 ${
                isContractStage
                  ? "bg-[#C9A052]/20 border-[#C9A052] text-[#C9A052] ring-1 ring-[#C9A052]"
                  : isBooked
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-400"
                  : "bg-gray-900/60 border-gray-800 text-gray-500"
              }`}
            >
              {isContractStage ? (
                <span className="h-5 w-5 rounded-full bg-[#C9A052] text-[#0F1420] text-[10px] font-black flex items-center justify-center flex-shrink-0">
                  2
                </span>
              ) : isBooked ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              ) : (
                <span className="h-5 w-5 rounded-full bg-gray-800 text-gray-400 text-[10px] font-black flex items-center justify-center flex-shrink-0">
                  2
                </span>
              )}
              <div className="min-w-0">
                <div className="text-[9px] uppercase font-mono tracking-wider opacity-70">Step 2</div>
                <div className="truncate text-xs">Contract</div>
              </div>
            </div>

            <div className={`w-4 sm:w-8 h-0.5 ${isBooked ? "bg-emerald-500" : "bg-gray-700"}`} />

            {/* Step 3: Booked Contract */}
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all flex-1 ${
                isBooked
                  ? "bg-[#C9A052]/20 border-[#C9A052] text-[#C9A052] ring-1 ring-[#C9A052]"
                  : "bg-gray-900/60 border-gray-800 text-gray-500"
              }`}
            >
              <span
                className={`h-5 w-5 rounded-full text-[10px] font-black flex items-center justify-center flex-shrink-0 ${
                  isBooked ? "bg-[#C9A052] text-[#0F1420]" : "bg-gray-800 text-gray-400"
                }`}
              >
                3
              </span>
              <div className="min-w-0">
                <div className="text-[9px] uppercase font-mono tracking-wider opacity-70">Step 3</div>
                <div className="truncate text-xs">Booked Contract</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Action Document Generation Bar according to Flow:
              Quote -> Contract -> Booked contract: From here, you can generate: Flight briefs, Invoice, credit note */}
          <div className="p-4 rounded-2xl bg-white border border-[#E0DAD0] shadow-sm">
            <div className="flex items-center justify-between mb-2.5">
              <span className="block text-[10px] font-mono uppercase tracking-wider text-[#0F1420]/60 font-bold">
                {isBooked ? "Booked Flight Operations & Billing Documents" : isContractStage ? "Contract Execution & Signature" : "Quotation Phase Documents"}
              </span>
              <span className="text-[10px] font-mono font-bold text-[#C9A052]">
                {isBooked ? "Booked Contract Active" : isContractStage ? "Contract Stage" : "Quote Stage"}
              </span>
            </div>

            {isBooked ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* Flight Brief */}
                <button
                  onClick={() => openDocument(booking, "flight_brief")}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] font-extrabold text-xs transition-all shadow-sm cursor-pointer"
                  title="Generate Operational Flight Brief with FBO & Crew details"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Flight Brief</span>
                </button>

                {/* Tax Invoice */}
                <button
                  onClick={() => openDocument(booking, "invoice")}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] font-extrabold text-xs transition-all shadow-sm cursor-pointer"
                  title="Generate Official Tax Invoice"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Tax Invoice</span>
                </button>

                {/* Credit Note */}
                <button
                  onClick={() => openDocument(booking, "credit_note")}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-red-100 hover:bg-red-200 text-red-900 border border-red-300 font-extrabold text-xs transition-all shadow-sm cursor-pointer"
                  title="Generate Official Credit Note Adjustment"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-red-700" />
                  <span>Credit Note</span>
                </button>

                {/* Charter Agreement */}
                <button
                  onClick={() => openDocument(booking, "charter_agreement")}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#141A29] hover:bg-[#1C2436] text-[#C9A052] font-extrabold text-xs transition-all shadow-sm cursor-pointer"
                  title="View Executed Charter Agreement"
                >
                  <ScrollText className="w-3.5 h-3.5" />
                  <span>Agreement</span>
                </button>
              </div>
            ) : isContractStage ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => openDocument(booking, "charter_agreement")}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] font-extrabold text-xs transition-all shadow-sm cursor-pointer"
                >
                  <ScrollText className="w-3.5 h-3.5" />
                  <span>View Contract</span>
                </button>

                <button
                  onClick={() => openDocument(booking, "quotation")}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#F5F2EC] hover:bg-[#EBE5DB] text-[#0F1420] font-extrabold text-xs border border-[#E0DAD0] transition-all shadow-sm cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#C9A052]" />
                  <span>Review Quote</span>
                </button>

                <button
                  onClick={() => convertQuoteToBooked(booking.id)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all shadow-sm cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Execute & Book</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => openDocument(booking, "quotation")}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] font-extrabold text-xs transition-all shadow-sm cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Quotation</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedBookingForDetail(null);
                    setActiveNav("generate_contract");
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#141A29] hover:bg-[#1C2436] text-[#C9A052] font-extrabold text-xs transition-all shadow-sm cursor-pointer"
                >
                  <ScrollText className="w-3.5 h-3.5" />
                  <span>Proceed to Contract</span>
                </button>

                <button
                  onClick={() => convertQuoteToBooked(booking.id)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all shadow-sm cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm Booking</span>
                </button>
              </div>
            )}
          </div>

          {/* Client & Aircraft Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Client Card */}
            <div className="p-4 rounded-2xl bg-white border border-[#E0DAD0] shadow-sm space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b border-[#E0DAD0]">
                <User className="w-4 h-4 text-[#C9A052]" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                  Client Profile
                </h3>
              </div>
              <p className="text-sm font-extrabold text-[#0F1420]">{booking.client.fullName}</p>
              {booking.client.companyName && (
                <p className="text-xs text-[#0F1420]/70 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-gray-400" />
                  <span>{booking.client.companyName}</span>
                </p>
              )}
              <p className="text-xs text-[#0F1420]/70 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <span>{booking.client.email}</span>
              </p>
              <p className="text-xs text-[#0F1420]/70 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span>{booking.client.phone}</span>
              </p>
              <p className="text-xs text-gray-500 font-mono text-[11px] pt-1">
                {booking.client.streetAddress}, {booking.client.cityPostalCountry}
              </p>
            </div>

            {/* Aircraft Card */}
            <div className="p-4 rounded-2xl bg-white border border-[#E0DAD0] shadow-sm space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b border-[#E0DAD0]">
                <Plane className="w-4 h-4 text-[#C9A052]" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                  Aircraft Details
                </h3>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-[#0F1420]">{booking.aircraft.name}</span>
                <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-[#C9A052]/15 text-[#9A7A35] border border-[#C9A052]/30">
                  {booking.aircraft.registration || "OE-FFB"}
                </span>
              </div>
              <div className="text-xs text-[#0F1420]/75 space-y-1">
                <p>Category: <strong className="text-[#0F1420]">{booking.aircraft.categoryLabel}</strong></p>
                <p>Seats: <strong className="text-[#0F1420]">{booking.aircraft.passengers} VIP seats</strong></p>
                <p>Hourly Rate: <strong className="text-[#0F1420] font-mono">€{booking.aircraft.pricePerHour}/hr</strong></p>
                <p>Range: <strong className="text-[#0F1420] font-mono">{booking.aircraft.range} nm</strong></p>
              </div>
            </div>
          </div>

          {/* Flight Legs & Routing */}
          <div className="p-5 rounded-2xl bg-white border border-[#E0DAD0] shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[#E0DAD0]">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#C9A052]" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                  Flight Itinerary & Schedule
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-[#C9A052]">
                {booking.legs.filter((l) => !l.isCancelled).length} Active {booking.legs.filter((l) => !l.isCancelled).length === 1 ? "Leg" : "Legs"}
                {booking.legs.some((l) => l.isCancelled) && ` (${booking.legs.filter((l) => l.isCancelled).length} Cancelled)`}
              </span>
            </div>

            <div className="space-y-3">
              {booking.legs.map((leg) => {
                const isCancelled = leg.isCancelled;
                return (
                  <div
                    key={leg.legNumber}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCancelled
                        ? "bg-red-50/60 border-red-200 opacity-85"
                        : "bg-[#F5F2EC] border-[#E0DAD0]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-6 w-6 rounded-full font-mono text-xs font-bold flex items-center justify-center ${
                          isCancelled
                            ? "bg-red-200 text-red-900 border border-red-300"
                            : "bg-[#C9A052]/20 text-[#9A7A35] border border-[#C9A052]/40"
                        }`}
                      >
                        {leg.legNumber}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-extrabold text-sm font-mono ${isCancelled ? "line-through text-red-900" : "text-[#0F1420]"}`}>
                            {leg.origin.icao} ({leg.origin.city})
                          </span>
                          <span className={isCancelled ? "text-red-400" : "text-[#C9A052] font-bold"}>→</span>
                          <span className={`font-extrabold text-sm font-mono ${isCancelled ? "line-through text-red-900" : "text-[#0F1420]"}`}>
                            {leg.destination.icao} ({leg.destination.city})
                          </span>
                          {isCancelled && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-600 text-white shadow-xs">
                              CANCELLED
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#0F1420]/60">
                          {leg.origin.name} to {leg.destination.name}
                        </p>
                        {isCancelled && leg.cancellationReason && (
                          <p className="text-[10px] text-red-700 font-mono mt-1">
                            Reason: {leg.cancellationReason} {leg.cancelledAt ? `(${leg.cancelledAt})` : ""}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right text-xs font-mono space-y-1">
                      <p className={`font-bold ${isCancelled ? "text-red-800 line-through" : "text-[#0F1420]"}`}>
                        {leg.flightDate} • Dep: {leg.departureTimeLocal}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Duration: {leg.flightTimeFormatted} • Call: {leg.flightNumber || "PEU842"}
                      </p>
                      {isCancelled && (
                        <div className="flex items-center justify-end gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => openDocument(booking, "quotation")}
                            className="text-[10px] px-2 py-0.5 rounded bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span>Prior Quote</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openDocument(booking, "invoice")}
                            className="text-[10px] px-2 py-0.5 rounded bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span>Prior Invoice</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Archived Route Revisions History */}
            {booking.routeRevisions && booking.routeRevisions.length > 0 && (
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E0DAD0] space-y-2 mt-3">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0F1420]">
                    Superseded Route Revision History ({booking.routeRevisions.length})
                  </span>
                </div>
                {booking.routeRevisions.map((rev, rIdx) => (
                  <div key={rIdx} className="text-xs p-2 rounded bg-white border border-[#E0DAD0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-[#0F1420]">Revision #{rIdx + 1}: {rev.reason}</span>
                      <p className="text-[10px] text-gray-500 font-mono">
                        Revised on {rev.date} by {rev.author} • Superseded Price: {formatCurrency(rev.previousPrice, booking.pricing.currency)} → New Price: {formatCurrency(rev.newPrice, booking.pricing.currency)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openDocument(booking, "quotation")}
                        className="text-[10px] px-2 py-1 rounded bg-[#F5F2EC] hover:bg-[#EBE5DB] text-[#0F1420] font-bold border border-[#E0DAD0]"
                      >
                        Pull Quote
                      </button>
                      <button
                        onClick={() => openDocument(booking, "invoice")}
                        className="text-[10px] px-2 py-1 rounded bg-[#F5F2EC] hover:bg-[#EBE5DB] text-[#0F1420] font-bold border border-[#E0DAD0]"
                      >
                        Pull Invoice
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing Breakdown Card */}
          <div className="p-5 rounded-2xl bg-white border border-[#E0DAD0] shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[#E0DAD0]">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#C9A052]" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                  Financial Breakdown (Active Route Only)
                </h3>
              </div>
              <span className="text-xs font-mono text-gray-500">
                Currency: {booking.pricing.currency}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-[#F5F2EC] border border-[#E0DAD0]">
                <span className="text-[10px] text-gray-500 font-mono">BASE FLIGHT CHARTER</span>
                <p className="font-extrabold font-mono text-sm text-[#0F1420]">
                  {formatCurrency(booking.pricing.flightPrice, booking.pricing.currency)}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-[#F5F2EC] border border-[#E0DAD0]">
                <span className="text-[10px] text-gray-500 font-mono">AIRPORT & TAXES</span>
                <p className="font-extrabold font-mono text-sm text-[#0F1420]">
                  {formatCurrency(booking.pricing.airportFees + booking.pricing.passengerFees, booking.pricing.currency)}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-[#F5F2EC] border border-[#E0DAD0]">
                <span className="text-[10px] text-gray-500 font-mono">SERVICES & CATERING</span>
                <p className="font-extrabold font-mono text-sm text-[#0F1420]">
                  {formatCurrency(booking.pricing.additionalServicesTotal, booking.pricing.currency)}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-[#0F1420] text-white">
                <span className="text-[10px] text-[#C9A052] font-mono">TOTAL REVISED PRICE</span>
                <p className="font-black font-mono text-base text-white">
                  {formatCurrency(booking.pricing.totalFlightPrice, booking.pricing.currency)}
                </p>
              </div>
            </div>
          </div>

          {/* Charter Contract Execution Status Card */}
          <div className="p-5 rounded-2xl bg-white border border-[#E0DAD0] shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[#E0DAD0]">
              <div className="flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-[#C9A052]" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                  Charter Contract Agreement Execution
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-[#C9A052]">
                {booking.isContractSigned ? "Agreement Signed" : "Pending Signature"}
              </span>
            </div>

            {booking.isContractSigned ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold font-mono">CONTRACT FULLY EXECUTED & SIGNED</h4>
                    <p className="text-[11px] text-emerald-800">
                      Signed by: <strong className="font-semibold">{booking.contractSignedBy || booking.client.fullName}</strong> • Date: {booking.contractSignedDate || "30/06/2026"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => openDocument(booking, "charter_agreement")}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold font-mono transition-colors shadow-xs"
                >
                  View Contract
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <PenTool className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold font-mono">CONTRACT AWAITING CLIENT EXECUTION</h4>
                    <p className="text-[11px] text-amber-800">
                      Signing updates booking state to officially locked charter status.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSignModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#0F1420] hover:bg-[#1A2338] text-[#C9A052] font-black text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                >
                  Sign & Execute Contract
                </button>
              </div>
            )}
          </div>

          {/* Credit Notes & Balance Settlement Section */}
          <div className="p-5 rounded-2xl bg-white border border-[#E0DAD0] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-[#E0DAD0]">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-red-600" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                  Credit Notes, Settlements & Balances
                </h3>
              </div>
              <button
                onClick={() => {
                  setCreditRevTotal(booking.pricing.totalFlightPrice || 15000);
                  setShowCreditModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Create Credit Note / Pull Balance</span>
              </button>
            </div>

            {/* Issued Credit Notes List */}
            {booking.creditNotes && booking.creditNotes.length > 0 ? (
              <div className="space-y-2">
                {booking.creditNotes.map((cn) => (
                  <div
                    key={cn.id}
                    className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E0DAD0] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#0F1420]">{cn.creditNoteNumber}</span>
                        <span className="text-[10px] text-gray-500 font-mono">Issued {cn.issueDate}</span>
                      </div>
                      <p className="text-xs text-gray-700 mt-0.5">{cn.reason}</p>
                      <div className="flex items-center gap-3 text-[11px] font-mono mt-1 text-gray-600">
                        {cn.cancellationFee ? <span>Cancellation Fee: €{cn.cancellationFee.toLocaleString()}</span> : null}
                        {cn.complementaryDeduction ? <span>Comp Services: €{cn.complementaryDeduction.toLocaleString()}</span> : null}
                      </div>
                    </div>

                    <div className="text-right">
                      {cn.weOweClient && cn.weOweClient > 0 ? (
                        <div className="text-emerald-700 font-bold font-mono text-xs">
                          We Owe Client: {formatCurrency(cn.weOweClient, booking.pricing.currency)} (Credit / Refund)
                        </div>
                      ) : cn.clientOwes && cn.clientOwes > 0 ? (
                        <div className="text-amber-800 font-bold font-mono text-xs">
                          Client Owes: {formatCurrency(cn.clientOwes, booking.pricing.currency)}
                        </div>
                      ) : null}
                      <button
                        onClick={() => openDocument(booking, "credit_note")}
                        className="mt-1 text-[11px] px-2.5 py-1 rounded bg-[#0F1420] hover:bg-[#1A2338] text-[#C9A052] font-bold transition-colors cursor-pointer"
                      >
                        View Credit Note PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">
                No credit note adjustments or balance disputes issued for this mission yet.
              </p>
            )}
          </div>

          {/* Trip Action History & Audit Trail Section */}
          <div className="p-5 rounded-2xl bg-white border border-[#E0DAD0] shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[#E0DAD0]">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#C9A052]" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                  Trip Action History & Audit Log
                </h3>
              </div>
              <span className="text-xs font-mono text-gray-500">
                {(booking.tripActionAudit || []).length} Actions Logged
              </span>
            </div>

            <div className="space-y-2">
              {(booking.tripActionAudit && booking.tripActionAudit.length > 0) ? (
                booking.tripActionAudit.map((audit) => (
                  <div
                    key={audit.id}
                    className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E0DAD0] flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#0F1420]">{audit.action}</span>
                        <span className="text-[10px] font-mono text-gray-400">• {audit.performedBy || audit.author}</span>
                      </div>
                      <p className="text-gray-600">{audit.details}</p>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 whitespace-nowrap">
                      {audit.timestamp}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-xs text-gray-400 font-mono">
                  Initial charter creation logged. Subsequent updates will appear here.
                </div>
              )}
            </div>
          </div>

          {/* Interactive Dispatch Checklist Section */}
          <div className="p-5 rounded-2xl bg-white border border-[#E0DAD0] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-[#E0DAD0]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C9A052]" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                  Operational Dispatch Checklist
                </h3>
              </div>
              <span className={`text-xs font-bold font-mono ${percentComplete === 100 ? "text-emerald-700" : "text-[#C9A052]"}`}>
                {completedSteps}/{totalSteps} Cleared ({percentComplete}%)
              </span>
            </div>

            {!isBooked && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Operational dispatch checklist and ATC slot clearances activate upon contract confirmation.</span>
              </div>
            )}

            {/* Live Progress Bar */}
            <div className="w-full h-2 rounded-full bg-[#E0DAD0] overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  percentComplete === 100 ? "bg-emerald-600" : "bg-[#C9A052]"
                }`}
                style={{ width: `${percentComplete}%` }}
              />
            </div>

            {/* Checklist Items */}
            <div className="space-y-2">
              {booking.checklist.map((step) => {
                const isDone = step.isCompleted;
                return (
                  <div
                    key={step.id}
                    onClick={() => toggleChecklistItem(booking.id, step.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                      isDone
                        ? "bg-emerald-50/70 border-emerald-300 hover:border-emerald-400"
                        : "bg-[#F5F2EC] border-[#E0DAD0] hover:border-[#C9A052]"
                    }`}
                  >
                    <div className="pt-0.5">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400 flex-shrink-0 hover:text-[#C9A052]" />
                      )}
                    </div>

                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-bold ${isDone ? "text-emerald-900 line-through opacity-80" : "text-[#0F1420]"}`}>
                          {step.label}
                        </span>
                        {step.requiredForDispatch && (
                          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            Required
                          </span>
                        )}
                      </div>

                      {step.notes && (
                        <p className="text-[11px] text-gray-600 italic">
                          {step.notes}
                        </p>
                      )}

                      {isDone && step.completedAt && (
                        <p className="text-[10px] text-emerald-700 font-mono">
                          Cleared at {step.completedAt} {step.completedBy && `by ${step.completedBy}`}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Drawer Actions */}
        <div className="p-4 bg-white border-t border-[#E0DAD0] flex items-center justify-between gap-3">
          <div className="text-xs font-mono text-[#0F1420]/70">
            Booking ID: <strong className="text-[#0F1420]">{booking.id}</strong>
          </div>

          <div className="flex items-center gap-2">
            {!isBooked ? (
              <button
                onClick={() => convertQuoteToBooked(booking.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Book Flight</span>
              </button>
            ) : booking.status !== "dispatched" && (
              <button
                onClick={() => updateBookingStatus(booking.id, "dispatched")}
                disabled={!isAllRequiredDone}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  isAllRequiredDone
                    ? "bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] shadow-md cursor-pointer"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                <PlaneTakeoff className="w-4 h-4" />
                <span>Clear & Dispatch Flight</span>
              </button>
            )}

            <button
              onClick={() => setSelectedBookingForDetail(null)}
              className="px-4 py-2 rounded-xl bg-[#0F1420] hover:bg-[#1A2338] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Credit Note & Settlement Modal */}
        {showCreditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-white border border-[#E0DAD0] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E0DAD0]">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-red-600" />
                  <h3 className="font-extrabold text-base text-[#0F1420]">
                    Create Credit Note & Pull Balances
                  </h3>
                </div>
                <button
                  onClick={() => setShowCreditModal(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E0DAD0] grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-gray-500">Trip Reference</span>
                    <p className="font-bold font-mono text-[#0F1420]">{booking.tripNumber}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-gray-500">Client Account</span>
                    <p className="font-bold text-[#0F1420]">{booking.client.fullName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-gray-600 mb-1">
                      Original Invoiced Total (€)
                    </label>
                    <input
                      type="number"
                      readOnly
                      value={booking.pricing.totalFlightPrice}
                      className="w-full bg-gray-100 border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 font-mono font-bold text-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-gray-600 mb-1">
                      Revised / New Route Amount (€)
                    </label>
                    <input
                      type="number"
                      value={creditRevTotal}
                      onChange={(e) => setCreditRevTotal(Number(e.target.value))}
                      className="w-full bg-[#FAF8F5] border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-gray-600 mb-1">
                      Cancellation Charges (€)
                    </label>
                    <input
                      type="number"
                      value={cancellationFeeInput}
                      onChange={(e) => setCancellationFeeInput(Number(e.target.value))}
                      placeholder="0"
                      className="w-full bg-[#FAF8F5] border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-gray-600 mb-1">
                      Complementary Services / Credit (€)
                    </label>
                    <input
                      type="number"
                      value={complementaryInput}
                      onChange={(e) => setComplementaryInput(Number(e.target.value))}
                      placeholder="0"
                      className="w-full bg-[#FAF8F5] border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                </div>

                {/* Pulled Balance Result Box */}
                {(() => {
                  const orig = booking.pricing.totalFlightPrice || 15000;
                  const rev = creditRevTotal;
                  let clientOwes = 0;
                  let weOweClient = 0;

                  if (rev > orig) {
                    clientOwes = rev - orig + cancellationFeeInput - complementaryInput;
                  } else {
                    weOweClient = orig - rev - cancellationFeeInput + complementaryInput;
                  }

                  return (
                    <div className="p-3.5 rounded-xl bg-[#0F1420] text-white space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[#C9A052] font-bold">
                        PULLED BALANCE SETTLEMENT
                      </span>
                      {weOweClient > 0 ? (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-emerald-400 font-bold">Money We Owe Client (Refund / Credit):</span>
                          <span className="text-base font-black font-mono text-emerald-400">€{weOweClient.toLocaleString()}</span>
                        </div>
                      ) : clientOwes > 0 ? (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-amber-400 font-bold">Money Client Owes Us (Balance Due):</span>
                          <span className="text-base font-black font-mono text-amber-400">€{clientOwes.toLocaleString()}</span>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-300">Net balance is €0 (Full parity)</div>
                      )}
                    </div>
                  );
                })()}

                <div>
                  <label className="block text-[10px] font-mono uppercase text-gray-600 mb-1">
                    Settlement Reason / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={creditReasonInput}
                    onChange={(e) => setCreditReasonInput(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E0DAD0] rounded-lg p-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E0DAD0]">
                <button
                  type="button"
                  onClick={() => setShowCreditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const orig = booking.pricing.totalFlightPrice || 15000;
                    const rev = creditRevTotal;
                    let clientOwes = 0;
                    let weOweClient = 0;
                    if (rev > orig) {
                      clientOwes = rev - orig + cancellationFeeInput - complementaryInput;
                    } else {
                      weOweClient = orig - rev - cancellationFeeInput + complementaryInput;
                    }

                    const netBalance = weOweClient > 0 ? -weOweClient : clientOwes;

                    issueCreditNote(booking.id, {
                      amount: Math.abs(orig - rev),
                      originalTotal: orig,
                      newTotal: rev,
                      cancellationFee: cancellationFeeInput,
                      complementaryDeduction: complementaryInput,
                      reason: creditReasonInput,
                      clientOwes: clientOwes > 0 ? clientOwes : 0,
                      weOweClient: weOweClient > 0 ? weOweClient : 0,
                      netBalance
                    });
                    setShowCreditModal(false);
                    openDocument(booking, "credit_note");
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs transition-colors shadow-sm cursor-pointer"
                >
                  Issue Credit Note & View PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contract Signing Modal */}
        {showSignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-white border border-[#E0DAD0] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E0DAD0]">
                <div className="flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-[#C9A052]" />
                  <h3 className="font-extrabold text-base text-[#0F1420]">
                    Sign & Execute Charter Contract
                  </h3>
                </div>
                <button
                  onClick={() => setShowSignModal(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-gray-600">
                  By executing this charter agreement, the contract status transitions to legally binding, and the booking is confirmed on the fleet schedule.
                </p>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-gray-600 mb-1">
                    Signatory Full Legal Name
                  </label>
                  <input
                    type="text"
                    value={signerInput}
                    onChange={(e) => setSignerInput(e.target.value)}
                    placeholder="e.g. Edward Brinkmann"
                    className="w-full bg-[#FAF8F5] border border-[#E0DAD0] rounded-lg px-3 py-2 text-xs font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] space-y-1">
                  <span className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Immediate System Effect
                  </span>
                  <p>
                    Once signed, bookings automatically transition from Quote/Contract stage into Confirmed Active Bookings.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E0DAD0]">
                <button
                  type="button"
                  onClick={() => setShowSignModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    signCharterContract(booking.id, signerInput);
                    setShowSignModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                >
                  Execute & Sign Agreement
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
