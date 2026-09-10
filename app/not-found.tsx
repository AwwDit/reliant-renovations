import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { websiteCopy } from "@/lib/website-copy";
import "./(site)/foundation.css";
export default function NotFound() {
  return (
    <div className="rf-site rf-not-found">
      <main className="rf-container">
        <Link
          href="/"
          aria-label="Reliant Renovations home"
          className="rf-not-found-logo"
        >
          <Image
            src="/images/brand/reliant-white-transparent.png"
            alt="Reliant Renovations Inc."
            width={100}
            height={72}
          />
        </Link>
        <p>404</p>
        <h1>Page not found</h1>
        <p>
          This page may have moved, or the project is no longer in our
          portfolio.
        </p>
        <div>
          <Link href="/projects" className="rf-button">
            {websiteCopy.secondaryAction}{" "}
            <span>
              <ArrowUpRight size={20} aria-hidden="true" />
            </span>
          </Link>
          <Link href="/" className="rf-text-link">
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
