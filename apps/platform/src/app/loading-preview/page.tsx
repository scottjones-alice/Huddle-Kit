"use client";

/* oxlint-disable shadcn/require-static-classes -- This preview styles custom components with CSS Modules, not Tailwind utilities. */

import {
  FootballLoader,
  FootballLoadingBoundary,
} from "@alice/user-interface/components/football-loader";
import Image from "next/image";
import { useReducer } from "react";

import styles from "./preview.module.css";

type PreviewVariant = "page" | "splash" | "inline";
type UploadState = "loading" | "success" | "error";

interface PreviewState {
  paused: boolean;
  progress: number;
  ready: boolean;
  uploadState: UploadState;
  variant: PreviewVariant;
}

type PreviewAction =
  | { type: "variant"; variant: PreviewVariant }
  | { type: "pause" }
  | { type: "ready" }
  | { type: "replay" }
  | { type: "progress"; progress: number }
  | { type: "upload-state"; state: UploadState };

const initialState: PreviewState = {
  paused: false,
  progress: 42,
  ready: false,
  uploadState: "loading",
  variant: "page",
};

const variants: {
  description: string;
  label: string;
  value: PreviewVariant;
}[] = [
  {
    description: "A warm-up before your next page.",
    label: "Page loading",
    value: "page",
  },
  {
    description: "A little kick-off when the app opens.",
    label: "Mobile splash",
    value: "splash",
  },
  {
    description: "Keep the ball moving while a file uploads.",
    label: "File upload",
    value: "inline",
  },
];

function previewReducer(
  state: PreviewState,
  action: PreviewAction
): PreviewState {
  switch (action.type) {
    case "variant": {
      return { ...initialState, paused: state.paused, variant: action.variant };
    }
    case "pause": {
      return { ...state, paused: !state.paused };
    }
    case "ready": {
      return { ...state, ready: true };
    }
    case "replay": {
      return { ...initialState, paused: state.paused, variant: state.variant };
    }
    case "progress": {
      return { ...state, progress: action.progress, uploadState: "loading" };
    }
    case "upload-state": {
      return {
        ...state,
        progress: action.state === "success" ? 100 : state.progress,
        uploadState: action.state,
      };
    }
    default: {
      return state;
    }
  }
}

function ReadyPreview({ mobile }: { mobile: boolean }) {
  return (
    <div className={styles.ready} data-mobile={mobile}>
      <div aria-hidden="true" className={styles.readyMark}>
        <svg fill="none" height="28" viewBox="0 0 24 24" width="28">
          <path
            d="m5 12 4 4L19 6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </div>
      <span className={styles.eyebrow}>READY FOR KICK-OFF</span>
      <h2>You’re all set.</h2>
      <p>This is where your page appears as soon as it’s ready.</p>
    </div>
  );
}

function UploadPreview({ state }: { state: PreviewState }) {
  let label = "Sending it up the pitch";
  let description = "A little football while your file uploads.";

  if (state.uploadState === "success") {
    label = "That’s a finish!";
    description = "The example upload is complete.";
  } else if (state.uploadState === "error") {
    label = "Let’s try that pass again";
    description = "The example upload failed. Reset to try again.";
  }

  return (
    <div className={styles.uploadCard}>
      <div className={styles.uploadHeader}>
        <span className={styles.fileIcon} aria-hidden="true">
          <svg fill="none" height="24" viewBox="0 0 24 24" width="24">
            <path
              d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5Zm0 0v5h5M8 13h8M8 17h5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
        </span>
        <div>
          <p>matchday-highlights.mp4</p>
          <span>Example file · upload preview</span>
        </div>
        <span className={styles.demoBadge}>DEMO</span>
      </div>
      <FootballLoader
        className={styles.uploadLoader}
        description={description}
        label={label}
        paused={state.paused}
        progress={state.progress}
        state={state.uploadState}
        variant="inline"
      />
    </div>
  );
}

export default function LoadingPreviewPage() {
  const [state, dispatch] = useReducer(previewReducer, initialState);
  const isUpload = state.variant === "inline";
  const isMobile = state.variant === "splash";
  const activeVariant = variants.find(
    (variant) => variant.value === state.variant
  );

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <Image
              alt=""
              className={styles.logo}
              height={34}
              src="/huddlekit/icon.svg"
              width={34}
            />
            <span>huddlekit</span>
          </div>
          <span className={styles.headerNote}>THE IN-BETWEEN MOMENTS</span>
        </header>

        <section aria-labelledby="preview-title" className={styles.intro}>
          <div>
            <p className={styles.eyebrow}>
              <span aria-hidden="true" className={styles.smallBall}>
                ✳
              </span>
              A SMALL GAME. A LITTLE JOY.
            </p>
            <h1 id="preview-title">
              A little match.
              <br />
              <span>While you wait.</span>
            </h1>
          </div>
          <p className={styles.introCopy}>
            Tiny players. Neat little passes. One more reason to love your club.
            A playful loading moment, wherever you need it.
          </p>
        </section>

        <section
          aria-label="Interactive loading preview"
          className={styles.playground}
        >
          <div className={styles.previewToolbar}>
            <div
              aria-label="Loading preview type"
              className={styles.variantButtons}
            >
              {variants.map((variant) => (
                <button
                  aria-pressed={state.variant === variant.value}
                  className={styles.variantButton}
                  key={variant.value}
                  onClick={() => {
                    dispatch({ type: "variant", variant: variant.value });
                  }}
                  type="button"
                >
                  {variant.label}
                </button>
              ))}
            </div>
            <button
              aria-pressed={state.paused}
              className={styles.pauseButton}
              onClick={() => {
                dispatch({ type: "pause" });
              }}
              type="button"
            >
              <span aria-hidden="true">{state.paused ? "▷" : "Ⅱ"}</span>
              {state.paused ? "Resume" : "Pause"}
            </button>
          </div>

          <div className={styles.stage} data-variant={state.variant}>
            <span className={styles.stageLabel}>
              <span aria-hidden="true" />
              INTERACTIVE PREVIEW
            </span>
            {isUpload ? (
              <UploadPreview state={state} />
            ) : (
              <div className={isMobile ? styles.phone : styles.browser}>
                {isMobile ? (
                  <div aria-hidden="true" className={styles.phoneTop}>
                    <span>9:41</span>
                    <span className={styles.phoneIsland} />
                    <span className={styles.phoneBattery} />
                  </div>
                ) : (
                  <div aria-hidden="true" className={styles.browserBar}>
                    <div>
                      <i />
                      <i />
                      <i />
                    </div>
                    <span>huddlekit · your club, together</span>
                    <span className={styles.browserBarEnd} />
                  </div>
                )}
                <FootballLoadingBoundary
                  className={styles.boundary}
                  description="A little football while we get things ready."
                  label={
                    isMobile
                      ? "Getting the team together"
                      : "Warming up your next page"
                  }
                  loaderClassName={styles.stageLoader}
                  loading={!state.ready}
                  paused={state.paused}
                  variant={isMobile ? "splash" : "page"}
                >
                  <ReadyPreview mobile={isMobile} />
                </FootballLoadingBoundary>
                {isMobile && (
                  <div aria-hidden="true" className={styles.homeIndicator} />
                )}
              </div>
            )}
          </div>

          <div className={styles.controls}>
            <div className={styles.controlDescription}>
              <strong>{activeVariant?.label}</strong>
              <span>{activeVariant?.description}</span>
            </div>
            {isUpload ? (
              <div className={styles.uploadControls}>
                <label
                  className={styles.progressControl}
                  htmlFor="demo-progress"
                >
                  <span>
                    Progress <b>{state.progress}%</b>
                  </span>
                  <input
                    id="demo-progress"
                    max="100"
                    min="0"
                    onChange={(event) => {
                      dispatch({
                        progress: Number(event.target.value),
                        type: "progress",
                      });
                    }}
                    type="range"
                    value={state.progress}
                  />
                </label>
                <div className={styles.actionButtons}>
                  <button
                    className={styles.secondaryButton}
                    onClick={() => {
                      dispatch({ type: "replay" });
                    }}
                    type="button"
                  >
                    Reset
                  </button>
                  <button
                    className={styles.secondaryButton}
                    onClick={() => {
                      dispatch({ state: "error", type: "upload-state" });
                    }}
                    type="button"
                  >
                    Fail
                  </button>
                  <button
                    className={styles.primaryButton}
                    onClick={() => {
                      dispatch({ state: "success", type: "upload-state" });
                    }}
                    type="button"
                  >
                    Complete <span aria-hidden="true">↗</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                className={styles.primaryButton}
                onClick={() => {
                  dispatch({ type: state.ready ? "replay" : "ready" });
                }}
                type="button"
              >
                {state.ready ? "Replay loading" : "Finish loading"}
                <span aria-hidden="true">{state.ready ? "↻" : "↗"}</span>
              </button>
            )}
          </div>
        </section>

        <footer className={styles.footer}>
          <p>
            {isUpload
              ? "Preview only. No files are uploaded."
              : "Ready means ready. The animation never holds up your page."}
          </p>
          <span>Quiet by design. Reduced-motion friendly.</span>
        </footer>
      </div>
    </main>
  );
}
