import { Suspense } from "react";
import { getProjects } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";
import { BrandHero } from "@/components/unfold/brand-hero";
import { websiteCopy } from "@/lib/website-copy";
import { UnfoldPortfolio } from "@/components/unfold/portfolio";
import { ArrivalIntro } from "@/components/unfold/arrival-intro";
import { getGoogleReviews } from "@/lib/google-reviews";
import { GoogleReviewsDisplay } from "@/components/unfold/google-reviews-display";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata(
  websiteCopy.headline,
  websiteCopy.homeDescription,
  "/",
);

async function HomeReviews() {
  const reviews = await getGoogleReviews();
  return reviews ? <GoogleReviewsDisplay data={reviews} /> : null;
}

function GoogleReviewsNoScriptLink() {
  const placeId = process.env.GOOGLE_PLACES_PLACE_ID?.trim();
  if (
    !process.env.GOOGLE_PLACES_API_KEY?.trim() ||
    !placeId ||
    !/^[A-Za-z0-9_-]+$/.test(placeId)
  ) {
    return null;
  }
  const params = new URLSearchParams({
    api: "1",
    query: site.name,
    query_place_id: placeId,
  });

  return (
    <noscript>
      <section
        className="uf-reviews"
        data-empty="true"
        aria-labelledby="google-reviews-noscript-title"
      >
        <div className="rf-container uf-reviews-layout">
          <header className="uf-reviews-summary">
            <h2 id="google-reviews-noscript-title">Google reviews</h2>
            <a
              className="uf-reviews-source"
              href={`https://www.google.com/maps/search/?${params}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Read reviews on Google Maps
            </a>
          </header>
        </div>
      </section>
    </noscript>
  );
}

export default async function Home() {
  const projects = await getProjects();
  const featuredSlugs = [
    "plainview-kitchen",
    "upper-west-side-apartment",
    "raising-canes-forest-hills",
    "chick-fil-a-kingston",
    "tribeca-apartment",
  ];
  const featured = featuredSlugs.flatMap((slug) =>
    projects.filter((project) => project.slug === slug),
  );
  return (
    <>
      <BrandHero projects={projects} />
      <ArrivalIntro />
      <UnfoldPortfolio
        projects={featured.length ? featured : projects.slice(0, 5)}
        embedded
      />
      {/* Stream optional reviews after the hero so Google cannot delay its images. */}
      <Suspense fallback={<GoogleReviewsNoScriptLink />}>
        <HomeReviews />
      </Suspense>
    </>
  );
}
