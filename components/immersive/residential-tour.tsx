"use client";

import Image from "next/image";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ArrowsOut,
  Compass,
  GridFour,
  Plus,
  X,
} from "@phosphor-icons/react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import type { Project } from "@/lib/types";
import type { TourRoom } from "./residential-content";
import "./residential-tour.css";

const roomPaths: Record<string, string> = {
  living: "M8 8h79v47H63v30H8Z",
  kitchen: "M93 8h73v47H93Z",
  bathroom: "M112 61h54v53h-54Z",
  basement: "M8 94h79v40H8Z",
  exterior: "M8 143h158v18H8Z",
};
const roomPoints: Record<string, [number, number]> = {
  living: [43, 42],
  kitchen: [130, 32],
  bathroom: [138, 87],
  basement: [46, 113],
  exterior: [87, 152],
};

export function ResidentialTour({
  rooms,
  projects,
  initialRoom,
  initialProject,
}: {
  rooms: TourRoom[];
  projects: Project[];
  initialRoom?: string;
  initialProject?: string;
}) {
  const firstRoom = rooms.find((r) => r.id === initialRoom) || rooms[0];
  const [roomId, setRoomId] = useState(firstRoom?.id);
  const [projectId, setProjectId] = useState(
    initialProject || firstRoom?.projects[0]?.project.slug,
  );
  const [service, setService] = useState<number | null>(null);
  const [indexOpen, setIndexOpen] = useState(false);
  const [loadedKey, setLoadedKey] = useState("");
  const [previous, setPrevious] = useState<{ src: string; alt: string } | null>(
    null,
  );
  const [lookMode, setLookMode] = useState(false);
  const [view, setView] = useState({ x: 50, y: 50 });
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    x: number;
    y: number;
    viewX: number;
    viewY: number;
  } | null>(null);
  const room = rooms.find((r) => r.id === roomId) || rooms[0];
  const selected =
    room?.projects.find((p) => p.project.slug === projectId) ||
    room?.projects[0];
  const project = selected?.project;
  const photo = selected && project?.images[selected.photo];
  const sceneKey = `${room?.id}-${project?.slug}`;
  const roomIndex = rooms.findIndex((r) => r.id === room?.id);
  const nextRoom = rooms[(roomIndex + 1) % rooms.length];

  useEffect(() => {
    function restore() {
      const params = new URLSearchParams(window.location.search);
      const next = rooms.find((r) => r.id === params.get("room")) || rooms[0];
      setRoomId(next?.id);
      setProjectId(params.get("project") || next?.projects[0]?.project.slug);
      setService(null);
      setView({ x: 50, y: 50 });
    }
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [rooms]);

  if (!room || !project || !photo)
    return (
      <section className="rr-tour-empty">
        <h1>Residential renovations</h1>
        <p>Our portfolio is being updated.</p>
        <Link href="/contact?type=residential">
          Tell us about your home <ArrowUpRight />
        </Link>
      </section>
    );

  function goTo(next: TourRoom, slug = next.projects[0].project.slug) {
    if (photo) setPrevious(photo);
    setRoomId(next.id);
    setProjectId(slug);
    setService(null);
    setLookMode(false);
    setView({ x: 50, y: 50 });
    const url = new URL(window.location.href);
    url.searchParams.set("room", next.id);
    url.searchParams.set("project", slug);
    window.history.pushState(null, "", url);
  }
  function followRoom(
    event: React.MouseEvent<HTMLAnchorElement>,
    next: TourRoom,
  ) {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    )
      return;
    event.preventDefault();
    goTo(next);
  }
  function moveView(event: PointerEvent<HTMLDivElement>) {
    if (lookMode && drag.current) {
      const bounds = event.currentTarget.getBoundingClientRect();
      const x =
        drag.current.viewX -
        ((event.clientX - drag.current.x) / bounds.width) * 150;
      const y =
        drag.current.viewY -
        ((event.clientY - drag.current.y) / bounds.height) * 90;
      setView({
        x: Math.max(5, Math.min(95, x)),
        y: Math.max(5, Math.min(95, y)),
      });
    }
  }
  const style = {
    "--rr-view-x": `${view.x}%`,
    "--rr-view-y": `${view.y}%`,
  } as CSSProperties;
  return (
    <section
      className={`rr-tour${lookMode ? " rr-tour-looking" : ""}`}
      aria-label="Residential room tour"
      style={style}
    >
      <div
        className="rr-tour-scene"
        ref={stageRef}
        onPointerMove={moveView}
        onPointerDown={(event) => {
          if (!lookMode) return;
          drag.current = {
            x: event.clientX,
            y: event.clientY,
            viewX: view.x,
            viewY: view.y,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        {previous && (
          <div className="rr-tour-photo rr-tour-photo-previous">
            <Image src={previous.src} alt="" fill sizes="100vw" />
          </div>
        )}
        <div
          key={sceneKey}
          className={`rr-tour-photo rr-tour-photo-current${loadedKey === sceneKey ? " is-ready" : ""}`}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="100vw"
            loading="eager"
            fetchPriority="high"
            onLoad={() => setLoadedKey(sceneKey)}
            onError={() => setLoadedKey(sceneKey)}
          />
        </div>
      </div>
      <div className="rr-tour-shade" aria-hidden="true" />
      <div className="rr-tour-topline">
        <p>
          <span className="rr-status-dot" /> The residential experience
        </p>
        <Dialog.Root open={indexOpen} onOpenChange={setIndexOpen}>
          <Dialog.Trigger className="rr-tour-index-button">
            <GridFour size={17} /> All {projects.length} residential projects
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="rr-drawer-shade" />
            <Dialog.Content className="rr-project-drawer">
              <div className="rr-drawer-heading">
                <div>
                  <p className="rr-eyebrow">The residential portfolio</p>
                  <Dialog.Title>
                    Different homes.
                    <br />
                    The same care.
                  </Dialog.Title>
                </div>
                <Dialog.Close
                  className="rr-icon-button"
                  aria-label="Close project index"
                >
                  <X size={25} />
                </Dialog.Close>
              </div>
              <Dialog.Description>
                Explore every residential project, with the full scope and
                original photographs.
              </Dialog.Description>
              <div className="rr-project-drawer-grid">
                {projects.map((p, index) => (
                  <Link href={`/projects/${p.slug}`} key={p.id}>
                    <div>
                      {p.images[0] && (
                        <Image
                          src={p.images[0].src}
                          alt={p.images[0].alt}
                          fill
                          sizes="(max-width:700px) 80vw, 30vw"
                        />
                      )}
                    </div>
                    <p>
                      <span>
                        0{index + 1} / {p.location}
                      </span>
                      <ArrowUpRight size={19} />
                    </p>
                    <h3>{p.title}</h3>
                  </Link>
                ))}
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
      <div className="rr-tour-copy" key={room.id}>
        <p className="rr-eyebrow">
          Explore by room · {String(roomIndex + 1).padStart(2, "0")} /{" "}
          {String(rooms.length).padStart(2, "0")}
        </p>
        <h1>
          We do
          <br />
          <span>{room.headline}</span>
        </h1>
        <p className="rr-tour-description">{room.description}</p>
        <Link href="/contact?type=residential" className="rr-tour-contact">
          Let’s talk about your home{" "}
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </div>
      {!lookMode && (
        <div
          className="rr-tour-hotspots"
          aria-label="Explore services in this room"
        >
          {room.services.map((feature, index) => (
            <Dialog.Root
              key={`${room.id}-${index}`}
              open={service === index}
              onOpenChange={(open) => setService(open ? index : null)}
            >
              <Dialog.Trigger
                className="rr-hotspot"
                style={{ left: `${feature.x}%`, top: `${feature.y}%` }}
                aria-label={`Explore ${feature.title}`}
              >
                <span className="rr-hotspot-ring">
                  <Plus size={19} aria-hidden="true" />
                </span>
                <span>{feature.title}</span>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="rr-service-shade" />
                <Dialog.Content className="rr-service-panel">
                  <Dialog.Close
                    className="rr-icon-button rr-service-close"
                    aria-label="Close service details"
                  >
                    <X size={22} />
                  </Dialog.Close>
                  <p className="rr-eyebrow">
                    Inside the {room.label.toLowerCase()}
                  </p>
                  <Dialog.Title>{feature.title}</Dialog.Title>
                  <Dialog.Description>{feature.description}</Dialog.Description>
                  <p className="rr-service-proof-label">See it in our work</p>
                  {room.projects
                    .filter(
                      ({ project: p }) =>
                        !feature.projectSlugs ||
                        feature.projectSlugs.includes(p.slug),
                    )
                    .map(({ project: p }) => (
                      <Link
                        href={`/projects/${p.slug}`}
                        className="rr-service-proof"
                        key={p.id}
                      >
                        <span>{p.title}</span>
                        <ArrowUpRight size={22} aria-hidden="true" />
                      </Link>
                    ))}
                  <Link
                    href="/contact?type=residential"
                    className="rr-service-enquire"
                  >
                    Plan something like this <ArrowRight size={18} />
                  </Link>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          ))}
        </div>
      )}
      <div className="rr-tour-view-controls">
        <button
          className="rr-view-toggle"
          aria-pressed={lookMode}
          onClick={() => {
            setLookMode(!lookMode);
            setView({ x: 50, y: 50 });
          }}
        >
          <Compass size={20} /> {lookMode ? "Finish looking" : "Look closer"}
        </button>
        {lookMode && (
          <div className="rr-look-controls">
            <span>Drag to explore the photograph</span>
            <button
              aria-label="Look left"
              onClick={() =>
                setView((v) => ({ ...v, x: Math.max(5, v.x - 20) }))
              }
            >
              <ArrowLeft size={18} />
            </button>
            <button
              aria-label="Look right"
              onClick={() =>
                setView((v) => ({ ...v, x: Math.min(95, v.x + 20) }))
              }
            >
              <ArrowRight size={18} />
            </button>
          </div>
        )}
        <Link
          href={`/projects/${project.slug}?photo=${selected.photo + 1}`}
          className="rr-view-full"
        >
          <ArrowsOut size={17} aria-hidden="true" /> Full photograph
        </Link>
      </div>
      <div className="rr-tour-caption">
        <span className="rr-caption-line" />
        <div>
          <span>You’re looking at</span>
          <Link href={`/projects/${project.slug}`}>
            {project.title} <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
      <div className="rr-tour-bottom">
        <div className="rr-room-guide">
          <svg
            viewBox="0 0 176 170"
            role="img"
            aria-label={`Room guide: ${room.label} selected`}
          >
            <g fill="none" stroke="currentColor" strokeWidth="1.4">
              {rooms.map((r) => (
                <path
                  key={r.id}
                  d={roomPaths[r.id]}
                  className={r.id === room.id ? "is-current" : ""}
                />
              ))}
              <path d="M89 57v82M90 87h19" strokeDasharray="2 4" />
            </g>
            <circle
              cx={roomPoints[room.id][0]}
              cy={roomPoints[room.id][1]}
              r="4"
              fill="#7ca6ff"
            />
          </svg>
          <span>Room guide</span>
        </div>
        <div className="rr-room-navigation">
          <div className="rr-room-navigation-label">
            <span>Move through the home</span>
            <span>Choose a room to explore</span>
          </div>
          <nav aria-label="Rooms and services">
            {rooms.map((r, i) => (
              <a
                href={`/residential?room=${r.id}`}
                key={r.id}
                aria-current={r.id === room.id ? "step" : undefined}
                onClick={(event) => followRoom(event, r)}
              >
                <span>0{i + 1}</span>
                {r.label}
                <span className="rr-room-progress" />
              </a>
            ))}
          </nav>
        </div>
        <a
          className="rr-next-room"
          href={`/residential?room=${nextRoom.id}`}
          onClick={(event) => followRoom(event, nextRoom)}
        >
          <span>
            Continue to
            <br />
            <strong>{nextRoom.label}</strong>
          </span>
          <ArrowRight size={25} aria-hidden="true" />
        </a>
      </div>
      <div className="rr-room-projects">
        <span>
          {room.projects.length > 1
            ? "More than one way to make it yours"
            : "Explore this project"}
        </span>
        <div>
          {room.projects.map(({ project: p }, i) => (
            <button
              key={p.id}
              aria-pressed={p.slug === project.slug}
              onClick={() => goTo(room, p.slug)}
            >
              <span>0{i + 1}</span>
              {p.location}
              <ArrowUpRight size={14} aria-hidden="true" />
            </button>
          ))}
        </div>
        <Link href={`/projects/${project.slug}`}>
          View the full project <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
      <p className="sr-only" role="status">
        {room.label}. Showing {project.title}. {room.projects.length} related{" "}
        {room.projects.length === 1 ? "project" : "projects"}.
      </p>
      <noscript>
        <style>{`.rr-tour-photo-current{opacity:1;transform:none}.rr-tour{height:auto;overflow:visible}.rr-tour-hotspots,.rr-tour-view-controls,.rr-tour-index-button,.rr-room-projects button{display:none}`}</style>
        <div className="rr-tour-nojs">
          <p>Explore our residential projects</p>
          {projects.map((p) => (
            <Link href={`/projects/${p.slug}`} key={p.id}>
              {p.title}
            </Link>
          ))}
        </div>
      </noscript>
    </section>
  );
}
