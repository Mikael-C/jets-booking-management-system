/**
 * Orbelo Aviation Management System - ID Generation & Deduplication Engine
 *
 * Requirements:
 * 1. Request IDs: REQ-FE001, REQ-FE002, REQ-FE003...
 * 2. Quotes IDs:  QUO-FE001, QUO-FE002, QUO-FE003...
 * 3. Trip IDs:    TRI-FE001, TRI-FE002, TRI-FE003...
 * 4. All chronologically linked by shared FE token (e.g. FE001).
 * 5. Document IDs:
 *    - Quotation: QUO-FE001
 *    - Commercial Invoice: INV-FE001-01
 *    - Credit Note: CN-FE001-01
 *    - Flight Brief: FB-FE001
 *    - Charter Contract: CTR-FE001-01
 */

import { ContactRecord, AccountRecord } from "@/types/aviation";

/**
 * Extract the shared chronological FE token from any identifier:
 * "REQ-FE001" -> "FE001"
 * "QUO-FE001-01" -> "FE001"
 * "TRI-FE001" -> "FE001"
 * "FE4578" -> "FE4578"
 */
export function extractFeToken(id?: string): string | null {
  if (!id) return null;
  const match = String(id).match(/FE\d+/i);
  return match ? match[0].toUpperCase() : null;
}

/**
 * Creates clean chronological linked IDs from a sequence number or token:
 * getLinkedIds(1) => { token: "FE001", requestId: "REQ-FE001", quoteId: "QUO-FE001", tripId: "TRI-FE001" }
 */
export function getLinkedIds(tokenOrNum: string | number, version: number = 1) {
  let token: string;
  if (typeof tokenOrNum === "number") {
    token = `FE${String(tokenOrNum).padStart(3, "0")}`;
  } else {
    token = extractFeToken(tokenOrNum) || tokenOrNum.toUpperCase();
  }
  const verStr = version > 1 ? `-${String(version).padStart(2, "0")}` : "";
  return {
    token,
    requestId: `REQ-${token}`,
    quoteId: `QUO-${token}${verStr}`,
    tripId: `TRI-${token}`,
    tripNumber: `TRI-${token}${verStr}`,
    invoiceNumber: `INV-${token}-${String(version).padStart(2, "0")}`,
    contractNumber: `CTR-${token}-${String(version).padStart(2, "0")}`,
    flightBriefNumber: `FB-${token}`,
  };
}

/**
 * Deterministic mapping helper so that raw legacy IDs (e.g. UUIDs)
 * always render the same chronological REQ-FE### / TRI-FE###.
 */
const legacyIdMapping = new Map<string, string>();
let globalFeCounter = 1;

/**
 * Formats any request ID into standard REQ-FE### format:
 * - "REQ-FE001" -> "REQ-FE001"
 * - "request-61cb8dd1..." -> "REQ-FE001"
 * - "RQ-0434" -> "REQ-FE001"
 */
export function formatRequestId(rawId?: string, fallbackIndex?: number): string {
  if (!rawId) {
    const idx = fallbackIndex ?? globalFeCounter++;
    return `REQ-FE${String(idx).padStart(3, "0")}`;
  }
  const feMatch = rawId.match(/FE\d+/i);
  if (feMatch) return `REQ-${feMatch[0].toUpperCase()}`;

  if (legacyIdMapping.has(rawId)) {
    return legacyIdMapping.get(rawId)!;
  }

  const idx = fallbackIndex ?? globalFeCounter++;
  const formatted = `REQ-FE${String(idx).padStart(3, "0")}`;
  legacyIdMapping.set(rawId, formatted);
  return formatted;
}

/**
 * Formats any quote ID into standard QUO-FE### format.
 */
export function formatQuoteId(rawId?: string, fallbackIndex?: number, version: number = 1): string {
  const verStr = version > 1 ? `-${String(version).padStart(2, "0")}` : "";
  if (!rawId) {
    const idx = fallbackIndex ?? 1;
    return `QUO-FE${String(idx).padStart(3, "0")}${verStr}`;
  }
  const feMatch = rawId.match(/FE\d+/i);
  if (feMatch) return `QUO-${feMatch[0].toUpperCase()}${verStr}`;

  if (legacyIdMapping.has(rawId)) {
    const reqForm = legacyIdMapping.get(rawId)!;
    return reqForm.replace("REQ-", "QUO-") + verStr;
  }

  const idx = fallbackIndex ?? 1;
  return `QUO-FE${String(idx).padStart(3, "0")}${verStr}`;
}

/**
 * Formats any trip ID into standard TRI-FE### format:
 * - "TRI-FE001" -> "TRI-FE001"
 * - "PEUD590D961D0-001" -> "TRI-FE001"
 * - "QTE-2026-D22AC30943" -> "TRI-FE002"
 */
export function formatTripId(rawId?: string, fallbackIndex?: number): string {
  if (!rawId) {
    const idx = fallbackIndex ?? 1;
    return `TRI-FE${String(idx).padStart(3, "0")}`;
  }
  const feMatch = rawId.match(/FE\d+/i);
  if (feMatch) return `TRI-${feMatch[0].toUpperCase()}`;

  if (legacyIdMapping.has(rawId)) {
    const reqForm = legacyIdMapping.get(rawId)!;
    return reqForm.replace("REQ-", "TRI-");
  }

  const idx = fallbackIndex ?? 1;
  const formatted = `TRI-FE${String(idx).padStart(3, "0")}`;
  legacyIdMapping.set(rawId, formatted);
  return formatted;
}

/**
 * Generates a standard root trip ID: "TRI-FExxx" or "FExxx".
 */
export function generateTripRootId(existingIds: string[] = []): string {
  let attempts = 0;
  let id = "";
  do {
    const num = Math.floor(1 + Math.random() * 999);
    id = `TRI-FE${String(num).padStart(3, "0")}`;
    attempts++;
  } while (existingIds.includes(id) && attempts < 100);
  return id;
}

/**
 * Formats a trip version string (e.g. "TRI-FE001-001" or "TRI-FE001").
 */
export function formatTripVersion(rootId: string, versionNumber: number): string {
  const feToken = extractFeToken(rootId);
  const base = feToken ? `TRI-${feToken}` : (rootId.startsWith("TRI-") ? rootId : `TRI-${rootId}`);
  if (versionNumber > 1) {
    const padVer = String(versionNumber).padStart(3, "0");
    return `${base}-${padVer}`;
  }
  return base;
}

/**
 * Parses a trip identifier into its root ID and version number.
 */
export function parseTripVersion(tripIdentifier: string): { rootId: string; versionNumber: number } {
  if (!tripIdentifier) return { rootId: "TRI-FE001", versionNumber: 1 };
  const feToken = extractFeToken(tripIdentifier);
  const rootId = feToken ? `TRI-${feToken}` : tripIdentifier;
  const lastPart = tripIdentifier.trim().split("-").pop();
  const versionNumber = lastPart && /^\d+$/.test(lastPart) && lastPart.length === 3 ? parseInt(lastPart, 10) : 1;
  return { rootId, versionNumber };
}

/**
 * Derives document numbers from the trip root and version.
 * - Q: QUO-FE001 (or QUO-FE001-02)
 * - C: CTR-FE001-01
 * - INV: INV-FE001-01
 * - CN: CN-FE001-01
 * - FB: FB-FE001
 */
export function formatDocumentId(
  kind: "Q" | "C" | "INV" | "CN" | "FB",
  rootId: string,
  versionNumber: number,
  sequenceNumber: number = 1
): string {
  const feToken = extractFeToken(rootId) || rootId.replace(/^(TRI-|QUO-|REQ-)/, "");
  const padSeq = String(sequenceNumber).padStart(2, "0");
  const padVer = String(versionNumber).padStart(2, "0");

  if (kind === "Q") {
    return versionNumber > 1 ? `QUO-${feToken}-${padVer}` : `QUO-${feToken}`;
  }
  if (kind === "INV") {
    return `INV-${feToken}-${padSeq}`;
  }
  if (kind === "CN") {
    return `CN-${feToken}-${padSeq}`;
  }
  if (kind === "C") {
    return `CTR-${feToken}-${padSeq}`;
  }
  if (kind === "FB") {
    return `FB-${feToken}`;
  }
  return `${kind}-${feToken}`;
}

/**
 * Generates an account number: ACC-xxxxx (5-digit random or sequence).
 */
export function generateAccountId(existingAccounts: string[] = []): string {
  let acc = "";
  let attempts = 0;
  do {
    const num = Math.floor(10000 + Math.random() * 90000);
    acc = `ACC-${num}`;
    attempts++;
  } while (existingAccounts.includes(acc) && attempts < 100);
  return acc;
}

/**
 * Checks for possible duplicate contacts by passport number or email.
 */
export function findContactDuplicates(
  contacts: ContactRecord[],
  candidate: { email?: string; passportNumber?: string; id?: string }
): ContactRecord | null {
  const candEmail = candidate.email?.trim().toLowerCase();
  const candPassport = candidate.passportNumber?.trim().toUpperCase();

  for (const c of contacts) {
    if (candidate.id && c.id === candidate.id) continue;
    if (candEmail && c.email && c.email.trim().toLowerCase() === candEmail) {
      return c;
    }
    const cPass = c.passportDetails?.passportNumber?.trim().toUpperCase();
    if (candPassport && cPass && cPass === candPassport) {
      return c;
    }
  }
  return null;
}

/**
 * Filters the master Contacts list to return agents.
 */
export function getAgentContacts(contacts: ContactRecord[]): ContactRecord[] {
  return contacts.filter((c) => c.isAgent);
}

/**
 * Filters the master Accounts list to return agent accounts.
 */
export function getAgentAccounts(accounts: AccountRecord[]): AccountRecord[] {
  return accounts.filter((a) => a.isAgent);
}

/**
 * Masks passport number, displaying only the last 4 characters.
 */
export function maskPassportNumber(passportNumber?: string): string {
  if (!passportNumber) return "—";
  const trimmed = passportNumber.trim();
  if (trimmed.length <= 4) return trimmed;
  return `•••• ${trimmed.slice(-4)}`;
}
