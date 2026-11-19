"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import LoginScreen from "@/components/auth/LoginScreen";
import Sidebar from "@/components/layout/Sidebar";
import TopHeader from "@/components/layout/TopHeader";
import DocumentViewerModal from "@/components/documents/DocumentViewerModal";
import ChecklistDrawer from "@/components/checklist/ChecklistDrawer";
import NewQuoteModal from "@/components/quotes/NewQuoteModal";
import BookingDetailDrawer from "@/components/bookings/BookingDetailDrawer";
import TokenSubscriptionModal from "@/components/tokens/TokenSubscriptionModal";
import AgentShell from "@/components/agent/AgentShell";
import AgentRequestsListView from "@/components/agent/AgentRequestsListView";

interface AppShellProps {
  children: React.ReactNode;
  navKey?: string;
}

export default function AppShell({ children, navKey }: AppShellProps) {
  const { isAuthenticated, setActiveNav, role, activeNav } = useAviation();
  const router = useRouter();

  useEffect(() => {
    if (navKey) {
      setActiveNav(navKey);
    }
  }, [navKey, setActiveNav]);

  useEffect(() => {
    if (isAuthenticated && role === "agent") {
      router.replace("/agent/requests");
    }
  }, [isAuthenticated, role, router]);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (role === "agent") {
    return (
      <AgentShell>
        <AgentRequestsListView />
      </AgentShell>
    );
  }

  const effectiveNav = navKey || activeNav;
  const isModernCleanPage = [
    "agent_requests",
    "requests",
    "accounts",
    "contacts",
    "agents",
    "operators",
    "aircraft_types",
    "fleet",
    "airports"
  ].includes(effectiveNav);

  if (isModernCleanPage) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] text-gray-900 flex font-sans antialiased">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden bg-[#F8F9FA]">
          <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>

        {/* Global Modals & Drawers */}
        <DocumentViewerModal />
        <BookingDetailDrawer />
        <ChecklistDrawer />
        <NewQuoteModal />
        <TokenSubscriptionModal />
      </div>
    );
  }

  return (
    <div
      data-theme="light"
      className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex font-sans"
    >
      {/* Sidebar */}
      <Sidebar />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        <TopHeader />

        <main className="flex-1 p-5 sm:p-7 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Global Footer (No claims per Section 02) */}
        <footer className="border-t border-[var(--line)] bg-[var(--card)] py-4 px-6 text-xs text-[var(--muted)]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-[#FF6B00]">
                Orbelo
              </span>
              <span>• Executive Private Jet Aviation Operations</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-[var(--green)] font-bold">
                <span className="h-2 w-2 rounded-full bg-[var(--green)] animate-pulse" />
                OPS Engine 2.4 Active
              </span>
              <span>Session Authenticated</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Global Modals & Drawers */}
      <DocumentViewerModal />
      <BookingDetailDrawer />
      <ChecklistDrawer />
      <NewQuoteModal />
      <TokenSubscriptionModal />
    </div>
  );
}
