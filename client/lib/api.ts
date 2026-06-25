import type { AuthResponse, AuthUser, NewTicket, Ticket, TicketFilters, TicketStatus } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const TICKETS_URL = `${API_BASE}/api/v1/tickets`;
const AUTH_URL = `${API_BASE}/api/v1/auth`;

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parseError(response: Response): Promise<string> {
  const fallback = `Request failed (${response.status})`;
  try {
    const data = (await response.json()) as { detail?: unknown };
    const detail = data.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { msg?: string };
      return first.msg ?? fallback;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Free-tier hosts spin down when idle; the first request can fail or 502 while the
// server wakes (up to ~50s). Retry transient failures before surfacing an error.
const WAKE_RETRY_DELAYS = [2000, 5000, 10000, 15000];

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const options: RequestInit = {
    cache: "no-store",
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
  };

  for (let attempt = 0; ; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, options);
    } catch {
      if (attempt < WAKE_RETRY_DELAYS.length) {
        await wait(WAKE_RETRY_DELAYS[attempt]);
        continue;
      }
      throw new ApiError(
        "Could not reach the server. If this is the live demo, the free-tier backend may be waking up — please wait a moment and try again.",
        0,
      );
    }

    if ((response.status === 502 || response.status === 503) && attempt < WAKE_RETRY_DELAYS.length) {
      await wait(WAKE_RETRY_DELAYS[attempt]);
      continue;
    }
    if (!response.ok) {
      throw new ApiError(await parseError(response), response.status);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }
}

export function getTickets(filters: TicketFilters = {}): Promise<Ticket[]> {
  const params = new URLSearchParams();
  filters.status?.forEach((status) => params.append("status", status));
  filters.priority?.forEach((priority) => params.append("priority", priority));
  if (filters.search) params.set("search", filters.search);
  if (filters.sort) params.set("sort", filters.sort);
  const query = params.toString();
  return request<Ticket[]>(query ? `${TICKETS_URL}?${query}` : TICKETS_URL);
}

export function getTicket(id: number): Promise<Ticket> {
  return request<Ticket>(`${TICKETS_URL}/${id}`);
}

export function createTicket(payload: NewTicket): Promise<Ticket> {
  return request<Ticket>(TICKETS_URL, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTicketStatus(id: number, status: TicketStatus): Promise<Ticket> {
  return request<Ticket>(`${TICKETS_URL}/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function register(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>(`${AUTH_URL}/register`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>(`${AUTH_URL}/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getMe(): Promise<AuthUser> {
  return request<AuthUser>(`${AUTH_URL}/me`);
}
