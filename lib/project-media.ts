import { projectMedia } from "./project-media-manifest";

const originalSources = new Map(
  Object.entries(projectMedia).map(([original, migrated]) => [
    migrated,
    original,
  ]),
);

/** Public catalog URLs only; safe to use in both server and client components. */
export function projectMediaSource(source: string): string {
  return projectMedia[source] ?? source;
}

/** Recover catalog metadata such as dimensions after a photo moves to the CDN. */
export function originalProjectMediaSource(source: string): string {
  try {
    const url = new URL(source);
    url.search = "";
    url.hash = "";
    return originalSources.get(url.href) ?? source;
  } catch {
    return source;
  }
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
    return (
      image.origin === migrated.origin && image.pathname === migrated.pathname
    );
  } catch {
    return false;
  }
}
