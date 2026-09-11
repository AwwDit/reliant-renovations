import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes, scryptSync } from "node:crypto";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium, expect } from "@playwright/test";
import { MongoClient } from "mongodb";

// Representative generic cosmetic filters from https://easylist.to/easylist/easylist.txt.
// Keep this snapshot offline: an unrelated filter-list update must not change the test.
const cosmeticFilters = `.ad-label,.ad-button,.ad-primary,.ad-text-link,.ad-sidebar,
.ad-main,.ad-content,.ad-footer,.ad-field,.ad-callout{display:none!important}
:root{--reliant-test-filters:applied}`;
const directory = await mkdtemp(join(tmpdir(), "reliant-admin-browser-"));
const databaseName = `reliant_test_browser_${randomBytes(12).toString("hex")}`;
const mongoUri =
  process.env.MONGODB_TEST_URI ||
  "mongodb://127.0.0.1:27018/?replicaSet=reliant-local";
const databaseClient = new MongoClient(mongoUri, {
  serverSelectionTimeoutMS: 5000,
});
const probe = createServer();
const port = await new Promise((resolve, reject) => {
  probe.once("error", reject);
  probe.listen(0, "127.0.0.1", () => {
    const { port } = probe.address();
    probe.close((error) => (error ? reject(error) : resolve(port)));
  });
});
const origin = `http://127.0.0.1:${port}`;
const ownerPassword = randomBytes(24).toString("hex");
const adminPassword = randomBytes(24).toString("hex");
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
      CLOUDINARY_CLOUD_NAME: "dbg0zy3al",
      CLOUDINARY_API_KEY: "",
      CLOUDINARY_API_SECRET: "",
      GOOGLE_PLACES_API_KEY: "",
      RESEND_API_KEY: "",
      INQUIRY_TO_EMAIL: "",
      INQUIRY_FROM_EMAIL: "",
      MONGODB_URI: mongoUri,
      MONGODB_DB: databaseName,
      SITE_URL: origin,
      NEXT_PUBLIC_SITE_URL: origin,
      SITE_INDEXABLE: "false",
      ADMIN_PASSWORD_HASH: `scrypt:${salt}:${scryptSync(ownerPassword, salt, 64).toString("hex")}`,
      ADMIN_SESSION_SECRET: randomBytes(48).toString("hex"),
      ADMIN_EMAIL: "owner@example.test",
      TRUST_PROXY: "false",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let serverOutput = "";
let serverError;
child.stdout.on("data", (chunk) => {
  serverOutput += chunk;
});
child.stderr.on("data", (chunk) => {
  serverOutput += chunk;
});
child.once("error", (error) => {
  serverError = error;
});
let browser;
let databaseConnected = false;
const pageErrors = [];
async function screenshot(page, name) {
  const output = process.env.ADMIN_BROWSER_ARTIFACTS_DIR;
  if (!output) return;
  await mkdir(output, { recursive: true });
  await page.screenshot({ path: join(output, `${name}.png`), fullPage: true });
}
async function post(path, body, cookie = "") {
  return fetch(origin + path, {
    method: "POST",
    headers: {
      origin,
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}
async function labelsVisible(page, ids) {
  // getByLabel().isVisible() only checks the INPUT, so it missed this regression.
  for (const id of ids)
    await expect(page.locator(`label[for="${id}"]`)).toBeVisible();
}
async function filtersApplied(page) {
  await expect
    .poll(() =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue("--reliant-test-filters")
          .trim(),
      ),
    )
    .toBe("applied");
}
try {
  await databaseClient.connect();
  databaseConnected = true;
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (serverError) throw serverError;
    if (child.exitCode !== null)
      throw new Error(`Test server exited: ${serverOutput}`);
    try {
      const response = await fetch(`${origin}/admin`, {
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  assert.ok(
    ready,
    "An isolated production server starts (run npm run build first).",
  );
  const ownerLogin = await post("/api/auth/login", { password: ownerPassword });
  assert.equal(ownerLogin.status, 200, "Disposable owner can sign in");
  const ownerCookie = ownerLogin.headers.get("set-cookie")?.split(";")[0];
  assert.ok(ownerCookie?.startsWith("reliant_admin="));
  const created = await post(
    "/api/admin/accounts",
    {
      name: "Browser Test Admin",
      email: "editor@example.test",
      password: adminPassword,
    },
    ownerCookie,
  );
  assert.equal(
    created.status,
    201,
    "Owner API creates a separate admin in the disposable database",
  );
  browser = await chromium.launch({
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
  });
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
  ]) {
    for (const theme of ["dark", "light"]) {
      const context = await browser.newContext({ viewport });
      await context.addInitScript(
        (theme) => localStorage.setItem("reliant-theme", theme),
        theme,
      );
      // Inject into every CSS response, including sheets requested after client navigation.
      await context.route(/\.css(?:\?|$)/, async (route) => {
        const response = await route.fetch();
        await route.fulfill({
          response,
          body: `${await response.text()}\n${cosmeticFilters}`,
        });
      });
      const page = await context.newPage();
      page.on("pageerror", (error) => pageErrors.push(error.message));
      await page.goto(`${origin}/admin`, { waitUntil: "domcontentloaded" });
      await filtersApplied(page);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await labelsVisible(page, ["admin-email", "admin-password"]);
      await expect(
        page.getByRole("button", { name: "Sign in", exact: true }),
      ).toBeVisible();
      if (theme === "dark" && viewport.width === 390)
        await screenshot(page, "login-mobile-filtered");
      await page
        .getByLabel("Email address", { exact: true })
        .fill("editor@example.test");
      await page.getByLabel("Password", { exact: true }).fill(adminPassword);
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await expect(page.locator("#admin-content")).toBeVisible();
      await expect(
        page.getByRole("navigation", { name: "Dashboard" }),
      ).toBeVisible();
      const editButtons = page.getByRole("button", {
        name: "Edit project",
        exact: true,
      });
      await expect(editButtons).toHaveCount(10);
      await expect(editButtons.first()).toBeVisible();
      if (theme === "dark" && viewport.width === 1440)
        await screenshot(page, "dashboard-desktop-filtered");
      await editButtons.first().click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      for (const text of ["Project title", "Subtitle", "Description"]) {
        await expect(
          dialog.locator("label").filter({
            has: page.locator("span", {
              hasText: new RegExp(`^${text}(?: \\*)?$`),
            }),
          }),
        ).toBeVisible();
      }
      await expect(
        dialog.getByRole("button", { name: "Save project", exact: true }),
      ).toBeVisible();
      await dialog
        .getByRole("button", { name: "Close project editor" })
        .click();
      await page
        .getByRole("navigation", { name: "Dashboard" })
        .getByRole("button", { name: "Accounts", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Browser Test Admin", exact: true }),
      ).toBeVisible();
      await labelsVisible(page, [
        "account-current-password",
        "account-new-password",
        "account-confirm-password",
      ]);
      await expect(
        page.getByRole("button", { name: "Change password", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Add admin", exact: true }),
      ).toHaveCount(0);
      // The same filters must leave the owner's additional account controls visible.
      await context.clearCookies();
      await context.addCookies([
        {
          name: "reliant_admin",
          value: ownerCookie.slice("reliant_admin=".length),
          url: origin,
        },
      ]);
      await page.goto(`${origin}/admin`, { waitUntil: "domcontentloaded" });
      await filtersApplied(page);
      await page
        .getByRole("navigation", { name: "Dashboard" })
        .getByRole("button", { name: "Accounts", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Add admin", exact: true })
        .click();
      await labelsVisible(page, [
        "new-admin-name",
        "new-admin-email",
        "new-admin-password",
        "new-admin-confirmation",
      ]);
      await expect(
        page.getByRole("button", { name: "Create admin account", exact: true }),
      ).toBeVisible();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
        "Account form has no horizontal overflow",
      );
      await context.close();
      console.log(
        `PASS: login labels, admin projects/editor and account controls with cosmetic filters (${viewport.width}px, ${theme})`,
      );
    }
  }
  assert.deepEqual(pageErrors, [], "No browser runtime errors");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  if (child.pid && child.exitCode === null && child.signalCode === null) {
    await new Promise((resolve) => {
      const timer = setTimeout(() => child.kill("SIGKILL"), 4000);
      child.once("exit", () => {
        clearTimeout(timer);
        resolve();
      });
      child.kill("SIGTERM");
    });
  }
  try {
    assert.match(databaseName, /^reliant_test_browser_[a-f0-9]{24}$/);
    if (databaseConnected) await databaseClient.db(databaseName).dropDatabase();
  } finally {
    try {
      await databaseClient.close();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }
}
