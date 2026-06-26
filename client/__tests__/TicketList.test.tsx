import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import TicketList from "@/components/TicketList";
import type { Ticket } from "@/lib/types";

function ticket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 1,
    title: "Payment fails",
    description: "Customer cannot pay.",
    customerName: "Jane Smith",
    customerEmail: "jane@example.com",
    status: "open",
    priority: "high",
    position: 0,
    createdAt: "2026-06-18T10:30:00Z",
    updatedAt: "2026-06-18T10:30:00Z",
    ...overrides,
  };
}

describe("TicketList", () => {
  it("renders a row for each ticket", () => {
    render(
      <TicketList
        tickets={[
          ticket({ id: 1, title: "Payment fails", customerName: "Jane Smith" }),
          ticket({ id: 2, title: "Login broken", customerName: "Marcus Lee" }),
        ]}
      />,
    );

    expect(screen.getByText("Payment fails")).toBeInTheDocument();
    expect(screen.getByText("Login broken")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("Marcus Lee")).toBeInTheDocument();
  });

  it("shows an empty state when there are no tickets", () => {
    render(<TicketList tickets={[]} />);
    expect(screen.getByText("No tickets found")).toBeInTheDocument();
  });
});
