"use client";

import Image from "@/components/site-image";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Plus } from "@phosphor-icons/react";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { useGSAP } from "@gsap/react";
import { websiteCopy } from "@/lib/website-copy";
import type { Division, Project } from "@/lib/types";
import "./portfolio.css";

gsap.registerPlugin(Flip, useGSAP);

const nameOf = (project: Project) => project.title;
const previewPhoto = (project: Project) =>
  project.slug === "upper-west-side-apartment"
    ? project.images[5] || project.images[0]
    : project.slug === "harbor-freight-bronx"
      ? project.images[3] || project.images[0]
      : project.images[0];

export function UnfoldPortfolio({
  projects,
  division,
  embedded = false,
}: {
  projects: Project[];
  division?: Division;
  embedded?: boolean;
}) {
  const root = useRef<HTMLElement>(null);
  const snapshot = useRef<ReturnType<typeof Flip.getState> | null>(null);
  const [active, setActive] = useState(0);
  const current = projects[active] || projects[0];

  useGSAP(
    () => {
      const portfolio = root.current;
      const stage = portfolio?.querySelector<HTMLElement>(".uf-stage");
      // The home collection is below the hero; reserve this reveal for division pages.
      if (!division || !portfolio || !stage) return;
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const panels = stage.querySelectorAll<HTMLElement>(".uf-panel");
        const index = portfolio.querySelector<HTMLElement>(".uf-index");
        const mobile = matchMedia("(max-width: 1000px)").matches;
        portfolio.dataset.ufTransition = "entering";
        portfolio.setAttribute("aria-busy", "true");
        stage.inert = true;
        if (index) index.inert = true;
        const finish = () => {
          if (portfolio.dataset.ufTransition !== "entering") return;
          portfolio.removeAttribute("data-uf-transition");
          portfolio.removeAttribute("aria-busy");
          stage.inert = false;
          if (index) index.inert = false;
        };
        gsap.fromTo(
          panels,
          {
            yPercent: mobile ? -12 : -22,
            clipPath: "inset(0% 0% 100% 0%)",
          },
          {
            yPercent: 0,
            clipPath: "inset(0% 0% 0% 0%)",
            duration: mobile ? 0.5 : 0.64,
            stagger: { amount: mobile ? 0.16 : 0.2 },
            ease: "power3.out",
            clearProps: "transform,clipPath",
            onComplete: finish,
          },
        );
        return finish;
      });
      return () => media.revert();
    },
    { scope: root, dependencies: [division], revertOnUpdate: true },
  );

  useGSAP(
    () => {
      if (!snapshot.current || !root.current) return;
      const state = snapshot.current;
      snapshot.current = null;
      if (
        matchMedia("(prefers-reduced-motion: reduce)").matches ||
        innerWidth <= 1000
      )
        return;
      Flip.from(state, {
        duration: 0.85,
        ease: "power3.inOut",
        absolute: true,
        nested: true,
      });
    },
    { scope: root, dependencies: [active] },
  );

  const select = (index: number) => {
    if (root.current?.dataset.ufTransition) return;
    const next = Math.max(0, Math.min(projects.length - 1, index));
    if (next === active) return;
    if (
      root.current &&
      innerWidth > 1000 &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      snapshot.current = Flip.getState(
        root.current.querySelectorAll(".uf-panel"),
      );
    }
    setActive(next);
  };

  const title = division
    ? websiteCopy.divisions[division].title
    : websiteCopy.headline;
  const ProjectHeading = embedded ? "h3" : "h2";
  if (!current)
    return (
      <section
        className={`uf-empty${embedded ? " uf-embedded" : ""}`}
        id={embedded ? "projects" : undefined}
      >
        <h2>{embedded ? "Projects" : title}</h2>
        <p>No projects are currently available.</p>
        <Link
          className="rf-button"
          href={`/contact${division ? `?type=${division}` : ""}`}
        >
          {websiteCopy.primaryAction}
          <span>
            <ArrowUpRight size={21} aria-hidden="true" />
          </span>
        </Link>
      </section>
    );

  return (
    <section
      ref={root}
      className={`unfold-portfolio${embedded ? " uf-embedded" : ""}`}
      id={embedded ? "projects" : undefined}
      aria-label="Explore Reliant projects"
    >
      {embedded && <h2 className="uf-section-title">Projects</h2>}
      <div className="uf-mobile-heading">
        <p>{division ? `${division} projects` : "Selected projects"}</p>
        <span>
          {String(active + 1).padStart(2, "0")} /{" "}
          {String(projects.length).padStart(2, "0")}
        </span>
      </div>
      <div className="uf-stage">
        {projects.map((project, i) => {
          const photo = previewPhoto(project);
          const expanded = active === i;
          return (
            <article
              className={`uf-panel ${expanded ? "uf-active" : ""}`}
              key={project.id}
              data-flip-id={project.id}
              style={{ flexGrow: expanded ? 6.2 : 1 }}
            >
              <div className="uf-photo">
                {photo && (
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(max-width: 1000px) 100vw, 60vw"
                    loading={!embedded && i < 2 ? "eager" : "lazy"}
                    fetchPriority={!embedded && i === 0 ? "high" : "auto"}
                  />
                )}
              </div>
              <button
                type="button"
                className="uf-panel-select"
                onClick={() => select(i)}
                aria-expanded={expanded}
                aria-controls={`uf-preview-${project.slug}`}
                aria-label={`Show ${nameOf(project)} project preview`}
                tabIndex={expanded ? -1 : 0}
              >
                <span className="uf-band-number" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="uf-collapsed">
                  <span className="uf-category">{project.division}</span>
                  <strong>{nameOf(project)}</strong>
                  <span className="uf-panel-location">{project.location}</span>
                  <span className="uf-collapsed-line" />
                </span>
                {!expanded && (
                  <span className="uf-band-toggle" aria-hidden="true">
                    <Plus size={20} />
                  </span>
                )}
              </button>
              <div
                className="uf-preview"
                id={`uf-preview-${project.slug}`}
                aria-hidden={!expanded}
                inert={!expanded}
              >
                <div className="uf-project-heading">
                  <p className="uf-category">
                    {project.division}
                    <span />
                  </p>
                  <ProjectHeading>{nameOf(project)}</ProjectHeading>
                  {project.subtitle && (
                    <p className="uf-project-subtitle">{project.subtitle}</p>
                  )}
                  <p className="uf-project-location">{project.location}</p>
                </div>
                <div className="uf-project-scope">
                  <p>Project scope</p>
                  <ul>
                    {project.scope.slice(0, 3).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <Link
                    href={`/projects/${project.slug}`}
                    className="uf-explore"
                    tabIndex={expanded ? 0 : -1}
                  >
                    View Project <ArrowRight size={28} aria-hidden="true" />
                  </Link>
                </div>
              </div>
              <Link
                className="uf-nojs-project"
                href={`/projects/${project.slug}`}
              >
                <span>
                  {nameOf(project)}
                  <small>View Project</small>
                </span>
                <ArrowUpRight size={20} aria-hidden="true" />
              </Link>
            </article>
          );
        })}
      </div>
      <Link
        className="uf-mobile-all-projects"
        href={`/projects${division ? `?type=${division}` : ""}`}
      >
        {websiteCopy.secondaryAction}
        <ArrowRight size={22} aria-hidden="true" />
      </Link>
      <div className="uf-index">
        <div className="uf-position">
          <span aria-live="polite">
            <strong>{String(active + 1).padStart(2, "0")}</strong> /{" "}
            {String(projects.length).padStart(2, "0")}
          </span>
          <div aria-hidden="true">
            {projects.map((project, i) => (
              <i
                key={project.id}
                className={i === active ? "uf-current" : ""}
              />
            ))}
          </div>
        </div>
        <div className="uf-project-index" aria-label="Choose a project">
          {projects.map((project, i) => (
            <button
              key={project.id}
              type="button"
              onClick={() => select(i)}
              aria-pressed={active === i}
            >
              {nameOf(project)}
            </button>
          ))}
        </div>
        <Link
          className="uf-all-projects"
          href={`/projects${division ? `?type=${division}` : ""}`}
        >
          <span>{websiteCopy.secondaryAction}</span>
          <ArrowRight size={24} aria-hidden="true" />
        </Link>
      </div>
      <noscript>
        <style>{`.unfold-portfolio{height:auto!important}.uf-stage{display:block!important;height:auto!important}.uf-panel{width:100%!important;height:650px!important;position:relative!important;opacity:1!important;visibility:visible!important}.uf-photo{width:100%!important}.uf-preview,.uf-panel-select,.uf-index,.uf-mobile-heading{display:none!important}.uf-nojs-project{display:flex!important}@media(max-width:1000px){.uf-panel{height:400px!important;min-height:400px!important}}`}</style>
      </noscript>
    </section>
  );
}
