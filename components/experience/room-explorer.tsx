"use client";

import Image from "@/components/site-image";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  ArrowsOutCardinal,
  ArrowCounterClockwise,
  Plus,
  X,
} from "@phosphor-icons/react";
import type { PanoramaController } from "@/lib/experience-panorama";
import "./room-explorer.css";

export interface ExperienceFeature {
  id: string;
  title: string;
  description: string;
  /** Degrees: positive yaw looks right; positive pitch looks up. */
  yaw: number;
  pitch: number;
  projectHref?: string;
}

export interface ExperienceRoom {
  id: string;
  title: string;
  panorama?: string;
  poster: string;
  posterAlt?: string;
  initialYaw?: number;
  initialPitch?: number;
  /** Angular coverage of the image; defaults to a full 360° × 180° sphere. */
  horizontalFov?: number;
  verticalFov?: number;
  features: ExperienceFeature[];
}

type ViewState = "poster" | "loading" | "ready" | "error";

export function RoomExplorer({
  rooms,
  className = "",
}: {
  rooms: ExperienceRoom[];
  className?: string;
}) {
  const [roomId, setRoomId] = useState(rooms[0]?.id || "");
  const [featureId, setFeatureId] = useState<string | null>(null);
  const [state, setState] = useState<ViewState>("poster");
  const room = rooms.find((item) => item.id === roomId) || rooms[0];
  const selected =
    room?.features.find((feature) => feature.id === featureId) ||
    room?.features[0];
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const enterRef = useRef<HTMLButtonElement>(null);
  const controller = useRef<PanoramaController | null>(null);
  const markerRefs = useRef(new Map<string, HTMLButtonElement>());
  const pending = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const alive = useRef(true);
  const entered = useRef(false);
  const visible = useRef(true);
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const detailId = useId();
  const instructionsId = useId();
  const cancelLoading = useCallback(() => {
    generation.current++;
    pending.current?.abort();
  }, []);

  useEffect(() => {
    alive.current = true;
    const stage = stageRef.current;
    if (stage) stage.dataset.enhanced = "true";
    let intersecting = true;
    const updateVisibility = () => {
      visible.current = intersecting && !document.hidden;
      controller.current?.setVisible(visible.current);
    };
    const observer = new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting;
      updateVisibility();
    });
    if (stage) observer.observe(stage);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      alive.current = false;
      cancelLoading();
      observer.disconnect();
      document.removeEventListener("visibilitychange", updateVisibility);
      controller.current?.dispose();
      controller.current = null;
    };
  }, [cancelLoading]);

  function fail() {
    if (!alive.current) return;
    pending.current?.abort();
    controller.current?.dispose();
    controller.current = null;
    entered.current = false;
    setState("error");
  }

  async function enterRoom(nextRoom: ExperienceRoom) {
    const version = ++generation.current;
    pending.current?.abort();
    const abort = new AbortController();
    pending.current = abort;
    entered.current = true;
    setState("loading");
    try {
      if (!nextRoom.panorama) throw new Error("Panorama not available");
      if (!controller.current) {
        const { createPanorama } = await import("@/lib/experience-panorama");
        if (
          !alive.current ||
          version !== generation.current ||
          !hostRef.current
        )
          return;
        controller.current = createPanorama(hostRef.current, {
          onProject(points) {
            for (const point of points) {
              const button = markerRefs.current.get(point.id);
              if (!button) continue;
              button.hidden = !point.visible;
              button.style.transform = `translate(${point.x}px, ${point.y}px) translate(-50%, -50%)`;
            }
          },
          onView(yaw, pitch) {
            if (stageRef.current) {
              stageRef.current.dataset.yaw = yaw.toFixed(2);
              stageRef.current.dataset.pitch = pitch.toFixed(2);
            }
          },
          onError: fail,
        });
        controller.current.setVisible(visible.current);
      }
      await controller.current.load(
        nextRoom.panorama,
        nextRoom.features,
        nextRoom.initialYaw || 0,
        nextRoom.initialPitch || 0,
        abort.signal,
        {
          horizontalFov: nextRoom.horizontalFov,
          verticalFov: nextRoom.verticalFov,
        },
      );
      if (!alive.current || version !== generation.current) return;
      setState("ready");
      requestAnimationFrame(() => {
        if (alive.current && version === generation.current)
          surfaceRef.current?.focus({ preventScroll: true });
      });
    } catch {
      if (
        alive.current &&
        version === generation.current &&
        !abort.signal.aborted
      )
        fail();
    }
  }

  function changeRoom(nextRoom: ExperienceRoom) {
    if (nextRoom.id === room.id) return;
    setRoomId(nextRoom.id);
    setFeatureId(null);
    if (entered.current) void enterRoom(nextRoom);
    else setState("poster");
  }

  function exitRoom() {
    generation.current++;
    pending.current?.abort();
    controller.current?.dispose();
    controller.current = null;
    entered.current = false;
    drag.current = null;
    setState("poster");
    requestAnimationFrame(() =>
      enterRef.current?.focus({ preventScroll: true }),
    );
  }

  function selectFeature(feature: ExperienceFeature) {
    setFeatureId(feature.id);
    if (state === "ready")
      controller.current?.lookAt(feature.yaw, feature.pitch);
  }

  if (!room) return null;

  return (
    <section
      className={`rx-explorer ${className}`}
      data-state={state}
      aria-label="Residential room explorer"
    >
      <div className="rx-stage" ref={stageRef}>
        <Image
          key={room.poster}
          src={room.poster}
          alt={room.posterAlt || `${room.title} interior design concept`}
          fill
          sizes="(max-width: 800px) 100vw, 75vw"
          className="rx-poster"
          preload
        />
        <div className="rx-render-host" ref={hostRef} aria-hidden="true" />
        <div
          ref={surfaceRef}
          className="rx-look-surface"
          role="group"
          tabIndex={state === "ready" ? 0 : -1}
          aria-label={`Look around the ${room.title.toLowerCase()}`}
          aria-describedby={instructionsId}
          onPointerDown={(event) => {
            if (state !== "ready" || !event.isPrimary || event.button !== 0)
              return;
            drag.current = {
              id: event.pointerId,
              x: event.clientX,
              y: event.clientY,
            };
            event.currentTarget.setPointerCapture(event.pointerId);
            event.currentTarget.dataset.dragging = "true";
          }}
          onPointerMove={(event) => {
            const previous = drag.current;
            if (!previous || previous.id !== event.pointerId) return;
            controller.current?.move(
              (previous.x - event.clientX) * 0.14,
              (event.clientY - previous.y) * 0.14,
            );
            previous.x = event.clientX;
            previous.y = event.clientY;
          }}
          onPointerUp={(event) => {
            drag.current = null;
            event.currentTarget.dataset.dragging = "false";
            if (event.currentTarget.hasPointerCapture(event.pointerId))
              event.currentTarget.releasePointerCapture(event.pointerId);
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
          onLostPointerCapture={(event) => {
            drag.current = null;
            event.currentTarget.dataset.dragging = "false";
          }}
          onKeyDown={(event) => {
            if (state !== "ready") return;
            const steps: Record<string, [number, number]> = {
              ArrowLeft: [-12, 0],
              ArrowRight: [12, 0],
              ArrowUp: [0, 8],
              ArrowDown: [0, -8],
            };
            if (steps[event.key]) {
              event.preventDefault();
              controller.current?.move(...steps[event.key]);
            } else if (event.key === "Home") {
              event.preventDefault();
              controller.current?.reset();
            } else if (event.key === "Escape") exitRoom();
          }}
        />
        <div className="rx-shade" aria-hidden="true" />
        <div className="rx-topline">
          <p>
            Design concept <span>· Inspired by Reliant’s work</span>
          </p>
          {(state === "ready" || state === "loading") && (
            <button
              type="button"
              className="rx-icon-button"
              onClick={exitRoom}
              aria-label="Exit room"
            >
              <X size={20} />
            </button>
          )}
        </div>
        <div className="rx-hotspots">
          {room.features.map((feature, index) => (
            <button
              key={`${room.id}-${feature.id}`}
              ref={(element) => {
                if (element) markerRefs.current.set(feature.id, element);
                else markerRefs.current.delete(feature.id);
              }}
              hidden
              type="button"
              className="rx-hotspot"
              aria-label={`Explore ${feature.title}`}
              aria-pressed={selected?.id === feature.id}
              aria-controls={detailId}
              onClick={() => selectFeature(feature)}
            >
              <Plus size={19} />
              <span className="rx-hotspot-name">{feature.title}</span>
              <span className="rx-sr-only">Feature {index + 1}</span>
            </button>
          ))}
        </div>
        {state !== "ready" && (
          <div className="rx-entry">
            <p className="rx-eyebrow">The residential collection</p>
            <h2>{room.title}</h2>
            <p>
              {state === "error"
                ? "The interactive view is unavailable. You can still explore the details below."
                : "A space to explore. Details to discover."}
            </p>
            <button
              ref={enterRef}
              type="button"
              className="rx-enter"
              disabled={state === "loading"}
              onClick={() => void enterRoom(room)}
            >
              <ArrowsOutCardinal size={20} />
              {state === "loading"
                ? "Opening your room…"
                : state === "error"
                  ? "Try interactive view"
                  : "Enter room"}
            </button>
          </div>
        )}
        <div className="rx-bottomline">
          <div>
            <p className="rx-room-caption">{room.title}</p>
            <p id={instructionsId} className="rx-instructions">
              {state === "ready"
                ? "Drag to look · Arrow keys to turn · Select a detail"
                : "Explore the services behind a considered home."}
            </p>
          </div>
          {state === "ready" && (
            <div
              className="rx-direction-controls"
              role="group"
              aria-label="Look around controls"
            >
              <button
                type="button"
                className="rx-icon-button"
                onClick={() => controller.current?.move(-18, 0)}
                aria-label="Look left"
              >
                <ArrowLeft size={19} />
              </button>
              <button
                type="button"
                className="rx-icon-button"
                onClick={() => controller.current?.move(0, 12)}
                aria-label="Look up"
              >
                <ArrowUp size={19} />
              </button>
              <button
                type="button"
                className="rx-icon-button"
                onClick={() => controller.current?.reset()}
                aria-label="Reset room view"
              >
                <ArrowCounterClockwise size={19} />
              </button>
              <button
                type="button"
                className="rx-icon-button"
                onClick={() => controller.current?.move(0, -12)}
                aria-label="Look down"
              >
                <ArrowDown size={19} />
              </button>
              <button
                type="button"
                className="rx-icon-button"
                onClick={() => controller.current?.move(18, 0)}
                aria-label="Look right"
              >
                <ArrowRight size={19} />
              </button>
            </div>
          )}
        </div>
        <p className="rx-sr-only" role="status">
          {state === "loading"
            ? `Opening ${room.title}.`
            : state === "ready"
              ? `${room.title} interactive view ready.`
              : state === "error"
                ? "Interactive view unavailable. Still image and service details are available."
                : `${room.title} still image.`}
        </p>
      </div>
      <aside className="rx-panel" aria-label="Rooms and design details">
        <div className="rx-room-tabs" role="group" aria-label="Choose a room">
          {rooms.map((item, index) => (
            <button
              type="button"
              key={item.id}
              aria-pressed={room.id === item.id}
              onClick={() => changeRoom(item)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {item.title}
            </button>
          ))}
        </div>
        <div className="rx-service-heading">
          <p className="rx-eyebrow">In this space</p>
          <h2>The details make it.</h2>
        </div>
        <div
          className="rx-feature-list"
          role="group"
          aria-label={`${room.title} features`}
        >
          {room.features.map((feature, index) => (
            <button
              type="button"
              key={feature.id}
              aria-pressed={selected?.id === feature.id}
              aria-controls={detailId}
              onClick={() => selectFeature(feature)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {feature.title}
              <ArrowUpRight size={18} aria-hidden="true" />
            </button>
          ))}
        </div>
        {selected && (
          <div className="rx-detail" id={detailId} aria-live="polite">
            <h3>{selected.title}</h3>
            <p>{selected.description}</p>
            {selected.projectHref && (
              <Link href={selected.projectHref}>
                See related project{" "}
                <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            )}
          </div>
        )}
        <p className="rx-concept-note">
          An imagined interior inspired by Reliant’s residential work. Explore
          real project photography in the portfolio.
        </p>
      </aside>
      <noscript>
        <section className="rx-static-details" aria-label="All room services">
          <h2>Explore every room</h2>
          <div className="rx-static-rooms">
            {rooms.map((item) => (
              <section key={item.id}>
                <h3>{item.title}</h3>
                {item.features.map((feature) => (
                  <div className="rx-static-feature" key={feature.id}>
                    <h4>{feature.title}</h4>
                    <p>{feature.description}</p>
                    {feature.projectHref && (
                      <Link href={feature.projectHref}>
                        See related project
                      </Link>
                    )}
                  </div>
                ))}
              </section>
            ))}
          </div>
        </section>
      </noscript>
    </section>
  );
}
