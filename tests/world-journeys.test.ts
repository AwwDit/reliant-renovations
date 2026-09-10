import assert from "node:assert/strict";
import test from "node:test";
import { getWorldJourney } from "../lib/world-journeys";
import type { Project } from "../lib/types";

function project(
  slug: string,
  division: "commercial" | "residential",
  published = true,
): Project {
  return {
    id: slug,
    slug,
    title: slug,
    subtitle: "Scope",
    division,
    location: "New York",
    category: "Renovation",
    description: "Documented scope",
    result: "Finished work",
    scope: ["Carpentry"],
    images: [{ src: `/images/${slug}.webp`, alt: slug }],
    featured: false,
    published,
    order: 0,
    updatedAt: "2026-09-07",
  };
}

test("unpublishing the commercial source removes both its generated sequence and project references", () => {
  const cane = project("raising-canes-forest-hills", "commercial");
  const secondary = project("lidl-harlem", "commercial");
  assert.equal(
    getWorldJourney("commercial", [cane, secondary]).filter(
      (c) => c.scene.video,
    ).length,
    2,
  );
  const remaining = getWorldJourney("commercial", [
    { ...cane, published: false },
    secondary,
  ]);
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].id, "flooring");
  assert.ok(
    remaining.every((c) => !c.scene.video && c.project?.slug !== cane.slug),
  );
});

test("illustrative residential rooms survive empty portfolio without invented case-study links", () => {
  const rooms = getWorldJourney("residential", []);
  assert.deepEqual(
    rooms.map((c) => c.id),
    ["entry", "living", "kitchen", "bathroom"],
  );
  assert.ok(
    rooms.every((c) => !c.project && c.features.every((f) => !f.project)),
  );
  assert.ok(
    rooms.every((c) => c.provenance === "Illustrative interior concept"),
  );
});

test("published basement and exterior scenes use current owner-managed images", () => {
  const basement = project("hicksville-basement", "residential");
  const exterior = project("kings-park-exterior", "residential");
  const rooms = getWorldJourney("residential", [basement, exterior]);
  assert.equal(
    rooms.find((c) => c.id === "basement")?.scene.image,
    basement.images[0].src,
  );
  assert.equal(
    rooms.find((c) => c.id === "exterior")?.scene.image,
    exterior.images[0].src,
  );
  assert.equal(
    getWorldJourney("residential", [{ ...basement, published: false }]).length,
    4,
  );
});
