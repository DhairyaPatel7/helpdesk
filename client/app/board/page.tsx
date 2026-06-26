"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import KanbanBoard from "@/components/KanbanBoard";
import Spinner from "@/components/Spinner";
import { useToast } from "@/components/ToastProvider";
import { ApiError, getTickets, reorderTickets } from "@/lib/api";
import type { Ticket, TicketStatus } from "@/lib/types";

type LoadState = "loading" | "error" | "ready";

export default function BoardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setState("loading");
    setError("");
    try {
      const page = await getTickets({}, { limit: 100 });
      setTickets(page.items);
      setState("ready");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
      setState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function reorder(status: TicketStatus, orderedIds: number[]) {
    const previous = tickets;
    const statusChanged = previous.some(
      (ticket) => orderedIds.includes(ticket.id) && ticket.status !== status,
    );

    setTickets((prev) =>
      prev.map((ticket) => {
        const index = orderedIds.indexOf(ticket.id);
        return index === -1 ? ticket : { ...ticket, status, position: index };
      }),
    );

    try {
      await reorderTickets(status, orderedIds);
      if (statusChanged) showToast("Status updated.", "success");
    } catch (err) {
      setTickets(previous);
      showToast(err instanceof ApiError ? err.message : "Could not move the ticket.", "error");
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>Board</h1>
        <Link href="/tickets/new" className="button button--primary">
          New ticket
        </Link>
      </div>

      <p className="board__hint">
        Drag a ticket within a column to reorder it, or across columns to change its status.
      </p>

      {state === "loading" && <Spinner />}

      {state === "error" && (
        <div className="state state--error">
          <p className="state__title">Unable to load tickets</p>
          <p className="state__hint">{error}</p>
          <button type="button" className="button" onClick={() => void load()}>
            Try again
          </button>
        </div>
      )}

      {state === "ready" && <KanbanBoard tickets={tickets} onReorder={reorder} />}
    </div>
  );
}
