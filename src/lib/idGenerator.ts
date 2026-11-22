/**
 * Orbelo Aviation Management System - Standardized ID Generation & Formatting Engine
 *
 * Requirements (MOD-01 / Build Pack R-053):
 * 1. Root ID per trip: two letters + four digits (e.g. FE4455, FE1001).
 * 2. Prefix shows the state:
 *    - Quote versions: QUO-FE4455-001, QUO-FE4455-002...
 *    - Signed trip versions: TRI-FE4455-001, TRI-FE4455-002...
 *    - Charter Agreement: CA-FE4455-001...
 *    - Commercial Invoice: INV-FE4455-001, INV-FE4455-002 (sequential & unique)
 *    - Credit Note: CN-FE4455-001...
 *    - Flight Brief: FB-FE4455-001...
 *    - Curator Request: REQ-FE4455...
 * 3. In lists: version suffix is rendered smaller and IDs/routes never wrap.
 */

import React from "react";

export const pad4 = (num: number): string => String(num).padStart(4, "0");
export const pad3 = (num: number): string => String(num).padStart(3, "0");

/**
 * Extract the shared 2-letter + 4-digit token from any identifier:
 * "REQ-FE4455" -> "FE4455"
 * "QUO-FE4455-001" -> "FE4455"
 * "TRI-FE4455-001" -> "FE4455"
 * "CA-FE4455-001" -> "FE4455"
 */
export function extractFeToken(id?: string): string | null {
  if (!id) return null;
  const match = String(id).match(/([A-Za-z]{2}\d{4})/i) || String(id).match(/([A-Za-z]{2}\d{3})/i) || String(id).match(/FE\d+/i);
  return match ? match[0].toUpperCase() : null;
}

/**
 * Creates clean chronological linked IDs from a sequence number or token:
 * getLinkedIds("FE4455", 1) => { token: "FE4455", requestId: "REQ-FE4455", quoteId: "QUO-FE4455-001", tripId: "TRI-FE4455", tripNumber: "TRI-FE4455-001", agreementNumber: "CA-FE4455-001", invoiceNumber: "INV-FE4455-001" }
 */
export function getLinkedIds(tokenOrNum: string | number, version: number = 1) {
  let token: string;
  if (typeof tokenOrNum === "number") {
    token = `FE${pad4(tokenOrNum)}`;
  } else {
    token = extractFeToken(tokenOrNum) || tokenOrNum.toUpperCase();
  }
  const verStr = `-${pad3(version || 1)}`;
  return {
    token,
    requestId: `REQ-${token}`,
    quoteId: `QUO-${token}${verStr}`,
    tripId: `TRI-${token}`,
    tripNumber: `TRI-${token}${verStr}`,
    agreementNumber: `CA-${token}${verStr}`,
    contractNumber: `CA-${token}${verStr}`,
    invoiceNumber: `INV-${token}${verStr}`,
    creditNoteNumber: `CN-${token}${verStr}`,
    flightBriefNumber: `FB-${token}${verStr}`,
  };
}

/**
 * Deterministic mapping helper so that raw legacy IDs (e.g. UUIDs)
 * always render the same chronological REQ-FE#### / TRI-FE####.
 */
const legacyIdMapping = new Map<string, string>();
let globalFeCounter = 1001;

/**
 * Formats any request ID into standard REQ-FE#### format:
 * - "REQ-FE4455" -> "REQ-FE4455"
 * - "request-61cb8dd1..." -> "REQ-FE1001"
 */
export function formatRequestId(rawId?: string, fallbackIndex?: number): string {
  if (!rawId) {
    const idx = fallbackIndex ? fallbackIndex + 1000 : globalFeCounter++;
    return `REQ-FE${pad4(idx)}`;
  }
  const feToken = extractFeToken(rawId);
  if (feToken) return `REQ-${feToken}`;

  if (legacyIdMapping.has(rawId)) {
    return legacyIdMapping.get(rawId)!;
  }

  const idx = fallbackIndex ? fallbackIndex + 1000 : globalFeCounter++;
  const formatted = `REQ-FE${pad4(idx)}`;
  legacyIdMapping.set(rawId, formatted);
  return formatted;
}

/**
 * Formats any quote ID into standard QUO-FE####-00n format.
 */
export function formatQuoteId(rawId?: string, fallbackIndex?: number, version: number = 1): string {
  const verStr = `-${pad3(version || 1)}`;
  if (!rawId) {
    const idx = fallbackIndex ? fallbackIndex + 1000 : 1001;
    return `QUO-FE${pad4(idx)}${verStr}`;
  }
  const feToken = extractFeToken(rawId);
  if (feToken) return `QUO-${feToken}${verStr}`;

  if (legacyIdMapping.has(rawId)) {
    const reqForm = legacyIdMapping.get(rawId)!;
    return reqForm.replace("REQ-", "QUO-") + verStr;
  }

  const idx = fallbackIndex ? fallbackIndex + 1000 : 1001;
  return `QUO-FE${pad4(idx)}${verStr}`;
}

/**
 * Formats any trip ID into standard TRI-FE#### format (or TRI-FE####-00n).
 */
export function formatTripId(rawId?: string, fallbackIndex?: number, version?: number): string {
  const verStr = version ? `-${pad3(version)}` : "";
  if (!rawId) {
    const idx = fallbackIndex ? fallbackIndex + 1000 : 1001;
    return `TRI-FE${pad4(idx)}${verStr}`;
  }
  const feToken = extractFeToken(rawId);
  if (feToken) return `TRI-${feToken}${verStr}`;

  if (legacyIdMapping.has(rawId)) {
    const reqForm = legacyIdMapping.get(rawId)!;
    return reqForm.replace("REQ-", "TRI-") + verStr;
  }

  const idx = fallbackIndex ? fallbackIndex + 1000 : 1001;
  const formatted = `TRI-FE${pad4(idx)}${verStr}`;
  legacyIdMapping.set(rawId, formatted);
  return formatted;
}

/**
 * Generates a standard root trip ID: "TRI-FE####".
 */
export function generateTripRootId(existingIds: string[] = []): string {
  let attempts = 0;
  let id = "";
  do {
    const num = Math.floor(1001 + Math.random() * 8999);
    id = `TRI-FE${pad4(num)}`;
    attempts++;
  } while (existingIds.includes(id) && attempts < 100);
  return id;
}

/**
 * Formats a trip version string: "TRI-FE4455-001", "TRI-FE4455-002", etc.
 */
export function formatTripVersion(rootId: string, versionNumber: number): string {
  const feToken = extractFeToken(rootId);
  const base = feToken ? `TRI-${feToken}` : (rootId.startsWith("TRI-") ? rootId : `TRI-${rootId}`);
  return `${base}-${pad3(versionNumber || 1)}`;
}

/**
 * Parses a trip identifier into its root ID and version number.
 */
export function parseTripVersion(tripIdentifier: string): { rootId: string; versionNumber: number } {
  if (!tripIdentifier) return { rootId: "TRI-FE1001", versionNumber: 1 };
  const feToken = extractFeToken(tripIdentifier);
  const rootId = feToken ? `TRI-${feToken}` : tripIdentifier;
  const lastPart = tripIdentifier.trim().split("-").pop();
  const versionNumber = lastPart && /^\d+$/.test(lastPart) ? parseInt(lastPart, 10) : 1;
  return { rootId, versionNumber };
}

/**
 * Derives document numbers from the trip root and version (MOD-01):
 * - Q: QUO-FE4455-001
 * - C: CA-FE4455-001 (Charter Agreement)
 * - INV: INV-FE4455-001 (Unique and sequential)
 * - CN: CN-FE4455-001 (Credit note)
 * - FB: FB-FE4455-001 (Flight brief)
 */
export function formatDocumentId(
  kind: "Q" | "C" | "INV" | "CN" | "FB",
  rootId: string,
  versionNumber: number = 1,
  sequenceNumber: number = 1
): string {
  const feToken = extractFeToken(rootId) || rootId.replace(/^(TRI-|QUO-|REQ-|CA-|CTR-|INV-|CN-|FB-)/, "");
  const padSeq = pad3(sequenceNumber || 1);
  const padVer = pad3(versionNumber || 1);

  if (kind === "Q") {
    return `QUO-${feToken}-${padVer}`;
  }
  if (kind === "INV") {
    return `INV-${feToken}-${padSeq}`;
  }
  if (kind === "CN") {
    return `CN-${feToken}-${padSeq}`;
  }
  if (kind === "C") {
    return `CA-${feToken}-${padVer}`;
  }
  if (kind === "FB") {
    return `FB-${feToken}-${padVer}`;
  }
  return `${kind}-${feToken}-${padVer}`;
}

/**
 * Renders an ID string with smaller version suffix and non-wrapping style (MOD-01 / Build Pack R-053).
 * Example: QUO-FE4455-001 -> "QUO-" (smaller) "FE4455" (bold) "-001" (smaller)
 */
export function renderFormattedId(idString: string): React.ReactNode {
  if (!idString) return null;
  const match = idString.match(/^([A-Za-z]+-)([A-Za-z0-9]+?)(?:-(\d{2,3}))?$/);
  if (!match) {
    return React.createElement("span", { className: "whitespace-nowrap font-mono" }, idString);
  }
  const [, prefix, root, suffix] = match;
  return React.createElement(
    "span",
    { className: "whitespace-nowrap font-mono inline-flex items-baseline" },
    React.createElement("span", { className: "text-[11px] opacity-75" }, prefix),
    React.createElement("span", { className: "font-semibold" }, root),
    suffix ? React.createElement("span", { className: "text-[11px] opacity-70" }, `-${suffix}`) : null
  );
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
 * Masks a passport number for discretion (discretion mode).
 */
export function maskPassportNumber(passportNumber?: string): string {
  if (!passportNumber) return "—";
  if (passportNumber.length <= 4) return "****";
  const start = passportNumber.slice(0, 2);
  const end = passportNumber.slice(-2);
  const maskedLength = Math.max(passportNumber.length - 4, 3);
  return `${start}${"*".repeat(maskedLength)}${end}`;
}
