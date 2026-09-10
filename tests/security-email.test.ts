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
  assert.doesNotMatch(email.html, /\?token=/);
  assert.throws(() => passwordResetEmail('"><script>alert(1)</script>', brand));
  assert.throws(() =>
    passwordResetEmail(token, { siteUrl: "javascript:alert(1)" }),
  );
});

test("password-change confirmation has sign-in and recovery actions without any reset secret", () => {
  const email = passwordChangedEmail(brand);
  assert.match(email.text, /Previous sign-in sessions have been signed out/);
  assert.ok(email.html.includes(`href="${brand.siteUrl}/admin"`));
  assert.ok(
    email.html.includes(`href="${brand.siteUrl}/admin/forgot-password"`),
  );
  assert.doesNotMatch(email.html, /#token=|\?token=/);
});

test("both account emails go only to ADMIN_EMAIL and raw tokens stay out of retry headers", async (t) => {
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
