import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { MongoClient } from "mongodb";
import { POST as login } from "../app/api/auth/login/route";
import { closeDb, getDb } from "../lib/db";
import {
  authConfigured,
  createSession,
  hashPassword,
  verifyPassword,
  verifySession,
} from "../lib/auth";
import {
  completePasswordReset,
  createPasswordResetToken,
  discardPasswordResetToken,
  getOwnerCredentials,
  requestOwnerPasswordReset,
} from "../lib/owner-auth";

const bootstrapPassword = "owner-bootstrap-test-password";
const replacementPassword = "owner-replacement-test-password";
const bootstrapHash = hashPassword(bootstrapPassword);
const resetLifetime = 30 * 60 * 1000;
const digest = (token: string) =>
  createHash("sha256").update(token.toLowerCase()).digest("hex");

async function withResetDatabase(t: TestContext, run: () => Promise<void>) {
  const name = `reliant_test_reset_${randomBytes(12).toString("hex")}`;
  const uri =
    process.env.MONGODB_TEST_URI ||
    "mongodb://127.0.0.1:27018/?replicaSet=reliant-local";
  const environment = {
    MONGODB_URI: uri,
    MONGODB_DB: name,
    ADMIN_PASSWORD_HASH: bootstrapHash,
    ADMIN_SESSION_SECRET:
      "fake-test-session-secret-that-is-at-least-32-characters",
    ADMIN_EMAIL: "owner@example.test",
    RESEND_API_KEY: "fake-test-key-never-sent",
    INQUIRY_FROM_EMAIL: "Reliant Test <notifications@sender.example.test>",
    INQUIRY_TO_EMAIL: "private-inquiries@example.test",
    NEXT_PUBLIC_CONTACT_EMAIL: "public-contact@example.test",
    SITE_URL: "https://reliant.example.test",
    NEXT_PUBLIC_SITE_URL: "https://reliant.example.test",
  };
  const previous = new Map<string, string | undefined>();
  await closeDb();
  for (const [key, value] of Object.entries(environment)) {
    previous.set(key, process.env[key]);
    process.env[key] = value;
  }
  // All email calls are intercepted, including unexpected paths in a failed test.
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error(
      "External HTTP requests are disabled in password-reset tests.",
    );
  });
  t.mock.method(console, "error", () => {});
  const cleanup = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  let connected = false;
  try {
    await cleanup.connect();
    connected = true;
    assert.equal(
      (await cleanup.db(name).listCollections().toArray()).length,
      0,
    );
    await run();
  } finally {
    try {
      await closeDb();
      assert.match(name, /^reliant_test_reset_[a-f0-9]{24}$/);
      if (connected) await cleanup.db(name).dropDatabase();
    } finally {
      await cleanup.close();
      for (const [key, value] of previous) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  }
}

async function storedOwner() {
  return (await getDb()).collection("settings").findOne({ key: "owner-auth" });
}

test("reset tokens are random, hashed at rest and replaced by newer requests", async (t) => {
  await withResetDatabase(t, async () => {
    const now = Date.now();
    const first = await createPasswordResetToken(now);
    assert.match(first, /^[a-f0-9]{64}$/);
    const firstRecord = (await storedOwner())!;
    assert.equal(firstRecord.resetTokenHash, digest(first));
    assert.equal(firstRecord.resetExpiresAt.getTime(), now + resetLifetime);
    assert.ok(!JSON.stringify(firstRecord).includes(first));
    assert.equal(firstRecord.passwordHash, undefined);
    const second = await createPasswordResetToken(now + 1);
    assert.notEqual(second, first);
    assert.equal(
      await completePasswordReset(first, replacementPassword, now + 2),
      false,
    );
    assert.equal((await storedOwner())!.resetTokenHash, digest(second));
    assert.equal(
      await completePasswordReset(
        second.toUpperCase(),
        replacementPassword,
        now + 2,
      ),
      true,
    );
    assert.equal(
      await completePasswordReset(second, bootstrapPassword, now + 3),
      false,
    );
    const used = (await storedOwner())!;
    assert.equal(used.resetTokenHash, undefined);
    assert.equal(used.resetExpiresAt, undefined);
  });
});

test("reset links expire at 30 minutes and invalid passwords cannot consume a valid link", async (t) => {
  await withResetDatabase(t, async () => {
    const now = Date.now();
    const expired = await createPasswordResetToken(now - resetLifetime);
    assert.equal(
      await completePasswordReset(expired, replacementPassword, now),
      false,
    );
    assert.equal(
      verifyPassword(
        bootstrapPassword,
        (await getOwnerCredentials()).passwordHash,
      ),
      true,
    );
    const valid = await createPasswordResetToken(now);
    assert.equal(await completePasswordReset(valid, "too-short", now), false);
    assert.equal(
      await completePasswordReset(valid, "x".repeat(513), now),
      false,
    );
    assert.equal(
      await completePasswordReset("not-a-token", replacementPassword, now),
      false,
    );
    assert.equal((await storedOwner())!.resetTokenHash, digest(valid));
    assert.equal(
      await completePasswordReset(
        valid,
        replacementPassword,
        now + resetLifetime - 1,
      ),
      true,
    );
  });
});

test("concurrent token issuance keeps one owner record and one usable reset link", async (t) => {
  await withResetDatabase(t, async () => {
    const tokens = await Promise.all(
      Array.from({ length: 8 }, () => createPasswordResetToken()),
    );
    assert.equal(new Set(tokens).size, tokens.length);
    assert.equal(
      await (
        await getDb()
      )
        .collection("settings")
        .countDocuments({ key: "owner-auth" }),
      1,
    );
    const record = (await storedOwner())!;
    const active = tokens.find(
      (token) => digest(token) === record.resetTokenHash,
    )!;
    assert.ok(active);
    for (const token of tokens.filter((token) => token !== active)) {
      assert.equal(
        await completePasswordReset(token, replacementPassword),
        false,
      );
    }
    assert.equal(
      await completePasswordReset(active, replacementPassword),
      true,
    );
  });
});

test("simultaneous reset submissions have exactly one winner and cannot reuse the token", async (t) => {
  await withResetDatabase(t, async () => {
    const token = await createPasswordResetToken();
    const passwords = Array.from(
      { length: 8 },
      (_, index) => `concurrent-password-${index}`,
    );
    const results = await Promise.all(
      passwords.map((password) => completePasswordReset(token, password)),
    );
    assert.equal(results.filter(Boolean).length, 1);
    const credentials = await getOwnerCredentials();
    assert.equal(credentials.sessionVersion, 1);
    for (let index = 0; index < passwords.length; index++) {
      assert.equal(
        verifyPassword(passwords[index], credentials.passwordHash),
        results[index],
      );
    }
    assert.equal(
      await completePasswordReset(token, replacementPassword),
      false,
    );
  });
});

test("password override persists across reconnects and revokes every old session", async (t) => {
  await withResetDatabase(t, async () => {
    const now = Date.now();
    const before = await getOwnerCredentials();
    assert.equal(before.passwordHash, bootstrapHash);
    const firstSession = createSession(now, before.sessionVersion);
    const secondSession = createSession(now, before.sessionVersion);
    const legacyBody = Buffer.from(
      JSON.stringify({ exp: now + 60_000, nonce: "legacy-session" }),
    ).toString("base64url");
    const legacySession = `${legacyBody}.${createHmac("sha256", process.env.ADMIN_SESSION_SECRET!).update(legacyBody).digest("base64url")}`;
    assert.equal(verifySession(firstSession, now), true);
    assert.equal(verifySession(legacySession, now), true);
    const token = await createPasswordResetToken(now);
    assert.equal(
      await completePasswordReset(token, replacementPassword, now + 1),
      true,
    );
    await closeDb();
    const after = await getOwnerCredentials();
    assert.equal(process.env.ADMIN_PASSWORD_HASH, bootstrapHash);
    assert.notEqual(after.passwordHash, bootstrapHash);
    assert.equal(verifyPassword(bootstrapPassword, after.passwordHash), false);
    assert.equal(verifyPassword(replacementPassword, after.passwordHash), true);
    assert.equal(after.sessionVersion, before.sessionVersion + 1);
    assert.equal(
      verifySession(firstSession, now + 2, after.sessionVersion),
      false,
    );
    assert.equal(
      verifySession(secondSession, now + 2, after.sessionVersion),
      false,
    );
    assert.equal(
      verifySession(legacySession, now + 2, after.sessionVersion),
      false,
    );
    const newSession = createSession(now + 2, after.sessionVersion);
    assert.equal(
      verifySession(newSession, now + 3, after.sessionVersion),
      true,
    );
    assert.equal((await storedOwner())!.resetTokenHash, undefined);
  });
});

test("a valid 512-character JSON-escaped reset password can sign in", async (t) => {
  await withResetDatabase(t, async () => {
    const password = "\u0001".repeat(512);
    const token = await createPasswordResetToken();
    assert.equal(await completePasswordReset(token, password), true);
    const body = JSON.stringify({ password });
    assert.ok(Buffer.byteLength(body) > 2048);
    const response = await login(
      new Request("https://reliant.example.test/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://reliant.example.test",
        },
        body,
      }),
    );
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    const session = response.headers
      .get("set-cookie")!
      .match(/reliant_admin=([^;]+)/)![1];
    assert.equal(
      verifySession(
        session,
        Date.now(),
        (await getOwnerCredentials()).sessionVersion,
      ),
      true,
    );
  });
});

test("failed delivery removes its token and unknown email addresses never receive recovery mail", async (t) => {
  await withResetDatabase(t, async () => {
    const requests: { to: string[]; html: string }[] = [];
    t.mock.method(
      globalThis,
      "fetch",
      async (_input: Parameters<typeof fetch>[0], init?: RequestInit) => {
        requests.push(JSON.parse(init!.body as string));
        return Response.json(
          { error: "fake provider rejection" },
          { status: 503 },
        );
      },
    );
    await requestOwnerPasswordReset("other-person@example.test");
    await requestOwnerPasswordReset(process.env.INQUIRY_TO_EMAIL!);
    assert.equal(requests.length, 0);
    assert.equal(await storedOwner(), null);
    await requestOwnerPasswordReset(" OWNER@EXAMPLE.TEST ");
    assert.equal(requests.length, 1);
    assert.deepEqual(requests[0].to, ["owner@example.test"]);
    assert.match(
      requests[0].html,
      /\/admin\/reset-password#token=[a-f0-9]{64}/,
    );
    const record = (await storedOwner())!;
    assert.equal(record.resetTokenHash, undefined);
    assert.equal(record.resetExpiresAt, undefined);
    assert.equal(
      verifyPassword(
        bootstrapPassword,
        (await getOwnerCredentials()).passwordHash,
      ),
      true,
    );
  });
});

test("an older failed delivery cannot clear a newer successfully delivered reset link", async (t) => {
  await withResetDatabase(t, async () => {
    let started!: () => void;
    const firstStarted = new Promise<void>((resolve) => {
      started = resolve;
    });
    let rejectFirst!: () => void;
    const tokens: string[] = [];
    t.mock.method(
      globalThis,
      "fetch",
      async (_input: Parameters<typeof fetch>[0], init?: RequestInit) => {
        const body = JSON.parse(init!.body as string) as {
          html: string;
          to: string[];
        };
        assert.deepEqual(body.to, ["owner@example.test"]);
        tokens.push(body.html.match(/#token=([a-f0-9]{64})/)![1]);
        if (tokens.length === 1) {
          const response = new Promise<Response>((resolve) => {
            rejectFirst = () => resolve(Response.json({}, { status: 503 }));
          });
          started();
          return response;
        }
        return Response.json({ id: "fake-success" });
      },
    );
    const first = requestOwnerPasswordReset("owner@example.test");
    await firstStarted;
    await requestOwnerPasswordReset("owner@example.test");
    rejectFirst();
    await first;
    assert.equal(tokens.length, 2);
    assert.equal((await storedOwner())!.resetTokenHash, digest(tokens[1]));
    await discardPasswordResetToken(tokens[0]);
    assert.equal(
      await completePasswordReset(tokens[0], replacementPassword),
      false,
    );
    assert.equal(
      await completePasswordReset(tokens[1], replacementPassword),
      true,
    );
  });
});

test("owner-wide request limits stop repeated recovery email without disclosing account state", async (t) => {
  await withResetDatabase(t, async () => {
    let requests = 0;
    t.mock.method(globalThis, "fetch", async () => {
      requests++;
      return Response.json({ id: "fake-success" });
    });
    for (let index = 0; index < 7; index++) {
      assert.equal(
        await requestOwnerPasswordReset("owner@example.test"),
        undefined,
      );
    }
    assert.equal(requests, 5);
  });
});

test("missing recovery configuration and disabled authentication cannot issue a working reset", async (t) => {
  await withResetDatabase(t, async () => {
    let requests = 0;
    t.mock.method(globalThis, "fetch", async () => {
      requests++;
      return Response.json({ id: "fake-success" });
    });
    delete process.env.ADMIN_EMAIL;
    await requestOwnerPasswordReset("owner@example.test");
    process.env.ADMIN_EMAIL = "owner@example.test";
    delete process.env.RESEND_API_KEY;
    await requestOwnerPasswordReset("owner@example.test");
    assert.equal(requests, 0);
    assert.equal(await storedOwner(), null);
    const token = await createPasswordResetToken();
    process.env.ADMIN_PASSWORD_HASH = "";
    assert.equal(authConfigured(), false);
    await assert.rejects(getOwnerCredentials, /not configured/);
    await assert.rejects(createPasswordResetToken, /not configured/);
    assert.equal(
      await completePasswordReset(token, replacementPassword),
      false,
    );
    await requestOwnerPasswordReset("owner@example.test");
    assert.equal(requests, 0);
    assert.equal((await storedOwner())!.resetTokenHash, digest(token));
  });
});
