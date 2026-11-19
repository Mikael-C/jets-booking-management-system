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
  const isBooking = params.id.toLowerCase().startsWith("booking-");
  return (
    <AppShell navKey={isBooking ? "bookings" : "quotes"}>
      <QuoteBuilderView reviseTripId={params.id} mode={isBooking ? "booking" : "quote"} />
    </AppShell>
  );
}
