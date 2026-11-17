"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import SettingsView from "@/components/admin/SettingsView";

export default function SettingsPage() {
  return (
    <AppShell navKey="settings">
      <SettingsView />
    </AppShell>
  );
}
