import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CraftMotion } from "@/components/craft/motion";
import { JsonLd } from "@/components/json-ld";
import { Analytics } from "@/components/analytics";
import { SiteTransitions } from "@/components/unfold/site-transitions";
import { getProjects } from "@/lib/db";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { site } from "@/lib/site";
import { connection } from "next/server";
import "./foundation.css";
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The shared footer reads live projects; deployment builds must not query MongoDB.
  await connection();
  const projects = await getProjects();
  return (
    <SiteTransitions>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="rf-main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter projects={projects} />
      <CraftMotion />
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <Analytics id={site.googleAnalyticsId} />
    </SiteTransitions>
  );
}
