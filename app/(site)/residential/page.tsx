import { ClientIntroduction } from "@/components/unfold/client-introduction";
import { websiteCopy } from "@/lib/website-copy";
import { UnfoldPortfolio } from "@/components/unfold/portfolio";
import { getProjects } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata(
  websiteCopy.divisions.residential.title,
  websiteCopy.divisions.residential.description,
  "/residential",
);
export default async function Residential() {
  return (
    <>
      <UnfoldPortfolio
        projects={await getProjects({ division: "residential" })}
        division="residential"
      />
      <ClientIntroduction division="residential" />
    </>
  );
}
