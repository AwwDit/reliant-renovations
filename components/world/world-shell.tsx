"use client";

import Image from "@/components/site-image";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { WorldScene } from "./world-types";
import "./world-shell.css";

export type { WorldScene } from "./world-types";

type Frame = { key: string; scene: WorldScene; ready: boolean };
type WorldContextValue = {
  scene: WorldScene | null;
  setScene: (scene: WorldScene) => void;
  registerScene: (scene: WorldScene | undefined, preserve: boolean) => void;
  hasVisibleScene: boolean;
};

const WorldContext = createContext<WorldContextValue | null>(null);
const mediaKey = (scene: WorldScene) => `${scene.image}|${scene.video || ""}`;
const equalScene = (a: WorldScene | null, b: WorldScene) =>
  a?.id === b.id &&
  a.image === b.image &&
  a.alt === b.alt &&
  a.position === b.position &&
  a.zoom === b.zoom &&
  a.video === b.video &&
  a.videoTime === b.videoTime;

export function worldImageStyle(scene: WorldScene): CSSProperties {
  const scale = Number.isFinite(scene.zoom)
    ? Math.min(2.5, Math.max(1, scene.zoom!))
    : 1;
  return {
    objectPosition: scene.position || "50% 50%",
    transformOrigin: scene.position || "50% 50%",
    transform: `scale(${scale})`,
  };
}

export function useWorldScene() {
  const value = useWorldContext();
  return { scene: value.scene, setScene: value.setScene };
}

/** Internal page registration also tracks when its SSR image can be removed. */
export function useWorldContext() {
  const value = useContext(WorldContext);
  if (!value) throw new Error("WorldPage must be rendered inside WorldShell.");
  return value;
}

function PausedFrame({ scene }: { scene: WorldScene }) {
  const ref = useRef<HTMLVideoElement>(null);
  const target = useRef(0);
  const requestSeek = useRef<() => void>(() => {});
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const player = ref.current;
    if (!player) return;
    // Strict Mode may run cleanup/setup twice without recreating the element.
    if (scene.video) player.src = scene.video;
    let failed = false;
    let lastRequested: number | null = null;
    const seek = () => {
      player.pause();
      if (failed || !Number.isFinite(player.duration)) return;
      const at = Math.min(
        Math.max(0, target.current),
        Math.max(0, player.duration - 0.04),
      );
      if (Math.abs(player.currentTime - at) > 0.035) {
        // A resource that clamps a seek must not start an idle seeked loop.
        if (lastRequested !== at) {
          lastRequested = at;
          player.currentTime = at;
        }
      } else if (player.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        setVisible(true);
      }
    };
    const complete = () => {
      if (failed) return;
      player.pause();
      seek();
    };
    const fail = () => {
      failed = true;
      player.pause();
      setVisible(false);
    };
    const pause = () => player.pause();
    player.addEventListener("loadedmetadata", seek);
    player.addEventListener("loadeddata", seek);
    player.addEventListener("seeked", complete);
    player.addEventListener("error", fail);
    player.addEventListener("play", pause);
    document.addEventListener("visibilitychange", pause);
    requestSeek.current = seek;
    seek();
    return () => {
      player.pause();
      player.removeEventListener("loadedmetadata", seek);
      player.removeEventListener("loadeddata", seek);
      player.removeEventListener("seeked", complete);
      player.removeEventListener("error", fail);
      player.removeEventListener("play", pause);
      document.removeEventListener("visibilitychange", pause);
      requestSeek.current = () => {};
      player.removeAttribute("src");
      player.load();
    };
  }, [scene.video]);

  useEffect(() => {
    target.current = Number.isFinite(scene.videoTime) ? scene.videoTime! : 0;
    requestSeek.current();
  }, [scene.videoTime]);

  return (
    <video
      ref={ref}
      className="world-video"
      data-visible={visible}
      src={scene.video}
      style={worldImageStyle(scene)}
      muted
      playsInline
      preload="auto"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}

export function WorldShell({ children }: { children: ReactNode }) {
  const [scene, updateScene] = useState<WorldScene | null>(null);
  const [frames, setFrames] = useState<Frame[]>([]);
  const desired = useRef<WorldScene | null>(null);
  const cleanup = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setScene = useCallback((next: WorldScene) => {
    if (equalScene(desired.current, next)) return;
    const key = mediaKey(next);
    const changedMedia = !desired.current || mediaKey(desired.current) !== key;
    desired.current = next;
    updateScene(next);
    if (changedMedia && cleanup.current) {
      clearTimeout(cleanup.current);
      cleanup.current = null;
    }
    setFrames((current) => {
      if (!next.image) return [{ key, scene: next, ready: true }];
      // Crop/zoom changes reuse the decoded element, including its video frame.
      if (current.at(-1)?.key === key) {
        return current.map((frame) =>
          frame.key === key ? { ...frame, scene: next } : frame,
        );
      }
      const previous = [...current].reverse().find((frame) => frame.ready);
      if (previous?.key === key) return [{ ...previous, scene: next }];
      return [
        ...(previous ? [previous] : []),
        { key, scene: next, ready: false },
      ];
    });
  }, []);

  const registerScene = useCallback(
    (next: WorldScene | undefined, preserve: boolean) => {
      if (preserve && desired.current) return;
      if (next) {
        setScene(next);
      } else {
        desired.current = null;
        updateScene(null);
        setFrames([]);
        if (cleanup.current) clearTimeout(cleanup.current);
        cleanup.current = null;
      }
    },
    [setScene],
  );

  const ready = useCallback((key: string) => {
    if (!desired.current || mediaKey(desired.current) !== key) return;
    setFrames((current) =>
      current.map((frame) =>
        frame.key === key ? { ...frame, ready: true } : frame,
      ),
    );
    if (cleanup.current) clearTimeout(cleanup.current);
    cleanup.current = setTimeout(() => {
      setFrames((current) =>
        current.at(-1)?.key === key
          ? current.filter((frame) => frame.key === key)
          : current,
      );
      cleanup.current = null;
    }, 900);
  }, []);

  useEffect(
    () => () => {
      if (cleanup.current) clearTimeout(cleanup.current);
    },
    [],
  );

  const hasVisibleScene = frames.some((frame) => frame.ready);
  const value = useMemo(
    () => ({ scene, setScene, registerScene, hasVisibleScene }),
    [scene, setScene, registerScene, hasVisibleScene],
  );

  return (
    <WorldContext.Provider value={value}>
      <div className="world-shell" data-world-scene={scene?.id}>
        <div className="world-backdrop" aria-hidden="true">
          {frames.map((frame) => (
            <div
              key={frame.key}
              className="world-frame"
              data-ready={frame.ready}
              data-empty={!frame.scene.image}
              data-scene={frame.scene.id}
            >
              {frame.scene.image && (
                <Image
                  className="world-image"
                  src={frame.scene.image}
                  alt=""
                  fill
                  sizes="max(100vw, 150vh)"
                  unoptimized={frame.scene.image.startsWith(
                    "/images/experience/",
                  )}
                  loading="eager"
                  style={worldImageStyle(frame.scene)}
                  onLoad={() => ready(frame.key)}
                />
              )}
              {frame.ready && frame.scene.image && frame.scene.video && (
                <PausedFrame scene={frame.scene} />
              )}
            </div>
          ))}
        </div>
        <div className="world-foreground">{children}</div>
      </div>
    </WorldContext.Provider>
  );
}
