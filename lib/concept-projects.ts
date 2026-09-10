import type { Project } from "./types";

export interface ConceptProject extends Project {
  presentation: {
    shortTitle: string;
    summary: string;
    overview: number;
    detail: number;
    secondary: number;
    overviewPosition: string;
    detailPosition: string;
    secondaryPosition: string;
    detailLabel: string;
    secondaryLabel: string;
  };
}

type Curation = {
  /** Zero-based positions in the original eight-image selection. */
  photos: readonly [number, number, number];
  positions?: readonly [string, string, string];
};

const leadOrder = [
  "upper-west-side-apartment",
  "tribeca-apartment",
  "raising-canes-forest-hills",
  "harbor-freight-bronx",
] as const;

// Only photo selection and framing are curated here; editable copy stays live.
const curations: Record<string, Curation> = {
  "upper-west-side-apartment": {
    photos: [0, 6, 5],
    positions: ["50% 42%", "50% 50%", "50% 52%"],
  },
  "tribeca-apartment": {
    photos: [0, 5, 3],
    positions: ["50% 48%", "50% 50%", "50% 50%"],
  },
  "raising-canes-forest-hills": {
    photos: [0, 3, 5],
    positions: ["50% 44%", "50% 50%", "50% 48%"],
  },
  "harbor-freight-bronx": {
    photos: [0, 2, 4],
    positions: ["50% 45%", "50% 48%", "50% 52%"],
  },
  "chick-fil-a-kingston": {
    // Exterior progress, roof framing, and the interior buildout.
    photos: [0, 4, 2],
  },
  "lidl-staten-island": {
    // Retail exterior, brick repair, and concrete basement floor.
    photos: [0, 4, 6],
  },
  "lidl-harlem": {
    // Wide finished floor, refrigerator aisle, and service corridor.
    photos: [1, 6, 4],
  },
  "plainview-kitchen": {
    // Kitchen, countertop detail, and the adjoining dining area.
    photos: [0, 1, 5],
  },
  "hicksville-basement": {
    // Finished basement, stair rail, and built-in cabinetry.
    photos: [0, 4, 3],
  },
  "kings-park-exterior": {
    // Front exterior, bay window, and rear sunroom.
    photos: [0, 7, 4],
  },
};

function sourcePath(src: string): string {
  // Handles local paths, absolute delivery URLs, and cache query strings.
  try {
    return new URL(src, "https://local.invalid").pathname;
  } catch {
    return src.split(/[?#]/, 1)[0];
  }
}

function present(project: Project): ConceptProject {
  const curation = curations[project.slug];
  const preferred = curation?.photos ?? [0, 1, 2];
  const matched = preferred.map((number) => {
    const path = `/images/projects/${project.slug}/${String(number + 1).padStart(2, "0")}.webp`;
    return project.images.findIndex((image) => sourcePath(image.src) === path);
  });

  // Reserve every surviving preferred photo before allocating any fallback.
  // Thus a missing overview cannot steal the remaining detail's selection.
  const used = new Set(matched.filter((index) => index >= 0));
  const indices = matched.map((index) => {
    if (index >= 0) return index;
    const unused = project.images.findIndex((_, number) => !used.has(number));
    if (unused >= 0) {
      used.add(unused);
      return unused;
    }
    return project.images.length ? 0 : -1;
  });
  const position = (role: number) =>
    matched[role] >= 0 ? (curation?.positions?.[role] ?? "50% 50%") : "50% 50%";
  const label = (index: number) =>
    project.images[index]?.alt.trim() || "Project photograph";

  return {
    ...project,
    presentation: {
      shortTitle: project.title.trim(),
      summary:
        project.subtitle.trim() ||
        project.description.trim() ||
        project.category.trim(),
      overview: indices[0],
      detail: indices[1],
      secondary: indices[2],
      overviewPosition: position(0),
      detailPosition: position(1),
      secondaryPosition: position(2),
      detailLabel: label(indices[1]),
      secondaryLabel: label(indices[2]),
    },
  };
}

/**
 * Adds preview presentation to an already publication-filtered collection.
 * Does not fetch data, insert records, mutate the input, or change project copy.
 *
 * Original photo paths survive array reordering. Deleted preferred photos use
 * distinct remaining images where possible, then reuse index 0 if fewer than
 * three images remain. Empty galleries return -1 for all roles; renderers must
 * guard `project.images[index]`. Fallbacks use centered framing and the actual
 * selected image's editable alt text, never a stale curated caption.
 *
 * The four lead projects are promoted only when present. Every other project
 * retains its incoming relative order, including newly added records.
 */
export function getConceptProjects(projects: Project[]): ConceptProject[] {
  const rank = new Map<string, number>(
    leadOrder.map((slug, index) => [slug, index]),
  );
  return projects
    .map((project, index) => ({ project, index }))
    .sort(
      (a, b) =>
        (rank.get(a.project.slug) ?? leadOrder.length) -
          (rank.get(b.project.slug) ?? leadOrder.length) || a.index - b.index,
    )
    .map(({ project }) => present(project));
}
