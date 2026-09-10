"use client";

import Image from "next/image";
import { ArrowRight, ArrowUpRight, ArrowDown } from "@phosphor-icons/react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import "./commercial-sequence.css";

export type CommercialSequenceStage = {
  id: string;
  title: string;
  description: string;
  at: number;
};

type CommercialSequenceProps = {
  videoSrc: string;
  poster: string;
  finishedImage: string;
  projectTitle: string;
  projectHref: string;
  stages: CommercialSequenceStage[];
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/** A static project reference enhanced with native-scroll, paused-video seeking. */
export function CommercialSequence({
  videoSrc,
  poster,
  finishedImage,
  projectTitle,
  projectHref,
  stages,
}: CommercialSequenceProps) {
  const id = useId().replace(/:/g, "");
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const sticky = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const chooseStage = useRef<(at: number) => void>(() => {});
  const [active, setActive] = useState(0);
  const orderedStages = useMemo(
    () =>
      stages
        .map((stage) => ({ ...stage, at: clamp(stage.at) }))
        .sort((a, b) => a.at - b.at),
    [stages],
  );

  useEffect(() => {
    const container = section.current;
    const runway = track.current;
    const panel = sticky.current;
    const player = video.current;
    if (!container || !runway || !panel || !player) return;

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = preference.matches;
    let visible = false;
    let loaded = false;
    let ready = false;
    let failed = false;
    let frame = 0;
    let target = 0;
    let lastRequestedTime: number | null = null;
    let bufferedEnd = 0;
    let manualTarget: number | null = null;
    let previousActive = 0;

    container.dataset.interactive = "true";
    container.dataset.reduced = String(reduced);

    const range = () => Math.max(0, runway.offsetHeight - panel.offsetHeight);
    const stickyTop = () => Number.parseFloat(getComputedStyle(panel).top) || 0;
    const progress = () => {
      const distance = range();
      return distance > 0
        ? clamp((stickyTop() - runway.getBoundingClientRect().top) / distance)
        : target;
    };
    const showStage = (position: number) => {
      let next = 0;
      orderedStages.forEach((stage, index) => {
        if (position + 0.001 >= stage.at) next = index;
      });
      if (next !== previousActive) {
        previousActive = next;
        setActive(next);
      }
    };
    const seek = () => {
      if (
        failed ||
        !Number.isFinite(player.duration) ||
        player.duration <= 0 ||
        player.seeking
      )
        return;
      // Stay inside the final decoded frame instead of seeking beyond the resource.
      const time = target * Math.max(0, player.duration - 0.035);
      if (
        Math.abs(player.currentTime - time) > 0.025 &&
        (lastRequestedTime === null ||
          Math.abs(lastRequestedTime - time) > 0.025)
      ) {
        // A resource that clamps a seek must not create an idle retry loop.
        lastRequestedTime = time;
        player.currentTime = time;
      }
    };
    const update = () => {
      frame = 0;
      if (document.hidden || (!visible && manualTarget === null)) return;
      if (ready && !reduced && container.dataset.enhanced === "true")
        target = progress();
      if (manualTarget !== null) target = manualTarget;
      showStage(target);
      seek();
    };
    const schedule = () => {
      if (!frame && !document.hidden && (visible || manualTarget !== null))
        frame = window.requestAnimationFrame(update);
    };
    const load = () => {
      if (loaded || failed || !videoSrc) return;
      loaded = true;
      player.src = videoSrc;
      player.preload = "auto";
      player.load();
    };
    const scrollToStage = (position: number) => {
      if (reduced || container.dataset.enhanced !== "true") return;
      const top =
        window.scrollY +
        runway.getBoundingClientRect().top -
        stickyTop() +
        position * range();
      window.scrollTo({ top, behavior: "instant" });
    };
    const enable = () => {
      if (failed || player.readyState < HTMLMediaElement.HAVE_CURRENT_DATA)
        return;
      ready = true;
      container.dataset.frame = "true";
      container.dataset.enhanced = String(!reduced);
      if (manualTarget !== null) {
        scrollToStage(manualTarget);
        target = manualTarget;
      }
      schedule();
    };
    const onSeeked = () => {
      enable();
      // One event-driven follow-up catches a newer scroll target while seeking.
      // No requestAnimationFrame loop is kept alive after the last requested frame.
      manualTarget = null;
      schedule();
    };
    const onError = () => {
      failed = true;
      ready = false;
      previousActive = 0;
      setActive(0);
      player.pause();
      container.dataset.failed = "true";
      container.dataset.frame = "false";
      container.dataset.enhanced = "false";
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };
    const onPreference = () => {
      reduced = preference.matches;
      container.dataset.reduced = String(reduced);
      container.dataset.enhanced = String(ready && !reduced);
      player.pause();
      if (!reduced && visible) load();
      schedule();
    };
    const onVisibility = () => {
      if (document.hidden) {
        player.pause();
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
      } else schedule();
    };
    const onScroll = () => {
      if (reduced) return;
      manualTarget = null;
      schedule();
    };

    const onProgress = () => {
      const end = player.buffered.length
        ? player.buffered.end(player.buffered.length - 1)
        : 0;
      if (end > bufferedEnd + 0.025) {
        bufferedEnd = end;
        lastRequestedTime = null;
        schedule();
      }
    };

    chooseStage.current = (position) => {
      lastRequestedTime = null;
      manualTarget = position;
      target = position;
      showStage(position);
      load();
      scrollToStage(position);
      seek();
      schedule();
    };

    const nearby = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !reduced) load();
      },
      { rootMargin: "600px 0px" },
    );
    const inView = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
      else {
        player.pause();
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    const resize = new ResizeObserver(schedule);
    nearby.observe(runway);
    inView.observe(runway);
    resize.observe(panel);
    player.addEventListener("loadeddata", enable);
    player.addEventListener("loadedmetadata", schedule);
    player.addEventListener("seeked", onSeeked);
    player.addEventListener("error", onError);
    player.addEventListener("progress", onProgress);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    preference.addEventListener("change", onPreference);

    return () => {
      nearby.disconnect();
      inView.disconnect();
      resize.disconnect();
      if (frame) cancelAnimationFrame(frame);
      player.pause();
      player.removeEventListener("loadeddata", enable);
      player.removeEventListener("loadedmetadata", schedule);
      player.removeEventListener("seeked", onSeeked);
      player.removeEventListener("error", onError);
      player.removeEventListener("progress", onProgress);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", onVisibility);
      preference.removeEventListener("change", onPreference);
      player.removeAttribute("src");
      player.load();
      chooseStage.current = () => {};
    };
  }, [videoSrc, orderedStages]);

  const activeStage = orderedStages[active];
  const last = active === orderedStages.length - 1;
  const headline =
    [
      "From drawing to built work.",
      "Glass and connection.",
      "The details that bring it together.",
      "The finished project.",
    ][active] || activeStage?.title;

  return (
    <section
      className="cs-section"
      ref={section}
      aria-labelledby={`${id}-title`}
      data-final={last}
    >
      <div className="cs-track" ref={track}>
        <div className="cs-sticky" ref={sticky}>
          <div className="cs-stage">
            <div className="cs-media">
              <Image
                className="cs-poster"
                src={poster}
                alt={`Illustrative architectural drawing of ${projectTitle}`}
                fill
                unoptimized
                sizes="(max-width: 760px) 100vw, 72vw"
                loading="eager"
                fetchPriority="high"
              />
              <video
                ref={video}
                className="cs-video"
                muted
                playsInline
                preload="none"
                aria-hidden="true"
                tabIndex={-1}
              />
              <Image
                className="cs-finished"
                src={finishedImage}
                alt={`${projectTitle} — real completed project photograph`}
                fill
                sizes="(max-width: 760px) 100vw, 72vw"
              />
            </div>
            <div className="cs-topline">
              <p>
                Commercial /{" "}
                {last ? "The documented work" : "Architectural study"}
              </p>
              <span>{projectTitle}</span>
            </div>
            <div className="cs-narrative">
              <span className="cs-current-number">
                {String(active + 1).padStart(2, "0")} /{" "}
                {String(orderedStages.length).padStart(2, "0")}
              </span>
              <h1
                id={`${id}-title`}
                className={active === 0 ? "cs-headline" : "sr-only"}
              >
                From drawing
                <br />
                to built work.
              </h1>
              {active !== 0 && <h2 className="cs-headline">{headline}</h2>}
              <p className="cs-description">{activeStage?.description}</p>
              <a href={projectHref} className="cs-project-link">
                View the real project <ArrowUpRight size={19} />
              </a>
            </div>
            <div className="cs-stage-note">
              <span>
                {last
                  ? "Real project photograph"
                  : "Illustrative architectural transformation"}
              </span>
              <a href={`#${id}-details`}>
                Skip experience <ArrowDown size={15} />
              </a>
            </div>
          </div>
          <div className="cs-console">
            <div className="cs-current">
              <span>
                {String(active + 1).padStart(2, "0")} /{" "}
                {String(orderedStages.length).padStart(2, "0")}
              </span>
              <p>{activeStage?.title}</p>
            </div>
            <div
              className="cs-controls"
              role="group"
              aria-label="Construction stages"
            >
              {orderedStages.map((stage, index) => (
                <button
                  key={stage.id}
                  type="button"
                  aria-pressed={active === index}
                  aria-describedby={`${id}-stage-${stage.id}`}
                  onClick={() => chooseStage.current(stage.at)}
                >
                  {stage.title}
                </button>
              ))}
            </div>
            <div className="cs-next">
              {!last ? (
                <button
                  type="button"
                  onClick={() =>
                    chooseStage.current(orderedStages[active + 1].at)
                  }
                >
                  <span>Next: {orderedStages[active + 1].title}</span>
                  <ArrowRight size={24} />
                </button>
              ) : (
                <a href={projectHref}>
                  Explore the project <ArrowRight size={24} />
                </a>
              )}
              <p>Scroll to explore, or choose a stage.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="cs-details container" id={`${id}-details`} tabIndex={-1}>
        <div className="cs-detail-intro">
          <p className="cin-eyebrow">The work behind the drawing</p>
          <h2>
            A storefront.
            <br />
            Considered in detail.
          </h2>
          <p>
            The architectural sequence illustrates the storefront. Reliant’s
            documented work at this project includes exterior glass, metal and
            ACM panels, facade transitions and trim.
          </p>
          <a className="cin-text-link" href={projectHref}>
            See {projectTitle} <ArrowUpRight size={20} />
          </a>
        </div>
        <ol className="cs-stage-descriptions">
          {orderedStages.map((stage, index) => (
            <li key={stage.id} id={`${id}-stage-${stage.id}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{stage.title}</h3>
                <p>{stage.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
