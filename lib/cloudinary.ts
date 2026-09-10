import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

const API_ORIGIN = "https://api.cloudinary.com/v1_1";
const PUBLIC_ID_PREFIX = "reliant/";
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 30_000;
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const FILENAME = new RegExp(
  `^(project|inquiry)-(${UUID})\\.(jpg|png|webp|pdf)$`,
);

type Configuration = {
  cloudName: string;
  assetFolder: string;
  apiKey: string;
  apiSecret: string;
};

type Asset = {
  publicId: string;
  extension: string;
  resourceType: "image" | "raw";
  deliveryType: "upload" | "authenticated";
};

type Metadata = { assetId: string; src: string; existing: boolean };

function configuration(): Configuration {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() || "dbg0zy3al";
  const assetFolder = process.env.CLOUDINARY_ASSET_FOLDER?.trim() || "reliant";
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (
    !/^[a-z0-9][a-z0-9_-]{0,62}$/.test(cloudName) ||
    !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(assetFolder) ||
    !apiKey ||
    !/^[a-zA-Z0-9_-]+$/.test(apiKey) ||
    !apiSecret ||
    /[\u0000-\u0020\u007f]/.test(apiSecret)
  ) {
    throw new Error("Cloudinary storage is not configured correctly.");
  }
  return { cloudName, assetFolder, apiKey, apiSecret };
}

function assetForFilename(filename: string): Asset {
  const match = FILENAME.exec(filename);
  if (!match || (match[1] === "project" && match[3] === "pdf")) {
    throw new Error("Invalid storage filename.");
  }
  const privateFile = match[1] === "inquiry";
  return {
    publicId:
      PUBLIC_ID_PREFIX +
      (privateFile ? filename : filename.slice(0, filename.lastIndexOf("."))),
    extension: match[3],
    resourceType: privateFile ? "raw" : "image",
    deliveryType: privateFile ? "authenticated" : "upload",
  };
}

function signedParameters(
  parameters: Record<string, string>,
  config: Configuration,
) {
  // Cloudinary signs sorted raw values; ampersands are escaped per its current SDK.
  const serialized = Object.entries(parameters)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`.replaceAll("&", "%26"))
    .join("&");
  return {
    ...parameters,
    api_key: config.apiKey,
    signature: createHash("sha256")
      .update(serialized + config.apiSecret)
      .digest("hex"),
  };
}

function timestamp() {
  return Math.floor(Date.now() / 1000);
}

function options(): RequestInit {
  return {
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  };
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error();
  return value as Record<string, unknown>;
}

function metadata(
  value: unknown,
  asset: Asset,
  config: Configuration,
  upload: boolean,
): Metadata {
  const data = object(value);
  if (
    data.public_id !== asset.publicId ||
    data.resource_type !== asset.resourceType ||
    data.type !== asset.deliveryType ||
    typeof data.asset_id !== "string" ||
    !/^[a-zA-Z0-9_-]{16,128}$/.test(data.asset_id) ||
    !Number.isSafeInteger(data.version) ||
    Number(data.version) <= 0 ||
    typeof data.secure_url !== "string" ||
    (asset.resourceType === "image" && data.format !== asset.extension) ||
    (upload && data.asset_folder !== config.assetFolder) ||
    data.overwritten === true
  )
    throw new Error();

  // Never accept another cloud, a transformation, a redirect, or a credential-bearing URL.
  const extension = asset.resourceType === "image" ? `.${asset.extension}` : "";
  const src = `https://res.cloudinary.com/${config.cloudName}/${asset.resourceType}/${asset.deliveryType}/v${data.version}/${asset.publicId}${extension}`;
  if (data.secure_url !== src) throw new Error();

  if (upload) {
    if (
      typeof data.signature !== "string" ||
      !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(data.signature)
    )
      throw new Error();
    const expected = createHash(
      data.signature.length === 40 ? "sha1" : "sha256",
    )
      .update(
        `public_id=${asset.publicId}&version=${data.version}${config.apiSecret}`,
      )
      .digest();
    if (!timingSafeEqual(expected, Buffer.from(data.signature, "hex")))
      throw new Error();
  }
  return { assetId: data.asset_id, src, existing: data.existing === true };
}

async function responseBytes(response: Response): Promise<Uint8Array> {
  const length = Number(response.headers.get("content-length") || 0);
  if (length > MAX_FILE_BYTES || !response.body) throw new Error();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_FILE_BYTES) throw new Error();
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  if (!total) throw new Error();
  return Buffer.concat(chunks, total);
}

async function downloadAsset(
  assetId: string,
  config: Configuration,
): Promise<Uint8Array | null> {
  const now = timestamp();
  // POST keeps the API key and short-lived signature out of URLs and access logs.
  const response = await fetch(
    `${API_ORIGIN}/${config.cloudName}/asset/download`,
    {
      ...options(),
      method: "POST",
      body: new URLSearchParams(
        signedParameters(
          {
            asset_id: assetId,
            timestamp: String(now),
            expires_at: String(now + 60),
          },
          config,
        ),
      ),
    },
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error();
  return responseBytes(response);
}

async function uploadAsset(
  asset: Asset,
  bytes: Uint8Array,
  config: Configuration,
): Promise<{ src: string }> {
  if (!bytes.byteLength || bytes.byteLength > MAX_FILE_BYTES)
    throw new Error("Invalid storage file size.");
  try {
    const form = new FormData();
    const parameters = signedParameters(
      {
        asset_folder: config.assetFolder,
        public_id: asset.publicId,
        type: asset.deliveryType,
        overwrite: "false",
        use_asset_folder_as_public_id_prefix: "false",
        timestamp: String(timestamp()),
      },
      config,
    );
    for (const [key, value] of Object.entries(parameters)) form.set(key, value);
    const mime =
      asset.extension === "pdf"
        ? "application/pdf"
        : `image/${asset.extension === "jpg" ? "jpeg" : asset.extension}`;
    form.set(
      "file",
      new Blob([Uint8Array.from(bytes)], { type: mime }),
      `${asset.publicId.split("/").at(-1)}${asset.resourceType === "image" ? `.${asset.extension}` : ""}`,
    );
    const response = await fetch(
      `${API_ORIGIN}/${config.cloudName}/${asset.resourceType}/upload`,
      {
        ...options(),
        method: "POST",
        body: form,
      },
    );
    if (!response.ok) throw new Error();
    const uploaded = metadata(await response.json(), asset, config, true);
    if (uploaded.existing) {
      const existing = await downloadAsset(uploaded.assetId, config);
      if (
        !existing ||
        !timingSafeEqual(
          createHash("sha256").update(bytes).digest(),
          createHash("sha256").update(existing).digest(),
        )
      )
        throw new Error();
    }
    return {
      src:
        asset.deliveryType === "authenticated"
          ? `/api/uploads/${asset.publicId.slice(PUBLIC_ID_PREFIX.length)}`
          : uploaded.src,
    };
  } catch {
    // Do not surface provider bodies, request objects, credentials, or signed URLs.
    throw new Error("Unable to store the file in Cloudinary.");
  }
}

export async function uploadCloudinaryFile(
  filename: string,
  bytes: Uint8Array,
): Promise<{ src: string }> {
  return uploadAsset(assetForFilename(filename), bytes, configuration());
}

export async function uploadCloudinaryProjectAsset(
  publicIdSuffix: string,
  bytes: Uint8Array,
  extension: string,
): Promise<{ src: string }> {
  const format = extension
    .toLowerCase()
    .replace(/^\./, "")
    .replace(/^jpeg$/, "jpg");
  if (
    !/^catalog-[a-zA-Z0-9_-]{1,180}$/.test(publicIdSuffix) ||
    !/^(jpg|png|webp)$/.test(format)
  ) {
    throw new Error("Invalid project asset identifier.");
  }
  return uploadAsset(
    {
      publicId: PUBLIC_ID_PREFIX + publicIdSuffix,
      extension: format,
      resourceType: "image",
      deliveryType: "upload",
    },
    bytes,
    configuration(),
  );
}

export async function readCloudinaryFile(
  filename: string,
): Promise<Uint8Array | null> {
  const asset = assetForFilename(filename);
  const config = configuration();
  try {
    const response = await fetch(
      `${API_ORIGIN}/${config.cloudName}/resources/${asset.resourceType}/${asset.deliveryType}/${encodeURIComponent(asset.publicId)}`,
      {
        ...options(),
        method: "GET",
        headers: {
          Authorization: `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64")}`,
        },
      },
    );
    if (response.status === 404) return null;
    if (!response.ok) throw new Error();
    const found = metadata(await response.json(), asset, config, false);
    return await downloadAsset(found.assetId, config);
  } catch {
    throw new Error("Unable to read the file from Cloudinary.");
  }
}

export async function deleteCloudinaryFile(filename: string): Promise<void> {
  const asset = assetForFilename(filename);
  const config = configuration();
  try {
    const response = await fetch(
      `${API_ORIGIN}/${config.cloudName}/${asset.resourceType}/destroy`,
      {
        ...options(),
        method: "POST",
        body: new URLSearchParams(
          signedParameters(
            {
              public_id: asset.publicId,
              type: asset.deliveryType,
              invalidate: "true",
              timestamp: String(timestamp()),
            },
            config,
          ),
        ),
      },
    );
    if (!response.ok) throw new Error();
    const result = object(await response.json()).result;
    if (result !== "ok" && result !== "not found") throw new Error();
  } catch {
    throw new Error("Unable to remove the file from Cloudinary.");
  }
}
