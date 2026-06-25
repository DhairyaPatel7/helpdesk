"use client";

import Link from "next/link";
import { useState } from "react";

import { STATUS_LABELS, STATUS_ORDER, type Ticket, type TicketStatus } from "@/lib/types";

import PriorityBadge from "./PriorityBadge";

interface Props {
  tickets: Ticket[];
  onMove: (id: number, status: TicketStatus) => void;
}

export default function KanbanBoard({ tickets, onMove }: Props) {
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [overColumn, setOverColumn] = useState<TicketStatus | null>(null);

  function handleDrop(status: TicketStatus) {
    if (draggingId !== null) {
      onMove(draggingId, status);
    }
    setDraggingId(null);
    setOverColumn(null);
  }

  return (
    <div className="board">
      {STATUS_ORDER.map((status) => {
        const columnTickets = tickets.filter((ticket) => ticket.status === status);
        return (
          <section
            key={status}
            className={`column${overColumn === status ? " column--over" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              setOverColumn(status);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setOverColumn(null);
              }
            }}
            onDrop={() => handleDrop(status)}
          >
            <div className="column__head">
              <span className="column__title">
                <span className={`column__dot column__dot--${status}`} aria-hidden="true" />
                {STATUS_LABELS[status]}
              </span>
              <span className="column__count">{columnTickets.length}</span>
            </div>

            <div className="column__body">
              {columnTickets.length === 0 ? (
                <p className="column__empty">Drop tickets here</p>
              ) : (
                columnTickets.map((ticket) => (
                  <article
                    key={ticket.id}
                    className={`board-card${draggingId === ticket.id ? " board-card--dragging" : ""}`}
                    draggable
                    onDragStart={() => setDraggingId(ticket.id)}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setOverColumn(null);
                    }}
                  >
                    <div className="board-card__top">
                      <span className="board-card__id">#{ticket.id}</span>
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                    <Link href={`/tickets/${ticket.id}`} draggable={false}>
                      <h3 className="board-card__title">{ticket.title}</h3>
                    </Link>
                    <p className="board-card__customer">{ticket.customerName}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
