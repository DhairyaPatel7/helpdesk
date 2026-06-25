"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useToast } from "@/components/ToastProvider";
import { ApiError, createTicket } from "@/lib/api";
import { PRIORITY_LABELS, PRIORITY_ORDER, type NewTicket } from "@/lib/types";

type FieldErrors = Partial<Record<keyof NewTicket, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function TicketForm() {
  const router = useRouter();
  const { showToast } = useToast();

  const [form, setForm] = useState<NewTicket>({
    title: "",
    description: "",
    customerName: "",
    customerEmail: "",
    priority: "medium",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof NewTicket>(key: K, value: NewTicket[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!form.title.trim()) next.title = "Title is required.";
    if (!form.description.trim()) next.description = "Description is required.";
    if (!form.customerName.trim()) next.customerName = "Customer name is required.";
    if (!form.customerEmail.trim()) {
      next.customerEmail = "Customer email is required.";
    } else if (!EMAIL_PATTERN.test(form.customerEmail.trim())) {
      next.customerEmail = "Enter a valid email address.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const created = await createTicket({
        title: form.title.trim(),
        description: form.description.trim(),
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        priority: form.priority,
      });
      showToast("Ticket created.", "success");
      router.push(`/tickets/${created.id}`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Could not create the ticket.", "error");
      setSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          type="text"
          value={form.title}
          onChange={(event) => update("title", event.target.value)}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "title-error" : undefined}
        />
        {errors.title && (
          <p id="title-error" className="field__error">
            {errors.title}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? "description-error" : undefined}
        />
        {errors.description && (
          <p id="description-error" className="field__error">
            {errors.description}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="customerName">Customer name</label>
        <input
          id="customerName"
          type="text"
          value={form.customerName}
          onChange={(event) => update("customerName", event.target.value)}
          aria-invalid={Boolean(errors.customerName)}
          aria-describedby={errors.customerName ? "customerName-error" : undefined}
        />
        {errors.customerName && (
          <p id="customerName-error" className="field__error">
            {errors.customerName}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="customerEmail">Customer email</label>
        <input
          id="customerEmail"
          type="email"
          value={form.customerEmail}
          onChange={(event) => update("customerEmail", event.target.value)}
          aria-invalid={Boolean(errors.customerEmail)}
          aria-describedby={errors.customerEmail ? "customerEmail-error" : undefined}
        />
        {errors.customerEmail && (
          <p id="customerEmail-error" className="field__error">
            {errors.customerEmail}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="priority">Priority</label>
        <select
          id="priority"
          value={form.priority}
          onChange={(event) => update("priority", event.target.value as NewTicket["priority"])}
        >
          {PRIORITY_ORDER.map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_LABELS[priority]}
            </option>
          ))}
        </select>
      </div>

      <div className="form__actions">
        <button type="submit" className="button button--primary" disabled={submitting}>
          {submitting ? "Creating…" : "Create ticket"}
        </button>
      </div>
    </form>
  );
}
