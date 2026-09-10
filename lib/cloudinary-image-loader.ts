import type { ImageLoaderProps } from "next/image";
import { isCloudinaryProjectUrl } from "./media-urls";

// The cloud name is public; next.config.ts supplies the same value to server and browser.
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dbg0zy3al";

export function usesCloudinaryDelivery(source: string): boolean {
  return isCloudinaryProjectUrl(source, cloudName);
}

export function cloudinaryImageLoader({
  src,
  width,
  quality,
}: ImageLoaderProps): string {
  if (!usesCloudinaryDelivery(src)) {
    throw new Error("Cloudinary delivery requires a public project image.");
  }
  if (
    !Number.isInteger(width) ||
    width < 1 ||
    (quality !== undefined &&
      (!Number.isInteger(quality) || quality < 1 || quality > 100))
  ) {
    throw new Error("Invalid image dimensions or quality.");
  }
  // Uploads are capped at 2400px. c_limit preserves aspect ratio and never upscales.
  const transform = `c_limit,w_${Math.min(width, 2400)}/f_auto/q_${quality ?? "auto"}`;
  return src.replace("/image/upload/", `/image/upload/${transform}/`);
}
