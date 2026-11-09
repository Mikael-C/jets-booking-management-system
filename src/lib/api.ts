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

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errorData.message || `API Error: ${res.status}`);
  }
  return res.json();
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
    downloadQuotation: async (bookingId: string, filename = "quotation.pdf") => {
      const res = await fetch(`${API_BASE_URL}/documents/quotation/${bookingId}`, {
        method: "POST",
        headers: getAuthHeader(),
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    downloadInvoice: async (bookingId: string, filename = "invoice.pdf") => {
      const res = await fetch(`${API_BASE_URL}/documents/invoice/${bookingId}`, {
        method: "POST",
        headers: getAuthHeader(),
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    downloadFlightBrief: async (bookingId: string, filename = "flight-brief.pdf") => {
      const res = await fetch(`${API_BASE_URL}/documents/flight-brief/${bookingId}`, {
        method: "POST",
        headers: getAuthHeader(),
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    },
  },

  // Dashboard Analytics
  dashboard: {
    kpis: () => request<any>("/dashboard/kpis"),
    summary: () => request<any>("/dashboard/bookings-summary"),
    revenueChart: (months = 6) => request<any[]>(`/dashboard/revenue-chart?months=${months}`),
    upcomingFlights: (days = 7) => request<any[]>(`/dashboard/upcoming-flights?days=${days}`),
    alerts: () => request<any[]>("/dashboard/alerts"),
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
};
