"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ArrowsOut, Moon, Sun } from "@phosphor-icons/react";
import { useRef, useState, type PointerEvent, type CSSProperties } from "react";
import type { Division } from "@/lib/types";
import type { ConceptProject } from "@/lib/concept-projects";
import { ConceptProjectDialog } from "./project-dialog";
import "./concept-gallery.css";

const divisionNames: Record<Division, string> = {
  residential: "Residential",
  commercial: "Commercial",
};

function PhotoComposition({
  project,
  onPhoto,
  preload,
}: {
  project: ConceptProject;
  onPhoto: (index: number) => void;
  preload: boolean;
}) {
  const composition = useRef<HTMLDivElement>(null);
  const p = project.presentation;
  const frames = [
    {
      role: "secondary",
      index: p.secondary,
      position: p.secondaryPosition,
      label: p.secondaryLabel,
    },
    {
      role: "overview",
      index: p.overview,
      position: p.overviewPosition,
      label: "The project",
    },
    {
      role: "detail",
      index: p.detail,
      position: p.detailPosition,
      label: p.detailLabel,
    },
  ] as const;

  function move(event: PointerEvent<HTMLDivElement>) {
    if (
      event.pointerType !== "mouse" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const rect = event.currentTarget.getBoundingClientRect();
    // Small independent translations reveal the relationship between photo planes.
    // Continuous pointer values stay out of React state.
    composition.current?.style.setProperty(
      "--cg-x",
      `${((event.clientX - rect.left) / rect.width - 0.5) * 2}`,
    );
    composition.current?.style.setProperty(
      "--cg-y",
      `${((event.clientY - rect.top) / rect.height - 0.5) * 2}`,
    );
  }

  function reset() {
    composition.current?.style.setProperty("--cg-x", "0");
    composition.current?.style.setProperty("--cg-y", "0");
  }

  return (
    <div
      className="cg-composition"
      onPointerMove={move}
      onPointerLeave={reset}
      ref={composition}
    >
      <div className="cg-recess" aria-hidden="true" />
      {frames.map(({ role, index, position, label }) => {
        const photo = project.images[index];
        if (!photo) return null;
        return (
          <figure
            className={`cg-frame cg-frame-${role}`}
            key={`${role}-${photo.src}`}
          >
            <button
              className="cg-photo"
              onClick={() => onPhoto(index)}
              aria-label={`Enlarge ${photo.alt}`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes={
                  role === "overview"
                    ? "(max-width: 767px) 70vw, (max-width: 1100px) 46vw, 40vw"
                    : "(max-width: 767px) 38vw, 24vw"
                }
                preload={preload && role === "overview"}
                style={{ objectPosition: position }}
              />
              <span className="cg-photo-expand" aria-hidden="true">
                <ArrowsOut size={18} />
              </span>
            </button>
            <figcaption>
              <span>{role === "overview" ? project.location : label}</span>
              {role === "overview" && (
                <span>
                  {project.images.length} photos{" "}
                  <ArrowUpRight size={14} aria-hidden="true" />
                </span>
              )}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}

export function ConceptGallery({ projects }: { projects: ConceptProject[] }) {
  const first =
    projects.find((p) => p.division === "residential") ?? projects[0];
  const [division, setDivision] = useState<Division>(
    first?.division ?? "residential",
  );
  const [selectedSlug, setSelectedSlug] = useState(first?.slug ?? "");
  const [detail, setDetail] = useState<{
    project: ConceptProject;
    index: number;
  } | null>(null);
  const selectedByDivision = useRef<Partial<Record<Division, string>>>({
    residential: first?.division === "residential" ? first.slug : undefined,
  });
  const showcase = useRef<HTMLElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const filtered = projects.filter((p) => p.division === division);
  const selected = filtered.find((p) => p.slug === selectedSlug) ?? filtered[0];
  const otherDivision: Division =
    division === "residential" ? "commercial" : "residential";
  const otherLead = projects.find((p) => p.division === otherDivision);

  function chooseDivision(next: Division, scroll = false) {
    setDivision(next);
    setSelectedSlug(
      selectedByDivision.current[next] ??
        projects.find((p) => p.division === next)?.slug ??
        "",
    );
    if (scroll)
      showcase.current?.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
  }

  function chooseProject(project: ConceptProject) {
    selectedByDivision.current[project.division] = project.slug;
    setSelectedSlug(project.slug);
    showcase.current?.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

  function openProject(project: ConceptProject, index = 0) {
    opener.current = document.activeElement as HTMLElement | null;
    setDetail({ project, index });
  }

  function closeProject() {
    setDetail(null);
    requestAnimationFrame(() => opener.current?.focus({ preventScroll: true }));
  }

  function toggleTheme() {
    const next =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("reliant-theme", next);
    } catch {
      /* Theme remains usable without storage. */
    }
  }

  return (
    <div className="cg-root cg-surface">
      <a className="cg-skip" href="#concept-work">
        Skip to projects
      </a>
      <header className="cg-header">
        <Link
          href="/concept"
          className="cg-brand"
          aria-label="Reliant Renovations gallery preview"
        >
          <Image
            className="cg-logo-color"
            src="/images/brand/reliant-color-transparent.png"
            alt="Reliant Renovations Inc."
            width={112}
            height={79}
            preload
          />
          <Image
            className="cg-logo-white"
            src="/images/brand/reliant-white-transparent.png"
            alt="Reliant Renovations Inc."
            width={112}
            height={79}
          />
        </Link>
        <nav className="cg-nav" aria-label="Main navigation">
          <a href="#project-index">Our projects</a>
          <Link href="/about">About Reliant</Link>
        </nav>
        <div className="cg-header-actions">
          <button
            className="cg-theme"
            onClick={toggleTheme}
            aria-label="Toggle light and dark appearance"
          >
            <Moon className="cg-moon" size={20} aria-hidden="true" />
            <Sun className="cg-sun" size={20} aria-hidden="true" />
          </button>
          <Link href={`/contact?type=${division}`} className="cg-contact">
            Let’s talk <ArrowUpRight size={19} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <main id="concept-work">
        <div className="cg-topline">
          <p>Residential & commercial renovations</p>
          <span>New York City · Long Island · Westchester</span>
        </div>

        <section
          className="cg-showcase"
          ref={showcase}
          aria-labelledby="cg-heading"
        >
          <div className="cg-intro">
            <h1 id="cg-heading">
              Renovations <br />
              worth a<br />
              <span>closer look.</span>
            </h1>
            <p className="cg-lede">
              Homes, storefronts, and everything that makes them work. See what
              goes into a Reliant renovation.
            </p>
            <div
              className="cg-divisions"
              role="group"
              aria-label="Choose residential or commercial projects"
            >
              {(["residential", "commercial"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => chooseDivision(d)}
                  aria-pressed={division === d}
                  aria-controls="cg-selected-project"
                >
                  {divisionNames[d]}
                  <sup>
                    {projects
                      .filter((p) => p.division === d)
                      .length.toString()
                      .padStart(2, "0")}
                  </sup>
                </button>
              ))}
            </div>
            {selected ? (
              <div className="cg-project-intro" key={selected.slug}>
                <p className="cg-project-kicker">
                  {selected.subtitle || selected.category}
                </p>
                <h2>{selected.presentation.shortTitle}</h2>
                <button
                  className="cg-explore"
                  onClick={() =>
                    openProject(
                      selected,
                      Math.max(0, selected.presentation.overview),
                    )
                  }
                >
                  Explore project{" "}
                  <span>
                    <ArrowUpRight size={22} aria-hidden="true" />
                  </span>
                </button>
              </div>
            ) : (
              <p className="cg-empty">
                Projects in this collection are being updated.
              </p>
            )}
          </div>

          <div
            className="cg-selected"
            id="cg-selected-project"
            aria-label={`${divisionNames[division]} project presentation`}
          >
            {selected && (
              <PhotoComposition
                key={selected.slug}
                project={selected}
                preload={selected.slug === first?.slug}
                onPhoto={(index) => openProject(selected, index)}
              />
            )}
            <p className="sr-only" aria-live="polite">
              {selected
                ? `Showing ${selected.title}, ${selected.location}. ${selected.images.length} photos available.`
                : "No projects available."}
            </p>
          </div>
        </section>

        <section
          className="cg-index"
          id="project-index"
          aria-labelledby="cg-index-title"
        >
          <div className="cg-index-heading">
            <h2 id="cg-index-title">
              {divisionNames[division]} projects{" "}
              <span>({filtered.length.toString().padStart(2, "0")})</span>
            </h2>
            <a href={`/${division}`} className="cg-division-link">
              Our {division} services{" "}
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>
          <div
            className="cg-project-list"
            style={
              {
                "--cg-project-count": Math.min(filtered.length, 5),
              } as CSSProperties
            }
          >
            {filtered.map((project, i) => {
              const photo = project.images[project.presentation.overview];
              return (
                <button
                  className="cg-project-choice"
                  key={project.slug}
                  aria-pressed={selected?.slug === project.slug}
                  aria-controls="cg-selected-project"
                  onClick={() => chooseProject(project)}
                >
                  <span className="cg-choice-number">
                    {(i + 1).toString().padStart(2, "0")}
                  </span>
                  <span className="cg-choice-image">
                    {photo && (
                      <Image
                        src={photo.src}
                        alt=""
                        fill
                        sizes="80px"
                        style={{
                          objectPosition: project.presentation.overviewPosition,
                        }}
                      />
                    )}
                  </span>
                  <span className="cg-choice-copy">
                    <strong>{project.presentation.shortTitle}</strong>
                    <span>{project.location}</span>
                  </span>
                  <ArrowUpRight
                    className="cg-choice-arrow"
                    size={18}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
          <noscript>
            <p>Browse individual project pages:</p>
            <ul>
              {projects.map((project) => (
                <li key={project.slug}>
                  <a href={`/projects/${project.slug}`}>
                    {project.title} · {project.location}
                  </a>
                </li>
              ))}
            </ul>
          </noscript>
        </section>

        {otherLead && (
          <section className="cg-other" aria-labelledby="cg-other-title">
            <div className="cg-other-photos">
              {otherLead.images[otherLead.presentation.overview] && (
                <div className="cg-other-main">
                  <Image
                    src={otherLead.images[otherLead.presentation.overview].src}
                    alt={otherLead.images[otherLead.presentation.overview].alt}
                    fill
                    sizes="(max-width: 767px) 70vw, 34vw"
                    style={{
                      objectPosition: otherLead.presentation.overviewPosition,
                    }}
                  />
                </div>
              )}
              {otherLead.images[otherLead.presentation.detail] && (
                <div className="cg-other-detail">
                  <Image
                    src={otherLead.images[otherLead.presentation.detail].src}
                    alt={otherLead.images[otherLead.presentation.detail].alt}
                    fill
                    sizes="(max-width: 767px) 40vw, 22vw"
                    style={{
                      objectPosition: otherLead.presentation.detailPosition,
                    }}
                  />
                </div>
              )}
            </div>
            <div className="cg-other-copy">
              <p className="cg-small-label">
                Explore the other side of our work
              </p>
              <h2 id="cg-other-title">
                {otherDivision === "commercial" ? (
                  <>
                    Places for
                    <br />
                    doing business.
                  </>
                ) : (
                  <>
                    Spaces for
                    <br />
                    everyday living.
                  </>
                )}
              </h2>
              <p>
                {otherDivision === "commercial"
                  ? "Storefronts, retail spaces, restaurants. Renovations and construction that bring your next location together."
                  : "Apartments, kitchens, bathrooms, and homes. Thoughtful construction in the spaces you use every day."}
              </p>
              <button
                className="cg-explore"
                onClick={() => chooseDivision(otherDivision, true)}
              >
                Explore {otherDivision}{" "}
                <span>
                  <ArrowUpRight size={22} aria-hidden="true" />
                </span>
              </button>
            </div>
          </section>
        )}

        <section className="cg-inquiry" aria-labelledby="cg-inquiry-title">
          <div>
            <p className="cg-small-label">Have a renovation in mind?</p>
            <h2 id="cg-inquiry-title">Let’s get to work.</h2>
          </div>
          <Link href={`/contact?type=${division}`} className="cg-inquiry-link">
            Tell us about your project{" "}
            <ArrowUpRight size={27} aria-hidden="true" />
          </Link>
        </section>
      </main>
      <footer className="cg-footer">
        <p>Reliant Renovations Inc.</p>
        <nav aria-label="Footer navigation">
          <Link href="/projects">All project pages</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
        <span>Gallery design preview</span>
      </footer>
      {detail && (
        <ConceptProjectDialog
          key={`${detail.project.slug}-${detail.index}`}
          project={detail.project}
          initialIndex={detail.index}
          onClose={closeProject}
        />
      )}
    </div>
  );
}
