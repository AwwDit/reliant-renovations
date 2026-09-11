import { createHash, randomBytes } from "node:crypto";
import { authConfigured, hashPassword } from "./auth";
import { consumeRateLimit } from "./db";
import { sendPasswordResetEmail } from "./email/delivery";
import {
  adminAccounts,
  getAdminCredentials,
  publicAdminAccount,
} from "./admin-accounts";

const resetLifetime = 30 * 60 * 1000;
const tokenPattern = /^[a-f0-9]{64}$/i;

function tokenHash(token: string) {
  return createHash("sha256").update(token.toLowerCase()).digest("hex");
}

/** Compatibility helper for the bootstrap owner and existing setup scripts. */
export async function getOwnerCredentials() {
  const owner = await getAdminCredentials();
  if (!owner) throw new Error("Owner access is not configured.");
  return {
    passwordHash: owner.passwordHash,
    sessionVersion: owner.sessionVersion,
  };
}

/** Only the digest is stored; a new request replaces this account's previous link. */
export async function createPasswordResetToken(
  now = Date.now(),
  accountId = "owner",
) {
  const token = randomBytes(32).toString("hex");
  const result = await (
    await adminAccounts()
  ).updateOne(
    { id: accountId, active: true },
    {
      $set: {
        resetTokenHash: tokenHash(token),
        resetExpiresAt: new Date(now + resetLifetime),
      },
    },
  );
  if (result.matchedCount !== 1)
    throw new Error("This admin account cannot recover access.");
  return token;
}

/** Failed delivery must not remove a newer request's reset link. */
export async function discardPasswordResetToken(token: string) {
  if (!tokenPattern.test(token)) return;
  await (
    await adminAccounts()
  ).updateOne(
    { resetTokenHash: tokenHash(token) },
    { $unset: { resetTokenHash: "", resetExpiresAt: "" } },
  );
}

/** One atomic update consumes the link, changes its account's password and revokes its sessions. */
export async function resetAdminPassword(
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
    return null;
  const result = await (
    await adminAccounts()
  ).findOneAndUpdate(
    {
      active: true,
      resetTokenHash: tokenHash(token),
      resetExpiresAt: { $gt: new Date(now) },
    },
    {
      $set: {
        passwordHash: hashPassword(password),
        passwordChangedAt: new Date(now),
        updatedAt: new Date(now),
      },
      $inc: { sessionVersion: 1 },
      $unset: { resetTokenHash: "", resetExpiresAt: "" },
    },
    { returnDocument: "after" },
  );
  return result ? publicAdminAccount(result) : null;
}

export async function completePasswordReset(
  token: string,
  password: string,
  now = Date.now(),
) {
  return (await resetAdminPassword(token, password, now)) !== null;
}

/** Run after the generic HTTP response so provider latency cannot reveal a match. */
export async function requestOwnerPasswordReset(email: string) {
  let token: string | undefined;
  try {
    if (
      !authConfigured() ||
      !process.env.RESEND_API_KEY?.trim() ||
      !process.env.INQUIRY_FROM_EMAIL?.trim()
    )
      return;
    const account = await getAdminCredentials(email);
    if (!account?.active || !account.email) return;
    if (
      !(await consumeRateLimit(
        `password-reset-account:${account.id}`,
        5,
        60 * 60 * 1000,
      ))
    )
      return;
    token = await createPasswordResetToken(Date.now(), account.id);
    if (!(await sendPasswordResetEmail(token, account.email)))
      await discardPasswordResetToken(token);
  } catch {
    if (token) await discardPasswordResetToken(token).catch(() => {});
    console.error("Admin password-reset request could not be completed.");
  }
}
