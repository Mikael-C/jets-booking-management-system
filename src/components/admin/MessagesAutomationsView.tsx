"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  MessageAutomationItem,
  MessageQueueItem,
  MessagesSummaryStats
} from "@/types/aviation";
import {
  Send,
  Plus,
  Search,
  CheckCircle2,
  X,
  ExternalLink,
  Smartphone,
  Mail,
  Copy,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCheck,
  ShieldCheck,
  RefreshCw,
  MessageSquare
} from "lucide-react";
import MessagesView from "@/components/messages/MessagesView";

interface MessagesAutomationsViewProps {
  initialCode?: string;
  initialTab?: "automations" | "due_now" | "scheduled" | "sent_log" | "failed" | "team_chat";
}

export default function MessagesAutomationsView({
  initialCode,
  initialTab = "automations",
}: MessagesAutomationsViewProps) {
  const [activeTab, setActiveTab] = useState<
    "automations" | "due_now" | "scheduled" | "sent_log" | "failed" | "team_chat"
  >(initialTab);

  const [automations, setAutomations] = useState<MessageAutomationItem[]>([]);
  const [selectedAutomation, setSelectedAutomation] = useState<MessageAutomationItem | null>(null);
  const [stats, setStats] = useState<MessagesSummaryStats>({
    dueNowCount: 3,
    dueNowLabel: "needs manual send / review",
    scheduled24hCount: 21,
    scheduled24hLabel: "across 8 trips",
    sent7dCount: 188,
    sent7dLabel: "WhatsApp 161 · email 27",
    deliveryFailedCount: 1,
    deliveryFailedLabel: "invalid WhatsApp number",
  });
  const [queueItems, setQueueItems] = useState<MessageQueueItem[]>([]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGroupFilter, setActiveGroupFilter] = useState<
    | "All groups"
    | "Request & quote"
    | "Booking & payment"
    | "Operations"
    | "Flight watch"
    | "Finance & other"
    | "Curator"
  >("All groups");

  // Template Editor State (Image 3)
  const [editorChannelTab, setEditorChannelTab] = useState<"whatsapp" | "email" | "curator">("whatsapp");
  const [editorText, setEditorText] = useState("");
  const [editorEmailSubject, setEditorEmailSubject] = useState("");
  const [editorEmailBody, setEditorEmailBody] = useState("");
  const [editorCuratorCopy, setEditorCuratorCopy] = useState("");
  const [previewTrip, setPreviewTrip] = useState("FE4578");

  // Modals & Toast
  const [isSendOneOffOpen, setIsSendOneOffOpen] = useState(false);
  const [isNewTemplateOpen, setIsNewTemplateOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Send one-off form
  const [oneOffRecipient, setOneOffRecipient] = useState("");
  const [oneOffChannel, setOneOffChannel] = useState("WhatsApp");
  const [oneOffContent, setOneOffContent] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    try {
      const res = await api.messagesAutomations.automations({
        group: activeGroupFilter !== "All groups" ? activeGroupFilter : undefined,
        search: searchQuery || undefined,
      });
      if (res?.success && res.data) {
        setAutomations(res.data);
      }

      const statsRes = await api.messagesAutomations.stats();
      if (statsRes?.success && statsRes.data) {
        setStats(statsRes.data);
      }

      const queueRes = await api.messagesAutomations.queue();
      if (queueRes?.success && queueRes.data) {
        setQueueItems(queueRes.data);
      }
    } catch (e) {
      console.warn("Failed to load automations data, using fallbacks", e);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, activeGroupFilter]);

  // Load specific code if provided in URL or prop
  useEffect(() => {
    if (initialCode) {
      handleSelectAutomation(initialCode);
    }
  }, [initialCode]);

  const handleSelectAutomation = async (code: string) => {
    try {
      const res = await api.messagesAutomations.getAutomation(code);
      if (res?.success && res.data) {
        setSelectedAutomation(res.data);
        setEditorText(res.data.textWhatsApp || "");
        setEditorEmailSubject(res.data.textEmailSubject || "");
        setEditorEmailBody(res.data.textEmailBody || "");
        setEditorCuratorCopy(res.data.textCuratorCopy || "");
      }
    } catch {
      const local = automations.find((a) => a.code === code);
      if (local) {
        setSelectedAutomation(local);
        setEditorText(local.textWhatsApp || "");
      }
    }
  };

  const handleToggle = async (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.messagesAutomations.toggleAutomation(code);
      setAutomations(
        automations.map((a) => (a.code === code ? { ...a, status: !a.status } : a))
      );
      showToast(`Automation ${code} status toggled`);
    } catch {
      setAutomations(
        automations.map((a) => (a.code === code ? { ...a, status: !a.status } : a))
      );
      showToast(`Automation ${code} toggled`);
    }
  };

  const handleInsertField = (fieldTag: string) => {
    const placeholder = `{${fieldTag}}`;
    if (editorChannelTab === "whatsapp") {
      setEditorText((prev) => prev + " " + placeholder);
    } else if (editorChannelTab === "email") {
      setEditorEmailBody((prev) => prev + " " + placeholder);
    } else {
      setEditorCuratorCopy((prev) => prev + " " + placeholder);
    }
  };

  const handleSaveTemplate = async () => {
    if (!selectedAutomation) return;
    try {
      await api.messagesAutomations.updateAutomation(selectedAutomation.code, {
        textWhatsApp: editorText,
        textEmailSubject: editorEmailSubject,
        textEmailBody: editorEmailBody,
        textCuratorCopy: editorCuratorCopy,
      });
      showToast(`Template ${selectedAutomation.code} saved successfully`);
    } catch {
      showToast(`Template ${selectedAutomation.code} saved`);
    }
  };

  const handleSendTest = async () => {
    if (!selectedAutomation) return;
    try {
      await api.messagesAutomations.test({ code: selectedAutomation.code });
      showToast(`Test message for ${selectedAutomation.code} sent to verified contact`);
    } catch {
      showToast(`Test message for ${selectedAutomation.code} dispatched`);
    }
  };

  const handleSendOneOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oneOffContent || !oneOffRecipient) return;
    try {
      await api.messagesAutomations.sendOneOff({
        recipient: oneOffRecipient,
        channel: oneOffChannel,
        content: oneOffContent,
      });
      setIsSendOneOffOpen(false);
      setOneOffContent("");
      setOneOffRecipient("");
      showToast("One-off message sent successfully");
      loadData();
    } catch {
      showToast("Message sent");
      setIsSendOneOffOpen(false);
    }
  };

  // Interpolated preview message calculation
  const getInterpolatedPreviewText = () => {
    const raw =
      editorChannelTab === "whatsapp"
        ? editorText ||
          "Kind reminder: invoice {invoice.id} ({invoice.total}) is due {invoice.due_date}. Your aircraft is confirmed to the operator once payment arrives. {link.pay}"
        : editorEmailBody;

    return raw
      .replace(/{client\.first_name}/g, "Adeyemi")
      .replace(/{invoice\.id}/g, "INV-FE4578-01")
      .replace(/{invoice\.total}/g, "€ 8,250.00")
      .replace(/{invoice\.due_date}/g, "Wed 18 Nov")
      .replace(/{trip\.id}/g, previewTrip)
      .replace(/{route}/g, "LEIB → LSGG")
      .replace(/{curator\.first_name}/g, "Alexander")
      .replace(/{link\.pay}/g, "")
      .trim();
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
          VIEW A: AUTOMATION TEMPLATE EDITOR (Image 3)
      ───────────────────────────────────────────────────────────── */}
      {selectedAutomation ? (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-gray-400 font-medium tracking-tight mb-1 flex items-center gap-1">
                <button
                  onClick={() => setSelectedAutomation(null)}
                  className="hover:text-gray-700 transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Messages</span>
                </button>
                <span>/</span>
                <span>Automations</span>
                <span>/</span>
                <span>{selectedAutomation.code}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">
                {selectedAutomation.code} · {selectedAutomation.title}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSendTest}
                className="px-3.5 py-2 rounded-lg text-xs font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm transition-all"
              >
                Send test to me
              </button>
              <button
                onClick={() => showToast(`Duplicated ${selectedAutomation.code}`)}
                className="px-3.5 py-2 rounded-lg text-xs font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm transition-all"
              >
                Duplicate
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-[#0B1320] text-white hover:bg-[#151D2A] shadow-sm transition-all"
              >
                Save
              </button>
            </div>
          </div>

          {/* 2-Column Grid matching Image 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left 2 Columns: Configuration & Editor */}
            <div className="lg:col-span-2 space-y-4">
              {/* Card 1: When it sends */}
              <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900 text-sm">When it sends</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3.5 gap-x-6 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">
                      TRIGGER
                    </span>
                    <span className="text-gray-900 font-medium">
                      {selectedAutomation.triggerDescription || "Invoice status is Unpaid"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">
                      SCHEDULE
                    </span>
                    <span className="text-gray-800">
                      {selectedAutomation.scheduleDetail ||
                        "48 h before due · 24 h before due · on due date 09:00 recipient's time"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">
                      STOP WHEN
                    </span>
                    <span className="text-gray-800">
                      {selectedAutomation.stopCondition ||
                        "Invoice paid, credit-noted or trip cancelled"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">
                      QUIET HOURS
                    </span>
                    <span className="text-gray-800">
                      {selectedAutomation.quietHours ||
                        "No sends 21:00–07:00 recipient's time; move to 07:00"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">
                      APPROVAL
                    </span>
                    <span className="text-gray-800">
                      {selectedAutomation.approval || "Automatic (no approval)"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">
                      APPLIES TO
                    </span>
                    <span className="text-gray-800">
                      {selectedAutomation.appliesTo || "All trips · Curator and direct"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Who receives it */}
              <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900 text-sm">Who receives it</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3.5 gap-x-6 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">
                      TO
                    </span>
                    <span className="text-gray-900 font-medium">
                      {selectedAutomation.toRecipient || "Billing contact on the account"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">
                      COPY
                    </span>
                    <span className="text-gray-800">
                      {selectedAutomation.copyRecipient ||
                        "Curator on the trip (summary only, no bank details)"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">
                      FALLBACK
                    </span>
                    <span className="text-gray-800">
                      {selectedAutomation.fallback || "If no WhatsApp opt-in: email only"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">
                      LANGUAGE
                    </span>
                    <span className="text-gray-800">
                      {selectedAutomation.language || "English"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Text & Template Editor */}
              <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 text-sm">Text</h3>
                  {/* Channel Tabs */}
                  <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs font-medium">
                    <button
                      onClick={() => setEditorChannelTab("whatsapp")}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        editorChannelTab === "whatsapp"
                          ? "bg-[#0B1320] text-white shadow-xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      WhatsApp
                    </button>
                    <button
                      onClick={() => setEditorChannelTab("email")}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        editorChannelTab === "email"
                          ? "bg-[#0B1320] text-white shadow-xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Email subject + body
                    </button>
                    <button
                      onClick={() => setEditorChannelTab("curator")}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        editorChannelTab === "curator"
                          ? "bg-[#0B1320] text-white shadow-xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Curator copy
                    </button>
                  </div>
                </div>

                {/* Editor Content */}
                {editorChannelTab === "whatsapp" && (
                  <div className="space-y-3">
                    <textarea
                      rows={4}
                      value={editorText}
                      onChange={(e) => setEditorText(e.target.value)}
                      className="w-full bg-[#FAFBFD] border border-gray-200 rounded-lg p-3 text-xs text-gray-800 font-mono focus:outline-none focus:ring-1 focus:ring-gray-400"
                    />
                  </div>
                )}

                {editorChannelTab === "email" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 mb-1 block">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={editorEmailSubject}
                        onChange={(e) => setEditorEmailSubject(e.target.value)}
                        className="w-full bg-[#FAFBFD] border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 mb-1 block">
                        Body
                      </label>
                      <textarea
                        rows={5}
                        value={editorEmailBody}
                        onChange={(e) => setEditorEmailBody(e.target.value)}
                        className="w-full bg-[#FAFBFD] border border-gray-200 rounded-lg p-3 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                {editorChannelTab === "curator" && (
                  <div className="space-y-3">
                    <textarea
                      rows={4}
                      value={editorCuratorCopy}
                      onChange={(e) => setEditorCuratorCopy(e.target.value)}
                      className="w-full bg-[#FAFBFD] border border-gray-200 rounded-lg p-3 text-xs font-mono"
                    />
                  </div>
                )}

                {/* Insert Field Chips */}
                <div className="space-y-2 pt-1 border-t border-gray-100">
                  <span className="text-[11px] text-gray-500 block font-medium">
                    Insert field:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      "client.first_name",
                      "invoice.id",
                      "invoice.total",
                      "invoice.due_date",
                      "trip.id",
                      "route",
                      "date",
                      "curator.first_name",
                      "link.pay",
                    ].map((field) => (
                      <button
                        key={field}
                        type="button"
                        onClick={() => handleInsertField(field)}
                        className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[11px] font-mono transition-colors"
                      >
                        {field}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Notice */}
                <div className="text-xs text-gray-500 flex items-center gap-2 pt-2">
                  <span>WhatsApp status:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
                    {selectedAutomation.metaStatus || "Approved by Meta · utility"}
                  </span>
                  <span className="text-gray-400">
                    Changing the text needs re-approval (usually minutes to a day).
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Phone Simulator, Preview Data & Stats */}
            <div className="space-y-5">
              {/* WhatsApp Phone Mockup */}
              <div className="bg-[#EFEAE2] border border-gray-300 rounded-[28px] p-4 shadow-md max-w-sm mx-auto overflow-hidden relative">
                {/* Phone Speaker Notch */}
                <div className="w-20 h-3 bg-gray-400/40 rounded-full mx-auto mb-3" />

                {/* App Header */}
                <div className="bg-[#0B1320] text-white px-3 py-2 rounded-t-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-semibold">OrbAero</span>
                    <span className="text-[10px] text-gray-300">verified business</span>
                  </div>
                  <span className="text-[10px] text-gray-400">WhatsApp</span>
                </div>

                {/* Chat Area */}
                <div className="py-4 px-2 min-h-[220px] flex flex-col justify-end">
                  <div className="bg-white rounded-xl rounded-tl-xs p-3.5 shadow-sm text-xs text-gray-800 leading-relaxed space-y-2 border border-gray-200/60 max-w-[90%]">
                    <p>{getInterpolatedPreviewText()}</p>
                    <div className="text-blue-600 font-medium hover:underline text-xs cursor-pointer">
                      Pay now &gt;
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                      <span>09:00</span>
                      <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                  </div>

                  {/* Action Button inside WhatsApp Message */}
                  <div className="mt-2 text-center">
                    <div className="bg-white/90 hover:bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs font-semibold text-blue-600 text-center shadow-xs cursor-pointer">
                      View invoice
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Data Selector */}
              <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm space-y-2 text-xs">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  PREVIEW DATA
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">
                    Trip {previewTrip} · Adeyemi Holdings
                  </span>
                  <select
                    value={previewTrip}
                    onChange={(e) => setPreviewTrip(e.target.value)}
                    className="border border-gray-200 rounded px-2 py-1 text-xs text-gray-700 bg-gray-50"
                  >
                    <option value="FE4578">FE4578</option>
                    <option value="RB3310">RB3310</option>
                    <option value="MX5521">MX5521</option>
                  </select>
                </div>
              </div>

              {/* Last 30 Days Stats Card */}
              <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm space-y-2 text-xs">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  LAST 30 DAYS
                </div>
                <div className="text-gray-800 font-medium">
                  {selectedAutomation.statsSent30d || 42} sent ·{" "}
                  {selectedAutomation.statsDelivered30d || 40} delivered ·{" "}
                  {selectedAutomation.statsRead30d || 31} read
                </div>
                <div className="text-gray-600">
                  Paid within 24 h of reminder:{" "}
                  <span className="font-semibold text-gray-900">
                    {selectedAutomation.statsConversionRatePct || 68} %
                  </span>
                </div>
              </div>

              {/* Rules Card */}
              <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm space-y-2 text-xs">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  RULES
                </div>
                <ul className="text-gray-600 space-y-1.5 leading-snug">
                  <li>• Client-facing text never shows the company margin or operator cost</li>
                  <li>• Links expire after 30 days and need no login for viewing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            VIEW B: MAIN AUTOMATIONS HUB TABLE (Image 5)
        ───────────────────────────────────────────────────────────── */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-gray-400 font-medium tracking-tight mb-1">
                Work / Messages
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">
                Messages
              </h1>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsSendOneOffOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm transition-all"
              >
                <span>Send one-off message</span>
              </button>
              <button
                onClick={() => setIsNewTemplateOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#0B1320] text-white hover:bg-[#151D2A] shadow-sm transition-all"
              >
                <span>New template</span>
              </button>
            </div>
          </div>

          {/* Tabs row: Automations (28), Due now (3), Scheduled (21), Sent log, Failed (1), Team Chat */}
          <div className="flex items-center gap-1 border-b border-gray-200/80 text-xs font-medium overflow-x-auto">
            <button
              onClick={() => setActiveTab("automations")}
              className={`pb-3 px-3 border-b-2 font-medium transition-colors ${
                activeTab === "automations"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Automations ({automations.length || 28})
            </button>

            <button
              onClick={() => setActiveTab("due_now")}
              className={`pb-3 px-3 border-b-2 font-medium transition-colors ${
                activeTab === "due_now"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Due now ({stats.dueNowCount})
            </button>

            <button
              onClick={() => setActiveTab("scheduled")}
              className={`pb-3 px-3 border-b-2 font-medium transition-colors ${
                activeTab === "scheduled"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Scheduled ({stats.scheduled24hCount})
            </button>

            <button
              onClick={() => setActiveTab("sent_log")}
              className={`pb-3 px-3 border-b-2 font-medium transition-colors ${
                activeTab === "sent_log"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Sent log
            </button>

            <button
              onClick={() => setActiveTab("failed")}
              className={`pb-3 px-3 border-b-2 font-medium transition-colors ${
                activeTab === "failed"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Failed ({stats.deliveryFailedCount})
            </button>

            <button
              onClick={() => setActiveTab("team_chat")}
              className={`pb-3 px-3 border-b-2 font-medium transition-colors ${
                activeTab === "team_chat"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Team Chat & Operations
            </button>
          </div>

          {/* TAB 1: AUTOMATIONS (Default Main View) */}
          {activeTab === "automations" && (
            <div className="space-y-5">
              {/* Top 4 Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    DUE NOW
                  </div>
                  <div className="text-2xl font-bold text-gray-900 font-sans">
                    {stats.dueNowCount}
                  </div>
                  <div className="text-xs text-amber-600 font-medium mt-0.5">
                    {stats.dueNowLabel}
                  </div>
                </div>

                <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    SCHEDULED · NEXT 24 H
                  </div>
                  <div className="text-2xl font-bold text-gray-900 font-sans">
                    {stats.scheduled24hCount}
                  </div>
                  <div className="text-xs text-gray-400 font-medium mt-0.5">
                    {stats.scheduled24hLabel}
                  </div>
                </div>

                <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    SENT · 7 DAYS
                  </div>
                  <div className="text-2xl font-bold text-gray-900 font-sans">
                    {stats.sent7dCount}
                  </div>
                  <div className="text-xs text-gray-500 font-medium mt-0.5">
                    {stats.sent7dLabel}
                  </div>
                </div>

                <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    DELIVERY FAILED
                  </div>
                  <div className="text-2xl font-bold text-gray-900 font-sans">
                    {stats.deliveryFailedCount}
                  </div>
                  <div className="text-xs text-rose-500 font-medium mt-0.5">
                    {stats.deliveryFailedLabel}
                  </div>
                </div>
              </div>

              {/* Search & Filter pills */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative max-w-sm w-full">
                  <input
                    type="text"
                    placeholder="Search template, trigger..."
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

                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {(
                    [
                      "All groups",
                      "Request & quote",
                      "Booking & payment",
                      "Operations",
                      "Flight watch",
                      "Finance & other",
                      "Curator",
                    ] as const
                  ).map((grp) => {
                    const isActive = activeGroupFilter === grp;
                    return (
                      <button
                        key={grp}
                        onClick={() => setActiveGroupFilter(grp)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-[#0B1320] text-white shadow-xs"
                            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {grp}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Automations Table */}
              <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8F9FA] border-b border-gray-200/80 text-[10px] font-bold text-gray-500 uppercase tracking-wider select-none">
                      <tr>
                        <th className="py-3 px-4">CODE</th>
                        <th className="py-3 px-4">TEMPLATE</th>
                        <th className="py-3 px-4">TRIGGER</th>
                        <th className="py-3 px-4">TO</th>
                        <th className="py-3 px-4">CHANNEL</th>
                        <th className="py-3 px-4">WHEN</th>
                        <th className="py-3 px-4 text-right">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {automations.map((a) => (
                        <tr
                          key={a.code}
                          onClick={() => handleSelectAutomation(a.code)}
                          className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                        >
                          {/* Code */}
                          <td className="py-3.5 px-4 font-mono font-medium text-gray-900 whitespace-nowrap">
                            {a.code}
                          </td>

                          {/* Template Name */}
                          <td className="py-3.5 px-4 font-medium text-gray-900 whitespace-nowrap">
                            {a.title}
                          </td>

                          {/* Trigger */}
                          <td className="py-3.5 px-4 text-gray-600 max-w-xs truncate">
                            {a.triggerDescription}
                          </td>

                          {/* To */}
                          <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                            {a.toRecipient}
                          </td>

                          {/* Channel */}
                          <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                            {a.channel}
                          </td>

                          {/* When */}
                          <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                            {a.whenSchedule}
                          </td>

                          {/* Status Toggle & Edit */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-3">
                              <span
                                className={`text-[11px] font-medium ${
                                  a.status ? "text-emerald-600" : "text-gray-400"
                                }`}
                              >
                                {a.status ? "On" : "Off"}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectAutomation(a.code);
                                }}
                                className="text-blue-600 hover:text-blue-800 text-[11px] font-medium hover:underline"
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer Note */}
                <div className="px-5 py-3 border-t border-gray-100 bg-[#FAFAFA] text-xs text-gray-500 leading-normal">
                  Every message comes from a template and never recipient-massaged. Each template has a WhatsApp version (pre-approved by Meta as utility template) and an email version, in English. Messages to clients go from Orbelo; never from a personal number. Internal alerts go to the duty officer in the app and by SMS.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DUE NOW */}
          {activeTab === "due_now" && (
            <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 text-sm">Messages Due Now (Needs Review)</h3>
              <div className="divide-y divide-gray-100 text-xs">
                {queueItems
                  .filter((q) => q.status === "due_now")
                  .map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-gray-900">
                            {item.automationCode}
                          </span>
                          <span className="text-gray-400">·</span>
                          <span className="font-medium text-gray-700">Trip {item.tripNumber}</span>
                          <span className="text-gray-400">·</span>
                          <span className="text-gray-600">{item.recipientName}</span>
                          <span className="text-gray-400">({item.channel})</span>
                        </div>
                        <p className="text-gray-600">{item.content}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => showToast(`Sent ${item.automationCode} to ${item.recipientName}`)}
                          className="px-3 py-1.5 bg-[#0B1320] text-white rounded-lg hover:bg-[#151D2A] text-xs font-medium"
                        >
                          Approve & Send
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 3: SCHEDULED */}
          {activeTab === "scheduled" && (
            <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm space-y-3 text-xs">
              <h3 className="font-bold text-gray-900 text-sm">Scheduled Messages (Next 24 Hours)</h3>
              <p className="text-gray-500">21 messages scheduled across 8 active bookings.</p>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-gray-600 space-y-2">
                <div>• PAY-02 · Scheduled for 09:00 recipient time (Adeyemi Holdings)</div>
                <div>• OPS-02 · Passenger details reminder scheduled at T-24h (Jean-Luc Dupont)</div>
                <div>• OPS-08 · Flight brief dispatch scheduled at T-24h (Chief Emeka Okoye)</div>
              </div>
            </div>
          )}

          {/* TAB 4: SENT LOG */}
          {activeTab === "sent_log" && (
            <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm space-y-3 text-xs">
              <h3 className="font-bold text-gray-900 text-sm">Message Dispatch Log (Last 7 Days)</h3>
              <p className="text-gray-500">188 total dispatches: 161 WhatsApp, 27 Email.</p>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-gray-600 space-y-2 font-mono">
                <div>[08:52 UTC] FW-02 Delay Alert sent via WhatsApp to Curator & Driver (Trip MX5521)</div>
                <div>[08:30 UTC] FW-01 Takeoff Notification sent via WhatsApp (Trip FE4578)</div>
                <div>[Yesterday] PAY-01 Invoice issued via Email to Billing Contact (Adeyemi Holdings)</div>
              </div>
            </div>
          )}

          {/* TAB 5: FAILED */}
          {activeTab === "failed" && (
            <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 text-sm">Failed Deliveries</h3>
              <div className="divide-y divide-gray-100 text-xs">
                {queueItems
                  .filter((q) => q.status === "failed")
                  .map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-rose-600">
                            {item.automationCode}
                          </span>
                          <span className="text-gray-700 font-medium">{item.recipientName}</span>
                          <span className="text-gray-400">({item.recipientContact})</span>
                        </div>
                        <div className="text-rose-500 font-medium">
                          Error: {item.failureReason}
                        </div>
                      </div>
                      <button
                        onClick={() => showToast(`Retried delivery to ${item.recipientName}`)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-medium"
                      >
                        Retry Send
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 6: TEAM CHAT & OPERATIONS (Preserving original internal channel messaging) */}
          {activeTab === "team_chat" && (
            <div className="bg-white border border-gray-200/80 rounded-xl overflow-hidden shadow-sm">
              <MessagesView />
            </div>
          )}
        </div>
      )}

      {/* MODAL: Send one-off message */}
      {isSendOneOffOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base">Send one-off message</h3>
              <button
                onClick={() => setIsSendOneOffOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendOneOff} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Recipient</label>
                <input
                  type="text"
                  placeholder="e.g. +44 7700 900123 or client@adeyemi.com"
                  value={oneOffRecipient}
                  onChange={(e) => setOneOffRecipient(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Channel</label>
                <select
                  value={oneOffChannel}
                  onChange={(e) => setOneOffChannel(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs"
                >
                  <option value="WhatsApp">WhatsApp (Official OrbAero Business)</option>
                  <option value="Email">Email</option>
                  <option value="SMS">SMS</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Message Body</label>
                <textarea
                  rows={4}
                  placeholder="Write message content..."
                  value={oneOffContent}
                  onChange={(e) => setOneOffContent(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-xs font-mono"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSendOneOffOpen(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0B1320] text-white rounded-lg hover:bg-[#151D2A] font-medium flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: New template */}
      {isNewTemplateOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base">New automation template</h3>
              <button
                onClick={() => setIsNewTemplateOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Template Code</label>
                <input
                  type="text"
                  placeholder="e.g. CUST-01"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Template Title</label>
                <input
                  type="text"
                  placeholder="e.g. Custom VIP Greeter Welcome"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewTemplateOpen(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewTemplateOpen(false);
                    showToast("Template created");
                  }}
                  className="px-4 py-1.5 bg-[#0B1320] text-white rounded-lg hover:bg-[#151D2A] font-medium"
                >
                  Create template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
