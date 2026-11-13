export const INTRO_SESSION_KEY = "huddlekit:football-intro:v1";
export const INTRO_FINISHED_EVENT = "huddlekit:intro-finished";
export const INTRO_STARTUP_MS = 1200;
export const INTRO_MAXIMUM_MS = 5000;
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export interface IntroGate {
  claimed: boolean;
  closed: boolean;
  finish: () => void;
}

declare global {
  interface Window {
    __huddlekitIntro?: IntroGate;
  }
}

// This static script runs in the document head, before the homepage can paint.
// The deadline also releases the page if hydration never reaches the controller.
export const INTRO_BOOTSTRAP = `(() => {
  if (location.pathname !== "/" || document.hidden ||
      matchMedia(${JSON.stringify(REDUCED_MOTION_QUERY)}).matches) return;
  try {
    if (sessionStorage.getItem(${JSON.stringify(INTRO_SESSION_KEY)})) return;
    sessionStorage.setItem(${JSON.stringify(INTRO_SESSION_KEY)}, "seen");
  } catch { return; }
  const root = document.documentElement;
  let timeout;
  const gate = {
    claimed: false,
    closed: false,
    finish() {
      if (gate.closed) return;
      gate.closed = true;
      clearTimeout(timeout);
      root.removeAttribute("data-football-intro");
      window.removeEventListener("pagehide", gate.finish);
      document.removeEventListener("visibilitychange", onVisibility);
      window.dispatchEvent(new Event(${JSON.stringify(INTRO_FINISHED_EVENT)}));
    }
  };
  function onVisibility() { if (document.hidden) gate.finish(); }
  window.__huddlekitIntro = gate;
  root.setAttribute("data-football-intro", "pending");
  timeout = setTimeout(gate.finish, ${INTRO_MAXIMUM_MS});
  window.addEventListener("pagehide", gate.finish, { once: true });
  document.addEventListener("visibilitychange", onVisibility);
})();`;

const createGate = (): IntroGate => {
  const root = document.documentElement;
  const listeners = new AbortController();
  const timer: { id?: number } = {};
  const gate: IntroGate = {
    claimed: true,
    closed: false,
    finish: () => {
      if (gate.closed) {
        return;
      }
      gate.closed = true;
      window.clearTimeout(timer.id);
      delete root.dataset.footballIntro;
      listeners.abort();
      window.dispatchEvent(new Event(INTRO_FINISHED_EVENT));
    },
  };
  timer.id = window.setTimeout(gate.finish, INTRO_MAXIMUM_MS);
  root.dataset.footballIntro = "pending";
  window.addEventListener("pagehide", gate.finish, {
    signal: listeners.signal,
  });
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) {
        gate.finish();
      }
    },
    { signal: listeners.signal }
  );
  return gate;
};

export const claimIntro = (preview: boolean): IntroGate | null => {
  if (document.hidden || window.matchMedia(REDUCED_MOTION_QUERY).matches) {
    window.__huddlekitIntro?.finish();
    return null;
  }

  if (preview) {
    return createGate();
  }

  const existing = window.__huddlekitIntro;
  if (existing) {
    if (existing.closed || existing.claimed) {
      return null;
    }
    existing.claimed = true;
    return existing;
  }

  // Client navigation to the homepage does not run the head bootstrap again.
  try {
    if (window.sessionStorage.getItem(INTRO_SESSION_KEY) !== null) {
      return null;
    }
    window.sessionStorage.setItem(INTRO_SESSION_KEY, "seen");
  } catch {
    return null;
  }
  const gate = createGate();
  window.__huddlekitIntro = gate;
  return gate;
};
