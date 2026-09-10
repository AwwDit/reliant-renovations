import "server-only";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { isUploadFilename } from "./media-urls";
import {
  deleteCloudinaryFile,
  readCloudinaryFile,
  uploadCloudinaryFile,
} from "./cloudinary";

export function mediaStorage(): "local" | "cloudinary" {
  const configured = process.env.MEDIA_STORAGE?.trim();
  if (configured === "local" || configured === "cloudinary") return configured;
  if (configured) throw new Error("Invalid media storage configuration.");
  return process.env.NODE_ENV === "production" ? "cloudinary" : "local";
}

function localPath(filename: string) {
  if (!isUploadFilename(filename)) throw new Error("Invalid upload filename.");
  return join(
    resolve(/* turbopackIgnore: true */ process.env.DATA_DIR || "data"),
    "uploads",
    filename,
  );
}

export async function storeUpload(filename: string, bytes: Uint8Array) {
  if (!isUploadFilename(filename)) throw new Error("Invalid upload filename.");
  if (mediaStorage() === "cloudinary")
    return uploadCloudinaryFile(filename, bytes);
  const path = localPath(filename);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, bytes, { flag: "wx" });
  return { src: `/api/uploads/${filename}` };
}

export async function readUpload(filename: string): Promise<Uint8Array | null> {
  if (!isUploadFilename(filename)) return null;
  if (mediaStorage() === "cloudinary") return readCloudinaryFile(filename);
  try {
    return await readFile(localPath(filename));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function deleteUpload(filename: string): Promise<void> {
  if (!isUploadFilename(filename)) throw new Error("Invalid upload filename.");
  if (mediaStorage() === "cloudinary") return deleteCloudinaryFile(filename);
  try {
    await unlink(localPath(filename));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
