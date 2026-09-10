import { readJsonBody, bodyReadError, RequestBodyTooLarge } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth";
import { reorderProjects } from "@/lib/db";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const denied = await requireAdmin(request, true);
  if (denied) return denied;
  try {
    const body = await readJsonBody(request);
    if (
      !Array.isArray(body.ids) ||
      body.ids.length > 5000 ||
      body.ids.some((id: unknown) => typeof id !== "string")
    )
      return Response.json(
        { error: "Invalid project order." },
        { status: 400 },
      );
    await reorderProjects(body.ids);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof RequestBodyTooLarge || error instanceof SyntaxError)
      return bodyReadError(error);
    return Response.json(
      { error: "The list has changed. Refresh the page and try again." },
      { status: 409 },
    );
  }
}
