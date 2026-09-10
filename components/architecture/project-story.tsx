"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState, type MouseEvent } from "react";
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

export function ProjectStory({
  project,
  related,
}: {
  project: Project;
  related: Project[];
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
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement | null>(null);

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

  function openPhoto(event: MouseEvent<HTMLButtonElement>, index: number) {
    trigger.current = event.currentTarget;
    select(index);
    setOpen(true);
  }

  return (
    <article className="ar-story">
      <header className="ar-story-heading ar-container">
        <Link
          href={`/projects?type=${project.division}`}
          className="ar-story-back"
        >
          <ArrowLeft size={17} aria-hidden="true" /> All {project.division} work
        </Link>
        <div className="ar-story-title-row">
          <div>
            <p className="ar-kicker">{project.division} / Project story</p>
            <h1>
              {project.title}
              <span>.</span>
            </h1>
          </div>
          <p className="ar-story-subtitle">
            {project.subtitle || project.category}
          </p>
        </div>
        <div className="ar-story-facts">
          <p>
            <span>Location</span>
            {project.location}
          </p>
          <p>
            <span>Project type</span>
            {project.category}
          </p>
          <a href="#project-details" className="ar-text-link">
            Explore the scope <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </div>
      </header>

      {photo ? (
        <section
          className="ar-story-gallery-lead ar-container"
          aria-label="Project photography"
        >
          <div className="ar-story-hero-well">
            <button
              type="button"
              className="ar-story-hero"
              onClick={(event) => openPhoto(event, selected)}
              aria-label={`View full photograph: ${photo.alt}`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 1440px) 100vw, 1344px"
                preload
              />
              <span className="ar-story-enlarge">
                <ArrowsOut size={20} aria-hidden="true" /> View full photograph
              </span>
            </button>
            <div
              className="ar-story-photo-index"
              aria-live="polite"
              aria-atomic="true"
            >
              <span>{String(selected + 1).padStart(2, "0")}</span>
              <span>/ {String(project.images.length).padStart(2, "0")}</span>
            </div>
          </div>
          <div className="ar-story-photo-bar">
            <p>{photo.alt}</p>
            <div className="ar-story-photo-controls">
              <button
                type="button"
                aria-label="Previous photograph"
                onClick={() => move(-1)}
                disabled={project.images.length < 2}
              >
                <ArrowLeft size={21} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Next photograph"
                onClick={() => move(1)}
                disabled={project.images.length < 2}
              >
                <ArrowRight size={21} aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      ) : (
        <div className="ar-container">
          <div className="ar-story-no-photos">
            <p className="ar-kicker">Project photography</p>
            <p>Photographs will be added here soon.</p>
          </div>
        </div>
      )}

      <section id="project-details" className="ar-story-details ar-container">
        <div className="ar-story-overview">
          <h2>A closer look.</h2>
          <p className="ar-story-description">{project.description}</p>
          {project.result && (
            <p className="ar-story-result">{project.result}</p>
          )}
        </div>
        <div className="ar-story-scope">
          <h2>What went into it.</h2>
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
            <p className="ar-story-scope-note">
              Get in touch to learn more about our work on this project.
            </p>
          )}
        </div>
      </section>

      {project.images.length > 1 && (
        <section
          className="ar-story-photographs ar-container"
          aria-labelledby="ar-photographs-title"
        >
          <div className="ar-story-section-heading">
            <div>
              <h2 id="ar-photographs-title">Every angle tells a story.</h2>
            </div>
            <p>{project.images.length} photographs</p>
          </div>
          <div className="ar-story-photo-grid">
            {project.images.map((image, index) => (
              <figure key={`${image.src}-${index}`}>
                <button
                  type="button"
                  className="ar-story-grid-photo"
                  onClick={(event) => openPhoto(event, index)}
                  aria-label={`View photograph ${index + 1}: ${image.alt}`}
                  aria-current={selected === index ? "true" : undefined}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 720px) 100vw, (max-width: 1440px) 65vw, 860px"
                  />
                  <span aria-hidden="true">
                    <ArrowsOut size={20} />
                  </span>
                </button>
                <figcaption>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {image.alt}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="ar-story-next ar-container">
        <div>
          <h2>
            What do you
            <br />
            have in mind?
          </h2>
        </div>
        <Link href={`/contact?type=${project.division}`} className="ar-button">
          Start a project <ArrowUpRight size={22} aria-hidden="true" />
        </Link>
      </section>

      {related.length > 0 && (
        <section
          className="ar-story-related ar-container"
          aria-labelledby="ar-related-title"
        >
          <div className="ar-story-section-heading">
            <h2 id="ar-related-title">Keep exploring.</h2>
            <Link href="/projects" className="ar-text-link">
              View projects <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <div className="ar-story-related-grid">
            {related.map((item) => (
              <Link href={`/projects/${item.slug}`} key={item.id}>
                <div className="ar-story-related-photo">
                  {item.images[0] ? (
                    <Image
                      src={item.images[0].src}
                      alt={item.images[0].alt}
                      fill
                      sizes="(max-width: 720px) 100vw, 33vw"
                    />
                  ) : (
                    <span className="ar-photo-pending">
                      Photography coming soon
                    </span>
                  )}
                  <ArrowUpRight size={22} aria-hidden="true" />
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
          <Dialog.Overlay className="ar-lightbox-overlay" />
          <Dialog.Content
            className="ar-lightbox"
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
            <div className="ar-lightbox-heading">
              <Dialog.Title>{project.title}</Dialog.Title>
              <Dialog.Close aria-label="Close photograph">
                <X size={25} aria-hidden="true" />
              </Dialog.Close>
            </div>
            <Dialog.Description className="ar-visually-hidden">
              Use the arrow keys or buttons to browse. Press Escape to close.
            </Dialog.Description>
            {photo && (
              <div className="ar-lightbox-photo">
                <Image src={photo.src} alt={photo.alt} fill sizes="95vw" />
              </div>
            )}
            <div className="ar-lightbox-footer">
              <button
                type="button"
                aria-label="Previous photograph"
                onClick={() => move(-1)}
                disabled={project.images.length < 2}
              >
                <ArrowLeft size={23} aria-hidden="true" />
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
                <ArrowRight size={23} aria-hidden="true" />
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </article>
  );
}
