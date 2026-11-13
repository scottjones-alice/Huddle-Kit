import {
  INTRO_FINISHED_EVENT,
  INTRO_STARTUP_MS,
  REDUCED_MOTION_QUERY,
} from "./gate";
import type { IntroGate } from "./gate";

const focusWebsite = (previous: Element | null): void => {
  if (
    previous instanceof HTMLElement &&
    previous !== document.body &&
    previous.isConnected
  ) {
    previous.focus({ preventScroll: true });
    return;
  }
  const main = document.querySelector("main");
  if (main) {
    const hadTabIndex = main.hasAttribute("tabindex");
    main.tabIndex = -1;
    main.focus({ preventScroll: true });
    if (!hadTabIndex) {
      main.removeAttribute("tabindex");
    }
  }
};

export const connectIntro = (
  canvas: HTMLCanvasElement,
  dialog: HTMLDialogElement,
  gate: IntroGate,
  onDismiss: () => void
): (() => void) => {
  const content = document.querySelector<HTMLElement>("#website-content");
  if (!content || gate.closed) {
    gate.finish();
    queueMicrotask(onDismiss);
    return () => {
      gate.finish();
    };
  }
  const previousFocus = document.activeElement;
  const previouslyInert = content.inert;
  const motion = window.matchMedia(REDUCED_MOTION_QUERY);
  const listeners = new AbortController();
  const { signal } = listeners;
  let disposed = false;
  let disposeScene: (() => void) | undefined;
  let context: WebGL2RenderingContext | null = null;
  const startupTimeout = window.setTimeout(gate.finish, INTRO_STARTUP_MS);

  const release = () => {
    if (disposed) {
      return;
    }
    disposed = true;
    window.clearTimeout(startupTimeout);
    listeners.abort();
    disposeScene?.();
    if (!disposeScene) {
      context?.getExtension("WEBGL_lose_context")?.loseContext();
    }
    content.inert = previouslyInert;
    dialog.close();
    focusWebsite(previousFocus);
  };

  window.addEventListener(
    INTRO_FINISHED_EVENT,
    () => {
      if (gate.closed) {
        release();
        onDismiss();
      }
    },
    { signal }
  );
  motion.addEventListener(
    "change",
    () => {
      if (motion.matches) {
        gate.finish();
      }
    },
    { signal }
  );
  canvas.addEventListener("webglcontextlost", gate.finish, { signal });
  dialog.addEventListener(
    "cancel",
    (event) => {
      event.preventDefault();
      gate.finish();
    },
    { signal }
  );

  content.inert = true;
  dialog.showModal();

  const start = async () => {
    try {
      context = canvas.getContext("webgl2", {
        alpha: false,
        antialias: true,
        powerPreference: "low-power",
      });
      if (!context) {
        gate.finish();
        return;
      }
      const { mountFootballScene } = await import("./scene");
      if (disposed || gate.closed) {
        return;
      }
      disposeScene = mountFootballScene(canvas, context, {
        onComplete: gate.finish,
        onError: gate.finish,
        onReady: () => {
          window.clearTimeout(startupTimeout);
          document.documentElement.dataset.footballIntro = "playing";
        },
        onReveal: () => {
          document.documentElement.dataset.footballIntro = "revealing";
        },
      });
    } catch {
      gate.finish();
    }
  };
  queueMicrotask(() => {
    if (!disposed) {
      void start();
    }
  });
  return release;
};
