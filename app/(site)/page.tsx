import { getProjects } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";
import { BrandHero } from "@/components/unfold/brand-hero";
import { websiteCopy } from "@/lib/website-copy";
import { UnfoldPortfolio } from "@/components/unfold/portfolio";
import { ArrivalIntro } from "@/components/unfold/arrival-intro";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata(
  websiteCopy.headline,
  websiteCopy.homeDescription,
  "/",
);
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
    </>
  );
}
