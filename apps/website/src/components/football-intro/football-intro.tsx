"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { claimIntro } from "./gate";
import type { IntroGate } from "./gate";
import { connectIntro } from "./lifecycle";

import styles from "./intro.module.css";

interface FootballIntroProps {
  onDismiss?: () => void;
  preview?: boolean;
}

interface IntroAttempt {
  gate: IntroGate;
  host: HTMLElement;
  handleDismiss: () => void;
}

function IntroOverlay({
  gate,
  onDismiss: handleDismiss,
}: {
  gate: IntroGate;
  onDismiss: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const handleSkip = () => {
    gate.finish();
  };

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const dialog = dialogRef.current;
    if (!canvas || !dialog) {
      gate.finish();
      return () => {
        gate.finish();
      };
    }
    return connectIntro(canvas, dialog, gate, handleDismiss);
  }, [gate, handleDismiss]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.overlay}
      aria-label="Huddlekit football introduction"
    >
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <div className={styles.vignette} aria-hidden="true" />
      <div className={styles.topBar}>
        <span className={styles.brand} aria-hidden="true">
          <span className={styles.brandMark}>h</span>huddlekit
        </span>
        <button type="button" className={styles.skip} onClick={handleSkip}>
          Skip intro <span aria-hidden="true">↗</span>
        </button>
      </div>
      <div className={styles.caption} aria-hidden="true">
        <span className={styles.eyebrow}>
          <span className={styles.liveDot} /> UNDER THE LIGHTS
        </span>
        <p>
          Your game.
          <br />
          <span>Your people.</span>
        </p>
      </div>
      <div className={styles.bottomBar} aria-hidden="true">
        <span>GOOD FOOTBALL STARTS HERE.</span>
        <span className={styles.matchLabel}>
          01 <span>—</span> KICK OFF
        </span>
      </div>
    </dialog>
  );
}

export function FootballIntro({
  onDismiss,
  preview = false,
}: FootballIntroProps) {
  const [attempt, setAttempt] = useState<IntroAttempt | null>(null);

  useEffect(() => {
    let canceled = false;
    let gate: IntroGate | null = null;
    queueMicrotask(() => {
      if (canceled) {
        return;
      }
      gate = claimIntro(preview);
      const host = document.querySelector<HTMLElement>("#football-intro-root");
      if (!gate || !host) {
        gate?.finish();
        onDismiss?.();
        return;
      }
      setAttempt({
        gate,
        handleDismiss: () => {
          if (!canceled) {
            setAttempt(null);
            onDismiss?.();
          }
        },
        host,
      });
    });
    return () => {
      canceled = true;
      gate?.finish();
    };
  }, [onDismiss, preview]);

  return attempt
    ? createPortal(
        <IntroOverlay gate={attempt.gate} onDismiss={attempt.handleDismiss} />,
        attempt.host
      )
    : null;
}
