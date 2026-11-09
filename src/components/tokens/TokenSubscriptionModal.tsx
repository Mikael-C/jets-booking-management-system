"use client";

import React, { useState } from "react";
import { useAviation } from "@/lib/aviationContext";
import {
  Coins,
  X,
  CheckCircle2,
  Sparkles,
  CreditCard,
  Building,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Zap,
  Clock,
  Layers,
  FileText,
  Compass,
  Receipt
} from "lucide-react";

export default function TokenSubscriptionModal() {
  const {
    isTokenModalOpen,
    closeTokenModal,
    tokenModalPrompt,
    tokenBalance,
    tokenTier,
    subscriptionStatus,
    subscriptionExpiresAt,
    subscribeOrRefillTokens
  } = useAviation();

  const [currency, setCurrency] = useState<"GBP" | "USD">("GBP");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "wire">("card");
  const [cardNumber, setCardNumber] = useState("•••• •••• •••• 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("•••");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isTokenModalOpen) return null;

  const price = currency === "USD" ? "$600" : "£500";
  const currencyLabel = currency === "USD" ? "USD ($)" : "GBP (£)";

  const handleSubscribe = async () => {
    setIsProcessing(true);
    setSuccessMessage(null);
    try {
      const res = await subscribeOrRefillTokens(currency, paymentMethod);
      if (res.success) {
        setSuccessMessage(`Success! 2,000 tokens credited to your account. Your new balance is ${res.tokens.toLocaleString()} tokens.`);
        setTimeout(() => {
          setIsProcessing(false);
          setSuccessMessage(null);
          closeTokenModal();
        }, 1800);
      }
    } catch {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1420]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white border border-[#E0DAD0] rounded-2xl shadow-2xl overflow-hidden text-[#0F1420] flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Dark Navy Aesthetic */}
        <div className="bg-[#0F1420] text-white p-6 relative border-b border-[#1C2436]">
          <button
            onClick={closeTokenModal}
            className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#1A2338] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#C9A052]/20 text-[#C9A052] border border-[#C9A052]/30 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5" /> AGENT TOKENOMICS & ACCESS
            </span>
            <span className="text-xs text-gray-400">Orbelo Ops Engine</span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Charter Broker Subscription
          </h2>
          <p className="text-xs text-gray-300 mt-1 max-w-lg">
            Agent accounts require action tokens to generate official quotes, flight briefs, invoices, and source through the Avinode marketplace.
          </p>

          {/* Current Balance Ribbon */}
          <div className="mt-4 pt-4 border-t border-[#1C2436] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-mono text-[11px]">Current Balance:</span>
              <span className="font-mono font-black text-lg text-[#C9A052]">
                {tokenBalance.toLocaleString()} <span className="text-xs text-gray-300 font-sans">Tokens</span>
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 uppercase">
                {subscriptionStatus === "active" ? "Subscription Active" : "No Active Sub"}
              </span>
              <span className="text-gray-400">Tier: {tokenTier.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Prompt / Insufficient Tokens Warning */}
          {tokenModalPrompt && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">Action Blocked: Insufficient Tokens</p>
                <p className="mt-0.5 text-amber-800 leading-relaxed">{tokenModalPrompt}</p>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-3 animate-in zoom-in-95">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <p className="font-bold">{successMessage}</p>
            </div>
          )}

          {/* Plan Package Card */}
          <div className="rounded-2xl border-2 border-[#C9A052] bg-gradient-to-br from-[#FFFDF9] to-[#F5F0E6] p-6 relative shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E0DAD0]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-[#0F1420]">
                    Standard Broker Package
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#C9A052] text-[#0F1420] rounded-full uppercase">
                    2,000 Tokens
                  </span>
                </div>
                <p className="text-xs text-[#0F1420]/70 mt-1">
                  Full 30-day recurring quota for quoting, briefs, invoices, and sourcing.
                </p>
              </div>

              {/* Currency Selector */}
              <div className="flex items-center bg-white border border-[#E0DAD0] rounded-xl p-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => setCurrency("GBP")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    currency === "GBP"
                      ? "bg-[#0F1420] text-white shadow-sm"
                      : "text-[#0F1420]/60 hover:text-[#0F1420]"
                  }`}
                >
                  £500 GBP
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency("USD")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    currency === "USD"
                      ? "bg-[#0F1420] text-white shadow-sm"
                      : "text-[#0F1420]/60 hover:text-[#0F1420]"
                  }`}
                >
                  $600 USD
                </button>
              </div>
            </div>

            {/* Price Display */}
            <div className="py-4 flex items-baseline gap-2">
              <span className="text-4xl font-black font-mono text-[#0F1420]">{price}</span>
              <span className="text-xs text-[#0F1420]/60 font-medium">/ 2,000 tokens per cycle ({currencyLabel})</span>
            </div>

            {/* What is Included Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="flex items-start gap-2 text-[#0F1420]/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>2,000 Execution Tokens</strong> instantly credited</span>
              </div>
              <div className="flex items-start gap-2 text-[#0F1420]/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>100 tokens per request</strong> (Quotes, Briefs, Invoices)</span>
              </div>
              <div className="flex items-start gap-2 text-[#0F1420]/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Live Avinode Sourcing</strong> marketplace queries</span>
              </div>
              <div className="flex items-start gap-2 text-[#0F1420]/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>30-day active broker</strong> platform access guarantee</span>
              </div>
            </div>
          </div>

          {/* Action Cost Reference Table */}
          <div className="rounded-xl border border-[#E0DAD0] bg-white p-4">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420] mb-3 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#C9A052]" />
              Core Function Token Consumption Guide
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-lg bg-[#F5F2EC] border border-[#E0DAD0]/60 text-center">
                <FileText className="w-4 h-4 text-[#C9A052] mx-auto mb-1" />
                <p className="text-[11px] font-bold text-[#0F1420]">Generate Quote</p>
                <p className="text-[10px] font-mono text-emerald-700 font-bold mt-0.5">100 Tokens</p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F5F2EC] border border-[#E0DAD0]/60 text-center">
                <Compass className="w-4 h-4 text-[#C9A052] mx-auto mb-1" />
                <p className="text-[11px] font-bold text-[#0F1420]">Flight Brief</p>
                <p className="text-[10px] font-mono text-emerald-700 font-bold mt-0.5">100 Tokens</p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F5F2EC] border border-[#E0DAD0]/60 text-center">
                <Receipt className="w-4 h-4 text-[#C9A052] mx-auto mb-1" />
                <p className="text-[11px] font-bold text-[#0F1420]">Tax Invoice</p>
                <p className="text-[10px] font-mono text-emerald-700 font-bold mt-0.5">100 Tokens</p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F5F2EC] border border-[#E0DAD0]/60 text-center">
                <Zap className="w-4 h-4 text-[#C9A052] mx-auto mb-1" />
                <p className="text-[11px] font-bold text-[#0F1420]">Avinode Query</p>
                <p className="text-[10px] font-mono text-emerald-700 font-bold mt-0.5">100 Tokens</p>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
              Select Payment Method
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  paymentMethod === "card"
                    ? "border-[#C9A052] bg-amber-50/50 shadow-sm"
                    : "border-[#E0DAD0] bg-white hover:border-gray-400"
                }`}
              >
                <div className={`p-2 rounded-lg ${paymentMethod === "card" ? "bg-[#C9A052] text-[#0F1420]" : "bg-gray-100 text-gray-600"}`}>
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0F1420]">Credit / Debit Card</p>
                  <p className="text-[10px] text-gray-500">Instant Token Credit</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("wire")}
                className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  paymentMethod === "wire"
                    ? "border-[#C9A052] bg-amber-50/50 shadow-sm"
                    : "border-[#E0DAD0] bg-white hover:border-gray-400"
                }`}
              >
                <div className={`p-2 rounded-lg ${paymentMethod === "wire" ? "bg-[#C9A052] text-[#0F1420]" : "bg-gray-100 text-gray-600"}`}>
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0F1420]">Bank Wire / SEPA</p>
                  <p className="text-[10px] text-gray-500">Corporate Invoice & Provision</p>
                </div>
              </button>
            </div>

            {/* Card Inputs */}
            {paymentMethod === "card" ? (
              <div className="p-4 rounded-xl border border-[#E0DAD0] bg-[#FDFBF7] space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full bg-white border border-[#E0DAD0] rounded-lg px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Expiry Date</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Security Code (CVC)</label>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-[#E0DAD0] bg-[#FDFBF7] text-xs text-[#0F1420]/80 space-y-1 font-mono text-[11px]">
                <p className="font-bold text-[#0F1420] font-sans">Orbelo Aviation Finance SEPA Details:</p>
                <p>IBAN: AT89 3200 0000 1284 9201</p>
                <p>BIC/SWIFT: ORBEAT2LXXX (Erste Group Vienna)</p>
                <p className="text-[10px] text-gray-500 font-sans mt-1">
                  Immediate 2,000 token grant will be activated while remittance settles within 2 business days.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-[#E0DAD0] bg-[#EDE9DF] flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-[#0F1420]/60">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>256-bit TLS Encrypted & PCI-DSS Compliant</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={closeTokenModal}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl border border-[#E0DAD0] bg-white text-xs font-bold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-[#C9A052]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#0F1420] border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Activate 2,000 Tokens ({price})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
