import { serverOptions } from "@alice/environment/server";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const MIN_SECRET_LENGTH = 32;

/** Environment key declarations for @alice/authentication. */
export const keys = () =>
  createEnv({
    ...serverOptions,
    server: {
      // Parent domain the session cookie is shared on, e.g. "huddlekit.app", so the
      // website, platform and API (all subdomains) see the same session. Leave
      // unset on localhost: cookies already ignore ports there.
      AUTH_COOKIE_DOMAIN: z.string().min(1).optional(),
      // URL scheme of the native app: app.json "scheme", without "://".
      AUTH_NATIVE_SCHEME: z
        .string()
        .regex(/^[a-z][a-z0-9+.-]*$/u)
        .default("huddlekit"),
      BETTER_AUTH_SECRET: z.string().min(MIN_SECRET_LENGTH),
      BETTER_AUTH_URL: z.url(),
      // Passkeys are bound to this domain, e.g. "localhost" or "huddlekit.app".
      // It must be the site's registrable domain (or a parent of the sign-in host).
      PASSKEY_RP_ID: z.string().min(1).default("localhost"),
      PASSKEY_RP_NAME: z.string().min(1).default("Huddlekit"),
      // Where invite emails link to: the platform web app.
      PLATFORM_URL: z.url().default("http://localhost:8000"),
    },
  });
