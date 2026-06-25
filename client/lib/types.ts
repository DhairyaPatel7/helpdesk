export type TicketStatus = "open" | "in_progress" | "resolved";
export type TicketPriority = "low" | "medium" | "high";
export type TicketSort = "newest" | "oldest" | "priority";

export interface Ticket {
  id: number;
  title: string;
  description: string;
  customerName: string;
  customerEmail: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
}

export interface NewTicket {
  title: string;
  description: string;
  customerName: string;
  customerEmail: string;
  priority: TicketPriority;
}

export interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  search?: string;
  sort?: TicketSort;
}

export const STATUS_ORDER: TicketStatus[] = ["open", "in_progress", "resolved"];
export const PRIORITY_ORDER: TicketPriority[] = ["low", "medium", "high"];

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const STATUS_OPTIONS = STATUS_ORDER.map((value) => ({
  value,
  label: STATUS_LABELS[value],
  tone: value,
}));

export const PRIORITY_OPTIONS = PRIORITY_ORDER.map((value) => ({
  value,
  label: PRIORITY_LABELS[value],
  tone: value,
}));

export const SORT_OPTIONS: { value: TicketSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "priority", label: "Priority" },
];
