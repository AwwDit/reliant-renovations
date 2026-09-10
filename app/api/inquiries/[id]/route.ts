import { readJsonBody, bodyReadError } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth";
import { markInquiryRead } from "@/lib/db";
export const runtime = "nodejs";
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin(request, true);
  if (denied) return denied;
  const { id } = await context.params;
  let body;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    return bodyReadError(error);
  }
  if (typeof body.read !== "boolean")
    return Response.json({ error: "Invalid read status." }, { status: 400 });
  try {
    return (await markInquiryRead(id, body.read))
      ? Response.json({ ok: true })
      : Response.json(
          { error: "This inquiry could not be found." },
          { status: 404 },
        );
  } catch {
    console.error("Inquiry update failed");
    return Response.json(
      { error: "This inquiry could not be updated. Please try again." },
      { status: 500 },
    );
  }
}
