import type { Metadata } from "next";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import "./globals.css";
import "./redesign.css";
import "./theme.css";
import { websiteCopy } from "@/lib/website-copy";
import { site } from "@/lib/site";
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Reliant Renovations | Commercial and Residential Construction",
    template: "%s | Reliant Renovations",
  },
  description: websiteCopy.homeDescription,
  robots: { index: site.indexable, follow: true },
  verification: { google: site.googleSiteVerification },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t;try{t=localStorage.getItem("reliant-theme")}catch(e){}document.documentElement.dataset.theme=t==="light"||t==="dark"?t:"dark"})()`,
          }}
        />
        <noscript>
          <style>{`.theme-toggle{display:none!important}`}</style>
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
