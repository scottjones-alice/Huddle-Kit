export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* The same mark as public/huddlekit/icon.svg, on theme colours. */}
      <svg viewBox="0 0 100 100" className="size-[1.9em] shrink-0" aria-hidden>
        <rect
          x="2"
          y="2"
          width="96"
          height="96"
          rx="26"
          strokeWidth="4"
          className="fill-night stroke-border"
        />
        <g transform="translate(5 4) scale(0.9)" className="fill-lime">
          <path d="M27 8a12 12 0 1 0 0 24a12 12 0 1 0 0-24ZM73 8a12 12 0 1 0 0 24a12 12 0 1 0 0-24ZM15 40Q15 38 18 38H32Q40 38 41 46Q42 54 50 54Q58 54 59 46Q60 38 68 38H82Q85 38 85 41V90Q85 92 82 92H65Q62 92 62 89V79Q62 69 50 69Q38 69 38 79V89Q38 92 35 92H18Q15 92 15 89Z" />
        </g>
      </svg>
      {/* Inline because the global .font-heading rule outranks utilities. */}
      <span
        className="font-heading text-foreground uppercase"
        style={{ fontWeight: 700, letterSpacing: "0.06em" }}
      >
        HuddleKit
      </span>
    </span>
  );
}
