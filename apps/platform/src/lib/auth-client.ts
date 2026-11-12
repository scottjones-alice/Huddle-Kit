"use client";

import { createWebAuthClient } from "@alice/authentication/client";

import { keys } from "./keys";

/** The one auth client for this app. Import it in client components. */
export const authClient = createWebAuthClient({
  baseURL: keys().NEXT_PUBLIC_API_URL,
});

export type Session = typeof authClient.$Infer.Session;
