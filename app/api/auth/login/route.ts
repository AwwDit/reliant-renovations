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
import { getOwnerCredentials } from "@/lib/owner-auth";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "This request could not be verified." },
      { status: 403 },
    );
  if (!authConfigured())
    return NextResponse.json(
      { error: "The owner account has not been configured yet." },
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
  if (!body || typeof body.password !== "string")
    return NextResponse.json(
      { error: "That password is incorrect. Please try again." },
      { status: 401 },
    );
  try {
    const { passwordHash, sessionVersion } = await getOwnerCredentials();
    if (!verifyPassword(body.password, passwordHash))
      return NextResponse.json(
        { error: "That password is incorrect. Please try again." },
        { status: 401 },
      );
    const response = NextResponse.json({ ok: true });
    response.cookies.set(
      SESSION_COOKIE,
      createSession(Date.now(), sessionVersion),
      sessionCookieOptions(),
    );
    return response;
  } catch {
    console.error("Owner sign-in storage is unavailable.");
    return NextResponse.json(
      {
        error:
          "Sign-in is temporarily unavailable. Please try again in a moment.",
      },
      { status: 503 },
    );
  }
}
