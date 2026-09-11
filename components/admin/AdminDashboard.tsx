"use client";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "@/components/site-image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  CaretRight,
  Check,
  Envelope,
  Eye,
  EyeSlash,
  Images,
  MagnifyingGlass,
  Plus,
  SignOut,
  Star,
  Trash,
  X,
} from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import type { Division, Inquiry, Project } from "@/lib/types";
import { ProjectEditor } from "./ProjectEditor";
import { ThemeToggle } from "@/components/theme-toggle";
import { isCloudinaryProjectUrl } from "@/lib/media-urls";
import type { AdminAccount } from "@/lib/admin-account-types";
import { AdminAccounts } from "./AdminAccounts";
import { adminRequest } from "./admin-request";

export { adminRequest } from "./admin-request";
export function AdminDashboard({
  initialProjects,
  initialInquiries,
  cloudName,
  currentAdmin,
  initialTab = "projects",
}: {
  initialProjects: Project[];
  initialInquiries: Inquiry[];
  cloudName: string;
  currentAdmin: AdminAccount;
  initialTab?: "projects" | "inquiries" | "accounts";
}) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [tab, setTab] = useState<"projects" | "inquiries" | "accounts">(
    initialTab,
  );
  const [division, setDivision] = useState<Division | "all">("all");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<Project | "new" | null>(null);
  const editorReturnFocus = useRef<HTMLButtonElement | null>(null);
  const inquiryReturnFocus = useRef<HTMLButtonElement | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const unread = inquiries.filter((inquiry) => !inquiry.read).length;
  const filtered = useMemo(
    () =>
      projects.filter(
        (project) =>
          (division === "all" || project.division === division) &&
          `${project.title} ${project.location} ${project.category}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [projects, division, query],
  );
  function openEditor(project: Project | "new", opener: HTMLButtonElement) {
    editorReturnFocus.current = opener;
    setEditor(project);
  }
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function reloadProjects() {
    const data = await adminRequest("/api/projects");
    setProjects(data.projects);
  }
  async function toggleProject(
    project: Project,
    field: "published" | "featured",
  ) {
    await run(async () => {
      const data = await adminRequest(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...project, [field]: !project[field] }),
      });
      setProjects((items) =>
        items.map((item) => (item.id === project.id ? data.project : item)),
      );
      setNotice(
        field === "published"
          ? `${project.title} ${data.project.published ? "is now published" : "is now hidden"}.`
          : "Featured selection updated.",
      );
      router.refresh();
    });
  }
  async function moveProject(project: Project, direction: -1 | 1) {
    await run(async () => {
      const index = projects.findIndex((item) => item.id === project.id);
      const target = index + direction;
      if (target < 0 || target >= projects.length) return;
      const next = [...projects];
      [next[index], next[target]] = [next[target], next[index]];
      await adminRequest("/api/projects/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: next.map((item) => item.id) }),
      });
      setProjects(next.map((item, order) => ({ ...item, order })));
      setNotice("Project order updated.");
      router.refresh();
    });
  }
  async function removeProject(project: Project) {
    if (
      !window.confirm(
        `Delete “${project.title}”? This removes it from your website and cannot be undone.`,
      )
    )
      return;
    await run(async () => {
      await adminRequest(`/api/projects/${project.id}`, { method: "DELETE" });
      setProjects((items) => items.filter((item) => item.id !== project.id));
      setNotice("Project deleted.");
      router.refresh();
    });
  }
  async function openInquiry(inquiry: Inquiry, opener: HTMLButtonElement) {
    inquiryReturnFocus.current = opener;
    setSelectedInquiry(inquiry);
    if (!inquiry.read)
      await run(async () => {
        await adminRequest(`/api/inquiries/${inquiry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ read: true }),
        });
        setInquiries((items) =>
          items.map((item) =>
            item.id === inquiry.id ? { ...item, read: true } : item,
          ),
        );
      });
  }
  async function signOut() {
    await run(async () => {
      await adminRequest("/api/auth/logout", { method: "POST" });
      router.refresh();
    });
  }
  return (
    <div className="rr-admin-shell">
      <a className="rr-admin-skip-link" href="#admin-content">
        Skip to dashboard content
      </a>
      <aside className="rr-admin-sidebar">
        <Link className="rr-admin-brand" href="/">
          <Image
            src="/images/brand/reliant-color-transparent.png"
            alt="Reliant Renovations Inc."
            width={172}
            height={122}
            className="rr-admin-brand-image"
          />
        </Link>
        <p className="rr-admin-sidebar-description">
          Commercial Construction
          <br />
          Residential Renovations
        </p>
        <div className="rr-admin-mobile-tools">
          <ThemeToggle />
          <Link
            className="rr-admin-icon-button"
            href="/"
            aria-label="View website"
            target="_blank"
            rel="noreferrer"
          >
            <ArrowUpRight size={21} />
          </Link>
          <button
            className="rr-admin-icon-button"
            aria-label="Sign out"
            disabled={busy}
            onClick={signOut}
          >
            <SignOut size={21} />
          </button>
        </div>
        <span className="rr-admin-sidebar-label">Admin workspace</span>
        <nav aria-label="Dashboard">
          <button
            className={`rr-admin-nav-item ${tab === "projects" ? "active" : ""}`}
            aria-current={tab === "projects" ? "page" : undefined}
            onClick={() => {
              setTab("projects");
              setQuery("");
            }}
          >
            <span className="rr-admin-nav-label">Projects</span>
            <span className="rr-admin-nav-count">
              {String(projects.length).padStart(2, "0")}
            </span>
          </button>
          <button
            className={`rr-admin-nav-item ${tab === "inquiries" ? "active" : ""}`}
            aria-current={tab === "inquiries" ? "page" : undefined}
            onClick={() => {
              setTab("inquiries");
              setQuery("");
            }}
          >
            <span className="rr-admin-nav-label">Inquiries</span>
            <span
              className={`rr-admin-nav-count${unread > 0 ? " rr-admin-notification-count" : ""}`}
              aria-label={`${unread} unread inquiries`}
            >
              {String(unread).padStart(2, "0")}
            </span>
          </button>
          <button
            className={`rr-admin-nav-item ${tab === "accounts" ? "active" : ""}`}
            aria-current={tab === "accounts" ? "page" : undefined}
            onClick={() => {
              setTab("accounts");
              setQuery("");
            }}
          >
            <span className="rr-admin-nav-label">Accounts</span>
          </button>
        </nav>
        <div className="rr-admin-sidebar-bottom">
          <a href="/" target="_blank" rel="noreferrer">
            View website
            <ArrowUpRight size={19} />
          </a>
          <button disabled={busy} onClick={signOut}>
            Sign out
            <SignOut size={19} />
          </button>
          <div className="rr-admin-owner">
            <div>
              {currentAdmin.name}
              <small>
                {currentAdmin.role === "owner" ? "Owner" : "Admin"} account
              </small>
            </div>
          </div>
          <div className="rr-admin-appearance">
            <span>Appearance</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>
      <div className="rr-admin-main">
        <header className="rr-admin-topbar">
          <span>
            Workspace <CaretRight size={12} />{" "}
            <strong>
              {tab === "projects"
                ? "Projects"
                : tab === "inquiries"
                  ? "Inquiries"
                  : "Accounts"}
            </strong>
          </span>
          <a href="/" target="_blank" rel="noreferrer">
            Website live preview <ArrowUpRight size={14} />
          </a>
        </header>
        <main className="rr-admin-content" id="admin-content" tabIndex={-1}>
          <div className="rr-admin-page-heading">
            <div>
              <h1>
                {tab === "projects"
                  ? "Projects"
                  : tab === "inquiries"
                    ? "Inquiries"
                    : "Accounts"}
                {tab !== "accounts" && (
                  <span>
                    {tab === "projects"
                      ? projects.length.toString().padStart(2, "0")
                      : inquiries.length.toString().padStart(2, "0")}
                  </span>
                )}
              </h1>
              <p>
                {tab === "projects"
                  ? "Manage project details, photographs, and publishing."
                  : tab === "inquiries"
                    ? "Review project requests from your website."
                    : "Manage your sign-in and access to this workspace."}
              </p>
            </div>
            {tab === "projects" && (
              <button
                className="rr-admin-button rr-admin-primary"
                onClick={(event) => openEditor("new", event.currentTarget)}
              >
                Add project
                <span className="rr-admin-button-icon">
                  <Plus size={20} />
                </span>
              </button>
            )}
          </div>
          {(notice || error) && (
            <div
              className={error ? "rr-admin-alert rr-admin-alert-error" : "rr-admin-alert"}
              role={error ? "alert" : "status"}
            >
              {error || notice}
              <button
                className="rr-admin-icon-button"
                aria-label="Dismiss message"
                onClick={() => {
                  setError("");
                  setNotice("");
                }}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {tab === "projects" ? (
            <>
              <div className="rr-admin-stats" aria-label="Project overview">
                <div>
                  <span>Published projects</span>
                  <strong>
                    {projects
                      .filter((project) => project.published)
                      .length.toString()
                      .padStart(2, "0")}
                  </strong>
                </div>
                <div>
                  <span>Commercial</span>
                  <strong>
                    {projects
                      .filter((project) => project.division === "commercial")
                      .length.toString()
                      .padStart(2, "0")}
                  </strong>
                </div>
                <div>
                  <span>Residential</span>
                  <strong>
                    {projects
                      .filter((project) => project.division === "residential")
                      .length.toString()
                      .padStart(2, "0")}
                  </strong>
                </div>
              </div>
              <div className="rr-admin-collection-toolbar">
                <div className="rr-admin-filters" aria-label="Filter by division">
                  {(["all", "commercial", "residential"] as const).map(
                    (filter) => (
                      <button
                        key={filter}
                        className={division === filter ? "active" : ""}
                        aria-pressed={division === filter}
                        onClick={() => setDivision(filter)}
                      >
                        {filter === "all"
                          ? "All projects"
                          : filter === "commercial"
                            ? "Commercial"
                            : "Residential"}
                        <span>
                          {
                            projects.filter(
                              (project) =>
                                filter === "all" || project.division === filter,
                            ).length
                          }
                        </span>
                      </button>
                    ),
                  )}
                </div>
                <label className="rr-admin-search">
                  <MagnifyingGlass size={18} />
                  <input
                    aria-label="Search projects"
                    placeholder="Search projects…"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>
              </div>
              <div className="rr-admin-project-grid">
                {filtered.map((project) => (
                  <article key={project.id} className="rr-admin-project-card">
                    <button
                      className="rr-admin-project-image"
                      onClick={(event) =>
                        openEditor(project, event.currentTarget)
                      }
                      aria-label={`Edit ${project.title}`}
                    >
                      {project.images[0] ? (
                        <Image
                          src={project.images[0].src}
                          alt={project.images[0].alt}
                          fill
                          unoptimized={
                            !isCloudinaryProjectUrl(
                              project.images[0].src,
                              cloudName,
                            )
                          }
                          sizes="(max-width: 700px) 100vw, (max-width: 1000px) 50vw, (max-width: 1600px) 40vw, 640px"
                        />
                      ) : (
                        <Images size={40} />
                      )}
                    </button>
                    <div className="rr-admin-project-details">
                      <div className="rr-admin-project-status">
                        <span
                          className={`rr-admin-publication ${project.published ? "is-published" : ""}`}
                        >
                          <span />
                          {project.published ? "Published" : "Hidden"}
                        </span>
                        {project.featured && (
                          <span className="rr-admin-featured-label">
                            <Star size={12} weight="fill" />
                            Featured
                          </span>
                        )}
                        <span
                          className="rr-admin-project-number"
                          aria-label={`Position ${projects.findIndex((item) => item.id === project.id) + 1}`}
                        >
                          {String(
                            projects.findIndex(
                              (item) => item.id === project.id,
                            ) + 1,
                          ).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="rr-admin-project-meta">
                        <span>{project.division}</span>
                        <small>{project.images.length} photos</small>
                      </div>
                      <button
                        className="rr-admin-project-title"
                        onClick={(event) =>
                          openEditor(project, event.currentTarget)
                        }
                      >
                        {project.title}
                      </button>
                      <p>
                        {project.location} <span>·</span> {project.category}
                      </p>
                    </div>
                    <div className="rr-admin-project-actions">
                      <button
                        className="rr-admin-edit-button"
                        onClick={(event) =>
                          openEditor(project, event.currentTarget)
                        }
                      >
                        Edit project
                        <ArrowUpRight size={18} />
                      </button>
                      <div>
                        <button
                          className="rr-admin-icon-button"
                          title={
                            project.featured
                              ? "Remove from featured projects"
                              : "Feature project"
                          }
                          aria-label={`${project.featured ? "Unfeature" : "Feature"} ${project.title}`}
                          disabled={busy}
                          onClick={() => toggleProject(project, "featured")}
                        >
                          <Star
                            size={17}
                            weight={project.featured ? "fill" : "regular"}
                          />
                        </button>
                        <button
                          className="rr-admin-icon-button"
                          title={
                            project.published
                              ? "Hide project"
                              : "Publish project"
                          }
                          aria-label={`${project.published ? "Hide" : "Publish"} ${project.title}`}
                          disabled={busy}
                          onClick={() => toggleProject(project, "published")}
                        >
                          {project.published ? (
                            <Eye size={17} />
                          ) : (
                            <EyeSlash size={17} />
                          )}
                        </button>
                        <button
                          className="rr-admin-icon-button"
                          title="Move earlier"
                          aria-label={`Move ${project.title} earlier`}
                          disabled={busy || projects[0]?.id === project.id}
                          onClick={() => moveProject(project, -1)}
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          className="rr-admin-icon-button"
                          title="Move later"
                          aria-label={`Move ${project.title} later`}
                          disabled={busy || projects.at(-1)?.id === project.id}
                          onClick={() => moveProject(project, 1)}
                        >
                          <ArrowDown size={16} />
                        </button>
                        <button
                          className="rr-admin-icon-button rr-admin-danger"
                          title="Delete project"
                          aria-label={`Delete ${project.title}`}
                          disabled={busy}
                          onClick={() => removeProject(project)}
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              {filtered.length === 0 && (
                <div className="rr-admin-empty">
                  <Images size={38} />
                  <h2>
                    {projects.length
                      ? "No matching projects"
                      : "Your collection starts here."}
                  </h2>
                  <p>
                    {projects.length
                      ? "Try another search or switch the division filter."
                      : "Add a project with its story and photography to get started."}
                  </p>
                  <button
                    className="rr-admin-button rr-admin-secondary"
                    onClick={(event) =>
                      projects.length
                        ? (setQuery(""), setDivision("all"))
                        : openEditor("new", event.currentTarget)
                    }
                  >
                    {projects.length
                      ? "Clear filters"
                      : "Add your first project"}
                  </button>
                </div>
              )}
              <p className="rr-admin-footnote">
                Use the arrows to set the order visitors see. Hidden projects
                stay in your dashboard.
              </p>
            </>
          ) : tab === "accounts" ? (
            <AdminAccounts currentAdmin={currentAdmin} />
          ) : (
            <>
              <div className="rr-admin-inquiry-toolbar">
                <span>
                  {unread} unread {unread === 1 ? "inquiry" : "inquiries"}
                </span>
                <button
                  className="rr-admin-button rr-admin-secondary"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      const data = await adminRequest("/api/inquiries");
                      setInquiries(data.inquiries);
                      setNotice("Inbox refreshed.");
                    })
                  }
                >
                  Refresh inbox
                </button>
              </div>
              <div className="rr-admin-inquiry-list">
                {inquiries.map((inquiry) => (
                  <button
                    key={inquiry.id}
                    className={`rr-admin-inquiry-row ${inquiry.read ? "" : "is-unread"}`}
                    onClick={(event) =>
                      openInquiry(inquiry, event.currentTarget)
                    }
                  >
                    <span className="rr-admin-inquiry-avatar">
                      {inquiry.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="rr-admin-inquiry-person">
                      <strong>
                        {inquiry.name}
                        {!inquiry.read && <i />}
                      </strong>
                      <small>{inquiry.company || inquiry.email}</small>
                    </span>
                    <span className="rr-admin-inquiry-summary">
                      <strong>{inquiry.projectType}</strong>
                      <small>{inquiry.description}</small>
                    </span>
                    <span className="rr-admin-inquiry-date">
                      {new Date(inquiry.createdAt).toLocaleDateString("en-CA", {
                        month: "short",
                        day: "numeric",
                      })}
                      <CaretRight size={16} />
                    </span>
                  </button>
                ))}
              </div>
              {inquiries.length === 0 && (
                <div className="rr-admin-empty">
                  <Envelope size={40} />
                  <h2>Ready for what’s next.</h2>
                  <p>
                    New project requests from your website will appear here.
                  </p>
                  <a
                    className="rr-admin-button rr-admin-secondary"
                    href="/contact"
                    target="_blank"
                    rel="noreferrer"
                  >
                    View contact form
                    <ArrowUpRight size={16} />
                  </a>
                </div>
              )}
            </>
          )}
        </main>
        <footer className="rr-admin-footer">
          <span>RELIANT RENOVATIONS</span>
          <span>Admin workspace</span>
        </footer>
      </div>
      {editor && (
        <ProjectEditor
          cloudName={cloudName}
          project={editor === "new" ? undefined : editor}
          returnFocusRef={editorReturnFocus}
          onClose={() => setEditor(null)}
          onSaved={async () => {
            await reloadProjects();
            setEditor(null);
            setNotice("Project saved. Your website is up to date.");
            router.refresh();
          }}
        />
      )}
      <Dialog.Root
        open={!!selectedInquiry}
        onOpenChange={(open) => {
          if (!open) setSelectedInquiry(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="rr-admin-dialog-overlay" />
          <Dialog.Content
            className="rr-admin-inquiry-dialog"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              const opener = inquiryReturnFocus.current;
              if (opener?.isConnected) opener.focus();
              if (document.activeElement !== opener)
                document.getElementById("admin-content")?.focus();
            }}
          >
            <Dialog.Title>Project inquiry</Dialog.Title>
            <Dialog.Description className="rr-admin-muted">
              Received{" "}
              {selectedInquiry &&
                new Date(selectedInquiry.createdAt).toLocaleString("en-CA", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
            </Dialog.Description>
            <Dialog.Close
              className="rr-admin-icon-button rr-admin-dialog-close"
              aria-label="Close inquiry"
            >
              <X size={22} />
            </Dialog.Close>
            {selectedInquiry && (
              <>
                <h2>{selectedInquiry.name}</h2>
                {selectedInquiry.company && (
                  <p className="rr-admin-muted">{selectedInquiry.company}</p>
                )}
                <div className="rr-admin-inquiry-contact">
                  <a href={`mailto:${selectedInquiry.email}`}>
                    <Envelope size={17} />
                    {selectedInquiry.email}
                  </a>
                  {selectedInquiry.phone && (
                    <a
                      href={`tel:${selectedInquiry.phone.replace(/[^+0-9]/g, "")}`}
                    >
                      {selectedInquiry.phone}
                    </a>
                  )}
                </div>
                <dl className="rr-admin-inquiry-facts">
                  <div>
                    <dt>Project type</dt>
                    <dd>{selectedInquiry.projectType}</dd>
                  </div>
                  <div>
                    <dt>Location</dt>
                    <dd>{selectedInquiry.location}</dd>
                  </div>
                  <div>
                    <dt>Timing</dt>
                    <dd>{selectedInquiry.timing}</dd>
                  </div>
                </dl>
                <h3>About the project</h3>
                <p className="rr-admin-inquiry-description">
                  {selectedInquiry.description}
                </p>
                {selectedInquiry.attachment && (
                  <a
                    href={selectedInquiry.attachment}
                    className="rr-admin-button rr-admin-secondary"
                    download
                  >
                    Download attachment
                    <span className="rr-admin-button-icon">
                      <ArrowDown size={16} />
                    </span>
                  </a>
                )}
                <div className="rr-admin-inquiry-dialog-footer">
                  <span>
                    <Check size={14} />
                    Saved in your inbox
                  </span>
                  <a
                    className="rr-admin-button rr-admin-primary"
                    href={`mailto:${selectedInquiry.email}?subject=${encodeURIComponent(`Your ${selectedInquiry.projectType} project — Reliant Renovations`)}`}
                  >
                    Reply by email
                    <span className="rr-admin-button-icon">
                      <ArrowUpRight size={18} />
                    </span>
                  </a>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
