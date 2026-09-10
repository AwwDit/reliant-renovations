"use client";

import Image from "@/components/site-image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
  type ReactNode,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ArrowsOut,
  List,
  X,
} from "@phosphor-icons/react";
import { useWorldScene } from "./world-shell";
import type { Division, Project, ProjectImage } from "@/lib/types";
import "./project-atlas.css";

type ProjectDivision = Division | "all";
const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;
const useReady = () =>
  useSyncExternalStore(subscribe, clientReady, serverReady);

function divisionFrom(value: string | null): ProjectDivision {
  return value === "residential" || value === "commercial" ? value : "all";
}

function atlasHref(division: ProjectDivision, slug?: string) {
  const params = new URLSearchParams();
  if (division !== "all") params.set("type", division);
  if (slug) params.set("project", slug);
  return `/projects${params.size ? `?${params}` : ""}`;
}

function unmodifiedClick(event: MouseEvent<HTMLAnchorElement>) {
  return (
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey &&
    event.button === 0
  );
}

/** Native details retain the entire server-rendered story and a no-JS control. */
function AtlasDrawer({
  label,
  title,
  description,
  children,
}: {
  label: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ready = useReady();
  const trigger = useRef<HTMLElement>(null);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <details className="wa-native-drawer">
        <summary
          ref={trigger}
          aria-haspopup={ready ? "dialog" : undefined}
          aria-expanded={ready ? open : undefined}
          onClick={(event) => {
            if (ready) {
              event.preventDefault();
              const details = event.currentTarget.parentElement;
              if (details instanceof HTMLDetailsElement) details.open = false;
              setOpen(true);
            }
          }}
        >
          <List size={17} aria-hidden="true" /> {label}
        </summary>
        <div className="wa-native-content">
          <h2>{title}</h2>
          <p className="wa-drawer-description">{description}</p>
          {children}
        </div>
      </details>
      <Dialog.Portal>
        <Dialog.Overlay className="wa-dialog-overlay" />
        <Dialog.Content
          className="wa-drawer"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            trigger.current?.focus();
          }}
        >
          <div className="wa-drawer-heading">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close
              className="wa-icon-button"
              aria-label="Close project details"
            >
              <X size={22} aria-hidden="true" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="wa-drawer-description">
            {description}
          </Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ProjectDirectory({ projects }: { projects: Project[] }) {
  return (
    <div className="wa-directory">
      {(["residential", "commercial"] as const).map((division) => {
        const selected = projects.filter(
          (project) => project.division === division,
        );
        return (
          <section key={division}>
            <h3>
              {division} <span>{selected.length}</span>
            </h3>
            {selected.length ? (
              selected.map((project) => (
                <Link href={`/projects/${project.slug}`} key={project.id}>
                  <span>
                    <strong>{project.title}</strong>
                    <small>{project.location}</small>
                    <small>{project.subtitle || project.category}</small>
                  </span>
                  <ArrowUpRight size={20} aria-hidden="true" />
                </Link>
              ))
            ) : (
              <p className="wa-directory-empty">
                More work will be added here.
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function ProjectAtlas({ projects }: { projects: Project[] }) {
  const params = useSearchParams();
  const ready = useReady();
  const { setScene } = useWorldScene();
  const division = divisionFrom(params.get("type"));
  const selectedSlug = params.get("project");
  const shown = useMemo(
    () =>
      projects.filter(
        (project) => division === "all" || project.division === division,
      ),
    [projects, division],
  );
  const selected =
    shown.find((project) => project.slug === selectedSlug) || shown[0];
  const selectedIndex = selected
    ? shown.findIndex((project) => project.id === selected.id)
    : -1;
  const strip = useRef<HTMLDivElement>(null);
  const scene = useMemo(
    () => ({
      id: selected ? `atlas-${selected.slug}` : "atlas-empty",
      image: selected?.images[0]?.src || "",
      alt: selected?.images[0]?.alt || "",
      position: "50% 42%",
      zoom: 1,
    }),
    [selected],
  );
  useEffect(() => {
    setScene(scene);
  }, [scene, setScene]);
  useEffect(() => {
    const item = strip.current?.querySelector<HTMLElement>(
      '[aria-pressed="true"]',
    );
    if (!item || !strip.current) return;
    const frame = strip.current.getBoundingClientRect();
    const bounds = item.getBoundingClientRect();
    if (bounds.left < frame.left || bounds.right > frame.right) {
      strip.current.scrollTo({
        left: strip.current.scrollLeft + bounds.left - frame.left - 8,
        behavior: "instant",
      });
    }
  }, [selected?.id, division]);

  function select(project: Project) {
    const href = atlasHref(division, project.slug);
    if (`${window.location.pathname}${window.location.search}` !== href)
      window.history.pushState(null, "", href);
  }
  function changeDivision(
    event: MouseEvent<HTMLAnchorElement>,
    value: ProjectDivision,
  ) {
    if (!unmodifiedClick(event)) return;
    event.preventDefault();
    const match =
      selected && (value === "all" || selected.division === value)
        ? selected
        : projects.find(
            (project) => value === "all" || project.division === value,
          );
    window.history.pushState(null, "", atlasHref(value, match?.slug));
  }
  function move(amount: number) {
    if (shown.length)
      select(shown[(selectedIndex + amount + shown.length) % shown.length]);
  }

  return (
    <section className="wa-page wa-atlas" aria-label="Project atlas">
      <div className="wa-photo-shade" aria-hidden="true" />
      <header className="wa-topbar">
        <div className="wa-page-title">
          <span>The portfolio</span>
          <h1>Explore our projects.</h1>
        </div>
        <nav
          className="wa-division-filter"
          aria-label="Filter projects by division"
        >
          {(["all", "residential", "commercial"] as const).map((value) => (
            <a
              href={atlasHref(value)}
              key={value}
              aria-current={division === value ? "true" : undefined}
              onClick={(event) => changeDivision(event, value)}
            >
              {value === "all" ? "All projects" : value}
              <span>
                {
                  projects.filter(
                    (project) => value === "all" || project.division === value,
                  ).length
                }
              </span>
            </a>
          ))}
        </nav>
        <AtlasDrawer
          label="Project index"
          title="Every project, at a glance."
          description="Browse documented commercial and residential work, with the scope and real photography for each project."
        >
          <ProjectDirectory projects={projects} />
        </AtlasDrawer>
      </header>

      <div className="wa-stage">
        {selected ? (
          <div
            className="wa-project-info"
            aria-live="polite"
            aria-atomic="true"
          >
            <p className="wa-kicker">
              {selected.division} <span>{selected.location}</span>
            </p>
            <h2>{selected.title}</h2>
            <p className="wa-project-subtitle">
              {selected.subtitle || selected.category}
            </p>
            <Link
              className="wa-project-link"
              href={`/projects/${selected.slug}`}
              aria-label={`View project: ${selected.title}`}
            >
              View project <ArrowUpRight size={20} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="wa-project-info wa-empty">
            <p className="wa-kicker">
              {division === "all" ? "Our work" : division}
            </p>
            <h2>Our next selection is taking shape.</h2>
            <p className="wa-project-subtitle">
              We’re preparing more work to share. Tell us what you have in mind
              in the meantime.
            </p>
            <Link
              href={
                division === "all" ? "/contact" : `/contact?type=${division}`
              }
              className="wa-project-link"
            >
              Discuss your project <ArrowUpRight size={20} aria-hidden="true" />
            </Link>
          </div>
        )}
        {selected && <p className="wa-photo-note">Real project photography</p>}
      </div>

      <footer className="wa-filmstrip">
        <div className="wa-strip-heading">
          <p aria-live="polite">
            {shown.length
              ? `${String(selectedIndex + 1).padStart(2, "0")} / ${String(shown.length).padStart(2, "0")}`
              : "No projects in this selection"}
            <span>
              {division === "all" ? "All projects" : `${division} projects`}
            </span>
          </p>
          <div className="wa-step-buttons">
            <button
              className="wa-icon-button"
              type="button"
              onClick={() => move(-1)}
              disabled={!ready || shown.length < 2}
              aria-label="Previous project"
            >
              <ArrowLeft size={19} aria-hidden="true" />
            </button>
            <button
              className="wa-icon-button"
              type="button"
              onClick={() => move(1)}
              disabled={!ready || shown.length < 2}
              aria-label="Next project"
            >
              <ArrowRight size={19} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="wa-strip" ref={strip} aria-label="Select a project">
          {projects.map((project) => (
            <article
              className="wa-project-thumb"
              key={project.id}
              hidden={division !== "all" && project.division !== division}
            >
              <button
                type="button"
                className="wa-thumbnail"
                onClick={() => select(project)}
                aria-pressed={selected?.id === project.id}
                disabled={!ready}
                aria-label={`Preview ${project.title}`}
              >
                {project.images[0] && (
                  <Image
                    src={project.images[0].src}
                    alt={project.images[0].alt}
                    fill
                    sizes="150px"
                  />
                )}
              </button>
              <Link
                href={`/projects/${project.slug}`}
                aria-label={`View project: ${project.title}`}
              >
                {project.title}
                <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </footer>
    </section>
  );
}

function FullPhoto({
  images,
  index,
  onSelect,
  title,
}: {
  images: ProjectImage[];
  index: number;
  onSelect: (index: number) => void;
  title: string;
}) {
  const photo = images[index];
  if (!photo) return null;
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="wa-full-photo-trigger" type="button">
          <ArrowsOut size={18} aria-hidden="true" /> View full photograph
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="wa-dialog-overlay wa-photo-overlay" />
        <Dialog.Content
          className="wa-full-photo"
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              onSelect((index - 1 + images.length) % images.length);
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              onSelect((index + 1) % images.length);
            }
          }}
        >
          <Dialog.Title className="sr-only">{title} photographs</Dialog.Title>
          <Dialog.Description className="sr-only">
            Use the previous and next buttons or arrow keys. Escape closes the
            photograph.
          </Dialog.Description>
          <Dialog.Close
            className="wa-icon-button wa-photo-close"
            aria-label="Close photograph"
          >
            <X size={24} aria-hidden="true" />
          </Dialog.Close>
          <div className="wa-full-image">
            <Image src={photo.src} alt={photo.alt} fill sizes="95vw" />
          </div>
          <div className="wa-full-photo-caption">
            <button
              type="button"
              className="wa-icon-button"
              aria-label="Previous photograph"
              disabled={images.length < 2}
              onClick={() =>
                onSelect((index - 1 + images.length) % images.length)
              }
            >
              <ArrowLeft size={21} aria-hidden="true" />
            </button>
            <div aria-live="polite">
              <span>
                {index + 1} / {images.length}
              </span>
              <p>{photo.alt}</p>
            </div>
            <button
              type="button"
              className="wa-icon-button"
              aria-label="Next photograph"
              disabled={images.length < 2}
              onClick={() => onSelect((index + 1) % images.length)}
            >
              <ArrowRight size={21} aria-hidden="true" />
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ProjectPhotoStory({
  project,
  related,
  children,
}: {
  project: Project;
  related: Project[];
  children: ReactNode;
}) {
  const params = useSearchParams();
  const { setScene } = useWorldScene();
  const ready = useReady();
  const requested = Number(params.get("photo"));
  const index =
    Number.isInteger(requested) &&
    requested >= 1 &&
    requested <= project.images.length
      ? requested - 1
      : 0;
  const photo = project.images[index];
  const strip = useRef<HTMLDivElement>(null);
  const scene = useMemo(
    () => ({
      id: `case-${project.slug}-${index}`,
      image: photo?.src || "",
      alt: photo?.alt || "",
      position: "50% 42%",
      zoom: 1,
    }),
    [project.slug, index, photo],
  );
  useEffect(() => {
    setScene(scene);
  }, [scene, setScene]);
  useEffect(() => {
    const item = strip.current?.querySelector<HTMLElement>(
      '[aria-current="true"]',
    );
    if (!item || !strip.current) return;
    const frame = strip.current.getBoundingClientRect();
    const bounds = item.getBoundingClientRect();
    if (bounds.left < frame.left || bounds.right > frame.right)
      strip.current.scrollTo({
        left: strip.current.scrollLeft + bounds.left - frame.left - 8,
        behavior: "instant",
      });
  }, [index]);
  function select(next: number) {
    if (next < 0 || next >= project.images.length) return;
    const url = new URL(window.location.href);
    if (next === 0) url.searchParams.delete("photo");
    else url.searchParams.set("photo", String(next + 1));
    window.history.pushState(null, "", `${url.pathname}${url.search}`);
  }
  return (
    <article className="wa-page wa-case">
      <div className="wa-photo-shade" aria-hidden="true" />
      <header className="wa-topbar">
        <nav className="wa-breadcrumb" aria-label="Breadcrumb">
          <Link href="/projects">
            <ArrowLeft size={16} aria-hidden="true" /> Projects
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={`/${project.division}`}>{project.division}</Link>
        </nav>
        <AtlasDrawer
          label="Overview & scope"
          title={project.title}
          description={project.subtitle || project.category}
        >
          {children}
          {related.length > 0 && (
            <section className="wa-related">
              <h3>More {project.division} work</h3>
              {related.map((item) => (
                <Link key={item.id} href={`/projects/${item.slug}`}>
                  <span>
                    {item.title}
                    <small>{item.location}</small>
                  </span>
                  <ArrowUpRight size={19} aria-hidden="true" />
                </Link>
              ))}
            </section>
          )}
          <Link
            className="wa-drawer-contact"
            href={`/contact?type=${project.division}`}
          >
            Plan a similar project <ArrowUpRight size={20} aria-hidden="true" />
          </Link>
        </AtlasDrawer>
      </header>
      <div className="wa-stage">
        <div className="wa-project-info">
          <p className="wa-kicker">{project.location}</p>
          <h1>{project.title}</h1>
          <p className="wa-project-subtitle">
            {project.subtitle || project.category}
          </p>
          <Link
            className="wa-project-link"
            href={`/contact?type=${project.division}`}
          >
            Plan a similar project <ArrowUpRight size={19} aria-hidden="true" />
          </Link>
        </div>
        {photo && (
          <div className="wa-photo-inspect">
            <p className="wa-photo-note">Real project photograph</p>
            {ready ? (
              <FullPhoto
                images={project.images}
                index={index}
                onSelect={select}
                title={project.title}
              />
            ) : (
              <a className="wa-full-photo-trigger" href={photo.src}>
                <ArrowsOut size={18} aria-hidden="true" /> View full photograph
              </a>
            )}
          </div>
        )}
      </div>
      <footer className="wa-filmstrip wa-case-filmstrip">
        <div className="wa-strip-heading">
          <p aria-live="polite">
            {project.images.length
              ? `${String(index + 1).padStart(2, "0")} / ${String(project.images.length).padStart(2, "0")}`
              : "Project photography is being prepared"}
            <span>{photo?.alt}</span>
          </p>
          <div className="wa-step-buttons">
            <button
              type="button"
              className="wa-icon-button"
              aria-label="Previous photograph"
              disabled={!ready || project.images.length < 2}
              onClick={() =>
                select(
                  (index - 1 + project.images.length) % project.images.length,
                )
              }
            >
              <ArrowLeft size={19} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="wa-icon-button"
              aria-label="Next photograph"
              disabled={!ready || project.images.length < 2}
              onClick={() => select((index + 1) % project.images.length)}
            >
              <ArrowRight size={19} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div
          className="wa-strip wa-photo-strip"
          ref={strip}
          aria-label="Project photographs"
        >
          {project.images.map((image, number) => (
            <a
              key={`${image.src}-${number}`}
              href={image.src}
              className="wa-photo-thumbnail"
              aria-label={`View photograph ${number + 1}: ${image.alt}`}
              aria-current={number === index ? "true" : undefined}
              onClick={(event) => {
                if (unmodifiedClick(event)) {
                  event.preventDefault();
                  select(number);
                }
              }}
            >
              <Image src={image.src} alt={image.alt} fill sizes="130px" />
              <span>{String(number + 1).padStart(2, "0")}</span>
            </a>
          ))}
        </div>
      </footer>
    </article>
  );
}
