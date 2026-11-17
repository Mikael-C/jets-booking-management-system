"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import { formatCurrency } from "@/lib/pricingCalculator";
import { formatDocumentId } from "@/lib/idGenerator";
import StatusPill from "@/components/ui/StatusPill";
import RecordHeader from "@/components/ui/RecordHeader";
import KpiStrip from "@/components/ui/KpiStrip";
import {
  Search,
  Download,
  Printer,
  Eye,
  FileText,
  AlertTriangle,
  Receipt,
  Calendar,
  DollarSign
} from "lucide-react";

export default function InvoicesView() {
  const router = useRouter();
  const { bookings, openDocument } = useAviation();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "invoices" | "credit_notes">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid" | "overdue">("all");

  // Build unified items array (Invoices + Credit Notes)
  const items = useMemo(() => {
    const list: {
      id: string;
      docId: string;
      type: "invoice" | "credit_note";
      tripId: string;
      rootId: string;
      accountNumber: string;
      clientName: string;
      issueDate: string;
      dueDate?: string;
      amount: number;
      currency: string;
      status: "paid" | "unpaid" | "partially_paid" | "credited" | "overdue";
      booking: any;
      creditNoteObj?: any;
    }[] = [];

    bookings.forEach((b) => {
      const rootId = (b.tripId || b.tripNumber || "FE4578").split("-")[0];
      const versionNum = b.quoteVersion || 1;
      const invNumber = b.invoiceNumber || formatDocumentId("INV", rootId, versionNum, 1);

      // Add invoice if booked or quoted
      const isPaid = b.paymentStatus === "fully_paid";
      list.push({
        id: `inv-${b.id}`,
        docId: invNumber,
        type: "invoice",
        tripId: b.tripNumber || rootId,
        rootId,
        accountNumber: b.accountNumber || "ACC-10294",
        clientName: b.client.companyName || b.client.fullName,
        issueDate: b.contractDate || "12.11.2026",
        dueDate: b.paymentDueDate || "18.11.2026",
        amount: b.pricing.totalFlightPrice,
        currency: b.pricing.currency || "EUR",
        status: isPaid ? "paid" : "unpaid",
        booking: b
      });

      // Add credit notes if any exist
      if (b.creditNotes && b.creditNotes.length > 0) {
        b.creditNotes.forEach((cn, idx) => {
          list.push({
            id: `cn-${b.id}-${idx}`,
            docId: cn.creditNoteNumber || formatDocumentId("CN", rootId, versionNum, idx + 1),
            type: "credit_note",
            tripId: b.tripNumber || rootId,
            rootId,
            accountNumber: b.accountNumber || "ACC-10294",
            clientName: b.client.companyName || b.client.fullName,
            issueDate: cn.issueDate || cn.date || b.contractDate || "15.11.2026",
            dueDate: "Immediate",
            amount: -Math.abs(cn.amount || 250),
            currency: b.pricing.currency || "EUR",
            status: "credited",
            booking: b,
            creditNoteObj: cn
          });
        });
      }
    });

    return list;
  }, [bookings]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (typeFilter === "invoices" && item.type !== "invoice") return false;
      if (typeFilter === "credit_notes" && item.type !== "credit_note") return false;

      if (statusFilter !== "all") {
        if (statusFilter === "paid" && item.status !== "paid") return false;
        if (statusFilter === "unpaid" && item.status !== "unpaid") return false;
        if (statusFilter === "overdue" && item.status !== "overdue") return false;
      }

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchDoc = item.docId.toLowerCase().includes(q);
        const matchTrip = item.tripId.toLowerCase().includes(q);
        const matchAcc = item.accountNumber.toLowerCase().includes(q);
        const matchClient = item.clientName.toLowerCase().includes(q);
        if (!matchDoc && !matchTrip && !matchAcc && !matchClient) return false;
      }

      return true;
    });
  }, [items, typeFilter, statusFilter, searchQuery]);

  // KPIs
  const totalInvoiced = items
    .filter((i) => i.type === "invoice")
    .reduce((sum, i) => sum + i.amount, 0);

  const totalCredited = items
    .filter((i) => i.type === "credit_note")
    .reduce((sum, i) => sum + Math.abs(i.amount), 0);

  const totalUnpaid = items
    .filter((i) => i.type === "invoice" && i.status === "unpaid")
    .reduce((sum, i) => sum + i.amount, 0);

  // CSV Export (R-035)
  const handleExportCsv = () => {
    const headers = ["Document ID", "Type", "Trip ID", "Account", "Client", "Issue Date", "Due Date", "Amount", "Currency", "Status"];
    const rows = filteredItems.map((i) => [
      i.docId,
      i.type.toUpperCase(),
      i.tripId,
      i.accountNumber,
      `"${i.clientName}"`,
      i.issueDate,
      i.dueDate || "",
      i.amount,
      i.currency,
      i.status.toUpperCase()
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orbelo-invoices-register-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header (No Create Invoice button per R-035!) */}
      <RecordHeader
        title="Invoices & Credit Notes"
        subtitle="Financial audit register of issued debit invoices and credit adjustments across all trips"
        badge="R-035 ACCOUNTING REGISTER"
        breadcrumbs={[{ label: "Overview", href: "/overview" }, { label: "Invoices" }]}
        actions={
          <button onClick={handleExportCsv} className="btn-secondary text-xs">
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        }
      />

      {/* 2. KPI Strip */}
      <KpiStrip
        items={[
          {
            id: "invoiced",
            label: "Total Invoiced",
            value: formatCurrency(totalInvoiced, "EUR"),
            subtext: `${items.filter((i) => i.type === "invoice").length} debit invoices issued`
          },
          {
            id: "credited",
            label: "Total Credited",
            value: formatCurrency(totalCredited, "EUR"),
            subtext: `${items.filter((i) => i.type === "credit_note").length} credit notes applied`,
            trend: "danger"
          },
          {
            id: "unpaid",
            label: "Open Receivables",
            value: formatCurrency(totalUnpaid, "EUR"),
            subtext: "Awaiting settlement prior to flight",
            trend: "warning"
          },
          {
            id: "net",
            label: "Net Billed",
            value: formatCurrency(totalInvoiced - totalCredited, "EUR"),
            subtext: "Total revenue net of adjustments",
            trend: "positive"
          }
        ]}
      />

      {/* 3. Search and Filters */}
      <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Doc ID, Trip ID, Account, Client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--ink)]"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          <span className="text-[10px] font-display uppercase font-bold text-[var(--muted)] mr-1">Type:</span>
          {(["all", "invoices", "credit_notes"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 text-xs font-display uppercase tracking-wider font-bold rounded-lg transition-all ${
                typeFilter === t
                  ? "bg-[var(--ink)] text-[var(--card)]"
                  : "bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {t === "credit_notes" ? "Credit Notes" : t}
            </button>
          ))}

          <div className="h-4 w-px bg-[var(--line)] mx-1" />

          <span className="text-[10px] font-display uppercase font-bold text-[var(--muted)] mr-1">Status:</span>
          {(["all", "paid", "unpaid"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 text-xs font-display uppercase tracking-wider font-bold rounded-lg transition-all ${
                statusFilter === s
                  ? "bg-[var(--ink)] text-[var(--card)]"
                  : "bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Dense Register Table */}
      <div className="tablewrap">
        <table className="dense-table">
          <thead>
            <tr>
              <th>Document ID</th>
              <th>Type</th>
              <th>Issue Date</th>
              <th>Due Date</th>
              <th>Trip ID</th>
              <th>Account</th>
              <th>Client Name</th>
              <th className="text-right">Amount</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-xs text-[var(--muted)] font-mono">
                  No invoice or credit note records match the filter criteria.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const isCreditNote = item.type === "credit_note";
                return (
                  <tr
                    key={item.id}
                    onClick={() => router.push(`/trips/${item.rootId}/accounting`)}
                    className="cursor-pointer hover:bg-[var(--paper)] transition-colors"
                  >
                    {/* Document ID */}
                    <td className="font-mono font-bold text-xs text-[var(--ink)]">
                      {item.docId}
                    </td>

                    {/* Type */}
                    <td>
                      <span className={`pill ${isCreditNote ? "red" : "blue"} text-[10px]`}>
                        {isCreditNote ? "CREDIT NOTE" : "INVOICE"}
                      </span>
                    </td>

                    {/* Issue Date */}
                    <td className="font-mono text-xs">{item.issueDate}</td>

                    {/* Due Date */}
                    <td className="font-mono text-xs text-[var(--muted)]">{item.dueDate || "—"}</td>

                    {/* Trip ID */}
                    <td className="font-mono font-bold text-xs">
                      <Link
                        href={`/trips/${item.rootId}/accounting`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline text-[var(--accent)]"
                      >
                        {item.tripId}
                      </Link>
                    </td>

                    {/* Account */}
                    <td className="font-mono text-xs">{item.accountNumber}</td>

                    {/* Client Name */}
                    <td className="font-bold text-xs text-[var(--ink)]">{item.clientName}</td>

                    {/* Amount */}
                    <td className={`font-mono font-bold text-xs text-right ${isCreditNote ? "text-[var(--red)]" : "text-[var(--ink)]"}`}>
                      {isCreditNote
                        ? `- ${formatCurrency(Math.abs(item.amount), (item.currency as any) || "EUR")}`
                        : formatCurrency(item.amount, (item.currency as any) || "EUR")}
                    </td>

                    {/* Status */}
                    <td>
                      <StatusPill
                        label={item.status.toUpperCase()}
                        variant={item.status === "paid" ? "green" : item.status === "credited" ? "red" : "amber"}
                      />
                    </td>

                    {/* Actions */}
                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openDocument(item.booking, isCreditNote ? "credit_note" : "invoice")}
                          className="btn-secondary text-[11px] py-1 px-2"
                          title="View PDF Document"
                        >
                          <Eye className="w-3 h-3" />
                          <span>PDF</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
