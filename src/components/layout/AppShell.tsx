"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import LoginScreen from "@/components/auth/LoginScreen";
import Sidebar from "@/components/layout/Sidebar";
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
