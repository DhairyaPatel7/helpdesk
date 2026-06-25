"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import Filters from "@/components/Filters";
import Skeleton from "@/components/Skeleton";
import TicketList from "@/components/TicketList";
import { ApiError, getTickets } from "@/lib/api";
import { PAGE_SIZE, type Ticket, type TicketFilters } from "@/lib/types";

type LoadState = "loading" | "error" | "ready";

export default function HomePage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<TicketFilters>({});
  const [searchText, setSearchText] = useState("");
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    const next = searchText.trim() || undefined;
    const timer = setTimeout(() => {
      setFilters((prev) => (prev.search === next ? prev : { ...prev, search: next }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    setPage(0);
  }, [filters]);

  const load = useCallback(async () => {
    setState("loading");
    setError("");
    try {
      const result = await getTickets(filters, { limit: PAGE_SIZE, offset: page * PAGE_SIZE });
      setTickets(result.items);
      setTotal(result.total);
      setState("ready");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
      setState("error");
    }
  }, [filters, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const pageCount = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="page-head">
        <h1>Tickets</h1>
        <div className="page-head__actions">
          {state === "ready" && (
            <span className="page-head__count">
              {total} {total === 1 ? "ticket" : "tickets"}
            </span>
          )}
          <Link href="/tickets/new" className="button button--primary">
            New ticket
          </Link>
        </div>
      </div>

      <div className="controls">
        <input
          type="search"
          className="search-input"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search by title or customer"
          aria-label="Search tickets"
        />
        <Filters filters={filters} onChange={setFilters} />
      </div>

      {state === "loading" && <Skeleton />}

      {state === "error" && (
        <div className="state state--error">
          <span className="state__icon" aria-hidden="true">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </svg>
          </span>
          <p className="state__title">Unable to load tickets</p>
          <p className="state__hint">{error}</p>
          <button type="button" className="button" onClick={() => void load()}>
            Try again
          </button>
        </div>
      )}

      {state === "ready" && <TicketList tickets={tickets} />}

      {state === "ready" && pageCount > 1 && (
        <nav className="pagination" aria-label="Ticket pages">
          <button
            type="button"
            className="button"
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            disabled={page === 0}
          >
            Previous
          </button>
          <span className="pagination__status" aria-live="polite">
            Page {page + 1} of {pageCount}
          </span>
          <button
            type="button"
            className="button"
            onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
            disabled={page >= pageCount - 1}
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}
