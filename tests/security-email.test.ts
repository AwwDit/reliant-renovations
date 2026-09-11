import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  passwordChangedEmail,
  passwordResetEmail,
} from "../lib/email/templates";
import {
  sendPasswordChangedEmail,
  sendPasswordResetEmail,
} from "../lib/email/delivery";

const token = "a".repeat(64);
const brand = { siteUrl: "https://reliant.example.test" };
const keys = [
  "ADMIN_EMAIL",
  "RESEND_API_KEY",
  "INQUIRY_FROM_EMAIL",
  "INQUIRY_TO_EMAIL",
  "NEXT_PUBLIC_CONTACT_EMAIL",
  "SITE_URL",
] as const;
function configure(t: TestContext) {
  const old = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  Object.assign(process.env, {
    ADMIN_EMAIL: "recovery@example.test",
    RESEND_API_KEY: "fake-test-key",
    INQUIRY_FROM_EMAIL: "Reliant Renovations <notices@example.test>",
    INQUIRY_TO_EMAIL: "inbox@example.test",
    NEXT_PUBLIC_CONTACT_EMAIL: "public@example.test",
    SITE_URL: brand.siteUrl,
  });
  t.after(() => {
    for (const key of keys) {
      if (old[key] === undefined) delete process.env[key];
      else process.env[key] = old[key];
    }
  });
}

test("reset template uses the trusted site, a fragment token, clear expiry and no executable token content", () => {
  const email = passwordResetEmail(token, brand);
  const expected = `${brand.siteUrl}/admin/reset-password#token=${token}`;
  assert.ok(email.html.includes(`href="${expected}"`));
  assert.ok(email.text.includes(expected));
  assert.match(email.html, /reliant-color-transparent\.png/);
  assert.match(email.text, /expires in 30 minutes and can be used once/);
  assert.match(email.text, /Your password has not changed/);
  assert.match(email.text, /admin account/);
  assert.doesNotMatch(email.html + email.text + email.subject, /owner/i);
  assert.doesNotMatch(email.html, /\?token=/);
  assert.throws(() => passwordResetEmail('"><script>alert(1)</script>', brand));
  assert.throws(() =>
    passwordResetEmail(token, { siteUrl: "javascript:alert(1)" }),
  );
});

test("password-change confirmation has sign-in and recovery actions without any reset secret", () => {
  const email = passwordChangedEmail(brand);
  assert.match(
    email.text,
    /Previous sign-in sessions for this account have been signed out/,
  );
  assert.doesNotMatch(email.html + email.text + email.subject, /owner/i);
  assert.ok(email.html.includes(`href="${brand.siteUrl}/admin"`));
  assert.ok(
    email.html.includes(`href="${brand.siteUrl}/admin/forgot-password"`),
  );
  assert.doesNotMatch(email.html, /#token=|\?token=/);
});

test("legacy account email callers still use ADMIN_EMAIL and keep raw tokens out of retry headers", async (t) => {
  configure(t);
  const calls: { body: Record<string, unknown>; headers: Headers }[] = [];
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    assert.equal(url, "https://api.resend.com/emails");
    calls.push({
      body: JSON.parse(String(init.body)),
      headers: new Headers(init.headers),
    });
    return new Response("", { status: 200 });
  });
  assert.equal(await sendPasswordResetEmail(token), true);
  assert.equal(await sendPasswordChangedEmail(), true);
  for (const { body } of calls) {
    assert.deepEqual(body.to, ["recovery@example.test"]);
    assert.ok(!("reply_to" in body));
    assert.doesNotMatch(
      JSON.stringify(body),
      /inbox@example\.test|public@example\.test/,
    );
    assert.equal(typeof body.html, "string");
    assert.equal(typeof body.text, "string");
  }
  assert.equal(
    calls[0].headers.get("Idempotency-Key"),
    `owner-password-reset/${createHash("sha256").update(token).digest("hex")}`,
  );
  assert.ok(!calls[0].headers.get("Idempotency-Key")!.includes(token));
});

test("explicit account security emails never copy or expose the owner or inquiry addresses", async (t) => {
  configure(t);
  const accountEmail = "projects-admin@example.test";
  const calls: { body: Record<string, unknown>; headers: Headers }[] = [];
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    assert.equal(url, "https://api.resend.com/emails");
    calls.push({
      body: JSON.parse(String(init.body)),
      headers: new Headers(init.headers),
    });
    return new Response("", { status: 200 });
  });
  assert.equal(await sendPasswordResetEmail(token, ` ${accountEmail} `), true);
  assert.equal(await sendPasswordChangedEmail(accountEmail), true);
  assert.equal(calls.length, 2);
  for (const { body, headers } of calls) {
    assert.deepEqual(body.to, [accountEmail]);
    assert.ok(!("cc" in body));
    assert.ok(!("bcc" in body));
    assert.ok(!("reply_to" in body));
    assert.doesNotMatch(
      JSON.stringify(body),
      /recovery@example\.test|inbox@example\.test|public@example\.test/,
    );
    const retryKey = headers.get("Idempotency-Key")!;
    assert.ok(!retryKey.includes(token));
    assert.ok(!retryKey.includes(accountEmail));
  }
});

test("explicit account email delivery does not depend on ADMIN_EMAIL", async (t) => {
  configure(t);
  delete process.env.ADMIN_EMAIL;
  const network = t.mock.method(
    globalThis,
    "fetch",
    async (_url: string, init: RequestInit) => {
      assert.deepEqual(JSON.parse(String(init.body)).to, [
        "admin@example.test",
      ]);
      return new Response("", { status: 200 });
    },
  );
  assert.equal(await sendPasswordResetEmail(token, "admin@example.test"), true);
  assert.equal(await sendPasswordChangedEmail("admin@example.test"), true);
  assert.equal(network.mock.callCount(), 2);
});

test("invalid explicit recipients and CRLF never send or fall back to the owner", async (t) => {
  configure(t);
  const network = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Unexpected network call");
  });
  for (const recipient of [
    "",
    " ",
    "invalid",
    "admin@example.test,second@example.test",
    "Admin <admin@example.test>",
    "admin@example.test\r\nBcc: second@example.test",
    "\nadmin@example.test",
    "admin@example.test\r",
    `${"a".repeat(245)}@example.test`,
  ]) {
    assert.equal(await sendPasswordResetEmail(token, recipient), false);
    assert.equal(await sendPasswordChangedEmail(recipient), false);
  }
  process.env.ADMIN_EMAIL = "recovery@example.test\n";
  assert.equal(await sendPasswordResetEmail(token), false);
  assert.equal(await sendPasswordChangedEmail(), false);
  assert.equal(network.mock.callCount(), 0);
});

test("missing recovery settings and malformed tokens never call the provider", async (t) => {
  configure(t);
  const network = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Unexpected network call");
  });
  delete process.env.ADMIN_EMAIL;
  assert.equal(await sendPasswordResetEmail(token), false);
  assert.equal(await sendPasswordChangedEmail(), false);
  process.env.ADMIN_EMAIL = "recovery@example.test";
  assert.equal(await sendPasswordResetEmail("invalid"), false);
  assert.equal(
    await sendPasswordResetEmail("invalid", "admin@example.test"),
    false,
  );
  delete process.env.RESEND_API_KEY;
  assert.equal(await sendPasswordResetEmail(token), false);
  assert.equal(network.mock.callCount(), 0);
});

test("security email failures return false without exposing secrets in logs", async (t) => {
  configure(t);
  const logged: unknown[][] = [];
  t.mock.method(console, "error", (...args: unknown[]) => logged.push(args));
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response("provider-failure", { status: 503 }),
  );
  assert.equal(await sendPasswordResetEmail(token), false);
  assert.equal(await sendPasswordChangedEmail(), false);
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error(token);
  });
  assert.equal(await sendPasswordResetEmail(token), false);
  assert.ok(!JSON.stringify(logged).includes(token));
});
