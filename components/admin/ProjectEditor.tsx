"use client";
import { useRef, useState, type RefObject } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Check,
  CloudArrowUp,
  LinkSimple,
  Plus,
  Trash,
  X,
} from "@phosphor-icons/react";
import type { Project, ProjectImage } from "@/lib/types";
import { isCloudinaryProjectUrl } from "@/lib/media-urls";
import { adminRequest } from "./AdminDashboard";

const emptyProject = {
  slug: "",
  title: "",
  subtitle: "",
  division: "commercial" as const,
  location: "",
  category: "",
  description: "",
  result: "",
  scope: [] as string[],
  images: [] as ProjectImage[],
  featured: false,
  published: false,
};
export function ProjectEditor({
  project,
  cloudName,
  returnFocusRef,
  onClose,
  onSaved,
}: {
  project?: Project;
  cloudName: string;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState<
    Omit<Project, "id" | "updatedAt" | "order"> &
      Partial<Pick<Project, "id" | "updatedAt" | "order">>
  >(
    project
      ? { ...project, images: [...project.images], scope: [...project.scope] }
      : emptyProject,
  );
  const [scope, setScope] = useState(project?.scope.join("\n") || "");
  const [slugEdited, setSlugEdited] = useState(!!project);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [showUrl, setShowUrl] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    if (form.images.length + files.length > 30) {
      setError("A project can contain up to 30 images.");
      return;
    }
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        const data = await adminRequest("/api/uploads", {
          method: "POST",
          body,
        });
        setForm((current) => ({
          ...current,
          images: [...current.images, { src: data.src, alt: "" }],
        }));
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "An image could not be uploaded.",
      );
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }
  function moveImage(index: number, direction: -1 | 1) {
    const images = [...form.images];
    const next = index + direction;
    if (next < 0 || next >= images.length) return;
    [images[index], images[next]] = [images[next], images[index]];
    update("images", images);
  }
  function addImageUrl() {
    if (!imageUrl.trim() || imageAlt.trim().length < 3) {
      setError(
        "Enter an existing image URL or path and descriptive alternative text.",
      );
      return;
    }
    if (
      !isCloudinaryProjectUrl(imageUrl.trim(), cloudName) &&
      !/^\/images\/[a-zA-Z0-9/_-]+\.(jpg|jpeg|png|webp)$/.test(
        imageUrl.trim(),
      ) &&
      !/^\/api\/uploads\/project-[a-f0-9-]{36}\.(jpg|png|webp)$/.test(
        imageUrl.trim(),
      )
    ) {
      setError(
        "Upload a photo, use a Reliant Cloudinary image URL, or enter an existing image path.",
      );
      return;
    }
    if (form.images.length >= 30) {
      setError("A project can contain up to 30 images.");
      return;
    }
    update("images", [
      ...form.images,
      { src: imageUrl.trim(), alt: imageAlt.trim() },
    ]);
    setImageUrl("");
    setImageAlt("");
    setShowUrl(false);
    setError("");
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await adminRequest(
        project ? `/api/projects/${project.id}` : "/api/projects",
        {
          method: project ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            scope: scope
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean),
          }),
        },
      );
      await onSaved();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "The project could not be saved.",
      );
      setBusy(false);
    }
  }
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !busy && !uploading) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="ad-dialog-overlay" />
        <Dialog.Content
          className="ad-editor"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const opener = returnFocusRef.current;
            if (opener?.isConnected) opener.focus();
            if (document.activeElement !== opener)
              document.getElementById("admin-content")?.focus();
          }}
        >
          <header className="ad-editor-heading">
            <div>
              <div className="ad-eyebrow">PROJECT EDITOR</div>
              <Dialog.Title>
                {project ? project.title : "Add project"}
              </Dialog.Title>
              <Dialog.Description>
                {project
                  ? `${project.division === "commercial" ? "Commercial" : "Residential"} · ${project.location}`
                  : "Project details, scope of work and photography."}
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="ad-icon-button"
              aria-label="Close project editor"
              disabled={busy || uploading}
            >
              <X size={24} />
            </Dialog.Close>
          </header>
          <form onSubmit={submit} className="ad-editor-form">
            <div className="ad-editor-scroll">
              <div className="ad-editor-column">
                <section className="ad-editor-section">
                  <h3>Project details</h3>
                  <label className="ad-field">
                    <span>
                      Project title <i>*</i>
                    </span>
                    <input
                      value={form.title}
                      required
                      minLength={2}
                      maxLength={150}
                      placeholder="e.g. Kitchen and open-concept renovation"
                      onChange={(event) => {
                        const title = event.target.value;
                        setForm((current) => ({
                          ...current,
                          title,
                          ...(!slugEdited
                            ? {
                                slug: title
                                  .toLowerCase()
                                  .normalize("NFKD")
                                  .replace(/[\u0300-\u036f]/g, "")
                                  .replace(/[^a-z0-9]+/g, "-")
                                  .replace(/^-|-$/g, "")
                                  .slice(0, 120),
                              }
                            : {}),
                        }));
                      }}
                    />
                  </label>
                  <label className="ad-field">
                    <span>Subtitle</span>
                    <input
                      value={form.subtitle}
                      maxLength={180}
                      placeholder="A short line that introduces the project"
                      onChange={(event) =>
                        update("subtitle", event.target.value)
                      }
                    />
                  </label>
                  <div className="ad-field-row">
                    <label className="ad-field">
                      <span>
                        Division <i>*</i>
                      </span>
                      <select
                        value={form.division}
                        onChange={(event) =>
                          update(
                            "division",
                            event.target.value as "commercial" | "residential",
                          )
                        }
                      >
                        <option value="commercial">Commercial</option>
                        <option value="residential">Residential</option>
                      </select>
                    </label>
                    <label className="ad-field">
                      <span>
                        Category <i>*</i>
                      </span>
                      <input
                        value={form.category}
                        required
                        minLength={2}
                        maxLength={100}
                        placeholder="e.g. Office renovation"
                        onChange={(event) =>
                          update("category", event.target.value)
                        }
                      />
                    </label>
                  </div>
                  <label className="ad-field">
                    <span>
                      Location <i>*</i>
                    </span>
                    <input
                      value={form.location}
                      required
                      minLength={2}
                      maxLength={150}
                      placeholder="City or neighbourhood"
                      onChange={(event) =>
                        update("location", event.target.value)
                      }
                    />
                  </label>
                </section>
                <section className="ad-editor-section">
                  <h3>Description &amp; scope</h3>
                  <label className="ad-field">
                    <span>
                      Description <i>*</i>
                    </span>
                    <textarea
                      value={form.description}
                      required
                      minLength={20}
                      maxLength={10000}
                      rows={5}
                      placeholder="What did the client need? What did you create? Include details that make this project distinctive."
                      onChange={(event) =>
                        update("description", event.target.value)
                      }
                    />
                    <small>
                      A specific story helps visitors and search engines
                      understand your work.
                    </small>
                  </label>
                  <label className="ad-field">
                    <span>The result</span>
                    <textarea
                      value={form.result}
                      maxLength={5000}
                      rows={3}
                      placeholder="Describe the finished space and what it made possible."
                      onChange={(event) => update("result", event.target.value)}
                    />
                  </label>
                  <label className="ad-field">
                    <span>Scope of work</span>
                    <textarea
                      value={scope}
                      rows={4}
                      placeholder={
                        "Interior demolition\nCustom millwork\nLighting and finishes"
                      }
                      onChange={(event) => setScope(event.target.value)}
                    />
                    <small>One item per line. Up to 30 items.</small>
                  </label>
                </section>
                <section className="ad-editor-section">
                  <h3>Website settings</h3>
                  <label className="ad-field">
                    <span>
                      URL slug <i>*</i>
                    </span>
                    <div className="ad-slug-field">
                      <span>/projects/</span>
                      <input
                        value={form.slug}
                        readOnly={!!project}
                        required
                        pattern="[a-z0-9]+(-[a-z0-9]+)*"
                        minLength={2}
                        maxLength={120}
                        onChange={(event) => {
                          setSlugEdited(true);
                          update("slug", event.target.value);
                        }}
                      />
                    </div>
                    <small>
                      {project
                        ? "This address is permanent so bookmarks and search results keep working."
                        : "Choose a short, descriptive address. It becomes permanent when you save."}
                    </small>
                  </label>
                  <label className="ad-toggle-row">
                    <div>
                      <strong>Publish project</strong>
                      <small>Make this project visible on the website.</small>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.published}
                      onChange={(event) =>
                        update("published", event.target.checked)
                      }
                    />
                    <span className="ad-toggle" aria-hidden="true" />
                  </label>
                  <label className="ad-toggle-row">
                    <div>
                      <strong>Feature on the homepage</strong>
                      <small>
                        Include this project in the featured collection.
                      </small>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(event) =>
                        update("featured", event.target.checked)
                      }
                    />
                    <span className="ad-toggle" aria-hidden="true" />
                  </label>
                  {project?.published && (
                    <a
                      className="ad-text-link"
                      href={`/projects/${project.slug}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View current project page
                      <ArrowUpRight size={15} />
                    </a>
                  )}
                </section>
              </div>
              <div className="ad-editor-column ad-gallery-column">
                <section className="ad-editor-section">
                  <h3>
                    Project photography<small>{form.images.length}/30</small>
                  </h3>
                  <p className="ad-gallery-help">
                    The first image is your project cover. Arrange the rest to
                    take visitors through the space.
                  </p>
                  <input
                    className="ad-visually-hidden"
                    ref={fileInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(event) => uploadFiles(event.target.files)}
                    disabled={uploading || busy}
                    aria-label="Upload project images"
                  />
                  <button
                    type="button"
                    className="ad-upload-area"
                    onClick={() => fileInput.current?.click()}
                    disabled={uploading || busy}
                  >
                    <CloudArrowUp size={26} aria-hidden="true" />
                    <span className="ad-upload-copy">
                      <strong>
                        {uploading
                          ? "Uploading photography…"
                          : "Choose project photos"}
                      </strong>
                      <small>JPG, PNG or WebP · Up to 10 MB each</small>
                    </span>
                    <span className="ad-upload-action" aria-hidden="true">
                      <Plus size={18} />
                    </span>
                  </button>
                  <button
                    type="button"
                    className="ad-url-toggle"
                    onClick={() => setShowUrl(!showUrl)}
                  >
                    <LinkSimple size={15} />
                    Or use an existing image URL or path
                  </button>
                  {showUrl && (
                    <div className="ad-url-panel">
                      <label className="ad-field">
                        <span>Existing image URL or path</span>
                        <input
                          type="text"
                          value={imageUrl}
                          placeholder="Cloudinary URL or /images/project-photo.jpg"
                          maxLength={2048}
                          onChange={(event) => setImageUrl(event.target.value)}
                        />
                      </label>
                      <label className="ad-field">
                        <span>Alternative text</span>
                        <input
                          value={imageAlt}
                          placeholder="Describe what’s visible in the image"
                          onChange={(event) => setImageAlt(event.target.value)}
                        />
                      </label>
                      <button
                        type="button"
                        className="ad-button ad-secondary"
                        onClick={addImageUrl}
                      >
                        Add image
                        <Plus size={15} />
                      </button>
                    </div>
                  )}
                  <div className="ad-gallery-items">
                    {form.images.map((image, index) => (
                      <div
                        className="ad-gallery-item"
                        key={`${index}-${image.src}`}
                      >
                        <div className="ad-gallery-image">
                          <Image
                            src={image.src}
                            alt={
                              image.alt ||
                              "Project photo awaiting alternative text"
                            }
                            fill
                            unoptimized
                            sizes="180px"
                          />
                          <span>
                            {index === 0
                              ? "COVER"
                              : String(index + 1).padStart(2, "0")}
                          </span>
                        </div>
                        <div className="ad-gallery-detail">
                          <label className="ad-field">
                            <span>
                              Alternative text <i>*</i>
                            </span>
                            <textarea
                              rows={2}
                              value={image.alt}
                              required
                              minLength={3}
                              maxLength={300}
                              placeholder="Describe the space, materials and details"
                              onChange={(event) =>
                                update(
                                  "images",
                                  form.images.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, alt: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                          </label>
                          <div className="ad-gallery-controls">
                            <span>
                              {index === 0
                                ? "Cover image"
                                : `Gallery image ${index + 1}`}
                            </span>
                            <button
                              type="button"
                              className="ad-icon-button"
                              aria-label={`Move image ${index + 1} earlier`}
                              disabled={index === 0}
                              onClick={() => moveImage(index, -1)}
                            >
                              <ArrowUp size={15} />
                            </button>
                            <button
                              type="button"
                              className="ad-icon-button"
                              aria-label={`Move image ${index + 1} later`}
                              disabled={index === form.images.length - 1}
                              onClick={() => moveImage(index, 1)}
                            >
                              <ArrowDown size={15} />
                            </button>
                            <button
                              type="button"
                              className="ad-icon-button ad-danger"
                              aria-label={`Remove image ${index + 1}`}
                              onClick={() =>
                                update(
                                  "images",
                                  form.images.filter(
                                    (_, itemIndex) => itemIndex !== index,
                                  ),
                                )
                              }
                            >
                              <Trash size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {form.images.length > 0 && (
                    <p className="ad-footnote">
                      Describe each image for screen readers and search. Avoid
                      repeating the project title as every description.
                    </p>
                  )}
                </section>
              </div>
            </div>
            <footer className="ad-editor-footer">
              {error ? (
                <p className="ad-error" role="alert">
                  {error}
                </p>
              ) : (
                <span className="ad-save-status">
                  <span className={form.published ? "ad-dot-blue" : ""} />
                  {form.published
                    ? "Will be visible on the website"
                    : "Saving as a hidden project"}
                </span>
              )}
              <div>
                <button
                  type="button"
                  className="ad-button ad-secondary"
                  onClick={onClose}
                  disabled={busy || uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ad-button ad-primary"
                  disabled={busy || uploading}
                >
                  {busy ? "Saving…" : "Save project"}
                  <span className="ad-button-icon" aria-hidden="true">
                    <Check size={18} />
                  </span>
                </button>
              </div>
            </footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
