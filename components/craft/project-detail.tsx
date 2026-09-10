"use client";

import Image from "@/components/site-image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState, type CSSProperties, type MouseEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ArrowsOut,
  X,
} from "@phosphor-icons/react";
import type { Project } from "@/lib/types";
import "./portfolio.css";

function galleryWidth(ratios: number[], index: number, columns: number) {
  const rowStart = Math.floor(index / columns) * columns;
  const row = ratios.slice(rowStart, rowStart + columns);
  const share = ratios[index] / row.reduce((total, ratio) => total + ratio, 0);

  // Justified rows preserve each photograph's proportions and source order.
  // The small allowance prevents rounding from pushing the last image down.
  return `calc((100% - var(--rf-gallery-gap) * ${row.length - 1}) * ${share} - 0.1px)`;
}

export function ProjectDetail({
  project,
  related,
  imageAspectRatios = {},
}: {
  project: Project;
  related: Project[];
  imageAspectRatios?: Record<string, number>;
}) {
  const params = useSearchParams();
  const requested = Number(params.get("photo"));
  const selected =
    Number.isInteger(requested) &&
    requested >= 1 &&
    requested <= project.images.length
      ? requested - 1
      : 0;
  const photo = project.images[selected];
  const galleryRatios = project.images.map((image) => {
    const ratio = imageAspectRatios[image.src];
    return Number.isFinite(ratio) && ratio > 0 ? ratio : 3 / 4;
  });
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLAnchorElement | null>(null);

  function select(index: number) {
    if (index < 0 || index >= project.images.length) return;
    const url = new URL(window.location.href);
    if (index === 0) url.searchParams.delete("photo");
    else url.searchParams.set("photo", String(index + 1));
    window.history.pushState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }

  function move(direction: number) {
    if (project.images.length < 2) return;
    select(
      (selected + direction + project.images.length) % project.images.length,
    );
  }

  function openPhoto(event: MouseEvent<HTMLAnchorElement>, index: number) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    trigger.current = event.currentTarget;
    select(index);
    setOpen(true);
  }

  return (
    <article className="rf-case">
      <header className="rf-case-heading rf-container">
        <Link
          href={`/projects?type=${project.division}&project=${project.slug}`}
          className="rf-case-back"
        >
          <ArrowLeft size={18} aria-hidden="true" /> All {project.division}{" "}
          projects
        </Link>
        <p className="rf-case-heading-category">{project.category}</p>
      </header>

      <section
        className="rf-case-composition rf-container"
        aria-labelledby="rf-case-title"
      >
        <div className="rf-case-metadata">
          <div>
            <p className="rf-portfolio-eyebrow">{project.division}</p>
            <h1 id="rf-case-title">{project.title}</h1>
            {project.subtitle && (
              <p className="rf-case-subtitle">{project.subtitle}</p>
            )}
            <dl className="rf-case-facts">
              <div>
                <dt>Location</dt>
                <dd>{project.location}</dd>
              </div>
              <div>
                <dt>Project type</dt>
                <dd>{project.category}</dd>
              </div>
            </dl>
            <a href="#project-details" className="rf-text-link">
              Project scope <ArrowUpRight size={19} aria-hidden="true" />
            </a>
          </div>
          {photo && (
            <div className="rf-case-photo-navigation">
              <a href="#photographs">All {project.images.length} photographs</a>
              <div>
                <button
                  type="button"
                  aria-label="Previous photograph"
                  onClick={() => move(-1)}
                  disabled={project.images.length < 2}
                >
                  <ArrowLeft size={20} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Next photograph"
                  onClick={() => move(1)}
                  disabled={project.images.length < 2}
                >
                  <ArrowRight size={20} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
        {photo ? (
          <div className="rf-case-lead-media">
            <a
              href={photo.src}
              className="rf-case-lead-photo"
              style={
                {
                  "--rf-photo-ratio": imageAspectRatios[photo.src] || 3 / 4,
                } as CSSProperties
              }
              onClick={(event) => openPhoto(event, selected)}
              aria-label={`View full photograph: ${photo.alt}`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 700px) calc(100vw - 48px), (max-width: 1000px) 60vw, (max-width: 1680px) calc(62vw - 220px), 850px"
                loading="eager"
                fetchPriority="high"
              />
              <span className="rf-case-expand">
                <ArrowsOut size={19} aria-hidden="true" />
                <span>View full photograph</span>
              </span>
            </a>
            <div className="rf-case-lead-caption">
              <span>{photo.alt}</span>
              <span aria-live="polite">
                {String(selected + 1).padStart(2, "0")} /{" "}
                {String(project.images.length).padStart(2, "0")}
              </span>
            </div>
          </div>
        ) : (
          <div className="rf-case-empty">
            Project photography will be added soon.
          </div>
        )}
      </section>

      <section id="project-details" className="rf-case-details rf-container">
        <div className="rf-case-overview" data-rf-reveal>
          <p className="rf-portfolio-eyebrow">{project.title}</p>
          <h2>Project description</h2>
          <p>{project.description}</p>
          {project.result && <p className="rf-case-result">{project.result}</p>}
        </div>
        <div className="rf-case-scope" data-rf-reveal>
          <h2>Project scope</h2>
          {project.scope.length > 0 ? (
            <ul>
              {project.scope.map((item, index) => (
                <li key={item}>
                  <span aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p>No project scope is currently available.</p>
          )}
        </div>
      </section>

      {project.images.length > 0 && (
        <section
          id="photographs"
          className="rf-case-gallery rf-container"
          aria-labelledby="rf-gallery-title"
        >
          <div className="rf-case-section-heading">
            <div>
              <p className="rf-portfolio-eyebrow">{project.title}</p>
              <h2 id="rf-gallery-title">Project photography</h2>
            </div>
            <span>
              {String(project.images.length).padStart(2, "0")} photographs
            </span>
          </div>
          <div className="rf-case-photo-grid">
            {project.images.map((image, index) => (
              <figure
                key={`${image.src}-${index}`}
                style={
                  {
                    "--rf-photo-ratio": galleryRatios[index],
                    "--rf-gallery-width": galleryWidth(galleryRatios, index, 3),
                    "--rf-gallery-width-mobile": galleryWidth(
                      galleryRatios,
                      index,
                      2,
                    ),
                  } as CSSProperties
                }
              >
                <a
                  href={image.src}
                  className="rf-case-grid-photo"
                  onClick={(event) => openPhoto(event, index)}
                  aria-label={`View photograph ${index + 1}: ${image.alt}`}
                  aria-current={selected === index ? "true" : undefined}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 700px) 66vw, (max-width: 1000px) 46vw, (max-width: 1680px) calc(50vw - 170px), 650px"
                  />
                  <span aria-hidden="true">
                    <ArrowsOut size={20} />
                  </span>
                </a>
                <figcaption>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span>{image.alt}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <div className="rf-case-inquiry rf-container">
        <p>Discuss Your Project</p>
        <Link className="rf-button" href={`/contact?type=${project.division}`}>
          Discuss Your Project{" "}
          <span>
            <ArrowUpRight size={21} aria-hidden="true" />
          </span>
        </Link>
      </div>

      {related.length > 0 && (
        <section
          className="rf-case-related rf-container"
          aria-labelledby="rf-related-title"
        >
          <div className="rf-case-section-heading">
            <h2 id="rf-related-title">Related projects</h2>
            <Link
              href={`/projects?type=${project.division}`}
              className="rf-text-link"
            >
              All {project.division} projects{" "}
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <div className="rf-case-related-grid">
            {related.map((item) => (
              <Link href={`/projects/${item.slug}`} key={item.id}>
                <div className="rf-case-related-frame">
                  <div className="rf-case-related-photo">
                    {item.images[0] ? (
                      <Image
                        src={item.images[0].src}
                        alt={item.images[0].alt}
                        fill
                        sizes="(max-width: 700px) 80vw, 30vw"
                      />
                    ) : (
                      <span className="rf-portfolio-pending">
                        Photography coming soon
                      </span>
                    )}
                    <span aria-hidden="true">
                      <ArrowUpRight size={23} />
                    </span>
                  </div>
                </div>
                <p>{item.location}</p>
                <h3>{item.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="rf-lightbox-overlay" />
          <Dialog.Content
            className="rf-lightbox"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              trigger.current?.focus();
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                move(event.key === "ArrowLeft" ? -1 : 1);
              }
            }}
          >
            <div className="rf-lightbox-heading">
              <Dialog.Title>{project.title}</Dialog.Title>
              <Dialog.Close aria-label="Close photograph">
                <X size={24} aria-hidden="true" />
              </Dialog.Close>
            </div>
            <Dialog.Description className="rf-case-sr-only">
              Use the arrow keys or buttons to browse. Press Escape to close.
            </Dialog.Description>
            {photo && (
              <div className="rf-lightbox-photo">
                <Image src={photo.src} alt={photo.alt} fill sizes="95vw" />
              </div>
            )}
            <div className="rf-lightbox-footer">
              <button
                type="button"
                aria-label="Previous photograph"
                onClick={() => move(-1)}
                disabled={project.images.length < 2}
              >
                <ArrowLeft size={22} aria-hidden="true" />
              </button>
              <div aria-live="polite" aria-atomic="true">
                <span>
                  {selected + 1} / {project.images.length}
                </span>
                <p>{photo?.alt}</p>
              </div>
              <button
                type="button"
                aria-label="Next photograph"
                onClick={() => move(1)}
                disabled={project.images.length < 2}
              >
                <ArrowRight size={22} aria-hidden="true" />
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </article>
  );
}
