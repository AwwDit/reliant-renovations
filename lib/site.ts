import { websiteCopy } from "./website-copy";

const configuredUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  "https://reliantrenovationsinc.com";
const siteUrl = new URL(configuredUrl).origin;

export const site = {
  name: "Reliant Renovations Inc.",
  shortName: "Reliant Renovations",
  url: siteUrl,
  siteUrl,
  description: websiteCopy.homeDescription,
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() || undefined,
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || undefined,
  serviceAreas: ["New York City", "Long Island", "Westchester"],
  serviceAreaDescription:
    "New York City, Long Island, Westchester and select surrounding markets",
  instagram: "https://www.instagram.com/reliant_renovations/",
  youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL?.trim() || undefined,
  indexable: process.env.SITE_INDEXABLE === "true",
  googleAnalyticsId:
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || undefined,
  googleSiteVerification:
    process.env.GOOGLE_SITE_VERIFICATION?.trim() || undefined,
} as const;
