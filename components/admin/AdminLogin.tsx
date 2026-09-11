"use client";
import Link from "next/link";
import Image from "@/components/site-image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKey, Eye, EyeSlash } from "@phosphor-icons/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { projectMediaSource } from "@/lib/project-media";

export function AdminAuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rr-admin-auth-wrap">
      <header className="rr-admin-auth-header">
        <Link className="rr-admin-auth-brand" href="/">
          <Image
            src="/images/brand/reliant-color-transparent.png"
            alt="Reliant Renovations Inc."
            width={142}
            height={100}
            className="rr-admin-brand-image"
          />
        </Link>
        <ThemeToggle />
      </header>
      <main className="rr-admin-auth-layout">
        <figure className="rr-admin-auth-visual">
          <Image
            src={projectMediaSource(
              "/images/projects/upper-west-side-apartment/01.webp",
            )}
            alt="Custom wood kitchen cabinetry and sink in an Upper West Side apartment"
            fill
            sizes="(max-width: 860px) 100vw, 45vw"
          />
          <figcaption>
            <span>Upper West Side apartment</span>
            <span>Residential</span>
          </figcaption>
        </figure>
        <div className="rr-admin-auth-panel">
          <div className="rr-admin-auth-content">{children}</div>
          <footer className="rr-admin-auth-footer">
            RELIANT RENOVATIONS · ADMIN ACCESS
          </footer>
        </div>
      </main>
    </div>
  );
}

export function AdminLogin({
  passwordChanged = false,
}: {
  passwordChanged?: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [ownerSignIn, setOwnerSignIn] = useState(false);
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ownerSignIn ? { password } : { email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to sign in.");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
      setBusy(false);
    }
  }
  return (
    <AdminAuthShell>
      <section className="rr-admin-auth-card" aria-labelledby="admin-login-title">
        <div className="rr-admin-auth-kicker">
          <div className="rr-admin-eyebrow">ADMIN WORKSPACE</div>
          <LockKey size={20} aria-hidden="true" />
        </div>
        <h1 id="admin-login-title">Welcome back.</h1>
        <p>
          Good work deserves to be seen. Sign in to manage your projects and new
          inquiries.
        </p>
        <form onSubmit={submit} aria-busy={busy}>
          {passwordChanged && (
            <p className="rr-admin-login-status" role="status">
              Your password has changed. Sign in with your new password.
            </p>
          )}
          {!ownerSignIn && (
            <div className="rr-admin-login-email">
              <label className="rr-admin-label" htmlFor="admin-email">
                Email address
              </label>
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                maxLength={254}
                disabled={busy}
                autoFocus
              />
            </div>
          )}
          {ownerSignIn && (
            <p className="rr-admin-login-owner-note">
              Use the original owner password. Additional admins sign in with
              their email address.
            </p>
          )}
          <label className="rr-admin-label" htmlFor="admin-password">
            Password
          </label>
          <div className="rr-admin-password">
            <input
              id="admin-password"
              name="password"
              type={visible ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              maxLength={512}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "admin-login-error" : undefined}
              disabled={busy}
            />
            <button
              type="button"
              className="rr-admin-icon-button"
              aria-label={visible ? "Hide password" : "Show password"}
              aria-pressed={visible}
              onClick={() => setVisible(!visible)}
              disabled={busy}
            >
              {visible ? (
                <EyeSlash size={19} aria-hidden="true" />
              ) : (
                <Eye size={19} aria-hidden="true" />
              )}
            </button>
          </div>
          {error && (
            <p className="rr-admin-error" id="admin-login-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="rr-admin-button rr-admin-primary rr-admin-auth-submit"
            disabled={busy}
          >
            {busy ? "Signing in…" : "Sign in"}
            <span className="rr-admin-button-icon" aria-hidden="true">
              <ArrowRight size={19} />
            </span>
          </button>
          <Link
            className="rr-admin-text-link rr-admin-auth-forgot"
            href="/admin/forgot-password"
          >
            Forgot your password?
          </Link>
          <button
            type="button"
            className="rr-admin-login-mode"
            aria-pressed={ownerSignIn}
            disabled={busy}
            onClick={() => {
              setOwnerSignIn(!ownerSignIn);
              setPassword("");
              setError("");
            }}
          >
            {ownerSignIn
              ? "Sign in with an email address"
              : "Existing owner sign-in"}
          </button>
        </form>
        <Link className="rr-admin-text-link" href="/">
          ← Back to the website
        </Link>
      </section>
    </AdminAuthShell>
  );
}
