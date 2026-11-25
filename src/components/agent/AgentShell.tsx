"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import { api } from "@/lib/api";
import LoginScreen from "@/components/auth/LoginScreen";
import DocumentViewerModal from "@/components/documents/DocumentViewerModal";
import TokenSubscriptionModal from "@/components/tokens/TokenSubscriptionModal";

const NAV = [
  { label: "New request", href: "/agent/requests/new", also: ["/agent/estimate"] },
  { label: "My requests", href: "/agent/requests", also: ["/agent/quotes"] },
  { label: "My trips", href: "/agent/trips", also: [] },
  { label: "My clients", href: "/agent/clients", also: [] },
  { label: "Tokens", href: "/agent/tokens", also: [] },
  { label: "Documents", href: "/agent/documents", also: [] }
];

export default function AgentShell({ children }: { children: React.ReactNode }) {
  const { currentUser, isAuthenticated, logout } = useAviation();
  const pathname = usePathname() || "";
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [me, setMe] = React.useState<{ name: string; tokens: number } | null>(null);

  // Top bar: name and token balance straight from the backend
  React.useEffect(() => {
    if (!isAuthenticated) return;
    let alive = true;
    const load = () =>
      api.curator
        .me()
        .then((res) => alive && res?.data && setMe({ name: res.data.name, tokens: Number(res.data.tokens) || 0 }))
        .catch(() => undefined);
    load();
    window.addEventListener("curator-tokens-changed", load);
    return () => {
      alive = false;
      window.removeEventListener("curator-tokens-changed", load);
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const isActive = (item: (typeof NAV)[number]) => {
    if (item.href === "/agent/requests") {
      return (
        pathname === "/agent/requests" ||
        pathname === "/agent/overview" ||
        (pathname.startsWith("/agent/requests/") && !pathname.startsWith("/agent/requests/new")) ||
        item.also.some((p) => pathname.startsWith(p))
      );
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`) || item.also.some((p) => pathname.startsWith(p));
  };
  const name = me?.name || currentUser?.name || "";

  return (
    <div className="min-h-screen bg-[#0B121C] text-white">
      <nav className="bg-[#0B121C] border-b border-white/[0.07] px-6 lg:px-8 h-[72px] flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-8 min-w-0">
          <Link href="/agent/requests" className="flex items-center gap-3 shrink-0">
            <span className="w-8 h-8 rounded-full border-2 border-[#C9A24A]" />
            <span className="font-bold text-white text-[20px] tracking-tight">ORBELO</span>
            <span className="text-[12px] text-[#A8B3C2] border border-white/20 px-2 py-0.5 rounded-md tracking-wide">CURATOR</span>
          </Link>
          <div className="flex items-center gap-1 overflow-x-auto">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 h-[72px] flex items-center text-[16px] whitespace-nowrap border-b-2 transition-colors ${
                  isActive(item) ? "text-white border-[#C9A24A]" : "text-[#A8B3C2] border-transparent hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[15px] text-[#C7D0DC] shrink-0">
          <Link href="/agent/tokens" className="hover:text-white">
            Tokens <span className="text-[#C9A24A] font-bold text-[17px]">{me ? me.tokens : "–"}</span>
          </Link>
          <span className="text-[#5F6E82]">·</span>
          <div className="relative">
            <button type="button" onClick={() => setShowUserMenu(!showUserMenu)} className="hover:text-white">
              {name}
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-3 w-56 bg-[#111A27] border border-[#1E2A3B] rounded-xl shadow-2xl py-1.5 z-50">
                <div className="px-4 py-2.5 border-b border-white/10">
                  <p className="text-[13px] font-semibold text-white truncate m-0">{name}</p>
                  <p className="text-[12px] text-[#93A1B5] truncate m-0">{currentUser?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    if (logout) logout();
                  }}
                  className="w-full text-left px-4 py-2.5 text-[13px] text-[#F08C8C] hover:bg-white/5"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1240px] px-6 lg:px-8 py-10">{children}</main>

      <DocumentViewerModal />
      <TokenSubscriptionModal />
    </div>
  );
}
