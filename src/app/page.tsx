"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import AppShell from "@/components/layout/AppShell";
import AgentShell from "@/components/agent/AgentShell";
import AgentRequestsListView from "@/components/agent/AgentRequestsListView";

// Admin Views
import OperationsOverview from "@/components/admin/OperationsOverview";
import BookingsView from "@/components/admin/BookingsView";
import QuotesView from "@/components/admin/QuotesView";
import GenerateQuoteView from "@/components/admin/GenerateQuoteView";
import GenerateBriefView from "@/components/admin/GenerateBriefView";
import GenerateInvoiceView from "@/components/admin/GenerateInvoiceView";
import GenerateContractView from "@/components/admin/GenerateContractView";
import InvoicesView from "@/components/admin/InvoicesView";
import ContractsListView from "@/components/admin/ContractsListView";
import FlightBriefsListView from "@/components/admin/FlightBriefsListView";
import AgentRequestsQueueView from "@/components/admin/AgentRequestsQueueView";
import AccountsView from "@/components/admin/AccountsView";
import ContactsView from "@/components/admin/ContactsView";
import AgentsView from "@/components/admin/AgentsView";
import AirportsView from "@/components/admin/AirportsView";
import ClientsView from "@/components/admin/ClientsView";
import FleetView from "@/components/admin/FleetView";
import OperatorsView from "@/components/admin/OperatorsView";
import AuditLogView from "@/components/admin/AuditLogView";
import PaymentsView from "@/components/admin/PaymentsView";
import ClientPortalView from "@/components/admin/ClientPortalView";
import NotificationSettingsView from "@/components/admin/NotificationSettingsView";
import UserManagementView from "@/components/admin/UserManagementView";
import SettingsView from "@/components/admin/SettingsView";

// Agent Views
import AgentOverviewView from "@/components/agent/AgentOverviewView";
import AgentRequestQuoteView from "@/components/agent/AgentRequestQuoteView";
import AgentRequestBriefView from "@/components/agent/AgentRequestBriefView";
import AgentRequestInvoiceView from "@/components/agent/AgentRequestInvoiceView";


// Profile & Messages
import ProfileView from "@/components/profile/ProfileView";
import MessagesView from "@/components/messages/MessagesView";

export default function Home() {
  const { role, activeNav } = useAviation();
  const router = useRouter();

  useEffect(() => {
    if (role === "agent") {
      router.replace("/agent/requests");
    }
  }, [role, router]);

  if (role === "agent") {
    return (
      <AgentShell>
        <AgentRequestsListView />
      </AgentShell>
    );
  }

  // Render view content based on activeNav for staff roles
  const renderContent = () => {
    switch (activeNav) {
      case "overview":
        return <OperationsOverview />;
      case "bookings":
        return <BookingsView />;
      case "quotes":
      case "generate_quote":
        return <QuotesView />;
      case "flight_briefs":
        return <FlightBriefsListView />;
      case "generate_brief":
        return <GenerateBriefView />;
      case "invoices":
        return <InvoicesView />;
      case "generate_invoice":
        return <GenerateInvoiceView />;
      case "contracts":
        return <ContractsListView />;
      case "generate_contract":
        return <GenerateContractView />;
      case "accounts":
        return <AccountsView />;
      case "contacts":
        return <ContactsView />;
      case "agents":
        return <AgentsView />;
      case "operators":
        return <OperatorsView />;
      case "airports":
        return <AirportsView />;
      case "agent_requests":
      case "sourcing":
        return <AgentRequestsQueueView />;
      case "payments":
        return <PaymentsView />;
      case "clients":
        return <AccountsView />;
      case "fleet":
      case "aircraft_types":
        return <FleetView />;
      case "activities":
      case "audit_log":
        return <AuditLogView />;
      case "users":
      case "user_management":
        return <UserManagementView />;
      case "settings":
        return <SettingsView />;
      case "client_portal":
        return <ClientPortalView />;
      case "notifications":
        return <NotificationSettingsView />;
      case "messages":
        return <MessagesView />;
      case "profile":
        return <ProfileView />;
      default:
        return role === "finance" ? <PaymentsView /> : <OperationsOverview />;
    }
  };

  return <AppShell>{renderContent()}</AppShell>;
}
