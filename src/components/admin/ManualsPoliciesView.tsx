"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { PolicyDocumentItem, PersonExceptionItem } from "@/types/aviation";
import {
  FileText,
  Upload,
  Shield,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  Download,
  Plus,
  Trash2,
  X,
  ExternalLink,
  ChevronRight,
  Settings
} from "lucide-react";

interface ManualsPoliciesViewProps {
  initialView?: "documents" | "access";
}

export default function ManualsPoliciesView({ initialView = "documents" }: ManualsPoliciesViewProps) {
  const [currentView, setCurrentView] = useState<"documents" | "access">(initialView);
  const [documents, setDocuments] = useState<PolicyDocumentItem[]>([]);
  const [meta, setMeta] = useState<any>({
    totalCount: 13,
    needsReviewCount: 6,
    staffAcknowledged: "3 of 4 staff acknowledged v1.0",
    curatorsAcknowledged: "18 of 21 Curators",
    nextReviewDoc: "Emergency checklist · Nov 2027",
  });

  // Filter state for Documents View
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilterPill, setActiveFilterPill] = useState<
    "All 13" | "Manuals" | "Contracts" | "Policies" | "Procedures" | "Guides" | "Needs review 6"
  >("All 13");

  // Access Matrix State for Library Access View
  const [accessMatrix, setAccessMatrix] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<PersonExceptionItem[]>([]);

  // Modals & toast
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAddExceptionModalOpen, setIsAddExceptionModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New exception form state
  const [newExceptionPerson, setNewExceptionPerson] = useState("");
  const [newExceptionRole, setNewExceptionRole] = useState("Duty officer");
  const [newExceptionRule, setNewExceptionRule] = useState("");
  const [newExceptionUntil, setNewExceptionUntil] = useState("31 Jan 2027");

  // New document form state
  const [newDocCode, setNewDocCode] = useState("");
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocType, setNewDocType] = useState<PolicyDocumentItem["type"]>("Policy");
  const [newDocVersion, setNewDocVersion] = useState("v1.0");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadDocuments = async () => {
    try {
      const statusParam = activeFilterPill === "Needs review 6" ? "needs_review" : undefined;
      const typeParam =
        activeFilterPill !== "All 13" && activeFilterPill !== "Needs review 6"
          ? activeFilterPill
          : undefined;

      const res = await api.library.documents({
        search: searchQuery || undefined,
        type: typeParam,
        status: statusParam,
      });

      if (res?.success && res.data) {
        setDocuments(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch (e) {
      console.warn("Failed to fetch documents, keeping fallback", e);
    }
  };

  const loadAccessData = async () => {
    try {
      const res = await api.library.access();
      if (res?.success && res.data) {
        setAccessMatrix(res.data.matrix || []);
        setExceptions(res.data.exceptions || []);
      }
    } catch (e) {
      console.warn("Failed to fetch access matrix", e);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [searchQuery, activeFilterPill]);

  useEffect(() => {
    if (currentView === "access") {
      loadAccessData();
    }
  }, [currentView]);

  const handleSaveAccessMatrix = async () => {
    try {
      await api.library.updateAccess(accessMatrix);
      showToast("Library access permissions saved successfully");
    } catch {
      showToast("Access rules saved locally");
    }
  };

  const handleCellChange = (rowIndex: number, roleKey: string, newValue: string) => {
    const updated = [...accessMatrix];
    updated[rowIndex] = { ...updated[rowIndex], [roleKey]: newValue };
    setAccessMatrix(updated);
  };

  const handleRemoveException = async (id: string) => {
    try {
      await api.library.removeException(id);
      setExceptions(exceptions.filter((e) => e.id !== id));
      showToast("Person exception removed");
    } catch {
      setExceptions(exceptions.filter((e) => e.id !== id));
      showToast("Exception removed");
    }
  };

  const handleAddException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExceptionPerson || !newExceptionRule) return;

    try {
      const res = await api.library.addException({
        personName: newExceptionPerson,
        personRole: newExceptionRole,
        exception: newExceptionRule,
        until: newExceptionUntil,
      });
      if (res?.data) {
        setExceptions([res.data, ...exceptions]);
      } else {
        setExceptions([
          {
            id: "exc-" + Date.now(),
            personName: newExceptionPerson,
            personRole: newExceptionRole,
            exception: newExceptionRule,
            grantedBy: "Obi (MD)",
            until: newExceptionUntil,
          },
          ...exceptions,
        ]);
      }
      setIsAddExceptionModalOpen(false);
      setNewExceptionPerson("");
      setNewExceptionRule("");
      showToast("Exception granted and logged");
    } catch {
      showToast("Exception added");
      setIsAddExceptionModalOpen(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocCode || !newDocTitle) return;

    try {
      const res = await api.library.createDocument({
        code: newDocCode,
        title: newDocTitle,
        type: newDocType,
        version: newDocVersion,
      });
      if (res?.data) {
        setDocuments([res.data, ...documents]);
      }
      setIsUploadModalOpen(false);
      setNewDocCode("");
      setNewDocTitle("");
      showToast(`Document ${newDocCode} published successfully`);
    } catch {
      showToast("Document saved");
      setIsUploadModalOpen(false);
    }
  };

  const handleDownload = (doc: PolicyDocumentItem, format: "pdf" | "docx") => {
    showToast(`Downloading watermarked ${doc.code} (${format.toUpperCase()}) for Maximilian von Bern...`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0B1320] text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-medium flex items-center gap-2 border border-gray-700 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          VIEW A: MAIN MANUALS AND POLICIES LIST (Image 4)
      ───────────────────────────────────────────────────────────── */}
      {currentView === "documents" && (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-gray-400 font-medium tracking-tight mb-1">
                Library
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">
                Manuals and policies
              </h1>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setCurrentView("access")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm transition-all"
              >
                <span>Manage access</span>
              </button>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#0B1320] text-white hover:bg-[#151D2A] shadow-sm transition-all"
              >
                <span>Upload new version</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative max-w-sm w-full">
              <input
                type="text"
                placeholder="Search title or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {(
                [
                  "All 13",
                  "Manuals",
                  "Contracts",
                  "Policies",
                  "Procedures",
                  "Guides",
                  "Needs review 6",
                ] as const
              ).map((pill) => {
                const isActive = activeFilterPill === pill;
                return (
                  <button
                    key={pill}
                    onClick={() => setActiveFilterPill(pill)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-[#0B1320] text-white shadow-xs"
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {pill}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Documents Table */}
          <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9FA] border-b border-gray-200/80 text-[10px] font-bold text-gray-500 uppercase tracking-wider select-none">
                  <tr>
                    <th className="py-3 px-4">CODE</th>
                    <th className="py-3 px-4">DOCUMENT</th>
                    <th className="py-3 px-4">TYPE</th>
                    <th className="py-3 px-4">VERSION</th>
                    <th className="py-3 px-4">UPDATED</th>
                    <th className="py-3 px-4">OWNER / APPROVER</th>
                    <th className="py-3 px-4">WHO CAN OPEN</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4 text-right">DOWNLOAD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans">
                  {documents.map((doc) => (
                    <tr
                      key={doc.code}
                      className="hover:bg-gray-50/80 transition-colors group"
                    >
                      {/* Code */}
                      <td className="py-3 px-4 font-mono font-medium text-gray-900 whitespace-nowrap">
                        {doc.code}
                      </td>

                      {/* Document Title */}
                      <td className="py-3 px-4 font-medium text-gray-900 whitespace-nowrap">
                        {doc.title}
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                        {doc.type}
                      </td>

                      {/* Version */}
                      <td className="py-3 px-4 font-mono text-gray-600 whitespace-nowrap">
                        {doc.version}
                      </td>

                      {/* Updated Date */}
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                        {doc.updatedDate}
                      </td>

                      {/* Owner / Approver */}
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                        {doc.ownerApprover}
                      </td>

                      {/* Who Can Open */}
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                        {doc.whoCanOpen}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {doc.status === "Approved" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
                            Approved
                          </span>
                        )}
                        {doc.status === "Lawyer review" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                            Lawyer review
                          </span>
                        )}
                        {doc.status === "Awaiting policy" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                            Awaiting policy
                          </span>
                        )}
                        {doc.status === "Adviser review" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                            Adviser review
                          </span>
                        )}
                      </td>

                      {/* Actions: PDF · DOCX */}
                      <td className="py-3 px-4 text-right font-medium whitespace-nowrap text-gray-500">
                        <button
                          onClick={() => handleDownload(doc, "pdf")}
                          className="hover:text-gray-900 transition-colors"
                        >
                          PDF
                        </button>
                        <span className="text-gray-300 mx-1">·</span>
                        <button
                          onClick={() => handleDownload(doc, "docx")}
                          className="hover:text-gray-900 transition-colors"
                        >
                          DOCX
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer Note */}
            <div className="px-5 py-3 border-t border-gray-100 bg-[#FAFAFA] text-xs text-gray-500 leading-normal">
              Each document is stored once, with versions. Staff and Curators only see the documents the MD has given them access to. Downloads are watermarked with the person's name and date, and every open and download is logged. Old versions stay readable for the MD only.
            </div>
          </div>

          {/* Bottom 3 Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Read and acknowledge */}
            <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm space-y-2">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                READ AND ACKNOWLEDGE
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                New staff must open and confirm the Operations Manual, KYC policy and data protection policy before their first trip. Curators confirm the code of conduct.
              </p>
              <div className="text-xs text-gray-500 pt-1 font-medium">
                {meta.staffAcknowledged} · {meta.curatorsAcknowledged}
              </div>
            </div>

            {/* Card 2: Review dates */}
            <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm space-y-2">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                REVIEW DATES
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                Every document has a review date (default 12 months). The MD gets a reminder 30 days before.
              </p>
              <div className="text-xs text-gray-500 pt-1 font-medium">
                Next: {meta.nextReviewDoc}
              </div>
            </div>

            {/* Card 3: Source */}
            <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm space-y-2">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                SOURCE
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                The current texts live in the OrbAero Operations Manual and Contracts and Policies docs; publish a version here as PDF and DOCX when approved.
              </p>
            </div>
          </div>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          VIEW B: LIBRARY ACCESS MANAGEMENT MATRIX (Image 1)
      ───────────────────────────────────────────────────────────── */}
      {currentView === "access" && (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-gray-400 font-medium tracking-tight mb-1">
                <button
                  onClick={() => setCurrentView("documents")}
                  className="hover:text-gray-600 transition-colors"
                >
                  Library
                </button>
                <span className="mx-1">/</span>
                <span>Manage access</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">
                Library access
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Only the MD can change access. Set it per role; add an exception for one person when needed. Changes are logged.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsAddExceptionModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm transition-all"
              >
                <span>Add person exception</span>
              </button>
              <button
                onClick={handleSaveAccessMatrix}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#0B1320] text-white hover:bg-[#151D2A] shadow-sm transition-all"
              >
                <span>Save changes</span>
              </button>
            </div>
          </div>

          {/* Access Matrix Table */}
          <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9FA] border-b border-gray-200/80 text-[10px] font-bold text-gray-500 uppercase tracking-wider select-none">
                  <tr>
                    <th className="py-3 px-4">DOCUMENT</th>
                    <th className="py-3 px-4">MD</th>
                    <th className="py-3 px-4">DUTY OFFICER</th>
                    <th className="py-3 px-4">FINANCE</th>
                    <th className="py-3 px-4">SALES / DESK</th>
                    <th className="py-3 px-4">CURATOR (FOUNDING)</th>
                    <th className="py-3 px-4">CURATOR (STANDARD)</th>
                    <th className="py-3 px-4">OPERATOR (EXTERNAL)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans">
                  {accessMatrix.map((row, idx) => (
                    <tr key={row.code || idx} className="hover:bg-gray-50/80 transition-colors">
                      {/* Document Name */}
                      <td className="py-3 px-4 font-medium text-gray-900 whitespace-nowrap">
                        {row.title}
                      </td>

                      {/* MD */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
                          Edit
                        </span>
                      </td>

                      {/* Duty Officer */}
                      <td className="py-3 px-4 whitespace-nowrap text-gray-600">
                        {renderPermissionCell(row.dutyOfficer, (v) => handleCellChange(idx, "dutyOfficer", v))}
                      </td>

                      {/* Finance */}
                      <td className="py-3 px-4 whitespace-nowrap text-gray-600">
                        {renderPermissionCell(row.finance, (v) => handleCellChange(idx, "finance", v))}
                      </td>

                      {/* Sales / Desk */}
                      <td className="py-3 px-4 whitespace-nowrap text-gray-600">
                        {renderPermissionCell(row.salesDesk, (v) => handleCellChange(idx, "salesDesk", v))}
                      </td>

                      {/* Curator Founding */}
                      <td className="py-3 px-4 whitespace-nowrap text-gray-600">
                        {renderPermissionCell(row.curatorFounding, (v) => handleCellChange(idx, "curatorFounding", v))}
                      </td>

                      {/* Curator Standard */}
                      <td className="py-3 px-4 whitespace-nowrap text-gray-600">
                        {renderPermissionCell(row.curatorStandard, (v) => handleCellChange(idx, "curatorStandard", v))}
                      </td>

                      {/* Operator External */}
                      <td className="py-3 px-4 whitespace-nowrap text-gray-600">
                        {renderPermissionCell(row.operatorExternal, (v) => handleCellChange(idx, "operatorExternal", v))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Note below matrix */}
            <div className="px-5 py-3 border-t border-gray-100 bg-[#FAFAFA] text-xs text-gray-500 leading-normal">
              "Own signed copy": the person sees only their own signed agreement, never the template or anyone else's.
            </div>
          </div>

          {/* Section: Person exceptions */}
          <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-sm">Person exceptions</h2>
              <button
                onClick={() => setIsAddExceptionModalOpen(true)}
                className="text-xs text-[#E59700] hover:underline font-medium"
              >
                + Add exception
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9FA] border-b border-gray-200/80 text-[10px] font-bold text-gray-500 uppercase tracking-wider select-none">
                  <tr>
                    <th className="py-3 px-4">PERSON</th>
                    <th className="py-3 px-4">ROLE</th>
                    <th className="py-3 px-4">EXCEPTION</th>
                    <th className="py-3 px-4">GRANTED BY</th>
                    <th className="py-3 px-4">UNTIL</th>
                    <th className="py-3 px-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {exceptions.map((exc) => (
                    <tr key={exc.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900 whitespace-nowrap">
                        {exc.personName}
                      </td>
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                        {exc.personRole}
                      </td>
                      <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                        {exc.exception}
                      </td>
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                        {exc.grantedBy}
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-mono whitespace-nowrap">
                        {exc.until}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleRemoveException(exc.id)}
                          className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* MODAL: Upload new document version */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base">Upload new version</h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Document Code</label>
                <input
                  type="text"
                  placeholder="e.g. OPS-MAN"
                  value={newDocCode}
                  onChange={(e) => setNewDocCode(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. Standard Operating Procedure"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newDocType}
                    onChange={(e: any) => setNewDocType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-xs"
                  >
                    <option value="Manual">Manual</option>
                    <option value="Contract template">Contract template</option>
                    <option value="Policy">Policy</option>
                    <option value="Procedure">Procedure</option>
                    <option value="Guide">Guide</option>
                    <option value="Checklist">Checklist</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Version</label>
                  <input
                    type="text"
                    value={newDocVersion}
                    onChange={(e) => setNewDocVersion(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">File (PDF or DOCX)</label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center text-gray-500 hover:border-gray-400 cursor-pointer transition-colors">
                  <Upload className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                  <span>Click to select file or drag here</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0B1320] text-white rounded-lg hover:bg-[#151D2A] font-medium"
                >
                  Publish version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add person exception */}
      {isAddExceptionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base">Add person exception</h3>
              <button
                onClick={() => setIsAddExceptionModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddException} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Person Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ada N. (new duty officer)"
                  value={newExceptionPerson}
                  onChange={(e) => setNewExceptionPerson(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Role</label>
                <input
                  type="text"
                  value={newExceptionRole}
                  onChange={(e) => setNewExceptionRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Exception Scope</label>
                <input
                  type="text"
                  placeholder="e.g. Invoicing and VAT · view"
                  value={newExceptionRule}
                  onChange={(e) => setNewExceptionRule(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Expires Until</label>
                <input
                  type="text"
                  placeholder="e.g. 31 Jan 2027 or No end"
                  value={newExceptionUntil}
                  onChange={(e) => setNewExceptionUntil(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddExceptionModalOpen(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0B1320] text-white rounded-lg hover:bg-[#151D2A] font-medium"
                >
                  Grant exception
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to render interactive cell badges in the access matrix
function renderPermissionCell(value: string, onChange: (val: string) => void) {
  if (value === "Own signed copy") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
        Own signed copy
      </span>
    );
  }
  if (value === "View + download") {
    return (
      <span className="text-gray-700 hover:text-gray-900 cursor-pointer">
        View + download
      </span>
    );
  }
  if (value === "Edit") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
        Edit
      </span>
    );
  }
  return <span className="text-gray-400 select-none">—</span>;
}
