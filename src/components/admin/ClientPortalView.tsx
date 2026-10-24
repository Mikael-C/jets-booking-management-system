"use client";

import React, { useState } from "react";
import { useAviation } from "@/lib/aviationContext";
import { formatCurrency } from "@/lib/pricingCalculator";
import { PassengerManifestItem } from "@/types/aviation";
import {
  CheckCircle2,
  XCircle,
  Pen,
  FileText,
  CreditCard,
  Landmark,
  User,
  Upload,
  Plane,
  Download,
  Shield,
  Plus,
  Check,
  Lock,
  Link
} from "lucide-react";

type PortalTab = "quote" | "signature" | "passengers" | "payment" | "brief";

export default function ClientPortalView() {
  const { bookings, openDocument, updateBookingStatus, addAuditEntry, currentUser } = useAviation();

  const [selectedBookingId, setSelectedBookingId] = useState<string>(bookings[0]?.id || "");
  const [activeTab, setActiveTab] = useState<PortalTab>("quote");

  // E-Signature State (CLI-3)
  const [signerName, setSignerName] = useState("");
  const [signerAgrees, setSignerAgrees] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [signatureTimestamp, setSignatureTimestamp] = useState("");

  // Quote action state (CLI-2)
  const [declineReason, setDeclineReason] = useState("");
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [quoteAccepted, setQuoteAccepted] = useState(false);
  const [quoteLinkCopied, setQuoteLinkCopied] = useState(false);

  // Passenger state (CLI-4 + CLI-5)
  const [passengers, setPassengers] = useState<PassengerManifestItem[]>([
    { id: "pax-1", fullName: "", isLeadPassenger: true }
  ]);
  const [passengersSaved, setPassengersSaved] = useState(false);

  // Payment state (CLI-6)
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank">("bank");

  // Flight brief acknowledged (CLI-7)
  const [briefAcknowledged, setBriefAcknowledged] = useState(false);
  const [briefAckTime, setBriefAckTime] = useState("");

  const booking = bookings.find((b) => b.id === selectedBookingId) || bookings[0];

  if (!booking) {
    return (
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-12 text-center text-xs text-gray-500">
        No bookings available to preview client portal.
      </div>
    );
  }

  const handleAcceptQuote = () => {
    setQuoteAccepted(true);
    setShowDeclineForm(false);
    setActiveTab("signature");
    addAuditEntry({
      userEmail: currentUser?.email || "client@email.com",
      userName: booking.client.fullName,
      action: "Quote Accepted",
      entityType: "Quote",
      entityId: booking.tripNumber,
      details: `Client accepted quote for trip ${booking.tripNumber}`
    });
  };

  const handleDeclineQuote = () => {
    addAuditEntry({
      userEmail: currentUser?.email || "client@email.com",
      userName: booking.client.fullName,
      action: "Quote Declined",
      entityType: "Quote",
      entityId: booking.tripNumber,
      details: `Client declined quote. Reason: ${declineReason || "No reason given"}`
    });
    setShowDeclineForm(false);
    setDeclineReason("");
  };

  const handleSign = () => {
    if (!signerName.trim() || !signerAgrees) return;
    const ts = new Date().toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    }) + " UTC";
    setSignatureTimestamp(ts);
    setIsSigned(true);
    updateBookingStatus(booking.id, "accepted");
    addAuditEntry({
      userEmail: currentUser?.email || "client@email.com",
      userName: booking.client.fullName,
      action: "Charter Agreement E-Signed",
      entityType: "Document",
      entityId: booking.tripNumber,
      details: `E-signed by: "${signerName}" at ${ts} — IP: 185.x.x.x — Device: Web Browser`
    });
    setTimeout(() => setActiveTab("passengers"), 1500);
  };

  const handlePassengerChange = (id: string, field: keyof PassengerManifestItem, value: string | boolean) => {
    setPassengers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSavePassengers = () => {
    setPassengersSaved(true);
    addAuditEntry({
      userEmail: currentUser?.email || "client@email.com",
      userName: booking.client.fullName,
      action: "Passenger Data Submitted",
      entityType: "Booking",
      entityId: booking.tripNumber,
      details: `${passengers.length} passenger(s) submitted for trip ${booking.tripNumber}`
    });
  };

  const handleCopyClientLink = () => {
    const link = `https://app.orbelo.com/portal/${booking.id}?token=expiring-secure-token`;
    navigator.clipboard.writeText(link).catch(() => {});
    setQuoteLinkCopied(true);
    setTimeout(() => setQuoteLinkCopied(false), 2500);
  };

  const tabDefs: { id: PortalTab; label: string; icon: React.ReactNode }[] = [
    { id: "quote", label: "Quote & Options", icon: <FileText className="w-3.5 h-3.5" /> },
    { id: "signature", label: "E-Signature", icon: <Pen className="w-3.5 h-3.5" /> },
    { id: "passengers", label: "Passenger Data", icon: <User className="w-3.5 h-3.5" /> },
    { id: "payment", label: "Payment", icon: <CreditCard className="w-3.5 h-3.5" /> },
    { id: "brief", label: "Flight Brief", icon: <Plane className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/15 text-[#9A7A35] border border-[#C9A052]/30 uppercase">
                CLIENT PORTAL PREVIEW
              </span>
              <span className="text-xs text-[#0F1420]/60">Simulating the client experience</span>
            </div>
            <h2 className="text-xl font-black text-[#0F1420] tracking-tight">
              Trip {booking.tripNumber} — {booking.client.fullName}
            </h2>
            <p className="text-xs text-[#0F1420]/60 mt-0.5">
              {booking.legs.map(l => `${l.origin.icao}→${l.destination.icao}`).join(" / ")} · {booking.legs[0]?.flightDate}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedBookingId}
              onChange={(e) => {
                setSelectedBookingId(e.target.value);
                setActiveTab("quote");
                setIsSigned(false);
                setQuoteAccepted(false);
                setPassengersSaved(false);
                setBriefAcknowledged(false);
              }}
              className="bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-1.5 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
            >
              {bookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.tripNumber} — {b.client.fullName}
                </option>
              ))}
            </select>
            <button
              onClick={handleCopyClientLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F1420] text-white text-xs font-bold transition-all hover:bg-[#1A2338]"
            >
              {quoteLinkCopied ? <Check className="w-3.5 h-3.5 text-[#C9A052]" /> : <Link className="w-3.5 h-3.5" />}
              {quoteLinkCopied ? "Link Copied!" : "Copy Client Link"}
            </button>
          </div>
        </div>
      </div>

      {/* Step Tabs */}
      <div className="flex gap-1 overflow-x-auto bg-white border border-[#E0DAD0] rounded-2xl p-2 shadow-sm">
        {tabDefs.map((tab, i) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-1 justify-center ${
              activeTab === tab.id
                ? "bg-[#C9A052] text-[#0F1420] shadow-sm"
                : "text-[#0F1420]/60 hover:text-[#0F1420] hover:bg-[#F5F2EC]"
            }`}
          >
            {tab.icon}
            <span className="hidden md:inline">{tab.label}</span>
            <span className="md:hidden">{i + 1}</span>
          </button>
        ))}
      </div>

      {/* ── QUOTE TAB (CLI-1 + CLI-2) ── */}
      {activeTab === "quote" && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0DAD0]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#C9A052]" />
                <h3 className="text-sm font-bold text-[#0F1420]">Charter Quote — {booking.tripNumber}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                  Valid until: {booking.quoteExpirationDate}
                </span>
                <button onClick={() => openDocument(booking, "quotation")} className="flex items-center gap-1 text-xs text-[#C9A052] hover:text-[#B88F42] font-bold">
                  View PDF
                </button>
              </div>
            </div>

            {/* Itinerary */}
            <div className="space-y-2">
              {booking.legs.map((leg) => (
                <div key={leg.legNumber} className="flex items-center gap-3 p-3 bg-[#F5F2EC] rounded-xl text-xs">
                  <span className="font-mono font-black text-[#C9A052] w-5 text-center">{leg.legNumber}</span>
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div>
                      <p className="font-bold text-[#0F1420] font-mono">{leg.origin.icao}</p>
                      <p className="text-gray-500 text-[10px]">{leg.origin.city}</p>
                      <p className="text-gray-500 text-[10px]">{leg.departureTimeLocal}</p>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <Plane className="w-4 h-4 text-[#C9A052] mx-auto" />
                        <p className="text-[10px] text-gray-500 mt-0.5">{leg.flightTimeFormatted}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#0F1420] font-mono">{leg.destination.icao}</p>
                      <p className="text-gray-500 text-[10px]">{leg.destination.city}</p>
                      <p className="text-gray-500 text-[10px]">{leg.arrivalTimeLocal}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#0F1420]">{leg.flightDate}</p>
                    <p className="text-[10px] text-gray-500">{leg.paxCount} pax</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Aircraft */}
            <div className="p-3 bg-[#F5F2EC] rounded-xl text-xs flex justify-between items-center">
              <div>
                <p className="font-bold text-[#0F1420]">{booking.aircraft.name}</p>
                <p className="text-gray-500">{booking.aircraft.categoryLabel} · {booking.aircraft.passengers} seats</p>
              </div>
              <p className="text-[10px] text-gray-400 font-mono text-right max-w-xs">
                Operator identity disclosed in the confirmed flight brief
              </p>
            </div>

            {/* Price */}
            <div className="border-t border-[#E0DAD0] pt-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#0F1420]/60">TOTAL CHARTER PRICE</span>
                <span className="text-2xl font-black text-[#0F1420] font-mono">
                  {formatCurrency(booking.pricing.totalFlightPrice, booking.pricing.currency)}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                {booking.pricing.vatRate === 0
                  ? "VAT exempt — international private charter"
                  : `Incl. ${(booking.pricing.vatRate * 100).toFixed(0)}% VAT`}
                {" · Payment due: "}{booking.paymentDueDate}
              </p>
            </div>
          </div>

          {/* Accept / Decline / Request Changes (CLI-2) */}
          {!quoteAccepted ? (
            <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-3">
              <h3 className="text-xs font-bold font-mono uppercase text-[#0F1420]/70 tracking-wider">Your Decision</h3>
              {!showDeclineForm ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAcceptQuote}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black transition-all shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Accept This Quote
                  </button>
                  <button
                    onClick={() => setShowDeclineForm(true)}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#F5F2EC] hover:bg-[#EAE6DE] text-[#0F1420] text-sm font-bold border border-[#D1C9BC] transition-all"
                  >
                    <XCircle className="w-4 h-4 text-red-500" />
                    Decline
                  </button>
                  <button className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#F5F2EC] hover:bg-[#EAE6DE] text-[#0F1420] text-sm font-bold border border-[#D1C9BC] transition-all">
                    Request Changes
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    placeholder="Tell us why you are declining (optional)..."
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    rows={3}
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052] resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleDeclineQuote} className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700">
                      Confirm Decline
                    </button>
                    <button onClick={() => setShowDeclineForm(false)} className="px-4 py-2 rounded-xl bg-[#F5F2EC] text-[#0F1420] text-xs font-bold border border-[#D1C9BC]">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-emerald-800 text-sm">Quote Accepted — please sign the charter agreement</p>
                <button onClick={() => setActiveTab("signature")} className="text-xs text-emerald-700 underline mt-0.5">
                  Proceed to E-Signature →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── E-SIGNATURE TAB (CLI-3) ── */}
      {activeTab === "signature" && (
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E0DAD0]">
            <Lock className="w-4 h-4 text-[#C9A052]" />
            <h3 className="text-sm font-bold text-[#0F1420]">Electronic Signature — Charter Agreement</h3>
          </div>

          {isSigned ? (
            <div className="text-center space-y-3 py-4">
              <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-black text-lg text-[#0F1420]">Agreement Signed Successfully</h4>
              <div className="p-4 bg-[#F5F2EC] rounded-xl text-xs space-y-1 text-left max-w-md mx-auto">
                <p><strong>Signed by:</strong> {signerName}</p>
                <p><strong>Timestamp:</strong> {signatureTimestamp}</p>
                <p><strong>Document:</strong> Charter Agreement — {booking.tripNumber}</p>
                <p><strong>Status:</strong> <span className="text-emerald-700 font-bold">Legally binding e-signature recorded</span></p>
              </div>
              <button
                onClick={() => openDocument(booking, "charter_agreement")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C9A052] text-[#0F1420] text-xs font-bold mx-auto"
              >
                <Download className="w-3.5 h-3.5" />
                Download Signed Agreement PDF
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-[#F5F2EC] rounded-xl text-xs text-[#0F1420]/80 border border-[#E0DAD0]">
                <p className="font-bold text-[#0F1420]">Charter Agreement — {booking.tripNumber}</p>
                <p className="mt-1">By signing below you confirm that you have read and agree to the charter terms and conditions. This constitutes a legally binding electronic signature under applicable law.</p>
                <button
                  onClick={() => openDocument(booking, "charter_agreement")}
                  className="text-[#C9A052] underline font-bold mt-1 inline-flex items-center gap-1"
                >
                  Read Full Agreement
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0F1420]/70 font-mono mb-1.5">
                  Type Your Full Legal Name to Sign *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Edward Brinkmann"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-3 text-sm font-bold italic text-[#0F1420] focus:outline-none focus:border-[#C9A052] focus:ring-1 focus:ring-[#C9A052]"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-[#E0DAD0] bg-[#FDFCFA]">
                <input
                  type="checkbox"
                  checked={signerAgrees}
                  onChange={(e) => setSignerAgrees(e.target.checked)}
                  className="mt-0.5"
                />
                <span className="text-xs text-[#0F1420]/80">
                  I confirm I have read and agree to the charter agreement, cancellation policy, and payment schedule. I understand this is a legally binding commitment.
                </span>
              </label>

              <button
                onClick={handleSign}
                disabled={!signerName.trim() || !signerAgrees}
                className="w-full py-3 px-4 rounded-xl bg-[#0F1420] hover:bg-[#1A2338] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-black transition-all flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4 text-[#C9A052]" />
                Sign Charter Agreement
              </button>

              <p className="text-[10px] text-center text-gray-400">
                Your signature, timestamp, IP address, and device fingerprint are recorded and stored with the document hash.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── PASSENGER DATA TAB (CLI-4 + CLI-5) ── */}
      {activeTab === "passengers" && (
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E0DAD0]">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#C9A052]" />
              <h3 className="text-sm font-bold text-[#0F1420]">
                Passenger Details ({passengers.length} of {booking.legs[0]?.paxCount || 4} passengers)
              </h3>
            </div>
            {passengersSaved && (
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
              </span>
            )}
          </div>

          {passengers.map((pax, idx) => (
            <div key={pax.id} className="border border-[#E0DAD0] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#0F1420] uppercase font-mono">
                  Passenger {idx + 1} {pax.isLeadPassenger && <span className="text-[#C9A052]">(Lead Booker)</span>}
                </h4>
                {!pax.isLeadPassenger && (
                  <button
                    onClick={() => setPassengers((p) => p.filter((x) => x.id !== pax.id))}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                {[
                  { label: "Full Name as in Passport *", field: "fullName" as const, placeholder: "John Michael Doe" },
                  { label: "Nationality", field: "nationality" as const, placeholder: "Austrian" },
                  { label: "Date of Birth", field: "dateOfBirth" as const, placeholder: "15.03.1978" },
                  { label: "Passport Number", field: "passportNumber" as const, placeholder: "P1234567" },
                  { label: "Passport Expiry", field: "passportExpiry" as const, placeholder: "31.12.2030" },
                  { label: "Dietary / Special Requests", field: "specialRequests" as const, placeholder: "Gluten-free, wheelchair..." },
                ].map(({ label, field, placeholder }) => (
                  <div key={field}>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#0F1420]/60 font-mono mb-1">{label}</label>
                    <input
                      type="text"
                      placeholder={placeholder}
                      value={(pax[field] as string) || ""}
                      onChange={(e) => handlePassengerChange(pax.id, field, e.target.value)}
                      className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                ))}
              </div>
              {/* Passport Upload (CLI-5) */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F5F2EC] border border-dashed border-[#D1C9BC] cursor-pointer hover:bg-[#EAE6DE] transition-all">
                <Upload className="w-3.5 h-3.5 text-[#C9A052]" />
                <span className="text-[11px] text-[#0F1420]/70">Upload passport scan (optional) — PDF, JPG, PNG</span>
              </div>
            </div>
          ))}

          <div className="flex gap-3">
            <button
              onClick={() => setPassengers((p) => [...p, { id: `pax-${Date.now()}`, fullName: "", isLeadPassenger: false }])}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F5F2EC] border border-[#D1C9BC] text-[#0F1420] text-xs font-bold hover:bg-[#EAE6DE]"
            >
              <Plus className="w-3.5 h-3.5" /> Add Passenger
            </button>
            <button
              onClick={handleSavePassengers}
              className="flex-1 py-2 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-xs font-black transition-all"
            >
              Save Passenger Data
            </button>
          </div>

          {passengersSaved && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
              Passenger data saved. You can return and update before departure.
            </div>
          )}
        </div>
      )}

      {/* ── PAYMENT TAB (CLI-6) ── */}
      {activeTab === "payment" && (
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E0DAD0]">
            <CreditCard className="w-4 h-4 text-[#C9A052]" />
            <h3 className="text-sm font-bold text-[#0F1420]">Payment — Invoice #{booking.invoiceNumber}</h3>
          </div>

          {/* Invoice Summary */}
          <div className="space-y-1.5 text-xs">
            {[
              { label: "Charter flight price", value: booking.pricing.flightPrice },
              { label: "Airport fees & navigation", value: booking.pricing.airportFees },
              { label: "Passenger charges", value: booking.pricing.passengerFees },
            ].filter(i => i.value > 0).map(item => (
              <div key={item.label} className="flex justify-between py-1 border-b border-[#F5F2EC]">
                <span className="text-[#0F1420]/70">{item.label}</span>
                <span className="font-bold">{formatCurrency(item.value, booking.pricing.currency)}</span>
              </div>
            ))}
            <div className="flex justify-between py-2 font-bold">
              <span className="text-[#0F1420]">Total Due</span>
              <span className="text-xl font-black font-mono text-[#0F1420]">{formatCurrency(booking.pricing.totalFlightPrice, booking.pricing.currency)}</span>
            </div>
          </div>

          {/* Method selector */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#F5F2EC] rounded-xl border border-[#E0DAD0]">
            {(["bank", "card"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${paymentMethod === m ? "bg-[#0F1420] text-white shadow" : "text-[#0F1420]/70 hover:text-[#0F1420]"}`}
              >
                {m === "bank" ? <Landmark className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                {m === "bank" ? "Bank Transfer" : "Card / SEPA"}
              </button>
            ))}
          </div>

          {paymentMethod === "bank" && (
            <div className="p-4 bg-[#F5F2EC] rounded-xl border border-[#E0DAD0] text-xs space-y-2">
              <p className="font-bold text-[#0F1420]">Wire Transfer Details</p>
              <div className="space-y-1.5 font-mono">
                {[
                  ["Account Name", booking.operator.accountHolder],
                  ["IBAN", booking.operator.iban],
                  ["BIC/SWIFT", booking.operator.bic],
                  ["Bank", booking.operator.bankName],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-500">{label}:</span>
                    <span className="font-bold">{val}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-[#E0DAD0] pt-2 mt-1">
                  <span className="text-gray-500">Payment Reference:</span>
                  <span className="font-black text-[#C9A052]">{booking.invoiceNumber}</span>
                </div>
              </div>
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-700 font-bold text-[11px]">Always include reference: <span className="font-mono">{booking.invoiceNumber}</span></p>
              </div>
            </div>
          )}

          {paymentMethod === "card" && (
            <div className="p-4 bg-[#F5F2EC] rounded-xl border border-[#E0DAD0] text-xs space-y-2">
              <p className="font-bold text-[#0F1420]">Secure Card / SEPA Payment via Stripe</p>
              <p className="text-gray-500">You will be redirected to our secure Stripe payment page. Card, SEPA Direct Debit, and other EU payment methods supported.</p>
              <button className="w-full py-3 rounded-xl bg-[#635BFF] hover:bg-[#4F48CC] text-white font-bold text-xs transition-all mt-1">
                Pay {formatCurrency(booking.pricing.totalFlightPrice, booking.pricing.currency)} securely via Stripe →
              </button>
              <p className="text-[10px] text-gray-400 text-center">256-bit SSL · PCI DSS Level 1 compliant</p>
            </div>
          )}

          <div className="flex items-center gap-2 p-3 bg-[#F5F2EC] rounded-xl text-xs">
            <Shield className="w-4 h-4 text-[#C9A052]" />
            <span className="text-[#0F1420]/70">
              Payment status:{" "}
              <strong className={booking.paymentStatus === "fully_paid" ? "text-emerald-700" : "text-amber-700"}>
                {booking.paymentStatus === "fully_paid" ? "PAID IN FULL" : booking.paymentStatus === "deposit_paid" ? "DEPOSIT RECEIVED" : "PENDING"}
              </strong>
              {" · "}Due: {booking.paymentDueDate}
            </span>
          </div>
        </div>
      )}

      {/* ── FLIGHT BRIEF TAB (CLI-7) ── */}
      {activeTab === "brief" && (
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E0DAD0]">
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-[#C9A052]" />
              <h3 className="text-sm font-bold text-[#0F1420]">Flight Brief — {booking.tripNumber}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono bg-[#0F1420] text-white px-2 py-0.5 rounded font-bold">
                v{booking.quoteVersion || 1}
              </span>
              <button onClick={() => openDocument(booking, "flight_brief")} className="flex items-center gap-1 text-xs text-[#C9A052] font-bold">
                <Download className="w-3.5 h-3.5" /> Download PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-[#F5F2EC] rounded-xl">
              <p className="text-[10px] font-mono uppercase text-gray-400 mb-1">Aircraft</p>
              <p className="font-bold text-[#0F1420]">{booking.aircraft.name}</p>
              <p className="text-gray-500">Reg: {booking.legs[0]?.aircraftRegistration || "TBC"}</p>
            </div>
            {booking.legs.map((leg) => (
              <div key={leg.legNumber} className="p-3 bg-[#F5F2EC] rounded-xl">
                <p className="text-[10px] font-mono uppercase text-gray-400 mb-1">Leg {leg.legNumber} — {leg.flightDate}</p>
                <p className="font-bold text-[#0F1420] font-mono">{leg.origin.icao} → {leg.destination.icao}</p>
                <p className="text-gray-500">{leg.departureTimeLocal} → {leg.arrivalTimeLocal} · {leg.flightTimeFormatted}</p>
                <p className="text-gray-500 mt-1 text-[10px]">Dep FBO: {leg.departureHandling?.name || "TBC"}</p>
                <p className="text-gray-500 text-[10px]">Arr FBO: {leg.arrivalHandling?.name || "TBC"}</p>
              </div>
            ))}
          </div>

          {/* Version history */}
          <div className="border-t border-[#E0DAD0] pt-3">
            <p className="text-[10px] font-mono uppercase text-gray-400 mb-2">Version History</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between py-1 border-b border-[#F5F2EC]">
                <span className="font-bold text-[#0F1420]">Version {booking.quoteVersion || 1} (Current)</span>
                <span className="text-gray-400">{new Date(booking.updatedAt || booking.createdAt).toLocaleDateString()}</span>
              </div>
              {(booking.quoteVersion || 1) > 1 && Array.from({ length: (booking.quoteVersion || 1) - 1 }, (_, i) => (
                <div key={i} className="flex justify-between py-1 text-gray-400">
                  <span>Version {i + 1} (Archived — Admin only)</span>
                  <span>Previous revision</span>
                </div>
              ))}
            </div>
          </div>

          {/* Acknowledge button */}
          {!briefAcknowledged ? (
            <button
              onClick={() => {
                const ts = new Date().toLocaleString();
                setBriefAcknowledged(true);
                setBriefAckTime(ts);
                addAuditEntry({
                  userEmail: currentUser?.email || "client@email.com",
                  userName: booking.client.fullName,
                  action: "Flight Brief Acknowledged",
                  entityType: "Document",
                  entityId: booking.tripNumber,
                  details: `Client acknowledged flight brief v${booking.quoteVersion || 1} at ${ts}`
                });
              }}
              className="w-full py-3 rounded-xl bg-[#0F1420] hover:bg-[#1A2338] text-white text-sm font-black transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 text-[#C9A052]" />
              I Have Read and Acknowledge This Flight Brief
            </button>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
              Flight brief acknowledged at {briefAckTime}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
