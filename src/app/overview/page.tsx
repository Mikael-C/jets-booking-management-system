"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import OperationsOverview from "@/components/admin/OperationsOverview";

export default function OverviewPage() {
  return (
    <AppShell navKey="overview">
      <OperationsOverview />
    </AppShell>
  );
}
