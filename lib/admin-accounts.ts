import { randomUUID } from "node:crypto";
import { MongoServerError } from "mongodb";
import { z } from "zod";
import { authConfigured, hashPassword, verifyPassword } from "./auth";
import { getDb } from "./db";
import type { AdminAccount } from "./admin-account-types";

export type { AdminAccount } from "./admin-account-types";

export interface AdminAccountRecord {
  id: string;
  name: string;
  email: string | null;
  role: "owner" | "admin";
  active: boolean;
  passwordHash: string;
  sessionVersion: number;
  createdAt: Date;
  updatedAt: Date;
  passwordChangedAt?: Date;
  resetTokenHash?: string;
  resetExpiresAt?: Date;
}

interface LegacyOwnerSetting {
  key: "owner-auth";
  passwordHash?: string;
  sessionVersion?: number;
  passwordChangedAt?: Date;
  resetTokenHash?: string;
  resetExpiresAt?: Date;
}

export class AdminAccountError extends Error {
  constructor(
    public readonly code: "validation" | "conflict" | "not-found" | "forbidden",
    message: string,
  ) {
    super(message);
    this.name = "AdminAccountError";
  }
}

const passwordHashPattern = /^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/;
const emailSchema = z.email().max(254);

export function normalizeAdminEmail(email: string): string | null {
  if (typeof email !== "string" || /[\r\n]/.test(email)) return null;
  const normalized = email.trim().toLowerCase();
  return emailSchema.safeParse(normalized).success ? normalized : null;
}

export function publicAdminAccount(account: AdminAccountRecord): AdminAccount {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
    active: account.active,
    createdAt: account.createdAt.toISOString(),
  };
}

function validateCredentials(account: AdminAccountRecord) {
  if (
    !passwordHashPattern.test(account.passwordHash) ||
    !Number.isSafeInteger(account.sessionVersion) ||
    account.sessionVersion < 0 ||
    (account.role !== "owner" && account.role !== "admin") ||
    typeof account.active !== "boolean"
  )
    throw new Error("Admin account data is invalid.");
  return account;
}

/** First access migrates the owner once, including live sessions and reset links. */
export async function adminAccounts() {
  if (!authConfigured()) throw new Error("Admin access is not configured.");
  const db = await getDb();
  const accounts = db.collection<AdminAccountRecord>("admin_accounts");
  const owner = await accounts.findOne({ id: "owner" });
  const email = normalizeAdminEmail(process.env.ADMIN_EMAIL || "");
  if (!owner) {
    const legacy = await db
      .collection<LegacyOwnerSetting>("settings")
      .findOne({ key: "owner-auth" });
    const now = new Date();
    const initial: AdminAccountRecord = validateCredentials({
      id: "owner",
      name: "Owner",
      email,
      role: "owner",
      active: true,
      passwordHash: legacy?.passwordHash ?? process.env.ADMIN_PASSWORD_HASH!,
      sessionVersion: legacy?.sessionVersion ?? 0,
      createdAt: now,
      updatedAt: now,
      ...(legacy?.passwordChangedAt && {
        passwordChangedAt: legacy.passwordChangedAt,
      }),
      ...(legacy?.resetTokenHash &&
        /^[a-f0-9]{64}$/.test(legacy.resetTokenHash) &&
        legacy.resetExpiresAt instanceof Date &&
        legacy.resetExpiresAt > now && {
          resetTokenHash: legacy.resetTokenHash,
          resetExpiresAt: legacy.resetExpiresAt,
        }),
    });
    try {
      await accounts.updateOne(
        { id: "owner" },
        { $setOnInsert: initial },
        { upsert: true },
      );
    } catch (error) {
      // A competing first request may already have created the unique owner.
      if (
        !(error instanceof MongoServerError && error.code === 11000) ||
        !(await accounts.findOne({ id: "owner" }))
      )
        throw error;
    }
  } else if (owner.email === null && email) {
    // Enable recovery when ADMIN_EMAIL is configured after first deployment.
    try {
      await accounts.updateOne(
        { id: "owner", email: null },
        { $set: { email, updatedAt: new Date() } },
      );
    } catch (error) {
      // An address already assigned to another admin must stay with that account.
      if (!(error instanceof MongoServerError && error.code === 11000))
        throw error;
    }
  }
  return accounts;
}

/** Omitting email retains the owner's original password-only sign-in. */
export async function getAdminCredentials(email?: string) {
  const normalized =
    email === undefined ? undefined : normalizeAdminEmail(email);
  if (normalized === null) return null;
  const account = await (
    await adminAccounts()
  ).findOne(normalized === undefined ? { id: "owner" } : { email: normalized });
  return account ? validateCredentials(account) : null;
}

export async function getAdminCredentialsById(id: string) {
  const account = await (await adminAccounts()).findOne({ id });
  return account ? validateCredentials(account) : null;
}

export async function listAdminAccounts(): Promise<AdminAccount[]> {
  const accounts = await (
    await adminAccounts()
  )
    .find({})
    .sort({ role: -1, createdAt: 1, id: 1 })
    .toArray();
  return accounts.map(publicAdminAccount);
}

function validateNewPassword(password: string) {
  if (
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 512
  )
    throw new AdminAccountError(
      "validation",
      "Use a password between 12 and 512 characters.",
    );
}

export async function createAdminAccount(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AdminAccount> {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email =
    typeof input.email === "string" ? normalizeAdminEmail(input.email) : null;
  if (!name || name.length > 100 || /[\u0000-\u001f\u007f]/.test(name))
    throw new AdminAccountError(
      "validation",
      "Enter a name of 1–100 characters.",
    );
  if (!email)
    throw new AdminAccountError("validation", "Enter a valid email address.");
  validateNewPassword(input.password);
  const accounts = await adminAccounts();
  const now = new Date();
  const account: AdminAccountRecord = {
    id: randomUUID(),
    name,
    email,
    role: "admin",
    active: true,
    passwordHash: hashPassword(input.password),
    sessionVersion: 0,
    createdAt: now,
    updatedAt: now,
  };
  try {
    await accounts.insertOne(account);
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000)
      throw new AdminAccountError(
        "conflict",
        "An account with this email address already exists.",
      );
    throw error;
  }
  return publicAdminAccount(account);
}

export async function setAdminAccountActive(
  id: string,
  active: boolean,
): Promise<AdminAccount> {
  if (typeof active !== "boolean")
    throw new AdminAccountError(
      "validation",
      "Choose whether this account is active.",
    );
  const accounts = await adminAccounts();
  const current = await accounts.findOne({ id });
  if (!current)
    throw new AdminAccountError(
      "not-found",
      "This admin account was not found.",
    );
  if (current.role === "owner" || current.id === "owner")
    throw new AdminAccountError(
      "forbidden",
      "The owner account cannot be disabled.",
    );
  const updated = await accounts.findOneAndUpdate(
    { id, role: "admin", active: { $ne: active } },
    {
      $set: { active, updatedAt: new Date() },
      $inc: { sessionVersion: 1 },
      $unset: { resetTokenHash: "", resetExpiresAt: "" },
    },
    { returnDocument: "after" },
  );
  return publicAdminAccount(updated ?? (await accounts.findOne({ id }))!);
}

/** Compare-and-swap prevents competing changes from reusing a stale password. */
export async function changeAdminPassword(
  id: string,
  currentPassword: string,
  newPassword: string,
) {
  validateNewPassword(newPassword);
  if (typeof currentPassword !== "string") return false;
  const accounts = await adminAccounts();
  const current = await getAdminCredentialsById(id);
  if (
    !current?.active ||
    !verifyPassword(currentPassword, current.passwordHash)
  )
    return false;
  const now = new Date();
  const changed = await accounts.updateOne(
    {
      id,
      active: true,
      passwordHash: current.passwordHash,
      sessionVersion: current.sessionVersion,
    },
    {
      $set: {
        passwordHash: hashPassword(newPassword),
        passwordChangedAt: now,
        updatedAt: now,
      },
      $inc: { sessionVersion: 1 },
      $unset: { resetTokenHash: "", resetExpiresAt: "" },
    },
  );
  return changed.modifiedCount === 1;
}
