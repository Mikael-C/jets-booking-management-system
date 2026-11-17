"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import TripPageShell, { TripTabKey } from "@/components/trip/TripPageShell";

interface TripTabPageProps {
  params: {
    tripId: string;
    tab: string;
  };
}

export default function TripTabPage({ params }: TripTabPageProps) {
  const tabKey = (params.tab || "itinerary") as TripTabKey;

  return (
    <AppShell navKey="quotes">
      <TripPageShell tripId={params.tripId} initialTab={tabKey} />
    </AppShell>
  );
}
