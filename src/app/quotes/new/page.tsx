"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import QuoteBuilderView from "@/components/quotes/QuoteBuilderView";

export default function NewQuotePage() {
  return (
    <AppShell navKey="quotes">
      <QuoteBuilderView />
    </AppShell>
  );
}
