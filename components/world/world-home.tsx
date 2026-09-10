"use client";
import { useState } from "react";
import Image from "@/components/site-image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import { WorldPage } from "./world-page";
import type { WorldScene } from "./world-types";
import type { Project } from "@/lib/types";

export function WorldHome({
  commercial,
  featured,
}: {
  commercial?: WorldScene;
  featured: Project[];
}) {
  const residential: WorldScene = {
    id: "home-residential",
    image: "/images/experience/residential-entry.webp",
    alt: "Interior concept looking from timber joinery into a furnished living room and kitchen",
    position: "52% 50%",
  };
  const [choice, setChoice] = useState<"residential" | "commercial">(
    "residential",
  );
  const scene =
    choice === "commercial" && commercial ? commercial : residential;
  return (
    <WorldPage scene={scene} className="world-home">
      <div className="world-home-intro">
        <p>Reliant Renovations / New York</p>
        <h1>
          Step into
          <br />
          our work.
        </h1>
        <span>
          Residential renovations.
          <br />
          Commercial construction.
          <br />
          Care in every detail.
        </span>
      </div>
      <div className="world-home-choices" aria-label="Choose your experience">
        <Link
          href="/residential"
          onMouseEnter={() => setChoice("residential")}
          onFocus={() => setChoice("residential")}
          className={choice === "residential" ? "is-selected" : ""}
        >
          <div className="world-home-choice-photo">
            <Image src={residential.image} alt="" fill sizes="180px" />
          </div>
          <div>
            <span>For the way you live</span>
            <h2>Residential</h2>
            <p>Rooms, materials & the details of home.</p>
          </div>
          <ArrowRight size={26} weight="light" aria-hidden="true" />
        </Link>
        <Link
          href="/commercial"
          onMouseEnter={() => setChoice("commercial")}
          onFocus={() => setChoice("commercial")}
          className={choice === "commercial" ? "is-selected" : ""}
        >
          <div className="world-home-choice-photo">
            {commercial && (
              <Image src={commercial.image} alt="" fill sizes="180px" />
            )}
          </div>
          <div>
            <span>For the way you work</span>
            <h2>Commercial</h2>
            <p>Drawings, construction & completed spaces.</p>
          </div>
          <ArrowRight size={26} weight="light" aria-hidden="true" />
        </Link>
      </div>
      <div className="world-home-bottom">
        <span>
          {choice === "residential"
            ? "Illustrative interior concept"
            : "Illustrative architectural study"}
        </span>
        <Link href="/projects">
          Explore completed projects <ArrowUpRight size={16} />
        </Link>
      </div>
      <nav className="sr-only" aria-label="Selected completed projects">
        {featured.map((project) => (
          <Link key={project.id} href={`/projects/${project.slug}`}>
            {project.title}: {project.subtitle}
          </Link>
        ))}
      </nav>
    </WorldPage>
  );
}
