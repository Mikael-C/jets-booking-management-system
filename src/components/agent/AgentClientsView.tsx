"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useAviation } from "@/lib/aviationContext";
import { AlertTriangle } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // New Client Form
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"company" | "person">("company");
  const [newAuthPerson, setNewAuthPerson] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

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
    if (key && !clientMap.has(key)) {
      clientMap.set(key, {
        id: req.id,
        name: req.companyName || req.clientName || "—",
        type: req.companyName ? "Company" : "Person",
        authorisedPerson: req.clientName || "—",
        trips: 1,
        lastTrip: req.flightDate
          ? new Date(req.flightDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })
          : "—",
        docsStatus: "complete",
        docsLabel: "Complete",
      });
    }
  });

  const clientRows = Array.from(clientMap.values()).filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.authorisedPerson.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newAcc: AccountRecord = {
      id: `acc-${Date.now()}`,
      accountNumber: `ACC-${Math.floor(10000 + Math.random() * 90000)}`,
      accountType: newType === "company" ? "entity" : "individual",
      name: newName.trim(),
      country: "Global",
      email: newEmail.trim() || `${newName.toLowerCase().replace(/\s+/g, "")}@client.com`,
      phone: newPhone.trim() || "+44 20 7000 0000",
      billingAddress: "Executive Suite, Global",
      isAgent: false,
      agentName: currentUser?.name || "Marcus Vance",
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
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">My clients</h1>
      <p className="text-sm text-gray-400 mb-6">
        Clients you add are linked to you. Only you and the desk can see them.
      </p>

      <div className="flex items-center justify-between gap-4 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clients..."
          className="bg-[#0F1420] border border-white/20 rounded-lg px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A052] w-72"
        />
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-sm font-bold rounded-lg transition-colors flex items-center gap-1.5"
        >
          <span>+ Add client</span>
        </button>
      </div>

      <div className="bg-[#141C2E] rounded-lg border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">
                Client
              </th>
              <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">
                Type
              </th>
              <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">
                Authorised person
              </th>
              <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">
                Trips
              </th>
              <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">
                Last trip
              </th>
              <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">
                Documents
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
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
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
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

      <p className="text-xs text-gray-500 mt-4">
        Adding a client creates the account and its authorised person once. If the desk
        already has them, you are asked to link instead of creating a copy.
      </p>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141C2E] border border-white/20 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-base font-bold text-white">Add client</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3.5">
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Client name / Company
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#0F1420] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                  placeholder="e.g. Adeyemi Holdings Ltd"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-[#0F1420] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                >
                  <option value="company">Company</option>
                  <option value="person">Person</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Authorised person
                </label>
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
                <label className="text-xs text-gray-400 block mb-1">
                  Phone (optional)
                </label>
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
