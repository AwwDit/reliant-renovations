import assert from "node:assert/strict";
import test from "node:test";
import { projectMedia } from "../lib/project-media-manifest";
import {
  isProjectMediaSource,
  originalProjectMediaSource,
  projectMediaSource,
} from "../lib/project-media";
import { seedProjects } from "../lib/seed";
import { getConceptProjects } from "../lib/concept-projects";
import { isCloudinaryProjectUrl } from "../lib/media-urls";
import imageManifest from "../docs/PROJECT-IMAGE-MANIFEST.json";
import type { Project } from "../lib/types";

test("fresh catalog seeds contain all 80 uploaded photos and retain their original dimension metadata", () => {
  assert.equal(seedProjects.length, 10);
  assert.equal(Object.keys(projectMedia).length, 80);
  assert.equal(seedProjects.flatMap(({ images }) => images).length, 80);
  for (const project of seedProjects) {
    assert.equal(project.images.length, 8);
    project.images.forEach((image, index) => {
      const local = `/images/projects/${project.slug}/${String(index + 1).padStart(2, "0")}.webp`;
      assert.ok(Object.hasOwn(projectMedia, local));
      assert.equal(image.src, projectMedia[local]);
      assert.equal(isCloudinaryProjectUrl(image.src, "dbg0zy3al"), true);
      const original = imageManifest.files.find(
        ({ file }) => file === `public${local}`,
      );
      const migrated = imageManifest.files.find(
        ({ file }) => file === `public${originalProjectMediaSource(image.src)}`,
      );
      assert.ok(original);
      assert.ok(migrated);
      assert.deepEqual(migrated.dimensions, original.dimensions);
      assert.ok(image.alt.trim());
    });
  }
});

test("curated identity accepts original or migrated sources without confusing other photos or hosts", () => {
  const local = "/images/projects/upper-west-side-apartment/06.webp";
  const migrated = projectMediaSource(local);
  assert.notEqual(migrated, local);
  for (const source of [
    local,
    migrated,
    `${local}?cache=1`,
    `${migrated}?cache=1#photo`,
  ]) {
    assert.equal(isProjectMediaSource(source, local), true);
  }
  assert.equal(
    isProjectMediaSource(
      projectMediaSource("/images/projects/upper-west-side-apartment/01.webp"),
      local,
    ),
    false,
  );
  assert.equal(
    isProjectMediaSource(
      migrated.replace("res.cloudinary.com", "example.com"),
      local,
    ),
    false,
  );
  assert.equal(isProjectMediaSource(undefined, local), false);
  assert.equal(originalProjectMediaSource(`${migrated}?cache=1#photo`), local);
  for (const source of [
    "/images/brand/logo.png",
    "/api/uploads/owner-photo.webp",
    "https://example.com/new-photo.webp",
  ]) {
    assert.equal(projectMediaSource(source), source);
    assert.equal(originalProjectMediaSource(source), source);
  }
});

function selected(project: Project) {
  const [{ presentation }] = getConceptProjects([project]);
  return {
    images: [
      presentation.overview,
      presentation.detail,
      presentation.secondary,
    ].map((index) => project.images[index]?.src),
    positions: [
      presentation.overviewPosition,
      presentation.detailPosition,
      presentation.secondaryPosition,
    ],
  };
}

test("curated framing survives migrated URLs and owner gallery reordering", () => {
  for (const seeded of seedProjects) {
    const original = {
      ...seeded,
      images: seeded.images.map((image) => ({
        ...image,
        src: originalProjectMediaSource(image.src),
      })),
    };
    const before = selected(original);
    const reordered = { ...seeded, images: [...seeded.images].reverse() };
    const snapshot = structuredClone(reordered);
    const after = selected(reordered);
    assert.deepEqual(
      after.images,
      before.images.map((source) => projectMediaSource(source!)),
    );
    assert.deepEqual(after.positions, before.positions);
    assert.deepEqual(reordered, snapshot);
  }
});

test("deleted curated photos use distinct remaining images without stealing surviving selections", () => {
  const project = seedProjects.find(
    ({ slug }) => slug === "upper-west-side-apartment",
  )!;
  const remaining = { ...project, images: project.images.slice(1).reverse() };
  const result = selected(remaining);
  assert.equal(result.images[0], project.images[7].src);
  assert.equal(result.images[1], project.images[6].src);
  assert.equal(result.images[2], project.images[5].src);
  assert.deepEqual(result.positions, ["50% 50%", "50% 50%", "50% 52%"]);
  assert.equal(new Set(result.images).size, 3);
  const empty = getConceptProjects([{ ...project, images: [] }])[0]
    .presentation;
  assert.deepEqual(
    [empty.overview, empty.detail, empty.secondary],
    [-1, -1, -1],
  );
});
