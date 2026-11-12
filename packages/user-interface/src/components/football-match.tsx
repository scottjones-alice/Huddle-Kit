import { cn } from "cn";

import styles from "../styles/football-loading.module.css";

interface FootballMatchProps {
  className?: string;
  /** Freeze the illustration without removing it. */
  paused?: boolean;
  celebration?: boolean;
}

const PLAYERS = [
  { id: "keeper-home", skin: "#bd805b", team: "home", x: 76, y: 155 },
  { id: "defender-home", skin: "#f3c49c", team: "home", x: 137, y: 111 },
  { id: "passer", skin: "#905c40", team: "home", x: 177, y: 183 },
  { id: "winger", skin: "#e2a77d", team: "home", x: 261, y: 92 },
  { id: "striker", skin: "#bd805b", team: "home", x: 326, y: 172 },
  { id: "keeper-away", skin: "#e2a77d", team: "away", x: 402, y: 154 },
  { id: "defender-away", skin: "#905c40", team: "away", x: 345, y: 114 },
  { id: "midfielder-away", skin: "#f3c49c", team: "away", x: 271, y: 194 },
  { id: "winger-away", skin: "#bd805b", team: "away", x: 218, y: 129 },
  { id: "forward-away", skin: "#e2a77d", team: "away", x: 143, y: 213 },
] as const;

function MiniPlayer({ player }: { player: (typeof PLAYERS)[number] }) {
  return (
    <g transform={`translate(${player.x} ${player.y})`}>
      <g
        className={styles.player}
        data-player={player.id}
        data-team={player.team}
      >
        <ellipse cy="8" fill="#092c20" opacity="0.25" rx="12" ry="4" />
        <g className={styles.playerBody}>
          <path
            d="M-4 0v8m8-8v8"
            stroke="#f5f4e9"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <path
            d="M-5 10h-3m12 0h3"
            stroke="#172b25"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <path
            d="m-8-13-5 9m21-9 5 9"
            stroke={player.skin}
            strokeLinecap="round"
            strokeWidth="4"
          />
          <path d="M-7-6h14v8H-7z" fill="#173c2d" />
          <path
            className={styles.shirt}
            d="m-7-17-5 7 5 3v3H7v-3l5-3-5-7Z"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <path d="M-1-13h2v6h-2z" fill="#153928" opacity="0.5" />
          <circle cy="-23" fill={player.skin} r="6" />
          <path d="M-6-23a6 6 0 0 1 12-1l-4-2-7 3Z" fill="#312b26" />
        </g>
      </g>
    </g>
  );
}

/** A lightweight vector illustration. Its match is decorative, never a progress estimate. */
function FootballMatch({
  className,
  paused = false,
  celebration = false,
}: FootballMatchProps) {
  return (
    <div
      className={cn(styles.match, className)}
      data-paused={paused}
      data-celebration={celebration}
      aria-hidden="true"
    >
      <svg
        className={styles.scene}
        viewBox="0 0 480 326"
        fill="none"
        focusable="false"
      >
        <ellipse
          cx="240"
          cy="287"
          rx="200"
          ry="19"
          fill="#071c15"
          opacity="0.13"
        />
        <rect x="34" y="42" width="412" height="246" rx="23" fill="#123c2d" />
        <rect x="34" y="32" width="412" height="246" rx="23" fill="#286044" />
        <path
          d="M93 33h49v244H93zm98 0h49v244h-49zm98 0h49v244h-49zm98 0h35a23 23 0 0 1 23 23v198a23 23 0 0 1-23 23h-35Z"
          fill="#306b4c"
        />
        <rect
          x="53"
          y="50"
          width="374"
          height="209"
          rx="2"
          stroke="#dceccf"
          strokeOpacity="0.65"
          strokeWidth="1.5"
        />
        <g stroke="#dceccf" strokeOpacity="0.65" strokeWidth="1.5">
          <path d="M240 50v209M53 102h56v104H53m374-104h-56v104h56M53 127h22v55H53m374-55h-22v55h22" />
          <circle cx="240" cy="154" r="32" />
          <path d="M109 129a32 32 0 0 1 0 50m262-50a32 32 0 0 0 0 50" />
          <path d="M53 60a10 10 0 0 0 10-10m354 0a10 10 0 0 0 10 10M53 249a10 10 0 0 1 10 10m354 0a10 10 0 0 1 10-10" />
        </g>
        <g fill="#dceccf" opacity="0.8">
          <circle cx="240" cy="154" r="2" />
          <circle cx="94" cy="154" r="2" />
          <circle cx="386" cy="154" r="2" />
        </g>
        <g stroke="#f5f4e9" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M53 128H28v54h25m374-54h25v54h-25"
            fill="#f5f4e9"
            fillOpacity="0.08"
            strokeOpacity="0.65"
            strokeWidth="2"
          />
          <path
            d="M29 137h23m-23 9h23m-23 9h23m-23 9h23m-23 9h23m-16-45v54m8-54v54m383-45h23m-23 9h23m-23 9h23m-23 9h23m-23 9h23m-16-45v54m8-54v54"
            strokeOpacity="0.24"
          />
          <path d="M53 128v54m374-54v54" strokeWidth="3" />
        </g>
        <g stroke="#f5f4e9" strokeWidth="2">
          <path d="M51 50V35m378 15V35M51 259v-15m378 15v-15" />
        </g>
        <g fill="#d4ff00">
          <path d="m52 34 10 4-10 4Zm378 0 10 4-10 4ZM52 243l10 4-10 4Zm378 0 10 4-10 4Z" />
        </g>
        <g className={styles.goalGlow}>
          <circle cx="434" cy="155" r="22" stroke="#d4ff00" strokeWidth="2" />
          <path
            d="m437 119 2-8m19 18 7-5m-5 29 9 1m-15 27 7 5m-27 4 2 9"
            stroke="#d4ff00"
            strokeLinecap="round"
            strokeWidth="3"
          />
        </g>
        {PLAYERS.map((player) => (
          <MiniPlayer key={player.id} player={player} />
        ))}
        <g className={styles.ball}>
          <ellipse cy="6" rx="7" ry="3" fill="#092c20" opacity="0.3" />
          <g className={styles.ballSpin}>
            <circle r="6" fill="#fffdf1" stroke="#173c2d" strokeWidth="0.8" />
            <path
              d="m0-3 3 2-1 3h-4l-1-3Zm-4-1-1-1m9 1 1-1M0 4v2"
              fill="#243c31"
              stroke="#243c31"
              strokeWidth="0.9"
            />
          </g>
        </g>
        <g className={styles.cheer}>
          <rect x="189" y="7" width="102" height="28" rx="14" fill="#d4ff00" />
          <text
            x="240"
            y="26"
            fill="#193426"
            textAnchor="middle"
            fontSize="12"
            fontWeight="800"
            letterSpacing="2"
          >
            GET IN!
          </text>
        </g>
        <g fill="#a5b5a6" opacity="0.7">
          <circle cx="205" cy="306" r="2" />
          <circle cx="240" cy="306" r="2" />
          <circle cx="275" cy="306" r="2" />
        </g>
      </svg>
    </div>
  );
}

export { FootballMatch };
export type { FootballMatchProps };
