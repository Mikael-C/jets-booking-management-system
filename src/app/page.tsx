"use client";

import React from "react";
import { useAviation } from "@/lib/aviationContext";
import AppShell from "@/components/layout/AppShell";

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
import AgentRequestsListView from "@/components/agent/AgentRequestsListView";

// Profile & Messages
import ProfileView from "@/components/profile/ProfileView";
import MessagesView from "@/components/messages/MessagesView";

export default function Home() {
  const { role, activeNav } = useAviation();

  // Render view content based on role and activeNav
  const renderContent = () => {
    // Staff roles: super_admin, admin, operations, finance
    if (role !== "agent") {
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
        case "accounts":
          return <AccountsView />;
        case "contacts":
        case "clients":
          return <ContactsView />;
        case "airports":
          return <AirportsView />;
        case "messages":
          return <MessagesView />;
        case "profile":
          return <ProfileView />;
        default:
          return <AgentOverviewView />;
      }
    }
  };

  return <AppShell>{renderContent()}</AppShell>;
}
