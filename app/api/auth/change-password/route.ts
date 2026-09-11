import { after, NextResponse } from "next/server";
import {
  bodyReadError,
  getCurrentAdmin,
  readJsonBody,
  sameOrigin,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";
import { changeAdminPassword } from "@/lib/admin-accounts";
import { adminAccountErrorResponse } from "@/lib/admin-api-errors";
import { consumeRateLimit } from "@/lib/db";
import { sendPasswordChangedEmail } from "@/lib/email/delivery";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "This request could not be verified." },
      { status: 403 },
    );
  const account = await getCurrentAdmin();
  if (!account)
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  let body;
  try {
    body = await readJsonBody(request, 8192);
  } catch (error) {
    return bodyReadError(error);
  }
  if (
    !body ||
    typeof body.currentPassword !== "string" ||
    typeof body.password !== "string"
  )
    return NextResponse.json(
      { error: "Enter your current password and a new password." },
      { status: 400 },
    );
  try {
    if (
      !(await consumeRateLimit(
        `password-change:${account.id}`,
        10,
        15 * 60 * 1000,
      ))
    )
      return NextResponse.json(
        {
          error: "Too many password attempts. Please try again in 15 minutes.",
        },
        { status: 429 },
      );
    if (
      !(await changeAdminPassword(
        account.id,
        body.currentPassword,
        body.password,
      ))
    )
      return NextResponse.json(
        { error: "Your current password is incorrect. Please try again." },
        { status: 400 },
      );
    const response = NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(SESSION_COOKIE, "", {
      ...sessionCookieOptions(),
      maxAge: 0,
    });
    after(async () => {
      if (account.email) await sendPasswordChangedEmail(account.email);
    });
    return response;
  } catch (error) {
    return adminAccountErrorResponse(error);
  }
}
