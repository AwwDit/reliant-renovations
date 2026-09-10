"use client";

import { useEffect, useRef } from "react";
import Image from "@/components/site-image";
import { ArrowCounterClockwise } from "@phosphor-icons/react";
import {
  rrProfiles,
  rrDatums,
  rrConstructionArcs,
  rrWitnesses,
} from "@/lib/logo-cad-geometry";
import "./brand-entrance.css";

export function BrandEntrance({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const mark = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const settle = () => {
    if (mark.current) mark.current.dataset.reveal = "complete";
  };
  const play = () => {
    const element = mark.current;
    if (
      !element ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    if (timer.current) clearTimeout(timer.current);
    element.dataset.reveal = "reset";
    void element.offsetWidth;
    element.dataset.reveal = "playing";
    timer.current = setTimeout(settle, 2250);
  };

  useEffect(() => {
    // CSS starts on the server-rendered mark. JS only enables replay and cleanup.
    if (mark.current) mark.current.dataset.enhanced = "true";
    timer.current = setTimeout(settle, 2250);
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stop = () => {
      if (preference.matches) settle();
    };
    stop();
    preference.addEventListener("change", stop);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      preference.removeEventListener("change", stop);
    };
  }, []);

  return (
    <figure className={`be-mark-wrap ${className}`}>
      <noscript>
        <style>{`.be-mark .be-drawing{display:none!important}.be-mark .be-final{animation:none!important}`}</style>
      </noscript>
      <div className="be-mark" ref={mark} data-reveal="playing">
        <svg className="be-drawing" viewBox="0 0 474 335" aria-hidden="true">
          <g className="be-study">
            <g className="be-datums">
              {rrDatums.map((path, index) => (
                <path key={path} d={path} pathLength="1" data-order={index} />
              ))}
            </g>
            <g className="be-witnesses">
              {rrWitnesses.map((path) => (
                <path key={path} d={path} pathLength="1" />
              ))}
            </g>
            <g className="be-projection" transform="translate(8 8)">
              {rrProfiles.map((profile) => (
                <path key={profile.id} d={profile.path} pathLength="1" />
              ))}
            </g>
            <g className="be-profiles">
              {rrProfiles.map((profile) => (
                <path
                  key={profile.id}
                  d={profile.path}
                  pathLength="1"
                  data-part={profile.id}
                />
              ))}
            </g>
            <g className="be-arcs">
              {rrConstructionArcs.map((path) => (
                <path key={path} d={path} pathLength="1" />
              ))}
            </g>
          </g>
        </svg>
        <Image
          className="be-final be-color"
          src="/images/brand/reliant-color-transparent.png"
          alt="Reliant Renovations Inc."
          width={474}
          height={335}
          loading="eager"
          fetchPriority="high"
          sizes="(max-width: 400px) 75vw, 300px"
        />
        <Image
          className="be-final be-white"
          src="/images/brand/reliant-white-transparent.png"
          alt="Reliant Renovations Inc."
          width={474}
          height={335}
          loading="eager"
          fetchPriority="high"
          sizes="(max-width: 400px) 75vw, 300px"
        />
      </div>
      {!compact && (
        <figcaption className="be-caption">
          <span>Monogram study</span>
          <button
            className="be-replay"
            type="button"
            onClick={play}
            aria-label="Replay logo drawing"
            title="Replay logo drawing"
          >
            <ArrowCounterClockwise size={17} aria-hidden="true" />
          </button>
        </figcaption>
      )}
    </figure>
  );
}
