"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import QuotesView from "@/components/admin/QuotesView";

export default function QuotesPage() {
  return (
    <AppShell navKey="quotes">
      <QuotesView />
    </AppShell>
  );
}
