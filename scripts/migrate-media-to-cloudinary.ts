import { loadEnvConfig } from "@next/env";
import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { open, realpath } from "node:fs/promises";
import { basename, isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { MongoClient, type Document } from "mongodb";
import { detectFileType } from "../lib/validation";
import { isCloudinaryProjectUrl } from "../lib/media-urls";

type ProjectRecord = { _id: unknown; images: unknown };
type InquiryRecord = { attachment?: unknown };
type Roots = { publicDirectory: string; uploadsDirectory: string };
type ImageExtension = "jpg" | "png" | "webp";
type LocalAsset = {
  source: string;
  kind: "catalog" | "project-upload" | "inquiry";
  root: string;
  relativePath: string;
  filename: string;
  extension: ImageExtension | "pdf";
  digest: string;
  bytes: number;
};
type ProjectChange = {
  _id: unknown;
  images: { index: number; source: string }[];
};
export type MediaPlan = {
  assets: LocalAsset[];
  projects: ProjectChange[];
  counts: {
    projects: number;
    imageReferences: number;
    existingCloudinaryImages: number;
    localImageReferences: number;
    inquiryAttachments: number;
    uniqueAssets: number;
    bytes: number;
  };
};
type MigrationAdapters = {
  uploadCatalog: (
    suffix: string,
    bytes: Uint8Array,
    extension: ImageExtension,
  ) => Promise<{ src: string }>;
  uploadFile: (filename: string, bytes: Uint8Array) => Promise<{ src: string }>;
  updateProject: (
    filter: Document,
    update: { $set: Record<string, string> },
  ) => Promise<{ matchedCount: number }>;
  progress?: (completed: number, total: number) => void;
};

export class MediaMigrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaMigrationError";
  }
}

const uuid = "[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}";
const projectUpload = new RegExp(
  `^/api/uploads/project-${uuid}\\.(jpg|png|webp)$`,
);
const inquiryUpload = new RegExp(
  `^/api/uploads/inquiry-${uuid}\\.(jpg|png|webp|pdf)$`,
);
const bundledImage =
  /^\/images\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/;
const digestBytes = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

function isInside(root: string, candidate: string) {
  const path = relative(root, candidate);
  return (
    !!path && path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path)
  );
}

async function readAsset(
  asset: Pick<
    LocalAsset,
    "source" | "root" | "relativePath" | "extension" | "kind"
  >,
) {
  try {
    const root = await realpath(asset.root);
    const path = await realpath(resolve(asset.root, asset.relativePath));
    if (!isInside(root, path)) throw new Error("outside root");
    const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      const info = await handle.stat();
      if (!info.isFile() || !info.size || info.size > 10 * 1024 * 1024)
        throw new Error("invalid file");
      const bytes = await handle.readFile();
      const type = detectFileType(bytes, asset.kind === "inquiry");
      if (type?.extension !== asset.extension) throw new Error("invalid type");
      return bytes;
    } finally {
      await handle.close();
    }
  } catch {
    throw new MediaMigrationError(
      `Cannot migrate ${asset.source}: the file must be readable, remain within its permitted directory, match its image/PDF extension, and be no larger than 10 MB.`,
    );
  }
}

// This function only reads the supplied records and local files. It never calls
// the application's getDb(), which can seed records and create indexes.
export async function buildMediaPlan(
  records: { projects: ProjectRecord[]; inquiries: InquiryRecord[] },
  roots: Roots,
  cloudName: string,
): Promise<MediaPlan> {
  const assets = new Map<string, LocalAsset>();
  const projects: ProjectChange[] = [];
  const counts: MediaPlan["counts"] = {
    projects: records.projects.length,
    imageReferences: 0,
    existingCloudinaryImages: 0,
    localImageReferences: 0,
    inquiryAttachments: 0,
    uniqueAssets: 0,
    bytes: 0,
  };

  async function inspect(source: string, kind: LocalAsset["kind"]) {
    if (assets.has(source)) return;
    const rawExtension = source.split(".").pop()!;
    const extension = (
      rawExtension === "jpeg" ? "jpg" : rawExtension
    ) as LocalAsset["extension"];
    const asset: LocalAsset = {
      source,
      kind,
      root: kind === "catalog" ? roots.publicDirectory : roots.uploadsDirectory,
      relativePath: kind === "catalog" ? source.slice(1) : basename(source),
      filename: basename(source),
      extension,
      digest: "",
      bytes: 0,
    };
    const bytes = await readAsset(asset);
    asset.digest = digestBytes(bytes);
    asset.bytes = bytes.length;
    assets.set(source, asset);
    counts.bytes += bytes.length;
  }

  for (const [projectIndex, project] of records.projects.entries()) {
    if (!Array.isArray(project.images) || project._id == null)
      throw new MediaMigrationError(
        `Invalid media data in project ${projectIndex + 1}. No changes were made.`,
      );
    const changes: ProjectChange = { _id: project._id, images: [] };
    for (const [index, image] of project.images.entries()) {
      counts.imageReferences++;
      const source =
        image && typeof image === "object" && "src" in image ? image.src : null;
      if (typeof source !== "string")
        throw new MediaMigrationError(
          `Invalid image reference in project ${projectIndex + 1}, image ${index + 1}.`,
        );
      if (isCloudinaryProjectUrl(source, cloudName)) {
        counts.existingCloudinaryImages++;
        continue;
      }
      const kind = bundledImage.test(source)
        ? "catalog"
        : projectUpload.test(source)
          ? "project-upload"
          : null;
      if (!kind)
        throw new MediaMigrationError(
          `Unsupported image reference in project ${projectIndex + 1}, image ${index + 1}. Only local project images and this account's existing Cloudinary images are accepted; remote images are never downloaded.`,
        );
      await inspect(source, kind);
      changes.images.push({ index, source });
      counts.localImageReferences++;
    }
    if (changes.images.length) projects.push(changes);
  }

  for (const [index, inquiry] of records.inquiries.entries()) {
    const source = inquiry.attachment;
    if (source == null || source === "") continue;
    if (typeof source !== "string" || !inquiryUpload.test(source))
      throw new MediaMigrationError(
        `Unsupported attachment reference in inquiry ${index + 1}. Private attachments must use the existing /api/uploads/inquiry-UUID path.`,
      );
    await inspect(source, "inquiry");
    counts.inquiryAttachments++;
  }
  counts.uniqueAssets = assets.size;
  return { assets: [...assets.values()], projects, counts };
}

export function projectImageUpdate(
  project: ProjectChange,
  uploaded: ReadonlyMap<string, string>,
) {
  const filter: Document = { _id: project._id };
  const values: Record<string, string> = {};
  for (const image of project.images) {
    const destination = uploaded.get(image.source);
    if (!destination)
      throw new MediaMigrationError(
        "An uploaded image could not be verified. No project update was attempted.",
      );
    const field = `images.${image.index}.src`;
    filter[field] = image.source;
    values[field] = destination;
  }
  return { filter, update: { $set: values } };
}

export async function applyMediaPlan(
  plan: MediaPlan,
  adapters: MigrationAdapters,
) {
  const uploaded = new Map<string, string>();
  const catalogUploads = new Map<string, string>();
  let uploadedAssets = 0;
  // Uploads finish before any MongoDB changes. A provider failure leaves all
  // project references unchanged; deterministic IDs make rerunning safe.
  for (const asset of plan.assets) {
    const bytes = await readAsset(asset);
    if (digestBytes(bytes) !== asset.digest)
      throw new MediaMigrationError(
        `The source file changed after preflight: ${asset.source}. No project references were changed; rerun the migration.`,
      );
    const catalogKey = `${asset.digest}.${asset.extension}`;
    let source =
      asset.kind === "catalog" ? catalogUploads.get(catalogKey) : undefined;
    if (!source) {
      try {
        const result =
          asset.kind === "catalog"
            ? await adapters.uploadCatalog(
                `catalog-${asset.digest}`,
                bytes,
                asset.extension as ImageExtension,
              )
            : await adapters.uploadFile(asset.filename, bytes);
        source = result.src;
        if (asset.kind === "inquiry" && source !== asset.source)
          throw new Error("private source mismatch");
      } catch {
        throw new MediaMigrationError(
          `Cloudinary could not safely store ${asset.source}. No project references were changed. Check the credentials and Cloudinary configuration, then rerun; local originals are retained.`,
        );
      }
      if (asset.kind === "catalog") catalogUploads.set(catalogKey, source);
    }
    uploaded.set(asset.source, source);
    uploadedAssets++;
    adapters.progress?.(uploadedAssets, plan.assets.length);
  }

  let updatedProjects = 0;
  let updatedImages = 0;
  let conflicts = 0;
  for (const project of plan.projects) {
    const { filter, update } = projectImageUpdate(project, uploaded);
    try {
      const result = await adapters.updateProject(filter, update);
      if (result.matchedCount !== 1) {
        conflicts++;
        continue;
      }
      updatedProjects++;
      updatedImages += project.images.length;
    } catch {
      throw new MediaMigrationError(
        "A MongoDB image update failed. Some earlier projects may already be migrated. Local originals are retained; rerun to safely finish the remaining projects.",
      );
    }
  }
  return { uploadedAssets, updatedProjects, updatedImages, conflicts };
}

function verifyConfiguration(apply: boolean) {
  if (!process.env.MONGODB_URI)
    throw new MediaMigrationError(
      "Set MONGODB_URI for the catalog to migrate before running this command.",
    );
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "dbg0zy3al";
  if (!/^[a-z0-9_-]+$/.test(cloudName))
    throw new MediaMigrationError("CLOUDINARY_CLOUD_NAME is invalid.");
  if (
    apply &&
    (!process.env.CLOUDINARY_API_KEY?.trim() ||
      !process.env.CLOUDINARY_API_SECRET?.trim())
  )
    throw new MediaMigrationError(
      "Set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET privately in .env.local or your shell before applying. No uploads or database writes were attempted.",
    );
  return cloudName;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log(
      "Usage: npm run media:migrate [-- --apply]\nDefault: read-only local file and MongoDB preflight. --apply uploads assets and updates project image sources. Originals and private attachment paths are retained.",
    );
    return;
  }
  if (
    args.some((argument) => argument !== "--apply") ||
    args.filter((argument) => argument === "--apply").length > 1
  )
    throw new MediaMigrationError(
      "Unknown arguments. Use npm run media:migrate, or npm run media:migrate -- --apply.",
    );
  // No environment files are read when imported by the isolated unit tests.
  loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
  const apply = args.includes("--apply");
  const cloudName = verifyConfiguration(apply);
  const client = new MongoClient(process.env.MONGODB_URI!, {
    appName: "reliant-media-migration",
    maxPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
  });
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || "reliant_renovations");
    const [projects, inquiries] = await Promise.all([
      db
        .collection("projects")
        .find({}, { projection: { images: 1 } })
        .toArray(),
      db
        .collection("inquiries")
        .find({}, { projection: { attachment: 1, _id: 0 } })
        .toArray(),
    ]);
    const plan = await buildMediaPlan(
      {
        projects: projects as unknown as ProjectRecord[],
        inquiries: inquiries as InquiryRecord[],
      },
      {
        publicDirectory: resolve("public"),
        uploadsDirectory: resolve(process.env.DATA_DIR || "data", "uploads"),
      },
      cloudName,
    );
    console.log(
      JSON.stringify(
        { mode: apply ? "apply" : "dry-run", counts: plan.counts },
        null,
        2,
      ),
    );
    if (!apply) {
      console.log(
        "Preflight passed. No uploads, database writes, indexes, or seed records were created. Run npm run media:migrate -- --apply to migrate these files. Local originals will be retained.",
      );
      return;
    }
    const { uploadCloudinaryFile, uploadCloudinaryProjectAsset } =
      await import("../lib/cloudinary");
    const result = await applyMediaPlan(plan, {
      uploadCatalog: uploadCloudinaryProjectAsset,
      uploadFile: uploadCloudinaryFile,
      updateProject: (filter, update) =>
        db.collection("projects").updateOne(filter, update),
      progress(completed, total) {
        if (completed % 10 === 0 || completed === total)
          console.log(
            `Verified ${completed}/${total} media files in Cloudinary.`,
          );
      },
    });
    console.log(JSON.stringify({ result }, null, 2));
    if (result.conflicts) {
      process.exitCode = 1;
      console.error(
        "Some projects changed during migration and were left untouched. Rerun to migrate their current images. Uploaded assets and local originals are retained.",
      );
    } else {
      console.log(
        "Migration completed. Project image order, alternative text, copy, and all local originals are retained. Private inquiry attachment URLs are unchanged.",
      );
    }
  } finally {
    await client.close();
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  void main().catch((error: unknown) => {
    console.error(
      error instanceof MediaMigrationError
        ? error.message
        : "Media migration failed. Check the MongoDB connection and Cloudinary configuration. No local files were deleted. Provider and database error details are intentionally omitted.",
    );
    process.exitCode = 1;
  });
}
