import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { ThemeToggle } from "@/components/theme-toggle";
import { site } from "@/lib/site";
import type { Project } from "@/lib/types";

export function SiteFooter({ projects = [] }: { projects?: Project[] }) {
  const project =
    projects.find(
      (entry) => entry.published && entry.slug === "upper-west-side-apartment",
    ) || projects.find((entry) => entry.published && entry.images.length > 0);
  const photo =
    project?.slug === "upper-west-side-apartment"
      ? project.images[4] || project.images[0]
      : project?.images[0];

  return (
    <footer className="rf-footer">
      <div className="rf-footer-invitation">
        {photo && (
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="100vw"
            className="rf-footer-photo"
          />
        )}
        <div className="rf-footer-invitation-inner">
          <p className="rf-footer-eyebrow">
            Commercial and Residential Construction
          </p>
          <h2>Discuss Your Project</h2>
          <Link href="/contact" className="rf-footer-cta">
            <span>Discuss Your Project</span>
            <span className="rf-footer-cta-arrow">
              <ArrowUpRight size={25} aria-hidden="true" />
            </span>
          </Link>
        </div>
        {project && (
          <Link
            href={`/projects/${project.slug}`}
            className="rf-footer-photo-credit"
          >
            {project.title}
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        )}
      </div>
      <div className="rf-container rf-footer-base">
        <div className="rf-footer-identity">
          <Link href="/" aria-label="Reliant Renovations home">
            <Image
              src="/images/brand/reliant-color-transparent.png"
              alt="Reliant Renovations Inc."
              width={190}
              height={133}
            />
          </Link>
          <p>Commercial and Residential Construction</p>
        </div>
        <div className="rf-footer-area">
          <span className="rf-footer-eyebrow">Service Areas</span>
          <p>
            New York City, Long Island, Westchester and select surrounding
            markets.
          </p>
        </div>
        <nav className="rf-footer-links" aria-label="Footer navigation">
          <span className="rf-footer-eyebrow">Navigation</span>
          <Link href="/residential">Residential Renovations</Link>
          <Link href="/commercial">Commercial Construction</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/about">About Reliant</Link>
        </nav>
        <div className="rf-footer-connect">
          <span className="rf-footer-eyebrow">Contact</span>
          <Link href="/contact">
            Discuss Your Project <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
          {site.phone && (
            <a href={`tel:${site.phone.replace(/[^+\d]/g, "")}`}>
              {site.phone}
            </a>
          )}
          {site.email && <a href={`mailto:${site.email}`}>{site.email}</a>}
          <a href={site.instagram} target="_blank" rel="noopener noreferrer">
            Instagram <ArrowUpRight size={16} aria-hidden="true" />
          </a>
          {site.youtube && (
            <a href={site.youtube} target="_blank" rel="noopener noreferrer">
              YouTube <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
      <div className="rf-container rf-footer-legal">
        <span>© {new Date().getFullYear()} Reliant Renovations Inc.</span>
        <nav aria-label="Site information">
          <Link href="/privacy">Privacy</Link>
          <Link href="/admin">Owner login</Link>
        </nav>
        <div className="rf-footer-theme">
          <span>Appearance</span>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
