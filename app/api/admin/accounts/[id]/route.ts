import { bodyReadError, readJsonBody, requireOwner } from "@/lib/auth";
import { setAdminAccountActive } from "@/lib/admin-accounts";
import { adminAccountErrorResponse } from "@/lib/admin-api-errors";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireOwner(request, true);
  if (denied) return denied;
  let body;
  try {
    body = await readJsonBody(request, 1024);
  } catch (error) {
    return bodyReadError(error);
  }
  if (!body || typeof body.active !== "boolean")
    return Response.json(
      { error: "Choose whether this account is active." },
      { status: 400 },
    );
  const { id } = await params;
  try {
    return Response.json(
      { account: await setAdminAccountActive(id, body.active) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return adminAccountErrorResponse(error);
  }
}
