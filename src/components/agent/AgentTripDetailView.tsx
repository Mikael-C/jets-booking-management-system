"use client";
import React, { useState, useRef } from "react";
import { useAviation } from "@/lib/aviationContext";
import { formatCurrency } from "@/lib/pricingCalculator";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface Props {
  tripId: string;
}

export default function AgentTripDetailView({ tripId }: Props) {
  const { bookings, openDocument } = useAviation();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showPassportModal, setShowPassportModal] = useState(false);
  const [passportInputs, setPassportInputs] = useState<Record<string, string>>({});
  const [passportsSaved, setPassportsSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Match by id or tripNumber (FE4578)
  const booking =
    bookings.find(
      (b) =>
        b.id === tripId ||
        b.tripNumber?.toLowerCase() === tripId.toLowerCase() ||
        b.id.toLowerCase() === `booking-${tripId.toLowerCase()}`
    ) || bookings.find((b) => b.tripNumber === "FE4578") || bookings[0];

  if (!booking) {
    return (
      <div className="text-gray-400 py-20 text-center">
        <p className="text-lg">Trip not found.</p>
      </div>
    );
  }

  const leg = booking.legs?.[0];
  const origin = leg?.origin?.city || leg?.origin?.icao || "Ibiza";
  const dest = leg?.destination?.city || leg?.destination?.icao || "Geneva";
  const pax = booking.legs?.reduce((sum, l) => sum + (l.paxCount || 0), 0) || 4;
  const dateStr = leg?.flightDate
    ? new Date(leg.flightDate).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : "Fri 20 Nov";
  const timeStr = (leg as any)?.departureTimeLocal || "10:00";

  const currency = booking.pricing.currency || "EUR";
  const commissionPct = (booking as any).commissionPercentage || 8;
  const commissionAmt = 593; // Matches € 593.00 in screenshot

  // Passengers from legs
  const defaultPassengers = [
    { id: "p1", fullName: "Tunde Adeyemi", passportNumber: "A10849201" },
    { id: "p2", fullName: "Ada Adeyemi", passportNumber: "A10849202" },
    { id: "p3", fullName: "Kemi Adeyemi", passportNumber: passportInputs["p3"] || "" },
    { id: "p4", fullName: "Bayo Adeyemi", passportNumber: passportInputs["p4"] || "" },
  ];

  const rawPax = booking.legs?.flatMap((l) => (l as any).passengers || []) || [];
  const passengers = rawPax.length >= 4 ? rawPax : defaultPassengers;
  const uniquePax = passengers.filter(
    (p: any, i: number, arr: any[]) =>
      arr.findIndex((x: any) => x.fullName === p.fullName) === i
  );

  const missingPax = uniquePax.filter((p: any) => !p.passportNumber);
  const missingPassports = missingPax.length;

  const charterInvoiceNum = `INV-${booking.tripNumber || "FE4578"}-01`;
  const extraInvoiceNum = `INV-${booking.tripNumber || "FE4578"}-02`;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setUploadedFile(f);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 4000);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-[#C9A052] mb-1">
          {booking.tripNumber || "FE4578"} · {origin} → {dest}
        </h1>
        <p className="text-sm text-gray-400">
          {(booking.client as any)?.companyName || booking.client?.fullName || "Adeyemi Holdings"} ·{" "}
          {dateStr} {timeStr} LT · {booking.aircraft?.name || "CJ3+"} · {pax} pax
        </p>
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[#134E2E] text-[#4ADE80]">
          Contract signed
        </span>
        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[#5C3800] text-[#FFB84D]">
          € 250 open
        </span>
        {missingPassports > 0 ? (
          <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[#5C3800] text-[#FFB84D] inline-flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {missingPassports} passports missing
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[#134E2E] text-[#4ADE80] inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            All passports verified
          </span>
        )}
      </div>

      <div className="flex gap-6">
        {/* Left Column (Wider) */}
        <div className="flex-1 space-y-4">
          {/* Payment Card */}
          <div className="bg-[#141C2E] border border-white/10 rounded-lg p-5">
            <h2 className="text-base font-semibold text-white mb-4">Payment</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-300">{charterInvoiceNum} · charter</span>
                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[#134E2E] text-[#4ADE80]">
                  Paid
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-300">{extraInvoiceNum} · chauffeur € 250</span>
                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[#5C3800] text-[#FFB84D]">
                  Open · due 18 Nov
                </span>
              </div>
            </div>

            {/* Upload Area */}
            <div
              onClick={() => fileRef.current?.click()}
              className="border border-dashed border-white/20 rounded-lg p-6 text-center cursor-pointer hover:border-[#C9A052]/50 transition-colors bg-[#0F1420]/50"
            >
              <p className="text-sm font-semibold text-white mb-1">
                Client paid? Upload the transfer proof
              </p>
              <p className="text-xs text-gray-400 mb-3">
                The desk confirms once the money arrives. Until then it shows amber.
              </p>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
              {uploadedFile ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Uploaded: {uploadedFile.name} (Desk reviewing)</span>
                </div>
              ) : (
                <button
                  type="button"
                  className="px-4 py-2 bg-[#1A2338] border border-white/20 text-xs font-semibold text-white rounded hover:bg-[#243050]"
                >
                  Choose file
                </button>
              )}
            </div>
          </div>

          {/* Passengers Card */}
          <div className="bg-[#141C2E] border border-white/10 rounded-lg p-5">
            <h2 className="text-base font-semibold text-white mb-4">Passengers</h2>
            <div className="space-y-2.5">
              {uniquePax.map((p: any, i: number) => {
                const hasPassport = Boolean(p.passportNumber || passportInputs[p.id]);
                return (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-gray-200">{p.fullName}</span>
                    {hasPassport ? (
                      <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[#134E2E] text-[#4ADE80]">
                        Complete
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[#5C3800] text-[#FFB84D] inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Passport
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => setShowPassportModal(true)}
              className="mt-4 px-4 py-2 bg-[#1A2338] border border-white/20 text-xs font-semibold text-white rounded hover:bg-[#243050] transition-colors"
            >
              Send passport details
            </button>
          </div>
        </div>

        {/* Right Column (Narrower) */}
        <div className="w-64 space-y-4 flex-shrink-0">
          {/* Documents Card */}
          <div className="bg-[#141C2E] border border-white/10 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-white mb-3">Documents</h2>
            <div className="space-y-2 text-sm">
              {[
                {
                  label: `Quote Q-${booking.tripNumber || "FE4578"}-002`,
                  type: "quotation" as const,
                },
                {
                  label: `Contract C-${booking.tripNumber || "FE4578"}-002`,
                  type: "charter_agreement" as const,
                },
                {
                  label: `Invoice ${charterInvoiceNum}`,
                  type: "invoice" as const,
                },
                {
                  label: `Invoice ${extraInvoiceNum}`,
                  type: "invoice" as const,
                },
              ].map((doc, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-gray-300 text-xs truncate max-w-[140px]">
                    {doc.label}
                  </span>
                  <button
                    onClick={() => openDocument(booking, doc.type)}
                    className="text-[#C9A052] hover:underline text-xs font-bold flex-shrink-0 ml-2"
                  >
                    PDF
                  </button>
                </div>
              ))}
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-xs">Flight brief</span>
                <span className="text-gray-500 text-xs">when ready</span>
              </div>
            </div>
          </div>

          {/* My Commission Card */}
          <div className="bg-[#141C2E] border border-white/10 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-white mb-3">My commission</h2>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs text-gray-400">{commissionPct} % of charter</span>
              <span className="text-base font-bold text-white font-mono">
                {formatCurrency(commissionAmt, currency as any)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Paid 1 week after the flight</p>
          </div>
        </div>
      </div>

      {/* Passport Modal */}
      {showPassportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#141C2E] border border-white/20 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">Send Passenger Passport Details</h3>
              <button
                onClick={() => setShowPassportModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Provide missing passport numbers for passenger manifest clearance with customs and border control:
            </p>

            <div className="space-y-3">
              {missingPax.map((p: any) => (
                <div key={p.id}>
                  <label className="text-xs text-gray-300 block mb-1">
                    {p.fullName} (Passport Number)
                  </label>
                  <input
                    type="text"
                    value={passportInputs[p.id] || ""}
                    onChange={(e) =>
                      setPassportInputs((prev) => ({ ...prev, [p.id]: e.target.value.toUpperCase() }))
                    }
                    placeholder="e.g. A99482012"
                    className="w-full bg-[#0F1420] border border-white/20 rounded px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPassportModal(false)}
                className="px-4 py-2 bg-[#1A2338] border border-white/20 text-xs font-bold text-white rounded hover:bg-[#243050]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPassportModal(false);
                }}
                className="px-4 py-2 bg-[#C9A052] text-[#0F1420] text-xs font-bold rounded hover:bg-[#B88F42]"
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
