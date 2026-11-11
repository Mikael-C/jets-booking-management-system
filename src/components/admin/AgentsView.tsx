"use client";

import React, { useState, useMemo } from "react";
import { useAviation } from "@/lib/aviationContext";
import { formatCurrency } from "@/lib/pricingCalculator";
import {
  Users,
  Search,
  Building2,
  Mail,
  Phone,
  Globe,
  Plus,
  Percent,
  Coins,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  FileText,
  UserCheck,
  Plane,
  X,
  CreditCard
} from "lucide-react";

export default function AgentsView() {
  const { accounts, contacts, bookings, agentRequests, setActiveNav, addAuditEntry, currentUser } = useAviation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "accounts" | "contacts">("all");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Invite modal state
  const [inviteName, setInviteName] = useState("");
  const [inviteAgency, setInviteAgency] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteCommission, setInviteCommission] = useState<number>(8);
  const [inviteCountry, setInviteCountry] = useState("United Kingdom");
  const [inviteSent, setInviteSent] = useState(false);

  // Agent accounts (ticked as isAgent in Accounts)
  const agentAccounts = useMemo(() => {
    return accounts.filter((a) => a.isAgent);
  }, [accounts]);

  // Agent contacts (ticked as isAgent in Contacts)
  const agentContacts = useMemo(() => {
    return contacts.filter((c) => c.isAgent);
  }, [contacts]);

  // Unified agent list
  const combinedAgents = useMemo(() => {
    const list: Array<{
      id: string;
      type: "account" | "contact";
      name: string;
      agencyName: string;
      email: string;
      phone: string;
      country: string;
      commissionPct: number;
      totalBookings: number;
      tokenBalance?: number;
      status: string;
      referenceId: string;
    }> = [];

    // Add agent accounts
    agentAccounts.forEach((acc) => {
      const relatedBookingsCount = bookings.filter((b) => (b.agentEmail || "").toLowerCase() === acc.email.toLowerCase() || b.accountNumber === acc.accountNumber).length;
      list.push({
        id: acc.id,
        type: "account",
        name: acc.preferredContactName || acc.name,
        agencyName: acc.name,
        email: acc.email,
        phone: acc.phone,
        country: acc.country,
        commissionPct: 8,
        totalBookings: relatedBookingsCount || acc.totalBookings || 0,
        tokenBalance: 2000,
        status: "Active Verified Agency",
        referenceId: acc.accountNumber
      });
    });

    // Add agent contacts (if not already included by email)
    agentContacts.forEach((cnt) => {
      if (!list.some((a) => a.email.toLowerCase() === cnt.email.toLowerCase())) {
        list.push({
          id: cnt.id,
          type: "contact",
          name: `${cnt.firstName} ${cnt.lastName}`,
          agencyName: cnt.associatedAccountName || "Independent Broker",
          email: cnt.email,
          phone: cnt.phone,
          country: cnt.country,
          commissionPct: 8,
          totalBookings: bookings.filter((b) => (b.agentEmail || "").toLowerCase() === cnt.email.toLowerCase()).length,
          tokenBalance: 1500,
          status: "Accredited Broker Rep",
          referenceId: `AGT-${cnt.id.slice(-4).toUpperCase()}`
        });
      }
    });

    return list;
  }, [agentAccounts, agentContacts, bookings]);

  // Filtered by search and tab
  const filteredAgents = useMemo(() => {
    return combinedAgents.filter((agent) => {
      if (activeTab === "accounts" && agent.type !== "account") return false;
      if (activeTab === "contacts" && agent.type !== "contact") return false;

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchName = agent.name.toLowerCase().includes(q);
        const matchAgency = agent.agencyName.toLowerCase().includes(q);
        const matchEmail = agent.email.toLowerCase().includes(q);
        const matchCountry = agent.country.toLowerCase().includes(q);
        const matchRef = agent.referenceId.toLowerCase().includes(q);
        if (!matchName && !matchAgency && !matchEmail && !matchCountry && !matchRef) return false;
      }

      return true;
    });
  }, [combinedAgents, activeTab, searchQuery]);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    addAuditEntry({
      userEmail: currentUser?.email || "admin@orbelo.com",
      userName: currentUser?.name || "System Admin",
      action: "AGENT_INVITATION_SENT",
      entityType: "Agent",
      entityId: inviteEmail,
      details: `Sent broker invitation to ${inviteName} (${inviteAgency || "Independent"}) with ${inviteCommission}% agreed commission.`
    });

    setInviteSent(true);
    setTimeout(() => {
      setInviteSent(false);
      setIsInviteModalOpen(false);
      setInviteName("");
      setInviteEmail("");
      setInvitePhone("");
      setInviteAgency("");
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-[#0F1420] text-white rounded-2xl p-6 sm:p-8 border border-[#1C2436] shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/20 text-[#C9A052] border border-[#C9A052]/40 uppercase flex items-center gap-1">
              <UserCheck className="w-3 h-3" />
              BROKERAGE PARTNER NETWORK
            </span>
            <span className="text-gray-400 text-xs font-mono">• {combinedAgents.length} Accredited Charter Agents</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Charter Agents & Broker Directory
          </h1>
          <p className="text-xs text-gray-300 leading-relaxed">
            Centralized hub for all charter brokers, retail agents, and concierge partners. Automatically aggregated from accounts and contacts tagged as agents, complete with commission margins, token balances, and quote confirmation pipelines.
          </p>
        </div>

        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Invite / Register Agent</span>
        </button>
      </div>

      {/* Search & Tabs Bar */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agents by broker name, agency company, email, country, or reference ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E0DAD0] bg-[#F5F2EC] text-xs text-[#0F1420] font-medium placeholder-gray-400 focus:outline-none focus:border-[#C9A052] focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "all" ? "bg-[#0F1420] text-white" : "bg-[#F5F2EC] text-gray-700 hover:bg-[#EBE5DB]"
            }`}
          >
            All Agents ({combinedAgents.length})
          </button>
          <button
            onClick={() => setActiveTab("accounts")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "accounts" ? "bg-[#0F1420] text-white" : "bg-[#F5F2EC] text-gray-700 hover:bg-[#EBE5DB]"
            }`}
          >
            Agency Accounts ({agentAccounts.length})
          </button>
          <button
            onClick={() => setActiveTab("contacts")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "contacts" ? "bg-[#0F1420] text-white" : "bg-[#F5F2EC] text-gray-700 hover:bg-[#EBE5DB]"
            }`}
          >
            Broker Representatives ({agentContacts.length})
          </button>
        </div>
      </div>

      {/* Agents List */}
      <div className="space-y-3">
        {filteredAgents.map((agent) => (
          <div
            key={`${agent.type}-${agent.id}`}
            className="bg-white border border-[#E0DAD0] hover:border-[#C9A052] rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col xl:flex-row xl:items-center gap-4 xl:gap-6 group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#0F1420] text-[#C9A052]">
                  {agent.referenceId}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {agent.status}
                </span>
              </div>
              <h3 className="text-base font-black text-[#0F1420] group-hover:text-[#C9A052] transition-colors truncate">
                {agent.name}
              </h3>
              <p className="text-xs text-gray-600 font-semibold flex items-center gap-1 mt-0.5 min-w-0">
                <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="truncate">{agent.agencyName}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2 flex-[1.4] min-w-0 text-xs font-mono">
              <div className="flex items-center gap-2 text-gray-700 min-w-0">
                <Mail className="w-3.5 h-3.5 text-[#C9A052] flex-shrink-0" />
                <span className="truncate">{agent.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 min-w-0">
                <Phone className="w-3.5 h-3.5 text-[#C9A052] flex-shrink-0" />
                <span className="truncate">{agent.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 min-w-0 sm:col-span-2">
                <Globe className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="truncate">{agent.country}</span>
              </div>
            </div>

            <div className="flex items-stretch gap-2 flex-shrink-0">
              <div className="p-2.5 rounded-xl border border-gray-200 bg-white min-w-[112px]">
                <span className="text-[10px] text-gray-500 font-mono block">TOTAL BOOKINGS</span>
                <p className="text-sm font-black font-mono text-[#0F1420]">
                  {agent.totalBookings} Flights
                </p>
              </div>

              <div className="p-2.5 rounded-xl border border-gray-200 bg-white min-w-[112px]">
                <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                  <Coins className="w-3 h-3 text-[#C9A052]" /> TOKENS
                </span>
                <p className="text-sm font-black font-mono text-[#C9A052]">
                  {agent.tokenBalance?.toLocaleString() || "2,000"} pts
                </p>
              </div>
            </div>

            <div className="flex xl:flex-col items-center xl:items-end justify-between xl:justify-center gap-2 xl:border-l xl:border-[#E0DAD0] xl:pl-5 text-xs flex-shrink-0">
              <div className="flex flex-col items-start xl:items-end gap-1">
                <span className="text-[11px] font-mono text-gray-500">
                  Source: {agent.type === "account" ? "Account Registry" : "Contact Directory"}
                </span>
                <span className="text-[11px] font-mono text-gray-500">
                  Commission: <strong className="text-[#0F1420]">{agent.commissionPct}%</strong>
                </span>
              </div>
              <button
                onClick={() => setActiveNav("generate_quote")}
                className="text-xs font-bold text-[#C9A052] hover:text-[#0F1420] flex items-center gap-1 transition-colors"
              >
                <span>Issue Quote</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-12 text-center space-y-3">
          <UserCheck className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-[#0F1420]">No agents or brokers matching criteria</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            You can tag existing accounts or contacts as agents in their respective directories, or click below to invite an agent directly.
          </p>
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#0F1420] text-white text-xs font-bold"
          >
            + Invite Agent Partner
          </button>
        </div>
      )}

      {/* Invite Agent Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full flex flex-col shadow-2xl border border-[#D1C9BC] overflow-hidden">
            <div className="p-6 bg-[#0F1420] text-white flex items-start justify-between border-b border-[#1C2436]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A052] font-bold">
                  BROKER REGISTRATION & ACCREDITATION
                </span>
                <h2 className="text-xl font-black text-white">Invite Charter Agent Partner</h2>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#1C2436] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
              {inviteSent ? (
                <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-300 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h3 className="text-base font-black text-emerald-900">Broker Invitation Dispatched!</h3>
                  <p className="text-xs text-emerald-700">
                    Invitation link and broker onboarding token credentials sent to {inviteEmail}.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#0F1420] mb-1">
                      Broker Legal Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="e.g. Jonathan Sterling"
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0F1420] mb-1">
                      Agency / Brokerage Firm
                    </label>
                    <input
                      type="text"
                      value={inviteAgency}
                      onChange={(e) => setInviteAgency(e.target.value)}
                      placeholder="e.g. Sterling Executive Jets Ltd"
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#0F1420] mb-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="agent@brokerage.com"
                        className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0F1420] mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={invitePhone}
                        onChange={(e) => setInvitePhone(e.target.value)}
                        placeholder="+44 20 7946 0000"
                        className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#0F1420] mb-1">
                        Broker Commission (%)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="25"
                        value={inviteCommission}
                        onChange={(e) => setInviteCommission(Number(e.target.value))}
                        className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] font-mono focus:outline-none focus:border-[#C9A052]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0F1420] mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        value={inviteCountry}
                        onChange={(e) => setInviteCountry(e.target.value)}
                        className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E0DAD0] flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsInviteModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#0F1420] text-[#C9A052] font-black text-xs uppercase tracking-wider hover:bg-[#1C2436]"
                    >
                      Dispatch Invitation
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
