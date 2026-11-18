"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import ProfileView from "@/components/profile/ProfileView";

export default function ProfilePage() {
  return (
    <AppShell navKey="profile">
      <ProfileView />
    </AppShell>
  );
}
