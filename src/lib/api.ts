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

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("orbelo_access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...options.headers,
  };

  try {
    const res = await fetch(url, { ...options, headers });
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
    throw new Error(errorData.message || `API Error: ${res.status}`);
  } catch (err: any) {
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
    send: (id: string) =>
      request<{ message: string; quoteStatus: string }>(`/quotes/${id}/send`, {
        method: "POST",
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
