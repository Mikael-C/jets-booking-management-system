"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import ContactsView from "@/components/admin/ContactsView";

interface ContactPageProps {
  params: {
    id: string;
  };
}

export default function ContactDetailPage({ params }: ContactPageProps) {
  return (
    <AppShell navKey="contacts">
      <ContactsView selectedContactId={params.id} />
    </AppShell>
  );
}
