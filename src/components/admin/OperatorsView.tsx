"use client";

import React, { useState } from "react";
import { useAviation } from "@/lib/aviationContext";
import { OperatorRecord, OperatorQualDoc } from "@/types/aviation";
import {
  ShieldCheck,
  Building2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Search,
  FileText,
  Phone,
  Mail,
  ExternalLink,
  ChevronDown,
  X,
  Calendar,
  Check,
  AlertCircle
} from "lucide-react";

export default function OperatorsView() {
  const {
    operators,
    addOperator,
    updateOperatorStatus,
    updateOperatorChecklist,
    addAuditEntry,
    currentUser,
    role
  } = useAviation();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOperator, setSelectedOperator] = useState<OperatorRecord | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Operator Form State
  const [newOp, setNewOp] = useState({
    legalName: "",
    tradingName: "",
    aocNumber: "",
    aocAuthority: "Austro Control (Austria)",
    aocExpiry: "",
    baseIcao: "",
    salesContact: "",
    salesEmail: "",
    opsPhone: "",
    opsEmail: "",
    insuranceExpiry: "",
    safetyRating: "ARGUS Platinum",
    safetyRatingProvider: "ARGUS International",
    notes: ""
  });

  const canEdit = role === "super_admin" || role === "admin" || role === "operations";

  // Calculate days until expiry
  const getDaysUntil = (dateStr?: string) => {
    if (!dateStr) return null;
    const target = new Date(dateStr).getTime();
    const now = new Date().getTime();
    return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  };

  // Badge styling for expiry
  const getExpiryBadge = (dateStr?: string) => {
    const days = getDaysUntil(dateStr);
    if (days === null) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-gray-400">
          Not Recorded
        </span>
      );
    }
    if (days < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-red-100 text-red-800 border border-red-300">
          <XCircle className="w-3 h-3 text-red-600" />
          EXPIRED ({Math.abs(days)}d ago)
        </span>
      );
    }
    if (days <= 30) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-red-50 text-red-700 border border-red-200">
          <AlertTriangle className="w-3 h-3 text-red-500" />
          {dateStr} ({days}d)
        </span>
      );
    }
    if (days <= 90) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300">
          <Clock className="w-3 h-3 text-amber-600" />
          {dateStr} ({days}d)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        {dateStr}
      </span>
    );
  };

  // Status Badge
  const getStatusBadge = (status: OperatorRecord["status"]) => {
    switch (status) {
      case "approved":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            APPROVED
          </span>
        );
      case "approved_with_conditions":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
            CONDITIONAL
          </span>
        );
      case "pending":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-300">
            PENDING QUAL
          </span>
        );
      case "suspended":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-red-100 text-red-800 border border-red-300">
            SUSPENDED
          </span>
        );
      case "rejected":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-gray-100 text-gray-700 border border-gray-300">
            REJECTED
          </span>
        );
      default:
        return null;
    }
  };

  // Stats
  const totalOps = operators.length;
  const approvedOps = operators.filter((o) => o.status === "approved").length;
  const pendingOps = operators.filter(
    (o) => o.status === "pending" || o.status === "approved_with_conditions"
  ).length;
  const expiringWithin60 = operators.filter((o) => {
    const aocDays = getDaysUntil(o.aocExpiry);
    const insDays = getDaysUntil(o.insuranceExpiry);
    return (
      (aocDays !== null && aocDays <= 60 && aocDays >= 0) ||
      (insDays !== null && insDays <= 60 && insDays >= 0)
    );
  }).length;

  // Filtered operators
  const filteredOperators = operators.filter((op) => {
    const matchesSearch =
      op.legalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.tradingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.aocNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.baseIcao.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "approved" && op.status === "approved") ||
      (statusFilter === "pending" && (op.status === "pending" || op.status === "approved_with_conditions")) ||
      (statusFilter === "suspended" && op.status === "suspended") ||
      (statusFilter === "expiring" && ((getDaysUntil(op.aocExpiry) || 999) <= 60 || (getDaysUntil(op.insuranceExpiry) || 999) <= 60));

    return matchesSearch && matchesStatus;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOp.legalName || !newOp.aocNumber) return;

    const defaultChecklist: OperatorQualDoc[] = [
      { id: "doc-1", docType: "Air Operator Certificate (AOC)", status: "pass", expiryDate: newOp.aocExpiry },
      { id: "doc-2", docType: "Aircraft registered on AOC", status: "pass" },
      { id: "doc-3", docType: "Certificate of Airworthiness (ARC)", status: "pending" },
      { id: "doc-4", docType: "Third Party & Passenger Liability Insurance", status: "pending", expiryDate: newOp.insuranceExpiry },
      { id: "doc-5", docType: "Independent Safety Audit Rating", status: "pass", notes: `${newOp.safetyRating} (${newOp.safetyRatingProvider})` },
      { id: "doc-6", docType: "Crew Licensing, Medicals & Recurrent Training", status: "pending" },
      { id: "doc-7", docType: "24/7 Operations Control Center (OCC)", status: "pass" },
      { id: "doc-8", docType: "No Sub-Charter without Prior Consent Clause", status: "pass" },
      { id: "doc-9", docType: "Master Charter Broker Agreement Signed", status: "pending" }
    ];

    const record: OperatorRecord = {
      id: `op-${Date.now()}`,
      legalName: newOp.legalName,
      tradingName: newOp.tradingName || newOp.legalName,
      aocNumber: newOp.aocNumber,
      aocAuthority: newOp.aocAuthority,
      aocExpiry: newOp.aocExpiry || "2027-12-31",
      baseIcao: newOp.baseIcao.toUpperCase() || "LFMN",
      salesContact: newOp.salesContact || "Operations Desk",
      salesEmail: newOp.salesEmail || "sales@operator.aero",
      opsPhone: newOp.opsPhone || "+33 4 93 00 00 00",
      opsEmail: newOp.opsEmail || "dispatch@operator.aero",
      status: "pending",
      insuranceExpiry: newOp.insuranceExpiry,
      safetyRating: newOp.safetyRating,
      safetyRatingProvider: newOp.safetyRatingProvider,
      notes: newOp.notes,
      qualificationChecklist: defaultChecklist,
      createdAt: new Date().toISOString()
    };

    addOperator(record);
    addAuditEntry({
      userEmail: currentUser?.email || "ops@orbelo.com",
      userName: currentUser?.name || "Operations Team",
      action: "OPERATOR_ADDED",
      entityType: "Operator",
      entityId: record.id,
      details: `Added new aircraft operator '${record.tradingName}' (AOC: ${record.aocNumber})`
    });

    setIsAddModalOpen(false);
    setNewOp({
      legalName: "",
      tradingName: "",
      aocNumber: "",
      aocAuthority: "Austro Control (Austria)",
      aocExpiry: "",
      baseIcao: "",
      salesContact: "",
      salesEmail: "",
      opsPhone: "",
      opsEmail: "",
      insuranceExpiry: "",
      safetyRating: "ARGUS Platinum",
      safetyRatingProvider: "ARGUS International",
      notes: ""
    });
  };

  const handleStatusChange = (opId: string, newStatus: OperatorRecord["status"]) => {
    updateOperatorStatus(opId, newStatus);
    const op = operators.find((o) => o.id === opId);
    addAuditEntry({
      userEmail: currentUser?.email || "ops@orbelo.com",
      userName: currentUser?.name || "Operations Team",
      action: "OPERATOR_STATUS_CHANGED",
      entityType: "Operator",
      entityId: opId,
      details: `Updated operator '${op?.tradingName || opId}' status to '${newStatus}'`
    });
    if (selectedOperator && selectedOperator.id === opId) {
      setSelectedOperator({ ...selectedOperator, status: newStatus });
    }
  };

  const handleChecklistToggle = (
    docId: string,
    nextStatus: "pass" | "fail" | "pending"
  ) => {
    if (!selectedOperator) return;
    updateOperatorChecklist(selectedOperator.id, docId, nextStatus);
    const updatedChecklist = selectedOperator.qualificationChecklist.map((d) =>
      d.id === docId ? { ...d, status: nextStatus } : d
    );
    const updatedOp = { ...selectedOperator, qualificationChecklist: updatedChecklist };
    setSelectedOperator(updatedOp);

    addAuditEntry({
      userEmail: currentUser?.email || "ops@orbelo.com",
      userName: currentUser?.name || "Operations Team",
      action: "QUALIFICATION_DOC_UPDATED",
      entityType: "OperatorChecklist",
      entityId: selectedOperator.id,
      details: `Updated qualification checklist item '${docId}' to '${nextStatus}' for ${selectedOperator.tradingName}`
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/15 text-[#9A7A35] border border-[#C9A052]/30">
              SAFETY & COMPLIANCE PIPELINE
            </span>
            <span className="text-xs text-[#0F1420]/60">EASA / FAA Part 135 Qualification</span>
          </div>
          <h2 className="text-xl font-black text-[#0F1420] tracking-tight">
            Air Charter Operator Qualification & Directory
          </h2>
          <p className="text-xs text-[#0F1420]/65 mt-0.5">
            Audit AOC certifications, third-party liability insurance policies, safety audit ratings (ARGUS, IS-BAO, Wyvern), and 9-point broker vetting checklists.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F1420] hover:bg-[#1A2338] text-white font-mono text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#C9A052]" />
            <span>Add Qualified Operator</span>
          </button>
        )}
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E0DAD0] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-[#0F1420]/70">
              Total Operators
            </span>
            <Building2 className="w-4 h-4 text-[#C9A052]" />
          </div>
          <p className="text-2xl font-black font-mono text-[#0F1420] mt-2">{totalOps}</p>
          <span className="text-[11px] text-gray-500">Active fleet partners</span>
        </div>

        <div className="bg-white border border-[#E0DAD0] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-emerald-800">
              Fully Approved
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black font-mono text-emerald-700 mt-2">{approvedOps}</p>
          <span className="text-[11px] text-emerald-800/80">100% compliant for quoting</span>
        </div>

        <div className="bg-white border border-[#E0DAD0] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-amber-800">
              Pending / Conditional
            </span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black font-mono text-amber-700 mt-2">{pendingOps}</p>
          <span className="text-[11px] text-amber-800/80">Audit action needed</span>
        </div>

        <div className="bg-white border border-[#E0DAD0] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-red-800">
              Expiring &le; 60 Days
            </span>
            <Clock className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-black font-mono text-red-700 mt-2">{expiringWithin60}</p>
          <span className="text-[11px] text-red-800/80">AOC or insurance renewals</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-[#E0DAD0] rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search operator, AOC #, or ICAO base..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#0F1420] placeholder-gray-400 focus:outline-none focus:border-[#C9A052]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: "all", label: "All Operators" },
            { id: "approved", label: "Approved" },
            { id: "pending", label: "Pending Audit" },
            { id: "expiring", label: "Expiring Soon" },
            { id: "suspended", label: "Suspended" }
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

      {/* Operators Grid / Table */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F5F2EC] border-b border-[#E0DAD0] text-[#0F1420]/80 font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4">Operator & Base</th>
                <th className="py-3 px-4">AOC Certificate</th>
                <th className="py-3 px-4">AOC Expiry</th>
                <th className="py-3 px-4">Safety Audit</th>
                <th className="py-3 px-4">Insurance Expiry</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0DAD0]/60">
              {filteredOperators.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-gray-500 font-mono">
                    No operators found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredOperators.map((op) => {
                  const passCount = op.qualificationChecklist.filter((d) => d.status === "pass").length;
                  const totalDocs = op.qualificationChecklist.length;

                  return (
                    <tr key={op.id} className="hover:bg-[#FDFCFA] transition-colors">
                      {/* Operator & Base */}
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="font-bold text-[#0F1420] flex items-center gap-1.5">
                            <span>{op.tradingName}</span>
                            <span className="px-1.5 py-0.2 rounded bg-[#0F1420]/5 text-[#0F1420]/70 font-mono text-[10px]">
                              {op.baseIcao}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500">{op.legalName}</p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                            <span className="flex items-center gap-0.5">
                              <Mail className="w-2.5 h-2.5" />
                              {op.salesEmail}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* AOC Certificate */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-[#0F1420]">{op.aocNumber}</div>
                        <p className="text-[10px] text-gray-500">{op.aocAuthority}</p>
                      </td>

                      {/* AOC Expiry */}
                      <td className="py-3.5 px-4">
                        {getExpiryBadge(op.aocExpiry)}
                      </td>

                      {/* Safety Audit */}
                      <td className="py-3.5 px-4">
                        {op.safetyRating ? (
                          <div>
                            <span className="font-bold font-mono text-[#0F1420]">
                              {op.safetyRating}
                            </span>
                            <p className="text-[10px] text-gray-500">{op.safetyRatingProvider}</p>
                          </div>
                        ) : (
                          <span className="text-[11px] font-mono text-gray-400">Not Audited</span>
                        )}
                      </td>

                      {/* Insurance Expiry */}
                      <td className="py-3.5 px-4">
                        {getExpiryBadge(op.insuranceExpiry)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {getStatusBadge(op.status)}
                          <div className="text-[10px] font-mono text-gray-500">
                            {passCount}/{totalDocs} Docs Verified
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedOperator(op)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#F5F2EC] hover:bg-[#EAE6DE] text-[#0F1420] font-mono font-bold text-[11px] transition-colors border border-[#E0DAD0] flex items-center gap-1"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-[#C9A052]" />
                            <span>Qualification</span>
                          </button>

                          {canEdit && (
                            <select
                              value={op.status}
                              onChange={(e) => handleStatusChange(op.id, e.target.value as any)}
                              className="bg-white border border-[#E0DAD0] rounded-lg px-2 py-1 text-[11px] font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                            >
                              <option value="approved">Approved</option>
                              <option value="approved_with_conditions">Conditional</option>
                              <option value="pending">Pending</option>
                              <option value="suspended">Suspended</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          )}
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

      {/* Qualification Checklist Modal / Drawer */}
      {selectedOperator && (
        <div className="fixed inset-0 z-50 bg-[#0F1420]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-[#E0DAD0] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-[#0F1420] text-white flex items-center justify-between border-b border-[#1C2436]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#C9A052]/20 text-[#C9A052] border border-[#C9A052]/30">
                    OPERATOR AUDIT & COMPLIANCE FILE
                  </span>
                  <span className="text-xs text-gray-400">AOC #{selectedOperator.aocNumber}</span>
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  {selectedOperator.tradingName} ({selectedOperator.legalName})
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Base: {selectedOperator.baseIcao} • Authority: {selectedOperator.aocAuthority} • Safety: {selectedOperator.safetyRating || "Unrated"}
                </p>
              </div>

              <button
                onClick={() => setSelectedOperator(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Checklist Progress Bar */}
            <div className="px-6 py-3 bg-[#F5F2EC] border-b border-[#E0DAD0] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#0F1420]">9-Point Broker Qualification Standard:</span>
                <span className="text-[#9A7A35] font-black">
                  {selectedOperator.qualificationChecklist.filter((d) => d.status === "pass").length} /{" "}
                  {selectedOperator.qualificationChecklist.length} PASSED
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500">Current Status:</span>
                {getStatusBadge(selectedOperator.status)}
              </div>
            </div>

            {/* Scrollable Checklist Items */}
            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {selectedOperator.qualificationChecklist.map((doc, idx) => (
                <div
                  key={doc.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    doc.status === "pass"
                      ? "border-emerald-200 bg-emerald-50/40"
                      : doc.status === "fail"
                      ? "border-red-200 bg-red-50/40"
                      : "border-amber-200 bg-amber-50/40"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <span className="h-5 w-5 rounded-full bg-[#0F1420] text-[#C9A052] font-mono font-bold text-[10px] flex items-center justify-center mt-0.5 flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-xs text-[#0F1420] flex items-center gap-2">
                          <span>{doc.docType}</span>
                          {doc.expiryDate && (
                            <span className="text-[10px] font-mono text-gray-500">
                              (Exp: {doc.expiryDate})
                            </span>
                          )}
                        </div>
                        {doc.notes && (
                          <p className="text-[11px] text-gray-600 mt-0.5">{doc.notes}</p>
                        )}
                      </div>
                    </div>

                    {/* Pass / Pending / Fail Action Buttons */}
                    {canEdit ? (
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleChecklistToggle(doc.id, "pass")}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                            doc.status === "pass"
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "bg-white text-gray-600 border border-gray-300 hover:bg-emerald-50"
                          }`}
                        >
                          Pass
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChecklistToggle(doc.id, "pending")}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                            doc.status === "pending"
                              ? "bg-amber-600 text-white shadow-sm"
                              : "bg-white text-gray-600 border border-gray-300 hover:bg-amber-50"
                          }`}
                        >
                          Pending
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChecklistToggle(doc.id, "fail")}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                            doc.status === "fail"
                              ? "bg-red-600 text-white shadow-sm"
                              : "bg-white text-gray-600 border border-gray-300 hover:bg-red-50"
                          }`}
                        >
                          Fail
                        </button>
                      </div>
                    ) : (
                      <span className="font-mono text-[10px] uppercase font-bold text-gray-600">
                        Status: {doc.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {selectedOperator.notes && (
                <div className="p-3 bg-[#F5F2EC] rounded-xl border border-[#E0DAD0] text-xs text-[#0F1420]/80">
                  <span className="font-mono font-bold text-[10px] uppercase block mb-1 text-[#9A7A35]">
                    Broker Internal Notes:
                  </span>
                  <p>{selectedOperator.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#FDFCFA] border-t border-[#E0DAD0] flex items-center justify-between">
              <div className="text-[11px] text-gray-500 font-mono">
                Commercial Contact: {selectedOperator.salesContact} ({selectedOperator.opsPhone})
              </div>

              <button
                type="button"
                onClick={() => setSelectedOperator(null)}
                className="px-4 py-2 rounded-xl bg-[#0F1420] text-white text-xs font-mono font-bold hover:bg-[#1A2338]"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Operator Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F1420]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#E0DAD0] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 bg-[#0F1420] text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Add New Charter Fleet Operator</h3>
                <p className="text-xs text-gray-400">Register and qualify a certified EASA/FAA carrier</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-[#0F1420]/70 mb-1">
                    Legal Entity Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VistaJet Aviation Malta Ltd"
                    value={newOp.legalName}
                    onChange={(e) => setNewOp({ ...newOp, legalName: e.target.value })}
                    className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-3 py-1.5 font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-[#0F1420]/70 mb-1">
                    Trading / Brand Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. VistaJet"
                    value={newOp.tradingName}
                    onChange={(e) => setNewOp({ ...newOp, tradingName: e.target.value })}
                    className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-3 py-1.5 text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-[#0F1420]/70 mb-1">
                    AOC Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MT-03 or FR.AOC.0842"
                    value={newOp.aocNumber}
                    onChange={(e) => setNewOp({ ...newOp, aocNumber: e.target.value })}
                    className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-3 py-1.5 font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-[#0F1420]/70 mb-1">
                    AOC Issuing Authority
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TM-CAD, DGAC, FAA"
                    value={newOp.aocAuthority}
                    onChange={(e) => setNewOp({ ...newOp, aocAuthority: e.target.value })}
                    className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-3 py-1.5 text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-[#0F1420]/70 mb-1">
                    Base Airport (ICAO)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LMML, LFMN"
                    maxLength={4}
                    value={newOp.baseIcao}
                    onChange={(e) => setNewOp({ ...newOp, baseIcao: e.target.value.toUpperCase() })}
                    className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-3 py-1.5 font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-[#0F1420]/70 mb-1">
                    AOC Expiry Date
                  </label>
                  <input
                    type="date"
                    value={newOp.aocExpiry}
                    onChange={(e) => setNewOp({ ...newOp, aocExpiry: e.target.value })}
                    className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-3 py-1.5 text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-[#0F1420]/70 mb-1">
                    Insurance Expiry Date
                  </label>
                  <input
                    type="date"
                    value={newOp.insuranceExpiry}
                    onChange={(e) => setNewOp({ ...newOp, insuranceExpiry: e.target.value })}
                    className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-3 py-1.5 text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-[#0F1420]/70 mb-1">
                    Safety Audit Rating
                  </label>
                  <select
                    value={newOp.safetyRating}
                    onChange={(e) => setNewOp({ ...newOp, safetyRating: e.target.value })}
                    className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-3 py-1.5 font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  >
                    <option value="ARGUS Platinum">ARGUS Platinum</option>
                    <option value="ARGUS Gold+">ARGUS Gold+</option>
                    <option value="IS-BAO Stage 3">IS-BAO Stage 3</option>
                    <option value="IS-BAO Stage 2">IS-BAO Stage 2</option>
                    <option value="Wyvern Wingman">Wyvern Wingman</option>
                    <option value="None">Self-Audited / None</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-[#0F1420]/70 mb-1">
                    Safety Audit Provider
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ARGUS International, IBAC"
                    value={newOp.safetyRatingProvider}
                    onChange={(e) => setNewOp({ ...newOp, safetyRatingProvider: e.target.value })}
                    className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-3 py-1.5 text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-[#0F1420]/70 mb-1">
                    Charter Sales Contact & Email
                  </label>
                  <input
                    type="text"
                    placeholder="Contact Name"
                    value={newOp.salesContact}
                    onChange={(e) => setNewOp({ ...newOp, salesContact: e.target.value })}
                    className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-3 py-1.5 text-[#0F1420] mb-2 focus:outline-none focus:border-[#C9A052]"
                  />
                  <input
                    type="email"
                    placeholder="sales@operator.com"
                    value={newOp.salesEmail}
                    onChange={(e) => setNewOp({ ...newOp, salesEmail: e.target.value })}
                    className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-3 py-1.5 font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-[#0F1420]/70 mb-1">
                    24/7 Operations Phone & Email
                  </label>
                  <input
                    type="text"
                    placeholder="+33 4 93 00 00 00"
                    value={newOp.opsPhone}
                    onChange={(e) => setNewOp({ ...newOp, opsPhone: e.target.value })}
                    className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-3 py-1.5 font-mono text-[#0F1420] mb-2 focus:outline-none focus:border-[#C9A052]"
                  />
                  <input
                    type="email"
                    placeholder="ops@operator.com"
                    value={newOp.opsEmail}
                    onChange={(e) => setNewOp({ ...newOp, opsEmail: e.target.value })}
                    className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-3 py-1.5 font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-bold text-[#0F1420]/70 mb-1">
                  Fleet & Special Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes on fleet types, operating limits, de-icing policies..."
                  value={newOp.notes}
                  onChange={(e) => setNewOp({ ...newOp, notes: e.target.value })}
                  className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg p-2.5 text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E0DAD0]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#0F1420] font-mono font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] font-mono font-black shadow-md"
                >
                  Save & Initiate Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
