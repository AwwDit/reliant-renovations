import Link from "next/link";
import Image from "@/components/site-image";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import type { Project } from "@/lib/types";
import "./project-collection.css";

export function ProjectCard({
  project,
  priority = false,
}: {
  project: Project;
  priority?: boolean;
}) {
  const href = `/projects/${project.slug}`;
  const photo = project.images[0];
  return (
    <article className={`pc-card pc-card-${project.division}`}>
      <Link
        href={href}
        className="pc-photo"
        aria-label={`View ${project.title}: ${project.images.length} ${project.images.length === 1 ? "photograph" : "photographs"} and project scope`}
      >
        {photo && (
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(max-width: 760px) 100vw, (max-width: 1100px) 54vw, 760px"
            preload={priority}
          />
        )}
      </Link>
      <div className="pc-body">
        <div className="pc-meta">
          <span className="pc-badge">{project.division}</span>
          <span className="pc-location">{project.location}</span>
        </div>
        <h3 className="pc-title">
          <Link href={href}>{project.title}</Link>
        </h3>
        <p className="pc-scope">{project.subtitle || project.category}</p>
        <p className="pc-summary">{project.description}</p>
        <div className="pc-footer">
          <Link
            href={href}
            className="pc-view-link"
            aria-label={`View project: ${project.title}`}
          >
            View project <ArrowUpRight size={22} aria-hidden="true" />
          </Link>
          <span className="pc-photo-count">
            {project.images.length}{" "}
            {project.images.length === 1 ? "photograph" : "photographs"}
          </span>
        </div>
      </div>
    </article>
  );
}
