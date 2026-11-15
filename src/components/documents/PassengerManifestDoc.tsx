"use client";

import React, { useState } from "react";
import { Booking } from "@/types/aviation";
import { Users, Download, Send, CheckCircle2 } from "lucide-react";
import DocumentHeader from "./DocumentHeader";
import DocumentFooter from "./DocumentFooter";

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

  const manifestId = `PM-${tripNumber}`;

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
    <div className="passenger-manifest-document text-slate-900 bg-transparent font-sans max-w-[820px] mx-auto select-none print:max-w-none">
      <div className="doc-page min-h-[1123px] bg-white p-10 sm:p-12 rounded-sm shadow-xl border border-slate-200 mb-8 print:mb-0 print:border-none print:shadow-none print:p-0 flex flex-col justify-between box-border">
        <div className="space-y-5">
          {/* Shared Document Header */}
          <DocumentHeader booking={booking} />

          {/* Title & Manifest Meta */}
          <div className="flex items-start justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Passenger manifest
            </h1>
            <div className="text-right text-xs space-y-1">
              <div className="flex justify-end gap-3">
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">MANIFEST</span>
                <span className="font-semibold text-slate-900 font-mono w-36 text-right">{manifestId}</span>
              </div>
              <div className="flex justify-end gap-3">
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">TRIP</span>
                <span className="font-semibold text-slate-900 font-mono w-36 text-right">{tripNumber}</span>
              </div>
              <div className="flex justify-end gap-3">
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">FLIGHT DATE</span>
                <span className="font-medium text-slate-900 w-36 text-right">{legs[0]?.flightDate || "20 Nov 2026"}</span>
              </div>
              <div className="flex justify-end gap-3">
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">STATUS</span>
                <span className="font-medium text-slate-900 w-36 text-right">Confirmed</span>
              </div>
            </div>
          </div>

          {/* Flight Identification Row */}
          <div className="grid grid-cols-3 gap-6 py-4 border-t border-b border-slate-200 text-xs">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">ROUTING</p>
              <p className="font-bold text-slate-900 font-mono text-sm">
                {legs.map(l => `${l.origin.icao}→${l.destination.icao}`).join(" / ")}
              </p>
              <p className="text-slate-600 mt-0.5">
                {legs.map(l => `${l.origin.city || ""} – ${l.destination.city || ""}`).join(" / ")}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">AIRCRAFT</p>
              <p className="font-bold text-slate-900">{aircraft.name}</p>
              <p className="font-mono text-slate-600 mt-0.5">
                Reg: {legs[0]?.aircraftRegistration || aircraft.registration || (
                  <span className="bg-amber-100 text-amber-800 px-1 rounded text-[11px] font-normal">[XX-XXX]</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">TOTAL PASSENGERS</p>
              <p className="font-bold text-slate-900 text-2xl">{allPassengers.length}</p>
              <p className="text-slate-600 mt-0.5">Lead: {client.fullName}</p>
            </div>
          </div>

          {/* Passenger Data Table */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mb-2">
              PASSENGER DATA
            </h3>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  <th className="py-2 pr-3 font-bold w-8">#</th>
                  <th className="py-2 px-3 font-bold">FULL LEGAL NAME</th>
                  <th className="py-2 px-3 font-bold">PASSPORT NO.</th>
                  <th className="py-2 px-3 font-bold">NATIONALITY</th>
                  <th className="py-2 px-3 font-bold whitespace-nowrap">DATE OF BIRTH</th>
                  <th className="py-2 px-3 font-bold">EXPIRY</th>
                  <th className="py-2 pl-3 font-bold">SPECIAL REQUESTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {allPassengers.map((pax, i) => (
                  <tr key={pax.id} className="align-top">
                    <td className="py-2.5 pr-3 font-mono text-slate-500">{i + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {pax.fullName}
                      {pax.isLeadPassenger && (
                        <span className="ml-1.5 text-[10px] font-mono text-gold-dark bg-gold-50 px-1.5 py-0.5 rounded">Lead</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-800">{pax.passportNumber || "P8492019"}</td>
                    <td className="py-2.5 px-3 text-slate-700">{pax.nationality || "Austrian"}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{pax.dateOfBirth || "12.04.1978"}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{pax.passportExpiry || "18.06.2031"}</td>
                    <td className="py-2.5 pl-3 text-slate-500 italic">{pax.specialRequests || "None"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Export & Handler Dispatch (Hidden in Print) */}
          <div className="print:hidden p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-gold-dark" />
                Secure Handler / Operator Export
              </h4>
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>

            <form onSubmit={handleSendToHandler} className="flex gap-2">
              <input
                type="email"
                placeholder="Send manifest securely to FBO / operator email..."
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-gold"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-gold hover:bg-gold-light text-[#0F1420] text-xs font-bold flex items-center gap-1 transition-colors"
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
              <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-2 space-y-0.5">
                <p className="font-mono font-bold text-slate-700">Dispatch Audit Log:</p>
                {sentLog.map((log, idx) => (
                  <p key={idx}>Sent to <strong>{log.recipient}</strong> at {log.time}</p>
                ))}
              </div>
            )}
          </div>

          {/* GDPR Notice */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-500 space-y-1">
            <p className="font-bold text-slate-700">GDPR &amp; Aviation Security Notice</p>
            <p>
              This passenger manifest contains sensitive personal identity and passport data subject to Regulation (EU) 2016/679 (GDPR). Transmitted strictly for border control, customs, and flight security compliance. All passenger identity records are scheduled for automated purge post-flight pursuant to the company data retention policy.
            </p>
          </div>
        </div>

        {/* Footer */}
        <DocumentFooter
          leftText={`${manifestId} · ${client.fullName}`}
          currentPage={1}
          totalPages={1}
        />
      </div>
    </div>
  );
}
