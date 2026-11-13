import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { ShellFrame } from "@/components/layout/shell-frame";

const SIDEBAR_COOKIE = "sidebar_state";

// Reads the saved sidebar state, so it must sit inside a Suspense boundary.
// Who is signed in, and what they may open, is Better Auth's to say and is
// resolved in the browser by ShellFrame.
export async function AppShell({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const saved = cookieStore.get(SIDEBAR_COOKIE)?.value;
  const defaultOpen = saved === undefined || saved === "true";

  return <ShellFrame defaultOpen={defaultOpen}>{children}</ShellFrame>;
}
