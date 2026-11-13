"use client";

import { cn } from "cn";
import { m } from "motion/react";

/** Full-pitch markings drawn with currentColor, for use as a faint backdrop. */
export function PitchLines({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 760"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      className={cn("pointer-events-none", className)}
    >
      <rect x="40" y="40" width="1120" height="680" rx="6" />
      <line x1="600" y1="40" x2="600" y2="720" />
      <circle cx="600" cy="380" r="95" />
      <circle cx="600" cy="380" r="4" fill="currentColor" />
      <rect x="40" y="200" width="170" height="360" />
      <rect x="40" y="290" width="60" height="180" />
      <rect x="990" y="200" width="170" height="360" />
      <rect x="1100" y="290" width="60" height="180" />
      <path d="M210 330a70 70 0 0 1 0 100" />
      <path d="M990 330a70 70 0 0 0 0 100" />
    </svg>
  );
}

const players = [
  { name: "Morris", number: 1, x: 50, y: 88 },
  { name: "Walker", number: 2, x: 15, y: 70 },
  { name: "Reed", number: 5, x: 38, y: 72 },
  { name: "Hughes", number: 6, x: 62, y: 72 },
  { name: "Patel", number: 3, x: 85, y: 70 },
  { name: "Ito", number: 7, x: 15, y: 46 },
  { name: "Cole", number: 8, x: 38, y: 48 },
  { name: "Grant", number: 4, x: 62, y: 48 },
  { name: "Lima", number: 11, x: 85, y: 46 },
  { name: "Carter", number: 9, x: 38, y: 22 },
  { name: "Berg", number: 10, x: 62, y: 22 },
] as const;

/** A 4-4-2 starting XI laid out on a striped pitch. */
export function PitchLineup({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-white/10 bg-[repeating-linear-gradient(0deg,#14532d_0px,#14532d_48px,#166534_48px,#166534_96px)]",
        className
      )}
    >
      <svg
        viewBox="0 0 300 400"
        fill="none"
        // oxlint-disable-next-line shadcn/no-raw-colors
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.5"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        aria-hidden
      >
        <rect x="12" y="12" width="276" height="376" />
        <line x1="12" y1="200" x2="288" y2="200" />
        <circle cx="150" cy="200" r="36" />
        <rect x="75" y="12" width="150" height="62" />
        <rect x="110" y="12" width="80" height="26" />
        <rect x="75" y="326" width="150" height="62" />
        <rect x="110" y="362" width="80" height="26" />
      </svg>
      {players.map((p, i) => (
        <m.div
          key={p.number}
          initial={{ opacity: 0, scale: 0.4 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 + i * 0.05, duration: 0.4 }}
          className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-full text-[12px] font-bold shadow-[0_4px_12px_rgba(0,0,0,0.4)] sm:size-8 sm:text-[13px]">
            {p.number}
          </span>
          <span className="rounded bg-black/40 px-1 text-[10px] font-medium text-white">
            {p.name}
          </span>
        </m.div>
      ))}
    </div>
  );
}
