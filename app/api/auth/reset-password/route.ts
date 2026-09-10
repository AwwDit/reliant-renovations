import { after, NextResponse } from "next/server";
import {
  authConfigured,
  clientKey,
  readJsonBody,
  sameOrigin,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";
import { consumeRateLimit } from "@/lib/db";
import { completePasswordReset } from "@/lib/owner-auth";
import { sendPasswordChangedEmail } from "@/lib/email/delivery";

export const runtime = "nodejs";

function invalidLink() {
  return NextResponse.json(
    {
      error:
        "This password-reset link is invalid or has expired. Request a new link.",
    },
    { status: 400, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "This request could not be verified." },
      { status: 403 },
    );
  if (!authConfigured())
    return NextResponse.json(
      { error: "Owner password recovery is currently unavailable." },
      { status: 503 },
    );
  try {
    const allowed = await consumeRateLimit(
      `password-reset-submit:${clientKey(request)}`,
      20,
      15 * 60 * 1000,
    );
    if (!allowed)
      return NextResponse.json(
        { error: "Too many reset attempts. Please try again in 15 minutes." },
        { status: 429 },
      );
    let body;
    try {
      body = await readJsonBody(request, 4096);
    } catch {
      return invalidLink();
    }
    if (
      !body ||
      typeof body.token !== "string" ||
      !/^[a-f0-9]{64}$/i.test(body.token)
    )
      return invalidLink();
    if (
      typeof body.password !== "string" ||
      body.password.length < 12 ||
      body.password.length > 512
    )
      return NextResponse.json(
        { error: "Use a password between 12 and 512 characters." },
        { status: 400 },
      );
    if (!(await completePasswordReset(body.token, body.password)))
      return invalidLink();
    const response = NextResponse.json(
      {
        ok: true,
        message:
          "Your password has been reset. Sign in with your new password.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(SESSION_COOKIE, "", {
      ...sessionCookieOptions(),
      maxAge: 0,
    });
    after(async () => {
      await sendPasswordChangedEmail();
    });
    return response;
  } catch {
    console.error("Owner password reset could not be completed.");
    return NextResponse.json(
      {
        error:
          "Password recovery is temporarily unavailable. Please try again.",
      },
      { status: 503 },
    );
  }
}
