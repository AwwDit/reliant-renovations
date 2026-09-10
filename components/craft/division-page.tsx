import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { getProjects } from "@/lib/db";
import type { Division, Project } from "@/lib/types";
import "./divisions.css";

const projectServices: Record<string, { label: string; detail: number }> = {
  "upper-west-side-apartment": {
    label: "Full apartment renovations",
    detail: 3,
  },
  "plainview-kitchen": {
    label: "Kitchens & structural alterations",
    detail: 5,
  },
  "tribeca-apartment": { label: "Bathrooms & apartment finishes", detail: 6 },
  "hicksville-basement": { label: "Complete basement renovations", detail: 3 },
  "kings-park-exterior": { label: "Exterior renovations", detail: 8 },
  "chick-fil-a-kingston": {
    label: "Ground-up carpentry & buildouts",
    detail: 5,
  },
  "lidl-staten-island": { label: "Masonry & exterior restoration", detail: 4 },
  "raising-canes-forest-hills": {
    label: "Storefronts & exterior facades",
    detail: 4,
  },
  "harbor-freight-bronx": { label: "Active retail renovations", detail: 4 },
  "lidl-harlem": { label: "Flooring & selective demolition", detail: 7 },
};

function photoAt(project: Project | undefined, number: number) {
  return (
    project?.images.find((photo) =>
      photo.src.endsWith(`/${String(number).padStart(2, "0")}.webp`),
    ) || project?.images[0]
  );
}

export async function CraftDivisionPage({ division }: { division: Division }) {
  const residential = division === "residential";
  const projects = await getProjects({ division });
  const heroProject =
    projects.find(
      (project) =>
        project.slug ===
        (residential ? "upper-west-side-apartment" : "harbor-freight-bronx"),
    ) || projects[0];
  const heroImage = photoAt(heroProject, residential ? 6 : 4);

  return (
    <div className={`rf-div-page rf-div-${division}`}>
      <section className="rf-div-hero" aria-labelledby="division-title">
        {heroImage && (
          <div className="rf-div-hero-image">
            <Image
              src={heroImage.src}
              alt={heroImage.alt}
              fill
              sizes="(max-width: 767px) 100vw, 72vw"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        )}
        <div className="rf-div-hero-shade" />
        <div className="rf-div-hero-content rf-container">
          <p className="rf-div-eyebrow">Reliant Renovations / New York</p>
          <h1 id="division-title">
            {residential ? "Residential" : "Commercial"}
            <span>{residential ? "renovations." : "construction."}</span>
          </h1>
          <p className="rf-div-intro-copy">
            {residential
              ? "Complete apartments, kitchens, bathrooms and exteriors. Hands-on management from demolition through the final finishes."
              : "Restaurant buildouts, retail renovations and exterior work. Coordinated construction for demanding scopes and active locations."}
          </p>
          <a className="rf-button" href="#division-projects">
            View our {division} work
            <span>
              <ArrowDownRight size={21} aria-hidden="true" />
            </span>
          </a>
        </div>
        {heroImage && heroProject && (
          <Link
            className="rf-div-hero-project"
            href={`/projects/${heroProject.slug}`}
          >
            <span>
              <strong>{heroProject.title}</strong>
              <small>{heroProject.location}</small>
            </span>
            <ArrowUpRight size={23} aria-hidden="true" />
          </Link>
        )}
      </section>

      <section
        className="rf-div-overview rf-container"
        aria-labelledby="division-approach-title"
      >
        <div className="rf-div-overview-copy" data-rf-reveal>
          <p className="rf-div-section-label">Our capabilities</p>
          <h2 id="division-approach-title">
            {residential
              ? "Every phase.\nOne accountable team."
              : "Complex work.\nCareful coordination."}
          </h2>
          <p>
            {residential
              ? "We manage the structural work, trade coordination and finish details that turn a renovation into a complete home. Clear communication and hands-on supervision connect every phase, from the first demolition to the final walkthrough."
              : "Our commercial work spans structural carpentry, interiors, selective demolition, masonry, concrete, flooring and facades. We coordinate the trades, sequence the scope and plan phased or off-hours work around active operations."}
          </p>
          <Link className="rf-text-link" href="/about">
            How we work <ArrowUpRight size={20} aria-hidden="true" />
          </Link>
        </div>
        {!!projects.length && (
          <nav
            className="rf-div-service-index"
            aria-label={`${division} services`}
          >
            <p>Explore our work by scope</p>
            {projects.map((project) => (
              <a href={`#work-${project.slug}`} key={project.id}>
                <span>
                  {projectServices[project.slug]?.label ||
                    project.subtitle ||
                    project.title}
                </span>
                <ArrowDownRight size={22} aria-hidden="true" />
              </a>
            ))}
          </nav>
        )}
      </section>

      <section
        id="division-projects"
        className="rf-div-work"
        aria-labelledby="division-work-title"
      >
        <div className="rf-div-work-heading rf-container" data-rf-reveal>
          <p className="rf-div-section-label">Project portfolio</p>
          <h2 id="division-work-title">
            {residential ? "Residential work." : "Commercial work."}
          </h2>
          <p>
            {residential
              ? "Explore the scope and details behind our apartment, home and exterior renovations."
              : "From the structure to the storefront. Explore the work Reliant completed at each location."}
          </p>
        </div>
        <div className="rf-div-project-stories">
          {projects.map((project) => {
            const service = projectServices[project.slug];
            const leadImage = project.images[0];
            const detailPhoto = photoAt(project, service?.detail || 2);
            return (
              <article
                id={`work-${project.slug}`}
                className="rf-div-story rf-container"
                key={project.id}
                aria-labelledby={`title-${project.slug}`}
              >
                <div className="rf-div-story-copy">
                  <p className="rf-div-story-service">
                    {service?.label || project.category}
                  </p>
                  <h3 id={`title-${project.slug}`}>{project.title}</h3>
                  <p className="rf-div-story-location">{project.location}</p>
                  <p className="rf-div-story-description">
                    {project.description}
                  </p>
                  <ul className="rf-div-scope-preview">
                    {project.scope.slice(0, 3).map((scope) => (
                      <li key={scope}>{scope}</li>
                    ))}
                  </ul>
                  <Link
                    className="rf-text-link"
                    href={`/projects/${project.slug}`}
                  >
                    View project & gallery{" "}
                    <ArrowUpRight size={21} aria-hidden="true" />
                  </Link>
                </div>
                <div className="rf-div-story-images">
                  {leadImage && (
                    <Link
                      className="rf-div-story-main rf-div-photo"
                      href={`/projects/${project.slug}`}
                      data-rf-reveal
                    >
                      <Image
                        src={leadImage.src}
                        alt={leadImage.alt}
                        fill
                        sizes="(max-width: 767px) 100vw, 58vw"
                      />
                      <span className="rf-div-image-arrow">
                        <ArrowUpRight size={25} aria-hidden="true" />
                      </span>
                    </Link>
                  )}
                  {detailPhoto && detailPhoto.src !== leadImage?.src && (
                    <Link
                      className="rf-div-story-detail"
                      href={`/projects/${project.slug}?photo=${project.images.indexOf(detailPhoto) + 1}`}
                      data-rf-reveal
                    >
                      <div className="rf-div-photo">
                        <Image
                          src={detailPhoto.src}
                          alt=""
                          fill
                          sizes="(max-width: 767px) 64vw, 37vw"
                        />
                      </div>
                      <span>
                        {detailPhoto.alt}
                        <ArrowUpRight size={19} aria-hidden="true" />
                      </span>
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
          {!projects.length && (
            <p className="rf-div-empty rf-container">
              Our project collection is being updated. Tell us about your space
              and the work you have in mind.
            </p>
          )}
        </div>
      </section>

      <section className="rf-div-invitation rf-container" data-rf-reveal>
        <div>
          <p className="rf-div-section-label">Work with Reliant</p>
          <h2>
            Let’s discuss
            <br />
            your project.
          </h2>
          <p>Tell us about your location, scope and timing.</p>
        </div>
        <Link className="rf-button" href={`/contact?type=${division}`}>
          Discuss your project
          <span>
            <ArrowUpRight size={23} aria-hidden="true" />
          </span>
        </Link>
      </section>
    </div>
  );
}
