import { pageMetadata } from "@/lib/seo";
import "@/components/craft/supporting.css";

export const metadata = pageMetadata(
  "Website Terms",
  "Terms for using the Reliant Renovations website and its Google Maps review features.",
  "/terms",
);

export default function Terms() {
  return (
    <div className="rf-container rf-privacy">
      <aside>
        <p className="rf-legal-kicker">Reliant Renovations</p>
        <p className="rf-privacy-label">Using this website.</p>
      </aside>
      <article className="rf-legal">
        <h1>Website terms</h1>
        <p>
          This website provides information about Reliant Renovations Inc. and
          its project work. Contact us to discuss project scope, pricing and
          availability.
        </p>
        <h2>Google Maps content</h2>
        <p>
          Business ratings, reviews and reviewer information identified as
          Google Maps content are provided through Google Maps Platform. Your
          use of these features is subject to the{" "}
          <a href="https://maps.google.com/help/terms_maps/">
            Google Maps/Google Earth Additional Terms of Service
          </a>
          , which are incorporated into these website terms by reference.
        </p>
        <p>
          Google selects and orders the reviews supplied to this website by
          relevance. Reviews express their authors’ opinions. You can view each
          review and its author on Google Maps using the accompanying links.
        </p>
        <h2>Privacy</h2>
        <p>
          Our <a href="/privacy">privacy notice</a> describes how information is
          handled on this website. The{" "}
          <a href="https://policies.google.com/privacy">
            Google Privacy Policy
          </a>{" "}
          applies to Google’s handling of information through the Google Maps
          features and is incorporated here by reference.
        </p>
      </article>
    </div>
  );
}
