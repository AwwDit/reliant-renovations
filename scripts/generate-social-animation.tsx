import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { mkdir, mkdtemp, rename, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { socialPreview, socialPreviewVideo } from "../lib/social-preview";
import {
  loadSocialArtwork,
  renderSocialArtwork,
  renderSocialHeadline,
  type PreviewMotion,
} from "./social-preview-artwork";
import { traceRasterContours } from "./social-preview-logo";
import {
  createSocialConstruction,
  type SocialConstruction,
} from "./social-preview-construction";

const fps = 24;
const duration = 7;
const frames = fps * duration;

function ease(time: number, start: number, end: number) {
  const progress = Math.max(0, Math.min(1, (time - start) / (end - start)));
  return progress * progress * (3 - 2 * progress);
}

function motionAt(
  frame: number,
  logo: Awaited<ReturnType<typeof traceRasterContours>>,
  headline: Awaited<ReturnType<typeof traceRasterContours>>,
  construction: SocialConstruction,
): PreviewMotion {
  const time = frame / fps;
  const outro = 1 - ease(time, 6.55, (frames - 1) / fps);
  return {
    photos: ease(time, 2.35, 3.1) * outro,
    logo: ease(time, 2.45, 3.05) * outro,
    headline: ease(time, 2.55, 3.12) * outro,
    seam: ease(time, 2.35, 3.05) * outro,
    outline: ease(time, 0.6, 1.65) * outro,
    contours: logo.contours,
    logoWidth: logo.width,
    logoHeight: logo.height,
    time,
    draftOpacity: (1 - ease(time, 2.75, 3.3)) * outro,
    hatch: ease(time, 1.4, 1.95) * outro,
    construction,
    headlineContours: headline.contours,
  };
}

async function generate() {
  for (const command of ["ffmpeg", "ffprobe"]) {
    const check = spawnSync(command, ["-version"], { stdio: "ignore" });
    if (check.error || check.status !== 0)
      throw new Error(
        `Install ${command} before running npm run social:animate.`,
      );
  }
  if (
    socialPreview.width !== socialPreviewVideo.width ||
    socialPreview.height !== socialPreviewVideo.height
  ) {
    throw new Error("The poster and video dimensions must match.");
  }
  const root = process.cwd();
  const [artwork, logo] = await Promise.all([
    loadSocialArtwork(),
    traceRasterContours(
      path.join(root, "public/images/brand/reliant-color-transparent.png"),
    ),
  ]);
  const headline = await traceRasterContours(
    // Subpixel contours avoid stair-stepped pencil strokes at preview size.
    Buffer.from(await renderSocialHeadline(artwork, 4).arrayBuffer()),
    4,
  );
  const construction = createSocialConstruction(
    headline.contours.map(({ bounds }) => bounds),
  );
  const destination = path.join(root, "public", socialPreviewVideo.path);
  await mkdir(path.dirname(destination), { recursive: true });
  const temporary = await mkdtemp(
    path.join(path.dirname(destination), ".render-"),
  );
  const review = await mkdtemp(
    path.join(tmpdir(), "reliant-social-animation-"),
  );
  const temporaryVideo = path.join(temporary, "preview.mp4");
  const encoder = spawn(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-f",
      "image2pipe",
      "-framerate",
      String(fps),
      "-vcodec",
      "png",
      "-i",
      "pipe:0",
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "20",
      "-vf",
      "scale=out_color_matrix=bt709:out_range=tv",
      "-pix_fmt",
      "yuv420p",
      "-profile:v",
      "high",
      "-level:v",
      "3.1",
      "-movflags",
      "+faststart",
      "-color_primaries",
      "bt709",
      "-color_trc",
      "bt709",
      "-colorspace",
      "bt709",
      temporaryVideo,
    ],
    { stdio: ["pipe", "ignore", "pipe"] },
  );
  let encoderErrors = "";
  encoder.stderr.on("data", (chunk: Buffer) => {
    encoderErrors = (encoderErrors + chunk.toString()).slice(-8000);
  });
  let pipeError: Error | undefined;
  encoder.stdin.on("error", (error: Error) => {
    pipeError = error;
  });
  const completed = new Promise<void>((resolve, reject) => {
    encoder.once("error", reject);
    encoder.once("close", (code) =>
      code === 0
        ? resolve()
        : reject(
            new Error(`Video encoding failed (${code}): ${encoderErrors}`),
          ),
    );
  });
  void completed.catch(() => {});

  try {
    let settledFrame: Buffer | undefined;
    for (let frame = 0; frame < frames; frame++) {
      if (pipeError) throw pipeError;
      const motion = motionAt(frame, logo, headline, construction);
      const settled =
        motion.photos === 1 &&
        motion.logo === 1 &&
        motion.headline === 1 &&
        motion.seam === 1 &&
        motion.draftOpacity === 0;
      const png =
        settled && settledFrame
          ? settledFrame
          : Buffer.from(
              await renderSocialArtwork(artwork, motion).arrayBuffer(),
            );
      if (settled) settledFrame = png;
      if ([0, 12, 24, 48, 66, 96, 156, 167].includes(frame)) {
        await writeFile(
          path.join(review, `frame-${String(frame).padStart(3, "0")}.png`),
          png,
        );
      }
      if (!encoder.stdin.write(png)) await once(encoder.stdin, "drain");
      if ((frame + 1) % fps === 0)
        console.log(`Rendered ${frame + 1}/${frames} frames`);
    }
    encoder.stdin.end();
    await completed;
    const inspection = spawnSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_streams",
        "-show_format",
        "-of",
        "json",
        temporaryVideo,
      ],
      { encoding: "utf8" },
    );
    if (inspection.status !== 0)
      throw new Error(
        `Could not inspect the rendered video: ${inspection.stderr}`,
      );
    const metadata = JSON.parse(inspection.stdout) as {
      streams: {
        codec_type: string;
        codec_name: string;
        width: number;
        height: number;
        pix_fmt: string;
      }[];
      format: { duration: string };
    };
    const video = metadata.streams[0];
    const size = (await stat(temporaryVideo)).size;
    if (
      metadata.streams.length !== 1 ||
      video.codec_type !== "video" ||
      video.codec_name !== "h264" ||
      video.pix_fmt !== "yuv420p" ||
      video.width !== socialPreview.width ||
      video.height !== socialPreview.height ||
      Math.abs(Number(metadata.format.duration) - duration) > 0.1 ||
      size > 4_000_000
    ) {
      throw new Error(
        "Rendered video did not meet the format, duration, or 4 MB size requirement.",
      );
    }
    await rename(temporaryVideo, destination);
    console.log(
      `Animated preview: ${destination} (${duration}s, ${Math.round(size / 1024)} KB, silent H.264)`,
    );
    console.log(`Review frames: ${review}`);
  } finally {
    if (encoder.exitCode === null) encoder.kill("SIGTERM");
    await completed.catch(() => {});
    await rm(temporary, { recursive: true, force: true });
  }
}

generate().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
