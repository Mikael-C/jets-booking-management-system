"use client";

/**
 * App-wide toast messages. Call toast("Message sent to the desk") from anywhere;
 * the Toaster lives in the root layout, so a toast survives a page change.
 */
import React, { useEffect, useState } from "react";

export type ToastTone = "success" | "error" | "info";
interface ToastItem {
  id: number;
  text: string;
  tone: ToastTone;
}

const EVENT = "orbelo-toast";

export function toast(text: string, tone: ToastTone = "success") {
  if (typeof window === "undefined" || !text) return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { text, tone } }));
}

export default function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    let n = 0;
    const onToast = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      const id = Date.now() + n++;
      setItems((prev) => [...prev.slice(-3), { id, text: String(d.text || ""), tone: (d.tone as ToastTone) || "success" }]);
      window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), d.tone === "error" ? 6000 : 4000);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  if (!items.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5 items-end pointer-events-none print:hidden" aria-live="polite">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto flex items-start gap-3 min-w-[260px] max-w-[420px] px-4 py-3 rounded-xl shadow-2xl border text-[14px] font-medium animate-in fade-in slide-in-from-bottom-2 ${
            t.tone === "error"
              ? "bg-[#3A1A1F] border-[#5C2A31] text-[#FBD5D5]"
              : t.tone === "info"
                ? "bg-[#111A27] border-[#263345] text-white"
                : "bg-[#0F2A1E] border-[#1E5A3E] text-[#C9F2DC]"
          }`}
        >
          <span className="mt-[1px]">{t.tone === "error" ? "⚠" : t.tone === "info" ? "ℹ" : "✓"}</span>
          <span className="flex-1">{t.text}</span>
          <button
            type="button"
            onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
            className="opacity-60 hover:opacity-100 leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
