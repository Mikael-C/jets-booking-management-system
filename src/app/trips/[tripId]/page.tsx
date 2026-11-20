"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import TripPageShell from "@/components/trip/TripPageShell";

interface TripPageProps {
  params: {
    tripId: string;
  };
}

export default function TripPage({ params }: TripPageProps) {
  return (
    <AppShell navKey="bookings">
      <TripPageShell tripId={params.tripId} initialTab="messages" />
    </AppShell>
  );
}
