# Reliant Renovations — SEO and launch handoff

Prepared September 6, 2026 from the supplied _Reliant Renovations Website Designer Package_, dated September 3, 2026. The document is the source for business positioning, completed project scope, service areas and portfolio selections. It does not confirm the business telephone, email, license details, original assets or publication permissions. No live domain, hosting account, Search Console property or analytics account was audited or changed during this build.

## What the application provides

- Separate commercial and residential pages and ten editable project case studies: five in each division. Project descriptions retain Reliant’s stated scope; residential locations stop at neighborhood or city.
- Eight selected images per project with descriptive alternative text. Full-size photographs and selected video poster stills were retrieved from the supplied CompanyCam timeline links and visually matched to the document selections. See [ASSETS.md](./ASSETS.md) for provenance and native dimensions.
- A shared metadata helper for page titles, descriptions, canonical URLs, Open Graph and social sharing images.
- Organization, WebSite, breadcrumb and project case-study JSON-LD helpers. Identity information comes from the brief; unknown address, licensing, reviews and ratings are omitted. Organization markup can help Google understand the business identity; it is not a promise of a particular result or placement. [Google’s Organization guidance](https://developers.google.com/search/docs/appearance/structured-data/organization).
- A dynamic sitemap containing public pages and published projects. Hidden projects are excluded. Project modification dates reflect actual content updates, not construction completion dates; static pages do not claim an artificial daily modification date. [Google’s sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
- A prelaunch indexing switch, disabled by default. Public-page metadata uses `noindex` until `SITE_INDEXABLE=true`; the sitemap is empty and not advertised before launch. Public pages remain crawlable so search engines can read the directive. `robots.txt` alone does not prevent indexing, and noindex is not access control. Protect private previews through the hosting provider if needed. [Google’s noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing).

## Configuration

| Variable                        | Purpose                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL`          | Final canonical origin; default `https://reliantrenovationsinc.com`. Set the chosen HTTPS origin before launch.                            |
| `SITE_INDEXABLE`                | Keep absent or `false` on previews. Set exactly `true` only on the approved production site.                                               |
| `NEXT_PUBLIC_CONTACT_PHONE`     | Confirmed business phone for visible contact and click-to-call links.                                                                      |
| `NEXT_PUBLIC_CONTACT_EMAIL`     | Confirmed public business email. This does not by itself configure form notification delivery.                                             |
| `NEXT_PUBLIC_YOUTUBE_URL`       | Confirmed YouTube channel; omitted until supplied. Instagram follows the brief’s `@reliant_renovations`.                                   |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional Google Analytics 4 measurement ID. Configure after the owner confirms the property and the applicable consent/privacy setup.      |
| `GOOGLE_SITE_VERIFICATION`      | Optional Search Console HTML verification token. A domain property instead uses DNS verification; preserve existing DNS and email records. |

Use the main README and environment example for database persistence, upload storage, administrator authentication and form-delivery settings. Server environment changes require restarting or redeploying the application; public environment values may also be embedded in the frontend build.

## Owner inputs before publication

1. Confirm the final business phone, public email and inquiry recipient; send an end-to-end inquiry and verify receipt.
2. Confirm service-area wording: New York City, Long Island, Westchester and select surrounding markets. The Kingston case study represents completed work and should not be expanded into an unsupported service-area promise.
3. Confirm permission and preferred wording for commercial project names and visible brand marks. Current project names follow the document; no client-endorsement or contractual-hierarchy claims have been added.
4. Supply the original vector logo for future large-format use. The matching full-size CompanyCam selections are installed in the approved eight-image order. Review final imagery for addresses, people, paperwork and sensitive details.
5. Confirm license wording and any license number before adding them. Supply approved testimonials before adding testimonial content or review markup. None should be invented to fill a section.
6. Confirm the privacy notice against actual data handling, hosting, inquiry storage, retention, analytics and notification services. Determine who maintains security updates and who receives monitoring alerts.

These are publication inputs and operational tasks; they do not prevent reviewing and using the application locally.

## Reported legacy compromise and migration

**Document-reported issue, not live-verified:** the supplied designer package reports unrelated Danish football content on the current domain and indexed spam URLs. The new application does not establish that the old hosting environment is clean, remove existing indexed spam, rotate third-party credentials or change DNS.

Before connecting production traffic, the domain/hosting administrator should inventory the existing registrar, DNS, email routing, hosting and Search Console access. Preserve legitimate ownership and email records. Back up necessary business assets and records, then investigate or replace the affected application and hosting files. Review accounts and access, rotate affected credentials, remove injected content, patch retained software and establish automatic backups and monitoring. This sequence comes from the supplied brief and requires access to the actual environment.

Use the Search Console Security Issues report to investigate Google-reported problems, test the complete fix and request review only after affected content is remediated. Absence of visible symptoms during a casual visit is not a substitute for that review. [Google’s Security Issues report guidance](https://support.google.com/webmasters/answer/9044101).

Build a reviewed URL inventory using legitimate archived URLs, server logs and Search Console exports. Map former business pages to their closest relevant new pages with permanent redirects. Return a real `404` or `410` for removed spam or content with no replacement. Avoid a blanket redirect of unknown or spam URLs to the homepage, which can be treated as soft 404s. Preserve useful old image/document URLs when appropriate, and test redirect chains and both `www` and apex hosts. [Google’s migration and URL-mapping guidance](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes).

## Production verification

1. Review desktop and mobile pages, keyboard navigation, project filters, image loading, gallery behavior, form validation, uploads and actual inquiry delivery.
2. Select one canonical HTTPS hostname. Set `NEXT_PUBLIC_SITE_URL` to it and configure the host to redirect alternate schemes and hostnames consistently.
3. Once the content and hosting are ready, enable `SITE_INDEXABLE=true` on production only. Inspect the rendered HTML of the homepage, both division pages and several case studies for indexable robots metadata, distinct titles and descriptions, and the correct canonical URL.
4. Verify `/sitemap.xml` lists the seven public base routes and the current published projects, with no admin/API, hidden project, preview or legacy spam URLs. Submit the sitemap through Search Console; submission is a discovery hint rather than a guarantee of indexing. [Google’s sitemap submission guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
5. Check rendered breadcrumbs using Google’s Rich Results Test and validate JSON-LD values against visible content. `CreativeWork` describes a project case study; it does not claim a dedicated Google construction-project rich result. [Google’s breadcrumb documentation](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb).
6. Test the production deployment in PageSpeed Insights. Aim for LCP within 2.5 seconds, INP below 200 milliseconds and CLS below 0.1. Review actual field data as it becomes available; no Core Web Vitals score or search ranking is claimed by this build. [Google’s Core Web Vitals guidance](https://developers.google.com/search/docs/appearance/core-web-vitals).
7. Verify that Analytics records the intended activity and that the Search Console property is owned by Reliant. Check URL Inspection, Page Indexing, Security Issues and any applicable Manual Actions reports after launch. Do not send inquiry descriptions, uploaded files, names, emails or phone numbers to analytics.

## Ongoing content and measurement

Keep both divisions equally visible. Add genuine project evidence to existing service pages and link new case studies to their corresponding division. Avoid creating repetitive neighborhood pages with only the place name changed. Review the portfolio once or twice per year as the brief requests; Taco Bell tile work and Spark Car Wash EIFS are future candidates, not current completed case studies.

Track qualified inquiries and inquiry conversion alongside organic search clicks, impressions, indexed legitimate pages and mobile performance. Establish the baseline after the production setup is verified. Review broken URLs and security reports more frequently during the first month, then assign a continuing owner for content, updates and backups. No traffic or lead target is promised without a measured baseline.
