"use client";

import React, { useState } from "react";
import { useAviation } from "@/lib/aviationContext";
import { CancellationFeeStep } from "@/types/aviation";
import {
  Building2,
  Percent,
  Landmark,
  FileText,
  CalendarX2,
  Coins,
  Clock,
  Bell,
  Users,
  Check,
  Save,
  Plus,
  Trash2,
  AlertTriangle,
  CreditCard
} from "lucide-react";
import StatusPill from "@/components/ui/StatusPill";
import TaxRulesPanel from "@/components/admin/TaxRulesPanel";

type SettingsTab =
  | "margin_tiers"
  | "pricing"
  | "company"
  | "bank_accounts"
  | "terms"
  | "cancellation"
  | "taxes"
  | "tokens"
  | "overdue"
  | "notifications"
  | "users";

export default function SettingsView() {
  const { settings, updateSettings, users } = useAviation();
  const [activeTab, setActiveTab] = useState<SettingsTab>("margin_tiers");
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaved, setIsSaved] = useState(false);

  // Sync if global settings change
  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    updateSettings(localSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const navItems: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: "margin_tiers", label: "Margin tiers", icon: <Percent className="w-4 h-4" /> },
    { id: "pricing", label: "Pricing & Card Fees", icon: <CreditCard className="w-4 h-4" /> },
    { id: "company", label: "Company & documents", icon: <Building2 className="w-4 h-4" /> },
    { id: "bank_accounts", label: "Bank accounts (per currency)", icon: <Landmark className="w-4 h-4" /> },
    { id: "terms", label: "Terms versions", icon: <FileText className="w-4 h-4" /> },
    { id: "cancellation", label: "Cancellation policy", icon: <CalendarX2 className="w-4 h-4" /> },
    { id: "taxes", label: "Taxes", icon: <Percent className="w-4 h-4" /> },
    { id: "tokens", label: "Tokens & pricing rules", icon: <Coins className="w-4 h-4" /> },
    { id: "overdue", label: "Request overdue SLA", icon: <Clock className="w-4 h-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
    { id: "users", label: "Users & roles", icon: <Users className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[var(--ink)]">
            System Settings & Commercial Rules
          </h1>
          <p className="text-xs text-[var(--muted)] font-mono mt-0.5">
            R-039 • Company profiles, margin formulas, legal terms, banking data, and tokenomics
          </p>
        </div>

        <button
          onClick={handleSave}
          className="btn-primary self-start sm:self-auto"
        >
          {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{isSaved ? "Saved successfully" : "Save settings"}</span>
        </button>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Navigation */}
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-left ${
                  isActive
                    ? "bg-[var(--ink)] text-[var(--card)] font-bold shadow-sm"
                    : "bg-[var(--card)] text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--line)]"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="callout amber text-[11px] mt-4 font-mono">
            <p className="font-bold">▲ Rule R-039</p>
            <p className="opacity-90">
              Modifying company info or margin tiers updates future quotes and newly generated documents only. Historic versions remain locked.
            </p>
          </div>
        </div>

        {/* Right Content Panel */}
        <div className="md:col-span-3 bg-[var(--card)] border border-[var(--line)] rounded-xl p-6">
          {/* 1. Margin Tiers */}
          {activeTab === "margin_tiers" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold font-display text-[var(--ink)] m-0">
                  Company Margin Tiers
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Tiered markup applied to operator charter costs before agent commission and concierge services.
                </p>
              </div>

              <div className="space-y-3">
                {localSettings.marginTiers.map((tier, idx) => (
                  <div
                    key={tier.id}
                    className="p-4 border border-[var(--line)] rounded-lg bg-[var(--paper)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <span className="font-display font-bold text-sm text-[var(--ink)]">
                        {tier.label}
                      </span>
                      <p className="text-xs text-[var(--muted)] font-mono mt-0.5">
                        Range: €{tier.minCost.toLocaleString()} — {tier.maxCost ? `€${tier.maxCost.toLocaleString()}` : "Unlimited"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-xs font-mono text-[var(--muted)]">Margin:</label>
                      <div className="flex items-center gap-1 bg-[var(--card)] border border-[var(--line)] rounded px-2 py-1">
                        <input
                          type="number"
                          value={tier.marginPercent}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...localSettings.marginTiers];
                            updated[idx] = { ...tier, marginPercent: val };
                            setLocalSettings({ ...localSettings, marginTiers: updated });
                          }}
                          className="w-14 text-right font-mono text-sm font-bold bg-transparent outline-none"
                        />
                        <span className="font-mono text-xs font-bold text-[var(--muted)]">%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pricing & Card Fees */}
          {activeTab === "pricing" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold font-display text-[var(--ink)] m-0">
                  Payment Processing & Commercial Rules
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Payment gateway surcharges, credit card fees, and default accounting currency (R-029).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[var(--paper)] border border-[var(--line)] rounded-lg space-y-2">
                  <label className="block text-xs font-mono font-bold text-[var(--ink)]">
                    Credit Card Surcharge Fee (%)
                  </label>
                  <p className="text-[11px] text-[var(--muted)]">
                    Fee applied when the client elects to settle charter invoice via online credit card instead of wire transfer.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number"
                      step="0.1"
                      value={localSettings.pricing?.cardFeePercent ?? 3.5}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setLocalSettings({
                          ...localSettings,
                          pricing: {
                            ...(localSettings.pricing || { defaultCurrency: "EUR" }),
                            cardFeePercent: val
                          }
                        });
                      }}
                      className="w-24 text-right font-mono text-base font-bold bg-[var(--card)] border border-[var(--line)] rounded p-2 text-[var(--ink)]"
                    />
                    <span className="font-mono text-sm font-bold text-[var(--muted)]">% surcharge</span>
                  </div>
                </div>

                <div className="p-4 bg-[var(--paper)] border border-[var(--line)] rounded-lg space-y-2">
                  <label className="block text-xs font-mono font-bold text-[var(--ink)]">
                    Default Flight Currency
                  </label>
                  <p className="text-[11px] text-[var(--muted)]">
                    Primary operational currency for quotation pricing and accounting reconciliation.
                  </p>
                  <div className="pt-1">
                    <select
                      value={localSettings.pricing?.defaultCurrency ?? "EUR"}
                      onChange={(e) => {
                        const val = e.target.value as "EUR" | "USD" | "GBP" | "CHF";
                        setLocalSettings({
                          ...localSettings,
                          pricing: {
                            ...(localSettings.pricing || { cardFeePercent: 3.5 }),
                            defaultCurrency: val
                          }
                        });
                      }}
                      className="bg-[var(--card)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[var(--ink)]"
                    >
                      <option value="EUR">EUR (€) - Euro</option>
                      <option value="USD">USD ($) - US Dollar</option>
                      <option value="GBP">GBP (£) - British Pound</option>
                      <option value="CHF">CHF (Fr) - Swiss Franc</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Company & Documents */}
          {activeTab === "company" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold font-display text-[var(--ink)] m-0">
                  Company & Document Specifications
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Legal entity details, registries, and VAT terms printed on Quotes, Invoices, and Contracts.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-[var(--muted)] mb-1">
                    Trading Name
                  </label>
                  <input
                    type="text"
                    value={localSettings.company.name}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        company: { ...localSettings.company, name: e.target.value }
                      })
                    }
                    className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs font-sans text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[var(--muted)] mb-1">
                    Legal Registered Entity
                  </label>
                  <input
                    type="text"
                    value={localSettings.company.legalEntity}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        company: { ...localSettings.company, legalEntity: e.target.value }
                      })
                    }
                    className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs font-sans text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[var(--muted)] mb-1">
                    Authorized Representative
                  </label>
                  <input
                    type="text"
                    value={localSettings.company.representativeName}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        company: { ...localSettings.company, representativeName: e.target.value }
                      })
                    }
                    className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs font-sans text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[var(--muted)] mb-1">
                    Signatory Title
                  </label>
                  <input
                    type="text"
                    value={localSettings.company.signatoryTitle || ""}
                    placeholder="e.g. Managing Director"
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        company: { ...localSettings.company, signatoryTitle: e.target.value }
                      })
                    }
                    className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs font-sans text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[var(--muted)] mb-1">
                    Office Phone
                  </label>
                  <input
                    type="text"
                    value={localSettings.company.phone}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        company: { ...localSettings.company, phone: e.target.value }
                      })
                    }
                    className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[var(--muted)] mb-1">
                    24/7 Operations Desk Phone
                  </label>
                  <input
                    type="text"
                    value={localSettings.company.phone24_7 || ""}
                    placeholder="+43 1 7007 22100"
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        company: { ...localSettings.company, phone24_7: e.target.value }
                      })
                    }
                    className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[var(--muted)] mb-1">
                    Primary Contact Email
                  </label>
                  <input
                    type="email"
                    value={localSettings.company.email}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        company: { ...localSettings.company, email: e.target.value }
                      })
                    }
                    className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[var(--muted)] mb-1">
                    Commercial Registry Number
                  </label>
                  <input
                    type="text"
                    value={localSettings.company.registrationNumber || ""}
                    placeholder="FN 482910 b"
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        company: { ...localSettings.company, registrationNumber: e.target.value }
                      })
                    }
                    className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs font-sans text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[var(--muted)] mb-1">
                    Primary VAT Number
                  </label>
                  <input
                    type="text"
                    value={localSettings.company.vatNumber}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        company: { ...localSettings.company, vatNumber: e.target.value }
                      })
                    }
                    className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[var(--muted)] mb-1">
                    Court of Jurisdiction
                  </label>
                  <input
                    type="text"
                    value={localSettings.company.courtOfJurisdiction}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        company: { ...localSettings.company, courtOfJurisdiction: e.target.value }
                      })
                    }
                    className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs font-sans text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono font-bold text-[var(--muted)] mb-1">
                    Registered Operating Address
                  </label>
                  <input
                    type="text"
                    value={localSettings.company.address}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        company: { ...localSettings.company, address: e.target.value }
                      })
                    }
                    className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs font-sans text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono font-bold text-[var(--muted)] mb-1">
                    Commercial Registry & AOC
                  </label>
                  <input
                    type="text"
                    value={localSettings.company.commercialRegistry}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        company: { ...localSettings.company, commercialRegistry: e.target.value }
                      })
                    }
                    className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs font-sans text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono font-bold text-[var(--muted)] mb-1">
                    Standard VAT Clause / Wording (Charter Agreement & Invoices)
                  </label>
                  <input
                    type="text"
                    value={localSettings.company.vatWording || ""}
                    placeholder="Zero-rated international passenger air transportation per Art. 148 EU VAT Directive"
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        company: { ...localSettings.company, vatWording: e.target.value }
                      })
                    }
                    className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs font-sans text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono font-bold text-[var(--muted)] mb-1">
                    VAT Exemption Notice (Prints on Invoices)
                  </label>
                  <textarea
                    rows={2}
                    value={localSettings.company.vatExemptionClause}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        company: { ...localSettings.company, vatExemptionClause: e.target.value }
                      })
                    }
                    className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg p-3 text-xs font-sans text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono font-bold text-[var(--muted)] mb-1">
                    Payment Terms (Prints on Charter Agreements)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 100 % on signature, and in all cases before departure"
                    value={localSettings.documents?.paymentTerms || ""}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        documents: { ...(localSettings.documents || {}), paymentTerms: e.target.value }
                      })
                    }
                    className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs font-sans text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[var(--muted)] mb-1">
                    Passenger Documents Deadline (hours before departure)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="48"
                    value={localSettings.documents?.passengerDocsDeadlineHours ?? ""}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        documents: {
                          ...(localSettings.documents || {}),
                          passengerDocsDeadlineHours: e.target.value === "" ? undefined : Number(e.target.value)
                        }
                      })
                    }
                    className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs font-sans text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. Bank Accounts */}
          {activeTab === "bank_accounts" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold font-display text-[var(--ink)] m-0">
                  Bank Accounts per Currency
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Wire settlement accounts printed on Invoices and Charter Agreements based on flight currency.
                </p>
              </div>

              <div className="space-y-4">
                {localSettings.bankAccounts.map((account, idx) => (
                  <div key={account.id} className="border border-[var(--line)] rounded-lg p-4 bg-[var(--paper)] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="pill blue font-bold">{account.currency} WIRE ACCOUNT</span>
                      <span className="text-xs font-mono text-[var(--muted)]">ID: {account.id}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-mono text-[var(--muted)] mb-0.5">Bank Name</label>
                        <input
                          type="text"
                          value={account.bankName}
                          onChange={(e) => {
                            const updated = [...localSettings.bankAccounts];
                            updated[idx] = { ...account, bankName: e.target.value };
                            setLocalSettings({ ...localSettings, bankAccounts: updated });
                          }}
                          className="w-full bg-[var(--card)] border border-[var(--line)] rounded px-2.5 py-1.5 font-sans"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono text-[var(--muted)] mb-0.5">Account Beneficiary</label>
                        <input
                          type="text"
                          value={account.accountHolder}
                          onChange={(e) => {
                            const updated = [...localSettings.bankAccounts];
                            updated[idx] = { ...account, accountHolder: e.target.value };
                            setLocalSettings({ ...localSettings, bankAccounts: updated });
                          }}
                          className="w-full bg-[var(--card)] border border-[var(--line)] rounded px-2.5 py-1.5 font-sans"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono text-[var(--muted)] mb-0.5">IBAN</label>
                        <input
                          type="text"
                          value={account.iban}
                          onChange={(e) => {
                            const updated = [...localSettings.bankAccounts];
                            updated[idx] = { ...account, iban: e.target.value };
                            setLocalSettings({ ...localSettings, bankAccounts: updated });
                          }}
                          className="w-full bg-[var(--card)] border border-[var(--line)] rounded px-2.5 py-1.5 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono text-[var(--muted)] mb-0.5">BIC / SWIFT</label>
                        <input
                          type="text"
                          value={account.bic}
                          onChange={(e) => {
                            const updated = [...localSettings.bankAccounts];
                            updated[idx] = { ...account, bic: e.target.value };
                            setLocalSettings({ ...localSettings, bankAccounts: updated });
                          }}
                          className="w-full bg-[var(--card)] border border-[var(--line)] rounded px-2.5 py-1.5 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Terms Versions */}
          {activeTab === "terms" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold font-display text-[var(--ink)] m-0">
                  Legal Terms & Agreement Versions
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Active terms automatically stamp newly generated Charter Agreements (R-028).
                </p>
              </div>

              <div className="space-y-4">
                {localSettings.termsVersions.map((tv) => (
                  <div
                    key={tv.id}
                    className={`border rounded-lg p-4 transition-all ${
                      tv.isActive
                        ? "border-[var(--green)] bg-[var(--green-soft)]/20"
                        : "border-[var(--line)] bg-[var(--paper)] opacity-70"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[var(--ink)]">{tv.version}</span>
                        <span className="font-sans font-semibold text-xs text-[var(--ink)]">{tv.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill
                          label={tv.isActive ? "ACTIVE DEFAULT" : "ARCHIVED"}
                          variant={tv.isActive ? "green" : "grey"}
                        />
                        {!tv.isActive && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = localSettings.termsVersions.map((t) => ({
                                ...t,
                                isActive: t.id === tv.id
                              }));
                              setLocalSettings({ ...localSettings, termsVersions: updated });
                            }}
                            className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded border border-[var(--line)] bg-[var(--card)] hover:border-[var(--accent)] text-[var(--ink)] transition-colors cursor-pointer"
                          >
                            Set Active
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-[var(--muted)] mb-2 font-mono">
                      Effective: {tv.effectiveDate} • {tv.summary}
                    </p>
                    <div className="bg-[var(--card)] p-3 rounded border border-[var(--line)] text-xs font-mono whitespace-pre-line text-[var(--ink)] max-h-36 overflow-y-auto">
                      {tv.fullText}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Taxes (R-091): saved straight to the server, row by row */}
          {activeTab === "taxes" && <TaxRulesPanel />}

          {/* 5. Cancellation Policy */}
          {activeTab === "cancellation" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold font-display text-[var(--ink)] m-0">
                  Cancellation Fee Schedule
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Automated penalty fee computation for charter cancellations and credit notes (R-022, R-030).
                </p>
              </div>

              <div className="space-y-3">
                {localSettings.cancellationPolicy.map((step, idx) => (
                  <div
                    key={step.id}
                    className="p-3.5 border border-[var(--line)] rounded-lg bg-[var(--paper)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1">
                      <label className="block text-[10px] font-mono text-[var(--muted)] mb-1">Notice Window / Description</label>
                      <input
                        type="text"
                        value={step.description}
                        onChange={(e) => {
                          const updated = [...localSettings.cancellationPolicy];
                          updated[idx] = { ...step, description: e.target.value };
                          setLocalSettings({ ...localSettings, cancellationPolicy: updated });
                        }}
                        className="w-full bg-[var(--card)] border border-[var(--line)] rounded px-2.5 py-1.5 text-xs font-sans text-[var(--ink)]"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <div>
                        <label className="block text-[10px] font-mono text-[var(--muted)] mb-1">Penalty</label>
                        <div className="flex items-center gap-1 bg-[var(--card)] border border-[var(--line)] rounded px-2 py-1">
                          <input
                            type="number"
                            value={step.feePercentage}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              const updated = [...localSettings.cancellationPolicy];
                              updated[idx] = { ...step, feePercentage: val };
                              setLocalSettings({ ...localSettings, cancellationPolicy: updated });
                            }}
                            className="w-14 text-right font-mono text-xs font-bold bg-transparent outline-none text-[var(--red)]"
                          />
                          <span className="font-mono text-xs font-bold text-[var(--muted)]">%</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = localSettings.cancellationPolicy.filter((_, i) => i !== idx);
                          setLocalSettings({ ...localSettings, cancellationPolicy: updated });
                        }}
                        className="text-[var(--muted)] hover:text-[var(--red)] p-1.5 rounded transition-colors self-end mb-0.5 cursor-pointer"
                        title="Delete tier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    const newStep: CancellationFeeStep = {
                      id: `cancel_${Date.now()}`,
                      description: "New cancellation tier",
                      feePercentage: 50,
                      daysPriorMin: 0,
                      daysPriorMax: 7
                    };
                    setLocalSettings({
                      ...localSettings,
                      cancellationPolicy: [...localSettings.cancellationPolicy, newStep]
                    });
                  }}
                  className="btn-secondary text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Cancellation Tier</span>
                </button>
              </div>
            </div>
          )}

          {/* 6. Tokens & Pricing Rules */}
          {activeTab === "tokens" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold font-display text-[var(--ink)] m-0">
                  Broker Tokenomics & Bundles
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Tokens deducted on agent request submissions (1 token/request) and bundle top-up purchase prices.
                </p>
              </div>

              <div className="bg-[var(--paper)] border border-[var(--line)] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-display font-bold text-sm text-[var(--ink)]">
                      Free Tokens on Agent Registration
                    </label>
                    <p className="text-xs text-[var(--muted)]">Complimentary trial credits assigned to newly approved agents.</p>
                  </div>
                  <input
                    type="number"
                    value={localSettings.tokens.freeTokensOnSignup}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        tokens: {
                          ...localSettings.tokens,
                          freeTokensOnSignup: parseInt(e.target.value, 10) || 0
                        }
                      })
                    }
                    className="w-20 text-center font-mono text-base font-bold bg-[var(--card)] border border-[var(--line)] rounded p-1.5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-display font-bold text-sm text-[var(--ink)] m-0">Top-Up Bundles</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {localSettings.tokens.bundles.map((bundle) => (
                    <div
                      key={bundle.id}
                      className="border border-[var(--line)] rounded-xl p-4 bg-[var(--paper)] text-center space-y-1"
                    >
                      <span className="font-display text-xl font-black text-[var(--ink)]">
                        {bundle.tokens} Tokens
                      </span>
                      <div className="font-mono text-base font-bold text-[var(--accent)]">
                        €{bundle.price}
                      </div>
                      <span className="text-[10px] text-[var(--muted)] font-mono block">
                        (€{(bundle.price / bundle.tokens).toFixed(2)} / token)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 7. Request Overdue SLA */}
          {activeTab === "overdue" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold font-display text-[var(--ink)] m-0">
                  Request Overdue SLA Threshold
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Elapsed minutes after which unaddressed agent inquiries highlight with an overdue red flag (R-032).
                </p>
              </div>

              <div className="bg-[var(--paper)] border border-[var(--line)] rounded-lg p-5 flex items-center justify-between">
                <div>
                  <span className="font-display font-bold text-sm text-[var(--ink)]">
                    Maximum Response Threshold
                  </span>
                  <p className="text-xs text-[var(--muted)]">
                    Requests exceeding this age without quote generation or sourcing notes show red.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={localSettings.requestOverdueMinutes}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        requestOverdueMinutes: parseInt(e.target.value, 10) || 30
                      })
                    }
                    className="w-20 text-center font-mono text-base font-bold bg-[var(--card)] border border-[var(--line)] rounded p-1.5"
                  />
                  <span className="font-mono text-xs font-semibold text-[var(--muted)]">Minutes</span>
                </div>
              </div>
            </div>
          )}

          {/* 8. Notifications */}
          {activeTab === "notifications" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold font-display text-[var(--ink)] m-0">
                  Operations & Dispatch Notifications
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Automated urgency alerts triggered prior to flight departures.
                </p>
              </div>

              <div className="bg-[var(--paper)] border border-[var(--line)] rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-display font-bold text-sm text-[var(--ink)]">
                      High-Priority Pre-Flight Payment Alert
                    </span>
                    <p className="text-xs text-[var(--muted)]">
                      Hours prior to flight departure to notify operations if invoice remains unpaid.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={localSettings.notifications.urgentTripHours}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          notifications: {
                            ...localSettings.notifications,
                            urgentTripHours: parseInt(e.target.value, 10) || 72
                          }
                        })
                      }
                      className="w-20 text-center font-mono text-base font-bold bg-[var(--card)] border border-[var(--line)] rounded p-1.5"
                    />
                    <span className="font-mono text-xs font-semibold text-[var(--muted)]">Hours (3 Days)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 9. Users & Roles */}
          {activeTab === "users" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold font-display text-[var(--ink)] m-0">
                  Users & RBAC Directory
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Active staff accounts with server-enforced role access levels.
                </p>
              </div>

              <div className="tablewrap">
                <table className="dense-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Assigned Role</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="font-semibold text-[var(--ink)]">{u.name}</td>
                        <td className="font-mono text-xs text-[var(--muted)]">{u.email}</td>
                        <td>
                          <span className="pill blue font-bold uppercase">{u.role}</span>
                        </td>
                        <td>
                          <StatusPill
                            label={u.isActive ? "ACTIVE" : "INACTIVE"}
                            variant={u.isActive ? "green" : "grey"}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
