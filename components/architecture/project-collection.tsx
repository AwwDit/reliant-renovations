"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { ArrowUpRight } from "@phosphor-icons/react";
import type { Division, Project } from "@/lib/types";
import "./portfolio.css";

type ProjectDivision = Division | "all";

function collectionHref(division: ProjectDivision) {
  return division === "all" ? "/projects" : `/projects?type=${division}`;
}

export function ProjectCollection({ projects }: { projects: Project[] }) {
  const params = useSearchParams();
  const requested = params.get("type");
  const division: ProjectDivision =
    requested === "commercial" || requested === "residential"
      ? requested
      : "all";
  const selected = params.get("project");
  const collection = useRef<HTMLDivElement>(null);
  const shown = projects.filter(
    (project) => division === "all" || project.division === division,
  );

  useEffect(() => {
    if (!selected) return;
    const item = collection.current?.querySelector<HTMLElement>(
      '[data-selected="true"]',
    );
    item?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [selected, division]);

  return (
    <div className="ar-portfolio ar-container">
      <header className="ar-portfolio-heading">
        <p className="ar-kicker">Our work / New York</p>
        <div className="ar-portfolio-intro">
          <h1>
            Every project. <span>All the details.</span>
          </h1>
          <nav
            className="ar-portfolio-experiences"
            aria-label="Explore our services"
          >
            <Link href="/residential">
              Explore residential <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
            <Link href="/commercial">
              Explore commercial <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>
      <section id="project-collection" aria-label="Project collection">
        <div className="ar-collection-toolbar">
          <nav
            className="ar-collection-filters"
            aria-label="Filter projects by division"
          >
            {(["all", "residential", "commercial"] as const).map((value) => (
              <Link
                key={value}
                href={collectionHref(value)}
                scroll={false}
                aria-current={division === value ? "true" : undefined}
              >
                {value === "all" ? "All work" : value}
                <span>
                  {String(
                    projects.filter(
                      (project) =>
                        value === "all" || project.division === value,
                    ).length,
                  ).padStart(2, "0")}
                </span>
              </Link>
            ))}
          </nav>
          <p className="ar-collection-total" aria-live="polite">
            {shown.length} {shown.length === 1 ? "project" : "projects"}
          </p>
        </div>
        <div className="ar-collection-grid" ref={collection}>
          {shown.map((project, index) => (
            <article
              className="ar-collection-item"
              id={`project-${project.slug}`}
              data-selected={selected === project.slug ? "true" : undefined}
              key={project.id}
            >
              <Link
                className="ar-collection-project"
                href={`/projects/${project.slug}`}
              >
                <div className="ar-collection-photo">
                  {project.images[0] ? (
                    <Image
                      src={project.images[0].src}
                      alt={project.images[0].alt}
                      fill
                      sizes="(max-width: 600px) calc(100vw - 40px), (max-width: 1050px) calc((100vw - 96px) / 2), (max-width: 1700px) calc((100vw - 144px) / 3), 520px"
                      loading={index < 3 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                    />
                  ) : (
                    <span className="ar-photo-pending">
                      Photography coming soon
                    </span>
                  )}
                  <span className="ar-collection-open" aria-hidden="true">
                    <ArrowUpRight size={24} />
                  </span>
                </div>
                <div className="ar-collection-caption">
                  <p className="ar-collection-meta">
                    <span>{project.division}</span>
                    <span>{project.location}</span>
                  </p>
                  <h2>{project.title}</h2>
                  <p>{project.subtitle || project.category}</p>
                </div>
              </Link>
            </article>
          ))}
        </div>
        {shown.length === 0 && (
          <div className="ar-portfolio-empty">
            <p className="ar-kicker">More work to come</p>
            <h2>Our next selection is taking shape.</h2>
            <p>
              We’re preparing more {division === "all" ? "" : `${division} `}
              projects to share. Tell us what you have in mind in the meantime.
            </p>
            <Link
              href={
                division === "all" ? "/contact" : `/contact?type=${division}`
              }
              className="ar-button"
            >
              Start a project <ArrowUpRight size={20} aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>
      <div className="ar-portfolio-end">
        <p>What do you have in mind?</p>
        <Link
          href={division === "all" ? "/contact" : `/contact?type=${division}`}
          className="ar-text-link"
        >
          Discuss your project <ArrowUpRight size={20} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
