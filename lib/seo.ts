import type { Metadata } from "next";
import { site } from "./site";
import { socialPreview, socialPreviewVideo } from "./social-preview";
import type { Project } from "./types";

export function absoluteUrl(path: string): string {
  return new URL(path, `${site.url}/`).toString();
}

export function pageMetadata(
  title: string,
  description: string,
  path: string,
  image?: string,
): Metadata {
  const fullTitle = `${title} | ${site.shortName}`;
  const canonical = absoluteUrl(path);
  const imageUrl = absoluteUrl(image || socialPreview.path);
  const videoUrl =
    path === "/" && !image ? absoluteUrl(socialPreviewVideo.path) : undefined;
  return {
    metadataBase: new URL(site.url),
    title: { absolute: fullTitle },
    description,
    alternates: { canonical },
    robots: {
      index: site.indexable,
      follow: site.indexable,
      googleBot: {
        index: site.indexable,
        follow: site.indexable,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: site.shortName,
      url: canonical,
      title: fullTitle,
      description,
      images: [
        image
          ? { url: imageUrl, alt: title }
          : {
              url: imageUrl,
              width: socialPreview.width,
              height: socialPreview.height,
              type: socialPreview.type,
              alt: socialPreview.alt,
            },
      ],
      ...(videoUrl
        ? {
            videos: [
              {
                url: videoUrl,
                ...(new URL(videoUrl).protocol === "https:"
                  ? { secureUrl: videoUrl }
                  : {}),
                width: socialPreviewVideo.width,
                height: socialPreviewVideo.height,
                type: socialPreviewVideo.type,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [{ url: imageUrl, alt: image ? title : socialPreview.alt }],
    },
  };
}

// No address, licenses, reviews, founding date or office locations are supplied.
// Organization expresses the verified identity without inventing LocalBusiness fields.
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${site.url}/#organization`,
    name: site.name,
    url: site.url,
    description: site.description,
    sameAs: [site.instagram, ...(site.youtube ? [site.youtube] : [])],
    areaServed: site.serviceAreas.map((name) => ({ "@type": "Place", name })),
    ...(site.phone ? { telephone: site.phone } : {}),
    ...(site.email ? { email: site.email } : {}),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site.url}/#website`,
    name: site.shortName,
    url: site.url,
    inLanguage: "en-US",
    publisher: { "@id": `${site.url}/#organization` },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function projectJsonLd(project: Project) {
  const url = absoluteUrl(`/projects/${project.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${url}#case-study`,
    name: `${project.title}: ${project.subtitle}`,
    description: project.description,
    url,
    inLanguage: "en-US",
    genre: `${project.division === "commercial" ? "Commercial construction" : "Residential renovation"} case study`,
    author: { "@id": `${site.url}/#organization` },
    publisher: { "@id": `${site.url}/#organization` },
    dateModified: project.updatedAt,
    contentLocation: { "@type": "Place", name: project.location },
    image: project.images.map(({ src, alt }) => ({
      "@type": "ImageObject",
      contentUrl: absoluteUrl(src),
      caption: alt,
    })),
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}
