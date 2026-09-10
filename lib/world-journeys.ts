import type { Division, Project } from "./types";
import type { WorldScene } from "@/components/world/world-types";

export interface JourneyFeature {
  id: string;
  title: string;
  description: string;
  x: number;
  y: number;
  project?: Project;
}
export interface JourneyChapter {
  id: string;
  label: string;
  title: string;
  description: string;
  scene: WorldScene;
  provenance: string;
  features: JourneyFeature[];
  project?: Project;
}

/** The showhome illustrates services. Case-study evidence always comes from published records. */
export function getWorldJourney(
  division: Division,
  projects: Project[],
): JourneyChapter[] {
  const find = (slug: string) =>
    projects.find((p) => p.published && p.slug === slug);
  const feature = (
    id: string,
    title: string,
    description: string,
    x: number,
    y: number,
    project?: Project,
  ): JourneyFeature => ({ id, title, description, x, y, project });
  if (division === "residential") {
    const apartment = find("upper-west-side-apartment");
    const kitchen = find("plainview-kitchen");
    const bath = find("tribeca-apartment");
    const basement = find("hicksville-basement");
    const exterior = find("kings-park-exterior");
    const chapters: JourneyChapter[] = [
      {
        id: "entry",
        label: "Welcome",
        title: "A home, considered as a whole.",
        description:
          "Explore the rooms, materials and details behind a complete renovation. Choose a room or follow the journey through our residential work.",
        scene: {
          id: "residential-entry",
          image: "/images/experience/residential-entry.webp",
          alt: "Interior concept looking through timber joinery into a furnished living room and kitchen",
          position: "52% 50%",
        },
        provenance: "Illustrative interior concept",
        project: apartment,
        features: [
          feature(
            "doors",
            "Doors & millwork",
            "Custom interior doors, fitted millwork and carefully finished transitions make the rooms feel connected.",
            24,
            52,
            apartment,
          ),
          feature(
            "flooring",
            "Hardwood & finishes",
            "Hardwood flooring, baseboards, painting and finish carpentry are coordinated throughout a complete apartment renovation.",
            48,
            87,
            apartment,
          ),
        ],
      },
      {
        id: "living",
        label: "Living",
        title: "Room for everyday living.",
        description:
          "Storage, flooring and finish work belong to the same conversation. Explore the details that bring a living space together.",
        scene: {
          id: "residential-living",
          image: "/images/experience/living-panorama.webp",
          alt: "Imagined living room with fitted oak cabinetry, pale upholstery and hardwood flooring",
          position: "50% 52%",
        },
        provenance: "Illustrative interior concept",
        project: apartment,
        features: [
          feature(
            "built-ins",
            "Fitted cabinetry",
            "Custom cabinetry and built-ins make useful space feel like part of the architecture. See the millwork in our completed Upper West Side renovation.",
            50,
            49,
            apartment,
          ),
          feature(
            "wall-finish",
            "Walls, ceilings & finish",
            "Preparation, painting, lighting coordination and trim are managed together from the first construction work through closeout.",
            49,
            22,
            apartment,
          ),
        ],
      },
      {
        id: "kitchen",
        label: "Kitchen",
        title: "The heart of the home.",
        description:
          "An open layout, cabinetry that fits, and surfaces finished with care. Move closer to the work behind a complete kitchen renovation.",
        scene: {
          id: "residential-kitchen",
          image: "/images/experience/kitchen-panorama.webp",
          alt: "Imagined kitchen with natural oak cabinetry, pale stone surfaces and an island",
          position: "45% 53%",
        },
        provenance: "Illustrative interior concept",
        project: kitchen,
        features: [
          feature(
            "cabinetry",
            "Kitchen cabinetry",
            "Custom cabinetry, coordinated layouts and careful installation bring the kitchen together. Our Plainview project combines a kitchen renovation with an open-concept layout.",
            32,
            69,
            kitchen,
          ),
          feature(
            "surfaces",
            "Surfaces & junctions",
            "Counters, backsplash, cabinetry and hardware meet in details that deserve careful installation and finishing.",
            56,
            61,
            apartment,
          ),
        ],
      },
      {
        id: "bathroom",
        label: "Bathroom",
        title: "Care in every detail.",
        description:
          "Tile, fixtures and cabinetry come together in a room that works beautifully. Discover the services behind a complete bathroom renovation.",
        scene: {
          id: "residential-bathroom",
          image: "/images/experience/bathroom-panorama.webp",
          alt: "Imagined bathroom with a fluted oak vanity, brass fixtures and tiled shower",
          position: "48% 54%",
        },
        provenance: "Illustrative interior concept",
        project: bath,
        features: [
          feature(
            "tile",
            "Tile & bathroom finishes",
            "Tile installation, fixtures and surface finishes are coordinated as part of the overall renovation, with attention to the transitions between materials.",
            19,
            46,
            bath,
          ),
          feature(
            "vanity",
            "Vanities & carpentry",
            "Vanity installation and fitted carpentry bring practical storage into the room. Explore the completed bathroom work in our Tribeca project.",
            50,
            73,
            bath,
          ),
        ],
      },
    ];
    if (basement?.images[0])
      chapters.push({
        id: "basement",
        label: "Basement",
        title: "More room to make your own.",
        description:
          "New layouts, framing, ceilings, lighting, flooring and trim turn an existing basement into finished living space.",
        scene: {
          id: "residential-basement",
          image: basement.images[0].src,
          alt: basement.images[0].alt,
        },
        provenance: `Completed project · ${basement.title}`,
        project: basement,
        features: [
          feature(
            "basement-finish",
            "Complete basement renovation",
            basement.description,
            62,
            55,
            basement,
          ),
        ],
      });
    if (exterior?.images[0])
      chapters.push({
        id: "exterior",
        label: "Exterior",
        title: "A considered exterior, too.",
        description:
          "Siding, windows, stone finishes and trim transform the outside of a home with the same attention given to the rooms within.",
        scene: {
          id: "residential-exterior",
          image: exterior.images[0].src,
          alt: exterior.images[0].alt,
        },
        provenance: `Completed project · ${exterior.title}`,
        project: exterior,
        features: [
          feature(
            "exterior-finish",
            "Exterior transformations",
            exterior.description,
            63,
            46,
            exterior,
          ),
        ],
      });
    return chapters;
  }
  const cane = find("raising-canes-forest-hills");
  const carpentry = find("chick-fil-a-kingston");
  const floor = find("lidl-harlem");
  const restoration = find("lidl-staten-island");
  const chapters: JourneyChapter[] = [];
  if (cane?.images[0]) {
    const cad = {
      image: "/images/experience/commercial-cad.webp",
      alt: "Illustrative shaded architectural study of the Raising Cane’s storefront and facade",
      position: "58% 45%",
    };
    chapters.push(
      {
        id: "drawing",
        label: "The drawing",
        title: "From the drawing. Into the detail.",
        description:
          "Explore the forms, materials and connections behind our commercial work. Follow this storefront from an architectural study to its completed finish.",
        scene: { id: "commercial-drawing", ...cad },
        provenance: "Illustrative architectural study",
        project: cane,
        features: [
          feature(
            "storefront-study",
            "Storefront & facade",
            "Glass, metal panels and trim must meet cleanly across the building exterior. This study introduces the actual storefront scope of our Forest Hills project.",
            56,
            65,
            cane,
          ),
        ],
      },
      {
        id: "glazing",
        label: "Glazing",
        title: "Where the building opens up.",
        description:
          "Storefront glass, framing and facade transitions are brought together through coordinated installation.",
        scene: {
          id: "commercial-glazing",
          ...cad,
          video: "/experience/commercial-transformation.mp4",
          videoTime: 1.97,
        },
        provenance: "Illustrative material visualization",
        project: cane,
        features: [
          feature(
            "glass",
            "Glass storefront installation",
            "Glazing, storefront framing and the surrounding exterior materials are coordinated at every junction.",
            61,
            61,
            cane,
          ),
        ],
      },
      {
        id: "facade",
        label: "Materials",
        title: "Every material has a meeting point.",
        description:
          "Metal and ACM panels, exterior trim and carefully finished transitions give a commercial facade its character.",
        scene: {
          id: "commercial-facade",
          ...cad,
          video: "/experience/commercial-transformation.mp4",
          videoTime: 4.15,
        },
        provenance: "Illustrative material visualization",
        project: cane,
        features: [
          feature(
            "panels",
            "Metal & ACM panels",
            "Exterior panel installation, transitions and trim form part of our documented Raising Cane’s storefront work.",
            69,
            19,
            cane,
          ),
          feature(
            "junctions",
            "Facade transitions",
            "The meeting points between glass, metal and surrounding finishes demand the same care as the larger surfaces.",
            89,
            43,
            cane,
          ),
        ],
      },
      {
        id: "finished",
        label: "Completed work",
        title: "The detail becomes the building.",
        description:
          "The completed Raising Cane’s storefront in Forest Hills. Explore real photographs and the documented scope of our work.",
        scene: {
          id: "commercial-finished",
          image: cane.images[0].src,
          alt: cane.images[0].alt,
          position: "58% 45%",
        },
        provenance: `Completed project · ${cane.title}`,
        project: cane,
        features: [
          feature(
            "completed-storefront",
            "The finished storefront",
            cane.description,
            61,
            61,
            cane,
          ),
        ],
      },
    );
  }
  if (carpentry?.images[0])
    chapters.push({
      id: "interiors",
      label: "Buildouts",
      title: "Built around your business.",
      description:
        "From framing and partitions to ceilings, drywall and finishes, commercial carpentry is coordinated as part of the bigger picture.",
      scene: {
        id: "commercial-interiors",
        image: carpentry.images[0].src,
        alt: carpentry.images[0].alt,
      },
      provenance: `Completed project · ${carpentry.title}`,
      project: carpentry,
      features: [
        feature(
          "carpentry",
          "Carpentry & interior buildout",
          carpentry.description,
          65,
          50,
          carpentry,
        ),
      ],
    });
  if (floor?.images[0])
    chapters.push({
      id: "flooring",
      label: "Flooring",
      title: "A foundation for daily use.",
      description:
        "Selective demolition, concrete preparation, grinding, sealing and polished finishes, planned around an active commercial environment.",
      scene: {
        id: "commercial-flooring",
        image: floor.images[0].src,
        alt: floor.images[0].alt,
      },
      provenance: `Completed project · ${floor.title}`,
      project: floor,
      features: [
        feature(
          "floor-work",
          "Flooring & selective demolition",
          floor.description,
          60,
          67,
          floor,
        ),
      ],
    });
  if (restoration?.images[0])
    chapters.push({
      id: "restoration",
      label: "Restoration",
      title: "Care for the building you have.",
      description:
        "Masonry, EIFS repairs and exterior finishes, with phased work and off-hours scheduling where the project requires it.",
      scene: {
        id: "commercial-restoration",
        image: restoration.images[0].src,
        alt: restoration.images[0].alt,
      },
      provenance: `Completed project · ${restoration.title}`,
      project: restoration,
      features: [
        feature(
          "restoration-work",
          "Masonry & exterior restoration",
          restoration.description,
          60,
          47,
          restoration,
        ),
      ],
    });
  return chapters;
}
