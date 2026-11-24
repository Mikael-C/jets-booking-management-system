export interface FinancialHealthMetric {
  amount: number;
  count?: number;
  label?: string;
  link: string;
  month?: string;
  comparePct?: number;
  compareText?: string;
  avgMarginPct?: number;
}

export interface FinancialHealthData {
  unpaid: FinancialHealthMetric;
  overdue: FinancialHealthMetric;
  received: FinancialHealthMetric;
  companyMargin: FinancialHealthMetric;
  curatorPayoutsDue: FinancialHealthMetric;
}

export interface FlightItem {
  id: string;
  time: string;
  code: string;
  route: string;
  leg?: string;
  aircraft: string;
  status: string;
  badgeText: string;
  badgeVariant: "green" | "slate" | "amber" | "rose";
  tripId: string;
  dateGroup: "today" | "next_24h";
  dateLabel: string;
}

export interface NeedsActionItem {
  id: string;
  urgency: string;
  badgeVariant: "rose" | "amber" | "blue";
  title: string;
  code: string;
  linkText: string;
  linkUrl: string;
  isMine: boolean;
  category: string;
  curator?: string;
}

export interface BoardCardItem {
  id: string;
  code: string;
  route: string;
  details: string;
  badge: string | null;
  badgeVariant: "rose" | "sky" | "amber" | "green" | "peach" | null;
  stage: "request" | "sourcing" | "quoted" | "booked" | "confirmed" | "flown_close";
  curator: string;
  isMine: boolean;
  needsAction: boolean;
  departingIn7Days: boolean;
  linkUrl: string;
  order?: number;
}

export const defaultFinancialHealth: FinancialHealthData = {
  unpaid: {
    amount: 48250,
    count: 3,
    label: "3 invoices",
    link: "/payments?filter=unpaid"
  },
  overdue: {
    amount: 8000,
    count: 1,
    label: "1 · due 48 h before flight",
    link: "/payments?filter=overdue"
  },
  received: {
    amount: 212640,
    month: "NOV",
    comparePct: 18,
    compareText: "+18 % vs Oct",
    link: "/payments"
  },
  companyMargin: {
    amount: 17920,
    month: "NOV",
    avgMarginPct: 9.4,
    compareText: "average 9.4 %",
    link: "/payments"
  },
  curatorPayoutsDue: {
    amount: 4310,
    count: 2,
    label: "2 Curators · next 18 Nov",
    link: "/curators"
  }
};

export const defaultFlights: FlightItem[] = [
  {
    id: "fl-1",
    time: "09:30",
    code: "TRI - NK1188",
    route: "LFMN → LSGG",
    leg: "leg 1",
    aircraft: "Challenger 650",
    status: "landed",
    badgeText: "Landed 10:38",
    badgeVariant: "green",
    tripId: "NK1188",
    dateGroup: "today",
    dateLabel: "Tue 17 Nov"
  },
  {
    id: "fl-2",
    time: "11:15",
    code: "TRI - WS0193",
    route: "EGLF → LIRA",
    leg: "",
    aircraft: "Citation XLS+",
    status: "airborne",
    badgeText: "Airborne - ETA 14:20",
    badgeVariant: "slate",
    tripId: "WS0193",
    dateGroup: "today",
    dateLabel: "Tue 17 Nov"
  },
  {
    id: "fl-3",
    time: "15:00",
    code: "TRI - NK1188",
    route: "LSGG → DNAA",
    leg: "leg 2",
    aircraft: "Challenger 650",
    status: "fbo_overridden",
    badgeText: "FBO after hours · overridden",
    badgeVariant: "amber",
    tripId: "NK1188",
    dateGroup: "today",
    dateLabel: "Tue 17 Nov"
  },
  {
    id: "fl-4",
    time: "18:40",
    code: "TRI - TB7710",
    route: "OMDB → DNMM",
    leg: "",
    aircraft: "Legacy 600",
    status: "delayed",
    badgeText: "Delayed 35 m",
    badgeVariant: "rose",
    tripId: "TB7710",
    dateGroup: "today",
    dateLabel: "Tue 17 Nov"
  },
  {
    id: "fl-5",
    time: "07:00",
    code: "TRI - AK5562",
    route: "DNAA → FAOR",
    leg: "",
    aircraft: "Global 6000",
    status: "slot_pending",
    badgeText: "Slot pending",
    badgeVariant: "amber",
    tripId: "AK5562",
    dateGroup: "next_24h",
    dateLabel: "Wed 18 Nov · next 24 h"
  },
  {
    id: "fl-6",
    time: "10:30",
    code: "TRI - PT1204",
    route: "LEMD → EGLF",
    leg: "",
    aircraft: "Phenom 300E",
    status: "brief_sent",
    badgeText: "Brief sent",
    badgeVariant: "green",
    tripId: "PT1204",
    dateGroup: "next_24h",
    dateLabel: "Wed 18 Nov · next 24 h"
  }
];

export const defaultNeedsAction: NeedsActionItem[] = [
  {
    id: "na-1",
    urgency: "40 m late",
    badgeVariant: "rose",
    title: "New request, start sourcing · REQ - KN4410",
    code: "REQ - KN4410",
    linkText: "Request →",
    linkUrl: "/requests/KN4410",
    isMine: false,
    category: "request",
    curator: "T. Bello"
  },
  {
    id: "na-2",
    urgency: "today",
    badgeVariant: "rose",
    title: "2 passports missing · TRI - FE4578",
    code: "TRI - FE4578",
    linkText: "Passengers →",
    linkUrl: "/trips/FE4578/passengers",
    isMine: true,
    category: "passengers",
    curator: "Mine"
  },
  {
    id: "na-3",
    urgency: "in 2 h",
    badgeVariant: "amber",
    title: "Wire proof uploaded, confirm receipt · TRI - FE4578",
    code: "TRI - FE4578",
    linkText: "Payments →",
    linkUrl: "/trips/FE4578/accounting",
    isMine: true,
    category: "payments",
    curator: "Mine"
  },
  {
    id: "na-4",
    urgency: "in 3 h",
    badgeVariant: "amber",
    title: "Quote expires · QUO - RB3310 002",
    code: "QUO - RB3310 002",
    linkText: "Quote →",
    linkUrl: "/trips/RB3310/pricing",
    isMine: false,
    category: "quote",
    curator: "M. Vance"
  },
  {
    id: "na-5",
    urgency: "in 18 h",
    badgeVariant: "amber",
    title: "Slot LFMN still pending · TRI - AK5562",
    code: "TRI - AK5562",
    linkText: "Itinerary →",
    linkUrl: "/trips/AK5562/itinerary",
    isMine: false,
    category: "itinerary",
    curator: "Operations"
  },
  {
    id: "na-6",
    urgency: "new",
    badgeVariant: "blue",
    title: "Card scan lead · Chidi Nwosu · LEAD - NW7731",
    code: "LEAD - NW7731",
    linkText: "Lead →",
    linkUrl: "/contacts",
    isMine: true,
    category: "lead",
    curator: "Mine"
  }
];

export const initialBoardCardsData: BoardCardItem[] = [
  {
    id: "card-req-1",
    code: "REQ - KN4410",
    route: "DNMM → KTEB",
    details: "02 Dec · Heavy · T. Bello",
    badge: "waiting 40 m",
    badgeVariant: "rose",
    stage: "request",
    curator: "T. Bello",
    isMine: false,
    needsAction: true,
    departingIn7Days: true,
    linkUrl: "/requests/KN4410",
    order: 1
  },
  {
    id: "card-req-2",
    code: "REQ - DS6602",
    route: "DGAA → OMDB",
    details: "28 Nov · Midsize · A. Okafor",
    badge: null,
    badgeVariant: null,
    stage: "request",
    curator: "A. Okafor",
    isMine: false,
    needsAction: false,
    departingIn7Days: true,
    linkUrl: "/requests/DS6602",
    order: 2
  },
  {
    id: "card-src-1",
    code: "QUO - MX5521-001",
    route: "LFPB ⇄ DNAA",
    details: "24 Nov · 2 aircraft · C. Laurent",
    badge: "4 offers in",
    badgeVariant: "sky",
    stage: "sourcing",
    curator: "C. Laurent",
    isMine: false,
    needsAction: false,
    departingIn7Days: true,
    linkUrl: "/requests/MX5521",
    order: 1
  },
  {
    id: "card-quo-1",
    code: "QUO - RB3310-002",
    route: "LFPB → LIML",
    details: "19 Nov · € 14,900 · M. Vance",
    badge: "expires 3 h",
    badgeVariant: "amber",
    stage: "quoted",
    curator: "M. Vance",
    isMine: true,
    needsAction: true,
    departingIn7Days: true,
    linkUrl: "/trips/RB3310/pricing",
    order: 1
  },
  {
    id: "card-quo-2",
    code: "QUO - KD2201-003",
    route: "EGGW → LFMN",
    details: "21 Nov · € 6,930",
    badge: "Curator confirmed",
    badgeVariant: "green",
    stage: "quoted",
    curator: "Mine",
    isMine: true,
    needsAction: false,
    departingIn7Days: true,
    linkUrl: "/trips/KD2201/pricing",
    order: 2
  },
  {
    id: "card-bk-1",
    code: "TRI - FE4578-005",
    route: "LEIB → LSGG",
    details: "20 Nov · € 250 open",
    badge: "2 passports missing",
    badgeVariant: "amber",
    stage: "booked",
    curator: "Mine",
    isMine: true,
    needsAction: true,
    departingIn7Days: true,
    linkUrl: "/trips/FE4578/passengers",
    order: 1
  },
  {
    id: "card-conf-1",
    code: "TRI - NK1188-004",
    route: "LFMN → LSGG → DNAA",
    details: "17 Nov · paid",
    badge: "FBO after hours · overridden",
    badgeVariant: "peach",
    stage: "confirmed",
    curator: "Alexander Vance",
    isMine: false,
    needsAction: true,
    departingIn7Days: true,
    linkUrl: "/trips/NK1188/itinerary",
    order: 1
  },
  {
    id: "card-flown-1",
    code: "TRI - AW0412-003",
    route: "OMDB → DNMM",
    details: "11 Nov · payout 18 Nov",
    badge: null,
    badgeVariant: null,
    stage: "flown_close",
    curator: "Mine",
    isMine: true,
    needsAction: false,
    departingIn7Days: false,
    linkUrl: "/trips/AW0412/accounting",
    order: 1
  }
];
