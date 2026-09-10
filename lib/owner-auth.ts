import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { MongoServerError } from "mongodb";
import { authConfigured, hashPassword } from "./auth";
import { consumeRateLimit, getDb } from "./db";
import { sendPasswordResetEmail } from "./email/delivery";

interface OwnerAuthSetting {
  key: "owner-auth";
  sessionVersion: number;
  passwordHash?: string;
  passwordChangedAt?: Date;
  resetTokenHash?: string;
  resetExpiresAt?: Date;
}

const settingKey = "owner-auth" as const;
const resetLifetime = 30 * 60 * 1000;
const passwordHashPattern = /^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/;
const tokenPattern = /^[a-f0-9]{64}$/i;

function tokenHash(token: string) {
  return createHash("sha256").update(token.toLowerCase()).digest("hex");
}

async function ownerSettings() {
  return (await getDb()).collection<OwnerAuthSetting>("settings");
}

export async function getOwnerCredentials() {
  if (!authConfigured()) throw new Error("Owner access is not configured.");
  const stored = await (await ownerSettings()).findOne({ key: settingKey });
  const sessionVersion = stored?.sessionVersion ?? 0;
  const passwordHash = stored?.passwordHash ?? process.env.ADMIN_PASSWORD_HASH!;
  if (
    !Number.isSafeInteger(sessionVersion) ||
    sessionVersion < 0 ||
    !passwordHashPattern.test(passwordHash)
  )
    throw new Error("Owner account data is invalid.");
  return { passwordHash, sessionVersion };
}

/** Only the digest is stored; a new request replaces the previous reset link. */
export async function createPasswordResetToken(now = Date.now()) {
  if (!authConfigured()) throw new Error("Owner access is not configured.");
  const token = randomBytes(32).toString("hex");
  const settings = await ownerSettings();
  const update = {
    $set: {
      resetTokenHash: tokenHash(token),
      resetExpiresAt: new Date(now + resetLifetime),
    },
    $setOnInsert: { sessionVersion: 0 },
  };
  try {
    await settings.updateOne({ key: settingKey }, update, { upsert: true });
  } catch (error) {
    // Two first-time requests can race to create the unique settings record.
    if (!(error instanceof MongoServerError && error.code === 11000))
      throw error;
    await settings.updateOne({ key: settingKey }, update);
  }
  return token;
}

/** Failed delivery must not remove a newer request's reset link. */
export async function discardPasswordResetToken(token: string) {
  if (!tokenPattern.test(token)) return;
  await (
    await ownerSettings()
  ).updateOne(
    { key: settingKey, resetTokenHash: tokenHash(token) },
    { $unset: { resetTokenHash: "", resetExpiresAt: "" } },
  );
}

/** One atomic update consumes the link, changes the password and revokes sessions. */
export async function completePasswordReset(
  token: string,
  password: string,
  now = Date.now(),
) {
  if (
    !authConfigured() ||
    !tokenPattern.test(token) ||
    password.length < 12 ||
    password.length > 512
  )
    return false;
  const result = await (
    await ownerSettings()
  ).findOneAndUpdate(
    {
      key: settingKey,
      resetTokenHash: tokenHash(token),
      resetExpiresAt: { $gt: new Date(now) },
    },
    {
      $set: {
        passwordHash: hashPassword(password),
        passwordChangedAt: new Date(now),
      },
      $inc: { sessionVersion: 1 },
      $unset: { resetTokenHash: "", resetExpiresAt: "" },
    },
    { returnDocument: "after" },
  );
  return result !== null;
}

/** Run after the generic HTTP response so provider latency cannot reveal a match. */
export async function requestOwnerPasswordReset(email: string) {
  let token: string | undefined;
  try {
    if (!authConfigured()) return;
    const owner = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (
      !owner ||
      !process.env.RESEND_API_KEY?.trim() ||
      !process.env.INQUIRY_FROM_EMAIL?.trim()
    )
      return;
    const submitted = createHash("sha256")
      .update(email.trim().toLowerCase())
      .digest();
    const expected = createHash("sha256").update(owner).digest();
    if (!timingSafeEqual(submitted, expected)) return;
    if (!(await consumeRateLimit("password-reset-owner", 5, 60 * 60 * 1000)))
      return;
    token = await createPasswordResetToken();
    if (!(await sendPasswordResetEmail(token)))
      await discardPasswordResetToken(token);
  } catch {
    if (token) await discardPasswordResetToken(token).catch(() => {});
    console.error("Owner password-reset request could not be completed.");
  }
}
