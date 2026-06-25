"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAuth } from "@/components/AuthProvider";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await register(email.trim(), password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create your account.");
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-card__head">
        <span className="brand__mark brand__mark--lg" aria-hidden="true" />
        <span className="auth-brand">Helpdesk</span>
        <h1 className="auth-card__title">Create your account</h1>
        <p className="auth-card__subtitle">Start managing support tickets.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <p className="field__hint">At least 8 characters.</p>
        </div>
        <button type="submit" className="button button--primary auth-submit" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="auth-alt">
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </div>
  );
}
