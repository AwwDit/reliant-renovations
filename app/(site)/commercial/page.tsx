import { ClientIntroduction } from "@/components/unfold/client-introduction";
import { websiteCopy } from "@/lib/website-copy";
import { UnfoldPortfolio } from "@/components/unfold/portfolio";
import { getProjects } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata(
  websiteCopy.divisions.commercial.title,
  websiteCopy.divisions.commercial.description,
  "/commercial",
);
export default async function Commercial() {
  return (
    <>
      <UnfoldPortfolio
        projects={await getProjects({ division: "commercial" })}
        division="commercial"
      />
      <ClientIntroduction division="commercial" />
    </>
  );
}
