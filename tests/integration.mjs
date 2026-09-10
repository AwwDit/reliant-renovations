import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash, randomBytes, scryptSync } from "node:crypto";
import { createServer } from "node:net";
import { MongoClient } from "mongodb";

// Disposable test server: never reuses the website's database or real email configuration.
const directory = await mkdtemp(join(tmpdir(), "reliant-integration-"));
const portProbe = createServer();
const port = await new Promise((resolve, reject) => {
  portProbe.once("error", reject);
  portProbe.listen(0, "127.0.0.1", () => {
    const address = portProbe.address();
    portProbe.close((error) => (error ? reject(error) : resolve(address.port)));
  });
});
const origin = `http://127.0.0.1:${port}`;
const databaseName = `reliant_test_integration_${randomBytes(12).toString("hex")}`;
const mongoUri =
  process.env.MONGODB_TEST_URI ||
  "mongodb://127.0.0.1:27018/?replicaSet=reliant-local";
const databaseClient = new MongoClient(mongoUri, {
  serverSelectionTimeoutMS: 5000,
});
const password = randomBytes(24).toString("hex");
const salt = randomBytes(16).toString("hex");
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  {
    env: {
      ...process.env,
      NODE_ENV: "production",
      DATA_DIR: directory,
      MEDIA_STORAGE: "local",
      CLOUDINARY_API_KEY: "",
      CLOUDINARY_API_SECRET: "",
      GOOGLE_PLACES_API_KEY: "",
      // Explicit process env takes precedence over Next's .env.local settings.
      MONGODB_URI: mongoUri,
      MONGODB_DB: databaseName,
      SITE_URL: origin,
      NEXT_PUBLIC_SITE_URL: origin,
      SITE_INDEXABLE: "false",
      ADMIN_PASSWORD_HASH: `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`,
      ADMIN_SESSION_SECRET: randomBytes(48).toString("hex"),
      ADMIN_EMAIL: "recovery@example.test",
      TRUST_PROXY: "false",
      RESEND_API_KEY: "",
      INQUIRY_TO_EMAIL: "",
      INQUIRY_FROM_EMAIL: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let serverOutput = "";
let serverError;
child.once("error", (error) => {
  serverError = error;
});
child.stdout.on("data", (chunk) => {
  serverOutput += chunk;
});
child.stderr.on("data", (chunk) => {
  serverOutput += chunk;
});
let cookie = "";
let assertions = 0;
let databaseConnected = false;
function check(condition, message) {
  assert.ok(condition, message);
  assertions++;
}
async function request(path, options = {}) {
  return fetch(origin + path, {
    ...options,
    headers: { origin, ...(cookie ? { cookie } : {}), ...options.headers },
  });
}
async function json(path, method, body) {
  return request(path, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
try {
  await databaseClient.connect();
  databaseConnected = true;
  check(
    databaseClient.db(databaseName).databaseName === databaseName,
    "MongoDB test database is isolated",
  );
  let ready = false;
  for (let i = 0; i < 80; i++) {
    if (serverError) throw serverError;
    if (child.exitCode !== null) throw new Error(serverOutput);
    try {
      const r = await fetch(origin, { signal: AbortSignal.timeout(2000) });
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  check(ready, "Production server starts");
  check(
    child.exitCode === null && !serverError,
    "Test process owns the server",
  );
  for (const path of [
    "/",
    "/commercial",
    "/residential",
    "/projects",
    "/about",
    "/contact",
    "/privacy",
    "/projects/upper-west-side-apartment",
    "/projects/raising-canes-forest-hills",
  ]) {
    const response = await request(path);
    check(response.status === 200, `${path} renders`);
    const html = await response.text();
    check(html.includes("<h1"), `${path} has a primary heading`);
    check(
      /name="robots" content="noindex/.test(html),
      `${path} remains noindex before launch`,
    );
  }
  check(
    (await request("/api/projects")).status === 401,
    "Project management requires authentication",
  );
  check(
    (await request("/api/inquiries")).status === 401,
    "Inquiry inbox requires authentication",
  );
  check(
    (await json("/api/auth/login", "POST", { password: "invalid-password" }))
      .status === 401,
    "Wrong password is rejected",
  );
  const login = await json("/api/auth/login", "POST", { password });
  check(login.ok, "Owner can sign in");
  cookie = login.headers.get("set-cookie")?.split(";")[0] || "";
  check(cookie.startsWith("reliant_admin="), "Signed session cookie is issued");
  const admin = await request("/admin");
  const adminHtml = await admin.text();
  check(
    admin.ok &&
      adminHtml.includes('id="admin-content"') &&
      adminHtml.includes('class="ad-project-grid"'),
    "Authenticated owner dashboard renders",
  );
  const data = await (await request("/api/projects")).json();
  check(data.projects.length === 10, "Ten real projects seed once");
  check(
    (await databaseClient
      .db(databaseName)
      .collection("projects")
      .countDocuments()) === 10,
    "Server writes to the generated MongoDB database",
  );
  const seedSnapshots = await Promise.all(
    Array.from(
      { length: 5 },
      async () => (await (await request("/api/projects")).json()).projects,
    ),
  );
  check(
    seedSnapshots.every((projects) => projects.length === 10),
    "Repeated access does not reseed projects",
  );
  check(
    data.projects.every((project) => !("_id" in project)),
    "MongoDB storage IDs stay outside the project API",
  );
  const fixture = {
    ...data.projects[0],
    id: undefined,
    slug: "integration-project",
    title: "Integration project",
    published: false,
    featured: false,
  };
  const created = await json("/api/projects", "POST", fixture);
  check(created.status === 201, "Owner can create draft project");
  const project = (await created.json()).project;
  check(
    (await json("/api/projects", "POST", fixture)).status === 409,
    "Duplicate project slugs are rejected",
  );
  check(
    (await (await request("/api/projects")).json()).projects.some(
      (item) => item.id === project.id && !item.published,
    ),
    "Owner can retrieve the persisted draft",
  );
  check(
    (await request("/projects/integration-project")).status === 404,
    "Draft project is absent from public route",
  );
  check(
    (
      await json(`/api/projects/${project.id}`, "PUT", {
        ...project,
        published: true,
      })
    ).ok,
    "Owner can publish project",
  );
  check(
    (await request("/projects/integration-project")).status === 200,
    "Published project is immediately public",
  );
  check(
    (
      await json(`/api/projects/${project.id}`, "PUT", {
        ...project,
        slug: "broken-link",
      })
    ).status === 400,
    "Existing URL is protected",
  );
  const crossOrigin = await fetch(`${origin}/api/projects/${project.id}`, {
    method: "DELETE",
    headers: { cookie, origin: "https://different.example" },
  });
  check(crossOrigin.status === 403, "Cross-origin mutations are rejected");
  const all = (await (await request("/api/projects")).json()).projects;
  check(
    (await json("/api/projects/reorder", "POST", { ids: [project.id] }))
      .status === 409,
    "Incomplete reorder is rejected",
  );
  check(
    JSON.stringify(
      (await (await request("/api/projects")).json()).projects.map(
        (item) => item.id,
      ),
    ) === JSON.stringify(all.map((item) => item.id)),
    "Rejected reorder leaves the whole collection unchanged",
  );
  check(
    (
      await json("/api/projects/reorder", "POST", {
        ids: all.map((p) => p.id).reverse(),
      })
    ).ok,
    "Owner can reorder portfolio",
  );
  const reordered = (await (await request("/api/projects")).json()).projects;
  check(
    JSON.stringify(reordered.map((item) => item.id)) ===
      JSON.stringify(all.map((item) => item.id).reverse()),
    "Portfolio order persists across API requests",
  );
  check(
    reordered.every((item, index) => item.order === index),
    "Persisted order is contiguous",
  );
  const imageForm = new FormData();
  imageForm.set(
    "file",
    new Blob(
      [
        await readFile(
          "public/images/projects/upper-west-side-apartment/01.webp",
        ),
      ],
      { type: "image/webp" },
    ),
    "photo.webp",
  );
  const uploaded = await request("/api/uploads", {
    method: "POST",
    body: imageForm,
  });
  check(uploaded.status === 201, "Owner can upload a real project photo");
  const upload = (await uploaded.json()).src;
  check(
    (await request(upload)).headers.get("content-type") === "image/webp",
    "Uploaded image is served as WebP",
  );
  const malformed = new FormData();
  malformed.set(
    "file",
    new Blob([Buffer.from([0xff, 0xd8, 0xff, 0, 1, 2])], {
      type: "image/jpeg",
    }),
    "invalid.jpg",
  );
  check(
    (await request("/api/uploads", { method: "POST", body: malformed }))
      .status === 400,
    "Malformed image is rejected by decoder",
  );
  const form = new FormData();
  for (const [key, value] of Object.entries({
    name: "Integration test",
    company: "",
    email: "integration@example.com",
    phone: "",
    location: "New York",
    projectType: "residential",
    timing: "flexible",
    description:
      "Disposable integration test inquiry for a kitchen renovation.",
    website: "",
  }))
    form.set(key, value);
  form.set(
    "attachment",
    new Blob(["%PDF-1.4\n% Test-only document\n%%EOF"], {
      type: "application/pdf",
    }),
    "test.pdf",
  );
  const inquiryResponse = await request("/api/inquiries", {
    method: "POST",
    body: form,
  });
  check(
    inquiryResponse.status === 201,
    "Inquiry accepts an optional empty phone and attachment",
  );
  const inquiryResult = await inquiryResponse.json();
  check(
    inquiryResult.emailSent === false &&
      inquiryResult.confirmationEmailSent === false,
    "Neither owner nor confirmation email is claimed with delivery disabled",
  );
  const inquiries = (await (await request("/api/inquiries")).json()).inquiries;
  check(inquiries.length === 1, "Inquiry persists in owner inbox");
  const inboxLink = await request("/admin?view=inquiries");
  check(
    inboxLink.ok &&
      (await inboxLink.text()).includes('class="ad-inquiry-list"'),
    "Email deep link opens the authenticated inquiry inbox",
  );
  const unknownAdminView = await request("/admin?view=unknown");
  check(
    unknownAdminView.ok &&
      (await unknownAdminView.text()).includes('class="ad-project-grid"'),
    "Unknown admin view safely opens Projects",
  );
  check(
    inquiries[0].read === false && !("_id" in inquiries[0]),
    "New inquiry is unread without MongoDB storage fields",
  );
  const storedInquiry = await databaseClient
    .db(databaseName)
    .collection("inquiries")
    .findOne({ id: inquiries[0].id });
  check(
    storedInquiry?.email === "integration@example.com",
    "Submitted inquiry is durable in the isolated MongoDB database",
  );
  check(
    (await json(`/api/inquiries/${inquiries[0].id}`, "PATCH", { read: true }))
      .ok,
    "Owner can mark inquiry read",
  );
  check(
    (await (await request("/api/inquiries")).json()).inquiries[0].read === true,
    "Read status persists across requests",
  );
  check(
    (await json(`/api/inquiries/${inquiries[0].id}`, "PATCH", { read: false }))
      .ok,
    "Owner can mark inquiry unread",
  );
  check(
    (await (await request("/api/inquiries")).json()).inquiries[0].read ===
      false,
    "Unread status persists across requests",
  );
  check(
    (await request(inquiries[0].attachment)).ok,
    "Owner can download private attachment",
  );
  check(
    (await fetch(origin + inquiries[0].attachment)).status === 401,
    "Anonymous users cannot download inquiry attachment",
  );
  const optimized = await request(
    "/_next/image?url=%2Fimages%2Fprojects%2Fupper-west-side-apartment%2F01.webp&w=640&q=75",
  );
  check(optimized.ok, "Next image optimization serves actual project photo");
  check(
    (await request(`/api/projects/${project.id}`, { method: "DELETE" })).ok,
    "Owner can remove disposable project",
  );
  check(
    (await request("/projects/integration-project")).status === 404,
    "Deleted project is no longer public",
  );
  const forgotResponse = await json("/api/auth/forgot-password", "POST", {
    email: "unregistered@example.test",
  });
  const ownerForgotResponse = await json("/api/auth/forgot-password", "POST", {
    email: "recovery@example.test",
  });
  check(
    forgotResponse.status === 200 &&
      ownerForgotResponse.status === 200 &&
      JSON.stringify(await forgotResponse.json()) ===
        JSON.stringify(await ownerForgotResponse.json()),
    "Password recovery does not disclose whether an address matches",
  );
  check(
    (
      await fetch(origin + "/api/auth/reset-password", {
        method: "POST",
        headers: {
          origin: "https://untrusted.example.test",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          token: "a".repeat(64),
          password: "fake-password-never-applied",
        }),
      })
    ).status === 403,
    "Password reset rejects an untrusted origin",
  );
  // Seed only a synthetic digest in this generated test database; no reset email is sent.
  const resetToken = randomBytes(32).toString("hex");
  await databaseClient
    .db(databaseName)
    .collection("settings")
    .updateOne(
      { key: "owner-auth" },
      {
        $set: {
          resetTokenHash: createHash("sha256").update(resetToken).digest("hex"),
          resetExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
        $setOnInsert: { sessionVersion: 0 },
      },
      { upsert: true },
    );
  // An allowed 512-character password can exceed 2 KB after JSON escaping.
  // Reset and login must accept the same bounded password space.
  const newPassword = "\u0001".repeat(512);
  const resetResponse = await json("/api/auth/reset-password", "POST", {
    token: resetToken,
    password: newPassword,
  });
  check(resetResponse.ok, "A valid one-time token resets the owner password");
  check(
    /Max-Age=0/i.test(resetResponse.headers.get("set-cookie") || ""),
    "Password reset clears the browser session cookie",
  );
  check(
    (await request("/api/inquiries")).status === 401,
    "Password reset revokes an existing signed session",
  );
  check(
    (await json("/api/auth/login", "POST", { password })).status === 401,
    "The old bootstrap password is rejected after recovery",
  );
  check(
    (
      await json("/api/auth/reset-password", "POST", {
        token: resetToken,
        password: newPassword,
      })
    ).status === 400,
    "A reset link cannot be reused",
  );
  const recoveredLogin = await json("/api/auth/login", "POST", {
    password: newPassword,
  });
  check(
    recoveredLogin.ok,
    "The new MongoDB password can sign in even when JSON escaping exceeds 2 KB",
  );
  cookie = recoveredLogin.headers.get("set-cookie")?.split(";")[0] || "";
  check(
    (await request("/api/inquiries")).ok,
    "The new session can open the protected inbox",
  );
  check(
    (await request("/api/auth/logout", { method: "POST" })).ok,
    "Owner can sign out",
  );
  console.log(
    `Integration passed: ${assertions} assertions across public routes, authentication, project CRUD, ordering, uploads, inquiries and privacy.`,
  );
} finally {
  try {
    // Stop the disposable server before dropping its database or uploaded files.
    if (child.pid && child.exitCode === null && child.signalCode === null) {
      await new Promise((resolve) => {
        const forceKill = setTimeout(() => child.kill("SIGKILL"), 3000);
        child.once("exit", () => {
          clearTimeout(forceKill);
          resolve();
        });
        child.kill("SIGTERM");
      });
    }
    // Never accept a database name from the environment as a cleanup target.
    assert.match(databaseName, /^reliant_test_integration_[a-f0-9]{24}$/);
    if (databaseConnected) await databaseClient.db(databaseName).dropDatabase();
  } finally {
    try {
      await databaseClient.close();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }
}
