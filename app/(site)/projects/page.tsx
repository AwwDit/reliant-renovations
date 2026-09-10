import { getProjects } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";
import { websiteCopy } from "@/lib/website-copy";
import { Portfolio } from "@/components/craft/portfolio";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata(
  "Projects",
  websiteCopy.homeDescription,
  "/projects",
);

export default async function Projects({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; project?: string }>;
}) {
  await searchParams;
  return <Portfolio projects={await getProjects()} />;
}
