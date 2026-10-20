"use client";

import React from "react";
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
  Building
} from "lucide-react";

export default function BookingDetailDrawer() {
  const {
    selectedBookingForDetail,
    setSelectedBookingForDetail,
    toggleChecklistItem,
    updateBookingStatus,
    openDocument,
    role
  } = useAviation();

  if (!selectedBookingForDetail) return null;
  const booking = selectedBookingForDetail;

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
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5">
            IN-PROGRESS ({status.toUpperCase().replace("_", " ")})
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
                  CHARTER TRIP RECORD
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-xs font-mono text-gray-300">Acc: {booking.accountNumber}</span>
              </div>
              <h2 className="text-xl font-black text-white flex items-center gap-2.5">
                Trip {booking.tripNumber}
              </h2>
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

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Action Document Generation Bar */}
          <div className="p-4 rounded-2xl bg-white border border-[#E0DAD0] shadow-sm">
            <span className="block text-[10px] font-mono uppercase tracking-wider text-[#0F1420]/60 font-bold mb-2.5">
              Generate & Download Documents
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => openDocument(booking, "quotation")}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] font-extrabold text-xs transition-all shadow-sm"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Quotation</span>
              </button>

              <button
                onClick={() => openDocument(booking, "invoice")}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] font-extrabold text-xs transition-all shadow-sm"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Tax Invoice</span>
              </button>

              <button
                onClick={() => openDocument(booking, "flight_brief")}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] font-extrabold text-xs transition-all shadow-sm"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Flight Brief</span>
              </button>

              <button
                onClick={() => openDocument(booking, "charter_agreement")}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] font-extrabold text-xs transition-all shadow-sm"
              >
                <ScrollText className="w-3.5 h-3.5" />
                <span>Agreement</span>
              </button>
            </div>
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
                {booking.legs.length} {booking.legs.length > 1 ? "Flight Legs" : "Flight Leg"}
              </span>
            </div>

            <div className="space-y-3">
              {booking.legs.map((leg) => (
                <div
                  key={leg.legNumber}
                  className="p-3.5 rounded-xl bg-[#F5F2EC] border border-[#E0DAD0] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-full bg-[#C9A052]/20 text-[#9A7A35] border border-[#C9A052]/40 font-mono text-xs font-bold flex items-center justify-center">
                      {leg.legNumber}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-[#0F1420] font-mono">
                          {leg.origin.icao} ({leg.origin.city})
                        </span>
                        <span className="text-[#C9A052] font-bold">→</span>
                        <span className="font-extrabold text-sm text-[#0F1420] font-mono">
                          {leg.destination.icao} ({leg.destination.city})
                        </span>
                      </div>
                      <p className="text-[11px] text-[#0F1420]/60">
                        {leg.origin.name} to {leg.destination.name}
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-xs font-mono space-y-0.5">
                    <p className="font-bold text-[#0F1420]">
                      {leg.flightDate} • Dep: {leg.departureTimeLocal}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Duration: {leg.flightTimeFormatted} • Call: {leg.flightNumber}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Breakdown Card */}
          <div className="p-5 rounded-2xl bg-white border border-[#E0DAD0] shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[#E0DAD0]">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#C9A052]" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                  Financial Breakdown
                </h3>
              </div>
              <span className="text-xs font-mono text-gray-500">
                Currency: {booking.pricing.currency}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-[#F5F2EC] border border-[#E0DAD0]">
                <span className="text-[10px] text-gray-500 font-mono">FLIGHT CHARTER</span>
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
                <span className="text-[10px] text-[#C9A052] font-mono">TOTAL FLIGHT PRICE</span>
                <p className="font-black font-mono text-base text-white">
                  {formatCurrency(booking.pricing.totalFlightPrice, booking.pricing.currency)}
                </p>
              </div>
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
            {booking.status !== "dispatched" && (
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
              className="px-4 py-2 rounded-xl bg-[#0F1420] hover:bg-[#1A2338] text-white text-xs font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
