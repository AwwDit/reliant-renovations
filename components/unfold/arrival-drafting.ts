export type DraftBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type DraftTone = "axis" | "guide" | "fine" | "edge" | "accent";

export interface DraftPen {
  paths: SVGGeometryElement[];
  line: (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    tone?: DraftTone,
  ) => SVGLineElement;
  path: (d: string, tone?: DraftTone) => SVGPathElement;
  cross: (x: number, y: number, size?: number, tone?: DraftTone) => void;
}

const namespace = "http://www.w3.org/2000/svg";

/** Separate pens let the construction passes trace in a deliberate sequence. */
export function createDraftPen(layer: SVGGElement): DraftPen {
  const paths: SVGGeometryElement[] = [];
  function append<T extends SVGGeometryElement>(
    element: T,
    tone: DraftTone,
  ): T {
    element.setAttribute("class", `uf-arrival-${tone}`);
    element.setAttribute("pathLength", "1");
    layer.append(element);
    paths.push(element);
    return element;
  }
  const pen: DraftPen = {
    paths,
    line(x1, y1, x2, y2, tone = "guide") {
      const line = document.createElementNS(namespace, "line");
      Object.entries({ x1, y1, x2, y2 }).forEach(([key, value]) =>
        line.setAttribute(key, String(value)),
      );
      return append(line, tone);
    },
    path(d, tone = "guide") {
      const path = document.createElementNS(namespace, "path");
      path.setAttribute("d", d);
      return append(path, tone);
    },
    cross(x, y, size = 4, tone = "fine") {
      pen.line(x - size, y, x + size, y, tone);
      pen.line(x, y - size, x, y + size, tone);
    },
  };
  return pen;
}

/** Construction follows the measured Manrope glyphs, not a substitute font. */
export function drawWordConstruction(
  pen: DraftPen,
  {
    box,
    label,
    baseline,
    fontSize,
    tracking,
    context,
    metrics,
    compact,
  }: {
    box: DraftBox;
    label: string;
    baseline: number;
    fontSize: number;
    tracking: number;
    context: CanvasRenderingContext2D;
    metrics: TextMetrics;
    compact: boolean;
  },
): DraftBox {
  const advance = metrics.width + tracking * label.length;
  const scaleX = advance > 0 ? box.width / advance : 1;
  const cap = baseline - metrics.actualBoundingBoxAscent;
  const bottom = baseline + metrics.actualBoundingBoxDescent;
  const capHeight = bottom - cap;
  const left = box.x - metrics.actualBoundingBoxLeft * scaleX;
  const right =
    box.x +
    (metrics.actualBoundingBoxRight + tracking * (label.length - 1)) * scaleX;
  const stem = capHeight * 0.18;
  const overshoot = Math.max(13, Math.min(34, fontSize * 0.17));

  // Shared cap, baseline and thickness datums continue through every letter.
  [cap, bottom].forEach((y) =>
    pen.line(left - overshoot, y, right + overshoot, y, "axis"),
  );
  [cap + stem, bottom - stem].forEach((y) =>
    pen.line(left - overshoot * 0.65, y, right + overshoot * 0.7, y, "fine"),
  );
  if (!compact)
    pen.line(
      left - overshoot,
      cap + capHeight * 0.54,
      right + overshoot,
      cap + capHeight * 0.54,
      "fine",
    );

  function extended(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    amount = 0.16,
  ) {
    const dx = (x2 - x1) * amount;
    const dy = (y2 - y1) * amount;
    pen.line(x1 - dx, y1 - dy, x2 + dx, y2 + dy, "guide");
  }

  [...label].forEach((letter, index) => {
    const measured = context.measureText(letter);
    const prefix = context.measureText(label.slice(0, index)).width;
    const origin = box.x + (prefix + tracking * index) * scaleX;
    const x = origin - measured.actualBoundingBoxLeft * scaleX;
    const end = origin + measured.actualBoundingBoxRight * scaleX;
    const width = end - x;
    const center = (x + end) / 2;
    const topExtension = overshoot * (index % 2 === 0 ? 1 : 0.7);
    const lowExtension = overshoot * (index % 2 === 0 ? 0.65 : 1);

    [x, end].forEach((guideX) => {
      pen.line(guideX, cap - topExtension, guideX, bottom + lowExtension);
    });
    if (["R", "E", "L", "N"].includes(letter))
      pen.line(
        x + stem,
        cap - overshoot * 0.8,
        x + stem,
        bottom + overshoot * 0.8,
        "fine",
      );

    if (letter === "R") {
      const cx = x + width * 0.55;
      const cy = cap + capHeight * 0.3;
      const rx = width * 0.45;
      const ry = capHeight * 0.3;
      // Bowl guides stay attached to the R's curved silhouette and counter.
      pen.path(
        `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${rx * 2} 0 a ${rx} ${ry} 0 1 0 ${-rx * 2} 0`,
        "guide",
      );
      if (!compact) {
        const innerX = rx - stem * 0.65;
        const innerY = ry - stem * 0.65;
        pen.path(
          `M ${cx - innerX} ${cy} a ${innerX} ${innerY} 0 1 0 ${innerX * 2} 0 a ${innerX} ${innerY} 0 1 0 ${-innerX * 2} 0`,
          "fine",
        );
        pen.line(cx, cap - overshoot, cx, cy + ry + overshoot, "fine");
      }
      pen.line(x - overshoot, cy, end + overshoot, cy, "fine");
      pen.cross(cx, cy, compact ? 3 : 5, "accent");
      extended(
        x + width * 0.49,
        cap + capHeight * 0.56,
        end - stem * 0.2,
        bottom,
      );
    }
    if (letter === "A") {
      // The sloping stems extend past the apex and baseline like pencil guides.
      extended(x, bottom, center - stem * 0.12, cap);
      extended(center + stem * 0.12, cap, end, bottom);
      if (!compact) {
        extended(x + stem, bottom, center, cap + stem, 0.1);
        extended(center, cap + stem, end - stem, bottom, 0.1);
      }
      pen.line(
        x - overshoot,
        cap + capHeight * 0.7,
        end + overshoot,
        cap + capHeight * 0.7,
        "fine",
      );
      pen.cross(center, cap, compact ? 3 : 4, "fine");
    }
    if (letter === "N") {
      pen.line(
        end - stem,
        cap - overshoot * 0.8,
        end - stem,
        bottom + overshoot * 0.8,
        "fine",
      );
      extended(x + stem * 0.5, cap, end - stem * 0.5, bottom);
      if (!compact)
        extended(x + stem * 1.4, cap, end - stem * 0.05, bottom, 0.12);
    }
    if (letter === "T") {
      [center - stem / 2, center + stem / 2].forEach((guideX) =>
        pen.line(guideX, cap - overshoot, guideX, bottom + overshoot, "fine"),
      );
    }
    if (letter === "E") {
      const bar = cap + capHeight * 0.5;
      pen.line(x - overshoot * 0.4, bar, end + overshoot * 0.65, bar, "fine");
    }
  });
  return { x: left, y: cap, width: right - left, height: capHeight };
}
