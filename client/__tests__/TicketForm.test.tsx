import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import TicketForm from "@/components/TicketForm";
import ToastProvider from "@/components/ToastProvider";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function renderForm() {
  return render(
    <ToastProvider>
      <TicketForm />
    </ToastProvider>,
  );
}

describe("TicketForm", () => {
  it("shows validation errors when required fields are empty", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /create ticket/i }));

    expect(await screen.findByText("Title is required.")).toBeInTheDocument();
    expect(screen.getByText("Description is required.")).toBeInTheDocument();
    expect(screen.getByText("Customer name is required.")).toBeInTheDocument();
    expect(screen.getByText("Customer email is required.")).toBeInTheDocument();
  });

  it("rejects an invalid email address", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText("Title"), "Cannot log in");
    await user.type(screen.getByLabelText("Description"), "Login button does nothing.");
    await user.type(screen.getByLabelText("Customer name"), "Sam Doe");
    await user.type(screen.getByLabelText("Customer email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: /create ticket/i }));

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
  });
});
