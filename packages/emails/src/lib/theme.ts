/**
 * Design tokens for email. Emails can't use CSS variables or external
 * stylesheets, so components inline these values. Keep the palette small and
 * high-contrast: many clients ignore dark mode or invert colors unpredictably.
 */

export const colors = {
  background: "#f4f4f5",
  border: "#e4e4e7",
  card: "#ffffff",
  codeBackground: "#f4f4f5",
  muted: "#71717a",
  primary: "#18181b",
  primaryText: "#ffffff",
  text: "#27272a",
} as const;

export const fonts = {
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
} as const;

/** Spacing scale in px. */
export const space = {
  lg: 24,
  md: 16,
  sm: 8,
  xl: 32,
  xs: 4,
} as const;

/** 600px is the widest layout that renders well across desktop and mobile clients. */
export const CONTAINER_WIDTH = 600;
