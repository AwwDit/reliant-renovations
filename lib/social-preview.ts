import { websiteCopy } from "./website-copy";

// Bump the filename when replacing the artwork so sharing clients see a new asset.
export const socialPreview = {
  path: "/images/social/reliant-share-v3.jpg",
  width: 1200,
  height: 630,
  type: "image/jpeg",
  alt: `Reliant Renovations Inc. ${websiteCopy.headline} Residential kitchen and commercial storefront project photography.`,
} as const;
