import assert from "node:assert/strict";
import test from "node:test";
import {
  cloudinaryImageLoader,
  usesCloudinaryDelivery,
} from "../lib/cloudinary-image-loader";
import { projectMedia } from "../lib/project-media-manifest";

const source = Object.values(projectMedia)[0];

test("all catalog photos retain their version and identity in responsive CDN URLs", () => {
  for (const src of Object.values(projectMedia)) {
    assert.equal(usesCloudinaryDelivery(src), true);
    for (const width of [384, 640, 1080, 1920]) {
      const delivered = cloudinaryImageLoader({ src, width });
      const url = new URL(delivered);
      assert.equal(url.origin, "https://res.cloudinary.com");
      assert.equal(url.search, "");
      assert.equal(
        delivered.replace(`/c_limit,w_${width}/f_auto/q_auto/`, "/"),
        src,
      );
    }
  }
});

test("CDN delivery respects explicit quality and caps dimensions to the upload maximum", () => {
  assert.ok(
    cloudinaryImageLoader({ src: source, width: 3840, quality: 85 }).includes(
      "/c_limit,w_2400/f_auto/q_85/",
    ),
  );
});

test("local assets and private inquiry attachments keep their existing delivery path", () => {
  for (const src of [
    "/images/brand/reliant-white-transparent.png",
    "/images/projects/upper-west-side-apartment/01.webp",
    "/api/uploads/project-cc3b7e26-6ab2-49ed-99c3-f799a3949764.webp",
    "/api/uploads/inquiry-cc3b7e26-6ab2-49ed-99c3-f799a3949764.webp",
    source.replace("/image/upload/", "/raw/authenticated/"),
    source.replace("/image/upload/", "/image/authenticated/"),
  ]) {
    assert.equal(usesCloudinaryDelivery(src), false);
    assert.throws(() => cloudinaryImageLoader({ src, width: 640 }));
  }
});

test("only canonical public images in the configured account can use CDN transformations", () => {
  for (const src of [
    source.replace("/dbg0zy3al/", "/another-account/"),
    source.replace("res.cloudinary.com", "res.cloudinary.com.attacker.test"),
    source.replace("https:", "http:"),
    source.replace("/reliant/", "/another-project/"),
    source + "?token=private",
    source.replace("/image/upload/", "/image/upload/w_100/"),
  ]) {
    assert.equal(usesCloudinaryDelivery(src), false);
  }
});

test("invalid transformation arguments are rejected", () => {
  for (const width of [0, -1, 1.5, Infinity, NaN]) {
    assert.throws(() => cloudinaryImageLoader({ src: source, width }));
  }
  for (const quality of [0, 101, 1.5, Infinity, NaN]) {
    assert.throws(() =>
      cloudinaryImageLoader({ src: source, width: 640, quality }),
    );
  }
});
