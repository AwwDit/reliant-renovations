import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { isAuthenticated } from "@/lib/auth";
import { dataDirectory } from "@/lib/db";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> },
) {
  const { filename } = await context.params;
  if (!/^(project|inquiry)-[a-f0-9-]{36}\.(jpg|png|webp|pdf)$/.test(filename))
    return new Response("Not found", { status: 404 });
  const privateFile = filename.startsWith("inquiry-");
  if (privateFile && !(await isAuthenticated()))
    return new Response("Unauthorized", { status: 401 });
  try {
    const bytes = await readFile(join(dataDirectory(), "uploads", filename));
    const extension = filename.split(".").pop()!;
    const types: Record<string, string> = {
      jpg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      pdf: "application/pdf",
    };
    return new Response(bytes, {
      headers: {
        "Content-Type": types[extension],
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": privateFile
          ? "private, no-store"
          : "public, max-age=31536000, immutable",
        ...(privateFile
          ? {
              "Content-Disposition": `attachment; filename="project-attachment.${extension}"`,
            }
          : {}),
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
