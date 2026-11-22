"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plane, Shield, Sparkles, MessageCircle, ArrowRight, CheckCircle2, Clock, Phone, Mail, User } from "lucide-react";

export default function CardScanPage() {
  const params = useParams();
  const router = useRouter();
  const cardId = typeof params?.cardId === "string" ? params.cardId : "card-01";

  const [singleUseCode, setSingleUseCode] = useState<string>("");
  const [curatorName, setCuratorName] = useState<string>("Marcus Vance");
  const [curatorTier, setCuratorTier] = useState<string>("Founding Curator");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [routeRequest, setRouteRequest] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Generate fresh single-use introduction code per scan (NF-20)
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const code = `NFC-${cardId.toUpperCase()}-${randomHex}`;
    setSingleUseCode(code);

    // Look up curator by cardId
    const storedCurators: Record<string, { name: string; tier: string }> = {
      "card-01": { name: "Marcus Vance", tier: "Founding Curator" },
      "card-02": { name: "Elena Rostova", tier: "Founding Curator" },
      "card-07": { name: "Alexander Wright", tier: "Founding Curator" },
    };

    if (storedCurators[cardId]) {
      setCuratorName(storedCurators[cardId].name);
      setCuratorTier(storedCurators[cardId].tier);
    }

    // Log scan to localStorage for commission tracking
    try {
      const scansKey = "orbelo_nfc_scans";
      const existingScans = JSON.parse(localStorage.getItem(scansKey) || "[]");
      existingScans.push({
        cardId,
        code,
        timestamp: new Date().toISOString(),
        curatorName: storedCurators[cardId]?.name || "Founding Curator",
      });
      localStorage.setItem(scansKey, JSON.stringify(existingScans));
    } catch {
      // ignore
    }
  }, [cardId]);

  const handleSubmitLead = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Store lead in localStorage (Desk receives Lead straightaway, NF-19)
      const leadsKey = "orbelo_curator_leads";
      const existingLeads = JSON.parse(localStorage.getItem(leadsKey) || "[]");
      const newLead = {
        id: `LEAD-${Date.now()}`,
        clientName,
        clientPhone,
        clientEmail,
        routeRequest,
        curatorName,
        cardId,
        singleUseCode,
        commissionRemaining: 3, // NF-20: first 3 bookings commission attribution
        createdAt: new Date().toISOString(),
        status: "desk_contact_pending",
      };
      existingLeads.push(newLead);
      localStorage.setItem(leadsKey, JSON.stringify(existingLeads));
    } catch {
      // ignore
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#080D1A] text-white flex flex-col justify-between font-sans selection:bg-[#C9A052] selection:text-[#080D1A]">
      {/* Top Header */}
      <header className="border-b border-white/10 px-6 py-5 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#C9A052] to-[#F1D693] flex items-center justify-center font-bold text-[#080D1A]">
            <Plane className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-lg block leading-none font-display text-white">OrbAero</span>
            <span className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">Private Aviation</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-[#C9A052]">
            {singleUseCode || "VERIFYING..."}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto w-full px-6 py-12 flex-1 flex flex-col justify-center">
        {!submitted ? (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#C9A052]/10 text-[#C9A052] border border-[#C9A052]/30">
                <Sparkles className="w-3.5 h-3.5" /> Private Introduction
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-display">
                You&apos;ve Been Introduced by <br />
                <span className="text-[#C9A052]">{curatorName}</span>
              </h1>
              <p className="text-sm text-gray-400">
                {curatorTier} · Direct priority access to the OrbAero Operations Desk.
              </p>
            </div>

            {/* Introduction Card */}
            <div className="bg-[#101726] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs text-gray-400 font-mono">
                <span>Introduction ID: {singleUseCode}</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated
                </span>
              </div>

              <form onSubmit={handleSubmitLead} className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-300 font-medium mb-1">Your Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lord Edward Brinkmann"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-[#080D1A] border border-white/15 rounded-xl pl-9 pr-3.5 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 font-medium mb-1">Mobile / WhatsApp</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="tel"
                        required
                        placeholder="+44 7700 900120"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full bg-[#080D1A] border border-white/15 rounded-xl pl-9 pr-3.5 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#C9A052]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-300 font-medium mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="email"
                        required
                        placeholder="client@executive.com"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full bg-[#080D1A] border border-white/15 rounded-xl pl-9 pr-3.5 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#C9A052]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-1">Requested Flight or Destination (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. London (EGLF) to Geneva (LSGG) next Friday, 4 passengers"
                    value={routeRequest}
                    onChange={(e) => setRouteRequest(e.target.value)}
                    className="w-full bg-[#080D1A] border border-white/15 rounded-xl px-3.5 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#C9A052]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#C9A052] to-[#E2BE77] hover:from-[#B88F42] hover:to-[#D1AB63] text-[#080D1A] font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {isSubmitting ? (
                    <span>Routing to Operations Desk...</span>
                  ) : (
                    <>
                      <span>Connect with the Desk</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Instant WhatsApp Option */}
              <div className="pt-2 border-t border-white/10 text-center">
                <a
                  href={`https://wa.me/447700900120?text=${encodeURIComponent(`Hello OrbAero Desk, I was introduced by ${curatorName} (Code: ${singleUseCode}). I would like to request flight availability.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Or speak with the Operations Desk on WhatsApp directly</span>
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-5 bg-[#101726] border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold font-display text-white">Priority Introduction Received</h2>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Thank you, {clientName}. Our 24/7 Operations Desk has received your introduction via {curatorName}.
              </p>
            </div>

            <div className="p-4 bg-[#080D1A] rounded-xl border border-white/10 text-xs text-left space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-gray-500">Curator Attribution:</span>
                <span className="text-white font-bold">{curatorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Intro Reference:</span>
                <span className="text-[#C9A052] font-bold">{singleUseCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Response Window:</span>
                <span className="text-emerald-400 font-bold">&lt; 15 minutes</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              A private flight advisor will message your WhatsApp or reach out by email shortly with tailored aircraft options.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-4 text-center text-xs text-gray-600">
        © 2026 OrbAero Private Jet Management. Confidential luxury charter introducer network.
      </footer>
    </div>
  );
}
