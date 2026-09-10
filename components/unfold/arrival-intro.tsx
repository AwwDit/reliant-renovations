"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight } from "@phosphor-icons/react";
import { gsap } from "gsap";
import { rrProfiles, rrDatums } from "@/lib/logo-cad-geometry";
import { createDraftPen, drawWordConstruction } from "./arrival-drafting";
import { drawPageConstruction } from "./arrival-page-draft";
import "./arrival-intro.css";

const sessionKey = "reliant:arrival:seen:v1";
const svgNamespace = "http://www.w3.org/2000/svg";
let drawingId = 0;

type Bounds = { x: number; y: number; width: number; height: number };

function shape<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attributes: Record<string, string | number>,
) {
  const element = document.createElementNS(svgNamespace, tag);
  Object.entries(attributes).forEach(([name, value]) =>
    element.setAttribute(name, String(value)),
  );
  return element;
}

/** The hero's existing entrance translates text; draft its final layout position. */
function bounds(element: Element): Bounds {
  const rect = element.getBoundingClientRect();
  let x = rect.left;
  let y = rect.top;
  for (
    let current: Element | null = element;
    current;
    current = current.parentElement
  ) {
    const transform = getComputedStyle(current).transform;
    if (transform !== "none") {
      const matrix = new DOMMatrixReadOnly(transform);
      x -= matrix.m41;
      y -= matrix.m42;
    }
  }
  return { x, y, width: rect.width, height: rect.height };
}

function rectangle(box: Bounds, padding = 0) {
  return {
    x: box.x - padding,
    y: box.y - padding,
    width: box.width + padding * 2,
    height: box.height + padding * 2,
  };
}

/** A temporary drawing of the real page. The underlying page is never hidden. */
export function ArrivalIntro() {
  const layer = useRef<HTMLDivElement>(null);
  const canvas = useRef<SVGSVGElement>(null);
  const dismiss = useRef<() => void>(() => {});
  const pathname = usePathname();

  useLayoutEffect(() => {
    const overlay = layer.current;
    const svg = canvas.current;
    if (!overlay || !svg || pathname !== "/") return;

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const preview = new URLSearchParams(location.search).get("intro") === "1";
    const navigation = performance.getEntriesByType("navigation")[0] as
      PerformanceNavigationTiming | undefined;
    if (
      reducedMotion.matches ||
      document.visibilityState !== "visible" ||
      location.hash ||
      window.scrollY > 8 ||
      (!preview && navigation?.type === "back_forward")
    )
      return;
    try {
      if (!preview && sessionStorage.getItem(sessionKey) === "1") return;
    } catch {
      // Storage restrictions should give visitors the page, not a repeated intro.
      if (!preview) return;
    }

    const cleanups: Array<() => void> = [];
    let disposed = false;
    let finished = false;
    let context: gsap.Context | undefined;

    function finish() {
      if (finished) return;
      finished = true;
      const restoreFocus = overlay!.contains(document.activeElement);
      overlay!.hidden = true;
      overlay!.removeAttribute("data-active");
      cleanups.splice(0).forEach((cleanup) => cleanup());
      context?.revert();
      if (restoreFocus && !disposed)
        document.getElementById("main")?.focus({ preventScroll: true });
    }
    dismiss.current = finish;

    function later(callback: () => void, milliseconds: number) {
      const timeout = window.setTimeout(() => {
        if (!disposed && !finished) callback();
      }, milliseconds);
      cleanups.push(() => clearTimeout(timeout));
    }

    function start() {
      if (disposed || finished || reducedMotion.matches) return;
      const stage = document.querySelector<HTMLElement>(".uf-brand-stage");
      const word = document.querySelector<HTMLElement>(".uf-brand-name");
      const navigation = document.querySelector<HTMLElement>(".rf-nav-header");
      if (!stage || !word || !navigation) return;

      const wordStyle = getComputedStyle(word);
      const fontSize = parseFloat(wordStyle.fontSize);
      const font = `${wordStyle.fontWeight} ${wordStyle.fontSize} ${wordStyle.fontFamily}`;
      // Both SVG and HTML must use the real installed face, never trace a fallback.
      if (!document.fonts.check(font, "RELIANT")) return;
      try {
        sessionStorage.setItem(sessionKey, "1");
      } catch {
        if (!preview) return;
      }

      // Install recovery before any visible mutation or animation work.
      later(finish, 4100);
      try {
        const width = document.documentElement.clientWidth;
        const height = window.innerHeight;
        svg!.setAttribute("viewBox", `0 0 ${width} ${height}`);
        svg!.replaceChildren();
        const id = `uf-arrival-mask-${++drawingId}`;
        const definitions = shape("defs", {});
        const mask = shape("mask", {
          id,
          maskUnits: "userSpaceOnUse",
          x: 0,
          y: 0,
          width,
          height,
          "mask-type": "luminance",
        });
        mask.append(
          shape("rect", { x: 0, y: 0, width, height, fill: "white" }),
        );
        definitions.append(mask);
        const paper = shape("rect", {
          x: 0,
          y: 0,
          width,
          height,
          fill: "var(--rf-bg)",
          mask: `url(#${id})`,
        });
        const drawing = shape("g", { class: "uf-arrival-drawing" });
        svg!.append(definitions, paper, drawing);
        const pageLayer = shape("g", { class: "uf-arrival-page-study" });
        const wordLayer = shape("g", { class: "uf-arrival-word-study" });
        drawing.append(pageLayer, wordLayer);
        const pagePen = createDraftPen(pageLayer);
        const wordPen = createDraftPen(wordLayer);
        const wordBox = bounds(word);

        // SVG text traces the browser's actual Manrope glyph contours. Canvas
        // font metrics locate the same HTML baseline, including tight line-height.
        const metricsCanvas = document.createElement("canvas");
        const metricsContext = metricsCanvas.getContext("2d");
        if (!metricsContext) {
          finish();
          return;
        }
        metricsContext.font = font;
        const label =
          wordStyle.textTransform === "uppercase"
            ? (word.textContent || "").toUpperCase()
            : word.textContent || "";
        const metrics = metricsContext.measureText(label);
        const ascent = metrics.fontBoundingBoxAscent;
        const descent = metrics.fontBoundingBoxDescent;
        if (!Number.isFinite(ascent) || !Number.isFinite(descent)) {
          finish();
          return;
        }
        const baseline =
          wordBox.y +
          (parseFloat(wordStyle.lineHeight) - ascent - descent) / 2 +
          ascent;
        const lettering = shape("text", {
          x: wordBox.x,
          y: baseline,
          "font-family": wordStyle.fontFamily,
          "font-size": fontSize,
          "font-weight": wordStyle.fontWeight,
          "letter-spacing": wordStyle.letterSpacing,
          textLength: wordBox.width,
          lengthAdjust: "spacingAndGlyphs",
          class: "uf-arrival-lettering",
        });
        lettering.textContent = label;
        const hatchId = `uf-arrival-hatch-${drawingId}`;
        const hatchSpacing = Math.max(3, fontSize * 0.021);
        const hatchPattern = shape("pattern", {
          id: hatchId,
          width: hatchSpacing,
          height: hatchSpacing,
          patternUnits: "userSpaceOnUse",
          patternTransform: "rotate(45)",
        });
        hatchPattern.append(
          shape("line", {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: hatchSpacing,
            class: "uf-arrival-hatch-line",
          }),
        );
        definitions.append(hatchPattern);
        const pencilled = lettering.cloneNode(true) as SVGTextElement;
        pencilled.setAttribute("class", "uf-arrival-hatch");
        pencilled.setAttribute("fill", `url(#${hatchId})`);
        drawing.append(pencilled);
        drawing.append(lettering);
        drawWordConstruction(wordPen, {
          box: wordBox,
          label,
          baseline,
          fontSize,
          tracking: parseFloat(wordStyle.letterSpacing) || 0,
          context: metricsContext,
          metrics,
          compact: width <= 600,
        });
        function opening(
          element: Element,
          fill: "black" | "white",
          padding = 0,
        ) {
          const rect = shape("rect", {
            ...rectangle(bounds(element), padding),
            fill,
          });
          mask.append(rect);
          return rect;
        }

        const photographs = Array.from(
          stage.querySelectorAll<HTMLElement>(".uf-brand-photo"),
        );
        const photoOpenings = photographs.map((photo) =>
          opening(photo, "black"),
        );
        const navOpening = opening(navigation, "black");
        const introduction = document.querySelector<HTMLElement>(
          ".uf-brand-introduction",
        );
        const introOpening = introduction
          ? opening(introduction, "black")
          : null;

        const textElements = Array.from(
          stage.querySelectorAll<HTMLElement>(
            ".uf-brand-name, .uf-brand-trade, .uf-brand-message h1, .uf-brand-primary, .uf-brand-work",
          ),
        );
        const textCovers = textElements.map((element) =>
          opening(element, "white", 5),
        );
        drawPageConstruction({
          pen: pagePen,
          width,
          height,
          stage: bounds(stage),
          navigation: bounds(navigation),
          photos: photographs.map(bounds),
          content: textElements
            .filter((element) => element !== word)
            .map((element) => ({
              box: bounds(element),
              kind: element.matches(".uf-brand-primary") ? "button" : "text",
            })),
          navItems: Array.from(
            navigation.querySelectorAll(
              ".rf-nav-brand, .rf-nav-link, .rf-nav-menu-trigger, .rf-nav-description",
            ),
          ).map(bounds),
          introduction: introduction ? bounds(introduction) : null,
        });
        const actionSegment = stage.querySelector(".uf-brand-primary > span");
        if (actionSegment) {
          const box = bounds(actionSegment);
          pagePen.line(
            box.x,
            box.y - 10,
            box.x,
            box.y + box.height + 10,
            "accent",
          );
        }

        // Bring the original RR construction study into the actual navigation
        // logo position, using the same approved drawing geometry as before.
        const logo = navigation.querySelector(".rf-nav-logo");
        const logoLayer = shape("g", { class: "uf-arrival-logo-study" });
        const logoPen = createDraftPen(logoLayer);
        if (logo) {
          const box = bounds(logo);
          logoLayer.setAttribute(
            "transform",
            `translate(${box.x} ${box.y}) scale(${box.width / 474} ${box.height / 335})`,
          );
          drawing.append(logoLayer);
          rrDatums.forEach((d) => logoPen.path(d, "guide"));
          rrProfiles.forEach(({ path }) => logoPen.path(path, "edge"));
        }

        const images = photographs.flatMap((photo) =>
          Array.from(photo.querySelectorAll("img")),
        );
        const ready = new Set<HTMLImageElement>();
        images.forEach((image) => {
          const settled = () => {
            if (!disposed && !finished) ready.add(image);
          };
          const loaded = () => {
            void image.decode().then(settled, settled);
          };
          if (image.complete) {
            if (image.naturalWidth) loaded();
            else settled();
          } else {
            image.addEventListener("load", loaded, { once: true });
            image.addEventListener("error", settled, { once: true });
            cleanups.push(() => {
              image.removeEventListener("load", loaded);
              image.removeEventListener("error", settled);
            });
          }
        });

        context = gsap.context(() => {
          const axes = pagePen.paths.filter((path) =>
            path.classList.contains("uf-arrival-axis"),
          );
          const pageDetails = pagePen.paths.filter(
            (path) => !axes.includes(path),
          );
          gsap.set([...wordPen.paths, ...pagePen.paths, ...logoPen.paths], {
            attr: { "stroke-dasharray": 1, "stroke-dashoffset": 1 },
          });
          gsap.set(pencilled, { opacity: 0 });
          gsap.set(lettering, {
            attr: {
              "stroke-dasharray": fontSize * 8,
              "stroke-dashoffset": fontSize * 8,
            },
            opacity: 0,
          });
          gsap.set(
            [photoOpenings, navOpening, introOpening].flat().filter(Boolean),
            { opacity: 0 },
          );
          gsap
            .timeline({ onComplete: finish })
            .to(
              wordPen.paths,
              {
                attr: { "stroke-dashoffset": 0 },
                duration: 0.55,
                stagger: { amount: 0.65 },
                ease: "power1.inOut",
              },
              0,
            )
            .to(
              axes,
              {
                attr: { "stroke-dashoffset": 0 },
                duration: 0.65,
                stagger: { amount: 0.22 },
                ease: "power1.inOut",
              },
              0.14,
            )
            .set(lettering, { opacity: 1 }, 0.56)
            .to(
              lettering,
              {
                attr: { "stroke-dashoffset": 0 },
                duration: 1.25,
                ease: "power2.out",
              },
              0.56,
            )
            .set(lettering, { attr: { "stroke-dasharray": "none" } }, 1.81)
            .to(pencilled, { opacity: 0.6, duration: 0.55 }, 1.35)
            .to(
              logoPen.paths,
              {
                attr: { "stroke-dashoffset": 0 },
                duration: 0.6,
                stagger: { amount: 0.32 },
                ease: "power1.inOut",
              },
              1.1,
            )
            .to(
              pageDetails,
              {
                attr: { "stroke-dashoffset": 0 },
                duration: 0.58,
                stagger: { amount: 0.4 },
                ease: "power2.inOut",
              },
              1.2,
            )
            // Let the completed construction drawing register before it resolves.
            .to(navOpening, { opacity: 1, duration: 0.55 }, 2.72)
            .to(
              textCovers,
              { opacity: 0, duration: 0.48, stagger: 0.045 },
              2.85,
            )
            .to(drawing, { opacity: 0, duration: 0.7 }, 2.9)
            .to(paper, { opacity: 0, duration: 0.72 }, 2.98);
          if (introOpening)
            gsap.to(introOpening, { opacity: 1, delay: 2.82, duration: 0.55 });
          // Load/decode runs alongside drawing. Photography can wait at most
          // 200ms beyond its reveal cue; a network request never holds the page.
          const revealPhotos = () => {
            context?.add(() =>
              gsap.to(photoOpenings, {
                opacity: 1,
                duration: 0.58,
                stagger: 0.06,
                ease: "power2.out",
              }),
            );
          };
          later(() => {
            if (ready.size === images.length) revealPhotos();
            else later(revealPhotos, 200);
          }, 2600);
        }, overlay!);

        const keydown = (event: KeyboardEvent) => {
          if (
            [
              "Tab",
              "Escape",
              "ArrowDown",
              "ArrowUp",
              "PageDown",
              "PageUp",
              "Home",
              "End",
              " ",
            ].includes(event.key)
          )
            finish();
        };
        const focus = (event: FocusEvent) => {
          if (event.target instanceof Node && !overlay!.contains(event.target))
            finish();
        };
        const pointer = (event: PointerEvent) => {
          if (event.target instanceof Node && !overlay!.contains(event.target))
            finish();
        };
        const visibility = () => {
          if (document.visibilityState !== "visible") finish();
        };
        document.addEventListener("keydown", keydown, true);
        document.addEventListener("focusin", focus);
        document.addEventListener("pointerdown", pointer, true);
        document.addEventListener("visibilitychange", visibility);
        window.addEventListener("resize", finish, { once: true });
        window.addEventListener("pagehide", finish, { once: true });
        window.addEventListener("wheel", finish, { once: true, passive: true });
        window.addEventListener("touchmove", finish, {
          once: true,
          passive: true,
        });
        reducedMotion.addEventListener("change", finish, { once: true });
        cleanups.push(() => {
          document.removeEventListener("keydown", keydown, true);
          document.removeEventListener("focusin", focus);
          document.removeEventListener("pointerdown", pointer, true);
          document.removeEventListener("visibilitychange", visibility);
          window.removeEventListener("resize", finish);
          window.removeEventListener("pagehide", finish);
          window.removeEventListener("wheel", finish);
          window.removeEventListener("touchmove", finish);
          reducedMotion.removeEventListener("change", finish);
        });
        overlay!.hidden = false;
        overlay!.setAttribute("data-active", "true");
      } catch {
        finish();
      }
    }

    // A pre-paint microtask avoids showing a frame of the hydrated page first.
    // Strict Mode cleans up its first setup before that setup can mark the tab.
    queueMicrotask(() => {
      if (disposed || finished) return;
      const word = document.querySelector<HTMLElement>(".uf-brand-name");
      if (!word) return;
      const style = getComputedStyle(word);
      const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      if (document.fonts.check(font, "RELIANT")) start();
      else {
        let prepared = false;
        const begin = () => {
          if (prepared) return;
          prepared = true;
          start();
        };
        void document.fonts.load(font, "RELIANT").then(begin, begin);
        later(begin, 220);
      }
    });
    return () => {
      disposed = true;
      finish();
      dismiss.current = () => {};
    };
  }, [pathname]);

  return (
    <div ref={layer} className="uf-arrival" hidden>
      <svg
        ref={canvas}
        className="uf-arrival-canvas"
        aria-hidden="true"
        focusable="false"
      />
      <button
        className="uf-arrival-skip"
        type="button"
        onClick={() => dismiss.current()}
      >
        Skip intro <ArrowRight size={17} aria-hidden="true" />
      </button>
    </div>
  );
}
