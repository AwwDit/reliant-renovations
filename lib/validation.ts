import { z } from "zod";

const text = (max: number) => z.string().trim().max(max);
const imagePath = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    return /^\/(?:images\/[a-zA-Z0-9/_-]+\.(?:jpg|jpeg|png|webp)|api\/uploads\/project-[a-f0-9-]{36}\.(?:jpg|png|webp))$/.test(
      value,
    );
  }, "Upload a project photo or use an existing /images/ file path.");

export const projectSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers and single hyphens.",
    ),
  title: text(150).min(2, "Enter a project title."),
  subtitle: text(180),
  division: z.enum(["commercial", "residential"]),
  location: text(150).min(2, "Enter a location."),
  category: text(100).min(2, "Enter a project category."),
  description: text(10000).min(
    20,
    "Add a description of at least 20 characters.",
  ),
  result: text(5000),
  scope: z.array(text(150).min(1)).max(30),
  images: z
    .array(
      z.object({
        src: imagePath,
        alt: text(300).min(
          3,
          "Add descriptive alternative text to each image.",
        ),
      }),
    )
    .min(1, "Add at least one project image.")
    .max(30),
  featured: z.boolean(),
  published: z.boolean(),
  order: z.number().int().min(0).max(100000).optional(),
});
export type ProjectInput = z.infer<typeof projectSchema>;

export const inquirySchema = z.object({
  name: text(120).min(2, "Enter your name."),
  company: text(160).default(""),
  email: z.string().trim().email("Enter a valid email address.").max(254),
  phone: text(50)
    .refine(
      (value) => !value || value.length >= 7,
      "Enter a valid phone number, or leave it blank.",
    )
    .default(""),
  location: text(180).min(2, "Enter the project location."),
  projectType: text(120).min(2, "Choose a project type."),
  timing: text(150).min(2, "Choose your project timing."),
  description: text(10000).min(
    20,
    "Tell us about your project in at least 20 characters.",
  ),
});
export type InquiryInput = z.infer<typeof inquirySchema>;

export function validationMessage(error: z.ZodError) {
  return error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join(" ");
}

export function detectFileType(
  bytes: Uint8Array,
  allowPdf = false,
): { extension: string; mime: string } | null {
  const starts = (...signature: number[]) =>
    signature.every((value, index) => bytes[index] === value);
  if (starts(0xff, 0xd8, 0xff)) return { extension: "jpg", mime: "image/jpeg" };
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))
    return { extension: "png", mime: "image/png" };
  if (
    bytes.length >= 12 &&
    Buffer.from(bytes.subarray(0, 4)).toString() === "RIFF" &&
    Buffer.from(bytes.subarray(8, 12)).toString() === "WEBP"
  )
    return { extension: "webp", mime: "image/webp" };
  if (allowPdf && starts(0x25, 0x50, 0x44, 0x46, 0x2d))
    return { extension: "pdf", mime: "application/pdf" };
  return null;
}
