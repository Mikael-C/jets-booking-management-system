"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import FlightWatchView from "@/components/admin/FlightWatchView";

export default function FlightWatchPage() {
  return (
    <AppShell navKey="flight_watch">
      <FlightWatchView />
    </AppShell>
  );
}
