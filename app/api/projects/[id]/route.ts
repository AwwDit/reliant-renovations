import { readJsonBody, bodyReadError } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth";
import {
  deleteProject,
  getProjectById,
  ProjectNotFoundError,
  saveProject,
} from "@/lib/db";
import { projectSchema, validationMessage } from "@/lib/validation";
export const runtime = "nodejs";
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin(request, true);
  if (denied) return denied;
  const { id } = await context.params;
  try {
    const existing = await getProjectById(id);
    if (!existing)
      return Response.json(
        { error: "This project no longer exists." },
        { status: 404 },
      );
    let body;
    try {
      body = await readJsonBody(request);
    } catch (error) {
      return bodyReadError(error);
    }
    const parsed = projectSchema.safeParse({ ...body, id });
    if (!parsed.success)
      return Response.json(
        { error: validationMessage(parsed.error) },
        { status: 400 },
      );
    if (parsed.data.slug !== existing.slug)
      return Response.json(
        {
          error:
            "An existing project’s URL is permanent so saved links keep working.",
        },
        { status: 400 },
      );
    return Response.json({ project: await saveProject(parsed.data) });
  } catch (error) {
    if (error instanceof ProjectNotFoundError)
      return Response.json(
        { error: "This project no longer exists." },
        { status: 404 },
      );
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    )
      return Response.json(
        {
          error:
            "A project already uses this URL slug. Choose a different slug.",
        },
        { status: 409 },
      );
    console.error("Project update failed");
    return Response.json(
      { error: "The project could not be saved. Please try again." },
      { status: 500 },
    );
  }
}
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin(request, true);
  if (denied) return denied;
  const { id } = await context.params;
  try {
    return (await deleteProject(id))
      ? Response.json({ ok: true })
      : Response.json(
          { error: "This project no longer exists." },
          { status: 404 },
        );
  } catch {
    console.error("Project deletion failed");
    return Response.json(
      { error: "The project could not be deleted. Please try again." },
      { status: 500 },
    );
  }
}
