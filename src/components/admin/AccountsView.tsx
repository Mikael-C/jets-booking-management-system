"use client";

import React, { useState, useMemo } from "react";
import { useAviation } from "@/lib/aviationContext";
import { AccountRecord, AuthorizedPerson, BioIdType } from "@/types/aviation";
import { countriesList } from "@/data/countries";
import {
  Users,
  Search,
  Building2,
  User,
  Plus,
  Mail,
  Phone,
  Globe,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  CreditCard,
  Trash2,
  Edit2,
  ExternalLink,
  ShieldCheck,
  Send,
  Sparkles,
  ChevronRight,
  UserCheck
} from "lucide-react";

export default function AccountsView() {
  const { accounts, addAccount, updateAccount, deleteAccount, setActiveNav, currentUser, role } = useAviation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "entity" | "individual" | "agent">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  // Form State
  const [accountType, setAccountType] = useState<"entity" | "individual">("entity");
  const [name, setName] = useState("");
  const [country, setCountry] = useState("Austria");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [vatTaxNumber, setVatTaxNumber] = useState("");
  const [isAgent, setIsAgent] = useState(false);
  const [preferredContactName, setPreferredContactName] = useState("");
  const [preferredContactEmail, setPreferredContactEmail] = useState("");
  const [preferredContactPhone, setPreferredContactPhone] = useState("");
  const [autoCommunicationsEnabled, setAutoCommunicationsEnabled] = useState(true);
  const [vipTier, setVipTier] = useState<"Ultra HNWI" | "Corporate Executive" | "Family Office" | "Private VIP">("Ultra HNWI");
  const [notes, setNotes] = useState("");

  // Authorized Persons List State
  const [authorizedPersons, setAuthorizedPersons] = useState<AuthorizedPerson[]>([
    {
      id: `auth-${Date.now()}`,
      fullName: "",
      roleTitle: "Authorized Signatory",
      isPrimaryAccountName: false,
      email: "",
      phone: "",
      idDocumentType: "passport",
      passportDetails: {
        passportNumber: "",
        issuingCountry: "Austria",
        placeOfBirth: "",
        dateOfBirth: "",
        expirationDate: ""
      }
    }
  ]);

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (filterType === "entity" && acc.accountType !== "entity") return false;
      if (filterType === "individual" && acc.accountType !== "individual") return false;
      if (filterType === "agent" && !acc.isAgent) return false;

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchName = acc.name.toLowerCase().includes(q);
        const matchAccNo = acc.accountNumber.toLowerCase().includes(q);
        const matchEmail = acc.email.toLowerCase().includes(q);
        const matchCountry = acc.country.toLowerCase().includes(q);
        const matchAuth = acc.authorizedPersons.some((p) => p.fullName.toLowerCase().includes(q));
        if (!matchName && !matchAccNo && !matchEmail && !matchCountry && !matchAuth) return false;
      }
      return true;
    });
  }, [accounts, filterType, searchQuery]);

  const resetForm = () => {
    setEditingAccountId(null);
    setAccountType("entity");
    setName("");
    setCountry("Austria");
    setEmail("");
    setPhone("");
    setBillingAddress("");
    setVatTaxNumber("");
    setIsAgent(false);
    setPreferredContactName("");
    setPreferredContactEmail("");
    setPreferredContactPhone("");
    setAutoCommunicationsEnabled(true);
    setVipTier("Ultra HNWI");
    setNotes("");
    setAuthorizedPersons([
      {
        id: `auth-${Date.now()}`,
        fullName: "",
        roleTitle: "Authorized Signatory",
        isPrimaryAccountName: false,
        email: "",
        phone: "",
        idDocumentType: "passport",
        passportDetails: {
          passportNumber: "",
          issuingCountry: "Austria",
          placeOfBirth: "",
          dateOfBirth: "",
          expirationDate: ""
        }
      }
    ]);
    setValidationErrors([]);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (acc: AccountRecord) => {
    setEditingAccountId(acc.id);
    setAccountType(acc.accountType);
    setName(acc.name);
    setCountry(acc.country);
    setEmail(acc.email);
    setPhone(acc.phone);
    setBillingAddress(acc.billingAddress);
    setVatTaxNumber(acc.vatTaxNumber || "");
    setIsAgent(!!acc.isAgent);
    setPreferredContactName(acc.preferredContactName || "");
    setPreferredContactEmail(acc.preferredContactEmail || "");
    setPreferredContactPhone(acc.preferredContactPhone || "");
    setAutoCommunicationsEnabled(acc.autoCommunicationsEnabled ?? true);
    setVipTier(acc.vipTier || "Ultra HNWI");
    setNotes(acc.notes || "");
    setAuthorizedPersons(
      acc.authorizedPersons && acc.authorizedPersons.length > 0
        ? acc.authorizedPersons
        : [
            {
              id: `auth-${Date.now()}`,
              fullName: acc.name,
              roleTitle: "Primary Signatory",
              isPrimaryAccountName: true,
              email: acc.email,
              phone: acc.phone,
              idDocumentType: "passport"
            }
          ]
    );
    setValidationErrors([]);
    setIsModalOpen(true);
  };

  // Add person row
  const handleAddPerson = () => {
    setAuthorizedPersons((prev) => [
      ...prev,
      {
        id: `auth-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        fullName: "",
        roleTitle: "Authorized Representative",
        isPrimaryAccountName: false,
        email: "",
        phone: "",
        idDocumentType: "passport",
        passportDetails: {
          passportNumber: "",
          issuingCountry: country,
          placeOfBirth: "",
          dateOfBirth: "",
          expirationDate: ""
        }
      }
    ]);
  };

  // Remove person row
  const handleRemovePerson = (id: string) => {
    if (authorizedPersons.length <= 1) return;
    setAuthorizedPersons((prev) => prev.filter((p) => p.id !== id));
  };

  // Update person field
  const handleUpdatePerson = (id: string, updates: Partial<AuthorizedPerson>) => {
    setAuthorizedPersons((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, ...updates };

        // If bio id type changed, initialize respective object if empty
        if (updates.idDocumentType && updates.idDocumentType !== p.idDocumentType) {
          if (updates.idDocumentType === "passport" && !updated.passportDetails) {
            updated.passportDetails = {
              passportNumber: "",
              issuingCountry: country,
              placeOfBirth: "",
              dateOfBirth: "",
              expirationDate: ""
            };
          } else if (updates.idDocumentType === "id" && !updated.idDetails) {
            updated.idDetails = {
              idNumber: "",
              issuingState: country,
              dateOfBirth: "",
              expirationDate: ""
            };
          } else if (updates.idDocumentType === "visa" && !updated.visaDetails) {
            updated.visaDetails = {
              visaNumber: "",
              visaCategory: "B1/B2 Executive",
              issuingCountry: country,
              validFrom: "",
              validUntil: "",
              entryType: "multiple"
            };
          }
        }

        return updated;
      })
    );
  };

  // Option: Use authorized person's name as account name
  const handleSetAuthorizedNameAsAccountName = (authName: string) => {
    if (authName.trim()) {
      setName(authName.trim());
    }
  };

  // Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    if (!name.trim()) errors.push("Account Name is required.");
    if (!email.trim() || !email.includes("@")) errors.push("Valid Email Address is required.");
    if (!phone.trim()) errors.push("Telephone Number is required.");
    if (!country.trim()) errors.push("Country must be selected.");

    // Validate authorized persons
    authorizedPersons.forEach((person, idx) => {
      if (!person.fullName.trim()) {
        errors.push(`Authorized Person #${idx + 1}: Legal Full Name is required.`);
      }
      if (person.idDocumentType === "passport") {
        if (!person.passportDetails?.passportNumber?.trim()) {
          errors.push(`Authorized Person #${idx + 1}: Passport Number is required.`);
        }
        if (!person.passportDetails?.expirationDate?.trim()) {
          errors.push(`Authorized Person #${idx + 1}: Passport Expiration Date is required.`);
        }
      } else if (person.idDocumentType === "id") {
        if (!person.idDetails?.idNumber?.trim()) {
          errors.push(`Authorized Person #${idx + 1}: National ID Number is required.`);
        }
        if (!person.idDetails?.expirationDate?.trim()) {
          errors.push(`Authorized Person #${idx + 1}: ID Expiration Date is required.`);
        }
      } else if (person.idDocumentType === "visa") {
        if (!person.visaDetails?.visaNumber?.trim()) {
          errors.push(`Authorized Person #${idx + 1}: Visa Document Number is required.`);
        }
        if (!person.visaDetails?.validUntil?.trim()) {
          errors.push(`Authorized Person #${idx + 1}: Visa Expiration Date is required.`);
        }
      }
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (editingAccountId) {
      updateAccount(editingAccountId, {
        accountType,
        name,
        country,
        email,
        phone,
        billingAddress,
        vatTaxNumber,
        isAgent,
        preferredContactName: preferredContactName || authorizedPersons[0]?.fullName || name,
        preferredContactEmail: preferredContactEmail || email,
        preferredContactPhone: preferredContactPhone || phone,
        autoCommunicationsEnabled,
        vipTier,
        notes,
        authorizedPersons
      });
    } else {
      const newAcc: AccountRecord = {
        id: `acc-${Date.now()}`,
        accountNumber: `ACC-${Math.floor(10000 + Math.random() * 89999)}`,
        accountType,
        name,
        country,
        email,
        phone,
        billingAddress: billingAddress || `${country}`,
        vatTaxNumber,
        isAgent,
        preferredContactName: preferredContactName || authorizedPersons[0]?.fullName || name,
        preferredContactEmail: preferredContactEmail || email,
        preferredContactPhone: preferredContactPhone || phone,
        autoCommunicationsEnabled,
        authorizedPersons,
        vipTier,
        notes,
        totalBookings: 0,
        totalSpend: 0,
        createdAt: new Date().toISOString().split("T")[0]
      };
      addAccount(newAcc);
    }

    setIsModalOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-[#0F1420] text-white rounded-2xl p-6 sm:p-8 border border-[#1C2436] shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/20 text-[#C9A052] border border-[#C9A052]/40 uppercase flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              CENTRAL ACCOUNT REGISTRY
            </span>
            <span className="text-gray-400 text-xs font-mono">• {accounts.length} Registered Accounts</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Accounts Directory
          </h1>
          <p className="text-xs text-gray-300 leading-relaxed">
            Manage institutional entities, corporate clients, family offices, and individual accounts. Configure authorized signatories with passport/visa/ID credentials, automatic communications preferred contacts, and designated broker agent flags.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Account</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search accounts by name, account number, email, or authorized person..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E0DAD0] bg-[#F5F2EC] text-xs text-[#0F1420] font-medium placeholder-gray-400 focus:outline-none focus:border-[#C9A052] focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === "all" ? "bg-[#0F1420] text-white" : "bg-[#F5F2EC] text-gray-700 hover:bg-[#EBE5DB]"
            }`}
          >
            All ({accounts.length})
          </button>
          <button
            onClick={() => setFilterType("entity")}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === "entity" ? "bg-[#0F1420] text-white" : "bg-[#F5F2EC] text-gray-700 hover:bg-[#EBE5DB]"
            }`}
          >
            Entities ({accounts.filter((a) => a.accountType === "entity").length})
          </button>
          <button
            onClick={() => setFilterType("individual")}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === "individual" ? "bg-[#0F1420] text-white" : "bg-[#F5F2EC] text-gray-700 hover:bg-[#EBE5DB]"
            }`}
          >
            Individuals ({accounts.filter((a) => a.accountType === "individual").length})
          </button>
          <button
            onClick={() => setFilterType("agent")}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === "agent" ? "bg-[#C9A052] text-[#0F1420]" : "bg-[#F5F2EC] text-gray-700 hover:bg-[#EBE5DB]"
            }`}
          >
            Brokers/Agents ({accounts.filter((a) => a.isAgent).length})
          </button>
        </div>
      </div>

      {/* Accounts List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredAccounts.map((account) => (
          <div
            key={account.id}
            className="bg-white border border-[#E0DAD0] hover:border-[#C9A052] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              {/* Header: Name, Badges, Account Number */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#0F1420] text-[#C9A052]">
                      {account.accountNumber}
                    </span>
                    <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-[#F5F2EC] text-gray-700 border border-[#E0DAD0]">
                      {account.accountType === "entity" ? "Corporate Entity" : "Individual Principal"}
                    </span>
                    {account.isAgent && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#C9A052]/20 text-[#9A7A35] border border-[#C9A052]/40">
                        Designated Agent
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-[#0F1420] group-hover:text-[#C9A052] transition-colors">
                    {account.name}
                  </h3>
                  <p className="text-xs text-gray-600 flex items-center gap-1.5 mt-0.5">
                    <Globe className="w-3.5 h-3.5 text-gray-400" />
                    <span>{account.country}</span>
                    {account.billingAddress && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="truncate text-gray-500">{account.billingAddress}</span>
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(account)}
                    className="p-2 rounded-xl text-gray-400 hover:text-[#0F1420] hover:bg-[#F5F2EC] transition-colors"
                    title="Edit Account"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteAccount(account.id)}
                    className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete Account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Contact info row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-[#F5F2EC] text-gray-800 flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-[#C9A052] flex-shrink-0" />
                  <span className="truncate">{account.email}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F5F2EC] text-gray-800 flex items-center gap-2 truncate">
                  <Phone className="w-3.5 h-3.5 text-[#C9A052] flex-shrink-0" />
                  <span className="truncate">{account.phone}</span>
                </div>
              </div>

              {/* Preferred Contact for Automatic Communications */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <Send className="w-3 h-3 text-[#C9A052]" /> Preferred Contact for Automatic Comms
                  </span>
                  {account.autoCommunicationsEnabled && (
                    <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                      Auto-Comms Active
                    </span>
                  )}
                </div>
                <p className="font-bold text-[#0F1420]">
                  {account.preferredContactName || account.name}
                </p>
                <p className="text-[11px] text-gray-600 font-mono">
                  {account.preferredContactEmail || account.email} • {account.preferredContactPhone || account.phone}
                </p>
              </div>

              {/* Authorized Persons Section */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500">
                    Authorized Persons & Signatories ({account.authorizedPersons?.length || 0})
                  </span>
                </div>

                <div className="space-y-1.5">
                  {(account.authorizedPersons || []).map((person) => (
                    <div
                      key={person.id}
                      className="p-2.5 rounded-xl border border-gray-200 bg-white hover:border-[#C9A052] transition-colors flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-[#0F1420] flex items-center gap-2">
                          <span>{person.fullName}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-100 text-gray-600">
                            {person.roleTitle || "Signatory"}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                          ID: <strong className="text-[#0F1420] uppercase">{person.idDocumentType}</strong> (
                          {person.idDocumentType === "passport"
                            ? person.passportDetails?.passportNumber || "Document verified"
                            : person.idDocumentType === "id"
                            ? person.idDetails?.idNumber || "Verified"
                            : person.visaDetails?.visaNumber || "Verified"}
                          ) • Exp: {person.passportDetails?.expirationDate || person.idDetails?.expirationDate || person.visaDetails?.validUntil || "On file"}
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Authorized
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card Footer: Quick Actions */}
            <div className="pt-3 border-t border-[#E0DAD0] flex items-center justify-between text-xs">
              <span className="text-[11px] font-mono text-gray-500">
                Created {account.createdAt} • {account.totalBookings || 0} Bookings
              </span>
              <button
                onClick={() => handleOpenEditModal(account)}
                className="text-xs font-bold text-[#C9A052] hover:text-[#0F1420] flex items-center gap-1 transition-colors"
              >
                <span>Edit Account & Bio</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredAccounts.length === 0 && (
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-12 text-center space-y-3">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-[#0F1420]">No accounts found matching filter</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Try adjusting your search query or click below to create a new account.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-[#0F1420] text-white text-xs font-bold"
          >
            + Create New Account
          </button>
        </div>
      )}

      {/* Create / Edit Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#D1C9BC] overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 bg-[#0F1420] text-white flex items-start justify-between border-b border-[#1C2436]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A052] font-bold">
                  {editingAccountId ? "EDIT ACCOUNT RECORD" : "CREATE NEW ACCOUNT RECORD"}
                </span>
                <h2 className="text-xl font-black text-white">
                  {editingAccountId ? "Update Institutional or Individual Account" : "Add New Account to Registry"}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#1C2436] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Validation Warning Alert */}
              {validationErrors.length > 0 && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-red-900 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-red-800">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span>Important fields are missing or require correction:</span>
                  </div>
                  <ul className="list-disc list-inside text-xs text-red-700 pl-1 space-y-0.5">
                    {validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* SECTION 1: Account Classification & Primary Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#0F1420] border-b pb-1">
                  1. Account Classification & Identity
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Account Type */}
                  <div>
                    <label className="block text-xs font-bold text-[#0F1420] mb-1">
                      Account Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAccountType("entity")}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          accountType === "entity"
                            ? "bg-[#0F1420] text-white border-[#0F1420]"
                            : "bg-[#F5F2EC] text-gray-700 border-[#E0DAD0]"
                        }`}
                      >
                        Corporate / Entity
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountType("individual")}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          accountType === "individual"
                            ? "bg-[#0F1420] text-white border-[#0F1420]"
                            : "bg-[#F5F2EC] text-gray-700 border-[#E0DAD0]"
                        }`}
                      >
                        Individual Principal
                      </button>
                    </div>
                  </div>

                  {/* Country Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-[#0F1420] mb-1">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] font-semibold focus:outline-none focus:border-[#C9A052]"
                    >
                      {countriesList.map((c) => (
                        <option key={c.code} value={c.name}>
                          {c.name} ({c.dialCode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Account Name */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#0F1420]">
                      Account Name {accountType === "entity" ? "(Company / Foundation Name)" : "(Individual Legal Name)"} <span className="text-red-500">*</span>
                    </label>
                    {authorizedPersons[0]?.fullName && (
                      <button
                        type="button"
                        onClick={() => handleSetAuthorizedNameAsAccountName(authorizedPersons[0].fullName)}
                        className="text-[11px] font-bold text-[#C9A052] hover:underline"
                      >
                        Use Authorized Name as Account Name
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={accountType === "entity" ? "e.g. Brinkmann Global Capital SAM" : "e.g. Edward Brinkmann"}
                    className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
                  />
                </div>

                {/* Email, Phone & VAT */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0F1420] mb-1">
                      Primary Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="account@domain.com"
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0F1420] mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+43 1 512 8901"
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0F1420] mb-1">
                      Tax / VAT ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={vatTaxNumber}
                      onChange={(e) => setVatTaxNumber(e.target.value)}
                      placeholder="e.g. ATU 9948 2104"
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                </div>

                {/* Billing Address */}
                <div>
                  <label className="block text-xs font-bold text-[#0F1420] mb-1">
                    Registered Billing Address
                  </label>
                  <input
                    type="text"
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    placeholder="Street, City, Postal Code"
                    className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
                  />
                </div>

                {/* Is Agent Checkbox */}
                <div className="p-3.5 rounded-xl bg-[#F5F2EC] border border-[#E0DAD0] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-[#0F1420] block">
                      Account is a Charter Broker / Agent
                    </span>
                    <p className="text-[11px] text-gray-500">
                      When ticked, this account automatically appears in the dedicated <strong>Agents</strong> directory.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isAgent}
                    onChange={(e) => setIsAgent(e.target.checked)}
                    className="h-5 w-5 text-[#C9A052] rounded border-gray-300 focus:ring-[#C9A052]"
                  />
                </div>
              </div>

              {/* SECTION 2: Preferred Contact for Automatic Communications */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b pb-1">
                  <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#0F1420]">
                    2. Automatic Communications & Preferred Contact
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                    <input
                      type="checkbox"
                      checked={autoCommunicationsEnabled}
                      onChange={(e) => setAutoCommunicationsEnabled(e.target.checked)}
                      className="h-4 w-4 text-[#C9A052] rounded border-gray-300"
                    />
                    <span className="font-semibold text-[11px]">Enable Automated Flight Briefs & Invoicing</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0F1420] mb-1">
                      Preferred Contact Name
                    </label>
                    <input
                      type="text"
                      value={preferredContactName}
                      onChange={(e) => setPreferredContactName(e.target.value)}
                      placeholder="e.g. Klara Van Der Beek"
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0F1420] mb-1">
                      Dispatch Comms Email
                    </label>
                    <input
                      type="email"
                      value={preferredContactEmail}
                      onChange={(e) => setPreferredContactEmail(e.target.value)}
                      placeholder="ops@client.com"
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0F1420] mb-1">
                      24/7 Mobile Phone
                    </label>
                    <input
                      type="tel"
                      value={preferredContactPhone}
                      onChange={(e) => setPreferredContactPhone(e.target.value)}
                      placeholder="+43 664 123456"
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Authorized Persons & Identification (Adaptive Bio Fields) */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b pb-1">
                  <div>
                    <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#0F1420]">
                      3. Authorized Signatories & Identification Credentials
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Select bio identification type (Passport, ID, or Visa) to adapt the document fields dynamically.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPerson}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F1420] text-[#C9A052] font-bold text-xs hover:bg-[#1C2436] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Signatory</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {authorizedPersons.map((person, index) => (
                    <div
                      key={person.id}
                      className="p-4 rounded-xl border border-[#E0DAD0] bg-[#FDFCFA] shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-[#0F1420] flex items-center gap-2">
                          <span className="h-5 w-5 rounded-full bg-[#C9A052] text-[#0F1420] text-[10px] font-black flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span>Authorized Signatory #{index + 1}</span>
                        </span>

                        <div className="flex items-center gap-2">
                          {authorizedPersons.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePerson(person.id)}
                              className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 font-bold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Name, Role & ID Type Selector */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-[#0F1420] mb-1">
                            Legal Full Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={person.fullName}
                            onChange={(e) => handleUpdatePerson(person.id, { fullName: e.target.value })}
                            placeholder="Full Name as on Passport"
                            className="w-full bg-white border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#0F1420] mb-1">
                            Role / Title
                          </label>
                          <input
                            type="text"
                            value={person.roleTitle || ""}
                            onChange={(e) => handleUpdatePerson(person.id, { roleTitle: e.target.value })}
                            placeholder="Managing Director / Signatory"
                            className="w-full bg-white border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
                          />
                        </div>

                        {/* Means of Bio Filling Choice */}
                        <div>
                          <label className="block text-[11px] font-bold text-[#0F1420] mb-1">
                            Identification Type <span className="text-red-500">*</span>
                          </label>
                          <div className="grid grid-cols-3 gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdatePerson(person.id, { idDocumentType: "passport" })}
                              className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                                person.idDocumentType === "passport"
                                  ? "bg-[#0F1420] text-[#C9A052] border-[#0F1420]"
                                  : "bg-white text-gray-700 border-gray-300"
                              }`}
                            >
                              Passport
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdatePerson(person.id, { idDocumentType: "id" })}
                              className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                                person.idDocumentType === "id"
                                  ? "bg-[#0F1420] text-[#C9A052] border-[#0F1420]"
                                  : "bg-white text-gray-700 border-gray-300"
                              }`}
                            >
                              ID Card
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdatePerson(person.id, { idDocumentType: "visa" })}
                              className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                                person.idDocumentType === "visa"
                                  ? "bg-[#0F1420] text-[#C9A052] border-[#0F1420]"
                                  : "bg-white text-gray-700 border-gray-300"
                              }`}
                            >
                              Visa
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Adaptive Bio Details: Form adapts dynamically to choice */}
                      {person.idDocumentType === "passport" && (
                        <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-blue-900 mb-1">
                              Passport Number <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={person.passportDetails?.passportNumber || ""}
                              onChange={(e) =>
                                handleUpdatePerson(person.id, {
                                  passportDetails: {
                                    ...person.passportDetails!,
                                    passportNumber: e.target.value
                                  }
                                })
                              }
                              placeholder="e.g. P-84920194"
                              className="w-full bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 font-mono text-xs focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase text-blue-900 mb-1">
                              Issuing Country
                            </label>
                            <input
                              type="text"
                              value={person.passportDetails?.issuingCountry || country}
                              onChange={(e) =>
                                handleUpdatePerson(person.id, {
                                  passportDetails: {
                                    ...person.passportDetails!,
                                    issuingCountry: e.target.value
                                  }
                                })
                              }
                              placeholder="Austria"
                              className="w-full bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase text-blue-900 mb-1">
                              Place of Birth
                            </label>
                            <input
                              type="text"
                              value={person.passportDetails?.placeOfBirth || ""}
                              onChange={(e) =>
                                handleUpdatePerson(person.id, {
                                  passportDetails: {
                                    ...person.passportDetails!,
                                    placeOfBirth: e.target.value
                                  }
                                })
                              }
                              placeholder="City, Country"
                              className="w-full bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase text-blue-900 mb-1">
                              Expiration Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              value={person.passportDetails?.expirationDate || ""}
                              onChange={(e) =>
                                handleUpdatePerson(person.id, {
                                  passportDetails: {
                                    ...person.passportDetails!,
                                    expirationDate: e.target.value
                                  }
                                })
                              }
                              className="w-full bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                      )}

                      {person.idDocumentType === "id" && (
                        <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-emerald-900 mb-1">
                              National ID Number <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={person.idDetails?.idNumber || ""}
                              onChange={(e) =>
                                handleUpdatePerson(person.id, {
                                  idDetails: {
                                    ...person.idDetails!,
                                    idNumber: e.target.value
                                  }
                                })
                              }
                              placeholder="ID Card No."
                              className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 font-mono text-xs focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase text-emerald-900 mb-1">
                              Issuing State / Authority
                            </label>
                            <input
                              type="text"
                              value={person.idDetails?.issuingState || country}
                              onChange={(e) =>
                                handleUpdatePerson(person.id, {
                                  idDetails: {
                                    ...person.idDetails!,
                                    issuingState: e.target.value
                                  }
                                })
                              }
                              placeholder="e.g. Austria"
                              className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase text-emerald-900 mb-1">
                              Expiration Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              value={person.idDetails?.expirationDate || ""}
                              onChange={(e) =>
                                handleUpdatePerson(person.id, {
                                  idDetails: {
                                    ...person.idDetails!,
                                    expirationDate: e.target.value
                                  }
                                })
                              }
                              className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      )}

                      {person.idDocumentType === "visa" && (
                        <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-purple-900 mb-1">
                              Visa Number <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={person.visaDetails?.visaNumber || ""}
                              onChange={(e) =>
                                handleUpdatePerson(person.id, {
                                  visaDetails: {
                                    ...person.visaDetails!,
                                    visaNumber: e.target.value
                                  }
                                })
                              }
                              placeholder="e.g. V-8492019"
                              className="w-full bg-white border border-purple-300 rounded-lg px-2.5 py-1.5 font-mono text-xs focus:outline-none focus:border-purple-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase text-purple-900 mb-1">
                              Visa Category
                            </label>
                            <input
                              type="text"
                              value={person.visaDetails?.visaCategory || "Schengen C / Business"}
                              onChange={(e) =>
                                handleUpdatePerson(person.id, {
                                  visaDetails: {
                                    ...person.visaDetails!,
                                    visaCategory: e.target.value
                                  }
                                })
                              }
                              placeholder="Business / Tourist"
                              className="w-full bg-white border border-purple-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-purple-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase text-purple-900 mb-1">
                              Issuing Country
                            </label>
                            <input
                              type="text"
                              value={person.visaDetails?.issuingCountry || country}
                              onChange={(e) =>
                                handleUpdatePerson(person.id, {
                                  visaDetails: {
                                    ...person.visaDetails!,
                                    issuingCountry: e.target.value
                                  }
                                })
                              }
                              placeholder="e.g. France"
                              className="w-full bg-white border border-purple-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-purple-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase text-purple-900 mb-1">
                              Valid Until <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              value={person.visaDetails?.validUntil || ""}
                              onChange={(e) =>
                                handleUpdatePerson(person.id, {
                                  visaDetails: {
                                    ...person.visaDetails!,
                                    validUntil: e.target.value
                                  }
                                })
                              }
                              className="w-full bg-white border border-purple-300 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-purple-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-[#E0DAD0] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#0F1420] hover:bg-[#1C2436] text-[#C9A052] font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
                >
                  {editingAccountId ? "Save Account Changes" : "Create Account Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
