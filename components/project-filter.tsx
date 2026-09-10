"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { List, SquaresFour } from "@phosphor-icons/react";
import { ProjectCard } from "./project-card";
import type { Division, Project } from "@/lib/types";

type ProjectView = "list" | "grid";

export function ProjectFilter({
  projects,
  initial = "all",
  featured = false,
  initialView = "list",
}: {
  projects: Project[];
  initial?: Division | "all";
  featured?: boolean;
  initialView?: ProjectView;
}) {
  const [filter, setFilter] = useState<Division | "all">(initial);
  const [view, setView] = useState<ProjectView>(initialView);
  const resultsId = useId();
  const selected = projects.filter(
    (project) => filter === "all" || project.division === filter,
  );
  const shown = featured ? selected.slice(0, 4) : selected;
  const filters = [
    { value: "all", label: "All projects" },
    { value: "commercial", label: "Commercial" },
    { value: "residential", label: "Residential" },
  ] as const;

  return (
    <div className="collection-shell">
      <div className="collection-controls">
        <div
          className="collection-filter-tabs"
          role="group"
          aria-label="Filter projects by division"
        >
          {filters.map(({ value, label }) => {
            const count = projects.filter(
              (project) => value === "all" || project.division === value,
            ).length;
            return (
              <button
                type="button"
                key={value}
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                aria-controls={resultsId}
              >
                {label}
                <span className="collection-filter-count">{count}</span>
              </button>
            );
          })}
        </div>
        <div
          className="collection-layout-switch"
          role="group"
          aria-label="Project display"
        >
          <button
            type="button"
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
            aria-controls={resultsId}
          >
            <List size={18} aria-hidden="true" /> List
          </button>
          <button
            type="button"
            onClick={() => setView("grid")}
            aria-pressed={view === "grid"}
            aria-controls={resultsId}
          >
            <SquaresFour size={18} aria-hidden="true" /> Grid
          </button>
        </div>
      </div>
      <div className="collection-result-heading">
        <h2 className="collection-result-count" aria-live="polite">
          {shown.length} {filter === "all" ? "" : `${filter} `}
          {shown.length === 1 ? "project" : "projects"}
        </h2>
        <p>Explore each project’s scope and photography.</p>
      </div>
      <div id={resultsId} className={`collection-results collection-${view}`}>
        {shown.map((project, index) => (
          <ProjectCard
            key={project.id}
            project={project}
            priority={!featured && index < 2}
          />
        ))}
      </div>
      {shown.length === 0 && (
        <div className="collection-empty">
          <h3>Our next selection is taking shape.</h3>
          <p>
            We’re preparing more {filter === "all" ? "" : `${filter} `}work to
            share. Tell us what you have in mind in the meantime.
          </p>
          <Link href="/contact" className="pc-view-link">
            Discuss your project
          </Link>
        </div>
      )}
    </div>
  );
}
