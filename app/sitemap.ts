import type { MetadataRoute } from "next";
import { getProjects } from "@/lib/db";
import { absoluteUrl } from "@/lib/seo";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!site.indexable) return [];

  const projects = await getProjects();
  const pages = [
    "/",
    "/commercial",
    "/residential",
    "/projects",
    "/about",
    "/contact",
    "/privacy",
  ];

  return [
    ...pages.map((path) => ({ url: absoluteUrl(path) })),
    ...projects
      .filter((project) => project.published)
      .map((project) => ({
        url: absoluteUrl(`/projects/${project.slug}`),
        lastModified: project.updatedAt,
        images: project.images.map(({ src }) => absoluteUrl(src)),
      })),
  ];
}
