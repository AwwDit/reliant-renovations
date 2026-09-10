import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { cookies } from "next/headers";

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
export function createSession(now = Date.now(), version = 0): string {
  if (!authConfigured())
    throw new Error("Admin credentials are not configured.");
  const body = Buffer.from(
    JSON.stringify({
      exp: now + SESSION_SECONDS * 1000,
      nonce: randomBytes(16).toString("hex"),
      version,
    }),
  ).toString("base64url");
  return `${body}.${createHmac("sha256", process.env.ADMIN_SESSION_SECRET!).update(body).digest("base64url")}`;
}
export function verifySession(
  token: string | undefined,
  now = Date.now(),
  version = 0,
): boolean {
  if (!authConfigured() || !token || token.length > 1024) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [body, signature] = parts;
  const expected = createHmac("sha256", process.env.ADMIN_SESSION_SECRET!)
    .update(body)
    .digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return false;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    return (
      typeof payload.exp === "number" &&
      payload.exp > now &&
      payload.exp <= now + SESSION_SECONDS * 1000 &&
      (payload.version === undefined ? 0 : payload.version) === version
    );
  } catch {
    return false;
  }
}
export async function isAuthenticated() {
  if (!authConfigured()) return false;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return false;
  try {
    const { getOwnerCredentials } = await import("./owner-auth");
    const { sessionVersion } = await getOwnerCredentials();
    return verifySession(token, Date.now(), sessionVersion);
  } catch {
    // Database availability must never bypass session revocation.
    return false;
  }
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
