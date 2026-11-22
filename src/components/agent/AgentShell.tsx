"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import LoginScreen from "@/components/auth/LoginScreen";
import DocumentViewerModal from "@/components/documents/DocumentViewerModal";
import TokenSubscriptionModal from "@/components/tokens/TokenSubscriptionModal";

export default function AgentShell({ children }: { children: React.ReactNode }) {
  const { currentUser, tokenBalance, isAuthenticated, logout } = useAviation();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const navItems = [
    { label: "New request", href: "/agent/requests/new" },
    { label: "My requests", href: "/agent/requests" },
    { label: "My trips", href: "/agent/trips" },
    { label: "My clients", href: "/agent/clients" },
    { label: "Tokens", href: "/agent/tokens" },
  ];

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/agent/requests/new" &&
      pathname.startsWith(href) &&
      href !== "/agent/requests");

  const isWizard = pathname === "/agent/requests/new";

  return (
    <div className="min-h-screen bg-[#0F1420] text-white">
      {/* Top Nav */}
      <nav className="bg-[#0F1420] border-b border-white/10 px-6 py-0 flex items-center justify-between h-14 sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <Link href="/agent/requests" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="w-5 h-5 rounded-full border-2 border-[#C9A052] flex items-center justify-center" />
            <span className="font-bold text-white text-sm tracking-wide">ORBELO</span>
            <span className="text-[10px] uppercase font-bold text-[#C9A052] bg-white/5 border border-[#C9A052]/30 px-1.5 py-0.5 rounded tracking-wider">
              CURATOR
            </span>
          </Link>

          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-4 text-sm transition-colors border-b-2 font-medium ${
                  isActive(item.href)
                    ? "text-white border-[#C9A052]"
                    : "text-gray-400 border-transparent hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Link
            href="/agent/tokens"
            className="hover:text-white transition-colors"
          >
            Tokens <span className="text-white font-bold">{tokenBalance}</span>
          </Link>
          <span className="text-gray-500">·</span>
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="text-white hover:text-gray-200 transition-colors flex items-center gap-1.5 font-medium"
            >
              <span>{currentUser?.name || "Marcus Vance"}</span>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#141C2E] border border-white/20 rounded-lg shadow-2xl py-1.5 z-50">
                <div className="px-3.5 py-2 border-b border-white/10">
                  <p className="text-xs font-semibold text-white truncate">{currentUser?.name || "Marcus Vance"}</p>
                  <p className="text-[11px] text-gray-400 truncate">{currentUser?.email || "agent@orbelo.com"}</p>
                </div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    if (logout) logout();
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-red-400 hover:bg-white/5 transition-colors font-medium"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className={`mx-auto ${isWizard ? "max-w-[1400px] px-6 py-6" : "max-w-6xl px-6 py-8"}`}>
        {children}
      </main>

      {/* Global Modals */}
      <DocumentViewerModal />
      <TokenSubscriptionModal />
    </div>
  );
}
