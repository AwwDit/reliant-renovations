import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    // Allow public pages to be fetched so crawlers can read prelaunch noindex.
    // Authentication, rather than robots.txt, protects the dashboard and data.
    rules: {
      userAgent: "*",
      // Project uploads are public images; inquiry attachments remain private.
      allow: ["/", "/api/uploads/project-"],
      disallow: ["/admin", "/api/"],
    },
    ...(site.indexable
      ? { sitemap: `${site.url}/sitemap.xml`, host: site.url }
      : {}),
  };
}
