import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { socialPreview } from "../lib/social-preview";
import {
  loadSocialArtwork,
  renderSocialArtwork,
} from "./social-preview-artwork";

async function generate() {
  const response = renderSocialArtwork(await loadSocialArtwork());
  const destination = path.join(process.cwd(), "public", socialPreview.path);
  await mkdir(path.dirname(destination), { recursive: true });
  const result = await sharp(Buffer.from(await response.arrayBuffer()))
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(destination);
  console.log(
    `Social preview: ${destination} (${result.width} × ${result.height}, ${Math.round(result.size / 1024)} KB)`,
  );
}

generate().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
