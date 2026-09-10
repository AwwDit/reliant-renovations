import sharp from "sharp";
import type { LogoContour } from "./social-preview-artwork";

/** Trace raster alpha boundaries, preserving the real logo and rendered font. */
export async function traceRasterContours(source: string | Buffer, scale = 1) {
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const stride = width + 1;
  const edges = new Map<number, number[]>();
  const opaque = (x: number, y: number) =>
    x >= 0 &&
    y >= 0 &&
    x < width &&
    y < height &&
    data[(y * width + x) * channels + channels - 1] >= 128;
  function edge(x1: number, y1: number, x2: number, y2: number) {
    const start = y1 * stride + x1;
    const next = y2 * stride + x2;
    const outgoing = edges.get(start) ?? [];
    outgoing.push(next);
    edges.set(start, outgoing);
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!opaque(x, y)) continue;
      if (!opaque(x, y - 1)) edge(x, y, x + 1, y);
      if (!opaque(x + 1, y)) edge(x + 1, y, x + 1, y + 1);
      if (!opaque(x, y + 1)) edge(x + 1, y + 1, x, y + 1);
      if (!opaque(x - 1, y)) edge(x, y + 1, x, y);
    }
  }
  const contours: LogoContour[] = [];
  while (edges.size) {
    const start = edges.keys().next().value!;
    let cursor = start;
    const points: { x: number; y: number }[] = [];
    do {
      points.push({ x: cursor % stride, y: Math.floor(cursor / stride) });
      const outgoing = edges.get(cursor);
      if (!outgoing?.length)
        throw new Error("The artwork outline is not a closed contour.");
      const next = outgoing.pop()!;
      if (!outgoing.length) edges.delete(cursor);
      cursor = next;
    } while (cursor !== start);
    if (points.length < 12) continue;
    // Only remove collinear points; do not redraw or approximate the logo.
    const corners = points.filter((point, index) => {
      const previous = points[(index + points.length - 1) % points.length];
      const next = points[(index + 1) % points.length];
      return (
        (point.x - previous.x) * (next.y - point.y) !==
        (point.y - previous.y) * (next.x - point.x)
      );
    });
    if (!corners.length) continue;
    contours.push({
      d:
        corners
          .map(
            ({ x, y }, index) =>
              `${index ? "L" : "M"}${x / scale} ${y / scale}`,
          )
          .join("") + "Z",
      length: points.length / scale,
      bounds: {
        x: Math.min(...corners.map((point) => point.x)) / scale,
        y: Math.min(...corners.map((point) => point.y)) / scale,
        width:
          (Math.max(...corners.map((point) => point.x)) -
            Math.min(...corners.map((point) => point.x))) /
          scale,
        height:
          (Math.max(...corners.map((point) => point.y)) -
            Math.min(...corners.map((point) => point.y))) /
          scale,
      },
    });
  }
  return { contours, width: width / scale, height: height / scale };
}
