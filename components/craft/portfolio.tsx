"use client";

import Image from "@/components/site-image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { ArrowUpRight } from "@phosphor-icons/react";
import { websiteCopy } from "@/lib/website-copy";
import { isProjectMediaSource } from "@/lib/project-media";
import type { Division, Project } from "@/lib/types";
import "./portfolio.css";

type Filter = Division | "all";

// Use wider completed-work photographs from the owner's current project collection.
// If a selected image is removed, the owner's first available image takes its place.
const collectionCovers: Record<string, string> = {
  "harbor-freight-bronx": "04.webp",
  "lidl-harlem": "02.webp",
  "upper-west-side-apartment": "06.webp",
};
const coverPositions: Record<string, string> = {
  "lidl-staten-island": "50% 60%",
  "raising-canes-forest-hills": "50% 25%",
  "plainview-kitchen": "50% 30%",
};
function collectionPhoto(project: Project) {
  const image =
    project.images.find(({ src }) =>
      isProjectMediaSource(
        src,
        `/images/projects/${project.slug}/${collectionCovers[project.slug]}`,
      ),
    ) || project.images[0];
  return {
    image,
    position: isProjectMediaSource(
      image?.src,
      `/images/projects/${project.slug}/01.webp`,
    )
      ? coverPositions[project.slug] || "50% 50%"
      : "50% 50%",
  };
}

export function Portfolio({ projects }: { projects: Project[] }) {
  const params = useSearchParams();
  const requested = params.get("type");
  const division: Filter =
    requested === "commercial" || requested === "residential"
      ? requested
      : "all";
  const selected = params.get("project");
  const grid = useRef<HTMLDivElement>(null);
  const shown = projects.filter(
    (project) => division === "all" || project.division === division,
  );

  useEffect(() => {
    if (!selected) return;
    grid.current
      ?.querySelector<HTMLElement>('[data-selected="true"]')
      ?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [selected, division]);

  return (
    <div className="rf-portfolio rf-container">
      <header className="rf-portfolio-heading">
        <h1>Projects</h1>
        <div className="rf-portfolio-intro">
          <p>{websiteCopy.homeDescription}</p>
        </div>
      </header>

      <section id="collection" aria-label="Project collection">
        <div className="rf-portfolio-toolbar">
          <nav
            className="rf-portfolio-filters"
            aria-label="Filter projects by division"
          >
            {(["all", "commercial", "residential"] as const).map((value) => (
              <Link
                key={value}
                href={value === "all" ? "/projects" : `/projects?type=${value}`}
                scroll={false}
                aria-current={division === value ? "true" : undefined}
              >
                {value === "all" ? "All projects" : value}
                <span>
                  {
                    projects.filter(
                      (project) =>
                        value === "all" || project.division === value,
                    ).length
                  }
                </span>
              </Link>
            ))}
          </nav>
          <p className="rf-portfolio-count" aria-live="polite">
            {String(shown.length).padStart(2, "0")}{" "}
            {shown.length === 1 ? "project" : "projects"}
          </p>
        </div>

        <div className="rf-portfolio-grid" ref={grid}>
          {shown.map((project, index) => {
            const cover = collectionPhoto(project);
            return (
              <article
                className="rf-portfolio-item"
                key={project.id}
                id={`project-${project.slug}`}
                data-selected={selected === project.slug ? "true" : undefined}
                data-rf-reveal
              >
                <Link
                  href={`/projects/${project.slug}`}
                  className="rf-portfolio-project"
                >
                  <div className="rf-portfolio-media">
                    <div className="rf-portfolio-photo">
                      {cover.image ? (
                        <Image
                          src={cover.image.src}
                          alt={cover.image.alt}
                          style={{ objectPosition: cover.position }}
                          fill
                          sizes="(max-width: 700px) calc(100vw - 48px), (max-width: 1000px) 46vw, (max-width: 1680px) calc(50vw - 180px), 680px"
                          loading={index < 2 ? "eager" : "lazy"}
                          fetchPriority={index === 0 ? "high" : "auto"}
                        />
                      ) : (
                        <span className="rf-portfolio-pending">
                          Photography coming soon
                        </span>
                      )}
                      <span className="rf-portfolio-open" aria-hidden="true">
                        <ArrowUpRight size={25} />
                      </span>
                    </div>
                  </div>
                  <div className="rf-portfolio-caption">
                    <div className="rf-portfolio-photo-note">
                      <span>{project.location}</span>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <h2>{project.title}</h2>
                    <p>{project.subtitle || project.category}</p>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
        {shown.length === 0 && (
          <div className="rf-portfolio-empty">
            <h2>Projects will be added soon.</h2>
            <p>Discuss Your Project</p>
            <Link
              className="rf-button"
              href={
                division === "all" ? "/contact" : `/contact?type=${division}`
              }
            >
              Discuss Your Project{" "}
              <span>
                <ArrowUpRight size={20} aria-hidden="true" />
              </span>
            </Link>
          </div>
        )}
      </section>
      <div className="rf-portfolio-end">
        <p>Discuss Your Project</p>
        <Link
          className="rf-button"
          href={division === "all" ? "/contact" : `/contact?type=${division}`}
        >
          Discuss Your Project{" "}
          <span>
            <ArrowUpRight size={20} aria-hidden="true" />
          </span>
        </Link>
      </div>
    </div>
  );
}
