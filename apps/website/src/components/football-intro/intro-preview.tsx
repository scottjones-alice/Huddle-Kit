"use client";

import { useCallback, useState } from "react";

import { FootballIntro } from "./football-intro";

export function IntroPreview() {
  const [playing, setPlaying] = useState(true);
  const onDismiss = useCallback(() => {
    setPlaying(false);
  }, []);

  return (
    <main className="bg-background flex flex-1 flex-col items-center justify-center gap-6 px-6 py-32 text-center">
      {playing && <FootballIntro preview onDismiss={onDismiss} />}
      <p className="text-muted-foreground text-xs tracking-widest uppercase">
        Huddlekit · Kick off
      </p>
      <h1 className="text-foreground text-4xl font-semibold tracking-tight sm:text-6xl">
        A little football.
        <br />A big entrance.
      </h1>
      <p className="text-muted-foreground max-w-md text-sm leading-6">
        A three-second run-up, strike and near miss. Replay the website intro
        here without changing your homepage’s first-visit setting.
      </p>
      <button
        type="button"
        className="bg-primary text-primary-foreground focus-visible:ring-ring inline-flex min-h-12 items-center justify-center rounded-full px-8 text-sm font-medium focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:outline-none disabled:opacity-50"
        disabled={playing}
        onClick={() => {
          setPlaying(true);
        }}
      >
        Replay intro{" "}
        <span className="ml-3" aria-hidden="true">
          ↗
        </span>
      </button>
      <p className="text-muted-foreground text-xs">
        Silent by design. Respects reduced motion.
      </p>
    </main>
  );
}
