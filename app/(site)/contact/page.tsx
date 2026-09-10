import Image from "@/components/site-image";
import Link from "next/link";
import {
  ArrowUpRight,
  EnvelopeSimple,
  Phone,
} from "@phosphor-icons/react/dist/ssr";
import { ContactForm } from "@/components/contact-form";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { getProjects } from "@/lib/db";
import "@/components/craft/supporting.css";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata(
  "Discuss Your Project",
  "Project inquiry form with name, company, contact information, location, project type, desired timing, description and optional file upload.",
  "/contact",
);

export default async function Contact({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const division = type === "commercial" ? "commercial" : "residential";
  const projects = await getProjects({ division });
  const preferredSlug =
    division === "commercial"
      ? "chick-fil-a-kingston"
      : "upper-west-side-apartment";
  const reference =
    projects.find((p) => p.slug === preferredSlug) || projects[0];
  const photo =
    reference?.images.find((p) =>
      p.src.endsWith(division === "commercial" ? "/02.webp" : "/06.webp"),
    ) || reference?.images[0];

  return (
    <div className="rf-contact">
      <div className="rf-container rf-contact-layout">
        <div className="rf-contact-intro">
          <header>
            <p className="rf-contact-kicker">Project inquiry</p>
            <h1>Discuss Your Project</h1>
          </header>
          {photo && reference && (
            <Link
              className="rf-contact-image"
              href={`/projects/${reference.slug}`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 850px) 90vw, 38vw"
                preload
              />
              <span>
                {reference.title}
                <ArrowUpRight size={22} aria-hidden="true" />
              </span>
            </Link>
          )}
          <aside
            className="rf-contact-information"
            aria-label="Contact details and service area"
          >
            <div className="rf-contact-details">
              {site.email && (
                <a href={`mailto:${site.email}`}>
                  <EnvelopeSimple size={21} aria-hidden="true" />
                  {site.email}
                </a>
              )}
              {site.phone && (
                <a href={`tel:${site.phone.replace(/[^+\d]/g, "")}`}>
                  <Phone size={21} aria-hidden="true" />
                  {site.phone}
                </a>
              )}
              <a
                href={site.instagram}
                target="_blank"
                rel="noopener noreferrer"
              >
                @reliant_renovations{" "}
                <ArrowUpRight size={18} aria-hidden="true" />
              </a>
            </div>
            <div className="rf-contact-area">
              <h2>Service Areas</h2>
              <p>
                New York City, Long Island, Westchester and select surrounding
                markets.
              </p>
            </div>
          </aside>
        </div>
        <div className="rf-contact-form-panel">
          <div className="rf-contact-form-heading">
            <p className="rf-contact-form-label">Project inquiry</p>
            <ArrowUpRight size={24} aria-hidden="true" />
          </div>
          <ContactForm
            initialType={
              type === "commercial" || type === "residential" ? type : ""
            }
          />
        </div>
      </div>
    </div>
  );
}
