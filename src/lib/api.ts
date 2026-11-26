/**
 * Orbelo Backend API Client
 * Connects frontend to the Express.js / Node.js backend hosted on Render (or local dev)
 */

const getBaseApiUrl = (): string => {
  const raw = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const trimmed = raw.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

const API_BASE_URL = getBaseApiUrl();

const ACCESS_KEY = "orbelo_access_token";
const REFRESH_KEY = "orbelo_refresh_token";

const readToken = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

function getAuthHeader(token: string | null = readToken(ACCESS_KEY)): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Seconds until the access token expires (null when it cannot be read). */
function secondsLeft(token: string | null): number | null {
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json.exp === "number" ? json.exp - Date.now() / 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Renews the access token with the refresh token. Requests that need a new token at the same time share one
 * renewal; if another tab renewed first, its token is used.
 */
let renewing: Promise<string | null> | null = null;
function renewAccessToken(usedToken: string | null): Promise<string | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const current = readToken(ACCESS_KEY);
  if (current && usedToken && current !== usedToken && (secondsLeft(current) ?? 1) > 0) return Promise.resolve(current);
  if (renewing) return renewing;
  const run = (async () => {
    const refreshToken = readToken(REFRESH_KEY);
    if (!refreshToken) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        const latest = readToken(ACCESS_KEY);
        return latest && latest !== usedToken && (secondsLeft(latest) ?? 1) > 0 ? latest : null;
      }
      const json = await res.json().catch(() => null);
      const accessToken = json?.data?.accessToken;
      if (!accessToken) return null;
      localStorage.setItem(ACCESS_KEY, accessToken);
      if (json?.data?.refreshToken) localStorage.setItem(REFRESH_KEY, json.data.refreshToken);
      return accessToken as string;
    } catch {
      // Network trouble: keep the session, the next request tries again
      return readToken(ACCESS_KEY);
    }
  })();
  renewing = run;
  run.finally(() => {
    if (renewing === run) renewing = null;
  });
  return run;
}

/** The session could not be renewed: sign out cleanly instead of failing request after request. */
let sessionEndedAt = 0;
function endSession() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    /* ignore */
  }
  if (Date.now() - sessionEndedAt > 5000) {
    sessionEndedAt = Date.now();
    window.dispatchEvent(new CustomEvent("orbelo-session-expired"));
  }
}

const NO_RENEW = ["/auth/login", "/auth/refresh", "/auth/logout"];

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;
  const canRenew = !NO_RENEW.some((p) => cleanEndpoint.startsWith(p));

  // Renew a token that runs out within the next 2 minutes before sending the request
  let token = readToken(ACCESS_KEY);
  if (token && canRenew) {
    const left = secondsLeft(token);
    if (left !== null && left < 120 && readToken(REFRESH_KEY)) {
      token = (await renewAccessToken(token)) || token;
    }
  }
  let headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeader(token),
    ...((options.headers as Record<string, string>) || {}),
  };

  try {
    let res = await fetch(url, { ...options, headers });
    // Expired or refused token: renew once and send the request again
    if (res.status === 401 && canRenew && token && readToken(REFRESH_KEY)) {
      const fresh = await renewAccessToken(token);
      if (fresh && fresh !== token) {
        headers = { ...headers, Authorization: `Bearer ${fresh}` };
        res = await fetch(url, { ...options, headers });
      } else if (!fresh) {
        endSession();
        const ended: any = new Error("Your session has ended. Please sign in again.");
        ended.status = 401;
        ended.code = "SESSION_ENDED";
        throw ended;
      }
    }
    if (res.ok) {
      return await res.json();
    }
    // If external Render backend returned 404 or >= 500, attempt fallback to local / internal route
    if (typeof window !== "undefined" && !API_BASE_URL.startsWith("/") && (res.status === 404 || res.status >= 500)) {
      try {
        const localRes = await fetch(`/api${cleanEndpoint}`, { ...options, headers });
        if (localRes.ok) {
          return await localRes.json();
        }
      } catch {
        // Continue to original error reporting
      }
    }
    const errorData = await res.json().catch(() => ({ message: res.statusText }));
    const apiError: any = new Error(errorData.message || `API Error: ${res.status}`);
    apiError.status = res.status;
    apiError.code = errorData.code;
    apiError.data = errorData;
    throw apiError;
  } catch (err: any) {
    if (err?.code === "SESSION_ENDED") throw err;
    if (typeof window !== "undefined" && !API_BASE_URL.startsWith("/")) {
      try {
        const localRes = await fetch(`/api${cleanEndpoint}`, { ...options, headers });
        if (localRes.ok) {
          return await localRes.json();
        }
      } catch {
        // Fall through
      }
    }
    throw err;
  }
}

export const api = {
  // Auth
  auth: {
    login: (email: string, password: string) =>
      request<{ success: boolean; data: { token?: string; accessToken?: string; refreshToken: string; user: any } }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<any>("/auth/me"),
  },

  // Bookings
  bookings: {
    list: (params?: Record<string, any>) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : "";
      return request<{ success: boolean; data: any[]; pagination: any }>(`/bookings${query}`);
    },
    get: (id: string) => request<{ success: boolean; data: any }>(`/bookings/${id}`),
    create: (data: any) =>
      request<{ success: boolean; data: any }>("/bookings", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/bookings/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    updateStatus: (id: string, status: string) =>
      request<{ success: boolean; data: any }>(`/bookings/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    updatePaymentStatus: (id: string, paymentStatus: string, paymentMethodChoice?: string) =>
      request<{ success: boolean; data: any }>(`/bookings/${id}/payment-status`, {
        method: "PATCH",
        body: JSON.stringify({ paymentStatus, paymentMethodChoice }),
      }),
    confirm: (id: string) =>
      request<{ success: boolean; data: any }>(`/bookings/${id}/convert-to-confirmed`, {
        method: "POST",
      }),
    revise: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/bookings/${id}/revise`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    tripInvoices: (tripId: string) =>
      request<{ success: boolean; data: any[]; ledger: any[]; consolidated: any }>(
        `/bookings/trip/${encodeURIComponent(tripId)}/invoices`
      ),
    toggleChecklist: (bookingId: string, stepId: string, completed: boolean) =>
      request<{ success: boolean; data: any }>(`/bookings/${bookingId}/checklist/${stepId}`, {
        method: "PATCH",
        body: JSON.stringify({ completed }),
      }),
    calculatePricing: (aircraft: any, legs: any[], services?: any, options?: any) =>
      request<{ success: boolean; data: any }>("/bookings/calculate-pricing", {
        method: "POST",
        body: JSON.stringify({ aircraft, legs, services, options }),
      }),
  },

  // Avinode Integration
  avinode: {
    searchTrips: (params: { originIcao: string; destinationIcao: string; departureDate: string; paxCount?: number; aircraftCategory?: string; currency?: string }) =>
      request<any[]>("/avinode/search-trips", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    sendRfq: (params: { agentRequestId?: string; originIcao: string; destinationIcao: string; departureDate: string; paxCount?: number; notes?: string }) =>
      request<any>("/avinode/rfq", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    getRfqResponses: (rfqId: string) => request<any>(`/avinode/rfq/${rfqId}`),
    bookTrip: (tripId: string, bookingId?: string) =>
      request<any>("/avinode/book-trip", {
        method: "POST",
        body: JSON.stringify({ tripId, bookingId }),
      }),
    operators: (params?: { search?: string; baseIcao?: string }) => {
      const q = params ? `?${new URLSearchParams(params as any).toString()}` : "";
      return request<any[]>(`/avinode/operators${q}`);
    },
    fleetAvailability: (params: { dateFrom?: string; dateTo?: string; baseIcao?: string }) => {
      const q = `?${new URLSearchParams(params as any).toString()}`;
      return request<any>(`/avinode/fleet-availability${q}`);
    },
  },

  // Jet Images (Unsplash, Pexels, Cloudinary)
  jetImages: {
    search: (query: string, page = 1) =>
      request<any[]>(`/jet-images/search?query=${encodeURIComponent(query)}&page=${page}`),
    aircraft: (aircraftModel: string, view?: "interior" | "exterior") => {
      const q = view ? `?view=${view}` : "";
      return request<any[]>(`/jet-images/aircraft/${encodeURIComponent(aircraftModel)}${q}`);
    },
    interior: (aircraftType?: string) => {
      const q = aircraftType ? `?aircraftType=${encodeURIComponent(aircraftType)}` : "";
      return request<any[]>(`/jet-images/interior${q}`);
    },
    exterior: (aircraftType?: string) => {
      const q = aircraftType ? `?aircraftType=${encodeURIComponent(aircraftType)}` : "";
      return request<any[]>(`/jet-images/exterior${q}`);
    },
  },

  // Documents (PDFs)
  documents: {
    _downloadPdf: async (endpoint: string, filename: string, bookingData?: any) => {
      const headers: Record<string, string> = { ...getAuthHeader() };
      if (bookingData) {
        headers["Content-Type"] = "application/json";
      }
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers,
        body: bookingData ? JSON.stringify({ booking: bookingData }) : undefined,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`PDF generation failed (${res.status}): ${errText || res.statusText}`);
      }

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("pdf") && !contentType.includes("octet-stream")) {
        const text = await res.text().catch(() => "");
        throw new Error(`Invalid response format (not PDF): ${text.substring(0, 100)}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },
    downloadQuotation: async (bookingId: string, filename = "quotation.pdf", bookingData?: any) => {
      return api.documents._downloadPdf(`/documents/quotation/${bookingId}`, filename, bookingData);
    },
    downloadInvoice: async (bookingId: string, filename = "invoice.pdf", bookingData?: any) => {
      return api.documents._downloadPdf(`/documents/invoice/${bookingId}`, filename, bookingData);
    },
    downloadFlightBrief: async (bookingId: string, filename = "flight-brief.pdf", bookingData?: any) => {
      return api.documents._downloadPdf(`/documents/flight-brief/${bookingId}`, filename, bookingData);
    },
    downloadCharterAgreement: async (bookingId: string, filename = "charter-agreement.pdf", bookingData?: any) => {
      return api.documents._downloadPdf(`/documents/charter-agreement/${bookingId}`, filename, bookingData);
    },
    downloadPassengerManifest: async (bookingId: string, filename = "passenger-manifest.pdf", bookingData?: any) => {
      return api.documents._downloadPdf(`/documents/passenger-manifest/${bookingId}`, filename, bookingData);
    },
    downloadCreditNote: async (bookingId: string, filename = "credit-note.pdf", bookingData?: any) => {
      return api.documents._downloadPdf(`/documents/credit-note/${bookingId}`, filename, bookingData);
    },
  },

  // Commercial Invoices API
  invoices: {
    list: (params?: Record<string, any>) => {
      const q = params ? `?${new URLSearchParams(params).toString()}` : "";
      return request<{ success: boolean; data: any[]; total: number }>(`/invoices${q}`);
    },
    get: (id: string) => request<{ success: boolean; data: any }>(`/invoices/${id}`),
    create: (data: any) =>
      request<{ success: boolean; message: string; data: any }>("/invoices", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    toggleAutoReminders: (id: string, enabled?: boolean) =>
      request<{ success: boolean; autoPaymentRemindersEnabled: boolean; message: string; data?: any }>(
        `/invoices/${encodeURIComponent(id)}/toggle-auto-reminders`,
        {
          method: "PATCH",
          body: JSON.stringify({ enabled }),
        }
      ),
    sendPaymentReminder: (id: string) =>
      request<{ success: boolean; message: string; content?: string }>(
        `/invoices/${encodeURIComponent(id)}/send-payment-reminder`,
        {
          method: "POST",
        }
      ),
  },

  // Flight Operations Briefs API
  flightBriefs: {
    list: (params?: Record<string, any>) => {
      const q = params ? `?${new URLSearchParams(params).toString()}` : "";
      return request<{ success: boolean; data: any[]; total: number }>(`/flight-briefs${q}`);
    },
    get: (id: string) => request<{ success: boolean; data: any }>(`/flight-briefs/${id}`),
    create: (data: any) =>
      request<{ success: boolean; message: string; data: any }>("/flight-briefs", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    syncPassengers: (id: string, passengers: any[], accountNumber?: string) =>
      request<{ success: boolean; data: any[] }>(`/flight-briefs/${id}/sync-passengers`, {
        method: "POST",
        body: JSON.stringify({ passengers, accountNumber }),
      }),
  },

  // Charter Contracts & Agreements API
  contracts: {
    list: (params?: Record<string, any>) => {
      const q = params ? `?${new URLSearchParams(params).toString()}` : "";
      return request<{ success: boolean; data: any[]; total: number }>(`/contracts${q}`);
    },
    get: (id: string) => request<{ success: boolean; data: any }>(`/contracts/${id}`),
    create: (data: any) =>
      request<{ success: boolean; message: string; data: any }>("/contracts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    sign: (id: string, signatoryName?: string) =>
      request<{ success: boolean; message: string; data: any }>(`/contracts/${id}/sign`, {
        method: "POST",
        body: JSON.stringify({ signatoryName }),
      }),
  },

  // In-App Messaging
  messages: {
    list: (params?: { channel?: string; recipientEmail?: string; tripNumber?: string; requestId?: string; limit?: number }) => {
      const q = params ? `?${new URLSearchParams(params as any).toString()}` : "";
      return request<{ success: boolean; data: any[] }>(`/messages${q}`);
    },
    unreadCount: () => request<{ success: boolean; count: number }>("/messages/unread-count"),
    send: (data: {
      channel?: string;
      recipientEmail?: string;
      recipientName?: string;
      recipientRole?: string;
      content: string;
      tripNumber?: string;
      requestId?: string;
      attachments?: any[];
    }) =>
      request<{ success: boolean; data: any }>("/messages", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    markRead: (id: string) =>
      request<{ success: boolean; message: string }>(`/messages/${id}/read`, {
        method: "PATCH",
      }),
  },

  // Dashboard Analytics
  dashboard: {
    kpis: () => request<any>("/dashboard/kpis"),
    summary: () => request<any>("/dashboard/bookings-summary"),
    revenueChart: (months = 6) => request<any[]>(`/dashboard/revenue-chart?months=${months}`),
    upcomingFlights: (days = 7) => request<any[]>(`/dashboard/upcoming-flights?days=${days}`),
    alerts: () => request<any[]>("/dashboard/alerts"),
    getOverview: (params?: { timeframe?: string; assignee?: string }) => {
      const q = params ? `?${new URLSearchParams(params).toString()}` : "";
      return request<{ success: boolean; data: any }>(`/dashboard/overview${q}`);
    },
    getBoard: (params?: { curator?: string; needsAction?: boolean | string; departing7Days?: boolean | string }) => {
      const q = params ? `?${new URLSearchParams(params as any).toString()}` : "";
      return request<{ success: boolean; data: any }>(`/dashboard/board${q}`);
    },
    updateCardStage: (cardId: string, stage: string) =>
      request<{ success: boolean; message: string; card?: any }>("/dashboard/board/card-stage", {
        method: "PATCH",
        body: JSON.stringify({ cardId, stage }),
      }),
    getFlights24h: (filter?: "today" | "next_24h") =>
      request<{ success: boolean; data: { totalCount: number; items: any[] } }>(
        `/dashboard/flights-24h${filter ? `?filter=${filter}` : ""}`
      ),
    getNeedsAction: (filter?: "everyone" | "mine") =>
      request<{ success: boolean; data: { totalCount: number; items: any[] } }>(
        `/dashboard/needs-action${filter ? `?filter=${filter}` : ""}`
      ),
    getFinancialHealth: () =>
      request<{ success: boolean; data: any }>("/dashboard/financial-health"),
  },

  // Invoices, credit notes, payments, contracts and flight briefs across trips (backend /api/registry)
  registry: {
    invoices: () => request<{ success: boolean; data: any[] }>("/registry/invoices"),
    payments: () => request<{ success: boolean; data: { rows: any[]; kpis: any } }>("/registry/payments"),
    contracts: () => request<{ success: boolean; data: any[] }>("/registry/contracts"),
    flightBriefs: () => request<{ success: boolean; data: any[] }>("/registry/flight-briefs"),
    ledger: (bookingId: string) =>
      request<{ success: boolean; data: any }>(`/registry/trips/${encodeURIComponent(bookingId)}/ledger`),
    /** Revisions tab: every quote and booking version of the trip; from/to compare two versions. */
    revisions: (bookingId: string, from?: number, to?: number) => {
      const q = new URLSearchParams();
      if (from) q.set("from", String(from));
      if (to) q.set("to", String(to));
      const qs = q.toString();
      return request<{ success: boolean; data: any }>(
        `/registry/trips/${encodeURIComponent(bookingId)}/revisions${qs ? `?${qs}` : ""}`
      );
    },
    createInvoice: (bookingId: string, data: { amount: number; purpose?: string; line?: string; kind?: string }) =>
      request<{ success: boolean; data: any }>(`/registry/trips/${encodeURIComponent(bookingId)}/invoices`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    combine: (bookingId: string) =>
      request<{ success: boolean; data: any }>(`/registry/trips/${encodeURIComponent(bookingId)}/combine`, { method: "POST" }),
    createCreditNote: (
      bookingId: string,
      data: { against: string; reasonCategory: string; cancellationFeePct?: number; amount: number; internalNote?: string; output?: string }
    ) =>
      request<{ success: boolean; data: any }>(`/registry/trips/${encodeURIComponent(bookingId)}/credit-notes`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    recordPayment: (
      bookingId: string,
      data: { invoiceNumber?: string; amount: number; method: "bank_transfer" | "card"; reference?: string; receivedAt?: string; status?: string; proofName?: string; proofUrl?: string }
    ) =>
      request<{ success: boolean; data: any }>(`/registry/trips/${encodeURIComponent(bookingId)}/payments`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    confirmPayment: (bookingId: string, paymentId: string) =>
      request<{ success: boolean; data: any }>(
        `/registry/trips/${encodeURIComponent(bookingId)}/payments/${encodeURIComponent(paymentId)}/confirm`,
        { method: "POST" }
      ),
    paymentLink: (bookingId: string, invoiceNumber: string, origin?: string) =>
      request<{ success: boolean; data: { url: string; provider: string; checkoutUrl: string; amount: number; currency: string; invoiceNumber: string } }>(
        `/registry/trips/${encodeURIComponent(bookingId)}/invoices/${encodeURIComponent(invoiceNumber)}/payment-link`,
        { method: "POST", body: JSON.stringify({ origin }) }
      ),
    remind: (bookingId: string, invoiceNumber: string) =>
      request<{ success: boolean; data: { emailed: boolean; to: string } }>(
        `/registry/trips/${encodeURIComponent(bookingId)}/invoices/${encodeURIComponent(invoiceNumber)}/remind`,
        { method: "POST" }
      ),
  },

  // Public payment link page (no login)
  /** Settings · Taxes (R-091), kept by the tax adviser. */
  taxRules: {
    list: () => request<{ success: boolean; data: any[] }>("/tax-rules"),
    create: (row: any) => request<{ success: boolean; data: any }>("/tax-rules", { method: "POST", body: JSON.stringify(row) }),
    update: (code: string, patch: any) =>
      request<{ success: boolean; data: any }>(`/tax-rules/${encodeURIComponent(code)}`, { method: "PUT", body: JSON.stringify(patch) }),
    newRate: (code: string, body: { rate: number; effectiveFrom: string; wording?: string; source?: string }) =>
      request<{ success: boolean; data: any }>(`/tax-rules/${encodeURIComponent(code)}/new-rate`, { method: "POST", body: JSON.stringify(body) }),
    confirm: (code: string, source?: string) =>
      request<{ success: boolean; data: any }>(`/tax-rules/${encodeURIComponent(code)}/confirm`, { method: "POST", body: JSON.stringify({ source }) }),
    unconfirm: (code: string) => request<{ success: boolean; data: any }>(`/tax-rules/${encodeURIComponent(code)}/unconfirm`, { method: "POST" }),
    remove: (code: string) => request<{ success: boolean }>(`/tax-rules/${encodeURIComponent(code)}`, { method: "DELETE" }),
  },

  /** Online signing of the charter agreement (public; the link carries a private key). */
  sign: {
    get: (number: string, key: string, origin?: string) =>
      request<{ success: boolean; data: any }>(
        `/sign/${encodeURIComponent(number)}?k=${encodeURIComponent(key)}${origin ? `&origin=${encodeURIComponent(origin)}` : ""}`
      ),
    code: (number: string, key: string) =>
      request<{ success: boolean; data: { sentTo: string; expiresInMinutes: number } }>(
        `/sign/${encodeURIComponent(number)}/code?k=${encodeURIComponent(key)}`,
        { method: "POST", body: JSON.stringify({}) }
      ),
    sign: (number: string, key: string, body: any) =>
      request<{ success: boolean; data: any }>(`/sign/${encodeURIComponent(number)}/sign?k=${encodeURIComponent(key)}`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },

  /** Desk side of the agreement: wet-signed copies and the signed files. */
  agreements: {
    uploadWet: (id: string, body: { file: string; fileName: string; signerName: string; signerPosition?: string }) =>
      request<{ success: boolean; message: string }>(`/agreements/${encodeURIComponent(id)}/wet-signed`, { method: "POST", body: JSON.stringify(body) }),
    confirmWet: (id: string, origin?: string) =>
      request<{ success: boolean; data: any }>(`/agreements/${encodeURIComponent(id)}/wet-signed/confirm`, {
        method: "POST",
        body: JSON.stringify({ origin }),
      }),
    file: (id: string, kind: "agreement" | "certificate") =>
      request<{ success: boolean; data: { fileName: string; dataUrl: string } }>(`/agreements/${encodeURIComponent(id)}/files/${kind}`),
  },

  /** Desk inbox: messages Curators send from their requests. */
  curatorInbox: {
    list: () => request<{ success: boolean; data: any }>(`/curator-inbox`),
    read: (requestId: string) =>
      request<{ success: boolean }>(`/curator-inbox/${encodeURIComponent(requestId)}/read`, { method: "POST" }),
    reply: (requestId: string, message: string) =>
      request<{ success: boolean }>(`/curator-inbox/${encodeURIComponent(requestId)}/reply`, {
        method: "POST",
        body: JSON.stringify({ message }),
      }),
  },
  /** Curator portal: everything is scoped to the signed-in Curator on the backend. */
  curator: {
    me: () => request<{ success: boolean; data: any }>(`/curator/me`),
    requests: () => request<{ success: boolean; data: any }>(`/curator/requests`),
    requestDetail: (id: string) => request<{ success: boolean; data: any }>(`/curator/requests/${encodeURIComponent(id)}`),
    createRequest: (data: any) =>
      request<{ success: boolean; data: any }>(`/curator/requests`, { method: "POST", body: JSON.stringify(data) }),
    messageDesk: (requestId: string, message: string) =>
      request<{ success: boolean }>(`/curator/requests/${encodeURIComponent(requestId)}/messages`, {
        method: "POST",
        body: JSON.stringify({ message }),
      }),
    quote: (id: string) => request<{ success: boolean; data: any }>(`/curator/quotes/${encodeURIComponent(id)}`),
    confirmQuote: (id: string) =>
      request<{ success: boolean; data: any }>(`/curator/quotes/${encodeURIComponent(id)}/confirm`, { method: "POST" }),
    askChange: (id: string, message: string) =>
      request<{ success: boolean; data: any }>(`/curator/quotes/${encodeURIComponent(id)}/change`, {
        method: "POST",
        body: JSON.stringify({ message }),
      }),
    trips: () => request<{ success: boolean; data: any[] }>(`/curator/trips`),
    trip: (id: string) => request<{ success: boolean; data: any }>(`/curator/trips/${encodeURIComponent(id)}`),
    uploadProof: (id: string, data: { proofUrl: string; proofName: string; invoiceNumber?: string; reference?: string }) =>
      request<{ success: boolean; data: any }>(`/curator/trips/${encodeURIComponent(id)}/proof`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    sendPassports: (id: string, passengers: any[]) =>
      request<{ success: boolean }>(`/curator/trips/${encodeURIComponent(id)}/passports`, {
        method: "POST",
        body: JSON.stringify({ passengers }),
      }),
    clients: () => request<{ success: boolean; data: any[] }>(`/curator/clients`),
    addClient: (data: any) =>
      request<{ success: boolean; data: any }>(`/curator/clients`, { method: "POST", body: JSON.stringify(data) }),
    linkClient: (id: string) =>
      request<{ success: boolean; data: any }>(`/curator/clients/${encodeURIComponent(id)}/link`, { method: "POST" }),
    documents: () => request<{ success: boolean; data: any }>(`/curator/documents`),
    libraryDocument: (code: string) =>
      request<{ success: boolean; data: any }>(`/curator/documents/library/${encodeURIComponent(code)}`),
    acknowledge: (code: string) =>
      request<{ success: boolean }>(`/curator/documents/library/${encodeURIComponent(code)}/acknowledge`, { method: "POST" }),
    signAgreement: () => request<{ success: boolean; data: any }>(`/curator/agreement/sign`, { method: "POST" }),
    tokens: () => request<{ success: boolean; data: any }>(`/curator/tokens`),
    buyTokens: (tokens: number, origin: string) =>
      request<{ success: boolean; data: any }>(`/curator/tokens/buy`, { method: "POST", body: JSON.stringify({ tokens, origin }) }),
    checkPurchase: (id: string) =>
      request<{ success: boolean; data: any }>(`/curator/tokens/purchases/${encodeURIComponent(id)}/check`, { method: "POST" }),
    estimate: (params: Record<string, string | number | undefined>) => {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => v !== undefined && v !== "" && q.set(k, String(v)));
      return request<{ success: boolean; data: any }>(`/curator/estimate?${q.toString()}`);
    },
  },
  pay: {
    get: (token: string) => request<{ success: boolean; data: any }>(`/pay/${encodeURIComponent(token)}`),
    proof: (token: string, data: { payerName?: string; reference?: string; proofName?: string; proofUrl?: string; amount?: number }) =>
      request<{ success: boolean; data: any }>(`/pay/${encodeURIComponent(token)}/proof`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    check: (token: string) => request<{ success: boolean; data: any }>(`/pay/${encodeURIComponent(token)}/check`, { method: "POST" }),
  },

  // Per-account defaults remembered by the quote builder (step 01)
  accountPreferences: {
    list: () => request<{ success: boolean; data: any[] }>("/account-preferences"),
    save: (accountNumber: string, data: { accountId?: string; quoteDefaults: Record<string, any> }) =>
      request<{ success: boolean; data: any }>(`/account-preferences/${encodeURIComponent(accountNumber)}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },

  // Airports
  airports: {
    search: (q: string) => request<any[]>(`/airports/search?q=${encodeURIComponent(q)}`),
    get: (code: string) => request<any>(`/airports/${code}`),
  },

  // Clients
  clients: {
    list: (params?: Record<string, any>) => {
      const q = params ? `?${new URLSearchParams(params).toString()}` : "";
      return request<{ clients: any[]; total: number }>(`/clients${q}`);
    },
    get: (id: string) => request<any>(`/clients/${id}`),
    create: (data: any) => request<any>("/clients", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/clients/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  },

  // Passenger and contact directory
  contacts: {
    list: (params?: Record<string, any>) => {
      const q = params ? `?${new URLSearchParams(params).toString()}` : "";
      return request<{ success: boolean; data: any[]; total: number }>(`/contacts${q}`);
    },
    getTrips: (id: string) =>
      request<{ success: boolean; data: any[] }>(`/contacts/${encodeURIComponent(id)}/trips`),
    create: (data: any) =>
      request<{ success: boolean; data: any }>("/contacts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/contacts/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/contacts/${encodeURIComponent(id)}`, { method: "DELETE" }),
  },

  // Operators
  operators: {
    list: (params?: Record<string, any>) => {
      const q = params ? `?${new URLSearchParams(params).toString()}` : "";
      return request<{ operators: any[]; total: number }>(`/operators${q}`);
    },
    get: (id: string) => request<any>(`/operators/${id}`),
    create: (data: any) => request<any>("/operators", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/operators/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    expiryAlerts: () => request<any[]>("/operators/expiry-alerts"),
    updateStatus: (id: string, status: string, notes?: string) =>
      request<any>(`/operators/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, notes }),
      }),
  },

  // Agent Requests
  agentRequests: {
    list: (params?: Record<string, any>) => {
      const q = params ? `?${new URLSearchParams(params).toString()}` : "";
      return request<{ success: boolean; data: any[]; pagination: any }>(`/agent-requests${q}`);
    },
    get: (id: string) => request<{ success: boolean; data: any }>(`/agent-requests/${id}`),
    create: (data: any) =>
      request<{ success: boolean; data: any }>("/agent-requests", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateStatus: (id: string, status: string, assignedTo?: string, assignedToEmail?: string) =>
      request<{ success: boolean; data: any }>(`/agent-requests/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, assignedTo, assignedToEmail }),
      }),
    addMessage: (id: string, message: string, attachments?: any[]) =>
      request<{ success: boolean; data: any }>(`/agent-requests/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({ message, attachments }),
      }),
    addSourcingOption: (id: string, option: any) =>
      request<{ success: boolean; data: any }>(`/agent-requests/${id}/sourcing-options`, {
        method: "POST",
        body: JSON.stringify(option),
      }),
    updateAvinodeId: (id: string, avInodeTripId: string) =>
      request<{ success: boolean; data: any }>(`/agent-requests/${id}/avinode-id`, {
        method: "PATCH",
        body: JSON.stringify({ avInodeTripId }),
      }),
    fulfill: (id: string, data?: any) =>
      request<{ success: boolean; data: any }>(`/agent-requests/${id}/fulfill`, {
        method: "POST",
        body: JSON.stringify(data || {}),
      }),
  },

  // Quotes
  quotes: {
    list: (params?: Record<string, any>) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : "";
      return request<{ quotes?: any[]; data?: any[]; total?: number; page?: number; pages?: number }>(`/quotes${query}`);
    },
    get: (id: string) => request<any>(`/quotes/${id}`),
    create: (data: any) =>
      request<{ success: boolean; data: any }>("/bookings", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    generate: (data: { agentRequestId: string; aircraftId: string; [key: string]: any }) =>
      request<any>("/quotes/generate", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    /** Email the quote; `to` picks the client or the Curator (default: the Curator, else the client). */
    send: (id: string, to?: "client" | "curator") =>
      request<{ message: string; quoteStatus: string; to?: string }>(`/quotes/${encodeURIComponent(id)}/send`, {
        method: "POST",
        body: JSON.stringify({ to, origin: typeof window !== "undefined" ? window.location.origin : undefined }),
      }),
    updateStatus: (id: string, quoteStatus: string) =>
      request<any>(`/quotes/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ quoteStatus }),
      }),
    newVersion: (id: string, overrides?: any) =>
      request<any>(`/quotes/${id}/version`, {
        method: "POST",
        body: JSON.stringify(overrides || {}),
      }),
    revise: (id: string, overrides?: any) =>
      request<any>(`/quotes/${id}/revise`, {
        method: "POST",
        body: JSON.stringify(overrides || {}),
      }),
    advanceToContract: (id: string, booking: any) =>
      request<{ success: boolean; data: any }>(`/quotes/${id}/advance-to-contract`, {
        method: "POST",
        body: JSON.stringify(booking),
      }),
    convertToBooking: (id: string, booking?: any) =>
      request<{ success: boolean; data: any }>(`/quotes/${id}/convert-to-booking`, {
        method: "POST",
        body: JSON.stringify(booking || {}),
      }),
  },

  // Notifications
  notifications: {
    list: (read?: boolean) => {
      const q = read !== undefined ? `?read=${read}` : "";
      return request<{ notifications: any[]; unreadCount: number }>(`/notifications${q}`);
    },
    markRead: (id: string) =>
      request<any>(`/notifications/${id}/read`, {
        method: "PATCH",
      }),
    markAllRead: () =>
      request<any>("/notifications/mark-all-read", {
        method: "PATCH",
      }),
  },

  // Users (Super Admin & Admin management)
  users: {
    list: (params?: { role?: string; isActive?: boolean; search?: string }) => {
      const q = params ? `?${new URLSearchParams(params as any).toString()}` : "";
      return request<{ success: boolean; data: any[]; total: number }>(`/users${q}`);
    },
    get: (id: string) => request<{ success: boolean; data: any }>(`/users/${id}`),
    create: (userData: { name: string; email: string; password: string; role: string; phone?: string; title?: string }) =>
      request<{ success: boolean; message: string; data: any }>("/users", {
        method: "POST",
        body: JSON.stringify(userData),
      }),
    update: (id: string, updates: Record<string, any>) =>
      request<{ success: boolean; message: string; data: any }>(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/users/${id}`, {
        method: "DELETE",
      }),
  },

  // Audit Log & Activity Trail
  auditLog: {
    list: (params?: { entityType?: string; action?: string; userEmail?: string; search?: string; page?: number; limit?: number }) => {
      const q = params ? `?${new URLSearchParams(params as any).toString()}` : "";
      return request<{ success: boolean; data: any[]; entries: any[]; total: number; page: number; pages: number }>(`/audit-log${q}`);
    },
    create: (entry: { userEmail?: string; userName?: string; action: string; entityType: string; entityId: string; details: string }) =>
      request<{ success: boolean; data: any }>("/audit-log", {
        method: "POST",
        body: JSON.stringify(entry),
      }),
  },

  // Tokenomics & Subscription (Agent role)
  tokens: {
    getBalance: () =>
      request<{
        success: boolean;
        data: {
          tokens: number;
          isStaff: boolean;
          tokenTier: string;
          subscriptionStatus: string;
          subscriptionExpiresAt?: string;
          recentTransactions: any[];
        };
      }>("/tokens/balance"),
    subscribe: (data: { currency?: "GBP" | "USD"; paymentMethod?: string }) =>
      request<{
        success: boolean;
        message: string;
        data: {
          tokens: number;
          tokenTier: string;
          subscriptionStatus: string;
          subscriptionExpiresAt: string;
          transaction: any;
        };
      }>("/tokens/subscribe", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    deduct: (data: { amount?: number; action: string; description?: string }) =>
      request<{
        success: boolean;
        message: string;
        balance: number;
        transaction?: any;
        bypassed?: boolean;
      }>("/tokens/deduct", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getTransactions: () =>
      request<{
        success: boolean;
        data: any[];
        total: number;
      }>("/tokens/transactions"),
    grant: (data: { targetUserId: string; amount: number; reason?: string }) =>
      request<{
        success: boolean;
        message: string;
        data: { targetUserId: string; newBalance: number; transaction: any };
      }>("/tokens/grant", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // User Profile & Account Settings
  profile: {
    get: () => request<{ success: boolean; data: any }>("/users/profile"),
    update: (updates: Record<string, any>) =>
      request<{ success: boolean; message: string; data: any }>("/users/profile", {
        method: "PUT",
        body: JSON.stringify(updates),
      }),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      request<{ success: boolean; message: string }>("/users/change-password", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Flight Watch
  flightWatch: {
    list: () => request<{ success: boolean; data: any[]; summary: any; alertRules: any }>("/flight-watch"),
    rules: () => request<{ success: boolean; data: any }>("/flight-watch/rules"),
    updateRules: (rules: any) =>
      request<{ success: boolean; data: any; message: string }>("/flight-watch/rules", {
        method: "PUT",
        body: JSON.stringify(rules),
      }),
    shareLink: (tripNumber?: string) =>
      request<{ success: boolean; data: { token: string; expiresAt: string; tripNumber: string; url: string } }>(
        "/flight-watch/share-link",
        {
          method: "POST",
          body: JSON.stringify({ tripNumber }),
        }
      ),
    getShared: (token: string) => request<{ success: boolean; data: any }>(`/flight-watch/shared/${token}`),
    triggerAlert: (flightId: string, alertData: { message: string; tag?: string; severity?: string }) =>
      request<{ success: boolean; data: any; alert: any }>(`/flight-watch/${flightId}/alert`, {
        method: "POST",
        body: JSON.stringify(alertData),
      }),
  },

  // Library & Manuals
  library: {
    documents: (params?: { type?: string; status?: string; search?: string }) => {
      const query = params ? `?${new URLSearchParams(params as any).toString()}` : "";
      return request<{ success: boolean; data: any[]; meta: any }>(`/library/documents${query}`);
    },
    access: () => request<{ success: boolean; data: { matrix: any[]; exceptions: any[] } }>("/library/access"),
    updateAccess: (matrix: any[]) =>
      request<{ success: boolean; message: string }>("/library/access", {
        method: "PUT",
        body: JSON.stringify({ matrix }),
      }),
    addException: (data: { personName: string; personRole: string; exception: string; grantedBy?: string; until?: string }) =>
      request<{ success: boolean; data: any; message: string }>("/library/exceptions", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    removeException: (id: string) =>
      request<{ success: boolean; message: string }>(`/library/exceptions/${id}`, {
        method: "DELETE",
      }),
    createDocument: (data: any) =>
      request<{ success: boolean; data: any; message: string }>("/library/documents", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Messages & Automations
  messagesAutomations: {
    automations: (params?: { group?: string; search?: string }) => {
      const query = params ? `?${new URLSearchParams(params as any).toString()}` : "";
      return request<{ success: boolean; data: any[] }>(`/messages/automations${query}`);
    },
    getAutomation: (code: string) => request<{ success: boolean; data: any }>(`/messages/automations/${code}`),
    updateAutomation: (code: string, data: any) =>
      request<{ success: boolean; data: any; message: string }>(`/messages/automations/${code}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    toggleAutomation: (code: string) =>
      request<{ success: boolean; data: any; status: boolean }>(`/messages/automations/${code}/toggle`, {
        method: "PATCH",
      }),
    stats: () => request<{ success: boolean; data: any }>("/messages/stats"),
    queue: (status?: string) => {
      const query = status ? `?status=${status}` : "";
      return request<{ success: boolean; data: any[] }>(`/messages/queue${query}`);
    },
    sendOneOff: (data: { recipient: string; recipientType?: string; channel?: string; content: string; tripNumber?: string }) =>
      request<{ success: boolean; data: any; message: string }>("/messages/send-one-off", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    test: (data: { code: string; targetEmail?: string; targetPhone?: string }) =>
      request<{ success: boolean; message: string }>("/messages/automations/test", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Curator Tiers & Token Rules
  curatorTiers: {
    get: () => request<{ success: boolean; data: any }>("/curator-tiers"),
    update: (data: { tiers?: any[]; tokenRules?: any; directRoute?: any }) =>
      request<{ success: boolean; data: any; message: string }>("/curator-tiers", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    topUp: (data: { curatorId: string; curatorName: string; tokensAdded?: number; grantedBy?: string }) =>
      request<{ success: boolean; data: any; message: string }>("/curator-tiers/top-up", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Trip Messages Plan & Real-time Messages
  tripMessages: {
    get: (tripNumber: string) =>
      request<{ success: boolean; data: any[] }>(`/messages/trip/${encodeURIComponent(tripNumber)}`),
    send: (tripNumber: string, data: { to: string; template?: string; content: string; channel?: string }) =>
      request<{ success: boolean; data: any; message: string }>(`/messages/trip/${encodeURIComponent(tripNumber)}/send`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    approve: (tripNumber: string, msgId: string) =>
      request<{ success: boolean; data?: any; message: string }>(
        `/messages/trip/${encodeURIComponent(tripNumber)}/approve/${encodeURIComponent(msgId)}`,
        { method: "POST" }
      ),
  },
};
