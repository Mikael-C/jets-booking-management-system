import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

let curatorConfig = {
  tiers: [
    {
      tier: "Founding",
      handlesTrips: "No",
      requestsRoutedTo: "Desk (default) or chosen Associate",
      monthlyTokens: 10,
      startupTokens: 0,
      expiry: "Month end",
      markupRange: "5–12 %",
      handlingShare: "20 % of mark-up",
    },
    {
      tier: "Patron",
      handlesTrips: "By choice",
      requestsRoutedTo: "Desk, chosen Associate, or self",
      monthlyTokens: 5,
      startupTokens: 0,
      expiry: "Month end",
      markupRange: "5–12 %",
      handlingShare: "20 % of mark-up",
    },
    {
      tier: "Associate",
      handlesTrips: "Yes",
      requestsRoutedTo: "Self; receives assigned leads",
      monthlyTokens: 0,
      startupTokens: 5,
      expiry: "None",
      markupRange: "5–12 %",
      handlingShare: "Earns it when handling",
    },
  ],
  tokenRules: {
    pricePerToken: 15,
    perRequest: "1 token per leg",
    afterSignature: "No further tokens, including changes",
    earnedTokens: "+1 per booking completed or cancelled with fee",
    paidExpiry: "Never",
    bundles: "15 · $200 / 25 · $310 / 50 · $560",
    freeRevisions: "2 before contract signature",
    returnedConditions: "No aircraft found; booking cancelled for operational reasons",
    orderOfUse: "Monthly → free → paid",
    assignedLeads: "No tokens",
  },
  directRoute: {
    bookingDeposit: 500,
    depositTerms: "credited within 30 days; refunded if no aircraft.",
    assignmentRule: "city / rotation / availability",
    standardMarkupPct: 8,
  },
  topUpHistory: [
    {
      curatorId: "CUR-07",
      curatorName: "No. 07",
      tokensAdded: 6,
      grantedBy: "Obi (MD)",
      date: "12 Nov",
    },
  ],
};

export async function GET() {
  return NextResponse.json({ success: true, data: curatorConfig });
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (body.tiers) curatorConfig.tiers = body.tiers;
  if (body.tokenRules) curatorConfig.tokenRules = { ...curatorConfig.tokenRules, ...body.tokenRules };
  if (body.directRoute) curatorConfig.directRoute = { ...curatorConfig.directRoute, ...body.directRoute };

  return NextResponse.json({ success: true, data: curatorConfig, message: "Curator tiers saved successfully" });
}
