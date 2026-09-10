import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  deleteCloudinaryFile,
  readCloudinaryFile,
  uploadCloudinaryFile,
  uploadCloudinaryProjectAsset,
} from "../lib/cloudinary";

const apiKey = "fake-cloudinary-key";
const apiSecret = "fake-cloudinary-secret";
const uuid = "12345678-1234-4234-8234-123456789012";
const project = `project-${uuid}.jpg`;
const inquiry = `inquiry-${uuid}.pdf`;
const bytes = new Uint8Array([1, 2, 3, 4]);
const version = 1700000000;

function payload(filename = project, extra: Record<string, unknown> = {}) {
  const privateFile = filename.startsWith("inquiry-");
  const publicId = `reliant/${privateFile ? filename : filename.replace(/\.[^.]+$/, "")}`;
  const resourceType = privateFile ? "raw" : "image";
  const type = privateFile ? "authenticated" : "upload";
  const format = filename.split(".").at(-1)!;
  return {
    asset_id: "abcdef1234567890abcdef1234567890",
    public_id: publicId,
    version,
    resource_type: resourceType,
    type,
    format,
    asset_folder: "reliant",
    secure_url: `https://res.cloudinary.com/dbg0zy3al/${resourceType}/${type}/v${version}/${publicId}${privateFile ? "" : `.${format}`}`,
    signature: createHash("sha1")
      .update(`public_id=${publicId}&version=${version}${apiSecret}`)
      .digest("hex"),
    ...extra,
  };
}

function setup(t: TestContext) {
  for (const [key, value] of Object.entries({
    CLOUDINARY_CLOUD_NAME: "",
    CLOUDINARY_ASSET_FOLDER: "",
    CLOUDINARY_API_KEY: apiKey,
    CLOUDINARY_API_SECRET: apiSecret,
  })) {
    const previous = process.env[key];
    process.env[key] = value;
    t.after(() => {
      if (previous === undefined) delete process.env[key];
      else process.env[key] = previous;
    });
  }
  // All requests are mocked. These tests never access a Cloudinary account.
  return t.mock.method(globalThis, "fetch", async () =>
    Response.json(payload()),
  );
}

function verifySignature(form: FormData | URLSearchParams) {
  const values: string[] = [];
  for (const [key, value] of form.entries()) {
    if (!["signature", "api_key", "file"].includes(key))
      values.push(`${key}=${value}`);
  }
  assert.equal(
    form.get("signature"),
    createHash("sha256")
      .update(values.sort().join("&") + apiSecret)
      .digest("hex"),
  );
  assert.equal(form.get("api_key"), apiKey);
  assert.equal(form.has("api_secret"), false);
}

test("public project uploads use signed dynamic folders with an independent isolated public ID", async (t) => {
  const request = setup(t);
  const result = await uploadCloudinaryFile(project, bytes);
  assert.deepEqual(result, { src: payload().secure_url });
  const [url, options] = request.mock.calls[0].arguments;
  assert.equal(url, "https://api.cloudinary.com/v1_1/dbg0zy3al/image/upload");
  assert.equal(options?.method, "POST");
  assert.equal(options?.cache, "no-store");
  assert.equal(options?.redirect, "error");
  assert.ok(options?.signal instanceof AbortSignal);
  const form = options?.body as FormData;
  assert.equal(form.get("asset_folder"), "reliant");
  assert.equal(form.get("public_id"), `reliant/project-${uuid}`);
  assert.equal(form.get("overwrite"), "false");
  assert.equal(form.get("use_asset_folder_as_public_id_prefix"), "false");
  assert.equal(form.has("folder"), false);
  assert.equal(form.get("type"), "upload");
  assert.deepEqual(
    new Uint8Array(await (form.get("file") as Blob).arrayBuffer()),
    bytes,
  );
  verifySignature(form);
  assert.equal(JSON.stringify(result).includes(apiKey), false);
  assert.equal(JSON.stringify(result).includes(apiSecret), false);
});

test("inquiry attachments are authenticated raw assets whose public response remains local", async (t) => {
  const request = setup(t);
  request.mock.mockImplementation(async () => Response.json(payload(inquiry)));
  const result = await uploadCloudinaryFile(inquiry, bytes);
  assert.deepEqual(result, { src: `/api/uploads/${inquiry}` });
  const [url, options] = request.mock.calls[0].arguments;
  assert.equal(url, "https://api.cloudinary.com/v1_1/dbg0zy3al/raw/upload");
  const form = options?.body as FormData;
  assert.equal(form.get("type"), "authenticated");
  assert.equal(form.get("public_id"), `reliant/${inquiry}`);
  assert.equal(form.get("asset_folder"), "reliant");
  verifySignature(form);
});

test("catalog uploads have deterministic names, accept jpeg, and never overwrite existing content", async (t) => {
  const request = setup(t);
  const digest = createHash("sha256").update(bytes).digest("hex");
  request.mock.mockImplementation(async () =>
    Response.json(payload(`catalog-${digest}.jpg`, { existing: true })),
  );
  request.mock.mockImplementationOnce(async () => new Response(bytes), 1);
  const result = await uploadCloudinaryProjectAsset(
    `catalog-${digest}`,
    bytes,
    ".jpeg",
  );
  assert.equal(result.src, payload(`catalog-${digest}.jpg`).secure_url);
  assert.equal(request.mock.callCount(), 2);
  const form = request.mock.calls[0].arguments[1]?.body as FormData;
  assert.equal(form.get("overwrite"), "false");
  assert.equal(form.get("public_id"), `reliant/catalog-${digest}`);
  assert.equal(
    String(request.mock.calls[1].arguments[0]).endsWith("/asset/download"),
    true,
  );
});

test("an existing deterministic asset must contain the same bytes before reuse", async (t) => {
  const request = setup(t);
  request.mock.mockImplementation(async () =>
    Response.json(payload(project, { existing: true })),
  );
  request.mock.mockImplementationOnce(
    async () => new Response(new Uint8Array([9, 8, 7])),
    1,
  );
  await assert.rejects(uploadCloudinaryFile(project, bytes), {
    message: "Unable to store the file in Cloudinary.",
  });
  assert.equal(request.mock.callCount(), 2);
});

test("private reads resolve only the exact scoped asset and fetch bytes with a short-lived signed POST", async (t) => {
  const request = setup(t);
  request.mock.mockImplementation(async () => Response.json(payload(inquiry)));
  request.mock.mockImplementationOnce(async () => new Response(bytes), 1);
  const before = Math.floor(Date.now() / 1000);
  assert.deepEqual(
    Array.from((await readCloudinaryFile(inquiry))!),
    Array.from(bytes),
  );
  const [lookupUrl, lookup] = request.mock.calls[0].arguments;
  assert.equal(
    lookupUrl,
    `https://api.cloudinary.com/v1_1/dbg0zy3al/resources/raw/authenticated/${encodeURIComponent(`reliant/${inquiry}`)}`,
  );
  assert.equal(
    new Headers(lookup?.headers).get("authorization"),
    `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`,
  );
  const [url, options] = request.mock.calls[1].arguments;
  assert.equal(url, "https://api.cloudinary.com/v1_1/dbg0zy3al/asset/download");
  assert.equal(options?.method, "POST");
  assert.equal(options?.cache, "no-store");
  assert.equal(options?.redirect, "error");
  const form = options?.body as URLSearchParams;
  verifySignature(form);
  assert.equal(form.get("asset_id"), payload().asset_id);
  assert.equal(
    Number(form.get("expires_at")) - Number(form.get("timestamp")),
    60,
  );
  assert.ok(Number(form.get("timestamp")) >= before);
  assert.equal(form.has("format"), false);
  for (const call of request.mock.calls) {
    assert.equal(String(call.arguments[0]).includes(apiKey), false);
    assert.equal(String(call.arguments[0]).includes(apiSecret), false);
    assert.equal(String(call.arguments[0]).includes("signature="), false);
  }
});

test("missing files return null but provider errors do not masquerade as missing files", async (t) => {
  const request = setup(t);
  request.mock.mockImplementation(
    async () => new Response("", { status: 404 }),
  );
  assert.equal(await readCloudinaryFile(project), null);
  request.mock.mockImplementation(
    async () => new Response(apiSecret, { status: 403 }),
  );
  await assert.rejects(readCloudinaryFile(project), {
    message: "Unable to read the file from Cloudinary.",
  });
});

test("cleanup deletes one validated file and cannot target arbitrary account assets or the catalog", async (t) => {
  const request = setup(t);
  request.mock.mockImplementation(async () => Response.json({ result: "ok" }));
  await deleteCloudinaryFile(inquiry);
  const [url, options] = request.mock.calls[0].arguments;
  assert.equal(url, "https://api.cloudinary.com/v1_1/dbg0zy3al/raw/destroy");
  const form = options?.body as URLSearchParams;
  assert.equal(form.get("public_id"), `reliant/${inquiry}`);
  assert.equal(form.get("type"), "authenticated");
  assert.equal(form.get("invalidate"), "true");
  verifySignature(form);
  for (const invalid of [
    "../other-project/image.jpg",
    "catalog-example.jpg",
    "reliant/",
    `project-${uuid}.pdf`,
    `project-${uuid}.jpg?x=1`,
  ]) {
    await assert.rejects(deleteCloudinaryFile(invalid), {
      message: "Invalid storage filename.",
    });
  }
  assert.equal(request.mock.callCount(), 1);
});

test("upload responses must match the expected account, identity, type, folder, format and signature", async (t) => {
  const request = setup(t);
  for (const change of [
    { public_id: "other/asset" },
    { type: "authenticated" },
    { resource_type: "raw" },
    { asset_folder: "other-project" },
    { format: "svg" },
    { signature: "0".repeat(40) },
    { signature: undefined },
    { overwritten: true },
    { version: -1 },
    { secure_url: payload().secure_url.replace("dbg0zy3al", "another-cloud") },
    { secure_url: `${payload().secure_url}?signature=sensitive` },
    { secure_url: payload().secure_url.replace("https:", "http:") },
  ]) {
    request.mock.mockImplementation(async () =>
      Response.json(payload(project, change)),
    );
    await assert.rejects(uploadCloudinaryFile(project, bytes), {
      message: "Unable to store the file in Cloudinary.",
    });
  }
});

test("credentials, invalid configuration, sizes and identifiers fail before any network request", async (t) => {
  const request = setup(t);
  for (const [key, invalid] of [
    ["CLOUDINARY_API_KEY", ""],
    ["CLOUDINARY_API_SECRET", ""],
    ["CLOUDINARY_CLOUD_NAME", "cloud/other"],
    ["CLOUDINARY_ASSET_FOLDER", "../other"],
  ]) {
    const previous = process.env[key];
    process.env[key] = invalid;
    await assert.rejects(uploadCloudinaryFile(project, bytes), {
      message: "Cloudinary storage is not configured correctly.",
    });
    process.env[key] = previous;
  }
  await assert.rejects(
    uploadCloudinaryFile(project, new Uint8Array()),
    /Invalid storage file size/,
  );
  await assert.rejects(
    uploadCloudinaryProjectAsset("other-project", bytes, "jpg"),
    /Invalid project asset identifier/,
  );
  await assert.rejects(
    uploadCloudinaryProjectAsset("catalog-../other", bytes, "jpg"),
    /Invalid project asset identifier/,
  );
  await assert.rejects(
    uploadCloudinaryProjectAsset("catalog-image", bytes, "svg"),
    /Invalid project asset identifier/,
  );
  assert.equal(request.mock.callCount(), 0);
});

test("provider failures and timeout errors never leak request details and are not retried", async (t) => {
  const request = setup(t);
  const deadline = t.mock.method(AbortSignal, "timeout", () =>
    AbortSignal.abort(),
  );
  request.mock.mockImplementation(async () => {
    throw new Error(`Provider failure ${apiKey} ${apiSecret}`);
  });
  await assert.rejects(uploadCloudinaryFile(project, bytes), {
    message: "Unable to store the file in Cloudinary.",
  });
  assert.equal(request.mock.callCount(), 1);
  assert.equal(deadline.mock.calls[0].arguments[0], 30_000);
  assert.equal(request.mock.calls[0].arguments[1]?.signal?.aborted, true);
});
