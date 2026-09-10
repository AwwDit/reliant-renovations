/* eslint-disable @next/next/no-img-element -- ImageResponse renders an image, not a browser page. */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { socialPreview } from "../lib/social-preview";
import { websiteCopy } from "../lib/website-copy";
import type { SocialConstruction } from "./social-preview-construction";

const root = process.cwd();

async function imageData(relativePath: string) {
  // Satori accepts PNG/JPEG sources; the original project assets are WebP.
  const png = await sharp(path.join(root, "public", relativePath))
    .png()
    .toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

export async function loadSocialArtwork() {
  const [residential, commercial, logo, medium] = await Promise.all([
    imageData("images/projects/plainview-kitchen/01.webp"),
    imageData("images/projects/raising-canes-forest-hills/01.webp"),
    imageData("images/brand/reliant-color-transparent.png"),
    readFile(
      path.join(
        root,
        "node_modules/@fontsource/manrope/files/manrope-latin-500-normal.woff",
      ),
    ),
  ]);
  return { residential, commercial, logo, medium };
}

export type LogoContour = {
  d: string;
  length: number;
  bounds: { x: number; y: number; width: number; height: number };
};

export type PreviewMotion = {
  photos: number;
  logo: number;
  headline: number;
  seam: number;
  outline: number;
  contours: LogoContour[];
  logoWidth: number;
  logoHeight: number;
  time: number;
  draftOpacity: number;
  hatch: number;
  construction: SocialConstruction;
  headlineContours: LogoContour[];
};

function Headline({
  opacity = 1,
  scale = 1,
}: {
  opacity?: number;
  scale?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 60 * scale,
        right: 60 * scale,
        bottom: 51 * scale,
        fontSize: 61 * scale,
        fontWeight: 500,
        lineHeight: 1.12,
        letterSpacing: "-0.04em",
        opacity,
      }}
    >
      {websiteCopy.headline}
    </div>
  );
}

export function renderSocialHeadline(
  { medium }: Awaited<ReturnType<typeof loadSocialArtwork>>,
  scale = 1,
) {
  return new ImageResponse(
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        fontFamily: "Manrope",
        color: "white",
      }}
    >
      <Headline scale={scale} />
    </div>,
    {
      width: socialPreview.width * scale,
      height: socialPreview.height * scale,
      fonts: [
        {
          name: "Manrope",
          data: Uint8Array.from(medium).buffer,
          weight: 500,
          style: "normal",
        },
      ],
    },
  );
}

const strokeStyles = {
  axis: { stroke: "#929ca5", strokeWidth: 0.95, opacity: 0.65 },
  fine: { stroke: "#b2bac1", strokeWidth: 0.65, opacity: 0.38 },
  guide: { stroke: "#a6b1ba", strokeWidth: 0.8, opacity: 0.6 },
  edge: { stroke: "#f5f5f3", strokeWidth: 1, opacity: 0.88 },
  accent: { stroke: "#5f8de9", strokeWidth: 1.1, opacity: 0.82 },
};

function drawingProgress(time: number, start: number, duration: number) {
  const p = Math.max(0, Math.min(1, (time - start) / duration));
  return p * p * (3 - 2 * p);
}

function ConstructionDrawing({ motion }: { motion: PreviewMotion }) {
  const outlineProgress = drawingProgress(motion.time, 0.5, 1.05);
  const headlinePath = motion.headlineContours.map(({ d }) => d).join("");
  return (
    <svg
      width={1200}
      height={630}
      viewBox="0 0 1200 630"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        opacity: motion.draftOpacity,
      }}
    >
      <defs>
        <pattern
          id="social-pencil-hatch"
          width={5}
          height={5}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={5}
            stroke="#b5bec5"
            strokeWidth={0.7}
          />
        </pattern>
      </defs>
      {motion.construction.strokes.map(({ d, length, tone, group }, index) => {
        const start =
          group === "logo-guide" ? 0.08 : group === "logo-edge" ? 0.6 : 0.25;
        const progress = drawingProgress(
          motion.time,
          start + (index % 8) * 0.045,
          0.7,
        );
        return progress > 0 ? (
          <path
            key={index}
            d={d}
            fill="none"
            {...strokeStyles[tone]}
            strokeLinecap="square"
            strokeLinejoin="miter"
            strokeDasharray={`${length} ${length}`}
            strokeDashoffset={length * (1 - progress)}
          />
        ) : null;
      })}
      {motion.headlineContours
        .filter(({ bounds }) => bounds.height >= 25)
        .map(({ bounds }, index) => {
          const { x, y, width, height } = bounds;
          const length = height + 18;
          const progress = drawingProgress(
            motion.time,
            0.1 + (index % 12) * 0.04,
            0.65,
          );
          return progress > 0 ? (
            <path
              key={`guide-${index}`}
              d={`M${x} ${y - 9}v${length}M${x + width} ${y - 9}v${length}`}
              fill="none"
              {...strokeStyles.fine}
              strokeDasharray={`${length} ${length}`}
              strokeDashoffset={length * (1 - progress)}
            />
          ) : null;
        })}
      <path
        d={headlinePath}
        fill="url(#social-pencil-hatch)"
        fillRule="evenodd"
        opacity={motion.hatch * 0.55}
      />
      {motion.construction.logoHatchPaths.map((d, index) => (
        <path
          key={`hatch-${index}`}
          d={d}
          fill="url(#social-pencil-hatch)"
          opacity={motion.hatch * 0.6}
        />
      ))}
      {outlineProgress > 0 &&
        motion.headlineContours.map(({ d, length }, index) => (
          <path
            key={`letter-${index}`}
            d={d}
            fill="none"
            stroke="#e9ecee"
            strokeWidth={0.7}
            strokeLinejoin="round"
            strokeDasharray={`${length} ${length}`}
            strokeDashoffset={length * (1 - outlineProgress)}
          />
        ))}
    </svg>
  );
}

export function renderSocialArtwork(
  {
    residential,
    commercial,
    logo,
    medium,
  }: Awaited<ReturnType<typeof loadSocialArtwork>>,
  motion?: PreviewMotion,
) {
  return new ImageResponse(
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "#171b1d",
        color: "#f5f5f3",
        fontFamily: "Manrope",
      }}
    >
      <img
        src={residential}
        alt=""
        width={810}
        height={630}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          objectFit: "cover",
          objectPosition: "50% 47%",
          opacity: motion?.photos ?? 1,
        }}
      />
      <img
        src={commercial}
        alt=""
        width={390}
        height={630}
        style={{
          position: "absolute",
          left: 810,
          top: 0,
          objectFit: "cover",
          objectPosition: "54% 42%",
          opacity: motion?.photos ?? 1,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(180deg, rgba(23,27,29,0.85) 0%, rgba(23,27,29,0.22) 40%, rgba(23,27,29,0.74) 67%, rgba(23,27,29,0.97) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 810,
          top: 0,
          height: socialPreview.height * (motion?.seam ?? 1),
          width: 3,
          background: "#2463eb",
          opacity: 0.8,
        }}
      />
      {motion && motion.draftOpacity > 0 && (
        <ConstructionDrawing motion={motion} />
      )}
      {motion && motion.logo < 1 && motion.draftOpacity > 0 && (
        <svg
          width={172}
          height={121}
          viewBox={`0 0 ${motion.logoWidth} ${motion.logoHeight}`}
          style={{
            position: "absolute",
            left: 60,
            top: 54,
            opacity: motion.outline > 0 ? motion.draftOpacity * 0.8 : 0,
          }}
        >
          {motion.contours
            .filter(({ bounds }) => bounds.y > 170)
            .map(({ d, length }, index) => (
              <path
                key={index}
                d={d}
                fill="none"
                stroke="#f5f5f3"
                strokeWidth={2.6}
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray={`${length} ${length}`}
                strokeDashoffset={length * (1 - motion.outline)}
              />
            ))}
        </svg>
      )}
      <img
        src={logo}
        alt="Reliant Renovations Inc."
        width={172}
        height={121}
        style={{
          position: "absolute",
          left: 60,
          top: 54,
          objectFit: "contain",
          opacity: motion?.logo ?? 1,
        }}
      />
      <Headline opacity={motion?.headline ?? 1} />
    </div>,
    {
      width: socialPreview.width,
      height: socialPreview.height,
      fonts: [
        {
          name: "Manrope",
          data: Uint8Array.from(medium).buffer,
          weight: 500,
          style: "normal",
        },
      ],
    },
  );
}
