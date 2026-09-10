import { isAuthenticated } from "@/lib/auth";
import { readUpload } from "@/lib/media-storage";
import { isUploadFilename } from "@/lib/media-urls";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> },
) {
  const { filename } = await context.params;
  if (!isUploadFilename(filename))
    return new Response("Not found", { status: 404 });
  const privateFile = filename.startsWith("inquiry-");
  const cacheHeaders = {
    "Cache-Control": privateFile ? "private, no-store" : "no-store",
  };
  if (privateFile && !(await isAuthenticated()))
    return new Response("Unauthorized", { status: 401, headers: cacheHeaders });
  try {
    const bytes = await readUpload(filename);
    if (!bytes)
      return new Response("Not found", { status: 404, headers: cacheHeaders });
    const extension = filename.split(".").pop()!;
    const types: Record<string, string> = {
      jpg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      pdf: "application/pdf",
    };
    return new Response(new Uint8Array(bytes), {
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
    return new Response("The file is temporarily unavailable", {
      status: 503,
      headers: cacheHeaders,
    });
  }
}
