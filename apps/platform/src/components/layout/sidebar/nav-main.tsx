"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@alice/user-interface/components/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@alice/user-interface/components/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@alice/user-interface/components/sidebar";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NavGroup, NavLink } from "@/lib/nav";

interface NavMainProps {
  // Already filtered for the signed in person, see getNavGroups.
  groups: readonly NavGroup[];
}

const linkTarget = (item: NavLink) =>
  item.newTab === true ? "_blank" : undefined;
const linkRel = (item: NavLink) =>
  item.newTab === true ? "noopener noreferrer" : undefined;

function ItemBadges({ item }: { item: NavLink }) {
  return (
    <>
      {item.isComing === true ? (
        <SidebarMenuBadge className="peer-hover/menu-button:text-foreground opacity-50">
          Coming
        </SidebarMenuBadge>
      ) : null}
      {item.isNew === true ? (
        <SidebarMenuBadge className="border-chart-2 text-chart-2 peer-hover/menu-button:text-chart-2 border">
          New
        </SidebarMenuBadge>
      ) : null}
      {item.isDataBadge === undefined || item.isDataBadge === "" ? null : (
        <SidebarMenuBadge className="peer-hover/menu-button:text-foreground">
          {item.isDataBadge}
        </SidebarMenuBadge>
      )}
    </>
  );
}

export function NavMain({ groups }: NavMainProps) {
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.title}>
          <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {group.items.map((item) => {
                const Icon = item.icon;
                const children = item.items ?? [];

                return (
                  <SidebarMenuItem key={item.title}>
                    {children.length > 0 ? (
                      <>
                        <div className="hidden group-data-[collapsible=icon]:block">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <SidebarMenuButton tooltip={item.title}>
                                {Icon === undefined ? null : <Icon />}
                                <span>{item.title}</span>
                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                              </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              side={isMobile ? "bottom" : "right"}
                              align={isMobile ? "end" : "start"}
                              className="rounded-lg"
                            >
                              <DropdownMenuLabel>
                                {item.title}
                              </DropdownMenuLabel>
                              {children.map((child) => (
                                <DropdownMenuItem asChild key={child.href}>
                                  <Link href={child.href}>{child.title}</Link>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <Collapsible
                          className="group/collapsible block group-data-[collapsible=icon]:hidden"
                          defaultOpen={children.some(
                            (child) => child.href === pathname
                          )}
                        >
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip={item.title}>
                              {Icon === undefined ? null : <Icon />}
                              <span>{item.title}</span>
                              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {children.map((child) => (
                                <SidebarMenuSubItem key={child.href}>
                                  <SidebarMenuSubButton
                                    isActive={pathname === child.href}
                                    asChild
                                  >
                                    <Link
                                      href={child.href}
                                      target={linkTarget(child)}
                                      rel={linkRel(child)}
                                    >
                                      <span>{child.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </Collapsible>
                      </>
                    ) : (
                      <SidebarMenuButton
                        isActive={pathname === item.href}
                        tooltip={item.title}
                        asChild
                      >
                        <Link
                          href={item.href}
                          target={linkTarget(item)}
                          rel={linkRel(item)}
                        >
                          {Icon === undefined ? null : <Icon />}
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                    <ItemBadges item={item} />
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
