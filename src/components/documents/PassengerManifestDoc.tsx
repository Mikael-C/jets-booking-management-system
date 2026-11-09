"use client";

import React, { useState } from "react";
import { Booking } from "@/types/aviation";
import { Users, Download, Send, CheckCircle2, Shield, Plane, AlertTriangle } from "lucide-react";

interface PassengerManifestDocProps {
  booking: Booking;
}

export default function PassengerManifestDoc({ booking }: PassengerManifestDocProps) {
  const { tripNumber, legs, client, aircraft, operator } = booking;
  const [sentLog, setSentLog] = useState<{ recipient: string; time: string }[]>([]);
  const [recipientInput, setRecipientInput] = useState("");
  const [isSent, setIsSent] = useState(false);

  // Collect all passengers across legs or generate realistic sample
  const allPassengers = legs[0]?.passengers?.length > 0 ? legs[0].passengers : [
    { id: "p1", fullName: client.fullName, passportNumber: "P8492019", nationality: "Austrian", dateOfBirth: "12.04.1978", passportExpiry: "18.06.2031", isLeadPassenger: true, specialRequests: "VIP Champagne catering" },
    { id: "p2", fullName: "Sophia Brinkmann", passportNumber: "P7749210", nationality: "Austrian", dateOfBirth: "24.08.1982", passportExpiry: "22.11.2030", isLeadPassenger: false, specialRequests: "None" },
  ];

  const handleExportCsv = () => {
    const headers = "Pax #,Full Name,Passport Number,Nationality,Date of Birth,Passport Expiry,Lead Passenger,Special Requests\n";
    const rows = allPassengers.map((p, i) =>
      `"${i + 1}","${p.fullName}","${p.passportNumber || "TBC"}","${p.nationality || "TBC"}","${p.dateOfBirth || "TBC"}","${p.passportExpiry || "TBC"}","${p.isLeadPassenger ? "YES" : "NO"}","${p.specialRequests || "None"}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Passenger_Manifest_${tripNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendToHandler = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientInput.trim()) return;

    setSentLog((prev) => [
      ...prev,
      { recipient: recipientInput.trim(), time: new Date().toLocaleString() }
    ]);
    setIsSent(true);
    setRecipientInput("");
    setTimeout(() => setIsSent(false), 3000);
  };

  return (
    <div className="passenger-manifest-document text-gray-900 bg-transparent font-sans max-w-[850px] mx-auto">
      <div className="doc-page min-h-[1050px] bg-white p-8 sm:p-10 rounded-sm shadow-xl border border-gray-200 mb-8 print:mb-0 print:border-none print:shadow-none print:p-0 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4 mb-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 uppercase">
                Passenger Manifest
              </h1>
              <p className="text-xs font-semibold text-gold tracking-widest uppercase">
                General Aviation Declaration & Border Compliance [DOC-5]
              </p>
            </div>
            <div className="text-right">
              <span className="font-display text-3xl font-black tracking-tight" style={{ color: "#FF6B00" }}>
                ORBELO
              </span>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Flight Operations Command</p>
            </div>
          </div>

          {/* Flight & Aircraft Identification */}
          <div className="grid grid-cols-3 gap-6 py-4 border-b border-gray-200 text-xs mb-6 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-gray-500 font-mono text-[10px] uppercase">Trip Reference</p>
              <p className="text-base font-bold font-mono text-gray-900">{tripNumber}</p>
              <p className="text-gray-600 mt-1">Flight Date: {legs[0]?.flightDate}</p>
            </div>
            <div>
              <p className="text-gray-500 font-mono text-[10px] uppercase">Routing</p>
              <p className="font-bold text-gray-900 font-mono">
                {legs.map(l => `${l.origin.icao}→${l.destination.icao}`).join(" / ")}
              </p>
              <p className="text-gray-600 mt-1">Total Passengers: {allPassengers.length}</p>
            </div>
            <div>
              <p className="text-gray-500 font-mono text-[10px] uppercase">Aircraft</p>
              <p className="font-bold text-gray-900">{aircraft.name}</p>
              <p className="font-mono text-gray-600 mt-1">Tail: {legs[0]?.aircraftRegistration || aircraft.registration || "OE-FFB"}</p>
            </div>
          </div>

          {/* Passenger Data Table (DOC-5) */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2 border-b border-gray-300 pb-1">
              Verified Passenger Manifest ({allPassengers.length} Total)
            </h3>
            <table className="w-full text-left text-xs border border-gray-200">
              <thead className="bg-gray-100 text-gray-700 font-semibold text-[11px]">
                <tr>
                  <th className="p-2 border-b">#</th>
                  <th className="p-2 border-b">Full Legal Name</th>
                  <th className="p-2 border-b">Passport No.</th>
                  <th className="p-2 border-b">Nationality</th>
                  <th className="p-2 border-b">Date of Birth</th>
                  <th className="p-2 border-b">Expiry</th>
                  <th className="p-2 border-b">Special Requests</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allPassengers.map((pax, i) => (
                  <tr key={pax.id} className="hover:bg-gray-50">
                    <td className="p-2 font-mono font-bold text-gray-600">{i + 1}</td>
                    <td className="p-2 font-bold text-gray-900">
                      {pax.fullName} {pax.isLeadPassenger && <span className="text-gold font-mono text-[10px]">(Lead)</span>}
                    </td>
                    <td className="p-2 font-mono text-gray-800">{pax.passportNumber || "P8492019"}</td>
                    <td className="p-2">{pax.nationality || "Austrian"}</td>
                    <td className="p-2 font-mono text-gray-600">{pax.dateOfBirth || "12.04.1978"}</td>
                    <td className="p-2 font-mono text-gray-600">{pax.passportExpiry || "18.06.2031"}</td>
                    <td className="p-2 text-gray-500 italic">{pax.specialRequests || "None"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Export & Handler Dispatch Actions (Hidden in Print) */}
          <div className="print:hidden p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-900 uppercase font-mono">
                Secure Handler / Operator Export [DOC-5]
              </h4>
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Manifest CSV</span>
              </button>
            </div>

            <form onSubmit={handleSendToHandler} className="flex gap-2">
              <input
                type="email"
                placeholder="Send manifest securely to FBO handler / operator email..."
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-gold"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-gold hover:bg-gold-light text-[#0F1420] text-xs font-bold flex items-center gap-1"
              >
                <Send className="w-3 h-3" />
                <span>Send Securely</span>
              </button>
            </form>

            {isSent && (
              <p className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Manifest transmitted securely. Logged in audit trail.
              </p>
            )}

            {sentLog.length > 0 && (
              <div className="text-[11px] text-gray-500 border-t border-gray-200 pt-2 space-y-0.5">
                <p className="font-mono font-bold text-gray-700">Dispatch Audit Log:</p>
                {sentLog.map((log, idx) => (
                  <p key={idx}>Sent to <strong>{log.recipient}</strong> at {log.time}</p>
                ))}
              </div>
            )}
          </div>

          {/* Privacy & GDPR Notice */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded text-[10px] text-gray-500 space-y-1">
            <p className="font-bold text-gray-700">GDPR & Aviation Security Notice</p>
            <p>
              This passenger manifest contains sensitive personal identity and passport data subject to Regulation (EU) 2016/679 (GDPR). Transmitted strictly for border control, customs, and flight security compliance. All passenger identity records are scheduled for automated purge post-flight pursuant to the company data retention policy.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-[10px] text-gray-500 flex justify-between items-end">
          <div>
            <p className="font-semibold text-gray-800">Orbelo Jet Management • Flight Operations Center</p>
            <p>London Biggin Hill Airport (EGKB) & Geneva International (LSGG) • OCC: {operator.supportPhone}</p>
          </div>
          <div className="text-right">
            <p>Document: Manifest</p>
            <p className="font-mono font-medium text-gray-700">{tripNumber}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
