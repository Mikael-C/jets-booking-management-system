"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import BookingsView from "@/components/admin/BookingsView";

export default function BookingsPage() {
  return (
    <AppShell navKey="bookings">
      <BookingsView />
    </AppShell>
  );
}
