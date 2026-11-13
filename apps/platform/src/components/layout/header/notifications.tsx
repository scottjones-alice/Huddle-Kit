"use client";

import { Inbox } from "@novu/react";
import { inboxDarkTheme } from "@novu/react/themes";
import { useTheme } from "next-themes";

import { keys } from "@/lib/keys";

// Novu draws its own light UI, so it is pointed at the app's colour variables
// and switched to its dark base theme when the app is dark.
const INBOX_VARIABLES = {
  colorBackground: "var(--popover)",
  colorForeground: "var(--foreground)",
  colorNeutral: "var(--foreground)",
  colorPrimary: "var(--primary)",
} as const;

// The Novu in-app inbox, addressed by the Better Auth user id (the backend
// registers each user as a Novu subscriber under that id). Without an
// application identifier there is nothing to connect to, so no bell shows.
// Before production, add a subscriber hash from the backend so the inbox
// cannot be opened for someone else's id.
export function Notifications({ userId }: { userId: string }) {
  const { resolvedTheme } = useTheme();
  const applicationIdentifier = keys().NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER;
  if (applicationIdentifier === undefined) {
    return null;
  }

  return (
    <Inbox
      applicationIdentifier={applicationIdentifier}
      subscriber={userId}
      appearance={{
        baseTheme: resolvedTheme === "dark" ? inboxDarkTheme : undefined,
        variables: INBOX_VARIABLES,
      }}
    />
  );
}
