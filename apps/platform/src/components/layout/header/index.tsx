"use client";

import { Button } from "@alice/user-interface/components/button";
import { Separator } from "@alice/user-interface/components/separator";
import { useSidebar } from "@alice/user-interface/components/sidebar";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { ClubSwitcher } from "@/components/layout/header/club-switcher";
import { Notifications } from "@/components/layout/header/notifications";
import ThemeSwitch from "@/components/layout/header/theme-switch";
import UserMenu from "@/components/layout/header/user-menu";
import type { ShellState } from "@/lib/use-shell";

export function SiteHeader({
  shell,
}: {
  shell: Extract<ShellState, { status: "ready" }>;
}) {
  const { toggleSidebar, open } = useSidebar();

  return (
    <header className="bg-background/40 sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center gap-2 border-b backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) md:rounded-tl-xl md:rounded-tr-xl">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2">
        <Button
          onClick={toggleSidebar}
          size="icon"
          variant="ghost"
          aria-label="Toggle sidebar"
        >
          {open ? <PanelLeftClose /> : <PanelLeftOpen />}
        </Button>
        <ClubSwitcher club={shell.club} clubs={shell.clubs} />

        <div className="ml-auto flex items-center gap-2">
          <Notifications userId={shell.user.id} />
          <ThemeSwitch />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
          />
          <UserMenu
            user={shell.user}
            roleLabel={shell.roleLabel}
            clubName={shell.club.name}
          />
        </div>
      </div>
    </header>
  );
}
