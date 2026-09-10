"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Image from "next/image";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  List,
  Plus,
  X,
} from "@phosphor-icons/react";
import { WorldPage } from "./world-page";
import { useWorldScene } from "./world-shell";
import type { JourneyChapter, JourneyFeature } from "@/lib/world-journeys";
import type { Division, Project } from "@/lib/types";
import "./division-journey.css";

const subscribeHydration = () => () => {};
const clientHydrated = () => true;
const serverHydrated = () => false;

function FeaturePins({
  chapter,
  onSelect,
}: {
  chapter: JourneyChapter;
  onSelect: (feature: JourneyFeature) => void;
}) {
  const [geometry, setGeometry] = useState({
    width: 0,
    height: 0,
    sourceWidth: 0,
    sourceHeight: 0,
  });
  useEffect(() => {
    const resize = () => {
      const frame = Array.from(
        document.querySelectorAll<HTMLElement>(".world-frame"),
      ).find((element) => element.dataset.scene === chapter.scene.id);
      const img = frame?.querySelector("img");
      setGeometry({
        width: window.innerWidth,
        height: window.innerHeight,
        sourceWidth: img?.naturalWidth || 0,
        sourceHeight: img?.naturalHeight || 0,
      });
    };
    // Reuse the responsive image already requested by WorldShell.
    const frame = requestAnimationFrame(resize);
    window.addEventListener("resize", resize);
    document.addEventListener("load", resize, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("load", resize, true);
    };
  }, [chapter.scene.id, chapter.scene.image]);
  const { width, height, sourceWidth, sourceHeight } = geometry;
  const scale = sourceWidth
    ? Math.max(width / sourceWidth, height / sourceHeight)
    : 0;
  const position = (chapter.scene.position || "50% 50%")
    .split(" ")
    .map(parseFloat);
  return (
    <div
      className="journey-pins"
      role="group"
      aria-label="Details in this scene"
    >
      {chapter.features.map((feature) => {
        const x =
          ((width - sourceWidth * scale) * position[0]) / 100 +
          (feature.x / 100) * sourceWidth * scale;
        const y =
          ((height - sourceHeight * scale) * position[1]) / 100 +
          (feature.y / 100) * sourceHeight * scale;
        const visible =
          scale > 0 && x > 28 && x < width - 28 && y > 112 && y < height - 130;
        return (
          <button
            type="button"
            className="journey-pin"
            key={feature.id}
            onClick={() => onSelect(feature)}
            style={{
              left: x,
              top: y,
              visibility: visible ? "visible" : "hidden",
            }}
            aria-label={`Explore ${feature.title}`}
          >
            <Plus size={17} weight="light" aria-hidden="true" />
            <span>{feature.title}</span>
          </button>
        );
      })}
    </div>
  );
}

export function DivisionJourney({
  division,
  chapters,
  projects,
}: {
  division: Division;
  chapters: JourneyChapter[];
  projects: Project[];
}) {
  const [active, setActive] = useState(0);
  const [feature, setFeature] = useState<JourneyFeature | null>(null);
  const [indexOpen, setIndexOpen] = useState(false);
  const enhanced = useSyncExternalStore(
    subscribeHydration,
    clientHydrated,
    serverHydrated,
  );
  const root = useRef<HTMLDivElement>(null);
  const { setScene } = useWorldScene();
  const chapter = chapters[active] || chapters[0];
  const lastTrigger = useRef<HTMLElement | null>(null);
  const indexTrigger = useRef<HTMLButtonElement>(null);
  const indexPanel = useRef<HTMLDivElement>(null);
  const modalOpen = useRef(false);
  const pendingChapter = useRef<number | null>(null);
  const navigationTarget = useRef<string | null>(null);
  const indexTarget = useRef<string | null>(null);
  const navigationFrame = useRef(0);

  const scrollChapter = useCallback(
    (index: number, instant = false) => {
      const next = chapters[index];
      if (!next) return;
      setActive(index);
      const section = document.getElementById(next.id);
      const bounds = section?.getBoundingClientRect();
      navigationTarget.current =
        bounds &&
        bounds.top <= innerHeight * 0.55 &&
        bounds.bottom >= innerHeight * 0.4
          ? null
          : next.id;
      section?.focus({ preventScroll: true });
      section?.scrollIntoView({
        block: "start",
        behavior:
          instant ||
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
      });
    },
    [chapters],
  );

  const moveTo = useCallback(
    (index: number, updateHash = true) => {
      const next = chapters[index];
      if (!next) return;
      if (updateHash)
        window.history.replaceState(window.history.state, "", `#${next.id}`);
      if (modalOpen.current) {
        pendingChapter.current = index;
        setIndexOpen(false);
        setFeature(null);
        return;
      }
      scrollChapter(index);
    },
    [chapters, scrollChapter],
  );

  const restoreFocus = (event: Event) => {
    event.preventDefault();
    modalOpen.current = false;
    const pending = pendingChapter.current;
    pendingChapter.current = null;
    if (pending !== null) {
      // Wait until Radix releases body scrolling and its modal focus scope.
      navigationFrame.current = requestAnimationFrame(() => {
        navigationFrame.current = requestAnimationFrame(() =>
          scrollChapter(pending),
        );
      });
    } else {
      const trigger = lastTrigger.current;
      if (
        trigger?.isConnected &&
        trigger !== document.body &&
        trigger !== document.documentElement &&
        trigger.getClientRects().length
      )
        trigger.focus({ preventScroll: true });
      else indexTrigger.current?.focus({ preventScroll: true });
    }
  };

  const openIndex = useCallback((target: string | null = null) => {
    lastTrigger.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    modalOpen.current = true;
    indexTarget.current = target;
    setFeature(null);
    setIndexOpen(true);
  }, []);

  useEffect(() => {
    const handleHash = () => {
      let hash = "";
      try {
        hash = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        return;
      }
      if (hash === "division-services" || hash === "division-work") {
        openIndex(hash);
        return;
      }
      const index =
        hash === "entry" ? 0 : chapters.findIndex((item) => item.id === hash);
      if (index >= 0) {
        if (modalOpen.current) moveTo(index, false);
        else scrollChapter(index, true);
      }
    };
    const handleAnchor = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = (event.target as Element)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      const url = new URL(link.href, window.location.href);
      if (
        url.origin !== location.origin ||
        url.pathname !== location.pathname ||
        url.search !== location.search
      )
        return;
      if (url.hash !== "#division-services" && url.hash !== "#division-work")
        return;
      event.preventDefault();
      window.history.replaceState(window.history.state, "", url.hash);
      openIndex(url.hash.slice(1));
    };
    const initial = requestAnimationFrame(handleHash);
    window.addEventListener("hashchange", handleHash);
    document.addEventListener("click", handleAnchor);
    const observer = new IntersectionObserver(
      (entries) => {
        if (modalOpen.current) return;
        const visible = entries.filter((entry) => entry.isIntersecting);
        const target = navigationTarget.current;
        if (target) {
          const match = visible.find((entry) => entry.target.id === target);
          if (match) {
            setActive(Number((match.target as HTMLElement).dataset.chapter));
            navigationTarget.current = null;
          }
          return;
        }
        const current = visible.sort(
          (a, b) =>
            Math.abs(
              a.boundingClientRect.top +
                a.boundingClientRect.height / 2 -
                innerHeight / 2,
            ) -
            Math.abs(
              b.boundingClientRect.top +
                b.boundingClientRect.height / 2 -
                innerHeight / 2,
            ),
        )[0];
        if (current)
          setActive(Number((current.target as HTMLElement).dataset.chapter));
      },
      { rootMargin: "-40% 0px -45% 0px", threshold: 0 },
    );
    root.current
      ?.querySelectorAll("[data-chapter]")
      .forEach((element) => observer.observe(element));
    return () => {
      cancelAnimationFrame(initial);
      cancelAnimationFrame(navigationFrame.current);
      observer.disconnect();
      window.removeEventListener("hashchange", handleHash);
      document.removeEventListener("click", handleAnchor);
    };
  }, [chapters, moveTo, openIndex, scrollChapter]);

  useEffect(() => {
    if (!chapter) return;
    setScene(
      feature
        ? {
            ...chapter.scene,
            zoom: 1.16,
            position: `${feature.x}% ${feature.y}%`,
          }
        : chapter.scene,
    );
  }, [chapter, feature, setScene]);

  const inspect = (selected: JourneyFeature, source = chapter) => {
    if (!source) return;
    lastTrigger.current = document.activeElement as HTMLElement;
    modalOpen.current = true;
    setActive(chapters.findIndex((item) => item.id === source.id));
    setFeature(selected);
  };
  const closeFeature = () => setFeature(null);
  if (!chapter)
    return (
      <WorldPage>
        <section className="journey-empty">
          <h1>
            {division === "commercial"
              ? "Commercial construction"
              : "Residential renovations"}
          </h1>
          <p>Talk with us about your space, your scope and the work ahead.</p>
          <Link href={`/contact?type=${division}`} className="world-action">
            Start a project <ArrowUpRight size={18} />
          </Link>
        </section>
      </WorldPage>
    );
  return (
    <WorldPage
      scene={chapters[0]?.scene}
      className={`division-world division-world--${division}`}
    >
      <div ref={root} className="journey" data-enhanced={enhanced}>
        {chapters.map((item, index) => (
          <section
            id={item.id}
            key={item.id}
            className={`journey-chapter ${index === active ? "is-current" : ""}`}
            data-chapter={index}
            tabIndex={-1}
            aria-labelledby={`${item.id}-title`}
          >
            <div className="journey-chapter-copy">
              <p className="journey-location">
                <span>
                  {division === "residential" ? "Residential" : "Commercial"}
                </span>
                <span aria-hidden="true">/</span>
                {item.label}
              </p>
              {index === 0 ? (
                <h1 id={`${item.id}-title`}>{item.title}</h1>
              ) : (
                <h2 id={`${item.id}-title`}>{item.title}</h2>
              )}
              <p className="journey-description">{item.description}</p>
              <div className="journey-feature-actions">
                {enhanced &&
                  item.features.map((detail) => (
                    <button
                      type="button"
                      key={detail.id}
                      onClick={() => inspect(detail, item)}
                    >
                      <Plus size={15} aria-hidden="true" />
                      {detail.title}
                    </button>
                  ))}
              </div>
              {item.project && (
                <Link
                  className="journey-project-link"
                  href={`/projects/${item.project.slug}`}
                >
                  Explore the real project{" "}
                  <ArrowUpRight size={19} aria-hidden="true" />
                </Link>
              )}
              <p className="journey-provenance">{item.provenance}</p>
              <noscript>
                <div className="journey-nojs-details">
                  {item.features.map((detail) => (
                    <details key={detail.id}>
                      <summary>{detail.title}</summary>
                      <p>{detail.description}</p>
                      {detail.project && (
                        <Link href={`/projects/${detail.project.slug}`}>
                          View {detail.project.title}
                        </Link>
                      )}
                    </details>
                  ))}
                </div>
              </noscript>
            </div>
            <div className="journey-page-preview" aria-hidden="true">
              <Image
                src={item.scene.image}
                alt=""
                fill
                sizes="(max-width: 700px) 100vw, 45vw"
                loading="lazy"
              />
            </div>
          </section>
        ))}
        {enhanced && !feature && !indexOpen && (
          <FeaturePins chapter={chapter} onSelect={inspect} />
        )}
        <nav
          className="journey-rail"
          aria-label={`${division} journey chapters`}
        >
          {enhanced ? (
            <button
              type="button"
              ref={indexTrigger}
              className="journey-index-button"
              onClick={() => openIndex()}
              aria-label={`Open ${division} journey index`}
            >
              <List size={21} />
              <span>
                {division === "residential"
                  ? "Rooms & services"
                  : "Explore the work"}
              </span>
            </button>
          ) : (
            <a className="journey-index-button" href="#division-services">
              <List size={21} aria-hidden="true" />
              <span>Rooms, services & projects</span>
            </a>
          )}
          <div className="journey-rail-chapters">
            {chapters.map((item, index) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={index === active ? "step" : undefined}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {item.label}
              </a>
            ))}
          </div>
          <div className="journey-step-controls">
            <span className="journey-step-count">
              {String(active + 1).padStart(2, "0")} /{" "}
              {String(chapters.length).padStart(2, "0")}
            </span>
            {enhanced && (
              <button
                type="button"
                onClick={() => moveTo(active - 1)}
                disabled={active === 0}
                aria-label="Previous chapter"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            {active < chapters.length - 1 ? (
              enhanced ? (
                <button
                  type="button"
                  onClick={() => moveTo(active + 1)}
                  aria-label={`Next chapter: ${chapters[active + 1].label}`}
                >
                  <ArrowRight size={20} />
                </button>
              ) : (
                <a
                  href={`#${chapters[active + 1].id}`}
                  aria-label={`Next chapter: ${chapters[active + 1].label}`}
                >
                  <ArrowRight size={20} />
                </a>
              )
            ) : (
              <Link
                href={`/projects?type=${division}`}
                aria-label={`Explore all ${division} projects`}
              >
                <ArrowUpRight size={20} />
              </Link>
            )}
          </div>
        </nav>
        <noscript>
          <section id="division-services" className="journey-chapter">
            <div className="journey-chapter-copy">
              <h2>Rooms & services</h2>
              <nav aria-label="Journey chapters">
                {chapters.map((item) => (
                  <p key={item.id}>
                    <a href={`#${item.id}`}>
                      {item.label}: {item.title}
                    </a>
                  </p>
                ))}
              </nav>
              <a href="#division-work">View completed projects</a>
            </div>
          </section>
          <section id="division-work" className="journey-chapter">
            <div className="journey-chapter-copy">
              <h2>Our completed work</h2>
              {projects.map((project) => (
                <p key={project.id}>
                  <Link href={`/projects/${project.slug}`}>
                    {project.title}
                  </Link>
                </p>
              ))}
              <Link href={`/contact?type=${division}`}>
                Discuss your project
              </Link>
            </div>
          </section>
        </noscript>
        <Dialog.Root
          open={!!feature}
          onOpenChange={(open) => {
            if (!open) closeFeature();
          }}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="world-dialog-shade journey-detail-shade" />
            <Dialog.Content
              className="world-detail-drawer journey-detail"
              onCloseAutoFocus={restoreFocus}
            >
              <Dialog.Close
                className="world-close"
                aria-label="Close service detail"
              >
                <X size={23} />
              </Dialog.Close>
              <p className="world-overline">{chapter.label} / The detail</p>
              <Dialog.Title>{feature?.title}</Dialog.Title>
              <Dialog.Description>{feature?.description}</Dialog.Description>
              {feature?.project && (
                <Link
                  href={`/projects/${feature.project.slug}`}
                  className="journey-evidence"
                  onClick={closeFeature}
                >
                  <div>
                    <Image
                      src={
                        feature.project.images[0]?.src || chapter.scene.image
                      }
                      alt={
                        feature.project.images[0]?.alt || feature.project.title
                      }
                      fill
                      sizes="400px"
                    />
                  </div>
                  <span>
                    See it in our work
                    <ArrowUpRight size={20} />
                  </span>
                  <strong>{feature.project.title}</strong>
                  <small>{feature.project.location}</small>
                </Link>
              )}
              <Link
                href={`/contact?type=${division}`}
                className="world-action"
                onClick={closeFeature}
              >
                Start a project <ArrowUpRight size={18} />
              </Link>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        <Dialog.Root open={indexOpen} onOpenChange={setIndexOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="world-dialog-shade" />
            <Dialog.Content
              ref={indexPanel}
              className="world-index-drawer"
              onOpenAutoFocus={(event) => {
                const target =
                  indexTarget.current &&
                  document.getElementById(indexTarget.current);
                const panel = indexPanel.current;
                if (!target || !panel) return;
                event.preventDefault();
                target.focus({ preventScroll: true });
                panel.scrollTop +=
                  target.getBoundingClientRect().top -
                  panel.getBoundingClientRect().top -
                  32;
                indexTarget.current = null;
              }}
              onCloseAutoFocus={restoreFocus}
            >
              <Dialog.Close
                className="world-close"
                aria-label="Close journey index"
              >
                <X size={23} />
              </Dialog.Close>
              <Dialog.Title>
                {division === "residential"
                  ? "A home, room by room."
                  : "Explore the work."}
              </Dialog.Title>
              <Dialog.Description>
                Choose a chapter, explore a service, or open a completed
                project.
              </Dialog.Description>
              <div className="journey-index-grid">
                {chapters.map((item, index) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => moveTo(index)}
                  >
                    <div>
                      <Image
                        src={item.scene.image}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 43vw, 220px"
                      />
                    </div>
                    <span>
                      <small>{String(index + 1).padStart(2, "0")}</small>
                      {item.label}
                      <ArrowRight size={17} />
                    </span>
                  </button>
                ))}
              </div>
              <div
                id="division-services"
                tabIndex={-1}
                className="journey-services-index"
              >
                <h2>Services in this experience</h2>
                {chapters.map((item) => (
                  <div key={item.id}>
                    <h3>{item.label}</h3>
                    <p>{item.description}</p>
                  </div>
                ))}
              </div>
              <nav
                className="journey-index-projects"
                id="division-work"
                tabIndex={-1}
                aria-label="Completed projects"
              >
                <h2>Our completed work</h2>
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.slug}`}
                    onClick={() => setIndexOpen(false)}
                  >
                    {project.title}
                    <ArrowUpRight size={17} />
                  </Link>
                ))}
              </nav>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </WorldPage>
  );
}
