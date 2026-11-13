import type { ReactNode } from "react";
import { Suspense } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { AppShellSkeleton } from "@/components/layout/app-shell-skeleton";

export default function AppLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <Suspense fallback={<AppShellSkeleton />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
