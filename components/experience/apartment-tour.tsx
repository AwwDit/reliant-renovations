import Image from "@/components/site-image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import "./apartment-tour.css";

type ProjectLinks = { apartment?: string; kitchen?: string; bathroom?: string };

/** Static residential entry while the photorealistic experience is developed. */
export function ApartmentTour({
  projectLinks = {},
}: {
  projectLinks?: ProjectLinks;
}) {
  const projectHref = projectLinks.apartment || "/projects?type=residential";

  return (
    <section className="at-tour" aria-labelledby="residential-experience-title">
      <div className="at-environment">
        <Image
          className="at-poster"
          src="/images/experience/residential-entry.webp"
          fill
          preload
          unoptimized
          sizes="100vw"
          alt="Interior concept with timber joinery, a furnished living room and an adjoining kitchen."
        />
        <div className="at-intro">
          <p className="at-kicker">Residential / Interior concept</p>
          <h1 id="residential-experience-title">
            Made for the way
            <br />
            you live.
          </h1>
          <a className="at-enter" href="#division-services">
            Explore residential services
            <ArrowRight size={21} aria-hidden="true" />
          </a>
        </div>
        <div className="at-project-invitation">
          <p>Thoughtful work. Throughout.</p>
          <Link href={projectHref}>
            See real residential work
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
      <nav
        className="at-chapter-rail"
        aria-label="Residential services and projects"
      >
        <a href="#division-services">Our services</a>
        {projectLinks.apartment && (
          <Link href={projectLinks.apartment}>Apartment renovation</Link>
        )}
        {projectLinks.kitchen && (
          <Link href={projectLinks.kitchen}>Kitchen renovation</Link>
        )}
        {projectLinks.bathroom && (
          <Link href={projectLinks.bathroom}>Bathroom renovation</Link>
        )}
        <Link className="at-all-projects" href="/projects?type=residential">
          All residential projects
          <ArrowUpRight size={20} aria-hidden="true" />
        </Link>
      </nav>
    </section>
  );
}
