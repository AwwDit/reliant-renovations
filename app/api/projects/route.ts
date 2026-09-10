import { readJsonBody, bodyReadError } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth";
import { getProjects, saveProject } from "@/lib/db";
import { projectSchema, validationMessage } from "@/lib/validation";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    return Response.json({
      projects: await getProjects({ includeHidden: true }),
    });
  } catch {
    console.error("Project retrieval failed");
    return Response.json(
      { error: "Projects could not be loaded. Please try again." },
      { status: 500 },
    );
  }
}
export async function POST(request: Request) {
  const denied = await requireAdmin(request, true);
  if (denied) return denied;
  let body;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    return bodyReadError(error);
  }
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success)
    return Response.json(
      { error: validationMessage(parsed.error) },
      { status: 400 },
    );
  try {
    return Response.json(
      { project: await saveProject({ ...parsed.data, id: undefined }) },
      { status: 201 },
    );
  } catch (error) {
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
    console.error("Project creation failed");
    return Response.json(
      { error: "The project could not be saved. Please try again." },
      { status: 500 },
    );
  }
}
