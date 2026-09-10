import type { ExperienceRoom } from "@/components/experience/room-explorer";
import type { CommercialSequenceStage } from "@/components/experience/commercial-sequence";
import type { Project } from "./types";

export const experienceMedia = {
  commercialVideo: "/experience/commercial-transformation.mp4",
  commercialPoster: "/images/experience/commercial-cad.webp",
} as const;

export const commercialStages: CommercialSequenceStage[] = [
  {
    id: "drawing",
    title: "The drawing",
    description:
      "An architectural interpretation of the storefront establishes its forms, proportions and connections.",
    at: 0,
  },
  {
    id: "storefront",
    title: "Storefront & glazing",
    description:
      "Glass storefront installation and careful coordination of the facade transitions.",
    at: 0.3,
  },
  {
    id: "facade",
    title: "Facade & finish",
    description:
      "Metal and ACM panels, exterior trim and the details that connect each material.",
    at: 0.63,
  },
  {
    id: "complete",
    title: "The finished project",
    description:
      "The Raising Cane’s storefront and exterior facade in Forest Hills. Explore the real project photography and Reliant’s documented scope.",
    at: 0.96,
  },
];

export interface CommercialExperienceContent {
  videoSrc: string;
  poster: string;
  finishedImage: string;
  projectTitle: string;
  projectHref: string;
  stages: CommercialSequenceStage[];
}

/** Generated reference media is shown only while its real source project is published. */
export function getCommercialExperience(
  projects: Project[],
): CommercialExperienceContent | null {
  const project = projects.find(
    (item) =>
      item.published &&
      item.division === "commercial" &&
      item.slug === "raising-canes-forest-hills",
  );
  if (!project?.images[0]) return null;
  return {
    videoSrc: experienceMedia.commercialVideo,
    poster: experienceMedia.commercialPoster,
    finishedImage: project.images[0].src,
    projectTitle: project.title,
    projectHref: `/projects/${project.slug}`,
    stages: commercialStages,
  };
}

/** Pure, serializable content shared by the home and residential journeys. */
export function getExperienceRooms(projects: Project[]): ExperienceRoom[] {
  const published = projects.filter(
    (project) => project.published && project.division === "residential",
  );
  const apartment = published.find(
    (project) => project.slug === "upper-west-side-apartment",
  );
  const bath = published.find(
    (project) => project.slug === "tribeca-apartment",
  );
  const kitchen = published.find(
    (project) => project.slug === "plainview-kitchen",
  );
  const projectHref = (slug: string | undefined, fallback: string) =>
    slug ? `/projects/${slug}` : fallback;
  return [
    {
      id: "living",
      title: "Living room",
      panorama: "/images/experience/living-panorama.webp",
      poster: "/images/experience/living-panorama.webp",
      posterAlt:
        "Imagined living room with oak built-ins, pale upholstery and carefully finished flooring",
      horizontalFov: 180,
      verticalFov: 100,
      features: [
        {
          id: "millwork",
          title: "Built-ins & finish carpentry",
          description:
            "Storage that feels part of the room. Explore the custom millwork, built-ins and finish carpentry in our residential work.",
          yaw: 0,
          pitch: 2,
          projectHref: projectHref(
            apartment?.slug,
            "/projects?type=residential",
          ),
        },
        {
          id: "flooring",
          title: "Flooring that connects the space",
          description:
            "Flooring, baseboards and clean transitions bring a consistent finish from one area of a home to the next.",
          yaw: -25,
          pitch: -34,
          projectHref: projectHref(
            apartment?.slug,
            "/projects?type=residential",
          ),
        },
        {
          id: "lighting",
          title: "Walls, ceilings & lighting",
          description:
            "Carefully coordinated walls, ceilings and lighting help a renovated room feel complete.",
          yaw: 10,
          pitch: 30,
          projectHref: "/residential#division-services",
        },
      ],
    },
    {
      id: "kitchen",
      title: "Kitchen",
      panorama: "/images/experience/kitchen-panorama.webp",
      poster: "/images/experience/kitchen-panorama.webp",
      posterAlt:
        "Imagined oak and stone kitchen with integrated storage and warm lighting",
      horizontalFov: 180,
      verticalFov: 100,
      features: [
        {
          id: "cabinets",
          title: "Kitchens & cabinetry",
          description:
            "A practical layout, carefully fitted cabinetry and coordinated finishes, brought together through a complete kitchen renovation.",
          yaw: -27,
          pitch: 0,
          projectHref: projectHref(kitchen?.slug, "/projects?type=residential"),
        },
        {
          id: "surfaces",
          title: "Countertops & backsplash",
          description:
            "Material choices become a finished space through precise installation and careful attention to the junctions between surfaces.",
          yaw: -30,
          pitch: -12,
          projectHref: projectHref(
            apartment?.slug,
            "/projects?type=residential",
          ),
        },
        {
          id: "details",
          title: "Coordinated finishing details",
          description:
            "Lighting, hardware, trim and finish work are considered together as part of the overall renovation.",
          yaw: 18,
          pitch: 23,
          projectHref: projectHref(kitchen?.slug, "/projects?type=residential"),
        },
      ],
    },
    {
      id: "bathroom",
      title: "Bathroom",
      panorama: "/images/experience/bathroom-panorama.webp",
      poster: "/images/experience/bathroom-panorama.webp",
      posterAlt:
        "Imagined bathroom with fluted oak vanity, brass fittings and a tiled shower",
      horizontalFov: 180,
      verticalFov: 100,
      features: [
        {
          id: "vanity",
          title: "Bathroom renovations",
          description:
            "Vanities, fixtures and finishes work together in a bathroom that feels considered from the layout through the last detail.",
          yaw: 0,
          pitch: -12,
          projectHref: projectHref(bath?.slug, "/projects?type=residential"),
        },
        {
          id: "tile",
          title: "Tile & surface finishes",
          description:
            "Explore tile, stone and the finish details that give a bathroom its character.",
          yaw: -48,
          pitch: 2,
          projectHref: projectHref(bath?.slug, "/projects?type=residential"),
        },
        {
          id: "bath-light",
          title: "Lighting & final details",
          description:
            "Coordinating fittings, electrical work and the final finish is part of bringing the room together.",
          yaw: 5,
          pitch: 20,
          projectHref: projectHref(bath?.slug, "/projects?type=residential"),
        },
      ],
    },
  ];
}
