import type { Project } from "@/lib/types";
export type RoomId =
  "living" | "kitchen" | "bathroom" | "basement" | "exterior";
export interface RoomService {
  title: string;
  description: string;
  x: number;
  y: number;
  projectSlugs?: string[];
}
export interface TourRoom {
  id: RoomId;
  label: string;
  headline: string;
  description: string;
  projects: { project: Project; photo: number }[];
  services: RoomService[];
}
export function getTourRooms(projects: Project[]): TourRoom[] {
  const find = (slug: string, photo: number) => {
    const project = projects.find(
      (p) => p.published && p.division === "residential" && p.slug === slug,
    );
    return project?.images.length
      ? [{ project, photo: Math.min(photo, project.images.length - 1) }]
      : [];
  };
  const rooms: TourRoom[] = [
    {
      id: "living" as const,
      label: "Living",
      headline: "whole homes.",
      description:
        "From a new layout to the last coat of paint. A complete renovation, with every trade working together.",
      projects: [...find("upper-west-side-apartment", 5)],
      services: [
        {
          title: "Hardwood & finishing",
          description:
            "New hardwood floors, painting and the trim that brings everything together. Explore the completed Upper West Side apartment.",
          x: 55,
          y: 76,
        },
        {
          title: "Complete renovations",
          description:
            "Full apartment renovations and coordination of the trades, from preparation through the final finishes.",
          x: 72,
          y: 37,
        },
      ],
    },
    {
      id: "kitchen" as const,
      label: "Kitchen",
      headline: "kitchens.",
      description:
        "Open up the possibilities. Structural changes, custom cabinetry and a kitchen made for everyday life.",
      projects: [
        ...find("upper-west-side-apartment", 1),
        ...find("plainview-kitchen", 0),
      ],
      services: [
        {
          title: "Custom cabinetry",
          description:
            "Custom millwork kitchens, fitted cabinetry, range hoods and island details. Explore the craftsmanship in our kitchen renovations.",
          x: 73,
          y: 47,
        },
        {
          title: "Open-concept renovations",
          description:
            "In Plainview, wall removal, a structural steel header and relocated plumbing created a more open first floor.",
          x: 51,
          y: 71,
          projectSlugs: ["plainview-kitchen"],
        },
      ],
    },
    {
      id: "bathroom" as const,
      label: "Bathroom",
      headline: "bathrooms.",
      description:
        "Tile, fixtures and the details you notice every day. Explore complete bathroom renovations across our projects.",
      projects: [
        ...find("tribeca-apartment", 0),
        ...find("upper-west-side-apartment", 2),
      ],
      services: [
        {
          title: "Tile & fixtures",
          description:
            "Complete bathroom renovations with new tile, fixtures and carefully coordinated finish work.",
          x: 63,
          y: 39,
        },
        {
          title: "Carpentry & finishes",
          description:
            "Vanities, carpentry, patching and painting are coordinated with the other trades to finish the room.",
          x: 73,
          y: 68,
        },
      ],
    },
    {
      id: "basement" as const,
      label: "Basement",
      headline: "more room.",
      description:
        "Turn the space downstairs into part of your home. Framing, lighting, flooring and a completely finished interior.",
      projects: find("hicksville-basement", 0),
      services: [
        {
          title: "From framing to finish",
          description:
            "Hicksville’s basement renovation covered demolition, a new layout, framing, finished walls and ceilings.",
          x: 68,
          y: 38,
        },
        {
          title: "Lighting, floors & trim",
          description:
            "Electrical and lighting improvements, new flooring, interior doors and finish carpentry complete the space.",
          x: 58,
          y: 68,
        },
      ],
    },
    {
      id: "exterior" as const,
      label: "Exterior",
      headline: "exteriors.",
      description:
        "A new outlook for the whole home. Siding, windows, stone and the details that make the outside feel complete.",
      projects: find("kings-park-exterior", 0),
      services: [
        {
          title: "Siding & windows",
          description:
            "Removal and replacement of existing siding and windows, with interior patching and painting around the new openings.",
          x: 67,
          y: 42,
        },
        {
          title: "Stone & exterior trim",
          description:
            "Exterior stone finishes and coordinated trim bring the Kings Park transformation together.",
          x: 59,
          y: 66,
        },
      ],
    },
  ];
  return rooms
    .filter((room) => room.projects.length > 0)
    .map((room) => ({
      ...room,
      services: room.services.filter(
        (service) =>
          !service.projectSlugs ||
          room.projects.some(({ project }) =>
            service.projectSlugs!.includes(project.slug),
          ),
      ),
    }));
}
