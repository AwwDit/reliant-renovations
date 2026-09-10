"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import type { Project } from "@/lib/types";

export function ProjectReel({ projects }: { projects: Project[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  if (!projects.length) return null;
  const navigate = (direction: number) => {
    const next = Math.max(0, Math.min(projects.length - 1, active + direction));
    const el = track.current;
    const child = el?.children[next] as HTMLElement | undefined;
    if (el && child) el.scrollTo({ left: child.offsetLeft - (el.children[0] as HTMLElement).offsetLeft, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  return (
    <section className="rb-work" aria-labelledby="work-title">
      <div className="rb-work-heading rf-container" data-rf-reveal><div><p className="rb-section-label"><span /> Our portfolio</p><h2 id="work-title">Proof in the work.</h2></div><Link href="/projects" className="rf-text-link">All projects <ArrowUpRight size={20} aria-hidden="true" /></Link></div>
      <div className="rb-reel" ref={track} tabIndex={0} aria-label="Project collection, scroll horizontally to explore" onScroll={() => {
        const el = track.current;
        if (!el) return;
        const first = el.children[0] as HTMLElement;
        const second = el.children[1] as HTMLElement | undefined;
        const step = second ? second.offsetLeft - first.offsetLeft : el.clientWidth;
        setActive(Math.min(projects.length - 1, Math.round(el.scrollLeft / step)));
      }}>
        {projects.map((project, i) => {
          const photo = project.slug === "upper-west-side-apartment" ? project.images[5] || project.images[0] : project.slug === "harbor-freight-bronx" ? project.images[3] || project.images[0] : project.images[0];
          return <article className="rb-reel-slide" key={project.id} aria-label={`${i + 1} of ${projects.length}: ${project.title}`}>
            <Link href={`/projects/${project.slug}`} className="rb-reel-link">
              <div className="rb-reel-image">{photo && <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 767px) 88vw, 78vw" />}<span className="rb-reel-category">{project.division}</span></div>
              <div className="rb-reel-caption"><div><span>{project.location}</span><h3>{project.title}</h3></div><p>{project.subtitle}</p><ArrowUpRight size={29} aria-hidden="true" /></div>
            </Link>
          </article>;
        })}
      </div>
      <div className="rb-reel-bottom rf-container"><span className="rb-reel-count" aria-live="polite"><strong>{String(active + 1).padStart(2, "0")}</strong> / {String(projects.length).padStart(2, "0")}</span><div className="rb-reel-progress" aria-hidden="true"><span style={{ transform: `scaleX(${(active + 1) / projects.length})` }} /></div><div className="rb-reel-controls"><button onClick={() => navigate(-1)} disabled={active === 0} aria-label="Previous project"><ArrowLeft size={22} aria-hidden="true" /></button><button onClick={() => navigate(1)} disabled={active === projects.length - 1} aria-label="Next project"><ArrowRight size={22} aria-hidden="true" /></button></div></div>
      <noscript><style>{`.rb-reel-controls{display:none}`}</style></noscript>
    </section>
  );
}
