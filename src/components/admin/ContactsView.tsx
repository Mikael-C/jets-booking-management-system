"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import { ContactRecord, PetRecord, BioIdType } from "@/types/aviation";
import { countriesList } from "@/data/countries";

interface ContactsViewProps {
  selectedContactId?: string;
}

export default function ContactsView({ selectedContactId }: ContactsViewProps = {}) {
  const router = useRouter();
  const {
    contacts,
    accounts,
    bookings,
    updateContact,
    addContact,
    deleteContact,
    setActiveNav
  } = useAviation();

  const [activeCntId, setActiveCntId] = useState<string | null>(selectedContactId || null);
  const [activeTab, setActiveTab] = useState<"travel_documents" | "profile" | "pets" | "trips" | "accounts_roles">("travel_documents");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPill, setFilterPill] = useState<"all" | "authorised" | "passengers" | "agents">("all");
  const [accountFilter, setAccountFilter] = useState("all");

  // Passport inline edit state
  const [passportNumber, setPassportNumber] = useState("");
  const [issuingCountry, setIssuingCountry] = useState("Choose country");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [nationality, setNationality] = useState("Choose");
  const [passportSavedSuccess, setPassportSavedSuccess] = useState(false);

  // Edit contact modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<ContactRecord>>({});

  // Add to trip modal state
  const [isAddToTripOpen, setIsAddToTripOpen] = useState(false);
  const [selectedTripToAdd, setSelectedTripToAdd] = useState("");

  // Sync selectedContactId prop
  useEffect(() => {
    if (selectedContactId) {
      setActiveCntId(selectedContactId);
    }
  }, [selectedContactId]);

  const activeContact = useMemo(() => {
    if (!activeCntId) return null;
    return contacts.find((c) => c.id === activeCntId) || null;
  }, [activeCntId, contacts]);

  // When activeContact changes, populate passport fields
  useEffect(() => {
    if (activeContact) {
      const p = activeContact.passportDetails;
      setPassportNumber(p?.passportNumber || (activeContact.hasPassport ? "On file" : "Not provided"));
      setIssuingCountry(p?.issuingCountry || activeContact.country || "Choose country");
      setIssueDate(p?.issueDate || "");
      setExpiryDate(p?.expirationDate || "");
      setDateOfBirth(p?.dateOfBirth || "");
      setPlaceOfBirth(p?.placeOfBirth || "");
      setNationality(activeContact.nationality || activeContact.country || "Choose");
      setPassportSavedSuccess(false);
    }
  }, [activeContact]);

  // Counts for filter pills
  const counts = useMemo(() => {
    const authCount = contacts.filter((c) => c.roleTitle?.toLowerCase().includes("authoris") || c.roleTitle?.toLowerCase().includes("chairman") || c.roleTitle?.toLowerCase().includes("signatory")).length;
    const passCount = contacts.filter((c) => !c.isAgent).length;
    const agentCount = contacts.filter((c) => c.isAgent).length;
    return {
      all: contacts.length,
      authorised: authCount,
      passengers: passCount,
      agents: agentCount
    };
  }, [contacts]);

  // Unique accounts for dropdown
  const uniqueAccounts = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c) => {
      if (c.associatedAccountName) set.add(c.associatedAccountName);
    });
    return Array.from(set);
  }, [contacts]);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((cnt) => {
      // Filter pill
      if (filterPill === "authorised" && !(cnt.roleTitle?.toLowerCase().includes("authoris") || cnt.roleTitle?.toLowerCase().includes("chairman") || cnt.roleTitle?.toLowerCase().includes("signatory"))) return false;
      if (filterPill === "passengers" && cnt.isAgent) return false;
      if (filterPill === "agents" && !cnt.isAgent) return false;

      // Account filter
      if (accountFilter !== "all" && cnt.associatedAccountName !== accountFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${cnt.firstName} ${cnt.lastName}`.toLowerCase();
        const matchName = fullName.includes(q) || cnt.fullName?.toLowerCase().includes(q);
        const matchEmail = cnt.email?.toLowerCase().includes(q);
        const matchPhone = cnt.phone?.toLowerCase().includes(q);
        const matchAccount = cnt.associatedAccountName?.toLowerCase().includes(q);
        const matchCountry = cnt.country?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchAccount && !matchCountry) return false;
      }

      return true;
    });
  }, [contacts, filterPill, accountFilter, searchQuery]);

  const handleOpenContact = (cnt: ContactRecord) => {
    setActiveCntId(cnt.id);
    setActiveTab("travel_documents");
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `/contacts/${cnt.id}`);
    }
  };

  const handleBackToList = () => {
    setActiveCntId(null);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `/contacts`);
    }
  };

  const handleOpenAccount = (accountNameOrId?: string) => {
    if (!accountNameOrId) return;
    const match = accounts.find((a) => a.id === accountNameOrId || a.name === accountNameOrId || a.accountNumber === accountNameOrId);
    const targetId = match ? (match.accountNumber || match.id) : accountNameOrId;
    setActiveNav("accounts");
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `/accounts/${targetId}`);
    }
  };

  const handleSavePassport = () => {
    if (!activeContact) return;
    const hasDoc = passportNumber.trim() !== "" && passportNumber.trim().toLowerCase() !== "not provided";
    updateContact(activeContact.id, {
      hasPassport: hasDoc,
      nationality: nationality !== "Choose" ? nationality : activeContact.nationality,
      passportDetails: {
        passportNumber: hasDoc ? passportNumber : "",
        issuingCountry: issuingCountry !== "Choose country" ? issuingCountry : activeContact.country,
        placeOfBirth,
        dateOfBirth,
        expirationDate: expiryDate,
        issueDate
      }
    });
    setPassportSavedSuccess(true);
    setTimeout(() => setPassportSavedSuccess(false), 3000);
  };

  const handleOpenEditModal = () => {
    if (!activeContact) return;
    setEditFormData({
      firstName: activeContact.firstName,
      lastName: activeContact.lastName,
      email: activeContact.email,
      phone: activeContact.phone,
      country: activeContact.country,
      gender: activeContact.gender,
      weightKg: activeContact.weightKg,
      title: activeContact.title,
      roleTitle: activeContact.roleTitle,
      associatedAccountId: activeContact.associatedAccountId,
      associatedAccountName: activeContact.associatedAccountName,
      isAgent: activeContact.isAgent
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContact) return;
    updateContact(activeContact.id, editFormData);
    setIsEditModalOpen(false);
  };

  const handleConfirmAddToTrip = () => {
    if (!activeContact || !selectedTripToAdd) return;
    const currentTrips = activeContact.upcomingTrips || [];
    if (!currentTrips.includes(selectedTripToAdd)) {
      updateContact(activeContact.id, {
        upcomingTrips: [...currentTrips, selectedTripToAdd]
      });
    }
    setIsAddToTripOpen(false);
  };

  // ==========================================
  // VIEW: DETAILS SCREEN (SCREEN 1)
  // ==========================================
  if (activeContact) {
    const hasDoc = activeContact.hasPassport ?? (!!activeContact.passportDetails?.passportNumber && activeContact.passportDetails.passportNumber.length > 3);
    const displayName = `${activeContact.firstName} ${activeContact.lastName}`;
    const breadcrumbName = `${activeContact.lastName}, ${activeContact.firstName}`;
    const accountRoleSubtitle = activeContact.roleTitle || (activeContact.associatedAccountName ? `Authorised person · ${activeContact.associatedAccountName}` : "Authorised person");
    const upcomingTripsList = activeContact.upcomingTrips || [];

    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
          <button
            onClick={handleBackToList}
            className="hover:text-gray-900 transition-colors"
          >
            Contacts
          </button>
          <span>/</span>
          <span className="text-gray-800">{breadcrumbName}</span>
        </div>

        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {displayName}
            </h1>
            <div className="flex items-center gap-2.5 mt-1">
              <span className="text-xs text-gray-600 font-medium">
                {accountRoleSubtitle}
              </span>
              {hasDoc ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                  Passport ✓
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                  ▲ No travel document
                </span>
              )}
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
              onClick={() => setIsAddToTripOpen(true)}
              className="bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 text-xs font-medium px-4 py-1.5 rounded-lg shadow-sm transition-all"
            >
              Add to trip
            </button>
          </div>
        </div>

        {/* Tabs Row */}
        <div className="flex items-center gap-6 border-b border-gray-200 text-xs">
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-2.5 font-medium transition-colors ${
              activeTab === "profile"
                ? "border-b-2 border-black text-gray-900 font-bold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("travel_documents")}
            className={`pb-2.5 font-medium transition-colors ${
              activeTab === "travel_documents"
                ? "border-b-2 border-black text-gray-900 font-bold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Travel documents
          </button>
          <button
            onClick={() => setActiveTab("pets")}
            className={`pb-2.5 font-medium transition-colors ${
              activeTab === "pets"
                ? "border-b-2 border-black text-gray-900 font-bold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Pets
          </button>
          <button
            onClick={() => setActiveTab("trips")}
            className={`pb-2.5 font-medium transition-colors ${
              activeTab === "trips"
                ? "border-b-2 border-black text-gray-900 font-bold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Trips
          </button>
          <button
            onClick={() => setActiveTab("accounts_roles")}
            className={`pb-2.5 font-medium transition-colors ${
              activeTab === "accounts_roles"
                ? "border-b-2 border-black text-gray-900 font-bold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Accounts & roles
          </button>
        </div>

        {/* Tab 2: TRAVEL DOCUMENTS (Screen 1 Layout) */}
        {activeTab === "travel_documents" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (8 cols) */}
            <div className="lg:col-span-8 space-y-5">
              {/* Passport Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-gray-900">Passport</h2>
                  <div className="flex items-center gap-2">
                    {passportSavedSuccess && (
                      <span className="text-xs text-emerald-600 font-medium">Saved ✓</span>
                    )}
                    <button
                      type="button"
                      onClick={handleSavePassport}
                      className="bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 text-xs font-medium px-3.5 py-1.5 rounded-lg shadow-sm transition-all"
                    >
                      Upload copy
                    </button>
                  </div>
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                  {/* Row 1 */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      NUMBER
                    </label>
                    <input
                      type="text"
                      value={passportNumber}
                      onChange={(e) => setPassportNumber(e.target.value)}
                      onBlur={handleSavePassport}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs text-gray-800 focus:outline-none focus:border-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      ISSUING COUNTRY
                    </label>
                    <select
                      value={issuingCountry}
                      onChange={(e) => {
                        setIssuingCountry(e.target.value);
                      }}
                      onBlur={handleSavePassport}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs text-gray-800 focus:outline-none focus:border-gray-400"
                    >
                      <option value="Choose country">Choose country</option>
                      {countriesList.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      ISSUE DATE
                    </label>
                    <input
                      type="text"
                      placeholder="DD.MM.YYYY"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      onBlur={handleSavePassport}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs text-gray-800 focus:outline-none focus:border-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      EXPIRY
                    </label>
                    <input
                      type="text"
                      placeholder="DD.MM.YYYY"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      onBlur={handleSavePassport}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs text-gray-800 focus:outline-none focus:border-gray-400"
                    />
                  </div>

                  {/* Row 2 */}
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      DATE OF BIRTH
                    </label>
                    <input
                      type="text"
                      placeholder="DD.MM.YYYY"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      onBlur={handleSavePassport}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs text-gray-800 focus:outline-none focus:border-gray-400"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      PLACE OF BIRTH
                    </label>
                    <input
                      type="text"
                      value={placeOfBirth}
                      onChange={(e) => setPlaceOfBirth(e.target.value)}
                      onBlur={handleSavePassport}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs text-gray-800 focus:outline-none focus:border-gray-400"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      NATIONALITY
                    </label>
                    <select
                      value={nationality}
                      onChange={(e) => {
                        setNationality(e.target.value);
                      }}
                      onBlur={handleSavePassport}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs text-gray-800 focus:outline-none focus:border-gray-400"
                    >
                      <option value="Choose">Choose</option>
                      {countriesList.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Warning note */}
                <div className="text-xs text-[#B45309] font-medium mt-4 flex items-center gap-1.5">
                  <span>▲ Some clients give details by phone only. A copy is optional; the number and expiry are not.</span>
                </div>
              </div>

              {/* ID card Section */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-900 mb-1.5">ID card</h2>
                {activeContact.idDetails?.idNumber ? (
                  <div className="text-xs text-gray-700 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-mono font-medium text-gray-900">{activeContact.idDetails.idNumber}</span>
                      <span className="text-gray-400 mx-2">·</span>
                      <span>{activeContact.idDetails.issuingState || activeContact.country}</span>
                      {activeContact.idDetails.expirationDate && (
                        <>
                          <span className="text-gray-400 mx-2">·</span>
                          <span>Expires {activeContact.idDetails.expirationDate}</span>
                        </>
                      )}
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                      ID on file ✓
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">
                    None on file.{" "}
                    <button
                      onClick={() => {
                        const num = prompt("Enter national ID Card number:");
                        if (num) {
                          updateContact(activeContact.id, {
                            bioIdType: "id",
                            idDetails: {
                              idNumber: num,
                              issuingState: activeContact.country || "Nigeria",
                              dateOfBirth: "",
                              expirationDate: "2030-01-01"
                            }
                          });
                        }
                      }}
                      className="text-gray-800 hover:text-black font-medium hover:underline"
                    >
                      + Add ID card
                    </button>
                  </div>
                )}
              </div>

              {/* Visa Section */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-900 mb-1.5">Visa</h2>
                {activeContact.visaDetails?.visaNumber ? (
                  <div className="text-xs text-gray-700 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-mono font-medium text-gray-900">{activeContact.visaDetails.visaNumber}</span>
                      <span className="text-gray-400 mx-2">·</span>
                      <span>{activeContact.visaDetails.issuingCountry} ({activeContact.visaDetails.visaCategory || "Visa"})</span>
                      {activeContact.visaDetails.validUntil && (
                        <>
                          <span className="text-gray-400 mx-2">·</span>
                          <span>Valid to {activeContact.visaDetails.validUntil}</span>
                        </>
                      )}
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                      Visa valid ✓
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">
                    None on file.{" "}
                    <button
                      onClick={() => {
                        const num = prompt("Enter Visa number and country (e.g. UK-VISA-9921):");
                        if (num) {
                          updateContact(activeContact.id, {
                            visaDetails: {
                              visaNumber: num,
                              visaCategory: "B1/B2 Executive",
                              issuingCountry: "United Kingdom",
                              validFrom: "2026-01-01",
                              validUntil: "2028-01-01",
                              entryType: "multiple"
                            }
                          });
                        }
                      }}
                      className="text-gray-800 hover:text-black font-medium hover:underline"
                    >
                      + Add visa (country, type, number, valid from and to, entries)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-6">
                {/* PROFILE */}
                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    PROFILE
                  </div>
                  <div className="space-y-1 text-xs text-gray-700">
                    <div>{activeContact.gender || "Not specified"} · {activeContact.weightKg ? `${activeContact.weightKg} kg` : "—"}</div>
                    <div>{activeContact.phone || "No phone on file"}</div>
                    <div className="text-gray-600">{activeContact.email || "No email on file"}</div>
                  </div>
                </div>

                {/* ACCOUNTS & ROLES */}
                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    ACCOUNTS & ROLES
                  </div>
                  <div className="space-y-1 text-xs text-gray-700">
                    <div>
                      {activeContact.associatedAccountName ? (
                        <>
                          <button
                            onClick={() => handleOpenAccount(activeContact.associatedAccountId || activeContact.associatedAccountName)}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            {activeContact.associatedAccountName}
                          </button>{" "}
                          · {activeContact.roleTitle || "Authorised person"}
                        </>
                      ) : (
                        <span>Individual client · {activeContact.roleTitle || "Passenger"}</span>
                      )}
                    </div>
                    <div>Agent: {activeContact.isAgent ? "yes" : "no"}</div>
                  </div>
                </div>

                {/* UPCOMING TRIPS */}
                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    UPCOMING TRIPS
                  </div>
                  <div className="text-xs text-gray-700">
                    {upcomingTripsList.length > 0 ? (
                      <div className="space-y-1">
                        {upcomingTripsList.map((t, idx) => (
                          <div key={idx} className="font-mono text-gray-900">{t}</div>
                        ))}
                      </div>
                    ) : (
                      "None"
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Note */}
              <p className="text-[11px] text-gray-400 px-1 leading-relaxed">
                A person exists only once. Every trip and account links here, so a passport added once updates every trip.
              </p>
            </div>
          </div>
        )}

        {/* Tab 1: PROFILE */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Personal & Executive Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-400 text-[11px] uppercase block mb-1">Full Name</span>
                <span className="font-medium text-gray-900">{displayName}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[11px] uppercase block mb-1">Position / Title</span>
                <span className="font-medium text-gray-900">{activeContact.title || activeContact.roleTitle || "—"}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[11px] uppercase block mb-1">Email</span>
                <span className="font-medium text-gray-900">{activeContact.email || "—"}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[11px] uppercase block mb-1">Telephone</span>
                <span className="font-medium text-gray-900">{activeContact.phone || "—"}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[11px] uppercase block mb-1">Country of Residence</span>
                <span className="font-medium text-gray-900">{activeContact.country || "—"}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[11px] uppercase block mb-1">Standard Passenger Weight</span>
                <span className="font-medium text-gray-900">{activeContact.weightKg ? `${activeContact.weightKg} kg` : "—"}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-gray-400 text-[11px] uppercase block mb-1">Notes & Instructions</span>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg leading-relaxed">
                  {activeContact.notes || "No special instructions or notes on file."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: PETS */}
        {activeTab === "pets" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Registered Pets & Service Animals</h2>
            {activeContact.pets && activeContact.pets.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {activeContact.pets.map((pet) => (
                  <div key={pet.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-gray-900">{pet.petName} ({pet.petType})</div>
                      <div className="text-gray-500">{pet.breed} · {pet.weightKg} kg · {pet.specialCareNotes}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No pets currently registered with this passenger.</p>
            )}
          </div>
        )}

        {/* Tab 4: TRIPS */}
        {activeTab === "trips" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Passenger Flight History</h2>
            {upcomingTripsList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 font-semibold">TRIP</th>
                      <th className="py-2.5 font-semibold">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {upcomingTripsList.map((tripId, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-3 font-mono font-medium text-gray-900">{tripId}</td>
                        <td className="py-3"><span className="px-2 py-0.5 rounded-full text-[11px] bg-gray-100 font-medium">Scheduled</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-gray-400">No flight history or upcoming trips recorded for this passenger.</p>
            )}
          </div>
        )}

        {/* Tab 5: ACCOUNTS & ROLES */}
        {activeTab === "accounts_roles" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Linked Accounts & Roles</h2>
            <div className="divide-y divide-gray-100 text-xs">
              {activeContact.associatedAccountName ? (
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{activeContact.associatedAccountName}</div>
                    <div className="text-gray-500">Role: {activeContact.roleTitle || "Authorised person"}</div>
                  </div>
                  <button
                    onClick={() => handleOpenAccount(activeContact.associatedAccountId || activeContact.associatedAccountName)}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    View Account
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-400 py-2">No corporate accounts linked to this contact. Operating as individual client.</p>
              )}
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-lg w-full p-6 space-y-4">
              <h3 className="text-base font-bold text-gray-900">Edit Contact</h3>
              <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">First Name</label>
                    <input
                      type="text"
                      value={editFormData.firstName || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-gray-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Last Name</label>
                    <input
                      type="text"
                      value={editFormData.lastName || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-gray-400"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Email</label>
                    <input
                      type="email"
                      value={editFormData.email || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-gray-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Phone</label>
                    <input
                      type="text"
                      value={editFormData.phone || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-gray-400"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Gender</label>
                    <select
                      value={editFormData.gender || "Female"}
                      onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value as any })}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-gray-400"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      value={editFormData.weightKg || 58}
                      onChange={(e) => setEditFormData({ ...editFormData, weightKg: Number(e.target.value) })}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Role Title</label>
                  <input
                    type="text"
                    value={editFormData.roleTitle || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, roleTitle: e.target.value })}
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

        {/* Add to Trip Modal */}
        {isAddToTripOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full p-6 space-y-4">
              <h3 className="text-base font-bold text-gray-900">Add Passenger to Flight</h3>
              <p className="text-xs text-gray-600">
                Select an upcoming flight to add {displayName} to the passenger manifest:
              </p>
              <select
                value={selectedTripToAdd}
                onChange={(e) => setSelectedTripToAdd(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-gray-400"
              >
                <option value="">Choose an upcoming flight...</option>
                <option value="WS0193-001 (19 Dec · EGLF → DNMM)">WS0193-001 (19 Dec · EGLF → DNMM)</option>
                <option value="MX5521 (24 Nov · LFPB ⇄ DNAA)">MX5521 (24 Nov · LFPB ⇄ DNAA)</option>
                <option value="FE4578-005 (20 Nov · LEIB → LSGG)">FE4578-005 (20 Nov · LEIB → LSGG)</option>
              </select>
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddToTripOpen(false)}
                  className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-medium px-4 py-1.5 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedTripToAdd}
                  onClick={handleConfirmAddToTrip}
                  className="bg-[#111827] text-white hover:bg-gray-800 disabled:opacity-50 text-xs font-semibold px-4 py-1.5 rounded-lg"
                >
                  Add to Manifest
                </button>
              </div>
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
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Contacts</h1>

      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search input + Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search contacts, account, phone, email..."
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
              onClick={() => setFilterPill("authorised")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                filterPill === "authorised"
                  ? "bg-[#111827] text-white shadow-sm"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              Authorised persons {counts.authorised}
            </button>
            <button
              onClick={() => setFilterPill("passengers")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                filterPill === "passengers"
                  ? "bg-[#111827] text-white shadow-sm"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              Passengers {counts.passengers}
            </button>
            <button
              onClick={() => setFilterPill("agents")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                filterPill === "agents"
                  ? "bg-[#111827] text-white shadow-sm"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              Agents {counts.agents}
            </button>
          </div>
        </div>

        {/* Right: Account Dropdown Filter */}
        <div>
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="bg-white border border-gray-200 text-gray-700 rounded-full px-3 py-1 text-xs font-medium focus:outline-none focus:border-gray-400 shadow-sm cursor-pointer"
          >
            <option value="all">Account: all</option>
            {uniqueAccounts.map((acc) => (
              <option key={acc} value={acc}>
                {acc}
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
                  NAME
                </th>
                <th className="py-3.5 px-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider">
                  ACCOUNT & ROLE
                </th>
                <th className="py-3.5 px-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider">
                  CONTACT
                </th>
                <th className="py-3.5 px-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider">
                  GENDER / WEIGHT
                </th>
                <th className="py-3.5 px-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider">
                  DOCUMENTS
                </th>
                <th className="py-3.5 px-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider">
                  UPCOMING TRIPS
                </th>
                <th className="py-3.5 px-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredContacts.map((cnt) => {
                const hasDoc = cnt.hasPassport ?? (!!cnt.passportDetails?.passportNumber && cnt.passportDetails.passportNumber.length > 3);
                const tripsCount = cnt.upcomingTrips?.length || 0;
                const roleDisplay = cnt.roleTitle || (cnt.associatedAccountName ? `Authorised person · ${cnt.associatedAccountName}` : "Guest");

                return (
                  <tr
                    key={cnt.id}
                    onClick={() => handleOpenContact(cnt)}
                    className="hover:bg-gray-50/70 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 text-gray-900 font-semibold whitespace-nowrap">
                      {cnt.firstName} {cnt.lastName}
                    </td>
                    <td className="py-3.5 px-4 text-gray-800 whitespace-nowrap">
                      {roleDisplay}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                      <div>{cnt.email}</div>
                      <div className="text-[11px] text-gray-400">{cnt.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap">
                      {cnt.gender} · {cnt.weightKg} kg
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {hasDoc ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                          Passport ✓
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                          ▲ No travel document
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap">
                      {tripsCount > 0 ? `${tripsCount} trip` : "None"}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenContact(cnt);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredContacts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-gray-400">
                    No contacts found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="py-3.5 px-4 border-t border-gray-100 text-[11px] text-gray-400 leading-relaxed bg-white">
          A person exists only once. Every trip and account links here, so a passport added once updates every trip.
        </div>
      </div>
    </div>
  );
}
