"use client";

import React, { useState } from "react";
import { useAviation } from "@/lib/aviationContext";
import { Booking } from "@/types/aviation";
import { formatCurrency } from "@/lib/pricingCalculator";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  FileText,
  DollarSign,
  Landmark,
  ArrowUpRight,
  Filter,
  X,
  Calendar,
  Send,
  Building
} from "lucide-react";

export default function PaymentsView() {
  const {
    bookings,
    updateBookingPaymentStatus,
    openDocument,
    addAuditEntry,
    currentUser,
    role
  } = useAviation();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);

  // Payment Recording Modal State
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("Bank Wire Transfer");
  const [paymentRef, setPaymentRef] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [paymentType, setPaymentType] = useState<"fully_paid" | "deposit_paid">("fully_paid");

  const canEdit = role === "super_admin" || role === "admin" || role === "finance";

  // KPIs
  const totalReceived = bookings
    .filter((b) => b.paymentStatus === "fully_paid")
    .reduce((sum, b) => sum + (b.pricing.totalFlightPrice || 0), 0);

  const pendingAmount = bookings
    .filter((b) => b.paymentStatus === "unpaid" || b.paymentStatus === "deposit_paid")
    .reduce((sum, b) => sum + (b.pricing.totalFlightPrice || 0), 0);

  const depositsReceived = bookings.filter((b) => b.paymentStatus === "deposit_paid").length;

  const overdueCount = bookings.filter((b) => {
    if (b.paymentStatus === "fully_paid") return false;
    if (!b.paymentDueDate) return false;
    // Check if overdue
    const parts = b.paymentDueDate.split(".");
    if (parts.length === 3) {
      const dueDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
      return dueDate < Date.now();
    }
    return false;
  }).length;

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.tripNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.invoiceNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.client.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.client.companyName || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "fully_paid" && b.paymentStatus === "fully_paid") ||
      (statusFilter === "deposit_paid" && b.paymentStatus === "deposit_paid") ||
      (statusFilter === "unpaid" && (b.paymentStatus === "unpaid" || !b.paymentStatus)) ||
      (statusFilter === "overdue" && b.paymentStatus !== "fully_paid" && overdueCount > 0);

    return matchesSearch && matchesStatus;
  });

  const handleOpenPaymentModal = (b: Booking) => {
    setSelectedBookingForPayment(b);
    setPaymentAmount(b.pricing.totalFlightPrice || 15000);
    setPaymentRef(`WIRE-${Math.floor(100000 + Math.random() * 900000)}`);
    setPaymentType("fully_paid");
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForPayment) return;

    updateBookingPaymentStatus(selectedBookingForPayment.id, paymentType);
    addAuditEntry({
      userEmail: currentUser?.email || "finance@orbelo.com",
      userName: currentUser?.name || "Finance Operations",
      action: "PAYMENT_RECORDED",
      entityType: "Payment",
      entityId: selectedBookingForPayment.invoiceNumber || selectedBookingForPayment.tripNumber,
      details: `Recorded ${paymentType === "fully_paid" ? "full payment" : "deposit"} of ${formatCurrency(paymentAmount, selectedBookingForPayment.pricing.currency || "EUR")} via ${paymentMethod} (Ref: ${paymentRef}) for ${selectedBookingForPayment.client.fullName}`
    });

    setSelectedBookingForPayment(null);
  };

  const getStatusBadge = (status?: Booking["paymentStatus"]) => {
    switch (status) {
      case "fully_paid":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            FULLY PAID
          </span>
        );
      case "deposit_paid":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            DEPOSIT PAID
          </span>
        );
      case "refunded":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-300">
            REFUNDED
          </span>
        );
      case "overdue":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-red-100 text-red-800 border border-red-300">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            OVERDUE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3 h-3 text-blue-600" />
            UNPAID
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* View Header */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/15 text-[#9A7A35] border border-[#C9A052]/30">
              FINANCE & SETTLEMENT ENGINE
            </span>
            <span className="text-xs text-[#0F1420]/60">Invoices, Escrow & Wire Reconciliation</span>
          </div>
          <h2 className="text-xl font-black text-[#0F1420] tracking-tight">
            Payments & Invoice Management
          </h2>
          <p className="text-xs text-[#0F1420]/65 mt-0.5">
            Monitor client wire remittances, credit card authorizations, escrow releases, payment due dates, and official VAT invoice generation.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E0DAD0] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-emerald-800">
              Total Settled (Paid)
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black font-mono text-emerald-700 mt-2">
            {formatCurrency(totalReceived, "EUR")}
          </p>
          <span className="text-[11px] text-gray-500">Collected in escrow/bank</span>
        </div>

        <div className="bg-white border border-[#E0DAD0] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-[#0F1420]/70">
              Pending Receivable
            </span>
            <Clock className="w-4 h-4 text-[#C9A052]" />
          </div>
          <p className="text-2xl font-black font-mono text-[#0F1420] mt-2">
            {formatCurrency(pendingAmount, "EUR")}
          </p>
          <span className="text-[11px] text-gray-500">Awaiting client wire</span>
        </div>

        <div className="bg-white border border-[#E0DAD0] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-amber-800">
              Deposits Held
            </span>
            <Landmark className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black font-mono text-amber-700 mt-2">
            {depositsReceived} Trips
          </p>
          <span className="text-[11px] text-gray-500">Secured via card/wire</span>
        </div>

        <div className="bg-white border border-[#E0DAD0] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-red-800">
              Overdue Invoices
            </span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-black font-mono text-red-700 mt-2">
            {overdueCount}
          </p>
          <span className="text-[11px] text-gray-500">Past contract due date</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E0DAD0] rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search invoice #, trip #, or client name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#0F1420] placeholder-gray-400 focus:outline-none focus:border-[#C9A052]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: "all", label: "All Invoices" },
            { id: "fully_paid", label: "Fully Paid" },
            { id: "deposit_paid", label: "Deposit Paid" },
            { id: "unpaid", label: "Unpaid" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-[#0F1420] text-[#C9A052]"
                  : "bg-[#F5F2EC] text-[#0F1420]/70 hover:bg-[#EAE6DE]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings & Payments Table */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F5F2EC] border-b border-[#E0DAD0] text-[#0F1420]/80 font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4">Trip # & Flight Date</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Client & Company</th>
                <th className="py-3 px-4">Charter Total</th>
                <th className="py-3 px-4">Payment Due Date</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0DAD0]/60">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-gray-500 font-mono">
                    No payment records match the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#FDFCFA] transition-colors">
                    {/* Trip # & Flight Date */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-[#0F1420]">{b.tripNumber}</div>
                      <p className="text-[11px] text-gray-500">
                        {b.legs[0]?.origin.icao} → {b.legs[0]?.destination.icao} ({b.legs[0]?.flightDate})
                      </p>
                    </td>

                    {/* Invoice # */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[#9A7A35]">
                      {b.invoiceNumber || "INV-PENDING"}
                    </td>

                    {/* Client & Company */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#0F1420]">{b.client.fullName}</div>
                      {b.client.companyName && (
                        <p className="text-[11px] text-gray-500">{b.client.companyName}</p>
                      )}
                    </td>

                    {/* Charter Total */}
                    <td className="py-3.5 px-4 font-mono font-black text-sm text-[#0F1420]">
                      {formatCurrency(b.pricing.totalFlightPrice, b.pricing.currency || "EUR")}
                    </td>

                    {/* Payment Due Date */}
                    <td className="py-3.5 px-4 font-mono text-gray-700">
                      {b.paymentDueDate || "Upon Booking"}
                    </td>

                    {/* Payment Status */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(b.paymentStatus)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDocument(b, "invoice")}
                          className="px-2.5 py-1.5 rounded-lg bg-[#F5F2EC] hover:bg-[#EAE6DE] text-[#0F1420] font-mono font-bold text-[11px] transition-colors border border-[#E0DAD0] flex items-center gap-1"
                          title="View official VAT invoice document"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#C9A052]" />
                          <span>Invoice</span>
                        </button>

                        {canEdit && b.paymentStatus !== "fully_paid" && (
                          <button
                            onClick={() => handleOpenPaymentModal(b)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#0F1420] hover:bg-[#1A2338] text-white font-mono font-bold text-[11px] transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-[#C9A052]" />
                            <span>Record Payment</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {selectedBookingForPayment && (
        <div className="fixed inset-0 z-50 bg-[#0F1420]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#E0DAD0] shadow-2xl overflow-hidden">
            <div className="p-5 bg-[#0F1420] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#C9A052] uppercase">
                  RECORD WIRE OR CARD SETTLEMENT
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Trip {selectedBookingForPayment.tripNumber} ({selectedBookingForPayment.client.fullName})
                </h3>
              </div>
              <button
                onClick={() => setSelectedBookingForPayment(null)}
                className="p-1.5 rounded-lg bg-white/10 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-[#F5F2EC] rounded-xl border border-[#E0DAD0] flex items-center justify-between font-mono">
                <span className="text-[#0F1420]/70">Total Invoice Amount:</span>
                <span className="text-base font-black text-[#0F1420]">
                  {formatCurrency(selectedBookingForPayment.pricing.totalFlightPrice, selectedBookingForPayment.pricing.currency || "EUR")}
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                  Settlement Type
                </label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as any)}
                  className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                >
                  <option value="fully_paid">100% Full Payment Received</option>
                  <option value="deposit_paid">Partial Deposit Received (25%)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                    Amount Received
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-3 py-1.5 font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                    Receipt Date
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-3 py-1.5 font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-3 py-2 font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  >
                    <option value="Bank Wire Transfer">Bank Wire (SEPA/SWIFT)</option>
                    <option value="Corporate Credit Card">Corporate Credit Card (Amex)</option>
                    <option value="Aviation Escrow">Aviation Escrow Deposit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                    Bank Reference / Transaction #
                  </label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="e.g. WIRE-849201"
                    className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-3 py-1.5 font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#E0DAD0]">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForPayment(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#0F1420] font-mono font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] font-mono font-black shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Settlement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
