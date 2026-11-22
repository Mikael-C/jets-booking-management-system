import { Booking, OperatorDetails } from "@/types/aviation";

export const defaultOperator: OperatorDetails = {
  companyName: "Orbelo Jet Management",
  legalEntity: "Orbelo Private Aviation & Executive Charter Ltd",
  representativeName: "Charter Flight Operations",
  supportEmail: "charter@orbelo.com",
  supportPhone: "+44 20 7946 0920",
  vatNumber: "GB 303 612 155",
  additionalVatNumbers: [
    "CHE-492.810.334 MWST",
    "FR 66 830 821 799",
    "DE 286 551 690",
    "IT 00268829991"
  ],
  bankName: "Barclays Private Aviation Banking (London & Geneva)",
  iban: "GB29 BUKB 2020 1555 9210 44",
  bic: "BUKBGB22",
  accountHolder: "Orbelo Jet Management Ltd",
  commercialRegistry: "UK CAA AOC No. GB-8422 • EASA TCO Certified",
  courtOfJurisdiction: "English Law • Commercial Court of London"
};

/**
 * Clean initial state — all quotes, bookings, invoices, and flight briefs
 * are created dynamically through live operational workflows.
 */
export const initialBookings: Booking[] = [];
