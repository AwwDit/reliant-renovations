const uuid = "[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}";
const uploadName = new RegExp(
  `^(?:project-${uuid}\\.(?:jpg|png|webp)|inquiry-${uuid}\\.(?:jpg|png|webp|pdf))$`,
);

export function isUploadFilename(value: string): boolean {
  return uploadName.test(value);
}

export function mediaCloudName(): string {
  const name = process.env.CLOUDINARY_CLOUD_NAME?.trim() || "dbg0zy3al";
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new Error("Invalid Cloudinary cloud name.");
  }
  return name;
}

export function isCloudinaryProjectUrl(
  value: string,
  cloudName = mediaCloudName(),
): boolean {
  if (/[\\\s%]/.test(value)) return false;
  try {
    const url = new URL(value);
    if (
      url.href !== value ||
      url.protocol !== "https:" ||
      url.hostname !== "res.cloudinary.com" ||
      url.port ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      return false;
    if (!/^[a-zA-Z0-9_-]+$/.test(cloudName)) return false;
    const prefix = `/${cloudName}/image/upload/`;
    if (!url.pathname.startsWith(prefix)) return false;
    return new RegExp(
      `^v[1-9][0-9]*/reliant/(?:project-${uuid}|catalog-[a-zA-Z0-9_-]+)\\.(?:jpg|jpeg|png|webp)$`,
    ).test(url.pathname.slice(prefix.length));
  } catch {
    return false;
  }
}
