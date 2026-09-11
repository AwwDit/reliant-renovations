"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeSlash, Plus, X } from "@phosphor-icons/react";
import type { AdminAccount } from "@/lib/admin-account-types";
import { adminRequest } from "./admin-request";

function PasswordField({
  id,
  name,
  label,
  current = false,
  disabled,
}: {
  id: string;
  name: string;
  label: string;
  current?: boolean;
  disabled: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="rr-admin-account-field">
      <label className="rr-admin-label" htmlFor={id}>
        {label}
      </label>
      <div className="rr-admin-password">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={current ? "current-password" : "new-password"}
          required
          minLength={current ? undefined : 12}
          maxLength={512}
          disabled={disabled}
        />
        <button
          type="button"
          className="rr-admin-icon-button"
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={visible}
          disabled={disabled}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <EyeSlash size={19} /> : <Eye size={19} />}
        </button>
      </div>
    </div>
  );
}

function formPasswords(form: HTMLFormElement) {
  const fields = new FormData(form);
  const password = String(fields.get("password") || "");
  if (password.length < 12 || password.length > 512) {
    form.querySelector<HTMLInputElement>('[name="password"]')?.focus();
    throw new Error("Use 12–512 characters for the new password.");
  }
  if (password !== fields.get("confirmation")) {
    form.querySelector<HTMLInputElement>('[name="confirmation"]')?.focus();
    throw new Error("The passwords don’t match. Please enter them again.");
  }
  return { fields, password };
}

export function AdminAccounts({
  currentAdmin,
}: {
  currentAdmin: AdminAccount;
}) {
  const router = useRouter();
  const owner = currentAdmin.role === "owner";
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(owner);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [pendingDisable, setPendingDisable] = useState<string | null>(null);
  const [accountError, setAccountError] = useState("");
  const [addError, setAddError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [notice, setNotice] = useState("");
  const addButton = useRef<HTMLButtonElement>(null);

  const loadAccounts = useCallback((signal?: AbortSignal) => {
    return adminRequest("/api/admin/accounts", { signal })
      .then((data) => {
        if (!signal?.aborted) setAccounts(data.accounts);
      })
      .catch((error: unknown) => {
        if (!signal?.aborted)
          setLoadError(
            error instanceof Error ? error.message : "Unable to load accounts.",
          );
      })
      .finally(() => {
        if (!signal?.aborted) setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!owner) return;
    const controller = new AbortController();
    void loadAccounts(controller.signal);
    return () => controller.abort();
  }, [owner, loadAccounts]);

  async function addAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    setAddError("");
    setNotice("");
    try {
      const { fields, password } = formPasswords(form);
      setBusy(true);
      const data = await adminRequest("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(fields.get("name") || "").trim(),
          email: String(fields.get("email") || "").trim(),
          password,
        }),
      });
      setAccounts((items) => [...items, data.account]);
      form.reset();
      setShowAdd(false);
      setNotice(
        `${data.account.name} now has admin access. Share their sign-in email and password with them securely. No email has been sent.`,
      );
      requestAnimationFrame(() => addButton.current?.focus());
    } catch (error) {
      setAddError(
        error instanceof Error ? error.message : "Unable to add this admin.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function setAccountActive(account: AdminAccount, active: boolean) {
    if (busy) return;
    setBusy(true);
    setAccountError("");
    setNotice("");
    try {
      const data = await adminRequest(
        `/api/admin/accounts/${encodeURIComponent(account.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active }),
        },
      );
      setAccounts((items) =>
        items.map((item) => (item.id === account.id ? data.account : item)),
      );
      setPendingDisable(null);
      setNotice(
        active
          ? `${account.name} can sign in again.`
          : `${account.name}’s access is disabled and their sessions have been signed out.`,
      );
      requestAnimationFrame(() =>
        document.getElementById(`account-access-${account.id}`)?.focus(),
      );
    } catch (error) {
      setAccountError(
        error instanceof Error
          ? error.message
          : "Unable to update account access.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    setPasswordError("");
    try {
      const { fields, password } = formPasswords(form);
      setBusy(true);
      await adminRequest("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: fields.get("currentPassword"),
          password,
        }),
      });
      form.reset();
      router.replace("/admin?password=changed");
      router.refresh();
    } catch (error) {
      setPasswordError(
        error instanceof Error
          ? error.message
          : "Unable to change your password.",
      );
      setBusy(false);
    }
  }

  return (
    <div className="rr-admin-accounts">
      <section className="rr-admin-account-self" aria-labelledby="your-account-title">
        <div className="rr-admin-account-identity">
          <span className="rr-admin-eyebrow">Your account</span>
          <h2 id="your-account-title">{currentAdmin.name}</h2>
          <p className="rr-admin-account-email">
            {currentAdmin.email || "Original owner sign-in"}
          </p>
          <span className="rr-admin-account-role">{owner ? "Owner" : "Admin"}</span>
          <p className="rr-admin-account-explanation">
            {owner
              ? "You manage projects, photographs, inquiries, and access to this workspace."
              : "You can manage projects, photographs, and inquiries. The owner manages admin accounts."}
          </p>
        </div>
        <div className="rr-admin-account-password">
          <h2>Change your password</h2>
          <p className="rr-admin-muted" id="account-password-hint">
            Use 12–512 characters. You’ll sign in again on all your devices.
          </p>
          <form
            onSubmit={changePassword}
            aria-busy={busy}
            aria-describedby="account-password-hint"
          >
            <input
              type="hidden"
              name="username"
              autoComplete="username"
              value={currentAdmin.email || "owner"}
            />
            <PasswordField
              id="account-current-password"
              name="currentPassword"
              label="Current password"
              current
              disabled={busy}
            />
            <div className="rr-admin-account-form-grid">
              <PasswordField
                id="account-new-password"
                name="password"
                label="New password"
                disabled={busy}
              />
              <PasswordField
                id="account-confirm-password"
                name="confirmation"
                label="Confirm new password"
                disabled={busy}
              />
            </div>
            {passwordError && (
              <p className="rr-admin-error" role="alert">
                {passwordError}
              </p>
            )}
            <button
              className="rr-admin-button rr-admin-secondary"
              disabled={busy}
              type="submit"
            >
              Change password <ArrowRight size={17} />
            </button>
          </form>
        </div>
      </section>

      {owner && (
        <section className="rr-admin-account-team" aria-labelledby="admin-team-title">
          <div className="rr-admin-account-heading">
            <div>
              <span className="rr-admin-eyebrow">Workspace access</span>
              <h2 id="admin-team-title">Admins</h2>
              <p className="rr-admin-muted">
                Each admin has their own sign-in and password recovery.
              </p>
            </div>
            <button
              ref={addButton}
              className="rr-admin-button rr-admin-primary"
              type="button"
              disabled={busy || loading || !!loadError}
              aria-expanded={showAdd}
              aria-controls="add-admin-form"
              onClick={() => {
                setShowAdd(!showAdd);
                setAddError("");
              }}
            >
              {showAdd ? "Close form" : "Add admin"}
              <span className="rr-admin-button-icon" aria-hidden="true">
                {showAdd ? <X size={19} /> : <Plus size={19} />}
              </span>
            </button>
          </div>
          {notice && (
            <p className="rr-admin-alert" role="status">
              {notice}
            </p>
          )}
          {showAdd && (
            <form
              id="add-admin-form"
              className="rr-admin-account-add"
              onSubmit={addAccount}
              aria-busy={busy}
              aria-labelledby="add-admin-title"
            >
              <h3 id="add-admin-title">Add an admin</h3>
              <p className="rr-admin-muted">
                This account can update projects, photographs, and inquiries.
                Share the credentials securely; an invitation email won’t be
                sent.
              </p>
              <div className="rr-admin-account-form-grid">
                <div className="rr-admin-account-field">
                  <label className="rr-admin-label" htmlFor="new-admin-name">
                    Full name
                  </label>
                  <input
                    id="new-admin-name"
                    name="name"
                    autoComplete="off"
                    autoFocus
                    required
                    minLength={1}
                    maxLength={100}
                    disabled={busy}
                  />
                </div>
                <div className="rr-admin-account-field">
                  <label className="rr-admin-label" htmlFor="new-admin-email">
                    Email address
                  </label>
                  <input
                    id="new-admin-email"
                    name="email"
                    type="email"
                    autoComplete="off"
                    required
                    maxLength={254}
                    disabled={busy}
                  />
                </div>
                <PasswordField
                  id="new-admin-password"
                  name="password"
                  label="Password"
                  disabled={busy}
                />
                <PasswordField
                  id="new-admin-confirmation"
                  name="confirmation"
                  label="Confirm password"
                  disabled={busy}
                />
              </div>
              <p className="rr-admin-muted">
                Use 12–512 characters for the password.
              </p>
              {addError && (
                <p className="rr-admin-error" role="alert">
                  {addError}
                </p>
              )}
              <button
                className="rr-admin-button rr-admin-primary"
                disabled={busy}
                type="submit"
              >
                {busy ? "Creating account…" : "Create admin account"}
                <ArrowRight size={17} />
              </button>
            </form>
          )}
          {loading ? (
            <p className="rr-admin-muted" role="status">
              Loading accounts…
            </p>
          ) : loadError ? (
            <div className="rr-admin-account-load-error">
              <p className="rr-admin-error" role="alert">
                {loadError}
              </p>
              <button
                type="button"
                className="rr-admin-button rr-admin-secondary"
                onClick={() => {
                  setLoading(true);
                  setLoadError("");
                  void loadAccounts();
                }}
              >
                Try again
              </button>
            </div>
          ) : (
            <ul className="rr-admin-account-list">
              {accounts.map((account) => (
                <li
                  key={account.id}
                  className={`rr-admin-account-row${account.active ? "" : " is-disabled"}`}
                >
                  <div className="rr-admin-account-person">
                    <strong>
                      {account.name}
                      {account.id === currentAdmin.id && <small> You</small>}
                    </strong>
                    <span>{account.email || "Original owner sign-in"}</span>
                  </div>
                  <div className="rr-admin-account-access">
                    <span className="rr-admin-account-role">
                      {account.role === "owner" ? "Owner" : "Admin"}
                    </span>
                    <span
                      className={`rr-admin-publication ${account.active ? "is-published" : ""}`}
                    >
                      <span />
                      {account.active ? "Active" : "Disabled"}
                    </span>
                  </div>
                  {account.role !== "owner" && (
                    <button
                      id={`account-access-${account.id}`}
                      className="rr-admin-button rr-admin-secondary"
                      type="button"
                      disabled={busy}
                      aria-label={`${account.active ? "Disable" : "Enable"} access for ${account.name}`}
                      aria-expanded={
                        account.active
                          ? pendingDisable === account.id
                          : undefined
                      }
                      aria-controls={
                        account.active
                          ? `confirm-disable-${account.id}`
                          : undefined
                      }
                      onClick={() =>
                        account.active
                          ? setPendingDisable(
                              pendingDisable === account.id ? null : account.id,
                            )
                          : void setAccountActive(account, true)
                      }
                    >
                      {account.active ? "Disable access" : "Enable access"}
                    </button>
                  )}
                  {pendingDisable === account.id && (
                    <div
                      id={`confirm-disable-${account.id}`}
                      className="rr-admin-account-confirm"
                      role="group"
                      aria-label={`Confirm disabling ${account.name}`}
                    >
                      <p>
                        Disable {account.name}’s access? They’ll be signed out
                        and unable to log in until you re-enable their account.
                      </p>
                      <div>
                        <button
                          className="rr-admin-button rr-admin-account-disable"
                          type="button"
                          disabled={busy}
                          onClick={() => void setAccountActive(account, false)}
                        >
                          Confirm disable
                        </button>
                        <button
                          className="rr-admin-button rr-admin-secondary"
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            setPendingDisable(null);
                            document
                              .getElementById(`account-access-${account.id}`)
                              ?.focus();
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          {accountError && (
            <p className="rr-admin-error" role="alert">
              {accountError}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
