import type { DraftBox, DraftPen } from "./arrival-drafting";

type PageConstruction = {
  pen: DraftPen;
  width: number;
  height: number;
  stage: DraftBox;
  navigation: DraftBox;
  photos: DraftBox[];
  content: Array<{ box: DraftBox; kind: "text" | "button" }>;
  navItems: DraftBox[];
  introduction: DraftBox | null;
};

/** Only measured page boundaries and text alignments receive drafting strokes. */
export function drawPageConstruction({
  pen,
  width,
  height,
  stage,
  navigation,
  photos,
  content,
  navItems,
  introduction,
}: PageConstruction): void {
  const mobile = width <= 600;
  const extension = mobile ? 6 : 10;
  const registration = mobile ? 2 : 3;
  const right = (box: DraftBox) => box.x + box.width;
  const bottom = (box: DraftBox) => box.y + box.height;
  const same = (a: number, b: number) => Math.abs(a - b) < 1;
  const visible = (box: DraftBox) =>
    box.width > 0 && box.height > 0 && box.y < height && bottom(box) > 0;
  const strokes = new Set<string>();

  // Short overshoots preserve intersections without extending unrelated text
  // guides across the viewport. Shared edges are emitted only once.
  function edge(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    tone: "axis" | "fine" | "guide" | "edge" | "accent" = "axis",
  ) {
    if (same(y1, y2)) {
      x1 = Math.max(0, x1 - extension);
      x2 = Math.min(width, x2 + extension);
    } else {
      y1 = Math.max(0, y1 - extension);
      y2 = Math.min(height, y2 + extension);
    }
    const key = [x1, y1, x2, y2].map(Math.round).join(":");
    if (strokes.has(key)) return;
    strokes.add(key);
    pen.line(x1, y1, x2, y2, tone);
  }
  function register(x: number, y: number) {
    if (
      x > registration &&
      x < width - registration &&
      y > registration &&
      y < height - registration
    )
      pen.cross(x, y, registration, "fine");
  }

  const sideNavigation = navigation.width < width / 2;
  if (sideNavigation)
    edge(
      right(navigation),
      navigation.y,
      right(navigation),
      bottom(navigation),
      "accent",
    );
  else
    edge(
      navigation.x,
      bottom(navigation),
      right(navigation),
      bottom(navigation),
    );

  // The hero and its photograph seam are existing physical boundaries.
  if (!sideNavigation || !same(stage.x, right(navigation)))
    edge(stage.x, stage.y, stage.x, bottom(stage));
  if (sideNavigation || !same(stage.y, bottom(navigation)))
    edge(stage.x, stage.y, right(stage), stage.y);
  edge(stage.x, bottom(stage), right(stage), bottom(stage));
  edge(right(stage), stage.y, right(stage), bottom(stage));

  photos.filter(visible).forEach((photo) => {
    if (!same(photo.x, stage.x)) {
      edge(photo.x, photo.y, photo.x, bottom(photo), "accent");
      register(photo.x, bottom(photo));
    }
    if (!same(right(photo), right(stage)))
      edge(right(photo), photo.y, right(photo), bottom(photo), "accent");
    if (!same(photo.y, stage.y)) edge(photo.x, photo.y, right(photo), photo.y);
    if (!same(bottom(photo), bottom(stage)))
      edge(photo.x, bottom(photo), right(photo), bottom(photo));
  });

  // Each navigation guide follows its own label rather than crossing into photos.
  navItems.filter(visible).forEach((box, index) => {
    if (mobile && index > 1) return;
    edge(box.x, bottom(box), right(box), bottom(box), "fine");
  });

  content
    .filter((item) => visible(item.box))
    .forEach(({ box, kind }) => {
      if (kind === "button") {
        edge(box.x, box.y, right(box), box.y, "edge");
        edge(box.x, bottom(box), right(box), bottom(box), "edge");
        edge(box.x, box.y, box.x, bottom(box));
        edge(right(box), box.y, right(box), bottom(box));
        register(box.x, box.y);
        return;
      }
      // Open guides use the exact text top, bottom and left alignment.
      edge(box.x, box.y, right(box), box.y, "fine");
      edge(box.x, bottom(box), right(box), bottom(box), "guide");
      if (!mobile) edge(box.x, box.y, box.x, bottom(box), "fine");
    });

  if (introduction && visible(introduction)) {
    edge(introduction.x, introduction.y, right(introduction), introduction.y);
    if (bottom(introduction) < height)
      edge(
        introduction.x,
        bottom(introduction),
        right(introduction),
        bottom(introduction),
      );
  }
  if (sideNavigation) register(right(navigation), bottom(stage));
}
