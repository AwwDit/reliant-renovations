import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { getProjects } from "@/lib/db";
import { getWorldJourney } from "@/lib/world-journeys";
import type { Division } from "@/lib/types";
import "./architecture/supporting.css";

export async function DivisionPage({ division }: { division: Division }) {
  const projects = await getProjects({ division });
  const residential = division === "residential";
  const project =
    projects.find(
      (item) =>
        item.slug ===
        (residential
          ? "upper-west-side-apartment"
          : "raising-canes-forest-hills"),
    ) || projects[0];
  const photo =
    project?.images.find((item) =>
      item.src.endsWith(residential ? "/06.webp" : "/01.webp"),
    ) || project?.images[0];
  const chapters = getWorldJourney(division, projects);
  const services = residential
    ? [
        { title: "Complete apartment renovations", ids: ["entry", "living"] },
        { title: "Kitchens", ids: ["kitchen"] },
        { title: "Bathrooms", ids: ["bathroom"] },
        { title: "Basements", ids: ["basement"] },
        { title: "Exterior transformations", ids: ["exterior"] },
      ]
    : [
        {
          title: "Storefronts & facades",
          ids: ["drawing", "glazing", "facade"],
        },
        { title: "Interior buildouts", ids: ["interiors"] },
        { title: "Flooring & selective demolition", ids: ["flooring"] },
        { title: "Masonry & exterior restoration", ids: ["restoration"] },
      ];
  const activeServices = services
    .map((service) => ({
      ...service,
      chapters: chapters.filter((chapter) => service.ids.includes(chapter.id)),
    }))
    .filter((service) => service.chapters.length);
  const detailPhoto = project?.images[3] || photo;

  return (
    <div className={`ar-division ar-division-${division}`}>
      <section className="ar-division-hero" aria-labelledby="division-title">
        {photo && (
          <Image
            className="ar-division-hero-image"
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="100vw"
            preload
          />
        )}
        <div className="ar-division-hero-shade" />
        <div className="ar-container ar-division-hero-content">
          <p className="ar-kicker">
            {residential
              ? "Residential renovations"
              : "Commercial construction"}{" "}
            / New York
          </p>
          <h1 id="division-title">
            {residential ? (
              <>
                Made for
                <br />
                the way you live.
              </>
            ) : (
              <>
                Built around
                <br />
                your business.
              </>
            )}
          </h1>
          <div className="ar-division-hero-bottom">
            <p>
              {residential
                ? "From complete apartments to the details of a single room. Thoughtful construction, with care at every step."
                : "Retail spaces, restaurants and the places people work. Construction with the bigger picture in view."}
            </p>
            <a href="#capabilities" className="ar-division-scroll">
              Explore our capabilities{" "}
              <ArrowDown size={20} aria-hidden="true" />
            </a>
          </div>
        </div>
        {project && photo && (
          <Link
            className="ar-division-photo-label"
            href={`/projects/${project.slug}`}
          >
            <span>
              <small>Featured project</small>
              {project.title}
            </span>
            <ArrowUpRight size={23} aria-hidden="true" />
          </Link>
        )}
      </section>

      <section
        className="ar-container ar-capabilities"
        id="capabilities"
        aria-labelledby="capabilities-title"
      >
        <div className="ar-capabilities-intro">
          <h2 className="ar-section-title" id="capabilities-title">
            {residential ? (
              <>
                Every room.
                <br />
                Every detail.
              </>
            ) : (
              <>
                From the shell.
                <br />
                To the finish.
              </>
            )}
          </h2>
          <p>
            {residential
              ? "A renovation works best when the layout, materials and finish work are considered together. We coordinate the work from the first conversation to the final walkthrough."
              : "We bring trades, materials and work sequences together, including phased and off-hours work when active operations require it."}
          </p>
          {detailPhoto && (
            <div className="ar-capabilities-detail">
              <Image
                src={detailPhoto.src}
                alt={detailPhoto.alt}
                fill
                sizes="(max-width: 800px) 90vw, 32vw"
              />
              <span>Care at every junction.</span>
            </div>
          )}
          <Link className="ar-text-link" href={`/contact?type=${division}`}>
            Start a project <ArrowUpRight size={21} aria-hidden="true" />
          </Link>
        </div>
        <div className="ar-service-list">
          {activeServices.map((service) => (
            <article className="ar-service" key={service.title} data-ar-reveal>
              <header>
                <h3>{service.title}</h3>
              </header>
              <div className="ar-service-features">
                {service.chapters
                  .flatMap((chapter) => chapter.features)
                  .map((feature) => (
                    <div key={feature.id}>
                      <h4>{feature.title}</h4>
                      <p>
                        {feature.id === "storefront-study"
                          ? "Glass, metal panels and trim must meet cleanly across the building exterior. See the storefront scope of our Forest Hills project."
                          : feature.description}
                      </p>
                    </div>
                  ))}
              </div>
              {service.chapters[0]?.project && (
                <Link
                  className="ar-text-link"
                  href={`/projects/${service.chapters[0].project.slug}`}
                >
                  See the project <ArrowUpRight size={18} aria-hidden="true" />
                </Link>
              )}
            </article>
          ))}
          {!activeServices.length && (
            <p className="ar-service-empty">
              Tell us about your space and the scope you have in mind. We’ll
              discuss how our team can help.
            </p>
          )}
        </div>
      </section>

      {!!projects.length && (
        <section
          className="ar-division-work"
          aria-labelledby="division-work-title"
        >
          <div className="ar-container">
            <header className="ar-division-work-heading">
              <div>
                <h2 className="ar-section-title" id="division-work-title">
                  The work speaks.
                </h2>
              </div>
              <Link
                className="ar-text-link"
                href={`/projects?type=${division}`}
              >
                View projects <ArrowUpRight size={22} aria-hidden="true" />
              </Link>
            </header>
            <div className="ar-division-projects">
              {projects.slice(0, 3).map((item) => (
                <Link
                  href={`/projects/${item.slug}`}
                  className="ar-division-project"
                  data-ar-reveal
                  key={item.id}
                >
                  <div className="ar-division-project-image">
                    {item.images[0] && (
                      <Image
                        src={item.images[0].src}
                        alt={item.images[0].alt}
                        fill
                        sizes="(max-width: 600px) 90vw, (max-width: 900px) 45vw, 30vw"
                      />
                    )}
                    <ArrowUpRight size={25} aria-hidden="true" />
                  </div>
                  <div className="ar-division-project-caption">
                    <h3>{item.title}</h3>
                    <p>{item.location}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      <section className="ar-container ar-support-invitation">
        <h2 className="ar-section-title">Let’s make it happen.</h2>
        <Link className="ar-button" href={`/contact?type=${division}`}>
          Start a project <ArrowUpRight size={22} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
