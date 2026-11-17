"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import FlightBriefsListView from "@/components/admin/FlightBriefsListView";

export default function FlightBriefsPage() {
  return (
    <AppShell navKey="flight_briefs">
      <FlightBriefsListView />
    </AppShell>
  );
}
