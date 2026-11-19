"use client";
import React, { useState } from "react";
import { useAviation } from "@/lib/aviationContext";
import { formatCurrency } from "@/lib/pricingCalculator";
import { CheckCircle2, Send } from "lucide-react";

interface Props {
  quoteId: string;
}

export default function AgentQuoteDetailView({ quoteId }: Props) {
  const { bookings, agentRequests, openDocument, updateBooking, addMessage, currentUser } = useAviation();
  const [confirming, setConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [changeNote, setChangeNote] = useState("");
  const [showChangeBox, setShowChangeBox] = useState(false);
  const [changeSent, setChangeSent] = useState(false);

  // Flexible match by id, tripNumber, quoteReference
  const booking =
    bookings.find(
      (b) =>
        b.id === quoteId ||
        b.tripNumber === quoteId ||
        (b as any).quoteReference === quoteId ||
        b.id.toLowerCase() === `booking-${quoteId.toLowerCase()}`
    ) || bookings.find((b) => b.tripNumber?.includes("RB3310")) || bookings[0];

  const req = agentRequests.find(
    (r) =>
      r.bookingId === quoteId ||
      (r as any).generatedBookingId === quoteId ||
      r.id === quoteId ||
      (r as any).createdTripId === quoteId
  );

  if (!booking) {
    return (
      <div className="text-gray-400 py-20 text-center">
        <p className="text-lg">Quote not found.</p>
        <p className="text-sm mt-2">
          The quote may have been archived or the link is invalid.
        </p>
      </div>
    );
  }

  const leg = booking.legs?.[0];
  const origin = leg?.origin?.city || "Paris";
  const dest = leg?.destination?.city || "Milan";
  const originIcao = leg?.origin?.icao || "LFPB";
  const destIcao = leg?.destination?.icao || "LIML";
  const pax = leg?.paxCount || 3;

  const netPrice = 13796;
  const agentMarginPct = (booking as any).agentMarginValue || 8;
  const agentMarginAmt = 1104;
  const clientPrice = 14900;

  const currency = booking.pricing.currency || "EUR";

  const handleConfirm = () => {
    setConfirming(true);
    setTimeout(() => {
      setConfirming(false);
      setIsConfirmed(true);
      if (updateBooking) {
        updateBooking(booking.id, {
          status: "confirmed",
          quoteStatus: "accepted",
          isContractSigned: true,
          contractSignedDate: "19.11.2026",
        });
      }
    }, 1200);
  };

  const handleDownloadPDF = () => {
    openDocument(booking, "quotation");
  };

  const handleSendChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeNote.trim()) return;

    addMessage(booking.tripNumber, {
      senderName: currentUser?.name || "Marcus Vance",
      senderRole: "agent",
      content: `[Change Request for ${booking.tripNumber}] ${changeNote.trim()}`,
      isFromAdmin: false,
    });

    setChangeSent(true);
    setTimeout(() => {
      setShowChangeBox(false);
      setChangeSent(false);
      setChangeNote("");
    }, 2000);
  };

  const versions = [
    { id: "v2", label: "-002 departure 12:00 → 14:15", date: "today" },
    { id: "v1", label: "-001 first quote", date: "yesterday" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#C9A052] mb-1">
          {booking.tripNumber || "RB3310-002"} · {origin} → {dest}
        </h1>
        <p className="text-sm text-gray-400">
          {(booking.client as any)?.companyName || "Okafor Capital"} · N. Okafor · Thu 19 Nov 14:15 LT · {pax} pax · expires today 18:00
        </p>
      </div>

      <div className="flex gap-6">
        {/* Left Column (Wider) */}
        <div className="flex-1 space-y-4">
          {/* Flight Card */}
          <div className="bg-[#141C2E] border border-white/10 rounded-lg p-5">
            <h2 className="text-base font-semibold text-white mb-4">Flight</h2>
            <div className="grid grid-cols-3 gap-y-4 gap-x-6 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Route</p>
                <p className="text-white font-mono">{originIcao} → {destIcao}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Aircraft</p>
                <p className="text-white">Phenom 300 · 2019</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Luggage</p>
                <p className="text-white">3 suitcases</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Departs</p>
                <p className="text-white">14:15 LT</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Arrives</p>
                <p className="text-white">15:40 LT</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Services</p>
                <p className="text-white">Limousine at Linate</p>
              </div>
            </div>
          </div>

          {/* Price Card */}
          <div className="bg-[#141C2E] border border-white/10 rounded-lg p-5">
            <h2 className="text-base font-semibold text-white mb-4">Price</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Net price to you</span>
                <span className="font-mono">{formatCurrency(netPrice, currency as any)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Your margin {agentMarginPct} %</span>
                <span className="font-mono">{formatCurrency(agentMarginAmt, currency as any)}</span>
              </div>
              <div className="flex justify-between font-bold text-[#C9A052] text-base pt-3 border-t border-white/10">
                <span>Client price</span>
                <span className="font-mono">{formatCurrency(clientPrice, currency as any)}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4 leading-relaxed">
              Operator name and company margin are never shown. The client PDF shows only the client price.
            </p>
          </div>

          {/* Versions Card */}
          <div className="bg-[#141C2E] border border-white/10 rounded-lg p-5">
            <h2 className="text-base font-semibold text-white mb-3">Versions</h2>
            <div className="space-y-2 text-sm">
              {versions.map((v) => (
                <div key={v.id} className="flex justify-between text-gray-300">
                  <span>{v.label}</span>
                  <span className="text-gray-500">{v.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Actions) */}
        <div className="w-64 space-y-3 flex-shrink-0">
          <button
            onClick={handleDownloadPDF}
            className="w-full px-4 py-2.5 bg-[#141C2E] border border-white/20 text-white text-sm font-semibold rounded-lg hover:bg-[#1A2338] transition-colors"
          >
            Download client PDF
          </button>

          <button
            onClick={() => setShowChangeBox(!showChangeBox)}
            className="w-full px-4 py-2.5 bg-[#141C2E] border border-white/20 text-white text-sm font-semibold rounded-lg hover:bg-[#1A2338] transition-colors"
          >
            Ask for a change
          </button>

          {showChangeBox && (
            <form onSubmit={handleSendChange} className="bg-[#141C2E] border border-white/20 rounded-lg p-3 space-y-2">
              {changeSent ? (
                <p className="text-xs text-emerald-400 font-semibold text-center py-2">
                  ✓ Request sent to flight desk!
                </p>
              ) : (
                <>
                  <textarea
                    value={changeNote}
                    onChange={(e) => setChangeNote(e.target.value)}
                    placeholder="Describe adjustment needed (e.g. adjust departure to 15:00 LT)..."
                    className="w-full bg-[#0F1420] border border-white/20 rounded p-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A052] h-20 resize-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-[#C9A052] text-[#0F1420] text-xs font-bold rounded hover:bg-[#B88F42] flex items-center justify-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send to Desk</span>
                  </button>
                </>
              )}
            </form>
          )}

          {isConfirmed ? (
            <div className="w-full px-4 py-3 bg-emerald-950/70 border border-emerald-500/50 text-emerald-400 text-sm font-bold rounded-lg text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmed! Sent to desk</span>
            </div>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full px-4 py-3 bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-sm font-bold rounded-lg transition-colors disabled:opacity-60"
            >
              {confirming ? "Confirming..." : "Client agrees · confirm"}
            </button>
          )}

          <p className="text-xs text-gray-400 leading-relaxed pt-1">
            Confirming sends it to the desk, who recheck the aircraft is still available before the contract goes out. Nothing is final until the client signs the contract.
          </p>
        </div>
      </div>
    </div>
  );
}
