import { readJsonBody, bodyReadError } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  authConfigured,
  clientKey,
  createSession,
  sameOrigin,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";
import { consumeRateLimit } from "@/lib/db";
import { getAdminCredentials } from "@/lib/admin-accounts";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "This request could not be verified." },
      { status: 403 },
    );
  if (!authConfigured())
    return NextResponse.json(
      { error: "Admin access has not been configured yet." },
      { status: 503 },
    );
  let allowed;
  try {
    allowed = await consumeRateLimit(
      `login:${clientKey(request)}`,
      10,
      15 * 60 * 1000,
    );
  } catch {
    console.error("Login rate-limit storage failed");
    return NextResponse.json(
      {
        error:
          "Sign-in is temporarily unavailable. Please try again in a moment.",
      },
      { status: 503 },
    );
  }
  if (!allowed)
    return NextResponse.json(
      { error: "Too many sign-in attempts. Please try again in 15 minutes." },
      { status: 429 },
    );
  let body;
  try {
    body = await readJsonBody(request, 4096);
  } catch (error) {
    return bodyReadError(error);
  }
  if (
    !body ||
    typeof body.password !== "string" ||
    (body.email !== undefined &&
      (typeof body.email !== "string" || body.email.length > 254))
  )
    return NextResponse.json(
      { error: "Those sign-in details are incorrect. Please try again." },
      { status: 401 },
    );
  try {
    const account = await getAdminCredentials(body.email);
    // Unknown accounts still perform the password check before returning the same error.
    const validPassword = verifyPassword(
      body.password,
      account?.passwordHash ?? process.env.ADMIN_PASSWORD_HASH!,
    );
    if (!validPassword || !account?.active)
      return NextResponse.json(
        { error: "Those sign-in details are incorrect. Please try again." },
        { status: 401 },
      );
    const response = NextResponse.json({ ok: true });
    response.cookies.set(
      SESSION_COOKIE,
      createSession(Date.now(), account.sessionVersion, account.id),
      sessionCookieOptions(),
    );
    return response;
  } catch {
    console.error("Admin sign-in storage is unavailable.");
    return NextResponse.json(
      {
        error:
          "Sign-in is temporarily unavailable. Please try again in a moment.",
      },
      { status: 503 },
    );
  }
}
