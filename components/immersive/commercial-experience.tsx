"use client";

import Image from "@/components/site-image";
import Link from "next/link";
import {
  memo,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import type { Project } from "@/lib/types";
import "./commercial-experience.css";

type StudyKind = "facade" | "framing" | "masonry" | "retail" | "floor";
type Study = {
  kind: StudyKind;
  image: number;
  label: string;
  focus: string;
  notes: string[];
  position?: string;
};

const studies: Record<string, Study> = {
  "raising-canes-forest-hills": {
    kind: "facade",
    image: 0,
    label: "Storefront & facade",
    focus: "A new face for a familiar name.",
    notes: [
      "Glass storefront",
      "Metal & ACM panels",
      "Exterior trim & transitions",
    ],
    position: "50% 55%",
  },
  "chick-fil-a-kingston": {
    kind: "framing",
    image: 1,
    label: "Framing & buildout",
    focus: "From the first frame to the final detail.",
    notes: [
      "Wood framing & roof trusses",
      "Partitions, drywall & ceilings",
      "Painting, doors & trim",
    ],
    position: "50% 55%",
  },
  "lidl-staten-island": {
    kind: "masonry",
    image: 0,
    label: "Masonry & restoration",
    focus: "Making the building work harder.",
    notes: [
      "Masonry & elevator-shaft repairs",
      "Exterior EIFS restoration",
      "Concrete floor grinding & sealing",
    ],
    position: "50% 48%",
  },
  "harbor-freight-bronx": {
    kind: "retail",
    image: 3,
    label: "An active-store refresh",
    focus: "A fresh start. Business as usual.",
    notes: [
      "Interior & exterior painting",
      "Partitions, patching & infill",
      "Phased work during off-hours",
    ],
    position: "50% 50%",
  },
  "lidl-harlem": {
    kind: "floor",
    image: 1,
    label: "Flooring & demolition",
    focus: "A better foundation for every day.",
    notes: [
      "Selective demolition",
      "Polished concrete floors",
      "Off-hours trade coordination",
    ],
    position: "50% 66%",
  },
};

const fallbackStudy: Study = {
  kind: "retail",
  image: 0,
  label: "Commercial renovation",
  focus: "Built around your business.",
  notes: [],
};
const point = (x: number, y: number, z = 0) =>
  `${430 + x * 0.86 - y * 0.86},${352 + x * 0.39 + y * 0.39 - z}`;
const path = (points: number[][], closed = false) =>
  points
    .map((p, i) => `${i ? "L" : "M"}${point(p[0], p[1], p[2] ?? 0)}`)
    .join(" ") + (closed ? "Z" : "");

function Plane({
  points,
  className = "",
  fill = "none",
}: {
  points: number[][];
  className?: string;
  fill?: string;
}) {
  return <path className={className} d={path(points, true)} fill={fill} />;
}

function Facade() {
  return (
    <>
      <Plane
        points={[
          [0, 0, 0],
          [440, 0, 0],
          [440, 210, 0],
          [0, 210, 0],
        ]}
        fill="url(#rr-cm-hatch)"
        className="rr-cm-foundation"
      />
      <Plane
        points={[
          [0, 210, 0],
          [440, 210, 0],
          [440, 210, 230],
          [0, 210, 230],
        ]}
        className="rr-cm-ghost"
      />
      <Plane
        points={[
          [0, 0, 0],
          [0, 210, 0],
          [0, 210, 230],
          [0, 0, 230],
        ]}
        fill="#10243a"
      />
      <Plane
        points={[
          [0, 0, 230],
          [440, 0, 230],
          [440, 210, 230],
          [0, 210, 230],
        ]}
        fill="#0e2035"
      />
      <Plane
        points={[
          [0, -22, 156],
          [440, -22, 156],
          [440, -22, 246],
          [0, -22, 246],
        ]}
        fill="#153f65"
        className="rr-cm-material"
      />
      {Array.from({ length: 22 }, (_, i) => (
        <path
          key={i}
          d={path([
            [i * 20, -22, 156],
            [i * 20, -22, 246],
          ])}
          className="rr-cm-fine"
        />
      ))}
      <Plane
        points={[
          [0, -22, 148],
          [440, -22, 148],
          [440, 22, 148],
          [0, 22, 148],
        ]}
        fill="#1c5484"
        className="rr-cm-accent"
      />
      <Plane
        points={[
          [15, -10, 6],
          [425, -10, 6],
          [425, -10, 144],
          [15, -10, 144],
        ]}
        fill="#123553"
      />
      {[15, 82, 150, 218, 287, 356, 425].map((x) => (
        <path
          key={x}
          d={path([
            [x, -10, 6],
            [x, -10, 144],
          ])}
          className="rr-cm-bright"
        />
      ))}
      <path
        d={path([
          [15, -10, 118],
          [425, -10, 118],
        ])}
      />
      <Plane
        points={[
          [22, -12, 7],
          [77, -12, 7],
          [77, -12, 116],
          [22, -12, 116],
        ]}
        className="rr-cm-bright"
      />
      {[42, 182, 320].map((x) => (
        <path
          key={x}
          d={path([
            [x, -11, 26],
            [x + 58, -11, 94],
          ])}
          className="rr-cm-reflection"
        />
      ))}
    </>
  );
}

function Framing() {
  return (
    <>
      <Plane
        points={[
          [0, 0, 0],
          [410, 0, 0],
          [410, 230, 0],
          [0, 230, 0],
        ]}
        fill="url(#rr-cm-hatch)"
      />
      {[0, 230].map((y) => (
        <g key={y}>
          <Plane
            points={[
              [0, y, 0],
              [410, y, 0],
              [410, y, 160],
              [0, y, 160],
            ]}
            fill="#10243a66"
          />
          {Array.from({ length: 18 }, (_, i) => (
            <path
              key={i}
              d={path([
                [i * 24, y, 0],
                [i * 24, y, 160],
              ])}
            />
          ))}
        </g>
      ))}
      {[0, 410].map((x) => (
        <g key={x}>
          <path
            d={path([
              [x, 0, 0],
              [x, 230, 0],
              [x, 230, 160],
              [x, 0, 160],
              [x, 0, 0],
            ])}
          />
          {Array.from({ length: 10 }, (_, i) => (
            <path
              key={i}
              d={path([
                [x, i * 24, 0],
                [x, i * 24, 160],
              ])}
            />
          ))}
        </g>
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <g key={i} className="rr-cm-accent">
          <path
            d={path([
              [i * 45, -16, 190],
              [i * 45, 115, 288],
              [i * 45, 246, 190],
              [i * 45, -16, 190],
              [i * 45, 115, 288],
              [i * 45, 115, 190],
            ])}
          />
          <path
            d={path([
              [i * 45, 48, 238],
              [i * 45, 115, 190],
              [i * 45, 182, 238],
            ])}
          />
        </g>
      ))}
      <path
        d={path([
          [0, 115, 288],
          [405, 115, 288],
        ])}
        className="rr-cm-bright"
      />
      <Plane
        points={[
          [72, -5, 0],
          [135, -5, 0],
          [135, -5, 119],
          [72, -5, 119],
        ]}
        fill="#071a2a"
        className="rr-cm-bright"
      />
      <Plane
        points={[
          [230, -5, 60],
          [350, -5, 60],
          [350, -5, 122],
          [230, -5, 122],
        ]}
        fill="#071a2a"
        className="rr-cm-bright"
      />
      <path
        d={path([
          [240, 0, 0],
          [240, 230, 0],
          [240, 230, 160],
          [240, 0, 160],
        ])}
        className="rr-cm-ghost"
      />
    </>
  );
}

function Masonry() {
  return (
    <>
      <Plane
        points={[
          [0, 0, 0],
          [400, 0, 0],
          [400, 220, 0],
          [0, 220, 0],
        ]}
        fill="url(#rr-cm-hatch)"
      />
      <Plane
        points={[
          [0, 0, 0],
          [0, 220, 0],
          [0, 220, 230],
          [0, 0, 230],
        ]}
        fill="#153149"
      />
      <Plane
        points={[
          [0, 0, 0],
          [400, 0, 0],
          [400, 0, 230],
          [0, 0, 230],
        ]}
        fill="#12324e"
      />
      {Array.from({ length: 12 }, (_, row) => (
        <g key={row} className="rr-cm-fine">
          <path
            d={path([
              [0, 0, row * 19],
              [400, 0, row * 19],
            ])}
          />
          {Array.from({ length: 13 }, (_, col) => {
            const x = col * 32 + (row % 2 ? 16 : 0);
            return (
              <path
                key={col}
                d={path([
                  [x, 0, row * 19],
                  [x, 0, row * 19 + 19],
                ])}
              />
            );
          })}
        </g>
      ))}
      <Plane
        points={[
          [62, -1, 0],
          [168, -1, 0],
          [168, -1, 148],
          [62, -1, 148],
        ]}
        fill="#061626"
        className="rr-cm-bright"
      />
      <Plane
        points={[
          [231, -1, 69],
          [349, -1, 69],
          [349, -1, 153],
          [231, -1, 153],
        ]}
        fill="#081e2e"
        className="rr-cm-bright"
      />
      <Plane
        points={[
          [208, -42, 55],
          [366, -42, 55],
          [366, -42, 181],
          [208, -42, 181],
        ]}
        fill="url(#rr-cm-hatch)"
        className="rr-cm-accent"
      />
      {[
        [208, 55],
        [366, 55],
        [366, 181],
        [208, 181],
      ].map(([x, z]) => (
        <path
          key={`${x}-${z}`}
          d={path([
            [x, 0, z],
            [x, -42, z],
          ])}
          className="rr-cm-dashed"
        />
      ))}
      <Plane
        points={[
          [0, 0, 232],
          [400, 0, 232],
          [400, 220, 232],
          [0, 220, 232],
        ]}
        fill="#112a4066"
        className="rr-cm-ghost"
      />
      <Plane
        points={[
          [40, 55, -36],
          [360, 55, -36],
          [360, 200, -36],
          [40, 200, -36],
        ]}
        fill="#154b7444"
        className="rr-cm-accent"
      />
    </>
  );
}

function Retail() {
  return (
    <>
      <Plane
        points={[
          [0, 0, 0],
          [490, 0, 0],
          [490, 200, 0],
          [0, 200, 0],
        ]}
        fill="url(#rr-cm-hatch)"
      />
      <Plane
        points={[
          [0, 0, 0],
          [0, 200, 0],
          [0, 200, 190],
          [0, 0, 190],
        ]}
        fill="#14364f"
      />
      <Plane
        points={[
          [0, 0, 190],
          [490, 0, 190],
          [490, 200, 190],
          [0, 200, 190],
        ]}
        fill="#10263a"
      />
      <Plane
        points={[
          [0, -4, 0],
          [490, -4, 0],
          [490, -4, 190],
          [0, -4, 190],
        ]}
        fill="#194768"
      />
      <Plane
        points={[
          [0, -10, 139],
          [490, -10, 139],
          [490, -10, 171],
          [0, -10, 171],
        ]}
        fill="#2472ae"
        className="rr-cm-accent"
      />
      <Plane
        points={[
          [151, -13, 12],
          [321, -13, 12],
          [321, -13, 129],
          [151, -13, 129],
        ]}
        fill="#081f32"
        className="rr-cm-bright"
      />
      {[193, 236, 278].map((x) => (
        <path
          key={x}
          d={path([
            [x, -13, 12],
            [x, -13, 129],
          ])}
        />
      ))}
      <Plane
        points={[
          [25, -13, 20],
          [111, -13, 20],
          [111, -13, 105],
          [25, -13, 105],
        ]}
        fill="url(#rr-cm-hatch)"
        className="rr-cm-accent"
      />
      <Plane
        points={[
          [367, -13, 20],
          [461, -13, 20],
          [461, -13, 105],
          [367, -13, 105],
        ]}
        className="rr-cm-ghost"
      />
      {[130, 190, 270, 335].map((x) => (
        <g key={x}>
          <path
            d={path([
              [x, -57, 0],
              [x, -57, 45],
            ])}
            className="rr-cm-bright"
          />
          <path
            d={path([
              [x - 3, -57, 0],
              [x - 3, -57, 45],
            ])}
            className="rr-cm-accent"
          />
        </g>
      ))}
      <path
        d={path([
          [150, 0, 0],
          [150, 200, 0],
          [150, 200, 160],
          [150, 0, 160],
        ])}
        className="rr-cm-ghost"
      />
    </>
  );
}

function Floor() {
  return (
    <>
      <Plane
        points={[
          [0, 0, -27],
          [450, 0, -27],
          [450, 285, -27],
          [0, 285, -27],
        ]}
        fill="#102c47"
      />
      <Plane
        points={[
          [0, 0, 0],
          [450, 0, 0],
          [450, 285, 0],
          [0, 285, 0],
        ]}
        fill="url(#rr-cm-hatch)"
      />
      <Plane
        points={[
          [0, 0, 24],
          [450, 0, 24],
          [450, 285, 24],
          [0, 285, 24],
        ]}
        fill="#174e79"
        className="rr-cm-accent"
      />
      {[0, 112, 224, 336, 450].map((x) => (
        <path
          key={x}
          d={path([
            [x, 0, 24],
            [x, 285, 24],
          ])}
          className="rr-cm-fine"
        />
      ))}
      {[0, 95, 190, 285].map((y) => (
        <path
          key={y}
          d={path([
            [0, y, 24],
            [450, y, 24],
          ])}
          className="rr-cm-fine"
        />
      ))}
      <Plane
        points={[
          [0, 285, 24],
          [450, 285, 24],
          [450, 285, 210],
          [0, 285, 210],
        ]}
        className="rr-cm-ghost"
      />
      <Plane
        points={[
          [0, 0, 24],
          [0, 285, 24],
          [0, 285, 210],
          [0, 0, 210],
        ]}
        className="rr-cm-ghost"
      />
      {[65, 250].map((x) => (
        <g key={x}>
          <Plane
            points={[
              [x, 53, 24],
              [x + 80, 53, 24],
              [x + 80, 237, 24],
              [x, 237, 24],
            ]}
            fill="#0c2135"
          />
          <Plane
            points={[
              [x, 53, 24],
              [x, 237, 24],
              [x, 237, 117],
              [x, 53, 117],
            ]}
            fill="#12324d"
          />
          {[56, 86, 117].map((z) => (
            <Plane
              key={z}
              points={[
                [x, 53, z],
                [x + 80, 53, z],
                [x + 80, 237, z],
                [x, 237, z],
              ]}
              className="rr-cm-fine"
            />
          ))}
        </g>
      ))}
      <Plane
        points={[
          [34, -48, 105],
          [173, -48, 105],
          [173, 42, 105],
          [34, 42, 105],
        ]}
        fill="#19374c88"
        className="rr-cm-dashed"
      />
      <path
        d={path([
          [34, -48, 24],
          [34, -48, 105],
        ])}
        className="rr-cm-dashed"
      />
    </>
  );
}

const DraftingStudy = memo(function DraftingStudy({
  kind,
}: {
  kind: StudyKind;
}) {
  return (
    <svg
      className="rr-cm-study-svg"
      viewBox="0 0 1100 750"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="rr-cm-hatch"
          width="12"
          height="12"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(28)"
        >
          <rect width="12" height="12" fill="#0c2238" />
          <path d="M0 0V12" stroke="#265477" strokeWidth="1" />
        </pattern>
      </defs>
      <g className="rr-cm-ground">
        {Array.from({ length: 13 }, (_, i) => (
          <path
            key={`x${i}`}
            d={path([
              [-160 + i * 60, -160, -42],
              [-160 + i * 60, 470, -42],
            ])}
          />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <path
            key={`y${i}`}
            d={path([
              [-160, -160 + i * 60, -42],
              [580, -160 + i * 60, -42],
            ])}
          />
        ))}
      </g>
      <g className="rr-cm-study-lines">
        {kind === "facade" ? (
          <Facade />
        ) : kind === "framing" ? (
          <Framing />
        ) : kind === "masonry" ? (
          <Masonry />
        ) : kind === "floor" ? (
          <Floor />
        ) : (
          <Retail />
        )}
      </g>
      <g className="rr-cm-dimensions">
        <path
          d={path([
            [-65, -70, 0],
            [520, -70, 0],
          ])}
        />
        <path
          d={path([
            [-65, -84, 0],
            [-65, -56, 0],
          ])}
        />
        <path
          d={path([
            [520, -84, 0],
            [520, -56, 0],
          ])}
        />
        <path
          d={path([
            [-58, -10, 0],
            [-58, 325, 0],
          ])}
        />
        <path
          d={path([
            [-72, -10, 0],
            [-44, -10, 0],
          ])}
        />
        <path
          d={path([
            [-72, 325, 0],
            [-44, 325, 0],
          ])}
        />
        <path d="M160 167H241L319 219M767 378L878 319H974M414 598L440 661H597" />
        <circle cx="319" cy="219" r="4" />
        <circle cx="767" cy="378" r="4" />
        <circle cx="414" cy="598" r="4" />
        <text x="160" y="153">
          01 /{" "}
          {kind === "framing"
            ? "STRUCTURE"
            : kind === "floor"
              ? "SELECTIVE DEMOLITION"
              : "BUILDING ENVELOPE"}
        </text>
        <text x="879" y="305">
          02 /{" "}
          {kind === "facade"
            ? "FACADE"
            : kind === "floor"
              ? "SURFACE"
              : "FINISHES"}
        </text>
        <text x="450" y="683">
          03 / FIELD COORDINATION
        </text>
      </g>
    </svg>
  );
});

function Arrow({ direction = "right" }: { direction?: "right" | "left" }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={direction === "left" ? { transform: "rotate(180deg)" } : undefined}
    >
      <path d="M4 12h15M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function CommercialExperience({
  projects,
  initialSlug,
}: {
  projects: Project[];
  initialSlug?: string;
}) {
  const sorted = projects;
  const defaultSlug =
    projects.find((project) => project.slug === "raising-canes-forest-hills")
      ?.slug ?? projects[0]?.slug;
  const [slug, setSlug] = useState(
    initialSlug && projects.some((p) => p.slug === initialSlug)
      ? initialSlug
      : defaultSlug,
  );
  const [reveal, setReveal] = useState(0);
  const [playing, setPlaying] = useState(false);
  const progressRef = useRef(0);
  const autoTimer = useRef<number | undefined>(undefined);
  const projectRail = useRef<HTMLElement>(null);
  const selected = sorted.find((p) => p.slug === slug) ?? sorted[0];
  const study = studies[selected?.slug] ?? fallbackStudy;
  const selectedIndex = sorted.findIndex((p) => p.slug === selected?.slug);
  const photo = selected?.images[study.image] ?? selected?.images[0];

  useEffect(() => {
    const rail = projectRail.current;
    const active = rail?.querySelector<HTMLElement>("[aria-current]");
    if (!rail || !active || rail.scrollWidth <= rail.clientWidth) return;
    const left =
      active.getBoundingClientRect().left -
      rail.getBoundingClientRect().left +
      rail.scrollLeft -
      (rail.clientWidth - active.clientWidth) / 2;
    rail.scrollTo({ left, behavior: "instant" });
  }, [selected?.slug]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    autoTimer.current = window.setTimeout(() => setPlaying(true), 1600);
    return () => window.clearTimeout(autoTimer.current);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const beginning = progressRef.current;
    let started: number | null = null;
    let frame = 0;
    const tick = (time: number) => {
      started ??= time;
      const next = Math.min(100, beginning + (time - started) / 46);
      progressRef.current = next;
      setReveal(next);
      if (next < 100) frame = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  useEffect(() => {
    const restore = () => {
      window.clearTimeout(autoTimer.current);
      const requested = new URL(window.location.href).searchParams.get(
        "project",
      );
      const valid = projects.some((p) => p.slug === requested)
        ? requested!
        : defaultSlug;
      setSlug(valid);
      progressRef.current = 0;
      setReveal(0);
      setPlaying(false);
    };
    const pause = () => {
      if (document.hidden) {
        window.clearTimeout(autoTimer.current);
        setPlaying(false);
      }
    };
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const respectMotion = () => {
      if (motionPreference.matches) {
        window.clearTimeout(autoTimer.current);
        setPlaying(false);
      }
    };
    window.addEventListener("popstate", restore);
    document.addEventListener("visibilitychange", pause);
    motionPreference.addEventListener("change", respectMotion);
    return () => {
      window.removeEventListener("popstate", restore);
      document.removeEventListener("visibilitychange", pause);
      motionPreference.removeEventListener("change", respectMotion);
    };
  }, [projects, defaultSlug]);

  if (!selected)
    return (
      <section className="rr-cm-empty">
        <h1>Commercial renovations</h1>
        <p>Retail, restaurants and spaces built around your business.</p>
        <Link href="/contact?type=commercial">
          Tell us about your project <Arrow />
        </Link>
      </section>
    );

  const changeProject = (
    next: Project,
    event?: MouseEvent<HTMLAnchorElement>,
  ) => {
    if (
      event &&
      (event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0)
    )
      return;
    event?.preventDefault();
    window.clearTimeout(autoTimer.current);
    if (next.slug === selected.slug) return;
    setSlug(next.slug);
    progressRef.current = 0;
    setReveal(0);
    setPlaying(false);
    const url = new URL(window.location.href);
    url.searchParams.set("project", next.slug);
    window.history.pushState({}, "", url);
  };

  const play = () => {
    window.clearTimeout(autoTimer.current);
    if (playing) {
      setPlaying(false);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const next = reveal >= 100 ? 0 : 100;
      progressRef.current = next;
      setReveal(next);
      return;
    }
    if (progressRef.current >= 100) {
      progressRef.current = 0;
      setReveal(0);
    }
    setPlaying(true);
  };

  return (
    <section
      className="rr-cm"
      aria-label="Commercial project experience"
      style={{ "--rr-cm-reveal": `${reveal}%` } as CSSProperties}
    >
      <div className="rr-cm-heading">
        <span className="rr-cm-eyebrow">
          <span />
          Commercial renovations
        </span>
        <Link href="/residential">
          Explore residential <Arrow />
        </Link>
      </div>

      <div className="rr-cm-workspace">
        <div className="rr-cm-story" key={`story-${selected.slug}`}>
          <p className="rr-cm-index">
            Project {String(selectedIndex + 1).padStart(2, "0")}{" "}
            <span>/ {String(sorted.length).padStart(2, "0")}</span>
          </p>
          <h1>{selected.title}</h1>
          <p className="rr-cm-location">{selected.location}</p>
          <h2>{study.focus}</h2>
          <p className="rr-cm-description">{selected.description}</p>
          <ol className="rr-cm-scope">
            {(study.notes.length
              ? study.notes
              : selected.scope.slice(0, 3)
            ).map((note, i) => (
              <li key={note}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                {note}
              </li>
            ))}
          </ol>
          <Link
            href={`/projects/${selected.slug}`}
            className="rr-cm-project-link"
          >
            Explore the project <Arrow />
          </Link>
        </div>

        <div className="rr-cm-stage" key={`stage-${selected.slug}`}>
          <div className="rr-cm-stage-top">
            <span>{study.label}</span>
            <span className="rr-cm-live">
              <span />
              {reveal >= 99 ? "On site" : "Project study"}
            </span>
          </div>
          <div className="rr-cm-drawing">
            <DraftingStudy kind={study.kind} />
          </div>
          {photo && (
            <div
              className="rr-cm-photograph"
              style={{ clipPath: `inset(0 ${100 - reveal}% 0 0)` }}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 800px) 100vw, 70vw"
                loading="eager"
                fetchPriority="high"
                style={{ objectPosition: study.position }}
              />
              <div className="rr-cm-photo-shade" />
              <span className="rr-cm-photo-credit">
                Actual project photography
              </span>
            </div>
          )}
          <div
            className="rr-cm-scan"
            style={{
              left: `${reveal}%`,
              opacity: reveal > 0 && reveal < 100 ? 1 : 0,
            }}
            aria-hidden="true"
          >
            <span />
            <span />
          </div>
          <div className="rr-cm-stage-bottom">
            <span>
              {reveal >= 99
                ? study.kind === "framing"
                  ? "On site · Kingston"
                  : "The work, in real life"
                : "Illustrative project study"}
            </span>
            <Link href={`/projects/${selected.slug}`}>
              {selected.images.length} project photos <Arrow />
            </Link>
          </div>
          <span className="rr-cm-corner rr-cm-corner-tl" aria-hidden="true" />
          <span className="rr-cm-corner rr-cm-corner-tr" aria-hidden="true" />
          <span className="rr-cm-corner rr-cm-corner-bl" aria-hidden="true" />
          <span className="rr-cm-corner rr-cm-corner-br" aria-hidden="true" />
        </div>

        <div className="rr-cm-console">
          <p>
            <span>From the drawing</span>
            <strong>To the real thing.</strong>
          </p>
          <button
            type="button"
            className="rr-cm-play"
            onClick={play}
            aria-label={
              playing
                ? "Pause project reveal"
                : reveal >= 100
                  ? "Replay project reveal"
                  : "Play project reveal"
            }
          >
            {playing ? (
              <svg
                width="16"
                height="18"
                viewBox="0 0 16 18"
                aria-hidden="true"
              >
                <path
                  d="M3 2v14M12 2v14"
                  stroke="currentColor"
                  strokeWidth="3"
                />
              </svg>
            ) : (
              <svg
                width="16"
                height="18"
                viewBox="0 0 16 18"
                fill="none"
                aria-hidden="true"
              >
                <path d="m3 2 11 7-11 7V2Z" fill="currentColor" />
              </svg>
            )}
          </button>
          <div className="rr-cm-slider">
            <label htmlFor="rr-cm-reveal">
              <span>Drawing</span>
              <span>Real project</span>
            </label>
            <input
              id="rr-cm-reveal"
              type="range"
              min="0"
              max="100"
              step="1"
              value={Math.round(reveal)}
              aria-label="Reveal real project photography"
              aria-valuetext={`${Math.round(reveal)} percent photography revealed`}
              onChange={(event) => {
                window.clearTimeout(autoTimer.current);
                setPlaying(false);
                progressRef.current = Number(event.target.value);
                setReveal(Number(event.target.value));
              }}
            />
            <span className="rr-cm-slider-hint">
              Drag to bring the project to life
            </span>
          </div>
          <span className="rr-cm-progress" aria-hidden="true">
            {String(Math.round(reveal)).padStart(2, "0")}
            <small>%</small>
          </span>
        </div>
      </div>

      <div className="rr-cm-projects-header">
        <span>Explore our commercial work</span>
        <span>
          {sorted.length} projects <span aria-hidden="true">↘</span>
        </span>
      </div>
      <nav
        ref={projectRail}
        className="rr-cm-projects"
        aria-label="Commercial projects"
      >
        {sorted.map((project, i) => {
          const config = studies[project.slug] ?? fallbackStudy;
          const thumb = project.images[config.image] ?? project.images[0];
          return (
            <a
              key={project.id}
              href={`/commercial?project=${project.slug}`}
              className={`rr-cm-project ${project.slug === selected.slug ? "is-selected" : ""}`}
              aria-current={project.slug === selected.slug ? "true" : undefined}
              onClick={(event) => changeProject(project, event)}
            >
              <span className="rr-cm-project-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="rr-cm-thumbnail">
                {thumb && <Image src={thumb.src} alt="" fill sizes="80px" />}
              </span>
              <span className="rr-cm-project-name">
                <strong>{project.title}</strong>
                <span>{project.location.replace(", New York", "")}</span>
              </span>
              <span className="rr-cm-project-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          );
        })}
      </nav>
      <p className="rr-cm-bottom-note">
        Retail. Restaurants. Spaces that work.{" "}
        <Link href="/contact?type=commercial">
          Build with Reliant <Arrow />
        </Link>
      </p>
      <noscript>
        <style>{`.rr-cm-console,.rr-cm-live,.rr-cm-stage-bottom>span{display:none!important}.rr-cm-photograph{clip-path:none!important}.rr-cm-drawing{opacity:0!important}`}</style>
        <p className="rr-cm-noscript">
          Select a project above to explore the work and view its full photo
          gallery.
        </p>
      </noscript>
      <span className="rr-cm-sr" role="status" aria-live="polite">
        {selected.title}. {selected.subtitle}.
      </span>
    </section>
  );
}
