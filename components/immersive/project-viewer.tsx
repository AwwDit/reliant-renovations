"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ArrowsOut,
  Plus,
  X,
} from "@phosphor-icons/react";
import type { Project, ProjectImage } from "@/lib/types";
import "./project-viewer.css";

function photoHref(slug: string, index: number) {
  return `/projects/${slug}${index === 0 ? "" : `?photo=${index + 1}`}`;
}

function plainClick(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.altKey &&
    !event.shiftKey
  );
}

type PhotoFrames = {
  requested: string;
  current: ProjectImage;
  previous: ProjectImage | null;
  ready: boolean;
};

/** Keep the last decoded photo visible while the requested photograph loads. */
function PhotoSurface({ photo }: { photo: ProjectImage }) {
  const [frames, setFrames] = useState<PhotoFrames>({
    requested: photo.src,
    current: photo,
    previous: null,
    ready: true,
  });

  if (frames.requested !== photo.src) {
    setFrames({
      requested: photo.src,
      current: photo,
      previous: frames.ready ? frames.current : frames.previous,
      ready: false,
    });
  }

  async function reveal(element: HTMLImageElement, source: string) {
    try {
      await element.decode();
    } catch {
      // A loaded image remains usable when the browser cannot decode explicitly.
    }
    setFrames((state) =>
      state.requested === source ? { ...state, ready: true } : state,
    );
  }

  return (
    <>
      {frames.previous && (
        <div
          className="rr-viewer-photo rr-viewer-photo-previous"
          aria-hidden="true"
        >
          <Image
            src={frames.previous.src}
            alt=""
            fill
            sizes="100vw"
            loading="eager"
          />
        </div>
      )}
      <div
        key={frames.current.src}
        className="rr-viewer-photo rr-viewer-photo-current"
        data-ready={frames.ready}
      >
        <Image
          src={frames.current.src}
          alt={frames.current.alt}
          fill
          sizes="100vw"
          loading="eager"
          fetchPriority="high"
          onLoad={(event) =>
            void reveal(event.currentTarget, frames.current.src)
          }
          onError={() =>
            setFrames((state) =>
              state.requested === frames.current.src
                ? { ...state, ready: true }
                : state,
            )
          }
        />
      </div>
    </>
  );
}

function ProjectInformation({
  project,
  related,
}: {
  project: Project;
  related: Project[];
}) {
  return (
    <div className="rr-viewer-information">
      <dl className="rr-viewer-facts">
        <div>
          <dt>Location</dt>
          <dd>{project.location}</dd>
        </div>
        <div>
          <dt>Project type</dt>
          <dd>{project.category}</dd>
        </div>
      </dl>
      <section className="rr-viewer-description">
        <h3>The project</h3>
        <p>{project.description}</p>
        {project.result && <p>{project.result}</p>}
      </section>
      <section className="rr-viewer-scope">
        <h3>Our scope of work</h3>
        {project.scope.length ? (
          <ul>
            {project.scope.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p>Contact us for more about our work on this project.</p>
        )}
      </section>
      <Link
        href={`/contact?type=${project.division}`}
        className="rr-viewer-contact"
      >
        Start a project <ArrowUpRight size={20} aria-hidden="true" />
      </Link>
      {related.length > 0 && (
        <section className="rr-viewer-related">
          <h3>More {project.division} projects</h3>
          {related.map((item) => (
            <Link href={`/projects/${item.slug}`} key={item.id}>
              {item.images[0] && (
                <span className="rr-viewer-related-image">
                  <Image
                    src={item.images[0].src}
                    alt={item.images[0].alt}
                    fill
                    sizes="84px"
                  />
                </span>
              )}
              <span>
                <strong>{item.title}</strong>
                <small>{item.location}</small>
              </span>
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}

/** Key the inner viewer so pending image decodes cannot carry across projects. */
export function ProjectViewer({
  project,
  related,
}: {
  project: Project;
  related: Project[];
}) {
  return (
    <ProjectViewerContent
      key={project.id}
      project={project}
      related={related}
    />
  );
}

function ProjectViewerContent({
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
  const nextPhoto =
    project.images.length > 1
      ? project.images[(selected + 1) % project.images.length]
      : null;
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const opener = useRef<HTMLAnchorElement | null>(null);
  const strip = useRef<HTMLDivElement>(null);

  function select(index: number) {
    if (index < 0 || index >= project.images.length) return;
    const url = new URL(window.location.href);
    if (index === 0) url.searchParams.delete("photo");
    else url.searchParams.set("photo", String(index + 1));
    const href = `${url.pathname}${url.search}${url.hash}`;
    if (
      href !==
      `${window.location.pathname}${window.location.search}${window.location.hash}`
    ) {
      window.history.pushState(null, "", href);
    }
  }

  function move(amount: number) {
    if (project.images.length > 1)
      select(
        (selected + amount + project.images.length) % project.images.length,
      );
  }

  function viewFullPhoto(event: MouseEvent<HTMLAnchorElement>) {
    if (!plainClick(event)) return;
    event.preventDefault();
    opener.current = event.currentTarget;
    setPhotoOpen(true);
  }

  useEffect(() => {
    const element = strip.current?.querySelector<HTMLElement>(
      '[aria-current="true"]',
    );
    if (!element || !strip.current) return;
    const frame = strip.current.getBoundingClientRect();
    const thumb = element.getBoundingClientRect();
    if (thumb.left < frame.left || thumb.right > frame.right) {
      strip.current.scrollTo({
        left: strip.current.scrollLeft + thumb.left - frame.left - 4,
        behavior: "instant",
      });
    }
  }, [selected]);

  useEffect(() => {
    if (detailsOpen || photoOpen || project.images.length < 2) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.defaultPrevented
      )
        return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
      )
        return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const index =
        (selected +
          (event.key === "ArrowRight" ? 1 : -1) +
          project.images.length) %
        project.images.length;
      const url = new URL(window.location.href);
      if (index === 0) url.searchParams.delete("photo");
      else url.searchParams.set("photo", String(index + 1));
      window.history.pushState(
        null,
        "",
        `${url.pathname}${url.search}${url.hash}`,
      );
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [detailsOpen, photoOpen, selected, project.images.length]);

  return (
    <>
      <section
        className="rr-viewer"
        data-division={project.division}
        aria-label={`${project.title} project photographs`}
      >
        {photo ? (
          <a
            href={photo.src}
            className="rr-viewer-canvas"
            onClick={viewFullPhoto}
            aria-label={`View full photograph: ${photo.alt}`}
          >
            <PhotoSurface photo={photo} />
          </a>
        ) : (
          <div className="rr-viewer-empty">
            <p>Project photographs will be added here soon.</p>
          </div>
        )}
        {nextPhoto && (
          <div className="rr-viewer-prefetch" aria-hidden="true">
            <Image
              src={nextPhoto.src}
              alt=""
              fill
              sizes="100vw"
              loading="eager"
              fetchPriority="low"
            />
          </div>
        )}
        <div className="rr-viewer-shade" aria-hidden="true" />

        <Link
          href={`/projects?type=${project.division}`}
          className="rr-viewer-back"
        >
          <ArrowLeft size={17} aria-hidden="true" /> {project.division} projects
        </Link>

        <div className="rr-viewer-title">
          <p className="rr-viewer-location">{project.location}</p>
          <h1>{project.title}</h1>
          <p className="rr-viewer-subtitle">
            {project.subtitle || project.category}
          </p>
          <Dialog.Root open={detailsOpen} onOpenChange={setDetailsOpen}>
            <Dialog.Trigger className="rr-viewer-details-trigger rr-viewer-js">
              Project details <Plus size={18} aria-hidden="true" />
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="rr-viewer-dialog-overlay" />
              <Dialog.Content className="rr-viewer-drawer">
                <div className="rr-viewer-drawer-heading">
                  <span>{project.division}</span>
                  <Dialog.Close
                    className="rr-viewer-icon-button"
                    aria-label="Close project details"
                  >
                    <X size={24} aria-hidden="true" />
                  </Dialog.Close>
                </div>
                <Dialog.Title>{project.title}</Dialog.Title>
                <Dialog.Description>
                  {project.subtitle || project.category}
                </Dialog.Description>
                <ProjectInformation project={project} related={related} />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        {photo && (
          <>
            <div className="rr-viewer-navigation rr-viewer-js">
              <button
                type="button"
                onClick={() => move(-1)}
                disabled={project.images.length < 2}
                aria-label="Previous photograph"
              >
                <ArrowLeft size={23} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                disabled={project.images.length < 2}
                aria-label="Next photograph"
              >
                <ArrowRight size={23} aria-hidden="true" />
              </button>
            </div>
            <a
              href={photo.src}
              onClick={viewFullPhoto}
              className="rr-viewer-expand"
            >
              <ArrowsOut size={18} aria-hidden="true" />
              <span>Full photograph</span>
            </a>
            <footer className="rr-viewer-tray">
              <div
                className="rr-viewer-tray-caption"
                aria-live="polite"
                aria-atomic="true"
              >
                <p>{photo.alt}</p>
                <span>
                  {String(selected + 1).padStart(2, "0")} /{" "}
                  {String(project.images.length).padStart(2, "0")}
                </span>
              </div>
              <div
                className="rr-viewer-filmstrip"
                ref={strip}
                aria-label="Choose a photograph"
              >
                {project.images.map((image, index) => (
                  <a
                    key={`${image.src}-${index}`}
                    href={photoHref(project.slug, index)}
                    aria-label={`Photograph ${index + 1}: ${image.alt}`}
                    aria-current={index === selected ? "true" : undefined}
                    onClick={(event) => {
                      if (plainClick(event)) {
                        event.preventDefault();
                        select(index);
                      }
                    }}
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes="(max-width: 600px) 70px, 94px"
                    />
                    <span aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </a>
                ))}
              </div>
            </footer>
          </>
        )}
      </section>

      <Dialog.Root open={photoOpen} onOpenChange={setPhotoOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="rr-viewer-dialog-overlay rr-viewer-full-overlay" />
          <Dialog.Content
            className="rr-viewer-lightbox"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              opener.current?.focus();
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                move(event.key === "ArrowLeft" ? -1 : 1);
              }
            }}
          >
            <header className="rr-viewer-lightbox-heading">
              <Dialog.Title>{project.title}</Dialog.Title>
              <Dialog.Close
                className="rr-viewer-icon-button"
                aria-label="Close photograph"
              >
                <X size={25} aria-hidden="true" />
              </Dialog.Close>
            </header>
            <Dialog.Description className="rr-viewer-sr-only">
              Use the arrow keys or buttons to browse photographs. Press Escape
              to close.
            </Dialog.Description>
            {photo && (
              <div className="rr-viewer-full-image">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="96vw"
                  loading="eager"
                />
              </div>
            )}
            <footer className="rr-viewer-lightbox-footer">
              <button
                type="button"
                className="rr-viewer-icon-button"
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
                className="rr-viewer-icon-button"
                aria-label="Next photograph"
                onClick={() => move(1)}
                disabled={project.images.length < 2}
              >
                <ArrowRight size={23} aria-hidden="true" />
              </button>
            </footer>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <noscript>
        <style>{`.rr-viewer-js{display:none!important}.rr-viewer-nojs{display:block!important}`}</style>
        <section
          className="rr-viewer-nojs"
          aria-label="Project details and photographs"
        >
          <h2>{project.title}</h2>
          <ProjectInformation project={project} related={related} />
          <div className="rr-viewer-contact-sheet">
            {project.images.map((image, index) => (
              <a href={image.src} key={`${image.src}-${index}`}>
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={800}
                  height={600}
                  sizes="(max-width: 720px) 100vw, 50vw"
                />
                <span>{image.alt}</span>
              </a>
            ))}
          </div>
        </section>
      </noscript>
    </>
  );
}
