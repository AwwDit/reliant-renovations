/* eslint-disable @next/next/no-img-element -- ImageResponse renders an image, not a browser page. */
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { socialPreview } from "../lib/social-preview";
import { websiteCopy } from "../lib/website-copy";

const root = process.cwd();

async function imageData(relativePath: string) {
  // Satori accepts PNG/JPEG sources; the original project assets are WebP.
  const png = await sharp(path.join(root, "public", relativePath))
    .png()
    .toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

async function generate() {
  const [residential, commercial, logo, medium, bold] = await Promise.all([
    imageData("images/projects/plainview-kitchen/01.webp"),
    imageData("images/projects/raising-canes-forest-hills/01.webp"),
    imageData("images/brand/reliant-color-transparent.png"),
    readFile(
      path.join(
        root,
        "node_modules/@fontsource/manrope/files/manrope-latin-500-normal.woff",
      ),
    ),
    readFile(
      path.join(
        root,
        "node_modules/@fontsource/manrope/files/manrope-latin-800-normal.woff",
      ),
    ),
  ]);

  const response = new ImageResponse(
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
          bottom: 0,
          width: 3,
          background: "#2463eb",
          opacity: 0.8,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 51,
          top: 40,
          fontSize: 142,
          fontWeight: 800,
          letterSpacing: "-0.065em",
          lineHeight: 1,
        }}
      >
        RELIANT
      </div>
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 202,
          display: "flex",
          alignItems: "center",
          gap: 23,
        }}
      >
        <div style={{ width: 48, height: 3, background: "#2463eb" }} />
        <div style={{ fontSize: 19, fontWeight: 500, letterSpacing: "0.4em" }}>
          RENOVATIONS INC.
        </div>
      </div>
      <img
        src={logo}
        alt="Reliant Renovations Inc."
        width={172}
        height={121}
        style={{
          position: "absolute",
          right: 54,
          top: 54,
          objectFit: "contain",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          bottom: 51,
          fontSize: 61,
          fontWeight: 500,
          lineHeight: 1.12,
          letterSpacing: "-0.04em",
        }}
      >
        {websiteCopy.headline}
      </div>
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
        {
          name: "Manrope",
          data: Uint8Array.from(bold).buffer,
          weight: 800,
          style: "normal",
        },
      ],
    },
  );
  const destination = path.join(root, "public", socialPreview.path);
  await mkdir(path.dirname(destination), { recursive: true });
  const result = await sharp(Buffer.from(await response.arrayBuffer()))
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(destination);
  console.log(
    `Social preview: ${destination} (${result.width} × ${result.height}, ${Math.round(result.size / 1024)} KB)`,
  );
}

generate().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
