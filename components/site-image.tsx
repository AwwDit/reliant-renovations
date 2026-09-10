"use client";

import NextImage from "next/image";
import type { ComponentProps } from "react";
import {
  cloudinaryImageLoader,
  usesCloudinaryDelivery,
} from "@/lib/cloudinary-image-loader";

/** Send public project photos straight to the CDN; retain Next optimization for local assets. */
export default function SiteImage({
  src,
  loader,
  ...props
}: ComponentProps<typeof NextImage>) {
  return (
    <NextImage
      {...props}
      src={src}
      loader={
        loader ??
        (typeof src === "string" && usesCloudinaryDelivery(src)
          ? cloudinaryImageLoader
          : undefined)
      }
    />
  );
}
