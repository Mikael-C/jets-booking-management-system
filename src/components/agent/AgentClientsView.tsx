"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useAviation } from "@/lib/aviationContext";
import { AlertTriangle, Download, FileText, CheckCircle2, ExternalLink } from "lucide-react";
import { AccountRecord } from "@/types/aviation";

interface ClientRow {
  id: string;
  name: string;
  type: "Company" | "Person";
  authorisedPerson: string;
  trips: number;
  lastTrip: string;
  docsStatus: "complete" | "warn";
  docsLabel: string;
}

export default function AgentClientsView() {
  const { accounts, agentRequests, bookings, addAccount, currentUser } = useAviation();
  const [activeTab, setActiveTab] = useState<"clients" | "documents">("clients");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  // New Client Form
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"company" | "person">("company");
  const [newAuthPerson, setNewAuthPerson] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const triggerDownload = (docName: string) => {
    setDownloadToast(`Generating watermarked PDF of "${docName}" for Marcus Vance...`);
    setTimeout(() => {
      setDownloadToast(`Downloaded: "${docName}" (v1.0)`);
      setTimeout(() => setDownloadToast(null), 3500);
    }, 1000);
  };

  const clientMap = new Map<string, ClientRow>();

  // 1. First add from accounts
  accounts
    .filter((acc) => !acc.isAgent)
    .forEach((acc) => {
      const isAdeyemi = acc.name.toLowerCase().includes("adeyemi");
      const isOkafor = acc.name.toLowerCase().includes("okafor");
      const isNwankwo = acc.name.toLowerCase().includes("nwankwo");

      let docsStatus: "complete" | "warn" = "complete";
      let docsLabel = "Complete";
      let trips = acc.totalBookings || acc.lifetimeTrips || 0;
      let lastTrip = "—";

      if (isAdeyemi) {
        docsStatus = "warn";
        docsLabel = "2 passports";
        trips = 6;
        lastTrip = "20 Nov";
      } else if (isOkafor) {
        docsStatus = "complete";
        docsLabel = "Complete";
        trips = 2;
        lastTrip = "19 Nov";
      } else if (isNwankwo) {
        docsStatus = "complete";
        docsLabel = "Complete";
        trips = 1;
        lastTrip = "Sep 2026";
      } else {
        // Compute from bookings
        const rel = bookings.filter(
          (b) =>
            b.client?.fullName === acc.name ||
            b.client?.companyName === acc.name ||
            b.accountNumber === acc.accountNumber
        );
        if (rel.length > 0) {
          trips = rel.length;
          const sorted = [...rel].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          if (sorted[0]?.legs?.[0]?.flightDate) {
            try {
              lastTrip = new Date(sorted[0].legs[0].flightDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              });
            } catch {}
          }
        }
      }

      clientMap.set(acc.name.toLowerCase(), {
        id: acc.id,
        name: acc.name,
        type: acc.accountType === "entity" ? "Company" : "Person",
        authorisedPerson:
          acc.authorizedPersons?.[0]?.fullName || acc.preferredContactName || acc.name,
        trips,
        lastTrip,
        docsStatus,
        docsLabel,
      });
    });

  // 2. Also check agent requests
  agentRequests.forEach((req) => {
    const key = (req.companyName || req.clientName || "").toLowerCase();
    if (!key) return;
    if (!clientMap.has(key)) {
      clientMap.set(key, {
        id: `agent-client-${key}`,
        name: req.companyName || req.clientName,
        type: req.companyName ? "Company" : "Person",
        authorisedPerson: req.clientName || "—",
        trips: 1,
        lastTrip: req.flightDate || "—",
        docsStatus: "warn",
        docsLabel: "In progress",
      });
    }
  });

  // Hardcode primary rows if not present
  if (!clientMap.has("adeyemi holdings ltd")) {
    clientMap.set("adeyemi holdings ltd", {
      id: "hardcoded-adeyemi",
      name: "Adeyemi Holdings Ltd",
      type: "Company",
      authorisedPerson: "T. Adeyemi",
      trips: 6,
      lastTrip: "20 Nov",
      docsStatus: "warn",
      docsLabel: "2 passports",
    });
  }
  if (!clientMap.has("okafor energy group")) {
    clientMap.set("okafor energy group", {
      id: "hardcoded-okafor",
      name: "Okafor Energy Group",
      type: "Company",
      authorisedPerson: "C. Okafor",
      trips: 2,
      lastTrip: "19 Nov",
      docsStatus: "complete",
      docsLabel: "Complete",
    });
  }
  if (!clientMap.has("dr. ifeanyi nwankwo")) {
    clientMap.set("dr. ifeanyi nwankwo", {
      id: "hardcoded-nwankwo",
      name: "Dr. Ifeanyi Nwankwo",
      type: "Person",
      authorisedPerson: "Dr. Ifeanyi Nwankwo",
      trips: 1,
      lastTrip: "Sep 2026",
      docsStatus: "complete",
      docsLabel: "Complete",
    });
  }

  const clientRows = Array.from(clientMap.values()).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newAcc: AccountRecord = {
      id: `acc-${Date.now()}`,
      accountNumber: `ACC-${Math.floor(10000 + Math.random() * 90000)}`,
      name: newName.trim(),
      accountType: newType === "company" ? "entity" : "individual",
      country: "",
      email: newEmail.trim(),
      phone: newPhone.trim(),
      billingAddress: "",
      isAgent: false,
      preferredContactName: newAuthPerson.trim() || newName.trim(),
      preferredContactEmail: newEmail.trim(),
      preferredContactPhone: newPhone.trim(),
      authorizedPersons: [
        {
          id: `auth-${Date.now()}`,
          fullName: newAuthPerson.trim() || newName.trim(),
          email: newEmail.trim(),
          phone: newPhone.trim(),
          idDocumentType: "passport",
          hasPassport: true,
        },
      ],
      totalBookings: 0,
      createdAt: new Date().toISOString(),
    };

    addAccount(newAcc);
    setShowAddModal(false);
    setNewName("");
    setNewAuthPerson("");
    setNewEmail("");
    setNewPhone("");
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Sub-tabs: Clients & Documents (Screen 1) */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("clients")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeTab === "clients"
                ? "bg-[#C9A052] text-[#0F1420]"
                : "bg-[#141C2E] text-gray-300 hover:text-white border border-white/10"
            }`}
          >
            My clients ({clientRows.length})
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeTab === "documents"
                ? "bg-[#C9A052] text-[#0F1420]"
                : "bg-[#141C2E] text-gray-300 hover:text-white border border-white/10"
            }`}
          >
            Documents
          </button>
        </div>

        {downloadToast && (
          <div className="text-xs text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 rounded-full animate-fade-in flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{downloadToast}</span>
          </div>
        )}
      </div>

      {/* =========================================================================
          SCREEN 1: DOCUMENTS VIEW
         ========================================================================= */}
      {activeTab === "documents" ? (
        <div className="space-y-6 pt-1">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Documents</h1>
            <p className="text-sm text-gray-400 mt-1">
              What OrbAero has shared with you. Your own signed agreement is always here.
            </p>
          </div>

          <div className="bg-[#141C2E] rounded-xl border border-white/10 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-gray-400 font-medium bg-[#101726]">
                  <th className="py-3.5 px-5">Document</th>
                  <th className="py-3.5 px-5">Version</th>
                  <th className="py-3.5 px-5">Updated</th>
                  <th className="py-3.5 px-5 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {/* Row 1: My Curator agreement */}
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-5 text-white font-semibold text-xs sm:text-sm">
                    My Curator agreement (signed 21 Nov 2026)
                  </td>
                  <td className="py-4 px-5 text-gray-400 font-mono text-xs">v1.0</td>
                  <td className="py-4 px-5 text-gray-400 text-xs">21 Nov</td>
                  <td className="py-4 px-5 text-right whitespace-nowrap">
                    <button
                      onClick={() => triggerDownload("My Curator agreement")}
                      className="text-[#C9A052] hover:text-[#e0b769] hover:underline font-semibold text-xs"
                    >
                      PDF
                    </button>
                  </td>
                </tr>

                {/* Row 2: Curator code of conduct */}
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-5 text-white font-semibold text-xs sm:text-sm">
                    Curator code of conduct
                  </td>
                  <td className="py-4 px-5 text-gray-400 font-mono text-xs">v1.0</td>
                  <td className="py-4 px-5 text-gray-400 text-xs">19 Nov</td>
                  <td className="py-4 px-5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => triggerDownload("Curator code of conduct")}
                        className="text-[#C9A052] hover:text-[#e0b769] hover:underline font-semibold text-xs"
                      >
                        PDF
                      </button>
                      <span className="text-gray-500">·</span>
                      <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                        Acknowledged
                      </span>
                    </div>
                  </td>
                </tr>

                {/* Row 3: Curator sales kit */}
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-5 text-white font-semibold text-xs sm:text-sm">
                    Curator sales kit (route cards, brochure, messages)
                  </td>
                  <td className="py-4 px-5 text-gray-400 font-mono text-xs">v1.0</td>
                  <td className="py-4 px-5 text-gray-400 text-xs">19 Nov</td>
                  <td className="py-4 px-5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => triggerDownload("Curator sales kit")}
                        className="text-[#C9A052] hover:text-[#e0b769] hover:underline font-semibold text-xs"
                      >
                        Open
                      </button>
                      <span className="text-gray-500">·</span>
                      <button
                        onClick={() => triggerDownload("Curator sales kit PDF")}
                        className="text-[#C9A052] hover:text-[#e0b769] hover:underline font-semibold text-xs"
                      >
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Row 4: Client brochure */}
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-5 text-white font-semibold text-xs sm:text-sm">
                    Client brochure
                  </td>
                  <td className="py-4 px-5 text-gray-400 font-mono text-xs">v1.0</td>
                  <td className="py-4 px-5 text-gray-400 text-xs">19 Nov</td>
                  <td className="py-4 px-5 text-right whitespace-nowrap">
                    <button
                      onClick={() => triggerDownload("Client brochure")}
                      className="text-[#C9A052] hover:text-[#e0b769] hover:underline font-semibold text-xs"
                    >
                      PDF to forward
                    </button>
                  </td>
                </tr>

                {/* Row 5: Cancellation table */}
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-5 text-white font-semibold text-xs sm:text-sm">
                    Cancellation table
                  </td>
                  <td className="py-4 px-5 text-gray-400 font-mono text-xs">v0.1</td>
                  <td className="py-4 px-5 text-gray-400 text-xs">19 Nov</td>
                  <td className="py-4 px-5 text-right whitespace-nowrap">
                    <button
                      onClick={() => triggerDownload("Cancellation table")}
                      className="text-[#C9A052] hover:text-[#e0b769] hover:underline font-semibold text-xs"
                    >
                      PDF
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">
            Downloads carry your name and the date. Please don&apos;t forward the agreement or code of conduct.
          </p>
        </div>
      ) : (
        /* =========================================================================
            CLIENTS LIST VIEW
           ========================================================================= */
        <div>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">My clients</h1>
              <p className="text-sm text-gray-400">
                Clients you add are linked to you. Only you and the desk can see them.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-sm font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>+ Add client</span>
            </button>
          </div>

          <div className="mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="bg-[#0F1420] border border-white/20 rounded-lg px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A052] w-72"
            />
          </div>

          <div className="bg-[#141C2E] rounded-lg border border-white/10 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-gray-400 font-medium bg-[#101726]">
                  <th className="text-left px-4 py-3">Client</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Authorised person</th>
                  <th className="text-left px-4 py-3">Trips</th>
                  <th className="text-left px-4 py-3">Last trip</th>
                  <th className="text-left px-4 py-3">Documents</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {clientRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-500 py-10 text-sm">
                      {search
                        ? "No clients match your search."
                        : "No clients yet. Click '+ Add client' to create one."}
                    </td>
                  </tr>
                ) : (
                  clientRows.map((c) => (
                    <tr key={c.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-white font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-gray-300">{c.type}</td>
                      <td className="px-4 py-3 text-gray-300">{c.authorisedPerson}</td>
                      <td className="px-4 py-3 text-gray-300">{c.trips}</td>
                      <td className="px-4 py-3 text-gray-300">{c.lastTrip}</td>
                      <td className="px-4 py-3">
                        {c.docsStatus === "warn" ? (
                          <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[#5C3800] text-[#FFB84D] inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {c.docsLabel}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[#134E2E] text-[#4ADE80]">
                            Complete
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/agent/requests/new?client=${encodeURIComponent(c.name)}`}
                          className="text-[#C9A052] hover:underline text-sm font-medium"
                        >
                          New request
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#141C2E] border border-white/20 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Add new client</h2>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Company or client name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#0F1420] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                  placeholder="e.g. Adeyemi Holdings Ltd"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Account type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as "company" | "person")}
                  className="w-full bg-[#0F1420] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                >
                  <option value="company">Company / Entity</option>
                  <option value="person">Person</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Authorised person</label>
                <input
                  type="text"
                  value={newAuthPerson}
                  onChange={(e) => setNewAuthPerson(e.target.value)}
                  className="w-full bg-[#0F1420] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                  placeholder="e.g. Tunde Adeyemi"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-[#0F1420] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                  placeholder="office@client.com"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Phone (optional)</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-[#0F1420] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                  placeholder="+44 20 7946 0000"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-[#1A2338] border border-white/20 text-sm text-white rounded-lg hover:bg-[#243050]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-sm font-bold rounded-lg transition-colors"
                >
                  Add client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
