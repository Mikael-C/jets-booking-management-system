"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import { formatCurrency } from "@/lib/pricingCalculator";
import { formatDocumentId, formatTripVersion } from "@/lib/idGenerator";
import StatusPill from "@/components/ui/StatusPill";
import RecordHeader from "@/components/ui/RecordHeader";
import KpiStrip from "@/components/ui/KpiStrip";
import {
  Search,
  Eye,
  FileText,
  CheckCircle2,
  Clock,
  Download,
  ScrollText
} from "lucide-react";

export default function ContractsListView() {
  const router = useRouter();
  const { bookings, openDocument, settings } = useAviation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "signed" | "pending">("all");

  const activeTerms = settings?.termsVersions?.find((t) => t.isActive) || settings?.termsVersions?.[0];
  const termsVersion = activeTerms ? `${activeTerms.version} (${activeTerms.effectiveDate})` : "v2.4 (01.10.2026)";

  const contracts = useMemo(() => {
    return bookings.map((b) => {
      const rootId = (b.tripId || b.tripNumber || "FE4578").split("-")[0];
      const versionNum = b.quoteVersion || 1;
      const contractId = formatDocumentId("C", rootId, versionNum);
      const isSigned = Boolean(b.isContractSigned || b.isBooked || ["confirmed", "dispatched", "in_flight", "completed", "flown"].includes(b.status));

      return {
        id: b.id,
        contractId,
        rootId,
        versionBadge: formatTripVersion(rootId, versionNum),
        accountNumber: b.accountNumber || "ACC-10294",
        clientName: b.client.companyName || b.client.fullName,
        signatory: b.contractSignedBy || b.client.fullName,
        date: b.contractDate || "12.11.2026",
        isSigned,
        termsVersion,
        amount: b.pricing.totalFlightPrice,
        currency: b.pricing.currency || "EUR",
        booking: b
      };
    });
  }, [bookings, termsVersion]);

  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      if (statusFilter === "signed" && !c.isSigned) return false;
      if (statusFilter === "pending" && c.isSigned) return false;

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchId = c.contractId.toLowerCase().includes(q);
        const matchTrip = c.rootId.toLowerCase().includes(q);
        const matchClient = c.clientName.toLowerCase().includes(q);
        const matchAcc = c.accountNumber.toLowerCase().includes(q);
        const matchSigner = c.signatory.toLowerCase().includes(q);
        if (!matchId && !matchTrip && !matchClient && !matchAcc && !matchSigner) return false;
      }

      return true;
    });
  }, [contracts, statusFilter, searchQuery]);

  const signedCount = contracts.filter((c) => c.isSigned).length;
  const pendingCount = contracts.filter((c) => !c.isSigned).length;
  const totalValue = contracts.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-4">
      {/* 1. Header */}
      <RecordHeader
        title="Charter Contracts"
        subtitle="Master charter agreements and electronic signature status across all clients"
        badge="R-036 CONTRACTS REPOSITORY"
        breadcrumbs={[{ label: "Overview", href: "/overview" }, { label: "Contracts" }]}
      />

      {/* 2. KPI Strip */}
      <KpiStrip
        items={[
          {
            id: "signed",
            label: "Executed Contracts",
            value: signedCount.toString(),
            subtext: "Signed & legally binding agreements",
            trend: "positive"
          },
          {
            id: "pending",
            label: "Pending Signature",
            value: pendingCount.toString(),
            subtext: "Sent for client authorization",
            trend: "warning"
          },
          {
            id: "value",
            label: "Contracted Value",
            value: formatCurrency(totalValue, "EUR"),
            subtext: "Total charter volume under contract"
          },
          {
            id: "terms",
            label: "Standard Terms",
            value: termsVersion.split(" ")[0] || "v2.4",
            subtext: "Current settings terms"
          }
        ]}
      />

      {/* 3. Search and Filters */}
      <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Contract ID, Account, Client, Signer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--ink)]"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {(["all", "signed", "pending"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-display uppercase tracking-wider font-bold rounded-lg transition-all ${
                statusFilter === s
                  ? "bg-[var(--ink)] text-[var(--card)]"
                  : "bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {s === "all" ? "All Contracts" : s === "signed" ? "Signed" : "Pending Signature"}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Dense Table */}
      <div className="tablewrap">
        <table className="dense-table">
          <thead>
            <tr>
              <th>Contract ID</th>
              <th>Version</th>
              <th>Trip ID</th>
              <th>Client Account</th>
              <th>Signatory</th>
              <th>Issue Date</th>
              <th>Terms Version</th>
              <th className="text-right">Value</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredContracts.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-xs text-[var(--muted)] font-mono">
                  No contract records match your filter criteria.
                </td>
              </tr>
            ) : (
              filteredContracts.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/trips/${c.rootId}/documents`)}
                  className="cursor-pointer hover:bg-[var(--paper)] transition-colors"
                >
                  <td className="font-mono font-bold text-xs text-[var(--ink)]">
                    {c.contractId}
                  </td>
                  <td className="font-mono text-xs">{c.versionBadge}</td>
                  <td className="font-mono font-bold text-xs">
                    <Link
                      href={`/trips/${c.rootId}/documents`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:underline text-[var(--accent)]"
                    >
                      {c.rootId}
                    </Link>
                  </td>
                  <td>
                    <span className="font-bold text-xs text-[var(--ink)] block">{c.clientName}</span>
                    <span className="font-mono text-[11px] text-[var(--muted)]">{c.accountNumber}</span>
                  </td>
                  <td className="text-xs text-[var(--ink)]">{c.signatory}</td>
                  <td className="font-mono text-xs">{c.date}</td>
                  <td className="font-mono text-xs text-[var(--muted)]">{c.termsVersion}</td>
                  <td className="font-mono font-bold text-xs text-right text-[var(--ink)]">
                    {formatCurrency(c.amount, c.currency)}
                  </td>
                  <td>
                    <StatusPill
                      label={c.isSigned ? "SIGNED" : "PENDING SIGNATURE"}
                      variant={c.isSigned ? "green" : "amber"}
                    />
                  </td>
                  <td className="text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openDocument(c.booking, "charter_agreement")}
                      className="btn-secondary text-[11px] py-1 px-2"
                      title="View PDF Document"
                    >
                      <Eye className="w-3 h-3" />
                      <span>PDF</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
