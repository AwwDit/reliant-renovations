"use client";

import Image from "@/components/site-image";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import type { Project } from "@/lib/types";
import "./project-dialog.css";

export function ConceptProjectDialog({
  project,
  initialIndex,
  onClose,
}: {
  project: Project;
  initialIndex: number;
  onClose: () => void;
}) {
  const photos = project.images;
  const [selected, setSelected] = useState(() =>
    Number.isFinite(initialIndex)
      ? Math.min(
          Math.max(0, Math.floor(initialIndex)),
          Math.max(0, photos.length - 1),
        )
      : 0,
  );
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const invokingElement = useRef<HTMLElement | null>(null);
  const thumbnails = useRef<HTMLDivElement>(null);
  const active = Math.min(selected, Math.max(0, photos.length - 1));
  const photo = photos[active];
  const multiple = photos.length > 1;

  const move = (direction: number) => {
    if (multiple)
      setSelected(
        (index) => (index + direction + photos.length) % photos.length,
      );
  };

  useEffect(() => {
    const strip = thumbnails.current;
    const button = strip?.querySelector<HTMLElement>(
      `[data-photo-index="${active}"]`,
    );
    if (!strip || !button) return;
    // Scroll only the thumbnail strip, preserving the reader's sidebar position.
    const left = button.offsetLeft - strip.offsetLeft;
    if (left < strip.scrollLeft) strip.scrollLeft = left;
    else if (left + button.offsetWidth > strip.scrollLeft + strip.clientWidth)
      strip.scrollLeft = left + button.offsetWidth - strip.clientWidth;
  }, [active]);

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="cg-dialog-overlay" />
        <Dialog.Content
          className="cg-dialog cg-surface"
          onOpenAutoFocus={() => {
            invokingElement.current =
              document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;
          }}
          onCloseAutoFocus={(event) => {
            const target = invokingElement.current;
            if (target?.isConnected && target !== document.body) {
              event.preventDefault();
              target.focus({ preventScroll: true });
            }
          }}
          onKeyDown={(event) => {
            const target = event.target as HTMLElement;
            if (
              event.altKey ||
              event.ctrlKey ||
              event.metaKey ||
              event.shiftKey ||
              target.closest("input, textarea, select, [contenteditable=true]")
            )
              return;
            if (
              multiple &&
              (event.key === "ArrowLeft" || event.key === "ArrowRight")
            ) {
              event.preventDefault();
              move(event.key === "ArrowLeft" ? -1 : 1);
            }
          }}
        >
          <header className="cg-dialog-header">
            <p>
              <span>{project.division}</span>
              <span aria-hidden="true">/</span>
              {project.category}
            </p>
            <Dialog.Close
              className="cg-dialog-close"
              aria-label="Close project gallery"
            >
              <X size={24} weight="light" aria-hidden="true" />
            </Dialog.Close>
          </header>

          <div className="cg-dialog-body">
            <div className="cg-dialog-viewer">
              <figure className="cg-dialog-photo">
                {photo && failedSource !== photo.src ? (
                  <Image
                    key={photo.src}
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(max-width: 800px) calc(100vw - 32px), 63vw"
                    loading="eager"
                    fetchPriority="high"
                    onError={() => setFailedSource(photo.src)}
                  />
                ) : (
                  <p className="cg-dialog-photo-message">
                    {photo
                      ? "This photograph is unavailable. You can still explore the other images and project details."
                      : "Project photography will be added here."}
                  </p>
                )}
              </figure>

              <div className="cg-dialog-caption-bar">
                <p
                  className="cg-dialog-caption"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {photo ? (
                    <>
                      <span>
                        {String(active + 1).padStart(2, "0")} /{" "}
                        {String(photos.length).padStart(2, "0")}
                      </span>
                      {photo.alt}
                    </>
                  ) : (
                    "Project details"
                  )}
                </p>
                {multiple && (
                  <div
                    className="cg-dialog-arrows"
                    role="group"
                    aria-label="Photograph navigation"
                  >
                    <button
                      type="button"
                      onClick={() => move(-1)}
                      aria-label="Previous photograph"
                    >
                      <ArrowLeft size={21} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(1)}
                      aria-label="Next photograph"
                    >
                      <ArrowRight size={21} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>

              {photos.length > 0 && (
                <div
                  ref={thumbnails}
                  className="cg-dialog-thumbnails"
                  role="group"
                  aria-label="Choose a project photograph"
                >
                  {photos.map((item, index) => (
                    <button
                      type="button"
                      key={`${item.src}-${index}`}
                      data-photo-index={index}
                      aria-label={`Photograph ${index + 1}: ${item.alt}`}
                      aria-pressed={active === index}
                      onClick={() => setSelected(index)}
                    >
                      <Image src={item.src} alt="" fill sizes="80px" />
                      <span>{String(index + 1).padStart(2, "0")}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <aside
              className="cg-dialog-information"
              aria-label="About this project"
            >
              <p className="cg-dialog-location">{project.location}</p>
              <Dialog.Title className="cg-dialog-title">
                {project.title}
              </Dialog.Title>
              {project.subtitle && (
                <p className="cg-dialog-subtitle">{project.subtitle}</p>
              )}
              <Dialog.Description className="cg-dialog-description">
                {project.description}
              </Dialog.Description>
              {project.result && (
                <p className="cg-dialog-result">{project.result}</p>
              )}
              {project.scope.length > 0 && (
                <section className="cg-dialog-scope" aria-label="Project scope">
                  <h3>The scope of our work</h3>
                  <ul>
                    {project.scope.map((item, index) => (
                      <li key={`${index}-${item}`}>{item}</li>
                    ))}
                  </ul>
                </section>
              )}
              <div className="cg-dialog-links">
                <Link
                  href={`/projects/${project.slug}`}
                  className="cg-dialog-project-link"
                >
                  View the full project
                  <ArrowUpRight size={19} aria-hidden="true" />
                </Link>
                <Link
                  href={`/contact?type=${project.division}`}
                  className="cg-dialog-contact-link"
                >
                  Discuss a similar project
                  <ArrowUpRight size={19} aria-hidden="true" />
                </Link>
              </div>
            </aside>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
