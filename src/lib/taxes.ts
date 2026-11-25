/**
 * Taxes (R-091). OrbAero contracts as principal: on a domestic leg the tax is charged on the leg's full
 * charter price (margins included). There is no tax on commission, and margins never print.
 *
 * Tax is decided leg by leg from the departure and arrival countries:
 *  - a domestic leg uses that country's row(s)
 *  - an international leg uses the exempt row and prints its wording
 * Every document line carries a tax code: charter and passenger fees follow their leg, ground transport
 * uses the country where it runs, a helicopter transfer counts as a flight leg, custom lines choose their own.
 * A row "to confirm" is never used on a live document.
 */

export interface TaxRule {
  code: string;
  jurisdiction: string;
  type: "VAT" | "US_FET" | "EXEMPT" | "OUTSIDE_SCOPE";
  appliesTo: "domestic" | "international" | "segment" | "any";
  rateType: "percent" | "per_pax";
  rate: number;
  currency?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  wording?: string;
  status: "confirmed" | "to_confirm";
  source?: string;
  notes?: string;
  history?: { at: string; by: string; what: string }[];
}

/** A priced line of the quote, as the documents print it. */
export interface TaxableLine {
  key: string;
  label: string;
  kind: "charter" | "passenger_fee" | "ground" | "helicopter" | "service";
  legNumber?: number;
  /** Country the line is taxed in (ground transport, helicopter) */
  country?: string;
  /** Departure and arrival countries of the leg */
  from?: string;
  to?: string;
  amount: number;
  pax?: number;
  date?: string;
}

export interface TaxLine {
  key: string;
  label: string;
  kind: TaxableLine["kind"];
  legNumber?: number;
  base: number;
  /** Codes applied (a US domestic leg can carry the percent and the segment rows) */
  codes: string[];
  /** What the rule found, for the price step */
  rule: string;
  amount: number;
  /** Rows "to confirm" this line would need: nothing is charged for them until they are confirmed */
  pending: string[];
  overridden?: boolean;
}

export interface TaxSummaryLine {
  label: string;
  jurisdiction: string;
  rateLabel: string;
  amount: number;
  wording: string;
}

const ALIASES: Record<string, string> = {
  us: "united states",
  usa: "united states",
  "united states of america": "united states",
  uk: "united kingdom",
  gb: "united kingdom",
  "great britain": "united kingdom",
  england: "united kingdom",
  scotland: "united kingdom",
  ch: "switzerland",
  fr: "france",
  de: "germany",
  at: "austria",
  it: "italy",
  es: "spain",
  mt: "malta",
  ng: "nigeria",
  ae: "united arab emirates",
  uae: "united arab emirates"
};

export const normCountry = (c?: string) => {
  const k = String(c || "").trim().toLowerCase();
  return ALIASES[k] || k;
};

export const countryOf = (airport: any): string => normCountry(airport?.country || airport?.countryName || airport?.iso_country);

const inForce = (r: TaxRule, date?: string) => {
  const d = String(date || new Date().toISOString()).slice(0, 10);
  if (r.effectiveFrom && d < r.effectiveFrom) return false;
  if (r.effectiveTo && d > r.effectiveTo) return false;
  return true;
};

export const rateLabel = (r: TaxRule) =>
  r.rateType === "per_pax" ? `${r.currency ? `${r.currency} ` : ""}${r.rate} per passenger` : `${r.rate} %`;

/** Exempt row for international legs (the confirmed one in force). */
export function exemptRule(rules: TaxRule[], date?: string): TaxRule | undefined {
  return rules.find((r) => r.type === "EXEMPT" && r.appliesTo === "international" && r.status === "confirmed" && inForce(r, date));
}
export function outOfScopeRule(rules: TaxRule[]): TaxRule | undefined {
  return rules.find((r) => r.type === "OUTSIDE_SCOPE" && r.status === "confirmed");
}

/** Rows a domestic line in this country would use, in force on the date. */
function domesticRows(rules: TaxRule[], country: string, date: string | undefined, kind: TaxableLine["kind"]) {
  return rules.filter(
    (r) =>
      normCountry(r.jurisdiction) === country &&
      (r.appliesTo === "domestic" || (r.appliesTo === "segment" && (kind === "charter" || kind === "helicopter"))) &&
      inForce(r, date) &&
      r.type !== "EXEMPT" &&
      r.type !== "OUTSIDE_SCOPE"
  );
}

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

function taxFor(rows: TaxRule[], base: number, pax: number) {
  return round2(rows.reduce((s, r) => s + (r.rateType === "per_pax" ? (Number(r.rate) || 0) * (pax || 0) : (base * (Number(r.rate) || 0)) / 100), 0));
}

/**
 * The tax of every line. `overrides` maps a line key to the codes chosen with "Change"
 * (["INTL-EXEMPT"], ["OUT-OF-SCOPE"], ["FR-VAT-DOM"], ...).
 */
export function computeTaxes(lines: TaxableLine[], rules: TaxRule[], overrides: Record<string, string[]> = {}): TaxLine[] {
  const byCode = new Map(rules.map((r) => [r.code, r]));
  return lines.map((l) => {
    const base = round2(l.amount);
    const chosen = overrides[l.key];
    if (chosen && chosen.length) {
      const rows = chosen.map((c) => byCode.get(c)).filter(Boolean) as TaxRule[];
      const live = rows.filter((r) => r.status === "confirmed");
      const pending = rows.filter((r) => r.status !== "confirmed").map((r) => r.code);
      const taxable = live.filter((r) => r.type !== "EXEMPT" && r.type !== "OUTSIDE_SCOPE");
      return {
        key: l.key,
        label: l.label,
        kind: l.kind,
        legNumber: l.legNumber,
        base,
        codes: rows.map((r) => r.code),
        rule: `Changed · ${rows.map((r) => `${r.code} (${r.type === "EXEMPT" ? "exempt" : r.type === "OUTSIDE_SCOPE" ? "outside scope" : rateLabel(r)})`).join(" + ") || "—"}`,
        amount: taxFor(taxable, base, l.pax || 0),
        pending,
        overridden: true
      };
    }

    // Where the line is taxed
    let country = "";
    let international = false;
    if (l.kind === "ground") {
      country = normCountry(l.country);
    } else if (l.kind === "service") {
      // Custom lines choose their own code; by default they follow their leg
      international = Boolean(l.from && l.to && normCountry(l.from) !== normCountry(l.to));
      country = international ? "" : normCountry(l.country || l.from);
    } else {
      const from = normCountry(l.from || l.country);
      const to = normCountry(l.to || l.country);
      international = Boolean(from && to && from !== to);
      country = international ? "" : from || to;
    }

    if (international || !country) {
      const ex = international ? exemptRule(rules, l.date) : outOfScopeRule(rules);
      return {
        key: l.key,
        label: l.label,
        kind: l.kind,
        legNumber: l.legNumber,
        base,
        codes: ex ? [ex.code] : [],
        rule: international ? `International · ${ex ? "exempt" : "no exempt row"}` : "No country · outside scope",
        amount: 0,
        pending: ex ? [] : [international ? "INTL-EXEMPT" : "OUT-OF-SCOPE"]
      };
    }

    const rows = domesticRows(rules, country, l.date, l.kind);
    const live = rows.filter((r) => r.status === "confirmed");
    const pending = rows.filter((r) => r.status !== "confirmed").map((r) => r.code);
    const place = country.replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      key: l.key,
      label: l.label,
      kind: l.kind,
      legNumber: l.legNumber,
      base,
      codes: rows.map((r) => r.code),
      rule: rows.length
        ? `Domestic ${place} · ${rows.map((r) => `${r.code} ${rateLabel(r)}${r.status !== "confirmed" ? " (to confirm)" : ""}`).join(" + ")}`
        : `Domestic ${place} · no row in Settings`,
      amount: taxFor(live, base, l.pax || 0),
      pending: rows.length ? pending : [`${place} (no row)`]
    };
  });
}

/** One document line per country and rate, plus the exemption wording. */
export function summarizeTaxes(taxLines: TaxLine[], rules: TaxRule[], lines: TaxableLine[]): { lines: TaxSummaryLine[]; wordings: string[]; total: number } {
  const byCode = new Map(rules.map((r) => [r.code, r]));
  const groups = new Map<string, TaxSummaryLine>();
  const wordings = new Set<string>();
  taxLines.forEach((t) => {
    const src = lines.find((l) => l.key === t.key);
    t.codes.forEach((code) => {
      const r = byCode.get(code);
      if (!r) return;
      if (r.type === "EXEMPT" || r.type === "OUTSIDE_SCOPE") {
        if (r.wording) wordings.add(r.wording);
        return;
      }
      if (r.status !== "confirmed") return;
      const amount =
        r.rateType === "per_pax" ? round2((Number(r.rate) || 0) * (src?.pax || 0)) : round2((t.base * (Number(r.rate) || 0)) / 100);
      const key = `${normCountry(r.jurisdiction)}|${r.type}|${r.rateType}|${r.rate}`;
      const g = groups.get(key);
      const name = r.type === "US_FET" ? (r.rateType === "per_pax" ? "US segment fee" : "US federal excise tax") : `VAT ${r.jurisdiction}`;
      if (g) g.amount = round2(g.amount + amount);
      else groups.set(key, { label: name, jurisdiction: r.jurisdiction, rateLabel: rateLabel(r), amount, wording: r.wording || "" });
    });
  });
  const out = Array.from(groups.values()).filter((g) => g.amount > 0);
  out.forEach((g) => g.wording && wordings.add(g.wording));
  // Keep each line's own tax exact: the summary equals the sum of the line taxes
  const total = round2(taxLines.reduce((s, t) => s + t.amount, 0));
  const sum = round2(out.reduce((s, g) => s + g.amount, 0));
  if (out.length && Math.abs(sum - total) >= 0.01) out[out.length - 1].amount = round2(out[out.length - 1].amount + (total - sum));
  return { lines: out, wordings: Array.from(wordings), total };
}
