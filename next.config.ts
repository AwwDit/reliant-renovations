import type { NextConfig } from "next";
import { mediaCloudName } from "./lib/media-urls";
const cloudName = mediaCloudName();
const config: NextConfig = {
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  serverExternalPackages: ["mongodb"],
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 3600,
    maximumRedirects: 0,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: `/${cloudName}/image/upload/*/reliant/**`,
        search: "",
      },
    ],
    localPatterns: [
      { pathname: "/images/**" },
      { pathname: "/api/uploads/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'" +
              (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "") +
              ` https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://www.google-analytics.com https://*.googleusercontent.com https://res.cloudinary.com/${cloudName}/; font-src 'self'; connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`,
          },
        ],
      },
    ];
  },
};
export default config;
