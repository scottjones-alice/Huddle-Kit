import { cn } from "cn";
import type { ReactNode } from "react";

import { FootballMatch } from "./football-match";

import styles from "../styles/football-loading.module.css";

interface FootballLoaderProps {
  className?: string;
  variant?: "page" | "splash" | "inline";
  label?: string;
  description?: string;
  /** Actual progress from the operation, 0–100. Omit when unknown. */
  progress?: number;
  state?: "loading" | "success" | "error";
  paused?: boolean;
}

const DEFAULT_LABELS = {
  error: "Play stopped for a moment",
  loading: "Getting the team ready",
  success: "All set. Let's play.",
} as const;

const DEFAULT_DESCRIPTIONS = {
  error: "Something went wrong. Please try again.",
  loading: "A little football while you wait.",
  success: "You're ready to get back to your team.",
} as const;

function FootballLoader({
  className,
  variant = "page",
  label,
  description,
  progress,
  state = "loading",
  paused = false,
}: FootballLoaderProps) {
  const value =
    progress !== undefined && Number.isFinite(progress)
      ? Math.min(100, Math.max(0, progress))
      : undefined;
  const resolvedLabel = label ?? DEFAULT_LABELS[state];

  return (
    <div
      className={cn(styles.loader, className)}
      data-variant={variant}
      data-state={state}
      data-paused={paused}
    >
      {variant === "splash" && (
        <div className={styles.wordmark}>
          huddlekit<span>.</span>
        </div>
      )}
      <FootballMatch
        className={styles.illustration}
        paused={paused || state !== "loading"}
        celebration={state === "success"}
      />
      <div className={styles.copy}>
        <div className={styles.eyebrow} aria-hidden="true">
          <span className={styles.statusDot} />
          {state === "loading" ? "A quick warm-up" : "Back to the game"}
        </div>
        <output aria-live="polite" aria-atomic="true">
          <span className={styles.label}>{resolvedLabel}</span>
          <span className={styles.description}>
            {description ?? DEFAULT_DESCRIPTIONS[state]}
          </span>
        </output>
        {state === "loading" && (
          <div className={styles.progressRow}>
            <progress
              className={styles.progress}
              max={100}
              value={value}
              aria-label={resolvedLabel}
            />
            {value !== undefined && (
              <span className={styles.percentage} aria-hidden="true">
                {Math.round(value)}%
              </span>
            )}
          </div>
        )}
      </div>
      {variant === "splash" && (
        <p className={styles.tagline}>Your team. All together.</p>
      )}
    </div>
  );
}

interface FootballLoadingBoundaryProps {
  children: ReactNode;
  loading: boolean;
  className?: string;
  loaderClassName?: string;
  label?: string;
  description?: string;
  variant?: "page" | "splash";
  paused?: boolean;
}

/** Fades as soon as real work finishes; never adds a minimum loading time. */
function FootballLoadingBoundary({
  children,
  loading,
  className,
  loaderClassName,
  label,
  description,
  variant = "page",
  paused = false,
}: FootballLoadingBoundaryProps) {
  return (
    <div className={cn(styles.boundary, className)} data-loading={loading}>
      <div
        className={styles.content}
        inert={loading}
        aria-hidden={loading}
        aria-busy={loading}
      >
        {children}
      </div>
      <div className={styles.overlay} aria-hidden={!loading} inert={!loading}>
        <FootballLoader
          className={cn(styles.boundaryLoader, loaderClassName)}
          label={label}
          description={description}
          variant={variant}
          paused={paused || !loading}
        />
      </div>
    </div>
  );
}

export { FootballLoader, FootballLoadingBoundary };
export type { FootballLoaderProps, FootballLoadingBoundaryProps };
