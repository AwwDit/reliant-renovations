import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { websiteCopy } from "@/lib/website-copy";
import type { Division } from "@/lib/types";
import "./client-introduction.css";

export function ClientIntroduction({ division }: { division?: Division }) {
  const title = division
    ? websiteCopy.divisions[division].title
    : websiteCopy.headline;
  const introduction = division
    ? websiteCopy.divisions[division].introduction
    : websiteCopy.homeIntroduction;
  return (
    <section
      className="uf-client-introduction rf-container"
      id="company-introduction"
      aria-labelledby="client-introduction-title"
    >
      {division ? (
        <h1 id="client-introduction-title">{title}</h1>
      ) : (
        <h2 id="client-introduction-title">{title}</h2>
      )}
      <div>
        <p>{introduction}</p>
        <div className="uf-client-actions">
          <Link
            href={`/contact${division ? `?type=${division}` : ""}`}
            className="rf-button"
          >
            {websiteCopy.primaryAction}
            <span>
              <ArrowUpRight size={20} aria-hidden="true" />
            </span>
          </Link>
          <Link
            href={`/projects${division ? `?type=${division}` : ""}`}
            className="rf-text-link"
          >
            {websiteCopy.secondaryAction}
            <ArrowUpRight size={20} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
