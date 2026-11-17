"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import InvoicesView from "@/components/admin/InvoicesView";

export default function InvoicesPage() {
  return (
    <AppShell navKey="invoices">
      <InvoicesView />
    </AppShell>
  );
}
