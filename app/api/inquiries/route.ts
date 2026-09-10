import { readFormBody, bodyReadError } from "@/lib/auth";
import { randomUUID } from "node:crypto";
import { clientKey, requireAdmin, sameOrigin } from "@/lib/auth";
import { consumeRateLimit, getInquiries, saveInquiry } from "@/lib/db";
import {
  detectFileType,
  inquirySchema,
  validationMessage,
} from "@/lib/validation";
import { sendInquiryEmails } from "@/lib/email/delivery";
import type { Inquiry } from "@/lib/types";
import { storeUpload, deleteUpload } from "@/lib/media-storage";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    return Response.json({ inquiries: await getInquiries() });
  } catch {
    console.error("Inquiry retrieval failed");
    return Response.json(
      { error: "Inquiries could not be loaded. Please try again." },
      { status: 500 },
    );
  }
}
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json(
      {
        error:
          "This request could not be verified. Please submit the form from our website.",
      },
      { status: 403 },
    );
  let allowed;
  try {
    allowed = await consumeRateLimit(
      `inquiry:${clientKey(request)}`,
      5,
      60 * 60 * 1000,
    );
  } catch {
    console.error("Inquiry rate-limit storage failed");
    return Response.json(
      {
        error: "Your request could not be saved. Please try again in a moment.",
      },
      { status: 503 },
    );
  }
  if (!allowed)
    return Response.json(
      {
        error:
          "You have sent several requests recently. Please try again in an hour.",
      },
      { status: 429 },
    );
  if (Number(request.headers.get("content-length") || 0) > 11 * 1024 * 1024)
    return Response.json(
      { error: "Choose an attachment smaller than 10 MB." },
      { status: 413 },
    );
  let form;
  try {
    form = await readFormBody(request);
  } catch (error) {
    return bodyReadError(error);
  }
  if (form.get("website"))
    return Response.json({
      ok: true,
      emailSent: false,
      confirmationEmailSent: false,
      message: "Thank you for your interest.",
    });
  const parsed = inquirySchema.safeParse(
    Object.fromEntries(
      [
        "name",
        "company",
        "email",
        "phone",
        "location",
        "projectType",
        "timing",
        "description",
      ].map((key) => [key, form.get(key) ?? ""]),
    ),
  );
  if (!parsed.success)
    return Response.json(
      { error: validationMessage(parsed.error) },
      { status: 400 },
    );
  const file = form.get("attachment");
  let attachment: string | null = null;
  let savedFilename: string | null = null;
  let savedInquiry: Inquiry;
  try {
    if (file instanceof File && file.size) {
      if (file.size > 10 * 1024 * 1024)
        return Response.json(
          { error: "Choose an attachment smaller than 10 MB." },
          { status: 400 },
        );
      const bytes = new Uint8Array(await file.arrayBuffer());
      const type = detectFileType(bytes, true);
      if (!type)
        return Response.json(
          { error: "Attachments must be JPG, PNG, WebP or PDF files." },
          { status: 400 },
        );
      const filename = `inquiry-${randomUUID()}.${type.extension}`;
      const stored = await storeUpload(filename, bytes);
      savedFilename = filename;
      attachment = stored.src;
    }
    savedInquiry = await saveInquiry(parsed.data, attachment);
  } catch {
    if (savedFilename)
      await deleteUpload(savedFilename).catch(() => {
        console.error("Inquiry attachment cleanup failed");
      });
    console.error("Inquiry storage failed");
    return Response.json(
      {
        error: "Your request could not be saved. Please try again in a moment.",
      },
      { status: 500 },
    );
  }
  const delivery = await sendInquiryEmails(savedInquiry);
  return Response.json(
    {
      ok: true,
      ...delivery,
      message:
        "Your project inquiry has been received. Our team will be in touch.",
    },
    { status: 201 },
  );
}
