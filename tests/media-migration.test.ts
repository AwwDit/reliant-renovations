import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { type TestContext } from "node:test";
import {
  applyMediaPlan,
  buildMediaPlan,
  MediaMigrationError,
  projectImageUpdate,
} from "../scripts/migrate-media-to-cloudinary";

const cloudName = "dbg0zy3al";
const cloudImage =
  "https://res.cloudinary.com/dbg0zy3al/image/upload/v123/reliant/catalog-already.webp";
const projectFilename = "project-11111111-1111-4111-a111-111111111111.webp";
const inquiryFilename = "inquiry-22222222-2222-4222-a222-222222222222.pdf";
const jpg = Buffer.from([0xff, 0xd8, 0xff, 0x01, 0x02]);
const webp = Buffer.from("RIFF1234WEBPfixture");
const pdf = Buffer.from("%PDF-1.7\nfixture");

async function fixture(t: TestContext) {
  const directory = await mkdtemp(join(tmpdir(), "reliant-media-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const publicDirectory = join(directory, "public");
  const uploadsDirectory = join(directory, "data", "uploads");
  await mkdir(join(publicDirectory, "images", "projects"), { recursive: true });
  await mkdir(uploadsDirectory, { recursive: true });
  await writeFile(join(publicDirectory, "images", "projects", "one.jpg"), jpg);
  await writeFile(join(publicDirectory, "images", "projects", "two.jpeg"), jpg);
  await writeFile(join(uploadsDirectory, projectFilename), webp);
  await writeFile(join(uploadsDirectory, inquiryFilename), pdf);
  return { directory, roots: { publicDirectory, uploadsDirectory } };
}

test("media preflight includes hidden projects, preserves Cloudinary references, and scans unique local assets", async (t) => {
  const { roots } = await fixture(t);
  const records = {
    projects: [
      {
        _id: "one",
        published: false,
        images: [
          { src: "/images/projects/one.jpg", alt: "First photo" },
          { src: cloudImage, alt: "Cloud photo" },
        ],
      },
      {
        _id: "two",
        published: true,
        images: [
          { src: "/images/projects/one.jpg" },
          { src: "/images/projects/two.jpeg" },
          { src: `/api/uploads/${projectFilename}` },
        ],
      },
    ],
    inquiries: [
      { attachment: `/api/uploads/${inquiryFilename}` },
      { attachment: null },
    ],
  };
  const snapshot = structuredClone(records);
  const plan = await buildMediaPlan(records, roots, cloudName);
  assert.deepEqual(records, snapshot);
  assert.deepEqual(plan.counts, {
    projects: 2,
    imageReferences: 5,
    existingCloudinaryImages: 1,
    localImageReferences: 4,
    inquiryAttachments: 1,
    uniqueAssets: 4,
    bytes: jpg.length * 2 + webp.length + pdf.length,
  });
  assert.equal(
    plan.assets.find((asset) => asset.source.endsWith(".jpeg"))?.extension,
    "jpg",
  );
  assert.equal(plan.projects.length, 2);
  assert.deepEqual(plan.projects[0].images, [
    { index: 0, source: "/images/projects/one.jpg" },
  ]);
});

test("media preflight rejects missing files, traversal, symlink escapes, remote ingestion, and invalid bytes before uploads", async (t) => {
  const { directory, roots } = await fixture(t);
  await writeFile(join(directory, "outside.jpg"), jpg);
  await symlink(
    join(directory, "outside.jpg"),
    join(roots.publicDirectory, "images", "projects", "escape.jpg"),
  );
  await writeFile(
    join(roots.publicDirectory, "images", "projects", "invalid.jpg"),
    "not an image",
  );
  let uploads = 0;
  for (const source of [
    "/images/projects/missing.jpg",
    "/images/projects/../../outside.jpg",
    "/images/projects/escape.jpg",
    "/images/projects/invalid.jpg",
    "https://example.com/image.jpg?token=PRIVATE",
    "https://res.cloudinary.com/other-account/image/upload/photo.jpg",
    "/api/uploads/project-not-a-uuid.webp",
  ]) {
    await assert.rejects(
      async () => {
        const plan = await buildMediaPlan(
          {
            projects: [
              {
                _id: "one",
                images: [{ src: "/images/projects/one.jpg" }, { src: source }],
              },
            ],
            inquiries: [],
          },
          roots,
          cloudName,
        );
        await applyMediaPlan(plan, {
          uploadCatalog: async () => {
            uploads++;
            return { src: cloudImage };
          },
          uploadFile: async () => {
            uploads++;
            return { src: cloudImage };
          },
          updateProject: async () => ({ matchedCount: 1 }),
        });
      },
      (error: unknown) =>
        error instanceof MediaMigrationError &&
        !error.message.includes("PRIVATE"),
    );
  }
  assert.equal(uploads, 0);
});

test("media preflight rejects inaccessible private references and never treats attachments as public images", async (t) => {
  const { roots } = await fixture(t);
  for (const attachment of [
    cloudImage,
    `/api/uploads/${projectFilename}`,
    "/api/uploads/inquiry-33333333-3333-4333-a333-333333333333.pdf",
  ]) {
    await assert.rejects(
      buildMediaPlan(
        { projects: [], inquiries: [{ attachment }] },
        roots,
        cloudName,
      ),
      MediaMigrationError,
    );
  }
});

test("media migration only changes matching image src fields, preserving copy, alt text, order, and concurrent edits", async (t) => {
  const { roots } = await fixture(t);
  const projects = [
    {
      _id: "one",
      title: "Original",
      images: [{ src: "/images/projects/one.jpg", alt: "Original alt" }],
      order: 8,
      published: false,
    },
    {
      _id: "two",
      title: "Keep",
      images: [{ src: `/api/uploads/${projectFilename}`, alt: "Upload" }],
      order: 3,
      published: true,
    },
  ];
  const plan = await buildMediaPlan(
    { projects, inquiries: [] },
    roots,
    cloudName,
  );
  projects[0].title = "Changed while migration ran";
  projects[0].images[0].alt = "New alternative text";
  projects[1].images[0].src = "/images/projects/replacement.jpg";
  const result = await applyMediaPlan(plan, {
    uploadCatalog: async () => ({ src: cloudImage }),
    uploadFile: async () => ({ src: cloudImage }),
    updateProject: async (filter, update) => {
      const project = projects.find(
        (candidate) => candidate._id === filter._id,
      )!;
      assert.deepEqual(Object.keys(filter).sort(), ["_id", "images.0.src"]);
      assert.deepEqual(Object.keys(update), ["$set"]);
      assert.deepEqual(Object.keys(update.$set), ["images.0.src"]);
      if (project.images[0].src !== filter["images.0.src"])
        return { matchedCount: 0 };
      project.images[0].src = update.$set["images.0.src"];
      return { matchedCount: 1 };
    },
  });
  assert.deepEqual(result, {
    uploadedAssets: 2,
    updatedProjects: 1,
    updatedImages: 1,
    conflicts: 1,
  });
  assert.equal(projects[0].images[0].src, cloudImage);
  assert.equal(projects[0].images[0].alt, "New alternative text");
  assert.equal(projects[0].title, "Changed while migration ran");
  assert.equal(projects[0].order, 8);
  assert.equal(projects[0].published, false);
  assert.equal(projects[1].images[0].src, "/images/projects/replacement.jpg");
});

test("all image positions in a project are compared before its atomic src-only update", () => {
  const uploaded = new Map([
    ["/images/a.jpg", "cloud-a"],
    ["/images/b.jpg", "cloud-b"],
  ]);
  assert.deepEqual(
    projectImageUpdate(
      {
        _id: "project",
        images: [
          { index: 0, source: "/images/a.jpg" },
          { index: 2, source: "/images/b.jpg" },
        ],
      },
      uploaded,
    ),
    {
      filter: {
        _id: "project",
        "images.0.src": "/images/a.jpg",
        "images.2.src": "/images/b.jpg",
      },
      update: {
        $set: { "images.0.src": "cloud-a", "images.2.src": "cloud-b" },
      },
    },
  );
  assert.throws(
    () =>
      projectImageUpdate(
        { _id: "project", images: [{ index: 0, source: "missing" }] },
        uploaded,
      ),
    MediaMigrationError,
  );
});

test("media migration can resume after an upload failure with the same asset IDs and no early database writes", async (t) => {
  const { roots } = await fixture(t);
  const plan = await buildMediaPlan(
    {
      projects: [
        {
          _id: "one",
          images: [
            { src: "/images/projects/one.jpg" },
            { src: "/images/projects/two.jpeg" },
            { src: `/api/uploads/${projectFilename}` },
          ],
        },
      ],
      inquiries: [{ attachment: `/api/uploads/${inquiryFilename}` }],
    },
    roots,
    cloudName,
  );
  const suffixes: string[] = [];
  let writes = 0;
  let fail = true;
  const adapters = {
    uploadCatalog: async (suffix: string) => {
      suffixes.push(suffix);
      return { src: cloudImage };
    },
    uploadFile: async (filename: string) => {
      if (fail) throw new Error("SECRET provider body must not escape");
      return {
        src: filename.startsWith("inquiry-")
          ? `/api/uploads/${filename}`
          : cloudImage,
      };
    },
    updateProject: async () => {
      writes++;
      return { matchedCount: 1 };
    },
  };
  await assert.rejects(
    applyMediaPlan(plan, adapters),
    (error: unknown) =>
      error instanceof MediaMigrationError && !error.message.includes("SECRET"),
  );
  assert.equal(writes, 0);
  fail = false;
  const result = await applyMediaPlan(plan, adapters);
  assert.deepEqual(
    suffixes,
    [0, 0].map(
      () => `catalog-${createHash("sha256").update(jpg).digest("hex")}`,
    ),
  );
  assert.equal(writes, 1);
  assert.equal(result.updatedImages, 3);
  assert.deepEqual(
    await readFile(
      join(roots.publicDirectory, "images", "projects", "one.jpg"),
    ),
    jpg,
  );
  assert.deepEqual(
    await readFile(join(roots.uploadsDirectory, inquiryFilename)),
    pdf,
  );
});

test("changed source bytes abort before database updates, and private URLs cannot be replaced with public URLs", async (t) => {
  const { roots } = await fixture(t);
  const plan = await buildMediaPlan(
    {
      projects: [{ _id: "one", images: [{ src: "/images/projects/one.jpg" }] }],
      inquiries: [],
    },
    roots,
    cloudName,
  );
  await writeFile(
    join(roots.publicDirectory, "images", "projects", "one.jpg"),
    Buffer.concat([jpg, Buffer.from("changed")]),
  );
  let writes = 0;
  const adapters = {
    uploadCatalog: async () => ({ src: cloudImage }),
    uploadFile: async () => ({ src: cloudImage }),
    updateProject: async () => {
      writes++;
      return { matchedCount: 1 };
    },
  };
  await assert.rejects(
    applyMediaPlan(plan, adapters),
    /changed after preflight/,
  );
  const privatePlan = await buildMediaPlan(
    {
      projects: [],
      inquiries: [{ attachment: `/api/uploads/${inquiryFilename}` }],
    },
    roots,
    cloudName,
  );
  await assert.rejects(
    applyMediaPlan(privatePlan, adapters),
    /could not safely store/,
  );
  assert.equal(writes, 0);
});

test("already migrated project images need no local files or uploads", async (t) => {
  const { roots } = await fixture(t);
  await rm(roots.publicDirectory, { recursive: true });
  const plan = await buildMediaPlan(
    {
      projects: [
        { _id: "one", images: [{ src: cloudImage, alt: "Keep this" }] },
      ],
      inquiries: [],
    },
    roots,
    cloudName,
  );
  const unreachable = async () => {
    throw new Error("must not be called");
  };
  assert.deepEqual(
    await applyMediaPlan(plan, {
      uploadCatalog: unreachable,
      uploadFile: unreachable,
      updateProject: unreachable,
    }),
    { uploadedAssets: 0, updatedProjects: 0, updatedImages: 0, conflicts: 0 },
  );
});
