"use client";

import React, { useState } from "react";
import { useAviation, DocumentType } from "@/lib/aviationContext";
import QuotationDoc from "./QuotationDoc";
import InvoiceDoc from "./InvoiceDoc";
import FlightBriefDoc from "./FlightBriefDoc";
import CharterAgreementDoc from "./CharterAgreementDoc";
import { X, Printer, Download, Share2, FileText, Receipt, Compass, ScrollText, Check } from "lucide-react";

export default function DocumentViewerModal() {
  const { isDocumentModalOpen, closeDocument, activeBooking, activeDocType } = useAviation();
  const [currentDoc, setCurrentDoc] = useState<DocumentType>(activeDocType);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync currentDoc when modal opens with a specific type
  React.useEffect(() => {
    setCurrentDoc(activeDocType);
  }, [activeDocType]);

  if (!isDocumentModalOpen || !activeBooking) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const docTabs = [
    { type: "quotation" as DocumentType, label: "Quotation", icon: FileText },
    { type: "invoice" as DocumentType, label: "Invoice", icon: Receipt },
    { type: "flight_brief" as DocumentType, label: "Flight Brief", icon: Compass },
    { type: "charter_agreement" as DocumentType, label: "Charter Agreement", icon: ScrollText }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:overflow-visible">
      {/* Modal Container */}
      <div className="relative w-full max-w-5xl bg-[#0F1420] border border-gold/30 rounded-2xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden print:max-h-none print:border-none print:shadow-none print:bg-white">
        
        {/* Top Header Bar (Hidden in Print) */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:px-6 bg-[#080C14] border-b border-gray-800 print:hidden select-none">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider text-gold font-mono font-bold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                DOCUMENT GENERATOR • {activeBooking.tripNumber}
              </span>
              <h2 className="text-white font-bold text-sm sm:text-base">
                {activeBooking.client.fullName} • {activeBooking.aircraft.name}
              </h2>
            </div>
          </div>

          {/* Action Buttons: Print / Download, Share, Close */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium transition-colors border border-gray-700"
              title="Copy link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-gold" />}
              <span>{copiedLink ? "Link Copied" : "Share"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gold hover:bg-gold-light text-[#0F1420] text-xs font-bold transition-all shadow-gold"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Download PDF / Print</span>
            </button>

            <button
              onClick={closeDocument}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors ml-2"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Strip (Hidden in Print) */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-[#0B101A] border-b border-gray-800 print:hidden overflow-x-auto">
          {docTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentDoc === tab.type;
            return (
              <button
                key={tab.type}
                onClick={() => setCurrentDoc(tab.type)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-gold/20 text-gold border border-gold/40 shadow-sm"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-gold" : "text-gray-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Document Content Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#090D16] print:p-0 print:bg-white print:overflow-visible">
          {currentDoc === "quotation" && <QuotationDoc booking={activeBooking} />}
          {currentDoc === "invoice" && <InvoiceDoc booking={activeBooking} />}
          {currentDoc === "flight_brief" && <FlightBriefDoc booking={activeBooking} />}
          {currentDoc === "charter_agreement" && <CharterAgreementDoc booking={activeBooking} />}
        </div>
      </div>
    </div>
  );
}
