import { bodyReadError, readJsonBody, requireOwner } from "@/lib/auth";
import { createAdminAccount, listAdminAccounts } from "@/lib/admin-accounts";
import { adminAccountErrorResponse } from "@/lib/admin-api-errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireOwner(request);
  if (denied) return denied;
  try {
    return Response.json(
      { accounts: await listAdminAccounts() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return adminAccountErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const denied = await requireOwner(request, true);
  if (denied) return denied;
  let body;
  try {
    body = await readJsonBody(request, 4096);
  } catch (error) {
    return bodyReadError(error);
  }
  if (
    !body ||
    typeof body.name !== "string" ||
    typeof body.email !== "string" ||
    typeof body.password !== "string"
  )
    return Response.json(
      { error: "Enter the admin's name, email address and password." },
      { status: 400 },
    );
  try {
    // Never accept role, active state, session version or storage fields from clients.
    const account = await createAdminAccount({
      name: body.name,
      email: body.email,
      password: body.password,
    });
    return Response.json(
      { account },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return adminAccountErrorResponse(error);
  }
}
