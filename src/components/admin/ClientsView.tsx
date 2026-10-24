"use client";

import React, { useState } from "react";
import { useAviation } from "@/lib/aviationContext";
import { ClientRecord } from "@/types/aviation";
import { formatCurrency } from "@/lib/pricingCalculator";
import {
  Users,
  Search,
  Phone,
  Mail,
  Building,
  Plus,
  Sparkles,
  MapPin,
  CheckCircle2,
  X,
  CreditCard,
  UserCheck,
  Plane,
  FileText,
  Landmark,
  Shield,
  Send,
  Check
} from "lucide-react";

interface AgentRecord {
  id: string;
  name: string;
  agencyName: string;
  email: string;
  phone: string;
  taxId: string;
  commissionType: "percentage" | "fixed";
  commissionValue: number;
  bankIban: string;
  bankBic: string;
  status: "active" | "invited" | "pending_agreement";
  agreementSignedDate?: string;
  totalDeals: number;
  totalCommissionPaid: number;
}

const INITIAL_AGENTS: AgentRecord[] = [
  {
    id: "agt-1",
    name: "Marcus Vance",
    agencyName: "Vance Aviation & Concierge Ltd",
    email: "agent@orbelo.com",
    phone: "+44 20 7946 0912",
    taxId: "GB-94204192",
    commissionType: "percentage",
    commissionValue: 8,
    bankIban: "GB29BARC20041538920194",
    bankBic: "BARCGB22",
    status: "active",
    agreementSignedDate: "2026-01-10",
    totalDeals: 14,
    totalCommissionPaid: 42800
  },
  {
    id: "agt-2",
    name: "Camille Laurent",
    agencyName: "Monaco Luxury Jet Brokers SARL",
    email: "c.laurent@monacojets.mc",
    phone: "+377 98 06 20 00",
    taxId: "FR-09418290",
    commissionType: "percentage",
    commissionValue: 10,
    bankIban: "MC5830006000010001234567890",
    bankBic: "CCBMMC22",
    status: "active",
    agreementSignedDate: "2026-03-15",
    totalDeals: 8,
    totalCommissionPaid: 29500
  },
  {
    id: "agt-3",
    name: "Stefan Lindqvist",
    agencyName: "Nordic Private Air AB",
    email: "stefan@nordicair.se",
    phone: "+46 8 123 4567",
    taxId: "SE-556123456701",
    commissionType: "percentage",
    commissionValue: 7.5,
    bankIban: "SE4550000000058392019482",
    bankBic: "HANDSEGG",
    status: "invited",
    totalDeals: 0,
    totalCommissionPaid: 0
  }
];

export default function ClientsView() {
  const { clients, addClient, setActiveNav, setPrefillClientForQuote, role, addAuditEntry, currentUser } = useAviation();
  const [activeTab, setActiveTab] = useState<"clients" | "agents">("clients");

  // Client search & modal
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Agent state & invite modal (USR-3)
  const [agents, setAgents] = useState<AgentRecord[]>(INITIAL_AGENTS);
  const [isInviteAgentOpen, setIsInviteAgentOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteAgency, setInviteAgency] = useState("");
  const [inviteTaxId, setInviteTaxId] = useState("");
  const [inviteCommission, setInviteCommission] = useState<number>(8);
  const [inviteIban, setInviteIban] = useState("");
  const [inviteSentToast, setInviteSentToast] = useState(false);

  // New Client Form state
  const [newFullName, setNewFullName] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCityCountry, setNewCityCountry] = useState("");
  const [newVat, setNewVat] = useState("");
  const [newVipTier, setNewVipTier] = useState<ClientRecord["vipTier"]>("Private VIP");
  const [newPreferredJet, setNewPreferredJet] = useState("Midsize Jet");
  const [newNotes, setNewNotes] = useState("");

  const filteredClients = clients.filter((c) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(q) ||
      (c.companyName?.toLowerCase().includes(q) ?? false) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q)
    );
  });

  const handleStartQuoteForClient = (client: ClientRecord) => {
    setPrefillClientForQuote(client);
    if (role === "admin" || role === "super_admin") {
      setActiveNav("generate_quote");
    } else {
      setActiveNav("request_quote");
    }
  };

  const handleAddClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newClientRecord: ClientRecord = {
      id: `client-${Date.now()}`,
      fullName: newFullName,
      companyName: newCompany,
      phone: newPhone,
      email: newEmail,
      streetAddress: newAddress,
      cityPostalCountry: newCityCountry,
      vatNumber: newVat,
      totalBookings: 0,
      totalSpend: 0,
      vipTier: newVipTier,
      preferredJetCategory: newPreferredJet,
      notes: newNotes,
      createdAt: new Date().toISOString().split("T")[0]
    };

    addClient(newClientRecord);
    setIsAddModalOpen(false);

    // Reset fields
    setNewFullName("");
    setNewCompany("");
    setNewPhone("");
    setNewEmail("");
    setNewAddress("");
    setNewCityCountry("");
    setNewVat("");
    setNewNotes("");
  };

  const handleInviteAgentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;

    const newAgent: AgentRecord = {
      id: `agt-${Date.now()}`,
      name: inviteName,
      agencyName: inviteAgency || `${inviteName} Brokerage`,
      email: inviteEmail,
      phone: "+44 20 7000 0000",
      taxId: inviteTaxId || "GB-PENDING",
      commissionType: "percentage",
      commissionValue: inviteCommission,
      bankIban: inviteIban || "GB29BARC...",
      bankBic: "BARCGB22",
      status: "invited",
      totalDeals: 0,
      totalCommissionPaid: 0
    };

    setAgents((prev) => [newAgent, ...prev]);

    addAuditEntry({
      userEmail: currentUser?.email || "admin@orbelo.com",
      userName: currentUser?.name || "Admin",
      action: "AGENT_INVITED",
      entityType: "Agent",
      entityId: newAgent.id,
      details: `Invited partner broker: ${inviteName} (${inviteEmail}) with ${inviteCommission}% commission terms`
    });

    setInviteSentToast(true);
    setTimeout(() => {
      setInviteSentToast(false);
      setIsInviteAgentOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInviteAgency("");
      setInviteTaxId("");
      setInviteIban("");
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/15 text-[#9A7A35] border border-[#C9A052]/30">
              DIRECTORY & ONBOARDING [USR-3 & ADM-6]
            </span>
            <span className="text-xs text-[#0F1420]/60">Clients & Partner Brokers</span>
          </div>
          <h2 className="text-xl font-black text-[#0F1420] tracking-tight">
            Accounts, Clients & Agent Roster
          </h2>
          <p className="text-xs text-[#0F1420]/65 mt-0.5">
            Manage high-net-worth client profiles, partner brokers, commission rates, and agent onboarding agreements.
          </p>
        </div>

        {/* Tab & CTA */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#F5F2EC] p-1.5 rounded-xl border border-[#E0DAD0]">
            <button
              onClick={() => setActiveTab("clients")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "clients" ? "bg-[#0F1420] text-white shadow-sm" : "text-[#0F1420]/70 hover:text-[#0F1420]"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-[#C9A052]" />
              <span>Clients ({clients.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("agents")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "agents" ? "bg-[#0F1420] text-white shadow-sm" : "text-[#0F1420]/70 hover:text-[#0F1420]"
              }`}
            >
              <Plane className="w-3.5 h-3.5 text-[#C9A052]" />
              <span>Partner Brokers ({agents.length})</span>
            </button>
          </div>

          {activeTab === "clients" ? (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Client</span>
            </button>
          ) : (
            <button
              onClick={() => setIsInviteAgentOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F1420] hover:bg-[#1A2338] text-white text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#C9A052]" />
              <span>Invite Agent</span>
            </button>
          )}
        </div>
      </div>

      {/* ── TAB 1: CLIENT DIRECTORY ── */}
      {activeTab === "clients" && (
        <div className="space-y-4">
          {/* Search and Metrics Strip */}
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by client name, company, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl pl-10 pr-4 py-2 text-xs text-[#0F1420] placeholder-gray-500 focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-gray-600">
              <span>Total Accounts: <strong className="text-[#0F1420]">{clients.length}</strong></span>
              <span>•</span>
              <span>Showing: <strong className="text-[#C9A052]">{filteredClients.length}</strong></span>
            </div>
          </div>

          {/* Clients Cards / Table */}
          <div className="bg-white border border-[#E0DAD0] rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F2EC] text-[#0F1420]/70 font-mono text-[11px] uppercase tracking-wider border-b border-[#E0DAD0]">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">Client Name & Tier</th>
                    <th className="py-3.5 px-4 font-bold">Company / Organization</th>
                    <th className="py-3.5 px-4 font-bold">Contact Phone</th>
                    <th className="py-3.5 px-4 font-bold">Corporate Email</th>
                    <th className="py-3.5 px-4 font-bold">Location</th>
                    <th className="py-3.5 px-4 font-bold">Charters / Spend</th>
                    <th className="py-3.5 px-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0DAD0]">
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500 text-xs">
                        No clients found matching &quot;{searchTerm}&quot;.
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => (
                      <tr key={client.id} className="hover:bg-[#FDFCFA] transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-[#0F1420]">{client.fullName}</p>
                          <span className="text-[10px] font-mono text-[#C9A052] font-semibold">
                            {client.vipTier}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{client.companyName || "Private Individual"}</td>
                        <td className="py-3 px-4 font-mono text-gray-600">{client.phone}</td>
                        <td className="py-3 px-4 text-gray-600">{client.email}</td>
                        <td className="py-3 px-4 text-gray-600">{client.cityPostalCountry}</td>
                        <td className="py-3 px-4 font-mono">
                          <p className="font-bold text-[#0F1420]">{client.totalBookings} flights</p>
                          <p className="text-[10px] text-gray-400">€{client.totalSpend.toLocaleString()}</p>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleStartQuoteForClient(client)}
                            className="px-3 py-1.5 rounded-lg bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-xs font-bold transition-all"
                          >
                            New Quote
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: PARTNER BROKERS & AGENTS (USR-3 & ADM-6) ── */}
      {activeTab === "agents" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {agents.map((agt) => (
              <div
                key={agt.id}
                className="bg-white border border-[#E0DAD0] hover:border-[#C9A052] rounded-2xl p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#0F1420]">{agt.name}</h4>
                    <p className="text-xs text-gray-500">{agt.agencyName}</p>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    agt.status === "active"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-amber-100 text-amber-800 border border-amber-300"
                  }`}>
                    {agt.status === "active" ? "Active Broker" : "Invited / Pending"}
                  </span>
                </div>

                <div className="p-3 bg-[#F5F2EC] rounded-xl text-xs font-mono space-y-1 text-gray-700">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span className="text-[#0F1420] font-bold truncate max-w-[170px]">{agt.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Commission Rate:</span>
                    <span className="text-[#C9A052] font-black">{agt.commissionValue}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax ID:</span>
                    <span>{agt.taxId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">IBAN:</span>
                    <span className="truncate max-w-[160px]">{agt.bankIban}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 border-t border-[#E0DAD0] pt-2">
                  <span>Deals: <strong>{agt.totalDeals}</strong></span>
                  <span>Paid: <strong>{formatCurrency(agt.totalCommissionPaid, "EUR")}</strong></span>
                </div>

                {agt.agreementSignedDate && (
                  <p className="text-[10px] font-mono text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Agreement Signed ({agt.agreementSignedDate})
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* USR-3: Invite Agent Modal */}
      {isInviteAgentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0DAD0]">
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4 text-[#C9A052]" />
                <h3 className="text-sm font-bold text-[#0F1420]">
                  Invite Partner Broker / Agent [USR-3]
                </h3>
              </div>
              <button onClick={() => setIsInviteAgentOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {inviteSentToast ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1">
                <Check className="w-6 h-6 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-emerald-800">Agent Invitation Transmitted!</p>
                <p className="text-[11px] text-emerald-700">Invitation email and broker agreement link sent to {inviteEmail}.</p>
              </div>
            ) : (
              <form onSubmit={handleInviteAgentSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Agent Legal Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Marcus Vance"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    required
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Brokerage / Agency Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Vance Aviation Ltd"
                    value={inviteAgency}
                    onChange={(e) => setInviteAgency(e.target.value)}
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Email Address *</label>
                  <input
                    type="email"
                    placeholder="agent@brokerage.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Commission % *</label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={inviteCommission}
                      onChange={(e) => setInviteCommission(Number(e.target.value))}
                      className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Tax / VAT ID</label>
                    <input
                      type="text"
                      placeholder="GB-94204192"
                      value={inviteTaxId}
                      onChange={(e) => setInviteTaxId(e.target.value)}
                      className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Bank IBAN (for commission payouts)</label>
                  <input
                    type="text"
                    placeholder="GB29BARC20041538920194"
                    value={inviteIban}
                    onChange={(e) => setInviteIban(e.target.value)}
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052] font-mono"
                  />
                </div>

                <div className="p-2.5 bg-[#F5F2EC] rounded-xl text-[10px] text-gray-600">
                  <p>Upon sending, an email invitation with the standard Master Broker Agreement is transmitted to the agent. The agent signs electronically to activate portal access.</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsInviteAgentOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[#F5F2EC] text-[#0F1420] text-xs font-bold border border-[#D1C9BC]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-xs font-black transition-all flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Agent Invitation</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0DAD0]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#C9A052]" />
                <h3 className="text-sm font-bold text-[#0F1420]">Add New Client Account</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddClientSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Street Address</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">City, Postal, Country</label>
                  <input
                    type="text"
                    value={newCityCountry}
                    onChange={(e) => setNewCityCountry(e.target.value)}
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">VAT / Tax ID</label>
                  <input
                    type="text"
                    value={newVat}
                    onChange={(e) => setNewVat(e.target.value)}
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#F5F2EC] text-[#0F1420] text-xs font-bold border border-[#D1C9BC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-xs font-black transition-all"
                >
                  Save Client Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
