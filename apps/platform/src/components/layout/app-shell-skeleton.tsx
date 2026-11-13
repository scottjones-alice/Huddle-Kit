import { Skeleton } from "@alice/user-interface/components/skeleton";
import type { ReactNode } from "react";

// Static stand-in for the app shell while the saved sidebar state loads.
// It has the same footprint, so the page does not jump when the shell arrives.
// Pass the page as children to keep it in the prerendered shell.
export function AppShellSkeleton({ children }: { children?: ReactNode }) {
  return (
    <div className="bg-sidebar flex min-h-svh w-full">
      <aside className="hidden w-64 shrink-0 flex-col gap-4 p-4 md:flex">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-9 w-full" />
        <div className="flex flex-col gap-2 pt-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </aside>
      <div className="bg-background flex min-w-0 flex-1 flex-col md:m-2 md:ml-0 md:rounded-xl">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Skeleton className="size-9" />
          <Skeleton className="h-9 w-40" />
        </div>
        {children === undefined ? (
          <div className="flex flex-col gap-4 p-6">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="p-6">{children}</div>
        )}
      </div>
    </div>
  );
}
