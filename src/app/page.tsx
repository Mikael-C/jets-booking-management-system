"use client";

import React from "react";
import { useAviation } from "@/lib/aviationContext";
import LoginScreen from "@/components/auth/LoginScreen";
import Sidebar from "@/components/layout/Sidebar";
import TopHeader from "@/components/layout/TopHeader";
import DocumentViewerModal from "@/components/documents/DocumentViewerModal";
import ChecklistDrawer from "@/components/checklist/ChecklistDrawer";
import NewQuoteModal from "@/components/quotes/NewQuoteModal";
import BookingDetailDrawer from "@/components/bookings/BookingDetailDrawer";

// Admin Views
import OperationsOverview from "@/components/admin/OperationsOverview";
import BookingsView from "@/components/admin/BookingsView";
import GenerateQuoteView from "@/components/admin/GenerateQuoteView";
import GenerateBriefView from "@/components/admin/GenerateBriefView";
import GenerateInvoiceView from "@/components/admin/GenerateInvoiceView";
import AgentRequestsQueueView from "@/components/admin/AgentRequestsQueueView";
import ClientsView from "@/components/admin/ClientsView";
import FleetView from "@/components/admin/FleetView";

// Agent Views
import AgentOverviewView from "@/components/agent/AgentOverviewView";
import AgentRequestQuoteView from "@/components/agent/AgentRequestQuoteView";
import AgentRequestBriefView from "@/components/agent/AgentRequestBriefView";
import AgentRequestInvoiceView from "@/components/agent/AgentRequestInvoiceView";
import AgentRequestsListView from "@/components/agent/AgentRequestsListView";

export default function Home() {
  const { isAuthenticated, role, activeNav } = useAviation();

  // If user is not authenticated, show luxury Login Screen
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Render view content based on role and activeNav
  const renderContent = () => {
    if (role === "admin") {
      switch (activeNav) {
        case "overview":
          return <OperationsOverview />;
        case "bookings":
          return <BookingsView />;
        case "generate_quote":
          return <GenerateQuoteView />;
        case "generate_brief":
          return <GenerateBriefView />;
        case "generate_invoice":
          return <GenerateInvoiceView />;
        case "agent_requests":
          return <AgentRequestsQueueView />;
        case "clients":
          return <ClientsView />;
        case "fleet":
          return <FleetView />;
        default:
          return <BookingsView />;
      }
    } else {
      // Agent role
      switch (activeNav) {
        case "agent_overview":
          return <AgentOverviewView />;
        case "request_quote":
          return <AgentRequestQuoteView />;
        case "request_brief":
          return <AgentRequestBriefView />;
        case "request_invoice":
          return <AgentRequestInvoiceView />;
        case "my_requests":
          return <AgentRequestsListView />;
        case "clients":
          return <ClientsView />;
        default:
          return <AgentRequestQuoteView />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2EC] text-[#0F1420] flex font-sans selection:bg-[#C9A052] selection:text-[#0F1420]">
      {/* Side Navigation Bar in Navy #0F1420 */}
      <Sidebar />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header */}
        <TopHeader />

        {/* Dynamic Workspace Section */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {renderContent()}
        </main>

        {/* Global Footer */}
        <footer className="border-t border-[#E0DAD0] bg-[#EDE9DF] py-5 px-6 text-xs text-[#0F1420]/60">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className="font-bold text-sm tracking-tight"
                style={{ color: "#FF6B00" }}
              >
                Orbelo
              </span>
              <span>• Executive Private Jet Aviation Operations & Fleet Management</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                OPS Engine 2.4 Active
              </span>
              <span>Austrian Law & Linz Court Applicable</span>
              <span>EASA Part-CAT Compliant</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Global Modals & Drawers */}
      <DocumentViewerModal />
      <BookingDetailDrawer />
      <ChecklistDrawer />
      <NewQuoteModal />
    </div>
  );
}
