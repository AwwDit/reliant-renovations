import { readFormBody, bodyReadError } from "@/lib/auth";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { requireAdmin } from "@/lib/auth";
import { detectFileType } from "@/lib/validation";
import { storeUpload } from "@/lib/media-storage";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const denied = await requireAdmin(request, true);
  if (denied) return denied;
  if (Number(request.headers.get("content-length") || 0) > 11 * 1024 * 1024)
    return Response.json(
      { error: "Choose an image smaller than 10 MB." },
      { status: 413 },
    );
  let form;
  try {
    form = await readFormBody(request);
  } catch (error) {
    return bodyReadError(error);
  }
  const file = form.get("file");
  if (!(file instanceof File) || !file.size || file.size > 10 * 1024 * 1024)
    return Response.json(
      { error: "Choose a JPG, PNG or WebP image smaller than 10 MB." },
      { status: 400 },
    );
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectFileType(bytes);
  if (!type)
    return Response.json(
      { error: "That file is not a supported image. Choose JPG, PNG or WebP." },
      { status: 400 },
    );
  let optimized: Buffer;
  try {
    optimized = await sharp(bytes, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({
        width: 2400,
        height: 2400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 88 })
      .toBuffer();
  } catch {
    return Response.json(
      {
        error:
          "This image could not be decoded. Choose a valid JPG, PNG or WebP image under 40 megapixels.",
      },
      { status: 400 },
    );
  }
  const filename = `project-${randomUUID()}.webp`;
  try {
    const stored = await storeUpload(filename, optimized);
    return Response.json(stored, { status: 201 });
  } catch {
    console.error("Project image storage failed");
    return Response.json(
      { error: "The image could not be stored. Please try again." },
      { status: 503 },
    );
  }
}
