"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import KanbanBoard from "@/components/KanbanBoard";
import Spinner from "@/components/Spinner";
import { useToast } from "@/components/ToastProvider";
import { ApiError, getTickets, updateTicketStatus } from "@/lib/api";
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
      setTickets(await getTickets());
      setState("ready");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
      setState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function moveTicket(id: number, status: TicketStatus) {
    const current = tickets.find((ticket) => ticket.id === id);
    if (!current || current.status === status) return;

    const previous = tickets;
    setTickets((prev) => prev.map((ticket) => (ticket.id === id ? { ...ticket, status } : ticket)));

    try {
      const updated = await updateTicketStatus(id, status);
      setTickets((prev) => prev.map((ticket) => (ticket.id === id ? updated : ticket)));
      showToast("Status updated.", "success");
    } catch (err) {
      setTickets(previous);
      showToast(err instanceof ApiError ? err.message : "Could not update the status.", "error");
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>Board</h1>
        <Link href="/" className="button">
          List view
        </Link>
      </div>

      <p className="board__hint">Drag a ticket between columns to change its status.</p>

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

      {state === "ready" && <KanbanBoard tickets={tickets} onMove={moveTicket} />}
    </div>
  );
}
