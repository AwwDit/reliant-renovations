import { rrDatums, rrProfiles } from "../lib/logo-cad-geometry";

export type ConstructionTone = "axis" | "fine" | "guide" | "edge" | "accent";
export type ConstructionGroup = "logo-guide" | "logo-edge" | "page";
export type ConstructionStroke = {
  d: string;
  length: number;
  tone: ConstructionTone;
  group: ConstructionGroup;
};

export type SocialConstruction = {
  strokes: ConstructionStroke[];
  logoHatchPaths: string[];
};

const logo = { x: 60, y: 54, width: 172, height: 121 };
const scaleX = logo.width / 474;
const scaleY = logo.height / 335;
const round = (value: number) => Math.round(value * 1000) / 1000;
const x = (value: number) => round(logo.x + value * scaleX);
const y = (value: number) => round(logo.y + value * scaleY);
const distance = (ax: number, ay: number, bx: number, by: number) =>
  Math.hypot(bx - ax, by - ay);

/** Map the site's exact absolute RR paths into the social card's logo box. */
function mapLogoPath(source: string) {
  const commands = source.match(/[MLHVCZ][^MLHVCZ]*/g) ?? [];
  const output: string[] = [];
  let previous = { x: 0, y: 0 };
  let start = { x: 0, y: 0 };
  let length = 0;
  for (const instruction of commands) {
    const command = instruction[0];
    const values =
      instruction
        .slice(1)
        .match(/-?(?:\d*\.)?\d+/g)
        ?.map(Number) ?? [];
    if (command === "M" || command === "L") {
      const next = { x: x(values[0]), y: y(values[1]) };
      output.push(`${command}${next.x} ${next.y}`);
      if (command === "M") start = next;
      else length += distance(previous.x, previous.y, next.x, next.y);
      previous = next;
    } else if (command === "H" || command === "V") {
      const next =
        command === "H"
          ? { x: x(values[0]), y: previous.y }
          : { x: previous.x, y: y(values[0]) };
      output.push(`L${next.x} ${next.y}`);
      length += distance(previous.x, previous.y, next.x, next.y);
      previous = next;
    } else if (command === "C") {
      const [x1, y1, x2, y2, x3, y3] = values.map((value, index) =>
        index % 2 === 0 ? x(value) : y(value),
      );
      output.push(`C${x1} ${y1} ${x2} ${y2} ${x3} ${y3}`);
      const origin = previous;
      // Curve samples only measure dash length; the visible path stays analytic.
      for (let sample = 1; sample <= 24; sample++) {
        const t = sample / 24;
        const n = 1 - t;
        const next = {
          x:
            n ** 3 * origin.x +
            3 * n ** 2 * t * x1 +
            3 * n * t ** 2 * x2 +
            t ** 3 * x3,
          y:
            n ** 3 * origin.y +
            3 * n ** 2 * t * y1 +
            3 * n * t ** 2 * y2 +
            t ** 3 * y3,
        };
        length += distance(previous.x, previous.y, next.x, next.y);
        previous = next;
      }
    } else if (command === "Z") {
      output.push("Z");
      length += distance(previous.x, previous.y, start.x, start.y);
      previous = start;
    } else {
      throw new Error(`Unsupported RR construction command: ${command}`);
    }
  }
  return { d: output.join(""), length: round(length) };
}

/**
 * A construction study of the existing card, using the homepage's drafting
 * vocabulary. All strokes use final card coordinates; no SVG transforms or DOM
 * measurements are needed during frame rendering.
 */
export function createSocialConstruction(
  headlineBounds: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>,
): SocialConstruction {
  const strokes: ConstructionStroke[] = [];
  function line(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    tone: ConstructionTone,
    group: ConstructionGroup,
  ) {
    strokes.push({
      d: `M${round(x1)} ${round(y1)}L${round(x2)} ${round(y2)}`,
      length: round(distance(x1, y1, x2, y2)),
      tone,
      group,
    });
  }
  function cross(
    cx: number,
    cy: number,
    tone: ConstructionTone = "fine",
    group: ConstructionGroup = "page",
    radius = 3.5,
  ) {
    line(cx - radius, cy, cx + radius, cy, tone, group);
    line(cx, cy - radius, cx, cy + radius, tone, group);
  }
  function logoLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    tone: ConstructionTone = "fine",
  ) {
    line(x(x1), y(y1), x(x2), y(y2), tone, "logo-guide");
  }

  // The approved native datums cross the RR cap, baseline, stems and counters.
  rrDatums.forEach((d) => {
    strokes.push({ ...mapLogoPath(d), tone: "guide", group: "logo-guide" });
  });

  // Bowl construction follows the actual monogram geometry. Its outer curve
  // runs from y11 to y115; the counter runs y51 to y74. These concentric studies
  // are local to the two R bowls, never decorative circles in the empty page.
  [201, 346].forEach((cx) => {
    const cy = 62;
    [52, 12].forEach((radius, index) => {
      const rx = radius * scaleX;
      const ry = radius * scaleY;
      const left = x(cx) - rx;
      const centerY = y(cy);
      strokes.push({
        d: `M${round(left)} ${centerY}A${round(rx)} ${round(ry)} 0 1 1 ${round(left + 2 * rx)} ${centerY}A${round(rx)} ${round(ry)} 0 1 1 ${round(left)} ${centerY}`,
        length: round(
          Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry))),
        ),
        tone: index === 0 ? "guide" : "fine",
        group: "logo-guide",
      });
    });
    logoLine(cx, -9, cx, 133);
    logoLine(cx - 64, cy, cx + 64, cy);
    cross(x(cx), y(cy), "accent", "logo-guide", 3);
  });

  // Projected stems and outer cap/baseline intersections keep the criss-cross
  // effect tied to the mark. The only diagonals remain the real R silhouettes.
  [77, 118, 251, 397, 404].forEach((position) => {
    logoLine(position, -8, position, 177, "fine");
  });
  [77, 404].forEach((position) => {
    cross(x(position), y(11), "fine", "logo-guide", 2.8);
    cross(x(position), y(161), "fine", "logo-guide", 2.8);
  });
  const logoHatchPaths = rrProfiles.map(({ path }) => mapLogoPath(path).d);
  rrProfiles.forEach(({ path }) => {
    strokes.push({ ...mapLogoPath(path), tone: "edge", group: "logo-edge" });
  });

  // Orthogonal guides stop just past the real logo box, like the site's measured
  // navigation label guides. They do not form an unrelated enclosing panel.
  line(48, 54, 244, 54, "fine", "page");
  line(48, 175, 244, 175, "guide", "page");
  line(60, 42, 60, 187, "fine", "page");
  cross(60, 54);
  cross(60, 175);

  // The seam is a real photograph boundary and becomes the blue final divider.
  line(810, 0, 810, 630, "accent", "page");

  // Like the live intro, axes intersect the real letter caps and baselines,
  // not the surrounding CSS line boxes. Counter contours and punctuation do
  // not define a row's construction envelope.
  const letters = headlineBounds.filter((box) => box.height >= 25);
  const rows = [
    letters.filter((box) => box.y < 510.68),
    letters.filter((box) => box.y >= 510.68),
  ];
  rows.forEach((row) => {
    if (!row.length) return;
    const left = Math.min(...row.map((box) => box.x));
    const right = Math.max(...row.map((box) => box.x + box.width));
    const cap = Math.min(...row.map((box) => box.y));
    const baseline = Math.max(...row.map((box) => box.y + box.height));
    [cap, baseline].forEach((axis) => {
      line(left - 12, axis, right + 12, axis, "axis", "page");
      cross(left, axis);
      if (right > 810) cross(810, axis, "accent");
    });
    const lowercase = row.filter((box) => box.height < (baseline - cap) * 0.85);
    if (lowercase.length) {
      const xHeight = Math.min(...lowercase.map((box) => box.y));
      line(left - 7, xHeight, right + 7, xHeight, "fine", "page");
    }
    line(60, cap - 12, 60, baseline + 12, "guide", "page");
  });

  return { strokes, logoHatchPaths };
}
