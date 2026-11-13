"use client";

import { ScrollArea } from "@alice/user-interface/components/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@alice/user-interface/components/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { NavMain } from "@/components/layout/sidebar/nav-main";
import { NavUser } from "@/components/layout/sidebar/nav-user";
import Search from "@/components/layout/sidebar/search";
import { Logo } from "@/components/shared/logo";
import type { ShellState } from "@/lib/use-shell";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  shell: Extract<ShellState, { status: "ready" }>;
}

export function AppSidebar({ shell, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();

  // Already limited to what this member's role may open.
  const groups = shell.nav;

  // Close the mobile drawer after navigating.
  const previousPathname = React.useRef(pathname);
  React.useEffect(() => {
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      if (isMobile) {
        setOpenMobile(false);
      }
    }
  }, [pathname, isMobile, setOpenMobile]);

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="hover:text-foreground h-10 group-data-[collapsible=icon]:px-0!"
            >
              <Link href={`/${shell.club.slug}/dashboard`}>
                <Logo className="text-lg [&_svg]:size-8! group-data-[collapsible=icon]:[&_svg]:size-6! group-data-[collapsible=icon]:[&>span:last-child]:hidden" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <Search groups={groups} />
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="h-full">
          <NavMain groups={groups} />
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={shell.user}
          roleLabel={shell.roleLabel}
          clubName={shell.club.name}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
