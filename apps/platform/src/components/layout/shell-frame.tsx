"use client";

import {
  SidebarInset,
  SidebarProvider,
} from "@alice/user-interface/components/sidebar";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";

import { AppShellSkeleton } from "@/components/layout/app-shell-skeleton";
import { SiteHeader } from "@/components/layout/header";
import { NoAccess } from "@/components/layout/no-access";
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar";
import { useShell } from "@/lib/use-shell";

const SHELL_VARIABLES: CSSProperties & Record<`--${string}`, string> = {
  "--content-full-height":
    "calc(100vh - var(--header-height) - (var(--content-padding) * 2.2) - (var(--content-margin) * 2.2))",
  "--content-margin": "calc(var(--spacing) * 1.5)",
  "--content-padding": "calc(var(--spacing) * 6)",
  "--header-height": "calc(var(--spacing) * 14)",
  "--sidebar-width": "calc(var(--spacing) * 64)",
};

interface ShellFrameProps {
  children: ReactNode;
  defaultOpen: boolean;
}

export function ShellFrame({ children, defaultOpen }: ShellFrameProps) {
  const { slug } = useParams<{ slug: string }>();
  const pathname = usePathname();
  const shell = useShell(slug);

  if (shell.status === "loading") {
    return <AppShellSkeleton>{children}</AppShellSkeleton>;
  }
  // The proxy only checks that the cookie exists, so an expired session lands here.
  if (shell.status === "signed-out") {
    return (
      <div className="flex flex-col items-start gap-2 p-6">
        <h1 className="text-2xl font-semibold">Your session has ended</h1>
        <Link
          className="text-primary underline"
          href={`/login?next=${encodeURIComponent(pathname)}`}
        >
          Sign in again
        </Link>
      </div>
    );
  }
  if (shell.status === "no-access") {
    return (
      <div className="p-6">
        <NoAccess title="this club" />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={defaultOpen} style={SHELL_VARIABLES}>
      <AppSidebar shell={shell} />
      <SidebarInset>
        <SiteHeader shell={shell} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main p-(--content-padding)">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
