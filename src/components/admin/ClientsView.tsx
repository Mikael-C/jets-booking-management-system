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
  UserCheck
} from "lucide-react";

export default function ClientsView() {
  const { clients, addClient, setActiveNav, setPrefillClientForQuote, role } = useAviation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
    if (role === "admin") {
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

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/15 text-[#9A7A35] border border-[#C9A052]/30">
              COMPANY CLIENT DIRECTORY
            </span>
            <span className="text-xs text-[#0F1420]/60">Verified High-Net-Worth Accounts</span>
          </div>
          <h2 className="text-xl font-black text-[#0F1420] tracking-tight">
            Clients of the Company
          </h2>
          <p className="text-xs text-[#0F1420]/65 mt-0.5">
            Manage executive client profiles, direct phone numbers, corporate email addresses, and charter history.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Client</span>
        </button>
      </div>

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
          <span>Total Clients: <strong className="text-[#0F1420]">{clients.length}</strong></span>
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
                <th className="py-3.5 px-4 font-bold">Phone Number</th>
                <th className="py-3.5 px-4 font-bold">Email Address</th>
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
                  <tr key={client.id} className="hover:bg-[#F5F2EC]/60 transition-colors">
                    
                    {/* Name & Tier */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-[#0F1420] text-sm">{client.fullName}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#C9A052]/15 text-[#9A7A35] border border-[#C9A052]/30 w-max mt-1">
                          {client.vipTier}
                        </span>
                      </div>
                    </td>

                    {/* Company */}
                    <td className="py-4 px-4 font-semibold text-[#0F1420]/80">
                      {client.companyName ? (
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-gray-400" />
                          <span>{client.companyName}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Private Individual</span>
                      )}
                    </td>

                    {/* Phone Number */}
                    <td className="py-4 px-4 font-mono font-bold text-[#0F1420]">
                      <a
                        href={`tel:${client.phone}`}
                        className="flex items-center gap-1.5 hover:text-[#C9A052] transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#C9A052]" />
                        <span>{client.phone}</span>
                      </a>
                    </td>

                    {/* Email */}
                    <td className="py-4 px-4 font-mono text-[#0F1420]/80">
                      <a
                        href={`mailto:${client.email}`}
                        className="flex items-center gap-1.5 hover:text-[#C9A052] transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span>{client.email}</span>
                      </a>
                    </td>

                    {/* Location */}
                    <td className="py-4 px-4 text-[11px] text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="truncate max-w-[150px]">{client.cityPostalCountry}</span>
                      </div>
                    </td>

                    {/* Bookings / Spend */}
                    <td className="py-4 px-4 font-mono">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#0F1420]">
                          {formatCurrency(client.totalSpend, "EUR")}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {client.totalBookings} Completed Charters
                        </span>
                      </div>
                    </td>

                    {/* Action in Gold */}
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleStartQuoteForClient(client)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-xs font-bold transition-all shadow-sm ml-auto cursor-pointer"
                        title="Create new quote proposal for this client"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{role === "admin" ? "Create Quote" : "Request Quote"}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E0DAD0] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0DAD0]">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#C9A052]" />
                <h3 className="text-base font-extrabold text-[#0F1420]">
                  Add Client to Company Roster
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddClientSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    required
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                    Direct Phone *
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    required
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                    Corporate Email *
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                    City, Postcode & Country
                  </label>
                  <input
                    type="text"
                    value={newCityCountry}
                    onChange={(e) => setNewCityCountry(e.target.value)}
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                    VIP Tier
                  </label>
                  <select
                    value={newVipTier}
                    onChange={(e) => setNewVipTier(e.target.value as any)}
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  >
                    <option value="Ultra HNWI">Ultra HNWI</option>
                    <option value="Corporate Executive">Corporate Executive</option>
                    <option value="Family Office">Family Office</option>
                    <option value="Private VIP">Private VIP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                    Tax / VAT Number
                  </label>
                  <input
                    type="text"
                    value={newVat}
                    onChange={(e) => setNewVat(e.target.value)}
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  VIP Preferences & Cabin Notes
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Vintage champagne, pet friendly, ramp car transfer..."
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl p-2.5 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div className="pt-3 border-t border-[#E0DAD0] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-200 text-gray-800 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-xs font-black uppercase tracking-wider"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
