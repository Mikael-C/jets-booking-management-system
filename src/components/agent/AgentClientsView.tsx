"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Badge, GoldButton, LoadState, Modal, PageTitle, cardCls, fieldCls, goldLinkCls, labelCls, tdCls, thCls, useLoad } from "./curatorUi";

export interface CuratorClient {
  id: string;
  name: string;
  type: "Company" | "Person";
  authorisedPerson: string;
  assistant: string;
  email: string;
  whatsapp: string;
  documentsTo: string;
  trips: number;
  requests: number;
  lastTrip: string;
  missingPassports: number;
  linked: boolean;
}

/** Add client: company or person, authorised owner, assistant (optional), email, WhatsApp. */
export function AddClientModal({ onClose, onSaved }: { onClose: () => void; onSaved: (id: string) => void }) {
  const [type, setType] = useState<"company" | "person">("company");
  const [form, setForm] = useState({ companyName: "", ownerName: "", assistantName: "", assistantEmail: "", email: "", whatsapp: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState<{ id: string; name: string } | null>(null);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await api.curator.addClient({ type, ...form });
      onSaved(res.data.id);
    } catch (err: any) {
      if (err?.code === "EXISTS" && err?.data?.client) setExisting(err.data.client);
      else if (err?.code === "ALREADY_YOURS" && err?.data?.client) onSaved(err.data.client.id);
      else setError(err?.message || "The client could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const link = async () => {
    if (!existing) return;
    setSaving(true);
    try {
      await api.curator.linkClient(existing.id);
      onSaved(existing.id);
    } catch (err: any) {
      setError(err?.message || "The client could not be linked.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add client" onClose={onClose} width="max-w-xl">
      {existing ? (
        <div className="space-y-4">
          <p className="text-[15px] text-white m-0">
            The desk already has <strong>{existing.name}</strong> with this email. Link them to your list instead of creating a copy.
          </p>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setExisting(null)} className="text-[15px] text-[#93A1B5] hover:text-white px-3">
              Back
            </button>
            <GoldButton onClick={link} disabled={saving}>
              {saving ? "Linking…" : "Link to my clients"}
            </GoldButton>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2">
            {(["company", "person"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setType(k)}
                className={`px-4 py-2 rounded-full text-[14px] font-semibold border ${
                  type === k ? "bg-[#C9A24A] border-[#C9A24A] text-[#0B121C]" : "border-[#2A3749] text-[#D5DCE5]"
                }`}
              >
                {k === "company" ? "Company" : "Person"}
              </button>
            ))}
          </div>
          {type === "company" && (
            <div>
              <label className={labelCls}>Company</label>
              <input className={fieldCls} value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
            </div>
          )}
          <div>
            <label className={labelCls}>{type === "company" ? "Authorised owner" : "Full name"}</label>
            <input className={fieldCls} value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" className={fieldCls} value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>WhatsApp</label>
              <input className={fieldCls} value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="+234…" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Assistant (optional)</label>
              <input className={fieldCls} value={form.assistantName} onChange={(e) => set("assistantName", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Assistant email (optional)</label>
              <input type="email" className={fieldCls} value={form.assistantEmail} onChange={(e) => set("assistantEmail", e.target.value)} />
            </div>
          </div>
          {error && <div className="text-[14px] text-[#F08C8C]">{error}</div>}
          <div className="flex justify-end">
            <GoldButton onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Add client"}
            </GoldButton>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function AgentClientsView() {
  const { data, error, loading, reload } = useLoad<CuratorClient[]>(() => api.curator.clients(), []);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data || []).filter((c) => !q || [c.name, c.authorisedPerson, c.assistant, c.email].some((v) => String(v || "").toLowerCase().includes(q)));
  }, [data, search]);

  return (
    <div>
      <PageTitle title="My clients" sub="Clients you add are linked to you. Only you and the desk can see them." />
      <div className="flex items-center justify-between gap-4 mb-6">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients…" className={`${fieldCls} max-w-[420px] py-3`} />
        <GoldButton onClick={() => setAdding(true)}>+ Add client</GoldButton>
      </div>

      {!data ? (
        <LoadState loading={loading} error={error} onRetry={reload} />
      ) : (
        <div className={`${cardCls} overflow-hidden px-3 py-1`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  <th className={thCls}>Client</th>
                  <th className={thCls}>Type</th>
                  <th className={thCls}>Authorised person</th>
                  <th className={thCls}>Trips</th>
                  <th className={thCls}>Last trip</th>
                  <th className={thCls}>Documents</th>
                  <th className={thCls} />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-[15px] text-[#93A1B5]">
                      {search ? "No client matches." : "No clients yet. Add your first client."}
                    </td>
                  </tr>
                )}
                {rows.map((c) => (
                  <tr key={c.id} className="border-b border-white/[0.05] last:border-0">
                    <td className={tdCls}>{c.name}</td>
                    <td className={tdCls}>{c.type}</td>
                    <td className={tdCls}>{c.authorisedPerson}</td>
                    <td className={tdCls}>{c.trips}</td>
                    <td className={`${tdCls} whitespace-nowrap`}>{c.lastTrip}</td>
                    <td className={tdCls}>
                      {c.missingPassports ? (
                        <Badge tone="amber">
                          ▲ {c.missingPassports} passport{c.missingPassports === 1 ? "" : "s"}
                        </Badge>
                      ) : (
                        <Badge tone="green">Complete</Badge>
                      )}
                    </td>
                    <td className={`${tdCls} whitespace-nowrap`}>
                      <Link href={`/agent/requests/new?client=${encodeURIComponent(c.id)}`} className={goldLinkCls}>
                        New request
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-[15px] text-[#93A1B5] mt-5">
        Adding a client creates the account and its authorised person once. If the desk already has them, you are asked to link instead of creating a
        copy.
      </p>

      {adding && (
        <AddClientModal
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            reload();
          }}
        />
      )}
    </div>
  );
}
