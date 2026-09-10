import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { websiteCopy } from "@/lib/website-copy";
import type { Project } from "@/lib/types";
import "./brand-hero.css";

export function BrandHero({ projects }: { projects: Project[] }) {
  const photographed = projects.filter((project) => project.images.length > 0);
  const residential =
    photographed.find((project) => project.slug === "plainview-kitchen") ||
    photographed.find((project) => project.division === "residential") ||
    photographed[0];
  const commercial =
    photographed.find(
      (project) => project.slug === "raising-canes-forest-hills",
    ) || photographed.find((project) => project.division === "commercial");

  return (
    <section className="uf-brand-hero" aria-labelledby="reliant-headline">
      <div className="uf-brand-stage">
        <div className="uf-brand-photographs">
          {residential && (
            <div className="uf-brand-photo uf-brand-photo-home">
              <Image
                src={residential.images[0].src}
                alt={residential.images[0].alt}
                fill
                sizes="(max-width: 1000px) 100vw, 60vw"
                loading="eager"
                fetchPriority="high"
              />
            </div>
          )}
          {commercial && commercial.id !== residential?.id && (
            <div className="uf-brand-photo uf-brand-photo-commercial">
              <Image
                src={commercial.images[0].src}
                alt={commercial.images[0].alt}
                fill
                sizes="(max-width: 1000px) 100vw, 40vw"
                loading="eager"
              />
            </div>
          )}
        </div>
        <div className="uf-brand-signature">
          <span className="uf-brand-name">Reliant</span>
          <span className="uf-brand-trade">Renovations Inc.</span>
        </div>
        <div className="uf-brand-message">
          <h1 id="reliant-headline">{websiteCopy.headline}</h1>
          <div className="uf-brand-actions">
            <Link href="/contact" className="uf-brand-primary">
              {websiteCopy.primaryAction}
              <span>
                <ArrowUpRight size={23} aria-hidden="true" />
              </span>
            </Link>
            <a href="#projects" className="uf-brand-work">
              {websiteCopy.secondaryAction}
              <ArrowDown size={22} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
      <div
        className="uf-brand-introduction rf-container"
        id="company-introduction"
      >
        <p>{websiteCopy.homeIntroduction}</p>
        <nav aria-label="Explore our work">
          <Link href="/residential">
            {websiteCopy.divisions.residential.title}
            <ArrowUpRight size={22} aria-hidden="true" />
          </Link>
          <Link href="/commercial">
            {websiteCopy.divisions.commercial.title}
            <ArrowUpRight size={22} aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </section>
  );
}
