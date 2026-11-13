"use client";

import { MotionConfig } from "motion/react";
import { useEffect } from "react";

import { ThemeProvider } from "./theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  // Marks the page as interactive. End-to-end tests wait for it before touching
  // a form, because a submit before this point is a plain browser submit.
  useEffect(() => {
    document.documentElement.dataset.hydrated = "true";
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>{children}</ThemeProvider>
    </MotionConfig>
  );
}
