"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import QuoteBuilderView from "@/components/quotes/QuoteBuilderView";

interface ReviseQuotePageProps {
  params: {
    id: string;
  };
}

export default function ReviseQuotePage({ params }: ReviseQuotePageProps) {
  return (
    <AppShell navKey="quotes">
      <QuoteBuilderView reviseTripId={params.id} />
    </AppShell>
  );
}
