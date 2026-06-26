import type {
  AuthResponse,
  AuthUser,
  NewTicket,
  Ticket,
  TicketFilters,
  TicketPage,
  TicketStatus,
} from "./types";

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

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let response: Response;
  try {
    response = await fetch(url, {
      cache: "no-store",
      ...init,
      headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
    });
  } catch {
    throw new ApiError("Could not reach the server. Please try again.", 0);
  }

  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function getTickets(
  filters: TicketFilters = {},
  pagination: { limit?: number; offset?: number } = {},
): Promise<TicketPage> {
  const params = new URLSearchParams();
  filters.status?.forEach((status) => params.append("status", status));
  filters.priority?.forEach((priority) => params.append("priority", priority));
  if (filters.search) params.set("search", filters.search);
  if (filters.sort) params.set("sort", filters.sort);
  if (pagination.limit != null) params.set("limit", String(pagination.limit));
  if (pagination.offset != null) params.set("offset", String(pagination.offset));
  const query = params.toString();
  return request<TicketPage>(query ? `${TICKETS_URL}?${query}` : TICKETS_URL);
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

export function reorderTickets(status: TicketStatus, orderedIds: number[]): Promise<Ticket[]> {
  return request<Ticket[]>(`${TICKETS_URL}/reorder`, {
    method: "POST",
    body: JSON.stringify({ status, orderedIds }),
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
