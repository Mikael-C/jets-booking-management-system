/**
 * Orbelo Aviation Management System - ID Generation & Deduplication Engine (R-010)
 *
 * Rules:
 * 1. Root Trip ID: 2 letters + 4 digits (e.g. FE4578, MX5521, RB3310).
 * 2. Versioned Trip ID: Root ID + 3-digit iteration (e.g. FE4578-001, FE4578-002).
 * 3. Document IDs derive from the trip version:
 *    - Quotation: Q-FE4578-002
 *    - Charter Agreement / Contract: C-FE4578-002
 *    - Commercial Invoice: INV-FE4578-01
 *    - Credit Note: CN-FE4578-01
 *    - Flight Brief: FB-FE4578-005
 * 4. Account IDs: ACC-xxxxx (5 digits, e.g. ACC-21737). One record per entity, never per trip.
 * 5. Contacts & Accounts exist once. Agents are filtered via `isAgent: true`, never duplicated.
 */

import { ContactRecord, AccountRecord } from "@/types/aviation";

/**
 * Generates a standard root trip ID: 2 uppercase letters + 4 digits (e.g. "FE4578").
 */
export function generateTripRootId(existingIds: string[] = []): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // exclude easily confused I, O
  let id = "";
  let attempts = 0;
  do {
    const l1 = letters.charAt(Math.floor(Math.random() * letters.length));
    const l2 = letters.charAt(Math.floor(Math.random() * letters.length));
    const num = Math.floor(1000 + Math.random() * 9000); // 4-digit number
    id = `${l1}${l2}${num}`;
    attempts++;
  } while (existingIds.includes(id) && attempts < 100);
  return id;
}

/**
 * Formats a trip version string (e.g. "FE4578-001").
 */
export function formatTripVersion(rootId: string, versionNumber: number): string {
  const cleanRoot = rootId.split("-")[0].toUpperCase();
  const padVer = String(versionNumber).padStart(3, "0");
  return `${cleanRoot}-${padVer}`;
}

/**
 * Parses a trip identifier into its root ID and version number.
 */
export function parseTripVersion(tripIdentifier: string): { rootId: string; versionNumber: number } {
  if (!tripIdentifier) return { rootId: "FE0000", versionNumber: 1 };
  const parts = tripIdentifier.trim().toUpperCase().split("-");
  const rootId = parts[0];
  const versionNumber = parts[1] ? parseInt(parts[1], 10) || 1 : 1;
  return { rootId, versionNumber };
}

/**
 * Derives document numbers from the trip root and version.
 * - Q: Q-FE4578-002
 * - C: C-FE4578-002
 * - INV: INV-FE4578-01
 * - CN: CN-FE4578-01
 * - FB: FB-FE4578-005
 */
export function formatDocumentId(
  kind: "Q" | "C" | "INV" | "CN" | "FB",
  rootId: string,
  versionNumber: number,
  sequenceNumber: number = 1
): string {
  const cleanRoot = rootId.split("-")[0].toUpperCase();
  if (kind === "INV" || kind === "CN") {
    // Invoices and Credit notes use 2-digit sequence per trip
    const padSeq = String(sequenceNumber).padStart(2, "0");
    return `${kind}-${cleanRoot}-${padSeq}`;
  }
  const padVer = String(versionNumber).padStart(3, "0");
  return `${kind}-${cleanRoot}-${padVer}`;
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
 * Filters the master Contacts list to return agents (R-010: Agents is a filtered view, not a copy).
 */
export function getAgentContacts(contacts: ContactRecord[]): ContactRecord[] {
  return contacts.filter((c) => c.isAgent);
}

/**
 * Filters the master Accounts list to return agent accounts (R-010: Agents is a filtered view, not a copy).
 */
export function getAgentAccounts(accounts: AccountRecord[]): AccountRecord[] {
  return accounts.filter((a) => a.isAgent);
}

/**
 * Masks passport number, displaying only the last 4 characters (R-010 / R-017).
 */
export function maskPassportNumber(passportNumber?: string): string {
  if (!passportNumber) return "—";
  const trimmed = passportNumber.trim();
  if (trimmed.length <= 4) return trimmed;
  return `•••• ${trimmed.slice(-4)}`;
}
