import {
  ACESFilmicToneMapping,
  BufferGeometry,
  Color,
  CubicBezierCurve3,
  DirectionalLight,
  Fog,
  LineSegments,
  Material,
  Mesh,
  PCFShadowMap,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";

import { BALL_RADIUS, createFootball } from "./football";
import { addPitch } from "./pitch";
import { createFootballer, poseFootballer } from "./player";

interface SceneCallbacks {
  onComplete: () => void;
  onError: () => void;
  onReady: () => void;
  onReveal: () => void;
}

const STRIKE_SECONDS = 1.8;
const REVEAL_SECONDS = 2.75;
const DURATION_SECONDS = 3;

interface Disposer {
  dispose: () => void;
}

const releaseResources = (scene: Scene): void => {
  // A set, so a geometry or material shared by several meshes is released once.
  const disposers = new Set<Disposer>();
  scene.traverse((object) => {
    if (object instanceof Mesh || object instanceof LineSegments) {
      const geometry: unknown = object.geometry;
      const material: unknown = object.material;
      if (geometry instanceof BufferGeometry) {
        disposers.add(geometry);
      }
      if (Array.isArray(material)) {
        for (const candidate of material) {
          if (candidate instanceof Material) {
            disposers.add(candidate);
          }
        }
      } else if (material instanceof Material) {
        disposers.add(material);
      }
    }
    if (object instanceof DirectionalLight) {
      object.shadow.dispose();
    }
  });
  for (const disposer of disposers) {
    disposer.dispose();
  }
  scene.clear();
};

export const mountFootballScene = (
  canvas: HTMLCanvasElement,
  context: WebGL2RenderingContext,
  callbacks: SceneCallbacks
): (() => void) => {
  const renderer = new WebGLRenderer({ antialias: true, canvas, context });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;

  const scene = new Scene();
  scene.background = new Color("#091b17");
  scene.fog = new Fog("#091b17", 9, 33);
  const camera = new PerspectiveCamera(40, 1, 0.08, 70);
  camera.position.set(0, 1.65, 7.3);
  camera.lookAt(0, 1.02, 0);
  let disposed = false;
  let frame = 0;
  let startTime = 0;
  let revealed = false;

  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect();
    if (width === 0 || height === 0) {
      return;
    }
    camera.aspect = width / height;
    camera.fov = camera.aspect < 0.8 ? 52 : 40;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  const dispose = () => {
    if (disposed) {
      return;
    }
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    releaseResources(scene);
    renderer.dispose();
    renderer.forceContextLoss();
  };

  try {
    addPitch(scene);
    const player = createFootballer();
    const ball = createFootball();
    scene.add(player.root, ball);
    const flight = new CubicBezierCurve3(
      new Vector3(0, BALL_RADIUS, 1.5),
      new Vector3(-0.05, 1.45, 3.2),
      new Vector3(-0.35, 1.65, 6.4),
      new Vector3(1.3, 1.65, 8.7)
    );

    const update = (seconds: number) => {
      poseFootballer(player, seconds);
      const progress = Math.max(
        0,
        Math.min(
          (seconds - STRIKE_SECONDS) / (REVEAL_SECONDS - STRIKE_SECONDS),
          1
        )
      );
      flight.getPoint(progress, ball.position);
      ball.rotation.set(progress * 11, progress * 3, progress * -5);
      renderer.render(scene, camera);
    };

    const tick = (time: number) => {
      if (disposed) {
        return;
      }
      try {
        const elapsed = (time - startTime) / 1000;
        if (elapsed >= DURATION_SECONDS) {
          callbacks.onComplete();
          return;
        }
        if (elapsed >= REVEAL_SECONDS && !revealed) {
          revealed = true;
          callbacks.onReveal();
        }
        update(elapsed);
        frame = requestAnimationFrame(tick);
      } catch {
        callbacks.onError();
        dispose();
      }
    };

    const prepare = async () => {
      try {
        poseFootballer(player, 0);
        ball.position.copy(flight.v0);
        await renderer.compileAsync(scene, camera);
        if (disposed) {
          return;
        }
        update(0);
        startTime = performance.now();
        callbacks.onReady();
        frame = requestAnimationFrame(tick);
      } catch {
        callbacks.onError();
        dispose();
      }
    };
    void prepare();
  } catch {
    dispose();
    // Defer until the controller has received its cleanup function.
    queueMicrotask(callbacks.onError);
  }
  return dispose;
};
