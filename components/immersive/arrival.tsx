import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import type { Project } from "@/lib/types";

export function Arrival({ projects }: { projects: Project[] }) {
  const residential =
    projects.find((p) => p.slug === "upper-west-side-apartment") ||
    projects.find((p) => p.division === "residential");
  const commercial =
    projects.find((p) => p.slug === "raising-canes-forest-hills") ||
    projects.find((p) => p.division === "commercial");
  const doors = [
    {
      division: "residential",
      title: "Residential",
      eyebrow: "Spaces to come home to",
      invitation: "Step inside",
      image: residential?.images[5] || residential?.images[0],
      project: residential,
      count: projects.filter((p) => p.division === "residential").length,
    },
    {
      division: "commercial",
      title: "Commercial",
      eyebrow: "Spaces to do business",
      invitation: "See the work take shape",
      image: commercial?.images[0],
      project: commercial,
      count: projects.filter((p) => p.division === "commercial").length,
    },
  ];
  return (
    <div className="rr-arrival">
      <section className="rr-arrival-intro">
        <div>
          <p className="rr-eyebrow">
            <span className="rr-status-dot" /> Reliant Renovations · New York
          </p>
          <h1>
            Good spaces.
            <br className="rr-mobile-break" /> Built on trust.
          </h1>
        </div>
        <p>
          Commercial and residential renovations, managed from the first
          conversation to the final detail. <span>Choose your way in.</span>
        </p>
      </section>
      <nav className="rr-doorways" aria-label="Choose your experience">
        {doors.map((door, i) => (
          <Link
            href={`/${door.division}`}
            className={`rr-door rr-door-${door.division}`}
            key={door.division}
          >
            <div className="rr-door-image">
              {door.image && (
                <Image
                  src={door.image.src}
                  alt={door.image.alt}
                  fill
                  sizes="(max-width: 700px) 100vw, 60vw"
                  loading="eager"
                  fetchPriority={i === 0 ? "high" : "auto"}
                />
              )}
            </div>
            {door.division === "commercial" && (
              <svg
                className="rr-door-drawing"
                viewBox="0 0 800 700"
                fill="none"
                aria-hidden="true"
              >
                <path d="M95 640V218L595 50l130 92v380L245 695 95 640Zm0-422 150 95 480-171M245 313v382M127 270l82 52v234l-82-40V270Zm161 74 107-35v257l-107 42V344Zm137-45 108-38v255l-108 40V299Zm138-46 120-41v253l-120 44V253ZM73 173 580 4M40 218v412M757 146v378" />
                <path
                  d="m118 217 130 81 458-154M271 324v337M63 599l681-235M63 536l681-235M61 469l683-235"
                  strokeDasharray="5 10"
                />
              </svg>
            )}
            <div className="rr-door-top">
              <span>
                0{i + 1} / {door.eyebrow}
              </span>
              <span>{String(door.count).padStart(2, "0")} projects</span>
            </div>
            <div className="rr-door-bottom">
              <div>
                <p>{door.invitation}</p>
                <h2>{door.title}</h2>
              </div>
              <span className="rr-door-arrow">
                <ArrowUpRight weight="light" aria-hidden="true" />
              </span>
            </div>
            <div className="rr-door-caption">
              {door.project?.location}{" "}
              <span>
                Explore the experience{" "}
                <ArrowRight aria-hidden="true" size={15} />
              </span>
            </div>
          </Link>
        ))}
      </nav>
      <section className="rr-arrival-note" aria-label="About Reliant">
        <p>
          One team. From demolition
          <br />
          to the finishing touches.
        </p>
        <p>
          Hands-on general contracting. Clear communication.
          <br />
          New York City, Long Island & Westchester.
        </p>
        <Link href="/about">
          Meet Reliant <ArrowUpRight size={20} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
