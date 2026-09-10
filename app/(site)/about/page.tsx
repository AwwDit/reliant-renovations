import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { getProjects } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";
import "@/components/unfold/about.css";
export const dynamic = "force-dynamic";
export const metadata = pageMetadata(
  "About Reliant Renovations",
  "Reliant Renovations Inc. is a full-service general contractor built around responsive project management, dependable trade coordination and attention to detail.",
  "/about",
);
export default async function About() {
  const projects = await getProjects();
  const photographed = projects.filter((project) => project.images.length > 0);
  const main =
    photographed.find(
      (project) => project.slug === "upper-west-side-apartment",
    ) ||
    photographed.find((project) => project.division === "residential") ||
    photographed[0];
  const detail =
    photographed.find((project) => project.slug === "lidl-harlem") ||
    photographed.find(
      (project) => project.division === "commercial" && project.id !== main?.id,
    );
  // Select the finished-work images by source, so reordering a project gallery
  // does not silently replace them with construction-progress photographs.
  const photo =
    main?.images.find(
      (image) =>
        image.src === "/images/projects/upper-west-side-apartment/06.webp",
    ) || main?.images[0];
  const work =
    detail?.images.find(
      (image) => image.src === "/images/projects/lidl-harlem/02.webp",
    ) || detail?.images[0];
  return (
    <div className="uf-about rf-container">
      <section
        className="uf-about-opening"
        aria-labelledby="about-heading"
        data-has-photo={Boolean(photo)}
      >
        <header className="uf-about-heading">
          <h1 id="about-heading">
            About <span>Reliant</span>
          </h1>
          <p>
            Reliant Renovations Inc. is a full-service general contractor built
            around responsive project management, dependable trade coordination
            and attention to detail.
          </p>
          <Link href="/projects" className="rf-button">
            View Our Work{" "}
            <span>
              <ArrowUpRight size={20} aria-hidden="true" />
            </span>
          </Link>
        </header>
        {photo && main && (
          <figure className="uf-about-hero-project">
            <div className="uf-about-hero-photo">
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 700px) calc(100vw - 44px), (max-width: 1000px) 56vw, (max-width: 1680px) calc(58vw - 200px), 820px"
                loading="eager"
                fetchPriority="high"
              />
            </div>
            <figcaption>
              <Link href={`/projects/${main.slug}`}>
                {main.title}
                <ArrowUpRight size={19} aria-hidden="true" />
              </Link>
            </figcaption>
          </figure>
        )}
      </section>

      <div className="uf-about-story" data-rf-reveal>
        <p className="uf-about-experience">
          Our experience spans active retail locations, restaurants, offices,
          full apartment renovations, kitchens, bathrooms, basements and
          exterior transformations.
        </p>
        <p>
          Every project is approached with the same priorities: understand the
          scope, communicate clearly, coordinate the work carefully and deliver
          a finished result that reflects the quality promised at the beginning.
        </p>
      </div>

      <section
        className="uf-about-principles"
        aria-labelledby="why-reliant-heading"
      >
        <div className="uf-about-principles-layout">
          <div className="uf-about-principles-intro">
            <h2 id="why-reliant-heading">Why Reliant</h2>
            {work && detail && (
              <figure className="uf-about-work-project" data-rf-reveal>
                <div className="uf-about-work-photo">
                  <Image
                    src={work.src}
                    alt={work.alt}
                    fill
                    sizes="(max-width: 700px) calc(100vw - 44px), (max-width: 1000px) 38vw, (max-width: 1680px) calc(36vw - 140px), 480px"
                    style={{ objectPosition: "50% 55%" }}
                  />
                </div>
                <figcaption>
                  <Link href={`/projects/${detail.slug}`}>
                    {detail.title}
                    <ArrowUpRight size={19} aria-hidden="true" />
                  </Link>
                </figcaption>
              </figure>
            )}
          </div>
          <ol className="uf-about-principles-list">
            {[
              "Owner-led, hands-on project management.",
              "Clear communication from planning through closeout.",
              "Commercial and residential construction experience.",
              "Ability to coordinate multiple trades and complex scopes.",
              "Experience working during off-hours and around active operations.",
              "A focus on professional execution, cleanliness and finish quality.",
            ].map((item, index) => (
              <li key={item} data-rf-reveal>
                <span aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p>{item}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="uf-about-area" data-rf-reveal>
        <h2>Service Areas</h2>
        <p>
          New York City, Long Island, Westchester{" "}
          <span>and select surrounding markets.</span>
        </p>
      </section>
    </div>
  );
}
