import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { cookies } from "next/headers";
import type { AdminAccount } from "./admin-account-types";

export const SESSION_COOKIE = "reliant_admin";
const SESSION_SECONDS = 60 * 60 * 12;
export function authConfigured() {
  return Boolean(
    /^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(
      process.env.ADMIN_PASSWORD_HASH || "",
    ) && (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32,
  );
}
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}
export function verifyPassword(
  password: string,
  encoded = process.env.ADMIN_PASSWORD_HASH || "",
): boolean {
  if (password.length > 512) return false;
  const [scheme, salt, hash] = encoded.split(":");
  if (
    scheme !== "scrypt" ||
    !/^[a-f0-9]{32}$/.test(salt || "") ||
    !/^[a-f0-9]{128}$/.test(hash || "")
  )
    return false;
  const actual = scryptSync(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(hash, "hex"));
}
export function createSession(
  now = Date.now(),
  version = 0,
  accountId = "owner",
): string {
  if (!authConfigured())
    throw new Error("Admin credentials are not configured.");
  if (
    !/^[a-zA-Z0-9_-]{1,128}$/.test(accountId) ||
    !Number.isSafeInteger(version) ||
    version < 0
  )
    throw new Error("Invalid admin session identity.");
  const body = Buffer.from(
    JSON.stringify({
      exp: now + SESSION_SECONDS * 1000,
      nonce: randomBytes(16).toString("hex"),
      version,
      sub: accountId,
    }),
  ).toString("base64url");
  return `${body}.${createHmac("sha256", process.env.ADMIN_SESSION_SECRET!).update(body).digest("base64url")}`;
}
function readSession(
  token: string | undefined,
  now: number,
): { accountId: string; version: number } | null {
  if (
    !authConfigured() ||
    typeof token !== "string" ||
    !token ||
    token.length > 1024
  )
    return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, signature] = parts;
  const expected = createHmac("sha256", process.env.ADMIN_SESSION_SECRET!)
    .update(body)
    .digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (!payload || typeof payload !== "object") return null;
    const version = payload.version === undefined ? 0 : payload.version;
    // Cookies from the original owner-only login can never identify another user.
    const accountId = payload.sub === undefined ? "owner" : payload.sub;
    if (
      typeof payload.exp !== "number" ||
      !Number.isFinite(payload.exp) ||
      payload.exp <= now ||
      payload.exp > now + SESSION_SECONDS * 1000 ||
      !Number.isSafeInteger(version) ||
      version < 0 ||
      typeof accountId !== "string" ||
      !/^[a-zA-Z0-9_-]{1,128}$/.test(accountId)
    )
      return null;
    return { accountId, version };
  } catch {
    return null;
  }
}

export function verifySession(
  token: string | undefined,
  now = Date.now(),
  version = 0,
  accountId = "owner",
): boolean {
  const session = readSession(token, now);
  return (
    session !== null &&
    session.version === version &&
    session.accountId === accountId
  );
}

export async function getAdminFromSession(
  token: string | undefined,
  now = Date.now(),
): Promise<AdminAccount | null> {
  const session = readSession(token, now);
  if (!session) return null;
  try {
    const { getAdminCredentialsById, publicAdminAccount } =
      await import("./admin-accounts");
    const account = await getAdminCredentialsById(session.accountId);
    if (!account?.active || account.sessionVersion !== session.version)
      return null;
    return publicAdminAccount(account);
  } catch {
    // Database availability must never bypass session revocation.
    return null;
  }
}

export async function getCurrentAdmin(): Promise<AdminAccount | null> {
  if (!authConfigured()) return null;
  try {
    return await getAdminFromSession(
      (await cookies()).get(SESSION_COOKIE)?.value,
    );
  } catch {
    return null;
  }
}

export async function isAuthenticated() {
  return (await getCurrentAdmin()) !== null;
}
export const sessionCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: SESSION_SECONDS,
});
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const allowed = [new URL(request.url).origin];
  for (const configuredUrl of [
    process.env.SITE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ]) {
    if (configuredUrl) {
      try {
        allowed.push(new URL(configuredUrl).origin);
      } catch {
        /* invalid configuration does not grant access */
      }
    }
  }
  return allowed.includes(origin);
}
export function clientKey(request: Request): string {
  const ip =
    process.env.TRUST_PROXY === "true"
      ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "local"
      : "local";
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}
export class RequestBodyTooLarge extends Error {}
export async function readBoundedBody(
  request: Request,
  maxBytes: number,
): Promise<Uint8Array<ArrayBuffer>> {
  if (Number(request.headers.get("content-length") || 0) > maxBytes)
    throw new RequestBodyTooLarge("Request is too large.");
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array(0);
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) {
        await reader.cancel();
        throw new RequestBodyTooLarge("Request is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}
export async function readJsonBody<T = Record<string, unknown>>(
  request: Request,
  maxBytes = 128 * 1024,
): Promise<T> {
  return JSON.parse(
    new TextDecoder().decode(await readBoundedBody(request, maxBytes)),
  );
}
export async function readFormBody(request: Request): Promise<FormData> {
  const bytes = await readBoundedBody(request, 11 * 1024 * 1024);
  return new Response(bytes, {
    headers: { "Content-Type": request.headers.get("content-type") || "" },
  }).formData();
}
export function bodyReadError(error: unknown): Response {
  return Response.json(
    {
      error:
        error instanceof RequestBodyTooLarge
          ? "This request is too large. Choose an attachment smaller than 10 MB."
          : "The request could not be read. Please try again.",
    },
    { status: error instanceof RequestBodyTooLarge ? 413 : 400 },
  );
}
export async function requireAdmin(
  request: Request,
  mutation = false,
): Promise<Response | null> {
  if (!(await isAuthenticated()))
    return Response.json(
      { error: "Please sign in to continue." },
      { status: 401 },
    );
  if (mutation && !sameOrigin(request))
    return Response.json(
      { error: "This request could not be verified." },
      { status: 403 },
    );
  return null;
}

export async function requireOwner(
  request: Request,
  mutation = false,
): Promise<Response | null> {
  const account = await getCurrentAdmin();
  if (!account)
    return Response.json(
      { error: "Please sign in to continue." },
      { status: 401 },
    );
  if (account.role !== "owner")
    return Response.json(
      { error: "Only the owner can manage admin accounts." },
      { status: 403 },
    );
  if (mutation && !sameOrigin(request))
    return Response.json(
      { error: "This request could not be verified." },
      { status: 403 },
    );
  return null;
}
