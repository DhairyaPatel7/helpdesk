import type { NewTicket, Ticket, TicketFilters, TicketStatus } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const TICKETS_URL = `${API_BASE}/api/v1/tickets`;

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
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      ...init,
    });
  } catch {
    throw new ApiError("Could not reach the server. Is the API running?", 0);
  }

  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
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
