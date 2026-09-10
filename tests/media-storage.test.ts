import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { isCloudinaryProjectUrl, isUploadFilename } from "../lib/media-urls";
import {
  deleteUpload,
  mediaStorage,
  readUpload,
  storeUpload,
} from "../lib/media-storage";
import { projectSchema } from "../lib/validation";
import { seedProjects } from "../lib/seed";

const file = "project-12345678-1234-4234-8234-123456789abc.webp";

function setEnvironment(values: Record<string, string | undefined>) {
  const previous = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]]),
  );
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return () => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
}

test("project validation accepts only public Reliant images in the configured Cloudinary account", () => {
  const restore = setEnvironment({ CLOUDINARY_CLOUD_NAME: "dbg0zy3al" });
  try {
    const valid = `https://res.cloudinary.com/dbg0zy3al/image/upload/v1789000000/reliant/${file}`;
    assert.equal(isCloudinaryProjectUrl(valid), true);
    assert.equal(
      isCloudinaryProjectUrl(
        "https://res.cloudinary.com/dbg0zy3al/image/upload/v123/reliant/catalog-abc123.jpg",
      ),
      true,
    );
    assert.equal(
      projectSchema.safeParse({
        ...seedProjects[0],
        images: [{ src: valid, alt: "A finished Reliant kitchen" }],
      }).success,
      true,
    );
    const invalid = [
      valid.replace("dbg0zy3al", "someone-else"),
      valid.replace("/reliant/", "/another-project/"),
      valid.replace("/upload/", "/authenticated/"),
      valid.replace("/image/", "/raw/"),
      valid.replace("https:", "http:"),
      valid.replace("res.cloudinary.com", "res.cloudinary.com.attacker.test"),
      valid.replace("res.cloudinary.com", "user:password@res.cloudinary.com"),
      valid.replace(".webp", ".svg"),
      valid.replace("/reliant/", "/reliant/%2e%2e/"),
      valid.replace("/reliant/", "/reliant/../reliant/"),
      valid + "?token=private",
      valid + "#fragment",
      valid.replace("/v1789000000/", "/w_800/v1789000000/"),
    ];
    for (const src of invalid) {
      assert.equal(isCloudinaryProjectUrl(src), false, src);
      assert.equal(
        projectSchema.safeParse({
          ...seedProjects[0],
          images: [{ src, alt: "Project image" }],
        }).success,
        false,
        src,
      );
    }
  } finally {
    restore();
  }
});

test("upload filenames cannot address another path, a private asset as public, or executable content", () => {
  assert.equal(isUploadFilename(file), true);
  assert.equal(
    isUploadFilename(
      file.replace("project-", "inquiry-").replace("webp", "pdf"),
    ),
    true,
  );
  for (const name of [
    "../" + file,
    file + "/more",
    file.replace("webp", "pdf"),
    file.replace("webp", "svg"),
    "project-" + "-".repeat(36) + ".webp",
  ]) {
    assert.equal(isUploadFilename(name), false);
  }
});

test("local storage preserves bytes, refuses overwrites, and cleans up only its named file", async () => {
  const directory = await mkdtemp(join(tmpdir(), "reliant-media-test-"));
  const restore = setEnvironment({
    DATA_DIR: directory,
    MEDIA_STORAGE: "local",
  });
  try {
    const bytes = new Uint8Array([10, 20, 30]);
    assert.deepEqual(await storeUpload(file, bytes), {
      src: `/api/uploads/${file}`,
    });
    assert.deepEqual(new Uint8Array((await readUpload(file))!), bytes);
    await assert.rejects(storeUpload(file, new Uint8Array([99])), {
      code: "EEXIST",
    });
    await assert.rejects(
      storeUpload("../escape.webp", bytes),
      /Invalid upload filename/,
    );
    assert.equal(await readUpload("../escape.webp"), null);
    await deleteUpload(file);
    assert.equal(await readUpload(file), null);
    await deleteUpload(file);
    assert.deepEqual(await readdir(join(directory, "uploads")), []);
  } finally {
    restore();
    await rm(directory, { recursive: true, force: true });
  }
});

test("cloudinary configuration failure does not write to an ephemeral local directory", async () => {
  const directory = await mkdtemp(join(tmpdir(), "reliant-media-failure-"));
  const restore = setEnvironment({
    DATA_DIR: directory,
    MEDIA_STORAGE: "cloudinary",
    CLOUDINARY_API_KEY: "",
    CLOUDINARY_API_SECRET: "",
  });
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    throw new Error("Unexpected network request");
  };
  try {
    await assert.rejects(storeUpload(file, new Uint8Array([1])));
    assert.deepEqual(await readdir(directory), []);
    assert.equal(requests, 0);
  } finally {
    restore();
    globalThis.fetch = originalFetch;
    await rm(directory, { recursive: true, force: true });
  }
});

test("production defaults to Cloudinary and invalid storage modes fail explicitly", () => {
  const restore = setEnvironment({
    MEDIA_STORAGE: undefined,
    NODE_ENV: "production",
  });
  try {
    assert.equal(mediaStorage(), "cloudinary");
    process.env.MEDIA_STORAGE = "local";
    assert.equal(mediaStorage(), "local");
    process.env.MEDIA_STORAGE = "cloudnary";
    assert.throws(mediaStorage, /Invalid media storage/);
  } finally {
    restore();
  }
});
