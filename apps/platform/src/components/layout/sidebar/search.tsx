"use client";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@alice/user-interface/components/command";
import {
  DialogHeader,
  DialogTitle,
} from "@alice/user-interface/components/dialog";
import { Kbd, KbdGroup } from "@alice/user-interface/components/kbd";
import { Label } from "@alice/user-interface/components/label";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@alice/user-interface/components/sidebar";
import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import type { NavGroup } from "@/lib/nav";

export default function Search({ groups }: { groups: readonly NavGroup[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((current) => !current);
      }
    };
    document.addEventListener("keydown", down);
    return () => {
      document.removeEventListener("keydown", down);
    };
  }, []);

  return (
    <>
      <SidebarGroup className="py-0 group-data-[collapsible=icon]:hidden">
        <SidebarGroupContent className="relative">
          <Label htmlFor="sidebar-search" className="sr-only">
            Search
          </Label>
          <SidebarInput
            id="sidebar-search"
            placeholder="Search..."
            className="cursor-pointer pl-8"
            readOnly
            onClick={() => {
              setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setOpen(true);
              }
            }}
          />
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
          <KbdGroup className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2">
            <Kbd>⌘K</Kbd>
          </KbdGroup>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarMenu className="hidden group-data-[collapsible=icon]:flex">
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Search"
            onClick={() => {
              setOpen(true);
            }}
          >
            <SearchIcon />
            <span>Search</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="sr-only">
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
        </div>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {groups.map((route) => (
            <React.Fragment key={route.title}>
              <CommandGroup heading={route.title}>
                {route.items.map((item, key) => (
                  <CommandItem
                    key={key}
                    onSelect={() => {
                      setOpen(false);
                      router.push(item.href);
                    }}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </React.Fragment>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
