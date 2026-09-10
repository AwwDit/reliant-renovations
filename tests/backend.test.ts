import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { MongoClient } from "mongodb";
import {
  hashPassword,
  verifyPassword,
  createSession,
  verifySession,
  sameOrigin,
  clientKey,
  readBoundedBody,
  RequestBodyTooLarge,
} from "../lib/auth";
import {
  closeDb,
  consumeRateLimit,
  deleteProject,
  getInquiries,
  getProject,
  getProjectById,
  getProjects,
  markInquiryRead,
  reorderProjects,
  saveInquiry,
  saveProject,
  getDb,
  ProjectNotFoundError,
} from "../lib/db";
import { seedProjects } from "../lib/seed";
import {
  detectFileType,
  inquirySchema,
  projectSchema,
} from "../lib/validation";

test("owner password hashing and signed sessions reject wrong, tampered and expired credentials", () => {
  const previousHash = process.env.ADMIN_PASSWORD_HASH;
  const previousSecret = process.env.ADMIN_SESSION_SECRET;
  try {
    process.env.ADMIN_PASSWORD_HASH = hashPassword("strong-test-password-2026");
    process.env.ADMIN_SESSION_SECRET = randomBytes(48).toString("hex");
    assert.equal(verifyPassword("strong-test-password-2026"), true);
    assert.equal(verifyPassword("different-password"), false);
    assert.equal(verifyPassword("password", "scrypt:bad:malformed"), false);
    const now = Date.now();
    const token = createSession(now);
    assert.equal(verifySession(token, now), true);
    assert.equal(verifySession(token + "x", now), false);
    assert.equal(verifySession(token, now + 13 * 60 * 60 * 1000), false);
    assert.equal(verifySession(undefined), false);
    process.env.ADMIN_SESSION_SECRET = randomBytes(48).toString("hex");
    assert.equal(verifySession(token, now), false);
  } finally {
    if (previousHash === undefined) delete process.env.ADMIN_PASSWORD_HASH;
    else process.env.ADMIN_PASSWORD_HASH = previousHash;
    if (previousSecret === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = previousSecret;
  }
});

test("mutations require a trusted origin", () => {
  assert.equal(
    sameOrigin(
      new Request("https://reliant.example/api/projects", {
        headers: { origin: "https://reliant.example" },
      }),
    ),
    true,
  );
  assert.equal(
    sameOrigin(
      new Request("https://reliant.example/api/projects", {
        headers: { origin: "https://attacker.example" },
      }),
    ),
    false,
  );
  assert.equal(
    sameOrigin(new Request("https://reliant.example/api/projects")),
    false,
  );
});

test("image detection checks bytes and disallows executable or unsupported uploads", () => {
  assert.equal(
    detectFileType(new Uint8Array([0xff, 0xd8, 0xff]))?.mime,
    "image/jpeg",
  );
  assert.equal(detectFileType(Buffer.from("not an image")), null);
  assert.equal(
    detectFileType(Buffer.from('<svg onload="alert(1)"></svg>')),
    null,
  );
  assert.equal(detectFileType(Buffer.from("%PDF-1.7")), null);
  assert.equal(
    detectFileType(Buffer.from("%PDF-1.7"), true)?.mime,
    "application/pdf",
  );
});

test("untrusted proxy headers cannot bypass rate limits and streamed bodies have a hard byte limit", async () => {
  const previousTrust = process.env.TRUST_PROXY;
  process.env.TRUST_PROXY = "false";
  try {
    assert.equal(
      clientKey(
        new Request("https://reliant.example", {
          headers: { "x-forwarded-for": "1.2.3.4" },
        }),
      ),
      clientKey(
        new Request("https://reliant.example", {
          headers: { "x-forwarded-for": "5.6.7.8" },
        }),
      ),
    );
    const small = new Request("https://reliant.example", {
      method: "POST",
      body: "hello",
    });
    assert.equal(
      new TextDecoder().decode(await readBoundedBody(small, 5)),
      "hello",
    );
    const oversized = new Request("https://reliant.example", {
      method: "POST",
      body: "too much data",
    });
    await assert.rejects(readBoundedBody(oversized, 5), RequestBodyTooLarge);
  } finally {
    if (previousTrust === undefined) delete process.env.TRUST_PROXY;
    else process.env.TRUST_PROXY = previousTrust;
  }
});

const testMongoUri =
  process.env.MONGODB_TEST_URI ||
  "mongodb://127.0.0.1:27018/?replicaSet=reliant-local";

async function withTestDatabase(run: () => Promise<void>) {
  const previousUri = process.env.MONGODB_URI;
  const previousName = process.env.MONGODB_DB;
  const databaseName = `reliant_test_backend_${randomBytes(12).toString("hex")}`;
  const cleanupClient = new MongoClient(testMongoUri, {
    serverSelectionTimeoutMS: 5000,
  });
  await closeDb();
  process.env.MONGODB_URI = testMongoUri;
  process.env.MONGODB_DB = databaseName;
  let connected = false;
  try {
    await cleanupClient.connect();
    connected = true;
    await run();
  } finally {
    try {
      await closeDb();
      // Cleanup is restricted to this invocation's generated test database.
      assert.match(databaseName, /^reliant_test_backend_[a-f0-9]{24}$/);
      if (connected) await cleanupClient.db(databaseName).dropDatabase();
    } finally {
      try {
        await cleanupClient.close();
      } finally {
        if (previousUri === undefined) delete process.env.MONGODB_URI;
        else process.env.MONGODB_URI = previousUri;
        if (previousName === undefined) delete process.env.MONGODB_DB;
        else process.env.MONGODB_DB = previousName;
      }
    }
  }
}

test("MongoDB seeds once across concurrent access and preserves edits and deletions on reconnect", async () => {
  await withTestDatabase(async () => {
    const snapshots = await Promise.all(
      Array.from({ length: 12 }, () => getProjects({ includeHidden: true })),
    );
    const expectedIds = seedProjects.map((project) => project.id);
    assert.equal(expectedIds.length, 10);
    for (const projects of snapshots) {
      assert.deepEqual(
        projects.map((project) => project.id),
        expectedIds,
      );
      assert.equal(new Set(projects.map((project) => project.slug)).size, 10);
      assert.deepEqual(
        projects.map((project) => project.images),
        seedProjects.map((project) => project.images),
      );
      assert.equal(projects.flatMap((project) => project.images).length, 80);
      assert.ok(
        projects.every((project) =>
          project.images.every((image) =>
            image.src.startsWith("https://res.cloudinary.com/dbg0zy3al/image/upload/"),
          ),
        ),
      );
    }
    const edited = await saveProject({
      ...snapshots[0][0],
      title: "Owner-edited project title",
    });
    const removed = snapshots[0].at(-1)!;
    assert.equal(await deleteProject(removed.id), true);
    await closeDb();
    const reopened = await getProjects({ includeHidden: true });
    assert.equal(reopened.length, 9);
    assert.equal(
      reopened.find((project) => project.id === edited.id)?.title,
      edited.title,
    );
    assert.equal(await getProjectById(removed.id), undefined);
  });
});

test("validated MongoDB projects stay private until published and ordering persists atomically", async () => {
  await withTestDatabase(async () => {
    const input = projectSchema.parse({
      title: "Test studio",
      slug: "test-studio",
      subtitle: "A carefully made space",
      division: "commercial",
      location: "Ottawa, ON",
      category: "Office",
      description: "A detailed description of the completed office renovation.",
      result: "A welcoming and practical workspace.",
      scope: ["Custom millwork"],
      images: [
        {
          src: "/images/project.jpg",
          alt: "Oak workstations alongside large windows",
        },
      ],
      published: false,
      featured: false,
    });
    const created = await saveProject(input);
    assert.ok(created.id);
    assert.equal(await getProject("test-studio"), undefined);
    assert.equal(
      (await getProject("test-studio", { includeHidden: true }))?.title,
      input.title,
    );
    assert.equal((await getProjectById(created.id))?.published, false);
    assert.ok(
      !(await getProjects()).some((project) => project.id === created.id),
    );
    assert.ok(
      (await getProjects({ includeHidden: true, division: "commercial" })).some(
        (project) => project.id === created.id,
      ),
    );
    const published = await saveProject({ ...created, published: true });
    assert.equal((await getProject("test-studio"))?.published, true);
    assert.deepEqual(published.scope, input.scope);
    assert.deepEqual(published.images, input.images);
    const commercial = await getProjects({ division: "commercial" });
    const residential = await getProjects({ division: "residential" });
    assert.equal(commercial.length, 6);
    assert.ok(commercial.every((project) => project.division === "commercial"));
    assert.equal(residential.length, 5);
    assert.ok(
      residential.every((project) => project.division === "residential"),
    );
    await assert.rejects(() => saveProject({ ...input, id: undefined }));
    const before = await getProjects({ includeHidden: true });
    const beforeIds = before.map((project) => project.id);
    for (const invalid of [
      [created.id],
      beforeIds.map((id, index) => (index === 0 ? beforeIds[1] : id)),
      beforeIds.map((id, index) => (index === 0 ? "missing-project-id" : id)),
    ]) {
      await assert.rejects(() => reorderProjects(invalid));
      assert.deepEqual(
        (await getProjects({ includeHidden: true })).map(({ id, order }) => ({
          id,
          order,
        })),
        before.map(({ id, order }) => ({ id, order })),
      );
    }
    const reversed = [...beforeIds].reverse();
    await reorderProjects(reversed);
    await closeDb();
    const reordered = await getProjects({ includeHidden: true });
    assert.deepEqual(
      reordered.map((project) => project.id),
      reversed,
    );
    assert.deepEqual(
      reordered.map((project) => project.order),
      reversed.map((_, index) => index),
    );
    assert.equal(
      projectSchema.safeParse({ ...input, slug: "unsafe/path" }).success,
      false,
    );
    assert.equal(
      projectSchema.safeParse({
        ...input,
        images: [{ src: "javascript:alert(1)", alt: "Bad image" }],
      }).success,
      false,
    );
    assert.equal(
      projectSchema.safeParse({
        ...input,
        images: [{ src: "/images/project.jpg", alt: "" }],
      }).success,
      false,
    );
    assert.equal(await deleteProject(created.id), true);
    await assert.rejects(
      () => saveProject({ ...published, title: "Stale edit after deletion" }),
      ProjectNotFoundError,
    );
    assert.equal(await deleteProject(created.id), false);
    assert.equal(await getProjectById(created.id), undefined);
    assert.equal(await getProject("test-studio"), undefined);
  });
});

test("MongoDB inquiries and read status survive disconnects without exposing storage fields", async () => {
  await withTestDatabase(async () => {
    const inquiry = inquirySchema.parse({
      name: "Test Client",
      email: "client@example.test",
      location: "Ottawa",
      projectType: "commercial",
      timing: "1-3-months",
      description:
        "We would like to renovate the reception and meeting spaces.",
    });
    const saved = await saveInquiry(inquiry, "/api/uploads/inquiry-test.pdf");
    assert.equal(saved.read, false);
    assert.equal("_id" in saved, false);
    const stored = await (
      await getDb()
    )
      .collection("inquiries")
      .findOne({ id: saved.id });
    assert.equal(stored?.attachment, saved.attachment);
    assert.equal(stored?.email, inquiry.email);
    await closeDb();
    assert.deepEqual(
      (await getInquiries()).find((item) => item.id === saved.id),
      saved,
    );
    assert.equal(await markInquiryRead(saved.id, true), true);
    await closeDb();
    const read = (await getInquiries()).find((item) => item.id === saved.id);
    assert.deepEqual(read, { ...saved, read: true });
    assert.equal(await markInquiryRead(saved.id, false), true);
    assert.equal(
      (await getInquiries()).find((item) => item.id === saved.id)?.read,
      false,
    );
    assert.equal(await markInquiryRead("missing-inquiry-id", true), false);
  });
});

test("MongoDB rate limits admit exactly the limit under concurrent requests and reset atomically", async () => {
  await withTestDatabase(async () => {
    const limit = 8;
    const windowMs = 60_000;
    const now = Date.now();
    const attemptWave = (time: number) =>
      Promise.all(
        Array.from({ length: 40 }, () =>
          consumeRateLimit("concurrent-client", limit, windowMs, time),
        ),
      );
    const initial = await attemptWave(now);
    assert.equal(initial.filter(Boolean).length, limit);
    assert.ok((await attemptWave(now + 1)).every((allowed) => !allowed));
    assert.equal(
      await consumeRateLimit("different-client", 1, windowMs, now),
      true,
    );
    assert.equal(
      await consumeRateLimit("different-client", 1, windowMs, now + 1),
      false,
    );
    await closeDb();
    assert.equal(
      await consumeRateLimit("concurrent-client", limit, windowMs, now + 2),
      false,
    );
    const reset = await attemptWave(now + windowMs + 1);
    assert.equal(reset.filter(Boolean).length, limit);
    assert.ok(
      (await attemptWave(now + windowMs + 2)).every((allowed) => !allowed),
    );
  });
});
