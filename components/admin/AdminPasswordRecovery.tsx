"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type RefObject } from "react";
import {
  ArrowRight,
  CheckCircle,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  LockKey,
} from "@phosphor-icons/react";
import { AdminAuthShell } from "./AdminLogin";

const genericConfirmation =
  "If that address is registered for an admin account, you’ll receive a password reset link.";

export function AdminForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(genericConfirmation);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (sent) heading.current?.focus();
  }, [sent]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || "Unable to request a reset link. Please try again.",
        );
      setMessage(data.message || genericConfirmation);
      setSent(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to request a reset link. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminAuthShell>
      <section
        className="rr-admin-auth-card rr-admin-auth-recovery"
        aria-labelledby="admin-forgot-title"
      >
        <div className="rr-admin-auth-kicker">
          <div className="rr-admin-eyebrow">ADMIN ACCESS</div>
          <EnvelopeSimple size={20} aria-hidden="true" />
        </div>
        <h1 id="admin-forgot-title" ref={heading} tabIndex={-1}>
          {sent ? "Check your email." : "Forgot your password?"}
        </h1>
        {sent ? (
          <>
            <div className="rr-admin-recovery-status" role="status">
              <CheckCircle size={24} aria-hidden="true" />
              <p>{message}</p>
            </div>
            <p className="rr-admin-recovery-note">
              Check your inbox and spam folder. Use the link in the email to
              choose a new password.
            </p>
            <div className="rr-admin-recovery-actions">
              <button
                type="button"
                className="rr-admin-button rr-admin-secondary"
                onClick={() => setSent(false)}
              >
                Send another link
              </button>
            </div>
          </>
        ) : (
          <>
            <p>
              Enter the email address associated with your admin account. We’ll
              send instructions to reset your password.
            </p>
            <form onSubmit={submit} aria-busy={busy}>
              <label className="rr-admin-label" htmlFor="admin-recovery-email">
                Email address
              </label>
              <input
                className="rr-admin-recovery-email"
                id="admin-recovery-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={busy}
                aria-describedby={error ? "admin-forgot-error" : undefined}
              />
              {error && (
                <p className="rr-admin-error" id="admin-forgot-error" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="rr-admin-button rr-admin-primary rr-admin-auth-submit"
                disabled={busy}
              >
                {busy ? "Sending…" : "Send reset link"}
                <span className="rr-admin-button-icon" aria-hidden="true">
                  <ArrowRight size={19} />
                </span>
              </button>
            </form>
          </>
        )}
        <Link className="rr-admin-text-link" href="/admin">
          Back to sign in
        </Link>
      </section>
    </AdminAuthShell>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  disabled,
  describedBy,
  invalid,
  inputRef,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  describedBy: string;
  invalid?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="rr-admin-recovery-field">
      <label className="rr-admin-label" htmlFor={id}>
        {label}
      </label>
      <div className="rr-admin-password">
        <input
          ref={inputRef}
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={512}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
        />
        <button
          type="button"
          className="rr-admin-icon-button"
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
          disabled={disabled}
        >
          {visible ? (
            <EyeSlash size={19} aria-hidden="true" />
          ) : (
            <Eye size={19} aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}

export function AdminResetPassword() {
  const captured = useRef<{ done: boolean; token: string | null }>({
    done: false,
    token: null,
  });
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [mismatch, setMismatch] = useState(false);
  const confirmationInput = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Capture once before clearing the URL. The ref survives Strict Mode's
    // repeated effect; the server and first client render both show loading.
    if (!captured.current.done) {
      captured.current = {
        done: true,
        token:
          /^#token=([a-f0-9]{64})$/i.exec(window.location.hash)?.[1] || null,
      };
      if (window.location.hash)
        window.history.replaceState(
          window.history.state,
          "",
          `${window.location.pathname}${window.location.search}`,
        );
    }
    const value = captured.current.token;
    let active = true;
    queueMicrotask(() => {
      if (active) setToken(value);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (success) heading.current?.focus();
  }, [success]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || busy) return;
    setError("");
    setMismatch(false);
    if (password.length < 12 || password.length > 512) {
      setError("Use a password between 12 and 512 characters.");
      return;
    }
    if (password !== confirmation) {
      setMismatch(true);
      setError("The passwords do not match.");
      confirmationInput.current?.focus();
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 400) {
          captured.current.token = null;
          setToken(null);
          setPassword("");
          setConfirmation("");
          return;
        }
        throw new Error(
          data.error || "Unable to reset your password. Please try again.",
        );
      }
      captured.current.token = null;
      setToken(null);
      setPassword("");
      setConfirmation("");
      setSuccess(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to reset your password. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  const invalid = token === null && !success;
  return (
    <AdminAuthShell>
      <section
        className="rr-admin-auth-card rr-admin-auth-recovery"
        aria-labelledby="admin-reset-title"
      >
        <div className="rr-admin-auth-kicker">
          <div className="rr-admin-eyebrow">ADMIN ACCESS</div>
          <LockKey size={20} aria-hidden="true" />
        </div>
        <h1 id="admin-reset-title" ref={heading} tabIndex={-1}>
          {success
            ? "Password updated."
            : invalid
              ? "Request a new link."
              : "Reset your password."}
        </h1>
        {success ? (
          <>
            <div className="rr-admin-recovery-status" role="status">
              <CheckCircle size={24} aria-hidden="true" />
              <p>
                Your password has been updated. Sign in with your new password
                to access your workspace.
              </p>
            </div>
            <Link className="rr-admin-button rr-admin-primary rr-admin-auth-submit" href="/admin">
              Sign in
              <span className="rr-admin-button-icon" aria-hidden="true">
                <ArrowRight size={19} />
              </span>
            </Link>
          </>
        ) : invalid ? (
          <>
            <p role="status">
              This reset link is missing, invalid or has expired. Request a new
              email to continue.
            </p>
            <Link
              className="rr-admin-button rr-admin-primary rr-admin-auth-submit"
              href="/admin/forgot-password"
            >
              Request a new link
              <span className="rr-admin-button-icon" aria-hidden="true">
                <ArrowRight size={19} />
              </span>
            </Link>
            <Link className="rr-admin-text-link" href="/admin">
              Back to sign in
            </Link>
          </>
        ) : token === undefined ? (
          <p role="status">Preparing the reset form…</p>
        ) : (
          <>
            <p>Choose a new password for your admin account.</p>
            <form onSubmit={submit} aria-busy={busy}>
              <p className="rr-admin-recovery-hint" id="admin-reset-requirements">
                Use 12–512 characters.
              </p>
              <PasswordField
                id="admin-new-password"
                label="New password"
                value={password}
                onChange={(value) => {
                  setPassword(value);
                  setError("");
                  setMismatch(false);
                }}
                disabled={busy}
                describedBy="admin-reset-requirements"
              />
              <PasswordField
                id="admin-confirm-password"
                label="Confirm new password"
                value={confirmation}
                onChange={(value) => {
                  setConfirmation(value);
                  setError("");
                  setMismatch(false);
                }}
                disabled={busy}
                describedBy={`admin-reset-requirements${error ? " admin-reset-error" : ""}`}
                invalid={mismatch}
                inputRef={confirmationInput}
              />
              {error && (
                <p className="rr-admin-error" id="admin-reset-error" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="rr-admin-button rr-admin-primary rr-admin-auth-submit"
                disabled={busy}
              >
                {busy ? "Updating…" : "Reset password"}
                <span className="rr-admin-button-icon" aria-hidden="true">
                  <ArrowRight size={19} />
                </span>
              </button>
            </form>
            <Link className="rr-admin-text-link" href="/admin">
              Back to sign in
            </Link>
          </>
        )}
      </section>
    </AdminAuthShell>
  );
}
