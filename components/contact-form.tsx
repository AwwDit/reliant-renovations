"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle, Paperclip, X } from "@phosphor-icons/react";
import { ContactSelect } from "./contact-select";
export function ContactForm({ initialType }: { initialType: string }) {
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [fileName, setFileName] = useState("");
  const input = useRef<HTMLInputElement>(null);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        body: data,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error || "We couldn’t save your inquiry. Please try again.",
        );
      setMessage(result.message || "Your inquiry has been saved.");
      setStatus("success");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Something went wrong. Please try again.",
      );
      setStatus("error");
    }
  }
  if (status === "success")
    return (
      <div className="form-success" role="status">
        <CheckCircle size={48} />
        <h2>Inquiry received</h2>
        <p>{message}</p>
        <Link href="/projects" className="text-link">
          View Our Work <ArrowUpRight size={20} />
        </Link>
      </div>
    );
  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="form-section">
        <h2>Contact information</h2>
        <div className="form-grid">
          <label>
            Name <span>(required)</span>
            <input
              name="name"
              autoComplete="name"
              placeholder="Your name"
              required
              maxLength={120}
            />
          </label>
          <label>
            Company <span>(optional)</span>
            <input
              name="company"
              autoComplete="organization"
              placeholder="Company name"
              maxLength={160}
            />
          </label>
          <label>
            Email <span>(required)</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              maxLength={254}
            />
          </label>
          <label>
            Phone <span>(optional)</span>
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="Your phone number"
              maxLength={40}
            />
          </label>
        </div>
      </div>
      <div className="form-section">
        <h2>Project inquiry</h2>
        <div className="form-grid">
          <label htmlFor="project-type">
            Project type <span>(required)</span>
            <ContactSelect
              id="project-type"
              name="projectType"
              label="Project type"
              required
              defaultValue={initialType}
              placeholder="Select a project type"
              options={[
                { value: "commercial", label: "Commercial construction" },
                { value: "residential", label: "Residential renovation" },
              ]}
            />
          </label>
          <label>
            Location <span>(required)</span>
            <input
              name="location"
              placeholder="Neighborhood, city or town"
              required
              maxLength={160}
            />
          </label>
          <label className="full-width" htmlFor="project-timing">
            Desired timing <span>(required)</span>
            <ContactSelect
              id="project-timing"
              name="timing"
              label="Desired timing"
              required
              defaultValue="flexible"
              options={[
                {
                  value: "flexible",
                  label: "I’m exploring / timing is flexible",
                },
                { value: "soon", label: "As soon as possible" },
                { value: "1-3-months", label: "In the next 1–3 months" },
                { value: "3-6-months", label: "In the next 3–6 months" },
                {
                  value: "6-plus-months",
                  label: "More than 6 months from now",
                },
              ]}
            />
          </label>
          <label className="full-width">
            Description <span>(required)</span>
            <textarea
              name="description"
              rows={5}
              placeholder="Project description (at least 20 characters)"
              required
              minLength={20}
              maxLength={10000}
            />
          </label>
        </div>
        <div className="upload-control">
          <label className="upload-label" htmlFor="attachment">
            <Paperclip size={23} />
            <span>
              {fileName || "Optional file upload"}
              <small>Optional · JPG, PNG, WebP or PDF · up to 10 MB</small>
            </span>
          </label>
          <input
            ref={input}
            id="attachment"
            name="attachment"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && file.size > 10 * 1024 * 1024) {
                setError("Please choose a file smaller than 10 MB.");
                e.target.value = "";
                setFileName("");
              } else {
                setError("");
                setFileName(file?.name || "");
              }
            }}
          />
          {fileName && (
            <button
              type="button"
              className="icon-button"
              aria-label="Remove attachment"
              onClick={() => {
                if (input.current) input.current.value = "";
                setFileName("");
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>
      <div className="honey-field" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-submit">
        <p>
          By submitting, you agree that we may contact you about your project.
          Read our <Link href="/privacy">privacy notice</Link>.
        </p>
        <button
          className="button"
          type="submit"
          disabled={status === "sending"}
        >
          {status === "sending" ? "Submitting…" : "Submit"}
          <ArrowUpRight size={20} />
        </button>
      </div>
    </form>
  );
}
