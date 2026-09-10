"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";

gsap.registerPlugin(Flip);

/** Keep real route links while giving the visible project collection an exit. */
export function SiteTransitions({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const pending = useRef<{
    href: string;
    navigating: boolean;
    restore: () => void;
  } | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Also runs on history navigation and on leaving this site layout.
    return () => {
      pending.current?.restore();
      pending.current = null;
    };
  }, [pathname]);

  function navigate(event: MouseEvent<HTMLDivElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;

    const anchor =
      event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (
      !(anchor instanceof HTMLAnchorElement) ||
      (anchor.target && anchor.target !== "_self") ||
      anchor.hasAttribute("download")
    )
      return;

    const destination = new URL(anchor.href, window.location.href);
    const isDivision =
      destination.origin === window.location.origin &&
      ["/residential", "/commercial"].includes(destination.pathname) &&
      !destination.search &&
      !destination.hash;

    if (!isDivision || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      pending.current?.restore();
      pending.current = null;
      return;
    }

    if (destination.pathname === pathname) {
      if (pending.current) {
        event.preventDefault();
        pending.current.restore();
        pending.current = null;
        // Supersede a navigation that may already be fetching the other route.
        router.push(pathname, { scroll: false });
      }
      return;
    }

    if (pending.current) {
      event.preventDefault();
      pending.current.href = destination.pathname;
      if (pending.current.navigating) router.push(destination.pathname);
      return;
    }

    const portfolio =
      root.current?.querySelector<HTMLElement>(".unfold-portfolio");
    const stage = portfolio?.querySelector<HTMLElement>(".uf-stage");
    if (!portfolio || !stage) return;
    const bounds = stage.getBoundingClientRect();
    // A hero or service section should never wait for offscreen panels.
    if (bounds.bottom <= 84 || bounds.top >= window.innerHeight) return;

    event.preventDefault();
    router.prefetch(destination.pathname);
    const panels = gsap.utils.toArray<HTMLElement>(".uf-panel", stage);
    Flip.killFlipsOf(panels, true);
    // Finish an entrance or interrupted accordion expansion before the exit.
    gsap.getTweensOf(panels).forEach((tween) => tween.progress(1));
    const mobile = matchMedia("(max-width: 1000px)").matches;
    const index = portfolio.querySelector<HTMLElement>(".uf-index");
    const restore = () => {
      clearTimeout(recovery);
      context.revert();
      portfolio.removeAttribute("data-uf-transition");
      portfolio.removeAttribute("aria-busy");
      stage.inert = false;
      if (index) index.inert = false;
    };
    pending.current = {
      href: destination.pathname,
      navigating: false,
      restore,
    };
    portfolio.dataset.ufTransition = "leaving";
    portfolio.setAttribute("aria-busy", "true");
    stage.inert = true;
    if (index) index.inert = true;

    const context = gsap.context(() => {
      gsap
        .timeline({
          onComplete: () => {
            if (pending.current) {
              pending.current.navigating = true;
              router.push(pending.current.href);
            }
          },
        })
        .to(
          portfolio.querySelectorAll(".uf-index, .uf-mobile-heading"),
          { opacity: 0, y: -6, duration: 0.2, ease: "power2.in" },
          0,
        )
        .to(
          panels,
          {
            yPercent: mobile ? -12 : -22,
            clipPath: "inset(0% 0% 100% 0%)",
            duration: mobile ? 0.32 : 0.38,
            stagger: { amount: mobile ? 0.12 : 0.16 },
            ease: "power3.inOut",
          },
          0,
        );
    }, portfolio);

    // A slow or failed route request must not leave the current collection hidden.
    const recovery = setTimeout(() => {
      restore();
      pending.current = null;
    }, 3000);
  }

  return (
    <div className="rf-site" ref={root} onClickCapture={navigate}>
      {children}
    </div>
  );
}
