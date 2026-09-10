export type ApartmentRoomId =
  "entry" | "living" | "kitchen" | "bedroom" | "bathroom";
export type ApartmentPoint = [number, number, number];
export type ApartmentRect = { x1: number; x2: number; z1: number; z2: number };
export const APARTMENT_EYE_HEIGHT = 1.62;
export const APARTMENT_RADIUS = 0.22;
export const apartmentRooms: {
  id: ApartmentRoomId;
  title: string;
  position: ApartmentPoint;
  target: ApartmentPoint;
  description: string;
}[] = [
  {
    id: "entry",
    title: "Entry",
    position: [0, 1.62, 4.65],
    target: [-0.6, 1.45, 0.5],
    description: "An oak-lined entry connects every room in the apartment.",
  },
  {
    id: "living",
    title: "Living room",
    position: [-1.6, 1.62, -0.6],
    target: [-4, 1.25, -4.9],
    description:
      "Custom millwork, layered lighting and continuous oak flooring.",
  },
  {
    id: "kitchen",
    title: "Kitchen",
    position: [1.15, 1.62, -2.8],
    target: [4.25, 1.2, -4.4],
    description:
      "Oak cabinetry, a stone island and carefully integrated appliances.",
  },
  {
    id: "bedroom",
    title: "Bedroom",
    position: [-2, 1.62, 3.7],
    target: [-4.35, 1.1, 2.2],
    description:
      "Soft textiles, fitted storage and a calm palette of natural materials.",
  },
  {
    id: "bathroom",
    title: "Bathroom",
    position: [2.1, 1.62, 3.6],
    target: [4.8, 1.35, 4.3],
    description:
      "A floating oak vanity, stone surfaces and a glazed walk-in shower.",
  },
];
export const apartmentInspections: typeof apartmentRooms = [
  {
    ...apartmentRooms[0],
    title: "Entry joinery",
    position: [0.15, 1.62, 3.3],
    target: [-1.1, 1.5, 2.75],
  },
  {
    ...apartmentRooms[1],
    title: "Built-in millwork",
    position: [-2.3, 1.62, -4.2],
    target: [-3.2, 1.25, -5],
  },
  {
    ...apartmentRooms[2],
    title: "Kitchen surfaces",
    position: [2.1, 1.62, -3.35],
    target: [3.1, 1.15, -4.98],
  },
  {
    ...apartmentRooms[3],
    title: "Fitted storage",
    position: [-4.5, 1.62, 4.65],
    target: [-5.5, 1.5, 4.8],
  },
  {
    ...apartmentRooms[4],
    title: "Vanity & tile",
    position: [4.1, 1.62, 4.1],
    target: [5.4, 1.05, 4.2],
  },
];
export const layout2D = {
  bounds: { x1: -6, x2: 6, z1: -5.5, z2: 5.5 },
  rooms: [
    { id: "living", x1: -6, x2: 0, z1: -5.5, z2: 1.2 },
    { id: "kitchen", x1: 0, x2: 6, z1: -5.5, z2: 1.2 },
    { id: "entry", x1: -1.1, x2: 1.1, z1: 1.2, z2: 5.5 },
    { id: "bedroom", x1: -6, x2: -1.1, z1: 1.2, z2: 5.5 },
    { id: "bathroom", x1: 1.1, x2: 6, z1: 1.2, z2: 5.5 },
  ],
  doors: [
    { from: "entry", to: "living", x1: -1.1, x2: 0, z1: 1.12, z2: 1.28 },
    { from: "entry", to: "kitchen", x1: 0.18, x2: 1.1, z1: 1.12, z2: 1.28 },
    { from: "living", to: "kitchen", x1: -0.09, x2: 0.09, z1: -3.8, z2: 1.2 },
    { from: "entry", to: "bedroom", x1: -1.18, x2: -1.02, z1: 2.7, z2: 4.1 },
    { from: "entry", to: "bathroom", x1: 1.02, x2: 1.18, z1: 2.7, z2: 4.1 },
  ],
} as const;
export const apartmentWalls: ApartmentRect[] = [
  { x1: -6.12, x2: -5.92, z1: -5.6, z2: 5.6 },
  { x1: 5.92, x2: 6.12, z1: -5.6, z2: 5.6 },
  { x1: -6, x2: 6, z1: -5.6, z2: -5.42 },
  { x1: -6, x2: 6, z1: 5.42, z2: 5.6 },
  { x1: -6, x2: -1.1, z1: 1.11, z2: 1.29 },
  { x1: 1.1, x2: 6, z1: 1.11, z2: 1.29 },
  { x1: -0.09, x2: 0.09, z1: -5.5, z2: -3.8 },
  { x1: -1.19, x2: -1.01, z1: 1.2, z2: 2.7 },
  { x1: -1.19, x2: -1.01, z1: 4.1, z2: 5.5 },
  { x1: 1.01, x2: 1.19, z1: 1.2, z2: 2.7 },
  { x1: 1.01, x2: 1.19, z1: 4.1, z2: 5.5 },
];
export const apartmentFurniture: ApartmentRect[] = [
  { x1: -5.5, x2: -2.3, z1: -2.25, z2: -1.22 }, // sofa
  { x1: -4.75, x2: -3, z1: -3.65, z2: -2.85 }, // low table
  { x1: -5.6, x2: -1, z1: -5.42, z2: -4.9 }, // millwork
  { x1: 0.5, x2: 5.7, z1: -5.42, z2: -4.65 }, // kitchen run
  { x1: 5.25, x2: 5.92, z1: -4.7, z2: 0.5 }, // tall kitchen cabinets
  { x1: 2.55, x2: 4.45, z1: -2.35, z2: -1.15 }, // island
  { x1: -5.6, x2: -3.2, z1: 1.5, z2: 4.1 }, // bed
  { x1: -5.75, x2: -5.1, z1: 4.3, z2: 5.3 }, // wardrobe
  { x1: 4.9, x2: 5.9, z1: 3.2, z2: 5.2 }, // vanity
  { x1: 3.5, x2: 5.9, z1: 1.3, z2: 2.9 }, // shower glass / wet zone
  { x1: -0.995, x2: -0.65, z1: 4.27, z2: 5.37 }, // entry console
  { x1: 2.73, x2: 3.17, z1: -0.92, z2: -0.48 }, // island stools
  { x1: 3.83, x2: 4.27, z1: -0.92, z2: -0.48 },
  { x1: -3.26, x2: -2.78, z1: 1.66, z2: 2.12 }, // bedside table
  { x1: -5.64, x2: -5.16, z1: 0.16, z2: 0.64 }, // planters
  { x1: 4.56, x2: 5.04, z1: 0.26, z2: 0.74 },
];
export const apartmentColliders = [...apartmentWalls, ...apartmentFurniture];
export function canStandAt(
  x: number,
  z: number,
  radius = APARTMENT_RADIUS,
): boolean {
  const b = layout2D.bounds;
  if (
    x < b.x1 + radius ||
    x > b.x2 - radius ||
    z < b.z1 + radius ||
    z > b.z2 - radius
  )
    return false;
  return !apartmentColliders.some(
    (r) =>
      x > r.x1 - radius &&
      x < r.x2 + radius &&
      z > r.z1 - radius &&
      z < r.z2 + radius,
  );
}
export function roomAt(x: number, z: number): ApartmentRoomId {
  if (z < 1.2) return x < 0 ? "living" : "kitchen";
  return x < -1.1 ? "bedroom" : x > 1.1 ? "bathroom" : "entry";
}
export function clearWalkLine(
  a: [number, number],
  b: [number, number],
): boolean {
  const distance = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const steps = Math.max(1, Math.ceil(distance / 0.075));
  for (let i = 0; i <= steps; i++)
    if (
      !canStandAt(
        a[0] + ((b[0] - a[0]) * i) / steps,
        a[1] + ((b[1] - a[1]) * i) / steps,
      )
    )
      return false;
  return true;
}
/** A* on the same collision field used by free walking, then visibility simplification. */
export function apartmentRoute(
  from: [number, number],
  to: [number, number],
): [number, number][] {
  if (!canStandAt(...from) || !canStandAt(...to)) return [];
  if (clearWalkLine(from, to)) return [to];
  const step = 0.2,
    nx = 61,
    nz = 56;
  const point = (i: number): [number, number] => [
    -6 + (i % nx) * step,
    -5.5 + Math.floor(i / nx) * step,
  ];
  const nearest = (p: [number, number]) => {
    let best = -1,
      dist = Infinity;
    for (let i = 0; i < nx * nz; i++) {
      const q = point(i);
      const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (d < dist && canStandAt(...q) && clearWalkLine(p, q)) {
        best = i;
        dist = d;
      }
    }
    return best;
  };
  const start = nearest(from),
    end = nearest(to);
  if (start < 0 || end < 0) return [];
  const open = new Set([start]),
    came = new Map<number, number>(),
    cost = new Map([[start, 0]]);
  const heuristic = (i: number) =>
    Math.hypot(...point(i).map((v, j) => v - point(end)[j]));
  while (open.size) {
    let current = -1,
      best = Infinity;
    for (const i of open) {
      const f = (cost.get(i) ?? Infinity) + heuristic(i);
      if (f < best) {
        current = i;
        best = f;
      }
    }
    if (current === end) {
      const route: [number, number][] = [to];
      let at = end;
      while (at !== start) {
        route.unshift(point(at));
        at = came.get(at)!;
      }
      route.unshift(point(start));
      const simplified: [number, number][] = [];
      let anchor = from;
      for (let i = 0; i < route.length; i++) {
        if (i === route.length - 1 || !clearWalkLine(anchor, route[i + 1])) {
          simplified.push(route[i]);
          anchor = route[i];
        }
      }
      return simplified;
    }
    open.delete(current);
    const cx = current % nx,
      cz = Math.floor(current / nx);
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ]) {
      const x = cx + dx,
        z = cz + dz;
      if (x < 0 || x >= nx || z < 0 || z >= nz) continue;
      const next = z * nx + x;
      if (!clearWalkLine(point(current), point(next))) continue;
      const nextCost = (cost.get(current) ?? 0) + Math.hypot(dx, dz) * step;
      if (nextCost < (cost.get(next) ?? Infinity)) {
        came.set(next, current);
        cost.set(next, nextCost);
        open.add(next);
      }
    }
  }
  return [];
}
