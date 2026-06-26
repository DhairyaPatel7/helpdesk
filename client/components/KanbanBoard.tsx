"use client";

import Link from "next/link";
import { Fragment, useState } from "react";

import { STATUS_LABELS, STATUS_ORDER, type Ticket, type TicketStatus } from "@/lib/types";

import PriorityBadge from "./PriorityBadge";

interface Props {
  tickets: Ticket[];
  onReorder: (status: TicketStatus, orderedIds: number[]) => void;
}

interface DropTarget {
  status: TicketStatus;
  index: number;
}

function sameOrder(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function dropIndexFromPointer(container: HTMLElement, clientY: number, draggingId: number): number {
  const cards = Array.from(container.querySelectorAll<HTMLElement>("[data-card-id]")).filter(
    (card) => Number(card.dataset.cardId) !== draggingId,
  );
  for (let i = 0; i < cards.length; i += 1) {
    const rect = cards[i].getBoundingClientRect();
    if (clientY < rect.top + rect.height / 2) return i;
  }
  return cards.length;
}

export default function KanbanBoard({ tickets, onReorder }: Props) {
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  function reset() {
    setDraggingId(null);
    setDropTarget(null);
  }

  function columnIds(status: TicketStatus): number[] {
    return tickets
      .filter((ticket) => ticket.status === status)
      .sort((a, b) => a.position - b.position || a.id - b.id)
      .map((ticket) => ticket.id);
  }

  function handleDrop(status: TicketStatus) {
    if (draggingId === null || dropTarget === null || dropTarget.status !== status) {
      reset();
      return;
    }
    const current = columnIds(status);
    const without = current.filter((id) => id !== draggingId);
    const ordered = [...without.slice(0, dropTarget.index), draggingId, ...without.slice(dropTarget.index)];
    if (!(current.includes(draggingId) && sameOrder(current, ordered))) {
      onReorder(status, ordered);
    }
    reset();
  }

  return (
    <div className="board">
      {STATUS_ORDER.map((status) => {
        const ids = columnIds(status);
        const cards = ids.map((id) => tickets.find((ticket) => ticket.id === id)!);
        const isOver = dropTarget?.status === status && draggingId !== null;
        const remaining = ids.filter((id) => id !== draggingId);
        const indicatorBefore = isOver
          ? dropTarget.index < remaining.length
            ? remaining[dropTarget.index]
            : null
          : undefined;

        return (
          <section
            key={status}
            className={`column${isOver ? " column--over" : ""}`}
            onDragOver={(event) => {
              if (draggingId === null) return;
              event.preventDefault();
              const index = dropIndexFromPointer(event.currentTarget, event.clientY, draggingId);
              setDropTarget((prev) =>
                prev?.status === status && prev.index === index ? prev : { status, index },
              );
            }}
            onDrop={() => handleDrop(status)}
          >
            <div className="column__head">
              <span className="column__title">
                <span className={`column__dot column__dot--${status}`} aria-hidden="true" />
                {STATUS_LABELS[status]}
              </span>
              <span className="column__count">{cards.length}</span>
            </div>

            <div className="column__body">
              {cards.length === 0 ? (
                isOver ? (
                  <div className="column__indicator" />
                ) : (
                  <p className="column__empty">Drop tickets here</p>
                )
              ) : (
                <>
                  {cards.map((ticket) => (
                    <Fragment key={ticket.id}>
                      {isOver && ticket.id === indicatorBefore && <div className="column__indicator" />}
                      <article
                        data-card-id={ticket.id}
                        className={`board-card${draggingId === ticket.id ? " board-card--dragging" : ""}`}
                        draggable
                        onDragStart={() => setDraggingId(ticket.id)}
                        onDragEnd={reset}
                      >
                        <div className="board-card__top">
                          <span className="board-card__id">#{ticket.id}</span>
                          <PriorityBadge priority={ticket.priority} />
                        </div>
                        <Link href={`/tickets/${ticket.id}`} draggable={false} prefetch={false}>
                          <h3 className="board-card__title">{ticket.title}</h3>
                        </Link>
                        <p className="board-card__customer">{ticket.customerName}</p>
                      </article>
                    </Fragment>
                  ))}
                  {isOver && indicatorBefore === null && <div className="column__indicator" />}
                </>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
