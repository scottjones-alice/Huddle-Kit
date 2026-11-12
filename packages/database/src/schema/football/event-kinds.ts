/**
 * The kinds of event. Kept in its own file because both `events` and
 * `event_series` use them, and those two files import each other's tables.
 */

export const EVENT_KINDS = [
  "training",
  "match",
  "social",
  "meeting",
  "other",
] as const;
export type EventKind = (typeof EVENT_KINDS)[number];
