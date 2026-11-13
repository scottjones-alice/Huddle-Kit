import { cors as honoCors } from "hono/cors";

import { keys } from "@/keys";

const PREFLIGHT_MAX_AGE_SECONDS = 600;

export function cors() {
  const { CORS_ORIGINS } = keys();

  return honoCors({
    // The generated SDK adds its own X-Scalar-* headers to every request, and a
    // browser blocks the call unless the preflight lists them.
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Request-Id",
      "X-Scalar-Arch",
      "X-Scalar-Lang",
      "X-Scalar-OS",
      "X-Scalar-Package-Version",
      "X-Scalar-Retry-Count",
      "X-Scalar-Runtime",
      "X-Scalar-Runtime-Version",
      "X-Scalar-Timeout",
    ],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    // Auth sessions are cookies, so the browser must be allowed to send them.
    credentials: true,
    exposeHeaders: ["X-Request-Id"],
    maxAge: PREFLIGHT_MAX_AGE_SECONDS,
    origin: CORS_ORIGINS,
  });
}
