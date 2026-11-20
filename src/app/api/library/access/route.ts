import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

let accessMatrix = [
  {
    code: "OPS-MAN",
    title: "Operations Manual",
    md: "Edit",
    dutyOfficer: "View + download",
    finance: "View + download",
    salesDesk: "View + download",
    curatorFounding: "—",
    curatorStandard: "—",
    operatorExternal: "—",
  },
  {
    code: "POL-C1",
    title: "Brokerage terms (client)",
    md: "Edit",
    dutyOfficer: "View + download",
    finance: "View + download",
    salesDesk: "View + download",
    curatorFounding: "—",
    curatorStandard: "—",
    operatorExternal: "—",
  },
  {
    code: "POL-C2",
    title: "Charter agreement (template)",
    md: "Edit",
    dutyOfficer: "View + download",
    finance: "View + download",
    salesDesk: "View + download",
    curatorFounding: "—",
    curatorStandard: "—",
    operatorExternal: "—",
  },
  {
    code: "POL-D1",
    title: "Operator framework agreement",
    md: "Edit",
    dutyOfficer: "View + download",
    finance: "—",
    salesDesk: "—",
    curatorFounding: "—",
    curatorStandard: "—",
    operatorExternal: "Own signed copy",
  },
  {
    code: "POL-E2",
    title: "Curator agreement",
    md: "Edit",
    dutyOfficer: "—",
    finance: "—",
    salesDesk: "—",
    curatorFounding: "Own signed copy",
    curatorStandard: "Own signed copy",
    operatorExternal: "—",
  },
  {
    code: "POL-E3",
    title: "Curator code of conduct",
    md: "Edit",
    dutyOfficer: "View + download",
    finance: "View + download",
    salesDesk: "View + download",
    curatorFounding: "View + download",
    curatorStandard: "View + download",
    operatorExternal: "—",
  },
  {
    code: "POL-F1",
    title: "KYC and AML policy",
    md: "Edit",
    dutyOfficer: "View + download",
    finance: "View + download",
    salesDesk: "—",
    curatorFounding: "—",
    curatorStandard: "—",
    operatorExternal: "—",
  },
  {
    code: "POL-F3",
    title: "Data protection policy",
    md: "Edit",
    dutyOfficer: "View + download",
    finance: "View + download",
    salesDesk: "View + download",
    curatorFounding: "—",
    curatorStandard: "—",
    operatorExternal: "—",
  },
  {
    code: "POL-G1",
    title: "Invoicing and VAT",
    md: "Edit",
    dutyOfficer: "—",
    finance: "View + download",
    salesDesk: "—",
    curatorFounding: "—",
    curatorStandard: "—",
    operatorExternal: "—",
  },
  {
    code: "MKT-01",
    title: "Curator sales kit",
    md: "Edit",
    dutyOfficer: "View + download",
    finance: "—",
    salesDesk: "View + download",
    curatorFounding: "View + download",
    curatorStandard: "View + download",
    operatorExternal: "—",
  },
  {
    code: "EMR-01",
    title: "Emergency checklist",
    md: "Edit",
    dutyOfficer: "View + download",
    finance: "—",
    salesDesk: "—",
    curatorFounding: "—",
    curatorStandard: "—",
    operatorExternal: "—",
  },
];

let exceptions = [
  {
    id: "exc-1",
    personName: "Ada N. (new duty officer)",
    personRole: "Duty officer",
    exception: "Invoicing and VAT · view",
    grantedBy: "Obi (MD)",
    until: "31 Jan 2027",
  },
  {
    id: "exc-2",
    personName: "Curator No. 03",
    personRole: "Curator (founding)",
    exception: "Operations Manual · section 7 only",
    grantedBy: "Obi (MD)",
    until: "No end",
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      matrix: accessMatrix,
      exceptions,
    },
  });
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (Array.isArray(body.matrix)) {
    accessMatrix = body.matrix;
  }
  return NextResponse.json({ success: true, message: "Access rules saved successfully" });
}
