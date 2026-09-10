import * as THREE from "three";

export interface PanoramaMarker {
  id: string;
  yaw: number;
  pitch: number;
}

export interface PanoramaProjection {
  id: string;
  x: number;
  y: number;
  visible: boolean;
}

export interface PanoramaController {
  load: (
    source: string,
    markers: PanoramaMarker[],
    yaw: number,
    pitch: number,
    signal: AbortSignal,
    coverage?: { horizontalFov?: number; verticalFov?: number },
  ) => Promise<void>;
  move: (yaw: number, pitch: number) => void;
  lookAt: (yaw: number, pitch: number) => void;
  reset: () => void;
  setVisible: (visible: boolean) => void;
  dispose: () => void;
}

/** One baked panorama and one draw call; no lights, animation loop or idle work. */
export function createPanorama(
  host: HTMLElement,
  options: {
    onProject: (markers: PanoramaProjection[]) => void;
    onView: (yaw: number, pitch: number) => void;
    onError: () => void;
  },
): PanoramaController {
  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    alpha: false,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.domElement.className = "rx-canvas";
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 15);
  function sphereSegment(horizontal: number, vertical: number) {
    const horizontalArc = THREE.MathUtils.degToRad(horizontal);
    const verticalArc = THREE.MathUtils.degToRad(vertical);
    const result = new THREE.SphereGeometry(
      10,
      48,
      24,
      Math.PI - horizontalArc / 2,
      horizontalArc,
      Math.PI / 2 - verticalArc / 2,
      verticalArc,
    );
    result.scale(-1, 1, 1);
    result.rotateY(-Math.PI / 2);
    return result;
  }
  let geometry = sphereSegment(360, 180);
  const material = new THREE.MeshBasicMaterial({
    depthTest: false,
    depthWrite: false,
  });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.matrixAutoUpdate = false;
  scene.add(sphere);
  const direction = new THREE.Vector3();
  const projected = new THREE.Vector3();
  const markerDirection = new THREE.Vector3();
  let markers: PanoramaMarker[] = [];
  let yaw = 0;
  let pitch = 0;
  let initialYaw = 0;
  let initialPitch = 0;
  let width = 1;
  let height = 1;
  let frame = 0;
  let disposed = false;
  let visible = true;
  let loaded = false;
  let bitmap: ImageBitmap | null = null;
  let texture: THREE.Texture | null = null;
  let loadVersion = 0;
  let horizontalCoverage = 360;
  let verticalCoverage = 180;

  function vector(target: THREE.Vector3, longitude: number, latitude: number) {
    const lon = THREE.MathUtils.degToRad(longitude);
    const lat = THREE.MathUtils.degToRad(latitude);
    return target.set(
      Math.sin(lon) * Math.cos(lat),
      Math.sin(lat),
      -Math.cos(lon) * Math.cos(lat),
    );
  }

  function draw() {
    frame = 0;
    if (
      disposed ||
      !loaded ||
      !visible ||
      renderer.getContext().isContextLost()
    )
      return;
    vector(direction, yaw, pitch);
    camera.lookAt(direction);
    camera.updateMatrixWorld();
    renderer.render(scene, camera);
    options.onView(yaw, pitch);
    options.onProject(
      markers.map((marker) => {
        vector(markerDirection, marker.yaw, marker.pitch);
        const ahead = markerDirection.dot(direction) > 0;
        projected.copy(markerDirection).multiplyScalar(5).project(camera);
        return {
          id: marker.id,
          x: ((projected.x + 1) * width) / 2,
          y: ((1 - projected.y) * height) / 2,
          visible:
            ahead &&
            Math.abs(projected.x) < 0.94 &&
            Math.abs(projected.y) < 0.87,
        };
      }),
    );
  }

  function invalidate() {
    if (!disposed && visible && loaded && !frame)
      frame = requestAnimationFrame(draw);
  }

  function lookAt(longitude: number, latitude: number) {
    const maxPitch = Math.max(0, (verticalCoverage - camera.fov) / 2 - 2);
    pitch = THREE.MathUtils.clamp(latitude, -maxPitch, maxPitch);
    if (horizontalCoverage < 360) {
      // At nonzero pitch, the upper/lower corners see farther sideways.
      // Account for that extra angle so no corner reveals a segment edge.
      const latitudeRadians = THREE.MathUtils.degToRad(Math.abs(pitch));
      const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const halfWidth = THREE.MathUtils.radToDeg(
        Math.atan2(
          tangent * camera.aspect,
          Math.cos(latitudeRadians) - tangent * Math.sin(latitudeRadians),
        ),
      );
      const maxYaw = Math.max(0, horizontalCoverage / 2 - halfWidth - 2);
      yaw = THREE.MathUtils.clamp(longitude, -maxYaw, maxYaw);
    } else yaw = ((((longitude + 180) % 360) + 360) % 360) - 180;
    invalidate();
  }

  function resize() {
    if (disposed) return;
    width = Math.max(1, host.clientWidth);
    height = Math.max(1, host.clientHeight);
    camera.aspect = width / height;
    const horizontalLimit = THREE.MathUtils.degToRad(
      Math.min(160, horizontalCoverage - 6),
    );
    const verticalForWidth = THREE.MathUtils.radToDeg(
      2 * Math.atan(Math.tan(horizontalLimit / 2) / camera.aspect),
    );
    camera.fov = Math.min(60, verticalCoverage - 6, verticalForWidth);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    lookAt(yaw, pitch);
  }

  function loseContext(event: Event) {
    event.preventDefault();
    if (disposed) return;
    cancelAnimationFrame(frame);
    frame = 0;
    options.onError();
  }

  renderer.domElement.addEventListener("webglcontextlost", loseContext);
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();

  return {
    async load(
      source,
      nextMarkers,
      startYaw,
      startPitch,
      signal,
      coverage = {},
    ) {
      const version = ++loadVersion;
      loaded = false;
      cancelAnimationFrame(frame);
      frame = 0;
      const response = await fetch(source, {
        signal,
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("Room image is unavailable");
      const blob = await response.blob();
      let nextBitmap = await createImageBitmap(blob, {
        imageOrientation: "flipY",
      });
      try {
        signal.throwIfAborted();
        if (disposed || version !== loadVersion) return;
        const limit = Math.min(4096, renderer.capabilities.maxTextureSize);
        if (nextBitmap.width > limit || nextBitmap.height > limit) {
          const ratio = Math.min(
            limit / nextBitmap.width,
            limit / nextBitmap.height,
          );
          const resized = await createImageBitmap(nextBitmap, {
            resizeWidth: Math.round(nextBitmap.width * ratio),
            resizeHeight: Math.round(nextBitmap.height * ratio),
            resizeQuality: "high",
          });
          nextBitmap.close();
          nextBitmap = resized;
        }
        signal.throwIfAborted();
        if (disposed || version !== loadVersion) return;
        texture?.dispose();
        bitmap?.close();
        bitmap = nextBitmap;
        texture = new THREE.Texture(bitmap);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.flipY = false;
        texture.minFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        texture.needsUpdate = true;
        material.map = texture;
        material.needsUpdate = true;
        horizontalCoverage = THREE.MathUtils.clamp(
          coverage.horizontalFov ?? 360,
          30,
          360,
        );
        verticalCoverage = THREE.MathUtils.clamp(
          coverage.verticalFov ?? 180,
          30,
          180,
        );
        geometry.dispose();
        geometry = sphereSegment(horizontalCoverage, verticalCoverage);
        sphere.geometry = geometry;
        markers = nextMarkers;
        initialYaw = startYaw;
        initialPitch = startPitch;
        resize();
        loaded = true;
        lookAt(startYaw, startPitch);
        cancelAnimationFrame(frame);
        draw();
      } finally {
        if (nextBitmap !== bitmap) nextBitmap.close();
      }
    },
    move(longitude, latitude) {
      lookAt(yaw + longitude, pitch + latitude);
    },
    lookAt,
    reset() {
      lookAt(initialYaw, initialPitch);
    },
    setVisible(next) {
      visible = next;
      if (next) invalidate();
      else {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      loadVersion++;
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", loseContext);
      geometry.dispose();
      material.dispose();
      texture?.dispose();
      bitmap?.close();
      scene.clear();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
