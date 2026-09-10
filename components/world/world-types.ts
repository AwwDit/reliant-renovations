/** A photographic environment, optionally enhanced by a paused video frame. */
export interface WorldScene {
  id: string;
  image: string;
  alt: string;
  /** CSS object-position, e.g. "35% 50%". */
  position?: string;
  /** Camera crop scale; values are bounded to 1–2.5. */
  zoom?: number;
  video?: string;
  /** Absolute video time in seconds. Video never plays automatically. */
  videoTime?: number;
}
