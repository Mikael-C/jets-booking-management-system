"use client";

/**
 * A conversation with the desk about one request or trip: the messages both ways and a reply box.
 * Used in the "Message desk" window (requests, quotes, trips) and on the Messages page.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toaster";
import { DocRef, GoldButton, Modal, Ref, fieldCls } from "./curatorUi";

interface ThreadMessage {
  id: string;
  from: string;
  fromDesk: boolean;
  text: string;
  at: string;
}
interface ThreadData {
  key: string;
  kind: "request" | "trip";
  ref: Ref;
  title: string;
  messages: ThreadMessage[];
}

/** Tells the top bar and the lists that unread counts may have changed. */
export const announceMessagesChanged = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("curator-messages-changed"));
};

const when = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return d.toDateString() === today.toDateString() ? time : `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} ${time}`;
};

export function DeskThread({ threadKey, onSent, height = "max-h-[46vh]" }: { threadKey: string; onSent?: () => void; height?: string }) {
  const [data, setData] = useState<ThreadData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const seen = useRef<number>(-1);

  const load = useCallback(
    async (quiet = false) => {
      try {
        const res = await api.curator.thread(threadKey);
        setData(res.data);
        setError(null);
        // Opening (or a new message) changes the unread counts elsewhere
        const n = Array.isArray(res.data?.messages) ? res.data.messages.length : 0;
        if (n !== seen.current) {
          seen.current = n;
          announceMessagesChanged();
        }
      } catch (err: any) {
        if (!quiet) setError(err?.message || "The conversation could not be loaded.");
      }
    },
    [threadKey]
  );

  useEffect(() => {
    setData(null);
    setError(null);
    setText("");
    seen.current = -1;
    load();
    // New desk replies show up while the conversation is open
    const t = setInterval(() => load(true), 20000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [data?.messages.length]);

  const send = async () => {
    const msg = text.trim();
    if (!msg || sending) return;
    setSending(true);
    try {
      await api.curator.sendThread(threadKey, msg);
      setText("");
      await load(true);
      onSent?.();
    } catch (err: any) {
      toast(err?.message || "The message could not be sent.", "error");
    } finally {
      setSending(false);
    }
  };

  if (error && !data) {
    return (
      <div className="text-[14px] text-[#F08C8C] flex items-center justify-between gap-3">
        <span>{error}</span>
        <button type="button" onClick={() => load()} className="underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className={`${height} overflow-y-auto space-y-3 pr-1`}>
        {!data && <div className="text-[14px] text-[#93A1B5]">Loading…</div>}
        {data && data.messages.length === 0 && (
          <div className="text-[14px] text-[#93A1B5]">No messages yet. Write to the desk below; the reply shows here.</div>
        )}
        {data?.messages.map((m) => (
          <div key={m.id} className={`flex ${m.fromDesk ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-[14px] ${
                m.fromDesk ? "bg-[#0D1520] border border-[#263345] text-[#E8EDF3]" : "bg-[#C9A24A]/15 border border-[#C9A24A]/40 text-white"
              }`}
            >
              <div className="text-[11px] text-[#93A1B5] mb-1">
                {m.fromDesk ? `${m.from || "Desk"} · desk` : "You"} · {when(m.at)}
              </div>
              <div className="whitespace-pre-wrap break-words">{m.text}</div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Write to the desk…"
          className={`${fieldCls} resize-none`}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
          }}
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-[12px] text-[#5F6E82]">Ctrl + Enter to send</span>
          <GoldButton onClick={send} disabled={sending || !text.trim()}>
            {sending ? "Sending…" : "Send"}
          </GoldButton>
        </div>
      </div>
    </div>
  );
}

export function DeskThreadModal({ threadKey, title, onClose }: { threadKey: string; title?: Ref | string | null; onClose: () => void }) {
  return (
    <Modal
      width="max-w-2xl"
      onClose={onClose}
      title={
        <>
          Message the desk
          {title ? (
            <>
              {" · "}
              {typeof title === "string" ? title : <DocRef value={title} />}
            </>
          ) : null}
        </>
      }
    >
      <DeskThread threadKey={threadKey} />
    </Modal>
  );
}

/** "Message desk" link with the number of unread desk replies. */
export function MessageDeskButton({ unread, onClick, label = "Message desk" }: { unread?: number; onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="inline-flex items-center gap-1.5 text-[#C9A24A] underline underline-offset-4 decoration-1 hover:text-[#D7B05A] text-[15px] font-medium"
    >
      {label}
      {unread ? (
        <span className="no-underline inline-block bg-[#C9A24A] text-[#0B121C] text-[11px] font-bold rounded-full px-1.5 py-0.5 leading-none">{unread}</span>
      ) : null}
    </button>
  );
}
