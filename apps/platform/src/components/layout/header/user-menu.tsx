"use client";

import {
  Avatar,
  AvatarFallback,
} from "@alice/user-interface/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@alice/user-interface/components/dropdown-menu";

import {
  initialsOf,
  UserMenuContent,
} from "@/components/layout/user-menu-content";
import type { UserMenuProps } from "@/components/layout/user-menu-content";

export default function UserMenu(props: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="focus-visible:ring-ring/50 rounded-full outline-none focus-visible:ring-3"
        aria-label="Open user menu"
      >
        <Avatar>
          <AvatarFallback>{initialsOf(props.user.name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <UserMenuContent {...props} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
