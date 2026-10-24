"use client";

import React, { useState } from "react";
import { useAviation } from "@/lib/aviationContext";
import {
  Bell,
  Mail,
  Check,
  CheckCircle2,
  Settings,
  MessageSquare,
  Clock,
  CreditCard,
  Plane,
  AlertTriangle,
  User,
  FileText,
  Shield,
  Save
} from "lucide-react";

interface NotifPreference {
  id: string;
  event: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  enabledRoles: string[];
  emailEnabled: boolean;
  inAppEnabled: boolean;
}

const NOTIFICATION_EVENTS: NotifPreference[] = [
  { id: "new_request", event: "New Agent Request", description: "When an agent submits a new charter request", icon: <MessageSquare className="w-3.5 h-3.5" />, category: "Requests", enabledRoles: ["super_admin", "admin", "operations"], emailEnabled: true, inAppEnabled: true },
  { id: "quote_ready", event: "Quote Published", description: "When a quote is published to an agent or client", icon: <FileText className="w-3.5 h-3.5" />, category: "Quotes", enabledRoles: ["super_admin", "admin", "agent"], emailEnabled: true, inAppEnabled: true },
  { id: "quote_expiring", event: "Quote Expiring", description: "When a quote is within 48 hours of expiry", icon: <Clock className="w-3.5 h-3.5" />, category: "Quotes", enabledRoles: ["super_admin", "admin", "agent"], emailEnabled: true, inAppEnabled: true },
  { id: "quote_accepted", event: "Quote Accepted", description: "When a client accepts a quote", icon: <CheckCircle2 className="w-3.5 h-3.5" />, category: "Quotes", enabledRoles: ["super_admin", "admin", "finance", "agent"], emailEnabled: true, inAppEnabled: true },
  { id: "payment_received", event: "Payment Received", description: "When a payment is recorded (wire or card)", icon: <CreditCard className="w-3.5 h-3.5" />, category: "Payments", enabledRoles: ["super_admin", "admin", "finance"], emailEnabled: true, inAppEnabled: true },
  { id: "payment_overdue", event: "Payment Overdue", description: "When a payment due date has passed", icon: <AlertTriangle className="w-3.5 h-3.5" />, category: "Payments", enabledRoles: ["super_admin", "admin", "finance"], emailEnabled: true, inAppEnabled: true },
  { id: "pax_missing", event: "Passenger Data Incomplete", description: "When passenger data is missing 48h before departure", icon: <User className="w-3.5 h-3.5" />, category: "Operations", enabledRoles: ["super_admin", "admin", "operations", "agent"], emailEnabled: true, inAppEnabled: true },
  { id: "brief_published", event: "Flight Brief Published/Updated", description: "When a flight brief is published or a new version created", icon: <Plane className="w-3.5 h-3.5" />, category: "Operations", enabledRoles: ["super_admin", "admin", "operations", "agent"], emailEnabled: true, inAppEnabled: true },
  { id: "operator_doc_expiring", event: "Operator Document Expiring", description: "When an operator's AOC, insurance, or safety rating is expiring (60 & 30 days)", icon: <Shield className="w-3.5 h-3.5" />, category: "Operators", enabledRoles: ["super_admin", "admin", "operations"], emailEnabled: true, inAppEnabled: true },
];

const EMAIL_TEMPLATES = [
  { id: "new_request_email", name: "New Request — Admin Notification", trigger: "When agent submits a request" },
  { id: "quote_ready_email", name: "Quote Published — Agent & Client", trigger: "When admin publishes a quote" },
  { id: "quote_expiry_email", name: "Quote Expiry Warning", trigger: "48h before quote expiry" },
  { id: "accepted_email", name: "Quote Accepted — Admin & Agent", trigger: "When client accepts quote" },
  { id: "payment_received_email", name: "Payment Received Confirmation", trigger: "After payment recorded" },
  { id: "payment_overdue_email", name: "Payment Overdue Reminder", trigger: "Each day payment is overdue" },
  { id: "pax_missing_email", name: "Passenger Data Reminder", trigger: "48h before departure if incomplete" },
  { id: "brief_published_email", name: "Flight Brief Published", trigger: "When brief is published or updated" },
  { id: "operator_expiry_email", name: "Operator Document Expiry Alert", trigger: "60 and 30 days before expiry" },
];

export default function NotificationSettingsView() {
  const { role } = useAviation();
  const [prefs, setPrefs] = useState<NotifPreference[]>(NOTIFICATION_EVENTS);
  const [saved, setSaved] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const canEdit = role === "super_admin" || role === "admin";

  const togglePref = (id: string, field: "emailEnabled" | "inAppEnabled") => {
    if (!canEdit) return;
    setPrefs((p) => p.map((pref) => pref.id === id ? { ...pref, [field]: !pref[field] } : pref));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const categories = Array.from(new Set(prefs.map((p) => p.category)));

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bell className="w-5 h-5 text-[#C9A052]" />
              <h2 className="text-xl font-black text-[#0F1420] tracking-tight">Notification Settings</h2>
            </div>
            <p className="text-xs text-[#0F1420]/60">
              Configure email and in-app notifications for all system events. Templates editable by Super Admin.
            </p>
          </div>
          {canEdit && (
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                saved ? "bg-emerald-600 text-white" : "bg-[#C9A052] text-[#0F1420] hover:bg-[#B88F42]"
              }`}
            >
              {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {saved ? "Saved!" : "Save Preferences"}
            </button>
          )}
        </div>
      </div>

      {/* NOT-2: Notification Preferences per Event */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E0DAD0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#C9A052]" />
            <h3 className="text-sm font-bold text-[#0F1420]">Event Preferences</h3>
          </div>
          <div className="flex items-center gap-6 text-[10px] font-mono uppercase text-[#0F1420]/60 font-bold">
            <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> Email</span>
            <span className="flex items-center gap-1"><Bell className="w-3 h-3" /> In-App</span>
          </div>
        </div>

        {categories.map((cat) => (
          <div key={cat}>
            <div className="px-6 py-2 bg-[#F5F2EC] border-b border-[#E0DAD0]">
              <span className="text-[10px] font-mono font-bold uppercase text-[#0F1420]/60 tracking-wider">{cat}</span>
            </div>
            {prefs.filter((p) => p.category === cat).map((pref) => (
              <div key={pref.id} className="flex items-center justify-between px-6 py-3.5 border-b border-[#F5F2EC] hover:bg-[#FDFCFA] transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-[#C9A052]">{pref.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-[#0F1420]">{pref.event}</p>
                    <p className="text-[11px] text-[#0F1420]/60">{pref.description}</p>
                    <div className="flex gap-1 mt-0.5">
                      {pref.enabledRoles.map(r => (
                        <span key={r} className="text-[9px] font-mono bg-[#E0DAD0] text-[#0F1420]/70 px-1.5 py-0.5 rounded font-bold uppercase">{r}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 flex-shrink-0">
                  {/* Email toggle */}
                  <button
                    onClick={() => togglePref(pref.id, "emailEnabled")}
                    disabled={!canEdit}
                    title={canEdit ? "Toggle email notification" : "Only Super Admin can edit"}
                    className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                      pref.emailEnabled ? "bg-[#C9A052]" : "bg-gray-300"
                    } ${!canEdit ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${pref.emailEnabled ? "left-4" : "left-0.5"}`} />
                  </button>
                  {/* In-app toggle */}
                  <button
                    onClick={() => togglePref(pref.id, "inAppEnabled")}
                    disabled={!canEdit}
                    title={canEdit ? "Toggle in-app notification" : "Only Super Admin can edit"}
                    className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                      pref.inAppEnabled ? "bg-[#C9A052]" : "bg-gray-300"
                    } ${!canEdit ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${pref.inAppEnabled ? "left-4" : "left-0.5"}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* NOT-3: Email Templates (editable by Super Admin) */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E0DAD0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#C9A052]" />
            <h3 className="text-sm font-bold text-[#0F1420]">Email Templates</h3>
          </div>
          <span className="text-[10px] font-mono text-[#0F1420]/60 bg-[#F5F2EC] border border-[#E0DAD0] px-2 py-1 rounded font-bold">
            {role === "super_admin" ? "✏ Editable" : "Super Admin only"}
          </span>
        </div>

        <div className="divide-y divide-[#F5F2EC]">
          {EMAIL_TEMPLATES.map((tmpl) => (
            <div key={tmpl.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-[#FDFCFA] transition-colors">
              <div>
                <p className="text-xs font-bold text-[#0F1420]">{tmpl.name}</p>
                <p className="text-[11px] text-[#0F1420]/60">{tmpl.trigger}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                  Active
                </span>
                {role === "super_admin" && (
                  <button
                    onClick={() => setSelectedTemplate(selectedTemplate === tmpl.id ? null : tmpl.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#F5F2EC] border border-[#E0DAD0] text-xs font-bold text-[#0F1420] hover:bg-[#EAE6DE] transition-all"
                  >
                    Edit Template
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Inline template editor for Super Admin */}
        {role === "super_admin" && selectedTemplate && (
          <div className="px-6 py-4 bg-[#F5F2EC] border-t border-[#E0DAD0]">
            <p className="text-xs font-bold text-[#0F1420] mb-2">
              Editing: {EMAIL_TEMPLATES.find(t => t.id === selectedTemplate)?.name}
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#0F1420]/60 mb-1">Subject Line</label>
                <input
                  type="text"
                  defaultValue={`Orbelo Charter — ${EMAIL_TEMPLATES.find(t => t.id === selectedTemplate)?.name}`}
                  className="w-full bg-white border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#0F1420]/60 mb-1">Body (use {"{{variables}}"} for dynamic content)</label>
                <textarea
                  rows={5}
                  defaultValue={`Dear {{recipient_name}},\n\n{{event_description}}\n\nPlease visit your portal at: {{portal_link}}\n\nOrbelo Charter Brokerage\n{{support_email}}`}
                  className="w-full bg-white border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052] font-mono resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-xl bg-[#C9A052] text-[#0F1420] text-xs font-bold hover:bg-[#B88F42]">
                  Save Template
                </button>
                <button onClick={() => setSelectedTemplate(null)} className="px-4 py-2 rounded-xl bg-white border border-[#D1C9BC] text-[#0F1420] text-xs font-bold">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transactional Email Config */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#E0DAD0]">
          <Mail className="w-4 h-4 text-[#C9A052]" />
          <h3 className="text-sm font-bold text-[#0F1420]">Email Provider Configuration</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {[
            { label: "From Email Address", placeholder: "charter@orbelo.com" },
            { label: "From Display Name", placeholder: "Orbelo Charter" },
            { label: "Reply-To Address", placeholder: "ops@orbelo.com" },
            { label: "Provider", placeholder: "SendGrid / Postmark / Mailgun" },
          ].map(({ label, placeholder }) => (
            <div key={label}>
              <label className="block text-[10px] font-mono uppercase text-[#0F1420]/60 mb-1.5">{label}</label>
              <input
                type="text"
                placeholder={placeholder}
                disabled={!canEdit}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052] disabled:opacity-60"
              />
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 font-mono">
          SPF, DKIM, and DMARC must be configured on your sending domain for reliable delivery. API keys stored securely in environment variables — not in this UI.
        </p>
      </div>
    </div>
  );
}
