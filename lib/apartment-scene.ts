import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import {
  apartmentRooms,
  apartmentInspections,
  apartmentWalls,
  apartmentRoute,
  canStandAt,
  roomAt,
  APARTMENT_EYE_HEIGHT,
  type ApartmentRoomId,
} from "./apartment-layout";

export interface ApartmentScene {
  goTo: (id: ApartmentRoomId, instant?: boolean) => void;
  inspect: (id: ApartmentRoomId, instant?: boolean) => void;
  setExploring: (free: boolean) => void;
  move: (
    direction: "forward" | "back" | "left" | "right",
    active: boolean,
  ) => void;
  look: (dx: number, dy: number) => void;
  resize: () => void;
  dispose: () => void;
  getPosition: () => [number, number, number];
}
type Callbacks = {
  onRoomChange: (id: ApartmentRoomId) => void;
  onMoveStart?: () => void;
  onReady?: () => void;
  onError?: (message: string) => void;
};
type V3 = [number, number, number];

/** One authored, connected apartment. Static geometry is merged by material. */
export async function createApartmentScene(
  host: HTMLElement,
  callbacks: Callbacks,
): Promise<ApartmentScene> {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.domElement.className = "apartment-canvas";
  renderer.domElement.style.cssText = "display:block;width:100%;height:100%";
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#c4d6df");
  const camera = new THREE.PerspectiveCamera(62, 1, 0.055, 70);
  camera.rotation.order = "YXZ";
  const geometries = new Set<THREE.BufferGeometry>(),
    materials = new Set<THREE.Material>(),
    textures = new Set<THREE.Texture>();
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const rng = (() => {
    let s = 973;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  })();
  function texture(kind: "wood" | "floor" | "fabric" | "stone" | "tile") {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const c = canvas.getContext("2d")!;
    const base =
      kind === "wood"
        ? [169, 133, 94]
        : kind === "floor"
          ? [179, 151, 113]
          : kind === "fabric"
            ? [204, 198, 182]
            : kind === "tile"
              ? [208, 213, 206]
              : [233, 232, 220];
    const data = c.createImageData(512, 512);
    for (let y = 0; y < 512; y++)
      for (let x = 0; x < 512; x++) {
        const grain =
          kind === "wood" || kind === "floor"
            ? Math.sin(x * 0.7 + Math.sin(y * 0.013) * 2) * 5 +
              Math.sin(x * 0.051) * 7
            : Math.sin(x * 2) * 1.5;
        const noise = (rng() - 0.5) * (kind === "fabric" ? 28 : 8),
          i = (y * 512 + x) * 4;
        for (let k = 0; k < 3; k++) data.data[i + k] = base[k] + grain + noise;
        data.data[i + 3] = 255;
      }
    c.putImageData(data, 0, 0);
    if (kind === "floor") {
      for (let x = 0; x < 512; x += 64) {
        c.fillStyle = `rgba(55,39,20,${0.025 + rng() * 0.09})`;
        c.fillRect(x, 0, 64, 512);
        c.strokeStyle = "#897455";
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x, 512);
        c.stroke();
        const y = (x * 3.4) % 512;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + 64, y);
        c.stroke();
      }
    }
    if (kind === "tile") {
      c.strokeStyle = "#acb3aa";
      c.lineWidth = 2;
      for (let i = 0; i <= 512; i += 128) {
        c.beginPath();
        c.moveTo(i, 0);
        c.lineTo(i, 512);
        c.moveTo(0, i);
        c.lineTo(512, i);
        c.stroke();
      }
    }
    if (kind === "stone") {
      for (let i = 0; i < 6; i++) {
        c.strokeStyle = "rgba(114,119,105,.13)";
        c.lineWidth = 0.5 + rng();
        c.beginPath();
        let x = rng() * 512;
        c.moveTo(x, 0);
        for (let y = 0; y < 512; y += 12) {
          x += (rng() - 0.45) * 16;
          c.lineTo(x, y);
        }
        c.stroke();
      }
    }
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    textures.add(t);
    return t;
  }
  let woodMap: THREE.Texture = texture("wood"),
    floorMap: THREE.Texture = texture("floor");
  const fabricMap = texture("fabric"),
    stoneMap = texture("stone"),
    tileMap = texture("tile");
  let woodNormal: THREE.Texture | undefined,
    woodRoughness: THREE.Texture | undefined,
    veneerNormal: THREE.Texture | undefined,
    veneerRoughness: THREE.Texture | undefined;
  try {
    const loader = new THREE.TextureLoader();
    const maps = await Promise.all(
      ["wood", "veneer"].flatMap((name) =>
        ["color", "normal", "roughness"].map((kind) =>
          loader.loadAsync(`/experience/apartment/${name}-${kind}.webp`),
        ),
      ),
    );
    maps.forEach((map) => {
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      textures.add(map);
    });
    floorMap = maps[0];
    floorMap.colorSpace = THREE.SRGBColorSpace;
    woodMap = maps[3];
    woodMap.colorSpace = THREE.SRGBColorSpace;
    veneerNormal = maps[4];
    veneerRoughness = maps[5];
    woodNormal = maps[1];
    woodRoughness = maps[2];
    woodNormal.repeat.set(4, 3.5);
    woodRoughness.repeat.set(4, 3.5);
  } catch {
    /* Self-contained procedural materials remain usable if a texture fails. */
  }
  floorMap.repeat.set(4, 3.5);
  tileMap.repeat.set(2, 2);
  function mat(
    color: string,
    roughness = 0.7,
    extra: THREE.MeshStandardMaterialParameters = {},
  ) {
    const m = new THREE.MeshStandardMaterial({ color, roughness, ...extra });
    materials.add(m);
    return m;
  }
  const plaster = mat("#eeeae1", 0.95),
    trim = mat("#f6f3eb", 0.55),
    oak = mat("#ffffff", 0.65, {
      map: woodMap,
      normalMap: veneerNormal,
      normalScale: new THREE.Vector2(0.18, 0.18),
      roughnessMap: veneerRoughness,
    }),
    floor = mat("#ffffff", 0.65, {
      map: floorMap,
      normalMap: woodNormal,
      normalScale: new THREE.Vector2(0.35, 0.35),
      roughnessMap: woodRoughness,
    }),
    darkOak = mat("#756048", 0.65, { map: woodMap });
  const linen = mat("#ffffff", 0.97, {
      map: fabricMap,
      bumpMap: fabricMap,
      bumpScale: 0.008,
    }),
    cream = mat("#e8e0cb", 0.92, {
      map: fabricMap,
      bumpMap: fabricMap,
      bumpScale: 0.008,
    }),
    sage = mat("#637263", 0.95, {
      map: fabricMap,
      bumpMap: fabricMap,
      bumpScale: 0.008,
    }),
    coal = mat("#26302c", 0.6),
    stone = mat("#ffffff", 0.3, { map: stoneMap }),
    tile = mat("#ffffff", 0.5, { map: tileMap });
  const brass = mat("#a69059", 0.27, { metalness: 0.72 }),
    steel = mat("#666e70", 0.26, { metalness: 0.8 }),
    black = mat("#151b1c", 0.22, { metalness: 0.25 }),
    ceramic = mat("#efeee7", 0.25),
    leaf = mat("#4d6451", 0.8);
  const light = mat("#fff2d4", 0.3, {
    emissive: "#ffe6ba",
    emissiveIntensity: 2.2,
  });
  const glass = mat("#bed2d5", 0.13, {
    metalness: 0.2,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  function add(
    g: THREE.BufferGeometry,
    m: THREE.Material,
    p: V3,
    r: V3 = [0, 0, 0],
  ) {
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(...p),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)),
      new THREE.Vector3(1, 1, 1),
    );
    const transformed = g.index ? g.toNonIndexed() : g;
    transformed.applyMatrix4(matrix);
    if (g !== transformed) g.dispose();
    const list = batches.get(m) || [];
    list.push(transformed);
    batches.set(m, list);
  }
  function box(
    w: number,
    h: number,
    d: number,
    p: V3,
    m: THREE.Material,
    r: V3 = [0, 0, 0],
    round = 0,
  ) {
    add(
      round
        ? new RoundedBoxGeometry(w, h, d, 2, round)
        : new THREE.BoxGeometry(w, h, d),
      m,
      p,
      r,
    );
  }
  function cyl(
    rt: number,
    rb: number,
    h: number,
    p: V3,
    m: THREE.Material,
    r: V3 = [0, 0, 0],
    segments = 24,
  ) {
    add(new THREE.CylinderGeometry(rt, rb, h, segments), m, p, r);
  }
  function ball(size: V3, p: V3, m: THREE.Material, r: V3 = [0, 0, 0]) {
    const g = new THREE.SphereGeometry(1, 16, 10);
    g.scale(...size);
    add(g, m, p, r);
  }
  function tube(points: V3[], radius: number, m: THREE.Material) {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
    );
    add(new THREE.TubeGeometry(curve, 24, radius, 8, false), m, [0, 0, 0]);
  }
  function wall(x1: number, x2: number, z1: number, z2: number) {
    box(x2 - x1, 2.9, z2 - z1, [(x1 + x2) / 2, 1.45, (z1 + z2) / 2], plaster);
    box(
      x2 - x1 + 0.018,
      0.14,
      z2 - z1 + 0.025,
      [(x1 + x2) / 2, 0.075, (z1 + z2) / 2],
      trim,
    );
    box(
      x2 - x1 + 0.02,
      0.09,
      z2 - z1 + 0.025,
      [(x1 + x2) / 2, 2.72, (z1 + z2) / 2],
      trim,
    );
  }
  // Internal walls agree exactly with collision rectangles. Outer walls have glazed openings.
  apartmentWalls.slice(4).forEach((r) => wall(r.x1, r.x2, r.z1, r.z2));
  wall(-6, 6, 5.42, 5.6);
  wall(5.92, 6.1, -5.5, 5.5);
  wall(-6.1, -5.92, 1.2, 5.5);
  for (const [z1, z2] of [
    [-5.5, -4.65],
    [-2.85, -1.35],
    [0.7, 1.2],
  ])
    wall(-6.1, -5.92, z1, z2);
  for (const [z1, z2] of [
    [-4.65, -2.85],
    [-1.35, 0.7],
  ]) {
    box(0.18, 0.75, z2 - z1, [-6, 0.375, (z1 + z2) / 2], plaster);
    box(0.18, 0.35, z2 - z1, [-6, 2.725, (z1 + z2) / 2], plaster);
    box(0.25, 0.07, z2 - z1 + 0.15, [-5.91, 0.78, (z1 + z2) / 2], stone);
    for (const z of [z1, z2, (z1 + z2) / 2])
      box(0.1, 1.85, 0.055, [-5.95, 1.67, z], trim);
    for (const y of [0.78, 1.64, 2.56])
      box(0.1, 0.055, z2 - z1, [-5.95, y, (z1 + z2) / 2], trim);
    box(0.018, 1.75, z2 - z1 - 0.05, [-6.025, 1.67, (z1 + z2) / 2], glass);
    box(
      0.2,
      3.1,
      z2 - z1 + 0.12,
      [-6.6, 1.5, (z1 + z2) / 2],
      mat("#aabfc0", 1, { emissive: "#b4cbd0", emissiveIntensity: 0.7 }),
    );
  }
  wall(-6, 1.15, -5.6, -5.42);
  wall(4.95, 6, -5.6, -5.42);
  box(3.8, 1.28, 0.18, [3.05, 0.64, -5.5], plaster);
  box(3.8, 0.25, 0.18, [3.05, 2.78, -5.5], plaster);
  for (const x of [1.15, 2.4, 3.7, 4.95])
    box(0.055, 1.4, 0.09, [x, 1.97, -5.42], trim);
  for (const y of [1.29, 2.65]) box(3.8, 0.055, 0.09, [3.05, y, -5.42], trim);
  box(3.75, 1.35, 0.025, [3.05, 1.97, -5.51], glass);
  box(
    4,
    3,
    0.2,
    [3.05, 1.8, -6.1],
    mat("#adc4c8", 1, { emissive: "#cfdddf", emissiveIntensity: 0.75 }),
  );
  // Openings, substantial oak casings and overhead beams create actual depth.
  box(0.25, 0.3, 5.05, [0, 2.75, -1.3], oak);
  box(0.3, 2.6, 0.11, [0, 1.3, -3.83], oak);
  for (const x of [-1.1, 1.1]) {
    box(0.26, 0.5, 1.45, [x, 2.65, 3.4], oak);
    for (const z of [2.68, 4.12]) box(0.26, 2.45, 0.08, [x, 1.225, z], oak);
  }
  box(2.2, 0.35, 0.24, [0, 2.725, 1.2], oak);
  // Continuous planks and a real ceiling, with stepped coves rather than a floating dollhouse.
  box(12, 0.12, 11, [0, -0.06, 0], floor);
  box(12, 0.12, 11, [0, 2.96, 0], plaster);
  for (const [x, z, w, d] of [
    [-3, -2.15, 5.65, 6.25],
    [3, -2.15, 5.65, 6.25],
    [-3.55, 3.35, 4.5, 3.9],
    [3.55, 3.35, 4.5, 3.9],
  ]) {
    for (const xx of [x - w / 2, x + w / 2]) {
      box(0.15, 0.1, d, [xx, 2.81, z], trim);
      box(
        0.025,
        0.035,
        d - 0.2,
        [xx + (xx < x ? 0.085 : -0.085), 2.85, z],
        light,
      );
    }
    for (const zz of [z - d / 2, z + d / 2])
      box(w, 0.1, 0.15, [x, 2.81, zz], trim);
  }
  // Millwork wall: thick shelves, shadow gaps, cupboards, books and ceramics.
  box(4.65, 2.62, 0.13, [-3.3, 1.31, -5.31], darkOak);
  for (let i = 0; i < 6; i++) {
    const x = -5.28 + i * 0.78;
    box(0.755, 0.72, 0.47, [x, 0.39, -5.13], oak);
    box(0.035, 0.12, 0.025, [x + 0.28, 0.58, -4.882], brass);
  }
  for (const x of [-5.65, -4.1, -2.55, -0.95])
    box(0.065, 1.83, 0.42, [x, 1.72, -5.12], oak);
  for (const y of [0.8, 1.45, 2.1, 2.64])
    box(4.76, 0.055, 0.45, [-3.3, y, -5.1], oak);
  box(1.23, 0.77, 0.035, [-3.32, 1.78, -4.88], black);
  const bookMats = [
    mat("#e0d7bf"),
    mat("#b1b5a2"),
    mat("#6d7565"),
    mat("#aaa193"),
  ];
  for (const x0 of [-5.25, -2.14])
    for (let i = 0; i < 7; i++)
      box(
        0.075,
        0.24 + rng() * 0.13,
        0.18,
        [x0 + i * 0.086, 1.64, -4.92],
        bookMats[i % 4],
        [0, 0, i === 6 ? 0.1 : 0],
      );
  for (const [x, y] of [
    [-4.9, 2.3],
    [-1.65, 0.98],
    [-5.1, 0.96],
    [-1.7, 2.3],
  ]) {
    cyl(0.09, 0.12, 0.27, [x, y, -4.98], ceramic);
    cyl(0.038, 0.06, 0.08, [x, y + 0.17, -4.98], ceramic);
  }
  // Deep upholstered living furniture; sewn seat divisions, throws and soft cushions.
  box(3.15, 0.23, 1.03, [-3.92, 0.25, -1.72], linen, [0, 0, 0], 0.08);
  box(3.16, 0.57, 0.23, [-3.92, 0.67, -1.26], linen, [0, 0, 0], 0.06);
  for (const x of [-5.4, -2.44])
    box(0.23, 0.52, 1.05, [x, 0.57, -1.72], linen, [0, 0, 0], 0.065);
  for (const x of [-4.92, -3.93, -2.94]) {
    box(0.94, 0.18, 0.76, [x, 0.46, -1.83], cream, [0, 0, 0], 0.065);
    box(0.84, 0.5, 0.15, [x, 0.79, -1.41], linen, [-0.12, 0, 0], 0.07);
  }
  box(0.52, 0.5, 0.17, [-4.98, 0.8, -1.61], sage, [-0.12, 0.15, -0.15], 0.06);
  box(0.5, 0.47, 0.18, [-2.95, 0.78, -1.59], cream, [-0.16, -0.13, 0.15], 0.06);
  box(
    0.66,
    0.055,
    0.86,
    [-5.02, 0.56, -1.91],
    mat("#938d7b", 0.96, { map: fabricMap }),
    [0, 0, -0.05],
    0.025,
  );
  box(
    4.1,
    0.018,
    3.55,
    [-3.82, 0.011, -2.8],
    mat("#bdb9a9", 1, { map: fabricMap }),
    [0, 0, 0],
    0.015,
  );
  box(1.76, 0.09, 0.82, [-3.88, 0.43, -3.23], stone, [0, 0, 0], 0.055);
  for (const x of [-4.48, -3.28])
    box(0.16, 0.36, 0.6, [x, 0.21, -3.23], darkOak);
  cyl(0.22, 0.18, 0.045, [-4.12, 0.51, -3.23], ceramic);
  box(0.34, 0.04, 0.23, [-3.6, 0.51, -3.3], bookMats[2], [0, 0.15, 0]);
  // Kitchen: panel reveals, real toe kicks, quartz overhangs, hardware and fixtures.
  box(5.2, 0.12, 0.68, [3.1, 0.09, -5.02], coal);
  for (let i = 0; i < 7; i++) {
    const x = 0.88 + i * 0.73;
    box(0.71, 0.75, 0.65, [x, 0.49, -5.02], oak);
    box(0.4, 0.023, 0.026, [x, 0.77, -4.682], brass);
  }
  box(5.25, 0.075, 0.79, [3.1, 0.915, -5.02], stone);
  box(5.2, 0.31, 0.04, [3.1, 1.1, -5.38], stone);
  box(1.02, 0.027, 0.42, [2.17, 0.96, -4.99], steel, [0, 0, 0], 0.025);
  box(0.78, 0.029, 0.28, [2.17, 0.978, -4.99], black, [0, 0, 0], 0.03);
  tube(
    [
      [2.17, 0.95, -5.22],
      [2.17, 1.29, -5.22],
      [2.17, 1.4, -5.08],
      [2.17, 1.3, -4.98],
    ],
    0.021,
    brass,
  );
  box(0.8, 0.02, 0.56, [4.1, 0.967, -5.01], black, [0, 0, 0], 0.01);
  for (const x of [3.88, 4.32])
    for (const z of [-5.16, -4.88]) {
      cyl(0.105, 0.105, 0.009, [x, 0.985, z], steel);
      cyl(0.078, 0.078, 0.01, [x, 0.993, z], black);
    }
  for (let i = 0; i < 6; i++) {
    const z = -4.22 + i * 0.76;
    box(0.62, 2.58, 0.735, [5.59, 1.35, z], i === 2 ? coal : oak);
    box(0.027, 0.33, 0.024, [5.255, 1.5, z - 0.24], brass);
  }
  box(0.026, 0.54, 0.62, [5.25, 1.23, -2.7], black);
  box(0.036, 0.03, 0.55, [5.23, 1.4, -2.7], steel);
  box(1.82, 0.82, 1.12, [3.5, 0.45, -1.75], oak);
  box(1.99, 0.085, 1.3, [3.5, 0.91, -1.75], stone, [0, 0, 0], 0.018);
  for (let i = 0; i < 18; i++)
    box(0.026, 0.75, 0.035, [2.64 + i * 0.1, 0.5, -1.171], darkOak);
  for (const x of [2.95, 4.05]) {
    cyl(0.22, 0.22, 0.085, [x, 0.67, -0.7], cream);
    for (const [dx, dz] of [
      [-0.14, -0.14],
      [0.14, -0.14],
      [-0.14, 0.14],
      [0.14, 0.14],
    ])
      cyl(0.016, 0.019, 0.62, [x + dx, 0.32, -0.7 + dz], darkOak);
  }
  for (const x of [2.95, 4.05]) {
    cyl(0.01, 0.01, 0.87, [x, 2.45, -1.75], black);
    cyl(0.11, 0.25, 0.18, [x, 1.96, -1.75], brass);
    cyl(0.18, 0.18, 0.013, [x, 1.864, -1.75], light);
  }
  cyl(0.14, 0.16, 0.24, [3.52, 1.07, -1.75], ceramic);
  cyl(0.035, 0.035, 0.05, [3.52, 1.22, -1.75], brass);
  // Bedroom with upholstered headboard, layered bedding and fitted joinery.
  box(2.4, 0.16, 2.6, [-4.4, 0.15, 2.8], darkOak, [0, 0, 0], 0.03);
  box(2.28, 0.28, 2.45, [-4.4, 0.38, 2.77], linen, [0, 0, 0], 0.1);
  box(2.52, 1.1, 0.16, [-4.4, 0.75, 1.44], oak, [0, 0, 0], 0.055);
  box(2.18, 0.11, 1.82, [-4.4, 0.57, 3.08], cream, [0, 0, 0], 0.075);
  for (const x of [-4.95, -3.87])
    box(0.91, 0.18, 0.51, [x, 0.66, 1.96], linen, [-0.08, 0, 0], 0.095);
  box(2.2, 0.065, 0.61, [-4.4, 0.66, 3.65], sage, [0, 0, 0], 0.02);
  for (const x of [-5.72, -3.02]) {
    box(0.48, 0.4, 0.45, [x, 0.25, 1.89], oak, [0, 0, 0], 0.035);
    cyl(0.11, 0.12, 0.24, [x, 0.58, 1.89], ceramic);
    cyl(0.18, 0.16, 0.24, [x, 0.79, 1.89], cream);
  }
  for (let i = 0; i < 4; i++) {
    box(0.6, 2.58, 0.22, [-5.47, 1.32, 4.42 + i * 0.23], oak);
  }
  box(0.73, 1.1, 0.05, [-1.24, 1.62, 4.7], brass, [0, Math.PI / 2, 0]);
  box(
    0.67,
    1.03,
    0.06,
    [-1.27, 1.62, 4.7],
    mat("#a7b8bb", 0.15, { metalness: 0.7 }),
    [0, Math.PI / 2, 0],
  );
  // Bathroom: tiled wet zone, glazed enclosure and floating fluted vanity.
  box(4.78, 0.025, 4.17, [3.51, 0.018, 3.35], tile);
  box(0.025, 2.7, 4.08, [5.9, 1.35, 3.35], tile);
  box(4.68, 2.7, 0.025, [3.5, 1.35, 5.4], tile);
  box(2.26, 0.07, 1.52, [4.72, 0.06, 2.1], stone);
  box(2.2, 2.2, 0.017, [4.72, 1.14, 2.92], glass);
  box(0.017, 2.2, 1.55, [3.51, 1.14, 2.12], glass);
  for (const x of [3.51, 5.87]) box(0.025, 2.2, 0.025, [x, 1.14, 2.92], brass);
  box(2.36, 0.025, 0.025, [4.7, 2.24, 2.92], brass);
  cyl(0.14, 0.14, 0.022, [5.6, 2.27, 1.95], brass);
  tube(
    [
      [5.9, 1.05, 1.95],
      [5.82, 1.05, 1.95],
      [5.82, 2.3, 1.95],
      [5.6, 2.3, 1.95],
    ],
    0.02,
    brass,
  );
  box(0.72, 0.55, 1.83, [5.48, 0.67, 4.22], oak, [0, 0, 0], 0.025);
  for (let i = 0; i < 27; i++)
    box(0.026, 0.53, 0.027, [5.103, 0.67, 3.36 + i * 0.065], darkOak);
  box(0.89, 0.07, 1.98, [5.43, 0.985, 4.22], stone, [0, 0, 0], 0.035);
  ball([0.31, 0.12, 0.45], [5.42, 1.04, 4.22], ceramic);
  ball([0.24, 0.055, 0.36], [5.42, 1.13, 4.22], stone);
  tube(
    [
      [5.73, 1.02, 4.22],
      [5.73, 1.3, 4.22],
      [5.57, 1.38, 4.22],
      [5.48, 1.29, 4.22],
    ],
    0.02,
    brass,
  );
  box(0.05, 1.2, 1.8, [5.855, 1.86, 4.22], brass, [0, 0, 0], 0.035);
  box(
    0.065,
    1.12,
    1.72,
    [5.81, 1.86, 4.22],
    mat("#a4b6b8", 0.08, { metalness: 0.85 }),
    [0, 0, 0],
    0.025,
  );
  for (const z of [3.15, 5.24]) {
    cyl(0.065, 0.065, 0.43, [5.55, 1.95, z], light);
    box(0.22, 0.045, 0.075, [5.69, 1.76, z], brass);
  }
  // Entry details and botanical accents add scale without blocking circulation.
  box(0.31, 0.83, 1.05, [-0.84, 0.44, 4.82], oak);
  box(0.35, 0.035, 1.1, [-0.82, 0.875, 4.82], stone);
  box(
    0.035,
    1.27,
    0.85,
    [-0.977, 1.79, 4.82],
    mat("#aebbbc", 0.12, { metalness: 0.65 }),
  );
  for (const [x, z] of [
    [-5.4, 0.4],
    [4.8, 0.5],
  ]) {
    cyl(0.2, 0.16, 0.42, [x, 0.23, z], ceramic);
    for (let i = 0; i < 14; i++) {
      const angle = i * 2.4;
      const h = 0.45 + rng() * 0.6;
      const xx = x + Math.cos(angle) * 0.23,
        zz = z + Math.sin(angle) * 0.23;
      tube(
        [
          [x, 0.35, z],
          [xx, h, zz],
        ],
        0.008,
        darkOak,
      );
      ball([0.1, 0.21, 0.045], [xx, h + 0.06, zz], leaf, [
        0.4 * Math.cos(angle),
        angle,
        0.35,
      ]);
    }
  }
  // Low sun through the real window apertures; soft interior illumination comes from the environment.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = new RoomEnvironment();
  const env = pmrem.fromScene(environment, 0.045);
  scene.environment = env.texture;
  scene.environmentIntensity = 0.36;
  environment.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight("#e9f2f5", "#867d6b", 1.05));
  const sun = new THREE.DirectionalLight("#ffead0", 4.4);
  sun.position.set(-9, 5.5, -3);
  sun.target.position.set(0, 0, -1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -9,
    right: 9,
    top: 9,
    bottom: -9,
    near: 0.5,
    far: 30,
  });
  sun.shadow.bias = -0.0002;
  sun.shadow.normalBias = 0.035;
  sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  // Merge transforms once: shared materials become a small fixed set of draw calls.
  for (const [material, parts] of batches) {
    const merged = mergeGeometries(parts, false);
    parts.forEach((g) => g.dispose());
    if (!merged) continue;
    geometries.add(merged);
    const mesh = new THREE.Mesh(merged, material);
    mesh.castShadow =
      material !== glass &&
      !(
        material instanceof THREE.MeshStandardMaterial &&
        material.emissiveIntensity > 0 &&
        material.emissive.getHex() !== 0
      );
    mesh.receiveShadow = true;
    mesh.matrixAutoUpdate = false;
    scene.add(mesh);
  }
  batches.clear();
  renderer.shadowMap.needsUpdate = true;
  const postTarget = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    samples: Math.min(4, renderer.capabilities.maxSamples),
  });
  const composer = new EffectComposer(renderer, postTarget);
  const beauty = new RenderPass(scene, camera);
  const ao = new SSAOPass(scene, camera, 512, 512, 16);
  ao.kernelRadius = 0.55;
  ao.minDistance = 0.001;
  ao.maxDistance = 0.065;
  const output = new OutputPass();
  composer.addPass(beauty);
  composer.addPass(ao);
  composer.addPass(output);
  const first = apartmentRooms[0];
  camera.position.set(...first.position);
  let yaw = 0,
    pitch = 0,
    disposed = false,
    contextLost = false,
    visible = true,
    free = false,
    frame = 0,
    last = 0,
    currentRoom: ApartmentRoomId = "entry";
  let route: [number, number][] = [];
  let destination = first;
  let settling = false;
  const held = new Set<string>();
  const desired = new THREE.Vector3();
  function face(target: V3) {
    const dx = target[0] - camera.position.x,
      dz = target[2] - camera.position.z;
    return {
      yaw: Math.atan2(-dx, -dz),
      pitch: Math.atan2(target[1] - camera.position.y, Math.hypot(dx, dz)),
    };
  }
  ({ yaw, pitch } = face(first.target));
  function applyView() {
    camera.rotation.set(pitch, yaw, 0, "YXZ");
    const room = roomAt(camera.position.x, camera.position.z);
    if (room !== currentRoom) {
      currentRoom = room;
      callbacks.onRoomChange(room);
    }
    host.dataset.room = room;
    host.dataset.position = `${camera.position.x.toFixed(2)},${camera.position.z.toFixed(2)}`;
  }
  function shift(dx: number, dz: number) {
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.06));
    for (let i = 0; i < steps; i++) {
      if (canStandAt(camera.position.x + dx / steps, camera.position.z))
        camera.position.x += dx / steps;
      if (canStandAt(camera.position.x, camera.position.z + dz / steps))
        camera.position.z += dz / steps;
    }
  }
  function render(time: number) {
    frame = 0;
    if (disposed || contextLost || !visible || document.hidden) return;
    const dt = Math.min(0.04, last ? (time - last) / 1000 : 0.016);
    last = time;
    let again = false;
    if (route.length) {
      const [x, z] = route[0];
      const dx = x - camera.position.x,
        dz = z - camera.position.z,
        d = Math.hypot(dx, dz),
        step = Math.min(d, dt * 2.35);
      if (d < 0.035) {
        camera.position.x = x;
        camera.position.z = z;
        route.shift();
        if (!route.length) settling = true;
      } else {
        shift((dx / d) * step, (dz / d) * step);
        const targetYaw = Math.atan2(-dx, -dz);
        yaw +=
          Math.atan2(Math.sin(targetYaw - yaw), Math.cos(targetYaw - yaw)) *
          Math.min(1, dt * 4);
        pitch += (0 - pitch) * Math.min(1, dt * 3);
      }
      again = true;
    } else if (settling) {
      const end = face(destination.target);
      const delta = Math.atan2(
        Math.sin(end.yaw - yaw),
        Math.cos(end.yaw - yaw),
      );
      yaw += delta * Math.min(1, dt * 5);
      pitch += (end.pitch - pitch) * Math.min(1, dt * 5);
      if (Math.abs(delta) < 0.003 && Math.abs(end.pitch - pitch) < 0.003) {
        yaw = end.yaw;
        pitch = end.pitch;
        settling = false;
      } else again = true;
    } else if (free && held.size) {
      const forward = Number(held.has("forward")) - Number(held.has("back")),
        side = Number(held.has("right")) - Number(held.has("left"));
      desired
        .set(
          -Math.sin(yaw) * forward + Math.cos(yaw) * side,
          0,
          -Math.cos(yaw) * forward - Math.sin(yaw) * side,
        )
        .normalize()
        .multiplyScalar(dt * 1.65);
      shift(desired.x, desired.z);
      again = true;
    }
    applyView();
    composer.render();
    if (again) invalidate();
  }
  function invalidate() {
    if (!disposed && !contextLost && visible && !document.hidden && !frame)
      frame = requestAnimationFrame(render);
  }
  function resize() {
    if (disposed) return;
    const w = Math.max(1, host.clientWidth),
      h = Math.max(1, host.clientHeight);
    camera.aspect = w / h;
    camera.fov = w < h ? 67 : 62;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    ao.setSize(
      Math.max(1, Math.round(w * 0.65)),
      Math.max(1, Math.round(h * 0.65)),
    );
    invalidate();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      held.clear();
    } else invalidate();
  });
  intersection.observe(host);
  const visibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      held.clear();
    } else invalidate();
  };
  document.addEventListener("visibilitychange", visibility);
  const lost = (event: Event) => {
    event.preventDefault();
    contextLost = true;
    held.clear();
    route = [];
    cancelAnimationFrame(frame);
    frame = 0;
    callbacks.onError?.(
      "The interactive apartment is unavailable. Please use the room descriptions and project links.",
    );
  };
  renderer.domElement.addEventListener("webglcontextlost", lost);
  resize();
  applyView();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  if (!disposed) {
    composer.render();
    callbacks.onRoomChange("entry");
    callbacks.onReady?.();
  }
  function travelTo(
    next: (typeof apartmentRooms)[number] | undefined,
    instant = false,
  ) {
    if (disposed) return;
    if (!next) return;
    held.clear();
    destination = next;
    callbacks.onMoveStart?.();
    if (instant || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      route = [];
      settling = false;
      camera.position.set(...next.position);
      ({ yaw, pitch } = face(next.target));
    } else {
      route = apartmentRoute(
        [camera.position.x, camera.position.z],
        [next.position[0], next.position[2]],
      );
      settling = !route.length;
    }
    last = 0;
    invalidate();
  }
  return {
    goTo(id, instant = false) {
      travelTo(
        apartmentRooms.find((r) => r.id === id),
        instant,
      );
    },
    inspect(id, instant = false) {
      travelTo(
        apartmentInspections.find((r) => r.id === id),
        instant,
      );
    },
    setExploring(value) {
      free = value;
      held.clear();
      if (value) {
        route = [];
        settling = false;
      }
      invalidate();
    },
    move(direction, active) {
      if (disposed) return;
      if (active) {
        free = true;
        route = [];
        settling = false;
        if (!held.size) callbacks.onMoveStart?.();
        held.add(direction);
      } else held.delete(direction);
      last = 0;
      invalidate();
    },
    look(dx, dy) {
      if (disposed) return;
      route = [];
      settling = false;
      callbacks.onMoveStart?.();
      yaw -= dx * 0.003;
      pitch = THREE.MathUtils.clamp(pitch - dy * 0.003, -1.15, 1.15);
      invalidate();
    },
    resize,
    getPosition: () => [
      camera.position.x,
      APARTMENT_EYE_HEIGHT,
      camera.position.z,
    ],
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frame);
      held.clear();
      observer.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      beauty.dispose();
      ao.dispose();
      ao.ssaoMaterial.dispose();
      ao.noiseTexture.dispose();
      output.dispose();
      composer.dispose();
      env.dispose();
      sun.shadow.dispose();
      scene.clear();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
