"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";
import type { Project } from "@/lib/types";

export function PhotoStack({
  residential,
  commercial,
}: {
  residential?: Project;
  commercial?: Project;
}) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current;
    if (
      !element ||
      !window.matchMedia(
        "(hover: hover) and (prefers-reduced-motion: no-preference)",
      ).matches
    )
      return;
    let frame = 0;
    function move(event: PointerEvent) {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = element!.getBoundingClientRect();
        element!.style.setProperty(
          "--photo-x",
          `${((event.clientX - bounds.left) / bounds.width) * 4 - 2}deg`,
        );
        element!.style.setProperty(
          "--photo-y",
          `${-(((event.clientY - bounds.top) / bounds.height) * 4 - 2)}deg`,
        );
      });
    }
    function reset() {
      cancelAnimationFrame(frame);
      element!.style.setProperty("--photo-x", "0deg");
      element!.style.setProperty("--photo-y", "0deg");
    }
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerleave", reset);
    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", reset);
    };
  }, []);
  return (
    <div className="rf-photo-stack" ref={host}>
      {commercial?.images[0] && (
        <Link
          href={`/projects/${commercial.slug}`}
          className="rf-stack-photo rf-stack-back"
        >
          <div>
            <Image
              src={commercial.images[0].src}
              alt={commercial.images[0].alt}
              fill
              sizes="(max-width: 700px) 55vw, 27vw"
              loading="eager"
            />
          </div>
          <span>
            Commercial <ArrowUpRight size={16} aria-hidden="true" />
          </span>
        </Link>
      )}
      {residential?.images[0] && (
        <Link
          href={`/projects/${residential.slug}`}
          className="rf-stack-photo rf-stack-front"
        >
          <div>
            <Image
              src={residential.images[0].src}
              alt={residential.images[0].alt}
              fill
              sizes="(max-width: 700px) 75vw, 35vw"
              loading="eager"
              fetchPriority="high"
            />
          </div>
          <span>
            <span>
              {residential.title}
              <small>
                Residential renovation · {residential.location.split(",")[0]}
              </small>
            </span>
            <span className="rf-stack-arrow">
              <ArrowUpRight size={21} aria-hidden="true" />
            </span>
          </span>
        </Link>
      )}
      <span className="rf-stack-shadow" aria-hidden="true" />
    </div>
  );
}
