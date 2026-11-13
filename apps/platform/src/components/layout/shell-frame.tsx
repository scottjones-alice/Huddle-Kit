"use client";

import { Button } from "@alice/user-interface/components/button";
import {
  SidebarInset,
  SidebarProvider,
} from "@alice/user-interface/components/sidebar";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";

import { AppShellSkeleton } from "@/components/layout/app-shell-skeleton";
import { SiteHeader } from "@/components/layout/header";
import { NoAccess } from "@/components/layout/no-access";
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar";
import { StatusScreen } from "@/components/layout/status-screen";
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
      <StatusScreen
        icon={<LogIn />}
        title="You've been signed out"
        description="For your security, sessions end after a while. Sign in again and you'll land right back on this page."
        actions={
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/login?next=${encodeURIComponent(pathname)}`}>
              Sign in again
            </Link>
          </Button>
        }
      />
    );
  }
  if (shell.status === "no-access") {
    return <NoAccess title="this club" />;
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
