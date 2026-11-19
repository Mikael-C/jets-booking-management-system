"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AgentShell from "@/components/agent/AgentShell";
import AgentRequestsListView from "@/components/agent/AgentRequestsListView";

export default function AgentOverviewPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/agent/requests");
  }, [router]);

  return (
    <AgentShell>
      <AgentRequestsListView />
    </AgentShell>
  );
}
