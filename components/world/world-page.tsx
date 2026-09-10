"use client";

import Image from "next/image";
import { useEffect, type ReactNode } from "react";
import { useWorldContext, worldImageStyle } from "./world-shell";
import type { WorldScene } from "./world-types";

export type { WorldScene } from "./world-types";

export function WorldPage({
  scene,
  children,
  className = "",
  preserveScene = false,
}: {
  scene?: WorldScene;
  children: ReactNode;
  className?: string;
  preserveScene?: boolean;
}) {
  const { registerScene, hasVisibleScene } = useWorldContext();
  const id = scene?.id;
  const image = scene?.image;
  const alt = scene?.alt;
  const position = scene?.position;
  const zoom = scene?.zoom;
  const video = scene?.video;
  const videoTime = scene?.videoTime;

  useEffect(() => {
    registerScene(
      id !== undefined && image !== undefined && alt !== undefined
        ? { id, image, alt, position, zoom, video, videoTime }
        : undefined,
      preserveScene,
    );
  }, [
    registerScene,
    id,
    image,
    alt,
    position,
    zoom,
    video,
    videoTime,
    preserveScene,
  ]);

  return (
    <div className={`world-page ${className}`} data-page-scene={id}>
      {!hasVisibleScene && scene?.image && (
        <div className="world-page-fallback">
          <Image
            className="world-image"
            src={scene.image}
            alt={scene.alt}
            fill
            sizes="max(100vw, 150vh)"
            unoptimized={scene.image.startsWith("/images/experience/")}
            loading="eager"
            fetchPriority="high"
            style={worldImageStyle(scene)}
          />
        </div>
      )}
      <div className="world-page-content">{children}</div>
    </div>
  );
}
