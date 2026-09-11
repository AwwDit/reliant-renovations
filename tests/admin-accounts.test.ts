import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { MongoClient } from "mongodb";
import { closeDb, getDb } from "../lib/db";
import {
  createSession,
  getAdminFromSession,
  hashPassword,
  verifyPassword,
  verifySession,
} from "../lib/auth";
import {
  AdminAccountError,
  changeAdminPassword,
  createAdminAccount,
  getAdminCredentials,
  listAdminAccounts,
  setAdminAccountActive,
} from "../lib/admin-accounts";
import {
  completePasswordReset,
  createPasswordResetToken,
  requestOwnerPasswordReset,
  resetAdminPassword,
} from "../lib/owner-auth";

const bootstrapPassword = "owner-bootstrap-test-password";
const bootstrapHash = hashPassword(bootstrapPassword);
const editorPassword = "editor-initial-test-password";
const replacementPassword = "editor-new-test-password";
const digest = (token: string) =>
  createHash("sha256").update(token).digest("hex");

async function withAccountsDatabase(t: TestContext, run: () => Promise<void>) {
  const name = `reliant_test_accounts_${randomBytes(12).toString("hex")}`;
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
    SITE_URL: "https://reliant.example.test",
    NEXT_PUBLIC_SITE_URL: "https://reliant.example.test",
  };
  const previous = new Map<string, string | undefined>();
  await closeDb();
  for (const [key, value] of Object.entries(environment)) {
    previous.set(key, process.env[key]);
    process.env[key] = value;
  }
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error(
      "External HTTP requests are disabled in admin-account tests.",
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
      assert.match(name, /^reliant_test_accounts_[a-f0-9]{24}$/);
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

function legacyCookie(now: number, version = 0) {
  const body = Buffer.from(
    JSON.stringify({
      exp: now + 60_000,
      version,
      nonce: "legacy-owner-cookie",
    }),
  ).toString("base64url");
  return `${body}.${createHmac("sha256", process.env.ADMIN_SESSION_SECRET!).update(body).digest("base64url")}`;
}

async function createEditor(email = "editor@example.test") {
  return createAdminAccount({
    name: "Site editor",
    email,
    password: editorPassword,
  });
}

test("owner migration preserves changed password, existing sessions and in-flight reset without later overwrites", async (t) => {
  await withAccountsDatabase(t, async () => {
    const now = Date.now();
    const existingPassword = "previously-reset-owner-password";
    const existingHash = hashPassword(existingPassword);
    const oldResetToken = randomBytes(32).toString("hex");
    await (await getDb()).collection("settings").insertOne({
      key: "owner-auth",
      passwordHash: existingHash,
      sessionVersion: 7,
      resetTokenHash: digest(oldResetToken),
      resetExpiresAt: new Date(now + 60_000),
    });
    const concurrent = await Promise.all(
      Array.from({ length: 8 }, () => getAdminCredentials()),
    );
    for (const owner of concurrent) {
      assert.equal(owner?.id, "owner");
      assert.equal(owner?.role, "owner");
      assert.equal(owner?.passwordHash, existingHash);
      assert.equal(owner?.sessionVersion, 7);
      assert.equal(owner?.resetTokenHash, digest(oldResetToken));
    }
    assert.equal((await listAdminAccounts()).length, 1);
    const oldCookie = legacyCookie(now, 7);
    assert.equal((await getAdminFromSession(oldCookie, now))?.id, "owner");
    assert.equal(verifySession(oldCookie, now, 7, "someone-else"), false);
    const completed = await resetAdminPassword(
      oldResetToken,
      replacementPassword,
      now + 1,
    );
    assert.equal(completed?.id, "owner");
    assert.equal(await getAdminFromSession(oldCookie, now + 2), null);
    assert.equal(
      await completePasswordReset(oldResetToken, existingPassword, now + 2),
      false,
    );
    process.env.ADMIN_PASSWORD_HASH = hashPassword(
      "new-env-bootstrap-should-not-win",
    );
    await (
      await getDb()
    )
      .collection("settings")
      .updateOne(
        { key: "owner-auth" },
        { $set: { passwordHash: bootstrapHash, sessionVersion: 0 } },
      );
    await closeDb();
    const owner = (await getAdminCredentials())!;
    assert.equal(owner.sessionVersion, 8);
    assert.equal(verifyPassword(replacementPassword, owner.passwordHash), true);
  });
});

test("bootstrap owner can recover when ADMIN_EMAIL is configured later", async (t) => {
  await withAccountsDatabase(t, async () => {
    delete process.env.ADMIN_EMAIL;
    assert.equal((await getAdminCredentials())?.email, null);
    process.env.ADMIN_EMAIL = " OWNER@EXAMPLE.TEST ";
    assert.equal(
      (await getAdminCredentials("owner@example.test"))?.id,
      "owner",
    );
    process.env.ADMIN_EMAIL = "different-owner@example.test";
    assert.equal((await getAdminCredentials())?.email, "owner@example.test");
  });
});

test("accounts normalize email, hash passwords and expose only safe fields; concurrent duplicate email has one winner", async (t) => {
  await withAccountsDatabase(t, async () => {
    const results = await Promise.allSettled([
      createEditor(" EDITOR@EXAMPLE.TEST "),
      createEditor("editor@example.test"),
    ]);
    assert.equal(
      results.filter((item) => item.status === "fulfilled").length,
      1,
    );
    const failure = results.find(
      (item) => item.status === "rejected",
    ) as PromiseRejectedResult;
    assert.ok(failure.reason instanceof AdminAccountError);
    assert.equal(failure.reason.code, "conflict");
    const editor = (await getAdminCredentials(" Editor@Example.Test "))!;
    assert.equal(editor.email, "editor@example.test");
    assert.equal(editor.role, "admin");
    assert.equal(verifyPassword(editorPassword, editor.passwordHash), true);
    assert.equal(editor.passwordHash.includes(editorPassword), false);
    const rows = await listAdminAccounts();
    assert.equal(rows.length, 2);
    for (const row of rows) {
      assert.deepEqual(Object.keys(row).sort(), [
        "active",
        "createdAt",
        "email",
        "id",
        "name",
        "role",
      ]);
      assert.ok(!JSON.stringify(row).includes("scrypt:"));
    }
    await assert.rejects(
      () => createEditor("OWNER@EXAMPLE.TEST"),
      (error) =>
        error instanceof AdminAccountError && error.code === "conflict",
    );
    await assert.rejects(
      () => createEditor("not-an-address"),
      AdminAccountError,
    );
    await assert.rejects(
      () =>
        createAdminAccount({
          name: " ",
          email: "valid@example.test",
          password: editorPassword,
        }),
      AdminAccountError,
    );
    await assert.rejects(
      () =>
        createAdminAccount({
          name: "Valid",
          email: "valid@example.test",
          password: "too-short",
        }),
      AdminAccountError,
    );
    await assert.rejects(
      () =>
        createAdminAccount({
          name: "Valid",
          email: "valid@example.test",
          password: "x".repeat(513),
        }),
      AdminAccountError,
    );
    const injected = await createAdminAccount({
      name: "Another editor",
      email: "another@example.test",
      password: editorPassword,
      role: "owner",
    } as Parameters<typeof createAdminAccount>[0]);
    assert.equal(injected.role, "admin");
    assert.equal(await getAdminCredentials("unknown@example.test"), null);
  });
});

test("sessions bind account identities and DB role; disabling revokes only that account and protects owner", async (t) => {
  await withAccountsDatabase(t, async () => {
    const editor = await createEditor();
    const now = Date.now();
    const ownerCookie = createSession(now, 0);
    const editorCookie = createSession(now, 0, editor.id);
    assert.equal(verifySession(editorCookie, now, 0, editor.id), true);
    assert.equal(verifySession(editorCookie, now), false);
    assert.equal(verifySession(ownerCookie, now, 0, editor.id), false);
    assert.equal((await getAdminFromSession(editorCookie, now))?.role, "admin");
    const [body, signature] = editorCookie.split(".");
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    payload.sub = "owner";
    const changed = `${Buffer.from(JSON.stringify(payload)).toString("base64url")}.${signature}`;
    assert.equal(await getAdminFromSession(changed, now), null);
    assert.equal(
      await getAdminFromSession(createSession(now, 0, "missing-account"), now),
      null,
    );
    const token = await createPasswordResetToken(now, editor.id);
    const disabled = await setAdminAccountActive(editor.id, false);
    assert.equal(disabled.active, false);
    assert.equal(await getAdminFromSession(editorCookie, now), null);
    assert.equal((await getAdminFromSession(ownerCookie, now))?.id, "owner");
    assert.equal(
      await completePasswordReset(token, replacementPassword, now),
      false,
    );
    await assert.rejects(() => createPasswordResetToken(now, editor.id));
    await assert.rejects(
      () => setAdminAccountActive("owner", false),
      (error) =>
        error instanceof AdminAccountError && error.code === "forbidden",
    );
    await setAdminAccountActive(editor.id, true);
    assert.equal(await getAdminFromSession(editorCookie, now), null);
    const version = (await getAdminCredentials(editor.email!))!.sessionVersion;
    assert.equal(
      (await getAdminFromSession(createSession(now, version, editor.id), now))
        ?.id,
      editor.id,
    );
  });
});

test("password changes require own current password, revoke own sessions and tokens, preserve other accounts", async (t) => {
  await withAccountsDatabase(t, async () => {
    const editor = await createEditor();
    const owner = (await getAdminCredentials())!;
    const ownerCookie = createSession(Date.now(), owner.sessionVersion);
    const editorCookie = createSession(Date.now(), 0, editor.id);
    const token = await createPasswordResetToken(Date.now(), editor.id);
    assert.equal(
      await changeAdminPassword(
        editor.id,
        bootstrapPassword,
        replacementPassword,
      ),
      false,
    );
    assert.equal((await getAdminCredentials(editor.email!))?.sessionVersion, 0);
    assert.equal(
      await changeAdminPassword(editor.id, editorPassword, replacementPassword),
      true,
    );
    assert.equal(await getAdminFromSession(editorCookie), null);
    assert.equal((await getAdminFromSession(ownerCookie))?.id, "owner");
    assert.equal(await completePasswordReset(token, editorPassword), false);
    assert.equal(
      verifyPassword(
        replacementPassword,
        (await getAdminCredentials(editor.email!))!.passwordHash,
      ),
      true,
    );
    assert.equal(
      (await getAdminCredentials())?.passwordHash,
      owner.passwordHash,
    );
    assert.equal(
      await changeAdminPassword(
        editor.id,
        editorPassword,
        "another-long-enough-password",
      ),
      false,
    );
  });
});

test("account-specific resets cannot change another password or revoke another account's session", async (t) => {
  await withAccountsDatabase(t, async () => {
    const editor = await createEditor();
    const ownerToken = await createPasswordResetToken();
    const editorToken = await createPasswordResetToken(Date.now(), editor.id);
    const ownerCookie = createSession();
    const editorCookie = createSession(Date.now(), 0, editor.id);
    const results = await Promise.all(
      Array.from({ length: 6 }, () =>
        resetAdminPassword(editorToken, replacementPassword),
      ),
    );
    assert.equal(results.filter(Boolean).length, 1);
    assert.equal(results.find(Boolean)?.id, editor.id);
    assert.equal(await getAdminFromSession(editorCookie), null);
    assert.equal((await getAdminFromSession(ownerCookie))?.id, "owner");
    assert.equal(
      verifyPassword(
        bootstrapPassword,
        (await getAdminCredentials())!.passwordHash,
      ),
      true,
    );
    assert.equal(
      await completePasswordReset(ownerToken, "owner-new-valid-password"),
      true,
    );
    assert.equal(
      verifyPassword(
        replacementPassword,
        (await getAdminCredentials(editor.email!))!.passwordHash,
      ),
      true,
    );
  });
});

test("recovery emails and rate limits belong to their requested active account", async (t) => {
  await withAccountsDatabase(t, async () => {
    const editor = await createEditor();
    const requests: { to: string[]; html: string }[] = [];
    t.mock.method(
      globalThis,
      "fetch",
      async (_url: Parameters<typeof fetch>[0], init?: RequestInit) => {
        requests.push(JSON.parse(init!.body as string));
        return Response.json({ id: "fake-success" });
      },
    );
    await requestOwnerPasswordReset("unknown@example.test");
    assert.equal(requests.length, 0);
    for (let i = 0; i < 7; i++)
      await requestOwnerPasswordReset(" EDITOR@EXAMPLE.TEST ");
    assert.equal(requests.length, 5);
    assert.ok(requests.every((mail) => mail.to[0] === "editor@example.test"));
    await requestOwnerPasswordReset("owner@example.test");
    assert.equal(requests.length, 6);
    assert.deepEqual(requests.at(-1)?.to, ["owner@example.test"]);
    const token = requests[4].html.match(/#token=([a-f0-9]{64})/)![1];
    await setAdminAccountActive(editor.id, false);
    await requestOwnerPasswordReset("editor@example.test");
    assert.equal(requests.length, 6);
    assert.equal(
      await completePasswordReset(token, replacementPassword),
      false,
    );
  });
});
