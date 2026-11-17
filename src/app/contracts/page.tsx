"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import ContractsListView from "@/components/admin/ContractsListView";

export default function ContractsPage() {
  return (
    <AppShell navKey="contracts">
      <ContractsListView />
    </AppShell>
  );
}
