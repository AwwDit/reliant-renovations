import { after } from "next/server";
import {
  authConfigured,
  clientKey,
  readJsonBody,
  sameOrigin,
} from "@/lib/auth";
import { consumeRateLimit } from "@/lib/db";
import { requestOwnerPasswordReset } from "@/lib/owner-auth";

export const runtime = "nodejs";

function accepted() {
  return Response.json(
    {
      ok: true,
      message:
        "If that email matches the owner account, a password-reset link will be sent.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json(
      { error: "This request could not be verified." },
      { status: 403 },
    );
  try {
    const body = await readJsonBody(request, 1024);
    if (
      !authConfigured() ||
      !body ||
      typeof body.email !== "string" ||
      body.email.length > 254
    )
      return accepted();
    const allowed = await consumeRateLimit(
      `password-reset-request:${clientKey(request)}`,
      5,
      60 * 60 * 1000,
    );
    if (allowed) {
      const email = body.email;
      after(() => requestOwnerPasswordReset(email));
    }
  } catch {
    // The response does not disclose account matches, delivery, or storage state.
  }
  return accepted();
}
