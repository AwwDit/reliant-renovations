import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import "@/components/craft/supporting.css";
export const metadata = pageMetadata(
  "Privacy Notice",
  "How Reliant Renovations uses the information you share through this website and its project inquiry form.",
  "/privacy",
);
export const dynamic = "force-dynamic";
export default function Privacy() {
  return (
    <div className="rf-container rf-privacy">
      <aside>
        <p className="rf-legal-kicker">Reliant Renovations</p>
        <p className="rf-privacy-label">
          Your information.
          <br />
          Handled with care.
        </p>
      </aside>
      <article className="rf-legal">
        <h1>Privacy notice</h1>
        <p>
          This notice explains how Reliant Renovations Inc. uses information
          submitted through this website.
        </p>
        <h2>Information you share</h2>
        <p>
          The project inquiry form collects your name, email, optional phone
          number and company, project location, project type, desired timing and
          description. If you attach a photo or document, it is stored with your
          inquiry. Please avoid including sensitive personal information in your
          message or files.
        </p>
        <h2>How we use your information</h2>
        <p>
          We use the information you provide to review your project and respond
          to your inquiry. Inquiries and attachments are stored for the team to
          review through a protected dashboard. When email notifications are
          configured, inquiry details are also sent to the business inbox
          through our email delivery provider.
        </p>
        <h2>Site storage and analytics</h2>
        <p>
          An essential session cookie is used for administrator sign-in. If
          optional Google Analytics is enabled, the site asks before loading it
          and stores your analytics preference in your browser. You can reset
          your choice by clearing this site’s browser storage.
        </p>
        <h2>Access and retention</h2>
        <p>
          Inquiry information is available to authorized administrators and the
          service providers needed to operate the site. To request access to,
          correction of, or deletion of your submitted information,{" "}
          {site.email ? (
            <a href={`mailto:${site.email}`}>email {site.email}</a>
          ) : (
            <a href="/contact">contact us through the inquiry form</a>
          )}
          .
        </p>
        <h2>Third-party links</h2>
        <p>
          This website links to social platforms, which operate under their own
          privacy policies.
        </p>
      </article>
    </div>
  );
}
