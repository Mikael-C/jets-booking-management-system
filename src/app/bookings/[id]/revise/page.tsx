"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import QuoteBuilderView from "@/components/quotes/QuoteBuilderView";

interface ReviseBookingPageProps {
  params: {
    id: string;
  };
}

export default function ReviseBookingPage({ params }: ReviseBookingPageProps) {
  return (
    <AppShell navKey="bookings">
      <QuoteBuilderView reviseTripId={params.id} mode="booking" />
    </AppShell>
  );
}
