import { projectMedia } from "./project-media-manifest";

/** Public catalog URLs only; safe to use in both server and client components. */
export function projectMediaSource(source: string): string {
  return projectMedia[source] ?? source;
}

/** Keep curated photo identity when its storage URL or gallery position changes. */
export function isProjectMediaSource(
  source: string | undefined,
  originalSource: string,
): boolean {
  if (!source) return false;
  try {
    const image = new URL(source, "https://local.invalid");
    const original = new URL(originalSource, "https://local.invalid");
    if (image.pathname === original.pathname) return true;
    const migrated = new URL(
      projectMediaSource(originalSource),
      "https://local.invalid",
    );
    return image.origin === migrated.origin && image.pathname === migrated.pathname;
  } catch {
    return false;
  }
}
