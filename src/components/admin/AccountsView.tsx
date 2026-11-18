"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import { AccountRecord, AuthorizedPerson } from "@/types/aviation";

interface AccountsViewProps {
  selectedAccountId?: string;
}

export default function AccountsView({ selectedAccountId }: AccountsViewProps = {}) {
  const router = useRouter();
  const {
    accounts,
    contacts,
    updateAccount,
    deleteAccount,
    addAccount,
    openNewQuoteModal,
    setActiveNav
  } = useAviation();

  const [activeAccId, setActiveAccId] = useState<string | null>(selectedAccountId || null);
  const [activeTab, setActiveTab] = useState<"overview" | "authorised_persons" | "trips" | "invoices" | "preferences">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPill, setFilterPill] = useState<"all" | "company" | "individual" | "agent">("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<AccountRecord>>({});

  // Sync selectedAccountId prop
  useEffect(() => {
    if (selectedAccountId) {
      setActiveAccId(selectedAccountId);
    }
  }, [selectedAccountId]);

  const activeAccount = useMemo(() => {
    if (!activeAccId) return null;
    return accounts.find((a) => a.id === activeAccId || a.accountNumber === activeAccId) || null;
  }, [activeAccId, accounts]);

  // Counts for filter pills
  const counts = useMemo(() => {
    const companyCount = accounts.filter((a) => a.accountType === "entity" && !a.isAgent).length;
    const individualCount = accounts.filter((a) => a.accountType === "individual" && !a.isAgent).length;
    const agentCount = accounts.filter((a) => a.isAgent).length;
    return {
      all: accounts.length,
      company: companyCount,
      individual: individualCount,
      agent: agentCount
    };
  }, [accounts]);

  // Unique agents for the dropdown
  const uniqueAgents = useMemo(() => {
    const set = new Set<string>();
    accounts.forEach((a) => {
      if (a.agentName) set.add(a.agentName);
    });
    return Array.from(set);
  }, [accounts]);

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      // Filter pill
      if (filterPill === "company" && (acc.accountType !== "entity" || acc.isAgent)) return false;
      if (filterPill === "individual" && (acc.accountType !== "individual" || acc.isAgent)) return false;
      if (filterPill === "agent" && !acc.isAgent) return false;

      // Agent dropdown
      if (agentFilter !== "all" && acc.agentName !== agentFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchAccNo = acc.accountNumber?.toLowerCase().includes(q);
        const matchName = acc.name?.toLowerCase().includes(q) || acc.legalName?.toLowerCase().includes(q);
        const matchCountry = acc.country?.toLowerCase().includes(q);
        const matchContact = acc.preferredContactName?.toLowerCase().includes(q) || acc.email?.toLowerCase().includes(q);
        const matchAuth = acc.authorizedPersons?.some((p) => p.fullName?.toLowerCase().includes(q));
        if (!matchAccNo && !matchName && !matchCountry && !matchContact && !matchAuth) return false;
      }

      return true;
    });
  }, [accounts, filterPill, agentFilter, searchQuery]);

  const handleOpenAccount = (acc: AccountRecord) => {
    setActiveAccId(acc.accountNumber || acc.id);
    setActiveTab("overview");
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `/accounts/${acc.accountNumber || acc.id}`);
    }
  };

  const handleBackToList = () => {
    setActiveAccId(null);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `/accounts`);
    }
  };

  const handleOpenContact = (contactIdOrName: string) => {
    // Find contact by id or fullName
    const match = contacts.find((c) => c.id === contactIdOrName || c.fullName === contactIdOrName || `${c.firstName} ${c.lastName}` === contactIdOrName);
    const targetId = match ? match.id : contactIdOrName;
    setActiveNav("contacts");
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `/contacts/${targetId}`);
    }
  };

  const handleUnlinkPerson = (personId: string) => {
    if (!activeAccount) return;
    const updated = activeAccount.authorizedPersons.filter((p) => p.id !== personId);
    updateAccount(activeAccount.id, { authorizedPersons: updated });
  };

  const handleOpenEditModal = () => {
    if (!activeAccount) return;
    setEditFormData({
      name: activeAccount.name,
      legalName: activeAccount.legalName || activeAccount.name,
      vatTaxNumber: activeAccount.vatTaxNumber || "",
      billingAddress: activeAccount.billingAddress,
      sendDocumentsTo: activeAccount.sendDocumentsTo || activeAccount.email,
      phone: activeAccount.phone,
      country: activeAccount.country,
      agentName: activeAccount.agentName || "M. Vance",
      isAgent: activeAccount.isAgent
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccount) return;
    updateAccount(activeAccount.id, editFormData);
    setIsEditModalOpen(false);
  };

  const handleNewQuote = () => {
    openNewQuoteModal();
  };

  // Format currency helper
  const formatEuro = (amount?: number) => {
    if (amount === undefined || amount === null) return "€ 0.00";
    return `€ ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // ==========================================
  // VIEW: DETAILS SCREEN (SCREEN 4)
  // ==========================================
  if (activeAccount) {
    const authPersonsCount = activeAccount.authorizedPersons?.length || 0;
    const tripsCount = activeAccount.totalBookings || activeAccount.recentTrips?.length || 6;
    const isCompany = activeAccount.accountType === "entity" && !activeAccount.isAgent;
    const typeLabel = activeAccount.isAgent ? "Agent" : isCompany ? "Company" : "Individual";

    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
          <button
            onClick={handleBackToList}
            className="hover:text-gray-900 transition-colors"
          >
            Accounts
          </button>
          <span>/</span>
          <span className="text-gray-800">{activeAccount.accountNumber}</span>
        </div>

        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {activeAccount.name} {activeAccount.accountNumber}
            </h1>
            {/* Subtitle Tags */}
            <div className="flex items-center gap-3 text-xs text-gray-600 mt-1 font-medium">
              <span>{typeLabel}</span>
              <span>{activeAccount.country}</span>
              <span>Agent: {activeAccount.agentName || "M. Vance"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleOpenEditModal}
              className="bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 text-xs font-medium px-4 py-1.5 rounded-lg shadow-sm transition-all"
            >
              Edit
            </button>
            <button
              onClick={handleNewQuote}
              className="bg-[#111827] text-white hover:bg-gray-800 text-xs font-semibold px-4 py-1.5 rounded-lg shadow-sm transition-all"
            >
              New quote
            </button>
          </div>
        </div>

        {/* Tabs Row */}
        <div className="flex items-center gap-6 border-b border-gray-200 text-xs">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-2.5 font-medium transition-colors ${
              activeTab === "overview"
                ? "border-b-2 border-black text-gray-900 font-bold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("authorised_persons")}
            className={`pb-2.5 font-medium transition-colors ${
              activeTab === "authorised_persons"
                ? "border-b-2 border-black text-gray-900 font-bold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Authorised persons ({authPersonsCount})
          </button>
          <button
            onClick={() => setActiveTab("trips")}
            className={`pb-2.5 font-medium transition-colors ${
              activeTab === "trips"
                ? "border-b-2 border-black text-gray-900 font-bold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Trips ({tripsCount})
          </button>
          <button
            onClick={() => setActiveTab("invoices")}
            className={`pb-2.5 font-medium transition-colors ${
              activeTab === "invoices"
                ? "border-b-2 border-black text-gray-900 font-bold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Invoices
          </button>
          <button
            onClick={() => setActiveTab("preferences")}
            className={`pb-2.5 font-medium transition-colors ${
              activeTab === "preferences"
                ? "border-b-2 border-black text-gray-900 font-bold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Preferences & notes
          </button>
        </div>

        {/* Tab 1: OVERVIEW (Screen 4 Layout) */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Details Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-900 mb-4">Details</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                  <div>
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      LEGAL NAME
                    </div>
                    <div className="font-medium text-gray-900">
                      {activeAccount.legalName || activeAccount.name}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      VAT / TAX ID
                    </div>
                    <div className="font-medium text-gray-900">
                      {activeAccount.vatTaxNumber || "[optional]"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      ADDRESS
                    </div>
                    <div className="font-medium text-gray-900">
                      {activeAccount.billingAddress || "Not specified"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      SEND DOCUMENTS TO
                    </div>
                    <div className="font-medium text-gray-900">
                      {activeAccount.sendDocumentsTo || activeAccount.email || "Not specified"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      PHONE
                    </div>
                    <div className="font-medium text-gray-900">
                      {activeAccount.phone || "Not specified"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      IS AN AGENT
                    </div>
                    <div className="font-medium text-gray-900">
                      {activeAccount.isAgent ? "Yes" : "No"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Authorised Persons Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-900 mb-3">Authorised persons</h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 text-[11px] uppercase tracking-wider">
                        <th className="py-2.5 font-semibold">AUTHORISED PERSON</th>
                        <th className="py-2.5 font-semibold">ROLE</th>
                        <th className="py-2.5 font-semibold">CONTACT</th>
                        <th className="py-2.5 font-semibold">DOCUMENTS</th>
                        <th className="py-2.5 text-right font-semibold"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {activeAccount.authorizedPersons && activeAccount.authorizedPersons.length > 0 ? (
                        activeAccount.authorizedPersons.map((person) => {
                          const hasPassportDoc = person.hasPassport ?? (!!person.passportDetails?.passportNumber && person.passportDetails.passportNumber.length > 3);
                          return (
                            <tr key={person.id} className="hover:bg-gray-50/50">
                              <td className="py-3 font-medium">
                                <button
                                  onClick={() => handleOpenContact(person.contactId || person.fullName)}
                                  className="text-blue-600 hover:underline font-medium text-left"
                                >
                                  {person.fullName}
                                </button>
                              </td>
                              <td className="py-3 text-gray-700">
                                {person.roleTitle || "Authorised signatory"}
                              </td>
                              <td className="py-3 text-gray-600">
                                {person.email ? (person.email.length > 18 ? `${person.email.slice(0, 10)}...` : person.email) : "office@..."}
                              </td>
                              <td className="py-3 whitespace-nowrap">
                                {hasPassportDoc ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                                    Passport ✓
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                                    ⚠️ No document
                                  </span>
                                )}
                              </td>
                              <td className="py-3 text-right whitespace-nowrap">
                                <button
                                  onClick={() => handleUnlinkPerson(person.id)}
                                  className="text-blue-600 hover:underline text-xs font-medium"
                                >
                                  Unlink
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-xs text-gray-400">
                            No authorised persons linked yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-400 leading-relaxed mt-2">
                  Authorised persons are Contacts linked to this account. &ldquo;Link contact&rdquo; searches Contacts. A new person is created in Contacts first.
                </div>
              </div>

              {/* Recent Trips Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-900 mb-3">Recent trips</h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 text-[11px] uppercase tracking-wider">
                        <th className="py-2.5 font-semibold">TRIP</th>
                        <th className="py-2.5 font-semibold">FLIGHT</th>
                        <th className="py-2.5 font-semibold">ROUTE</th>
                        <th className="py-2.5 font-semibold">STAGE</th>
                        <th className="py-2.5 text-right font-semibold">VALUE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {activeAccount.recentTrips && activeAccount.recentTrips.length > 0 ? (
                        activeAccount.recentTrips.map((trip) => (
                          <tr key={trip.tripId} className="hover:bg-gray-50/50">
                            <td className="py-3 font-mono font-medium text-gray-900">
                              {trip.tripId}
                            </td>
                            <td className="py-3 text-gray-700 whitespace-nowrap">
                              {trip.flightDate}
                            </td>
                            <td className="py-3 font-mono text-gray-900">
                              {trip.route}
                            </td>
                            <td className="py-3 whitespace-nowrap">
                              {trip.stage.toLowerCase() === "paid" ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                                  Paid
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700">
                                  {trip.stage}
                                </span>
                              )}
                            </td>
                            <td className="py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                              {formatEuro(trip.value)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-xs text-gray-400">
                            No recent trips recorded for this account.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column (4 cols) */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-6">
                {/* BALANCE */}
                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    BALANCE
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="text-gray-600">
                      Invoiced {formatEuro(activeAccount.invoicedAmount ?? (activeAccount.totalSpend || 0))}
                    </div>
                    <div className="text-gray-600">
                      Received {formatEuro(activeAccount.receivedAmount ?? (activeAccount.totalSpend ? Math.round(activeAccount.totalSpend * 0.8) : 0))}
                    </div>
                    <div className={`text-sm font-bold pt-1 ${(activeAccount.openBalance ?? 0) > 0 ? "text-[#D97706]" : "text-gray-900"}`}>
                      Open {formatEuro(activeAccount.openBalance ?? 0)}
                    </div>
                  </div>
                </div>

                {/* PREFERENCES */}
                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    PREFERENCES
                  </div>
                  <div className="space-y-1 text-xs text-gray-700">
                    {activeAccount.preferencesList && activeAccount.preferencesList.length > 0 ? (
                      activeAccount.preferencesList.map((pref, i) => (
                        <div key={i}>{pref}</div>
                      ))
                    ) : activeAccount.notes ? (
                      <div>{activeAccount.notes}</div>
                    ) : (
                      <div className="text-gray-400">Standard VIP executive catering & handling</div>
                    )}
                  </div>
                </div>

                {/* LIFETIME */}
                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    LIFETIME
                  </div>
                  <div className="space-y-1 text-xs text-gray-700">
                    <div>
                      {activeAccount.lifetimeTrips ?? activeAccount.totalBookings ?? 0} trips · since {activeAccount.lifetimeSince || (activeAccount.createdAt ? activeAccount.createdAt.slice(0, 4) : "2024")}
                    </div>
                    <div>
                      Conversion {activeAccount.conversionRate ?? (activeAccount.totalBookings ? Math.min(95, 50 + activeAccount.totalBookings * 5) : 60)} %
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: AUTHORISED PERSONS */}
        {activeTab === "authorised_persons" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Linked Authorised Persons</h2>
              <button
                onClick={() => {
                  setActiveNav("contacts");
                  if (typeof window !== "undefined") {
                    window.history.pushState(null, "", `/contacts`);
                  }
                }}
                className="bg-[#111827] text-white hover:bg-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm"
              >
                + Link / Create Contact
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {activeAccount.authorizedPersons.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between">
                  <div>
                    <button
                      onClick={() => handleOpenContact(p.contactId || p.fullName)}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      {p.fullName}
                    </button>
                    <div className="text-[11px] text-gray-500">{p.roleTitle} · {p.email} · {p.phone}</div>
                  </div>
                  <button
                    onClick={() => handleUnlinkPerson(p.id)}
                    className="text-xs text-red-600 hover:underline font-medium"
                  >
                    Unlink
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: TRIPS */}
        {activeTab === "trips" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Trips History ({tripsCount})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 font-semibold">TRIP NUMBER</th>
                    <th className="py-2.5 font-semibold">DATE</th>
                    <th className="py-2.5 font-semibold">ROUTING</th>
                    <th className="py-2.5 font-semibold">STATUS</th>
                    <th className="py-2.5 text-right font-semibold">VALUE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeAccount.recentTrips && activeAccount.recentTrips.length > 0 ? (
                    activeAccount.recentTrips.map((trip) => (
                      <tr key={trip.tripId} className="hover:bg-gray-50/50">
                        <td className="py-3 font-mono font-medium text-gray-900">{trip.tripId}</td>
                        <td className="py-3 text-gray-700">{trip.flightDate}</td>
                        <td className="py-3 font-mono text-gray-900">{trip.route}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            trip.stage.toLowerCase() === "paid"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-700"
                          }`}>
                            {trip.stage}
                          </span>
                        </td>
                        <td className="py-3 text-right font-medium">{formatEuro(trip.value)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-xs text-gray-400">
                        No trip history recorded for this account.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: INVOICES */}
        {activeTab === "invoices" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Account Billing & Invoices</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 font-semibold">INVOICE #</th>
                    <th className="py-2.5 font-semibold">TRIP</th>
                    <th className="py-2.5 font-semibold">DATE</th>
                    <th className="py-2.5 font-semibold">STATUS</th>
                    <th className="py-2.5 text-right font-semibold">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeAccount.recentTrips && activeAccount.recentTrips.length > 0 ? (
                    activeAccount.recentTrips.map((trip, idx) => (
                      <tr key={trip.tripId} className="hover:bg-gray-50/50">
                        <td className="py-3 font-mono font-medium text-gray-900">
                          {`INV-2026-${(900 + idx * 37).toString().padStart(4, "0")}`}
                        </td>
                        <td className="py-3 text-gray-700 font-mono">{trip.tripId}</td>
                        <td className="py-3 text-gray-700">{trip.flightDate} 2026</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            trip.stage.toLowerCase() === "paid"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-800"
                          }`}>
                            {trip.stage.toLowerCase() === "paid" ? "Paid in Full" : "Pending / Partial"}
                          </span>
                        </td>
                        <td className="py-3 text-right font-medium">{formatEuro(trip.value)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-xs text-gray-400">
                        No invoices issued for this account.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: PREFERENCES & NOTES */}
        {activeTab === "preferences" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Corporate Flight Preferences & Notes</h2>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-lg text-gray-800">
                <strong>Standard Preferences:</strong>{" "}
                {activeAccount.preferencesList && activeAccount.preferencesList.length > 0
                  ? activeAccount.preferencesList.join(", ")
                  : "Standard VIP executive catering & handling."}
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-gray-800">
                <strong>Executive Notes:</strong> {activeAccount.notes || "No special executive notes recorded."}
              </div>
            </div>
          </div>
        )}

        {/* Edit Account Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-lg w-full p-6 space-y-4">
              <h3 className="text-base font-bold text-gray-900">Edit Account Details</h3>
              <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">
                    Legal Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.legalName || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, legalName: e.target.value, name: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-gray-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">
                    VAT / Tax ID
                  </label>
                  <input
                    type="text"
                    value={editFormData.vatTaxNumber || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, vatTaxNumber: e.target.value })}
                    placeholder="[optional]"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={editFormData.billingAddress || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, billingAddress: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">
                    Send Documents To
                  </label>
                  <input
                    type="text"
                    value={editFormData.sendDocumentsTo || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, sendDocumentsTo: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={editFormData.phone || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">
                    Assigned Agent
                  </label>
                  <input
                    type="text"
                    value={editFormData.agentName || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, agentName: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-medium px-4 py-1.5 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#111827] text-white hover:bg-gray-800 text-xs font-semibold px-4 py-1.5 rounded-lg"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW: LIST SCREEN (LIST FORM MATCHING SCREEN 2)
  // ==========================================
  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-12">
      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Accounts</h1>

      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search input + Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search account, country, contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3.5 py-1.5 text-xs text-gray-900 placeholder-gray-400 w-64 focus:outline-none focus:border-gray-400 shadow-sm transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterPill("all")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                filterPill === "all"
                  ? "bg-[#111827] text-white shadow-sm"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              All {counts.all}
            </button>
            <button
              onClick={() => setFilterPill("company")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                filterPill === "company"
                  ? "bg-[#111827] text-white shadow-sm"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              Company {counts.company}
            </button>
            <button
              onClick={() => setFilterPill("individual")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                filterPill === "individual"
                  ? "bg-[#111827] text-white shadow-sm"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              Individual {counts.individual}
            </button>
            <button
              onClick={() => setFilterPill("agent")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                filterPill === "agent"
                  ? "bg-[#111827] text-white shadow-sm"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              Agent {counts.agent}
            </button>
          </div>
        </div>

        {/* Right: Agent Dropdown Filter */}
        <div>
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="bg-white border border-gray-200 text-gray-700 rounded-full px-3 py-1 text-xs font-medium focus:outline-none focus:border-gray-400 shadow-sm cursor-pointer"
          >
            <option value="all">Agent: all</option>
            {uniqueAgents.map((agent) => (
              <option key={agent} value={agent}>
                {agent}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-white">
                <th className="py-3.5 px-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider">
                  ACCOUNT
                </th>
                <th className="py-3.5 px-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider">
                  LEGAL NAME
                </th>
                <th className="py-3.5 px-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider">
                  TYPE
                </th>
                <th className="py-3.5 px-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider">
                  COUNTRY
                </th>
                <th className="py-3.5 px-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider">
                  AGENT
                </th>
                <th className="py-3.5 px-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider">
                  CONTACTS
                </th>
                <th className="py-3.5 px-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider">
                  TRIPS
                </th>
                <th className="py-3.5 px-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider">
                  BALANCE
                </th>
                <th className="py-3.5 px-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider">
                  STATUS
                </th>
                <th className="py-3.5 px-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAccounts.map((acc) => {
                const isCompany = acc.accountType === "entity" && !acc.isAgent;
                const typeLabel = acc.isAgent ? "Agent" : isCompany ? "Company" : "Individual";
                const contactsCount = acc.authorizedPersons?.length || 1;
                const tripsNum = acc.totalBookings || acc.recentTrips?.length || 0;
                const openBal = acc.openBalance ?? 0;

                return (
                  <tr
                    key={acc.id}
                    onClick={() => handleOpenAccount(acc)}
                    className="hover:bg-gray-50/70 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono font-medium text-gray-900 whitespace-nowrap">
                      {acc.accountNumber}
                    </td>
                    <td className="py-3.5 px-4 text-gray-900 font-medium">
                      {acc.name}
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap">
                      {typeLabel}
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap">
                      {acc.country}
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap">
                      {acc.agentName || (acc.isAgent ? "Internal" : "M. Vance")}
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap">
                      {contactsCount} authorised
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap">
                      {tripsNum} trips
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {openBal > 0 ? (
                        <span className="font-semibold text-amber-700">
                          Open {formatEuro(openBal)}
                        </span>
                      ) : (
                        <span className="text-gray-600">
                          € 0.00
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                        Active
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAccount(acc);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-xs text-gray-400">
                    No accounts found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="py-3.5 px-4 border-t border-gray-100 text-[11px] text-gray-400 leading-relaxed bg-white">
          Oldest account first. An account tracks legal entity details, linked authorised persons, recent trips, and open ledger balances.
        </div>
      </div>
    </div>
  );
}
