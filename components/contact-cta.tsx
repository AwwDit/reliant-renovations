import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
export function ContactCta({ division }: { division?: string }) {
  return (
    <section className="sp-contact-cta container">
      <p className="sp-kicker">
        Your next {division ? division + " " : ""}project
      </p>
      <Link href={division ? "/contact?type=" + division : "/contact"}>
        <h2>
          What do you
          <br />
          have in mind?
        </h2>
        <ArrowUpRight size={64} />
      </Link>
      <p>Tell us about your space. We’ll start with a conversation.</p>
    </section>
  );
}
