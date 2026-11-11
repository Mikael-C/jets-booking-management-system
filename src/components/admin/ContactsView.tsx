"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAviation } from "@/lib/aviationContext";
import { Booking, ContactRecord, PetRecord, BioIdType } from "@/types/aviation";
import { api } from "@/lib/api";
import { countriesList } from "@/data/countries";
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  Globe,
  MapPin,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  FileText,
  Dog,
  ShieldCheck,
  ChevronRight,
  Scale,
  UserCheck,
  Eye,
  Plane,
  Clock,
  Compass
} from "lucide-react";

function getContactTripRole(booking: Booking, contact: ContactRecord): string {
  const normalize = (value?: string) => (value || "").trim().toLowerCase();
  const name = normalize(contact.fullName || [
    contact.prefix,
    contact.firstName,
    contact.middleName1,
    contact.middleName2,
    contact.lastName1,
    contact.lastName2 || contact.lastName,
    contact.suffix
  ].filter(Boolean).join(" "));
  if (name && normalize(booking.contractSignedBy) === name) return "Signatory";

  const passport = normalize(contact.passportDetails?.passportNumber);
  const isLeadPassenger = booking.legs.some((leg) =>
    leg.passengers.some((passenger) => {
      const matchesContact = (passport && normalize(passenger.passportNumber) === passport) ||
        normalize(passenger.fullName) === name;
      return matchesContact && passenger.isLeadPassenger;
    })
  );
  return isLeadPassenger ? "Lead Pax" : "Guest";
}

export default function ContactsView() {
  const { contacts, addContact, updateContact, deleteContact, accounts, role, getTripHistoryForContact, openDocument } = useAviation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [viewingContact, setViewingContact] = useState<ContactRecord | null>(null);
  const [contactTripHistory, setContactTripHistory] = useState<Booking[] | null>(null);

  useEffect(() => {
    if (!viewingContact) {
      setContactTripHistory(null);
      return;
    }

    let active = true;
    const contactId = viewingContact.id;
    setContactTripHistory(null);
    api.contacts.getTrips(contactId)
      .then(({ data }) => {
        if (active) setContactTripHistory(data);
      })
      .catch((error) => {
        console.warn("Unable to load contact flight history; showing locally available trips.", error);
        if (active) setContactTripHistory(getTripHistoryForContact(contactId));
      });

    return () => {
      active = false;
    };
  }, [viewingContact?.id]);

  const tripHistory = contactTripHistory ??
    (viewingContact ? getTripHistoryForContact(viewingContact.id) : []);

  // Form State - Multi-part Name
  const [prefix, setPrefix] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName1, setMiddleName1] = useState("");
  const [middleName2, setMiddleName2] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName1, setLastName1] = useState("");
  const [lastName2, setLastName2] = useState("");
  const [lastName, setLastName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [title, setTitle] = useState("");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Austria");
  const [gender, setGender] = useState<"Male" | "Female" | "Other">("Male");
  const [weightKg, setWeightKg] = useState<number>(75);
  const [associatedAccountId, setAssociatedAccountId] = useState<string>("");
  const [isAgent, setIsAgent] = useState(false);
  const [notes, setNotes] = useState("");

  // Bio ID details state
  const [bioIdType, setBioIdType] = useState<BioIdType>("passport");
  const [documentNumber, setDocumentNumber] = useState("");
  const [issuingCountry, setIssuingCountry] = useState("Austria");
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [visaCategory, setVisaCategory] = useState("B1/B2 Executive");
  const [visaValidUntil, setVisaValidUntil] = useState("");

  // Pets state
  const [pets, setPets] = useState<PetRecord[]>([]);

  // Validation
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Alphabetical list of alphabet letters
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // Alphabetically sorted contacts
  const sortedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => {
      const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
      const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [contacts]);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return sortedContacts.filter((c) => {
      // Alphabetical jump filter
      if (selectedLetter !== "all") {
        const firstLetter = (c.lastName || c.firstName).charAt(0).toUpperCase();
        if (firstLetter !== selectedLetter) return false;
      }

      // Search query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchName = `${c.firstName} ${c.middleName || ""} ${c.lastName}`.toLowerCase().includes(q);
        const matchEmail = c.email.toLowerCase().includes(q);
        const matchPhone = c.phone.toLowerCase().includes(q);
        const matchAccount = (c.associatedAccountName || "").toLowerCase().includes(q);
        const matchCountry = c.country.toLowerCase().includes(q);
        const matchPassport = (c.passportDetails?.passportNumber || "").toLowerCase().includes(q);
        const matchId = (c.idDetails?.idNumber || "").toLowerCase().includes(q);
        const matchPet = (c.pets || []).some((p) => p.petName.toLowerCase().includes(q) || p.breed.toLowerCase().includes(q));
        if (!matchName && !matchEmail && !matchPhone && !matchAccount && !matchCountry && !matchPassport && !matchId && !matchPet) {
          return false;
        }
      }

      return true;
    });
  }, [sortedContacts, selectedLetter, searchQuery]);

  const resetForm = () => {
    setEditingContactId(null);
    setPrefix("");
    setFirstName("");
    setMiddleName1("");
    setMiddleName2("");
    setMiddleName("");
    setLastName1("");
    setLastName2("");
    setLastName("");
    setSuffix("");
    setTitle("");
    setEmail("");
    setPhone("");
    setCountry("Austria");
    setGender("Male");
    setWeightKg(75);
    setAssociatedAccountId("");
    setIsAgent(false);
    setNotes("");

    setBioIdType("passport");
    setDocumentNumber("");
    setIssuingCountry("Austria");
    setPlaceOfBirth("");
    setDateOfBirth("");
    setExpirationDate("");
    setVisaCategory("B1/B2 Executive");
    setVisaValidUntil("");

    setPets([]);
    setValidationErrors([]);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: ContactRecord) => {
    setEditingContactId(c.id);
    setPrefix(c.prefix || "");
    setFirstName(c.firstName);
    setMiddleName1(c.middleName1 || "");
    setMiddleName2(c.middleName2 || "");
    setMiddleName(c.middleName || "");
    setLastName1(c.lastName1 || "");
    setLastName2(c.lastName2 || "");
    setLastName(c.lastName);
    setSuffix(c.suffix || "");
    setTitle(c.title || "");
    setEmail(c.email);
    setPhone(c.phone);
    setCountry(c.country);
    setGender(c.gender);
    setWeightKg(c.weightKg || 75);
    setAssociatedAccountId(c.associatedAccountId || "");
    setIsAgent(!!c.isAgent);
    setNotes(c.notes || "");

    setBioIdType(c.bioIdType || "passport");
    if (c.bioIdType === "passport") {
      setDocumentNumber(c.passportDetails?.passportNumber || "");
      setIssuingCountry(c.passportDetails?.issuingCountry || c.country);
      setPlaceOfBirth(c.passportDetails?.placeOfBirth || "");
      setDateOfBirth(c.passportDetails?.dateOfBirth || "");
      setExpirationDate(c.passportDetails?.expirationDate || "");
    } else if (c.bioIdType === "id") {
      setDocumentNumber(c.idDetails?.idNumber || "");
      setIssuingCountry(c.idDetails?.issuingState || c.country);
      setDateOfBirth(c.idDetails?.dateOfBirth || "");
      setExpirationDate(c.idDetails?.expirationDate || "");
    } else if (c.bioIdType === "visa") {
      setDocumentNumber(c.visaDetails?.visaNumber || "");
      setIssuingCountry(c.visaDetails?.issuingCountry || c.country);
      setVisaCategory(c.visaDetails?.visaCategory || "B1/B2 Executive");
      setVisaValidUntil(c.visaDetails?.validUntil || "");
    }

    setPets(c.pets || []);
    setValidationErrors([]);
    setIsModalOpen(true);
  };

  // Add Pet
  const handleAddPet = () => {
    setPets((prev) => [
      ...prev,
      {
        id: `pet-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        petType: "Dog",
        petName: "",
        breed: "",
        weightKg: 5,
        microchipNumber: "",
        passportCertificateNumber: "",
        vaccinationExpiry: "",
        specialCareNotes: ""
      }
    ]);
  };

  // Remove Pet
  const handleRemovePet = (id: string) => {
    setPets((prev) => prev.filter((p) => p.id !== id));
  };

  // Update Pet
  const handleUpdatePet = (id: string, updates: Partial<PetRecord>) => {
    setPets((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  // Form Submit with Validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    if (!firstName.trim()) errors.push("First Name is required.");
    const effectiveLastName = lastName1.trim() || lastName.trim();
    if (!effectiveLastName) errors.push("Last Name is required.");
    if (!email.trim() || !email.includes("@")) errors.push("Valid Email is required.");
    if (!phone.trim()) errors.push("Telephone Number is required.");
    if (!country.trim()) errors.push("Country must be selected.");
    if (!weightKg || weightKg <= 0) errors.push("Passenger Weight (kg) is required for weight & balance calculations.");
    if (!documentNumber.trim()) errors.push(`Identification Document Number (${bioIdType.toUpperCase()}) is required.`);
    if (bioIdType !== "visa" && !expirationDate.trim()) errors.push("Document Expiration Date is required.");
    if (bioIdType === "visa" && !visaValidUntil.trim()) errors.push("Visa Expiration Date is required.");

    // Validate pets if any
    pets.forEach((pet, idx) => {
      if (!pet.petName.trim()) errors.push(`Pet #${idx + 1}: Pet Name is required.`);
      if (!pet.breed.trim()) errors.push(`Pet #${idx + 1}: Breed is required.`);
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    const selectedAccount = accounts.find((a) => a.id === associatedAccountId);
    const combinedLastName = lastName1.trim()
      ? [lastName1.trim(), lastName2.trim()].filter(Boolean).join(" ")
      : lastName.trim();
    const combinedMiddleName = [middleName1.trim(), middleName2.trim()].filter(Boolean).join(" ") || middleName.trim() || undefined;

    const contactPayload: Partial<ContactRecord> = {
      prefix: prefix.trim() || undefined,
      firstName: firstName.trim(),
      middleName1: middleName1.trim() || undefined,
      middleName2: middleName2.trim() || undefined,
      middleName: combinedMiddleName,
      lastName1: lastName1.trim() || undefined,
      lastName2: lastName2.trim() || undefined,
      lastName: combinedLastName,
      suffix: suffix.trim() || undefined,
      title: title.trim() || undefined,
      email,
      phone,
      country,
      gender,
      weightKg: Number(weightKg),
      associatedAccountId: associatedAccountId || undefined,
      associatedAccountName: selectedAccount?.name || undefined,
      isAgent,
      bioIdType,
      notes,
      pets
    };

    if (bioIdType === "passport") {
      contactPayload.passportDetails = {
        passportNumber: documentNumber,
        issuingCountry,
        placeOfBirth,
        dateOfBirth,
        expirationDate
      };
    } else if (bioIdType === "id") {
      contactPayload.idDetails = {
        idNumber: documentNumber,
        issuingState: issuingCountry,
        dateOfBirth,
        expirationDate
      };
    } else if (bioIdType === "visa") {
      contactPayload.visaDetails = {
        visaNumber: documentNumber,
        visaCategory,
        issuingCountry,
        validFrom: new Date().toISOString().split("T")[0],
        validUntil: visaValidUntil,
        entryType: "multiple"
      };
    }

    if (editingContactId) {
      updateContact(editingContactId, contactPayload);
    } else {
      addContact({
        id: `cnt-${Date.now()}`,
        ...contactPayload,
        createdAt: new Date().toISOString().split("T")[0]
      } as ContactRecord);
    }

    setIsModalOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-[#0F1420] text-white rounded-2xl p-6 sm:p-8 border border-[#1C2436] shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/20 text-[#C9A052] border border-[#C9A052]/40 uppercase flex items-center gap-1">
              <Users className="w-3 h-3" />
              ALPHABETICAL PASSENGER & CONTACT ROSTER
            </span>
            <span className="text-gray-400 text-xs font-mono">• {contacts.length} Registered Contacts</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Contacts & Passenger Directory
          </h1>
          <p className="text-xs text-gray-300 leading-relaxed">
            Alphabetical directory of lead passengers, authorized signatories, and broker representatives. Complete with first, middle, and last names, passport/visa/ID credentials, passenger weights, genders, pet details, and direct agent designations.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Contact</span>
        </button>
      </div>

      {/* Alphabetical A-Z Jump Bar */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-3 shadow-sm flex items-center justify-between overflow-x-auto gap-1">
        <button
          onClick={() => setSelectedLetter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex-shrink-0 ${
            selectedLetter === "all"
              ? "bg-[#0F1420] text-[#C9A052]"
              : "text-gray-600 hover:bg-[#F5F2EC]"
          }`}
        >
          ALL ({contacts.length})
        </button>
        {alphabet.map((letter) => {
          const count = contacts.filter((c) => (c.lastName || c.firstName).toUpperCase().startsWith(letter)).length;
          return (
            <button
              key={letter}
              onClick={() => setSelectedLetter(letter)}
              className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center flex-shrink-0 ${
                selectedLetter === letter
                  ? "bg-[#C9A052] text-[#0F1420] shadow-sm font-black"
                  : count > 0
                  ? "text-[#0F1420] hover:bg-[#F5F2EC] hover:text-[#C9A052]"
                  : "text-gray-300 cursor-default"
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-4 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts alphabetically by first name, middle name, last name, passport, or associated account..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E0DAD0] bg-[#F5F2EC] text-xs text-[#0F1420] font-medium placeholder-gray-400 focus:outline-none focus:border-[#C9A052] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex flex-col gap-3">
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            className="bg-white border border-[#E0DAD0] hover:border-[#C9A052] rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group min-w-0 relative overflow-hidden"
          >
            <div className="space-y-3 min-w-0">
              {/* Header: Name Badge & Action Buttons */}
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#0F1420] text-white truncate max-w-full">
                    {contact.lastName.toUpperCase()}, {contact.firstName}
                  </span>
                  {contact.isAgent && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#C9A052]/20 text-[#9A7A35] border border-[#C9A052]/40 shrink-0">
                      Agent Rep
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-0.5 shrink-0 bg-[#F5F2EC]/80 border border-[#E0DAD0]/80 rounded-lg p-0.5">
                  <button
                    onClick={() => handleOpenEditModal(contact)}
                    className="p-1.5 rounded-md text-gray-500 hover:text-[#0F1420] hover:bg-white transition-all cursor-pointer"
                    title="Edit Contact"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteContact(contact.id)}
                    className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-white transition-all cursor-pointer"
                    title="Delete Contact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Contact Full Name & Associated Account */}
              <div className="min-w-0">
                <h3 className="text-base font-black text-[#0F1420] group-hover:text-[#C9A052] transition-colors truncate">
                  {contact.prefix ? `${contact.prefix} ` : ""}
                  {contact.firstName}{" "}
                  {contact.middleName1 ? `${contact.middleName1} ` : (contact.middleName ? `${contact.middleName} ` : "")}
                  {contact.middleName2 ? `${contact.middleName2} ` : ""}
                  {contact.lastName1 ? `${contact.lastName1} ` : ""}
                  {contact.lastName2 ? contact.lastName2 : contact.lastName}
                  {contact.suffix ? `, ${contact.suffix}` : ""}
                </h3>
                {contact.title && (
                  <p className="text-[11px] font-bold text-[#C9A052] font-mono truncate">{contact.title}</p>
                )}
                {contact.associatedAccountName && (
                  <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                    Account: <strong className="text-[#0F1420]">{contact.associatedAccountName}</strong>
                  </p>
                )}
              </div>

              {/* Bio & Manifest Metrics: Gender, Weight, Country */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#F5F2EC] border border-[#E0DAD0] text-xs font-mono">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block font-sans">Gender</span>
                  <span className="font-bold text-[#0F1420]">{contact.gender}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block font-sans">Weight</span>
                  <span className="font-bold text-[#0F1420]">{contact.weightKg} kg</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block font-sans">Country</span>
                  <span className="font-bold text-[#0F1420] truncate block">{contact.country}</span>
                </div>
              </div>

              {/* Identification Document Info */}
              <div className="p-3 rounded-xl border border-gray-200 bg-white space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-[#C9A052]" />
                    <span>Bio Document: {contact.bioIdType?.toUpperCase()}</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                    Verified
                  </span>
                </div>
                <p className="font-mono font-bold text-sm text-[#0F1420]">
                  {contact.bioIdType === "passport"
                    ? contact.passportDetails?.passportNumber || "On File"
                    : contact.bioIdType === "id"
                    ? contact.idDetails?.idNumber || "On File"
                    : contact.visaDetails?.visaNumber || "On File"}
                </p>
                <div className="text-[11px] text-gray-500 flex items-center justify-between font-mono pt-0.5">
                  <span>
                    Birth: {contact.passportDetails?.placeOfBirth || contact.country}
                  </span>
                  <span>
                    Expires: {contact.passportDetails?.expirationDate || contact.idDetails?.expirationDate || contact.visaDetails?.validUntil || "Valid"}
                  </span>
                </div>
              </div>

              {/* Contact communications */}
              <div className="space-y-1 text-xs font-mono text-gray-700">
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{contact.email}</span>
                </div>
                <div className="flex items-center gap-2 truncate">
                  <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{contact.phone}</span>
                </div>
              </div>

              {/* Pets Details Section */}
              {contact.pets && contact.pets.length > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1 text-xs">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                    <Dog className="w-3.5 h-3.5 text-[#C9A052]" />
                    <span>Accompanied Pets ({contact.pets.length})</span>
                  </span>
                  {contact.pets.map((p) => (
                    <div key={p.id} className="text-[11px] text-[#0F1420]">
                      <strong>{p.petName}</strong> ({p.petType} - {p.breed}, {p.weightKg} kg)
                      {p.passportCertificateNumber && (
                        <div className="text-[10px] text-gray-500 font-mono">
                          Passport: {p.passportCertificateNumber} • Chip: {p.microchipNumber || "Yes"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with Flight History & Edit Profile */}
            <div className="pt-3 border-t border-[#E0DAD0] flex items-center justify-between text-xs gap-2">
              <button
                onClick={() => setViewingContact(contact)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F5F2EC] hover:bg-[#EBE5DB] text-[#0F1420] font-bold text-xs font-mono transition-colors border border-[#E0DAD0]"
                title="View full profile & past flights flown"
              >
                <Eye className="w-3.5 h-3.5 text-[#C9A052]" />
                <span>Flight History</span>
              </button>
              <button
                onClick={() => handleOpenEditModal(contact)}
                className="text-xs font-bold text-[#C9A052] hover:text-[#0F1420] flex items-center gap-1 transition-colors"
              >
                <span>Edit Profile</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredContacts.length === 0 && (
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-12 text-center space-y-3">
          <Users className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-[#0F1420]">No contacts matching search query</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Try resetting your filters or click below to add a new contact.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-[#0F1420] text-white text-xs font-bold"
          >
            + Create New Contact
          </button>
        </div>
      )}

      {/* Add / Edit Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#D1C9BC] overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 bg-[#0F1420] text-white flex items-start justify-between border-b border-[#1C2436]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A052] font-bold">
                  {editingContactId ? "EDIT CONTACT PROFILE" : "CREATE NEW CONTACT RECORD"}
                </span>
                <h2 className="text-xl font-black text-white">
                  {editingContactId ? "Update Contact & Bio Identification" : "Add Individual Passenger or Broker"}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#1C2436] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Validation Warning Alert */}
              {validationErrors.length > 0 && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-red-900 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-red-800">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span>Important fields are missing or require completion before saving:</span>
                  </div>
                  <ul className="list-disc list-inside text-xs text-red-700 pl-1 space-y-0.5">
                    {validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* SECTION 1: Personal Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#0F1420] border-b pb-1">
                  1. Passenger Legal Name & Metrics
                </h3>

                {/* Prefix & Title Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0F1420] mb-1">
                      Prefix / Salutation
                    </label>
                    <input
                      type="text"
                      value={prefix}
                      onChange={(e) => setPrefix(e.target.value)}
                      placeholder="e.g. Mr., Dr., H.E., Sheikh"
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#0F1420] mb-1">
                      Title / Designation
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Family Office Principal, Lead Charterer, Signatory"
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                </div>

                {/* First Name & Middle Names Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0F1420] mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Edward"
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0F1420] mb-1">
                      Middle Name 1
                    </label>
                    <input
                      type="text"
                      value={middleName1}
                      onChange={(e) => setMiddleName1(e.target.value)}
                      placeholder="e.g. Alexander"
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0F1420] mb-1">
                      Middle Name 2
                    </label>
                    <input
                      type="text"
                      value={middleName2}
                      onChange={(e) => setMiddleName2(e.target.value)}
                      placeholder="e.g. Christian"
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                </div>

                {/* Surnames & Suffix Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0F1420] mb-1">
                      Last Name 1 (Primary) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={lastName1}
                      onChange={(e) => setLastName1(e.target.value)}
                      placeholder="e.g. Brinkmann"
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0F1420] mb-1">
                      Last Name 2 (Secondary / Maternal)
                    </label>
                    <input
                      type="text"
                      value={lastName2}
                      onChange={(e) => setLastName2(e.target.value)}
                      placeholder="e.g. von Habsburg"
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0F1420] mb-1">
                      Suffix
                    </label>
                    <input
                      type="text"
                      value={suffix}
                      onChange={(e) => setSuffix(e.target.value)}
                      placeholder="e.g. Jr., III, Esq."
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0F1420] mb-1">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] font-semibold focus:outline-none focus:border-[#C9A052]"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0F1420] mb-1">
                      Weight (kg) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={weightKg}
                      onChange={(e) => setWeightKg(Number(e.target.value))}
                      placeholder="75"
                      min="10"
                      max="250"
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] font-mono focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>

                  <div className="sm:col-span-2">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0F1420] mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ebrinkmann@bgcapital.com"
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0F1420] mb-1">
                      Telephone / Mobile <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+377 97 97 12 00"
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                </div>

                {/* Associated Account & Agent Checkbox */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-[#0F1420] mb-1">
                      Associated Account
                    </label>
                    <select
                      value={associatedAccountId}
                      onChange={(e) => setAssociatedAccountId(e.target.value)}
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] font-semibold focus:outline-none focus:border-[#C9A052]"
                    >
                      <option value="">-- No Account Association (Independent) --</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.accountNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#F5F2EC] border border-[#E0DAD0]">
                    <div>
                      <span className="font-bold text-xs text-[#0F1420] block">
                        Is Broker Agent Representative
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Shows in Agents directory
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isAgent}
                      onChange={(e) => setIsAgent(e.target.checked)}
                      className="h-5 w-5 text-[#C9A052] rounded border-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Bio Identification (Passport / ID / Visa) */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b pb-1">
                  <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#0F1420]">
                    2. Bio Identification (Passport / ID / Visa)
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setBioIdType("passport")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                        bioIdType === "passport" ? "bg-[#0F1420] text-[#C9A052]" : "bg-[#F5F2EC] text-gray-700"
                      }`}
                    >
                      Passport
                    </button>
                    <button
                      type="button"
                      onClick={() => setBioIdType("id")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                        bioIdType === "id" ? "bg-[#0F1420] text-[#C9A052]" : "bg-[#F5F2EC] text-gray-700"
                      }`}
                    >
                      National ID
                    </button>
                    <button
                      type="button"
                      onClick={() => setBioIdType("visa")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                        bioIdType === "visa" ? "bg-[#0F1420] text-[#C9A052]" : "bg-[#F5F2EC] text-gray-700"
                      }`}
                    >
                      Visa
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F5F2EC] border border-[#E0DAD0] grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#0F1420] mb-1">
                      {bioIdType === "passport" ? "Passport Number" : bioIdType === "id" ? "ID Card Number" : "Visa Document Number"} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      placeholder={bioIdType === "passport" ? "e.g. P-84920194A" : "e.g. ID-849201"}
                      className="w-full bg-white border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#0F1420] mb-1">
                      Issuing Country
                    </label>
                    <input
                      type="text"
                      value={issuingCountry}
                      onChange={(e) => setIssuingCountry(e.target.value)}
                      placeholder="Austria"
                      className="w-full bg-white border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>

                  {bioIdType === "passport" && (
                    <div>
                      <label className="block text-[11px] font-bold text-[#0F1420] mb-1">
                        Place of Birth
                      </label>
                      <input
                        type="text"
                        value={placeOfBirth}
                        onChange={(e) => setPlaceOfBirth(e.target.value)}
                        placeholder="Munich, Germany"
                        className="w-full bg-white border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                      />
                    </div>
                  )}

                  {bioIdType === "visa" && (
                    <div>
                      <label className="block text-[11px] font-bold text-[#0F1420] mb-1">
                        Visa Category
                      </label>
                      <input
                        type="text"
                        value={visaCategory}
                        onChange={(e) => setVisaCategory(e.target.value)}
                        placeholder="e.g. B1/B2 Executive"
                        className="w-full bg-white border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-[#0F1420] mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full bg-white border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#0F1420] mb-1">
                      Expiration Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={bioIdType === "visa" ? visaValidUntil : expirationDate}
                      onChange={(e) =>
                        bioIdType === "visa"
                          ? setVisaValidUntil(e.target.value)
                          : setExpirationDate(e.target.value)
                      }
                      className="w-full bg-white border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Pet Details Area */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b pb-1">
                  <div>
                    <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#0F1420] flex items-center gap-1.5">
                      <Dog className="w-4 h-4 text-[#C9A052]" />
                      <span>3. Accompanied Pets Area</span>
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Record traveling dogs, cats, falcons, microchip IDs, and EU pet passports for customs clearances.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPet}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F1420] text-[#C9A052] font-bold text-xs hover:bg-[#1C2436] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Pet</span>
                  </button>
                </div>

                {pets.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-gray-300 text-center text-xs text-gray-500">
                    No accompanied pets added. Click "+ Add Pet" if passenger is traveling with pets.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pets.map((pet, idx) => (
                      <div
                        key={pet.id}
                        className="p-3.5 rounded-xl border border-[#E0DAD0] bg-[#FDFCFA] space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#0F1420]">
                            Pet #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemovePet(pet.id)}
                            className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Pet Type</label>
                            <select
                              value={pet.petType}
                              onChange={(e) => handleUpdatePet(pet.id, { petType: e.target.value })}
                              className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1 text-xs"
                            >
                              <option value="Dog">Dog</option>
                              <option value="Cat">Cat</option>
                              <option value="Falcon">Falcon</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Pet Name</label>
                            <input
                              type="text"
                              value={pet.petName}
                              onChange={(e) => handleUpdatePet(pet.id, { petName: e.target.value })}
                              placeholder="Name"
                              className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Breed</label>
                            <input
                              type="text"
                              value={pet.breed}
                              onChange={(e) => handleUpdatePet(pet.id, { breed: e.target.value })}
                              placeholder="e.g. Dachshund"
                              className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Weight (kg)</label>
                            <input
                              type="number"
                              value={pet.weightKg}
                              onChange={(e) => handleUpdatePet(pet.id, { weightKg: Number(e.target.value) })}
                              placeholder="5"
                              className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1 text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Microchip Number</label>
                            <input
                              type="text"
                              value={pet.microchipNumber || ""}
                              onChange={(e) => handleUpdatePet(pet.id, { microchipNumber: e.target.value })}
                              placeholder="ISO 15-digit chip"
                              className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1 text-xs font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Pet Passport / Rabies Cert</label>
                            <input
                              type="text"
                              value={pet.passportCertificateNumber || ""}
                              onChange={(e) => handleUpdatePet(pet.id, { passportCertificateNumber: e.target.value })}
                              placeholder="e.g. EU-PET-84920"
                              className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1 text-xs font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Vaccination Expiry</label>
                            <input
                              type="date"
                              value={pet.vaccinationExpiry || ""}
                              onChange={(e) => handleUpdatePet(pet.id, { vaccinationExpiry: e.target.value })}
                              className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1 text-xs font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
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
                  {editingContactId ? "Save Contact Profile" : "Register Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact Profile & Flight History Modal / Slide-Over */}
      {viewingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-[#E0DAD0] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-[#0F1420] text-white flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A052] font-bold">
                    CONTACT PROFILE & FLIGHT HISTORY
                  </span>
                  {viewingContact.title && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      {viewingContact.title}
                    </span>
                  )}
                  {viewingContact.isAgent && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#C9A052]/20 text-[#C9A052] border border-[#C9A052]/40">
                      Agent Rep
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-black text-white">
                  {viewingContact.prefix ? `${viewingContact.prefix} ` : ""}
                  {viewingContact.firstName}{" "}
                  {viewingContact.middleName1 ? `${viewingContact.middleName1} ` : (viewingContact.middleName ? `${viewingContact.middleName} ` : "")}
                  {viewingContact.middleName2 ? `${viewingContact.middleName2} ` : ""}
                  {viewingContact.lastName1 ? `${viewingContact.lastName1} ` : ""}
                  {viewingContact.lastName2 ? viewingContact.lastName2 : viewingContact.lastName}
                  {viewingContact.suffix ? `, ${viewingContact.suffix}` : ""}
                </h2>
                {viewingContact.associatedAccountName && (
                  <p className="text-xs text-gray-300 font-mono">
                    Account: <strong className="text-white">{viewingContact.associatedAccountName}</strong>
                    {viewingContact.associatedAccountId && ` (${viewingContact.associatedAccountId})`}
                  </p>
                )}
              </div>
              <button
                onClick={() => setViewingContact(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#1C2436] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Credentials & Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[#F5F2EC] border border-[#E0DAD0] text-xs font-mono">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block font-sans">Country</span>
                  <span className="font-bold text-[#0F1420]">{viewingContact.country}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block font-sans">Gender</span>
                  <span className="font-bold text-[#0F1420]">{viewingContact.gender}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block font-sans">Weight</span>
                  <span className="font-bold text-[#0F1420]">{viewingContact.weightKg} kg</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block font-sans">Bio Document</span>
                  <span className="font-bold text-[#0F1420]">{viewingContact.bioIdType?.toUpperCase()}</span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl border border-[#E0DAD0] bg-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#C9A052] shrink-0" />
                  <span className="truncate">{viewingContact.email}</span>
                </div>
                <div className="p-3 rounded-xl border border-[#E0DAD0] bg-white flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#C9A052] shrink-0" />
                  <span className="truncate">{viewingContact.phone}</span>
                </div>
              </div>

              {/* Passport / Identification Details */}
              <div className="p-4 rounded-xl border border-[#E0DAD0] bg-white space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-gray-700 uppercase flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#C9A052]" />
                    Identification & Travel Credentials
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                    Verified APIS
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono pt-1 text-gray-600">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase block">Doc Number</span>
                    <strong className="text-[#0F1420]">
                      {viewingContact.bioIdType === "passport"
                        ? viewingContact.passportDetails?.passportNumber || "On File"
                        : viewingContact.bioIdType === "id"
                        ? viewingContact.idDetails?.idNumber || "On File"
                        : viewingContact.visaDetails?.visaNumber || "On File"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase block">Issuing Authority</span>
                    <strong className="text-[#0F1420]">
                      {viewingContact.passportDetails?.issuingCountry || viewingContact.country}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase block">Expiration Date</span>
                    <strong className="text-[#0F1420]">
                      {viewingContact.passportDetails?.expirationDate || viewingContact.idDetails?.expirationDate || viewingContact.visaDetails?.validUntil || "Valid"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* FLIGHT HISTORY SECTION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-[#C9A052]" />
                    <h3 className="text-sm font-extrabold text-[#0F1420]">
                      Trips Flown & Flight History
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#0F1420] text-[#C9A052]">
                    {tripHistory.length} Flights
                  </span>
                </div>

                {tripHistory.length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-gray-300 text-center space-y-1.5">
                    <Clock className="w-6 h-6 text-gray-400 mx-auto" />
                    <p className="text-xs font-bold text-gray-700">No flight records found for this passenger</p>
                    <p className="text-[11px] text-gray-400">
                      When this contact is added to a flight brief passenger manifest or booking, completed trips will appear here automatically.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {tripHistory.map((b) => (
                      <div
                        key={b.id}
                        className="p-3.5 rounded-xl border border-[#E0DAD0] bg-[#FAFAF8] hover:bg-white hover:border-[#C9A052]/60 transition-all text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-[#0F1420] px-2 py-0.5 rounded bg-white border border-[#E0DAD0]">
                              {b.tripNumber || b.tripId}
                            </span>
                            <span className="text-[10px] font-mono text-gray-500">
                              {b.legs?.[0]?.flightDate || new Date(b.createdAt || "").toLocaleDateString()}
                            </span>
                          </div>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                            b.status === "completed" || b.status === "flown"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : "bg-blue-100 text-blue-800 border-blue-300"
                          }`}>
                            {b.status.toUpperCase()}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#F4EBD8] text-[#7A5A1B]">
                            {getContactTripRole(b, viewingContact)}
                          </span>
                        </div>

                        {/* Routing & Aircraft */}
                        <div className="flex items-center justify-between text-xs pt-1">
                          <div className="flex items-center gap-1.5 font-bold text-[#0F1420]">
                            <span>{b.legs?.[0]?.origin?.city || b.legs?.[0]?.origin?.icao || "Departure"}</span>
                            <span className="text-[#C9A052]">→</span>
                            <span>{b.legs?.[b.legs.length - 1]?.destination?.city || b.legs?.[b.legs.length - 1]?.destination?.icao || "Arrival"}</span>
                          </div>
                          <span className="font-mono text-gray-500">
                            {b.aircraft?.name} ({b.aircraft?.registration || "OE-FFB"})
                          </span>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => openDocument(b, "invoice")}
                            className="px-2.5 py-1 rounded-lg bg-[#0F1420] text-[#C9A052] font-bold text-[10px]"
                          >
                            View Invoice
                          </button>
                          {b.isContractSigned && (
                            <button
                              type="button"
                              onClick={() => openDocument(b, "charter_agreement")}
                              className="px-2.5 py-1 rounded-lg border border-[#E0DAD0] text-[#0F1420] font-bold text-[10px]"
                            >
                              View Contract
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#E0DAD0] bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-mono">
                Contact ID: {viewingContact.id}
              </span>
              <button
                type="button"
                onClick={() => setViewingContact(null)}
                className="px-4 py-2 rounded-xl bg-[#0F1420] text-[#C9A052] font-bold text-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
