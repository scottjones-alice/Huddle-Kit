"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@alice/user-interface/components/avatar";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@alice/user-interface/components/dropdown-menu";
import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import type { ShellUser } from "@/lib/use-shell";

const MAX_INITIALS = 2;

export interface UserMenuProps {
  clubName?: string;
  // For example "Owner", shown under the name.
  roleLabel?: string;
  user: ShellUser;
}

export const initialsOf = (name: string): string =>
  name
    .split(" ")
    .filter((part) => part !== "")
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, MAX_INITIALS);

interface UserSummaryProps extends UserMenuProps {
  showEmail: boolean;
}

export function UserSummary({
  user,
  roleLabel,
  clubName,
  showEmail,
}: UserSummaryProps) {
  const subtitle = [roleLabel, clubName]
    .filter((part) => part !== undefined && part !== "")
    .join(", ");

  return (
    <>
      <Avatar className="rounded-full">
        {user.image === undefined || user.image === null ? null : (
          <AvatarImage src={user.image} alt={user.name} />
        )}
        <AvatarFallback className="rounded-full">
          {initialsOf(user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{user.name}</span>
        {subtitle === "" ? null : (
          <span className="text-muted-foreground truncate text-xs">
            {subtitle}
          </span>
        )}
        {showEmail || subtitle === "" ? (
          <span className="text-muted-foreground truncate text-xs">
            {user.email}
          </span>
        ) : null}
      </div>
    </>
  );
}

// The items inside the user dropdown, shared by the sidebar footer and the
// header avatar so the two can never drift apart.
export function UserMenuContent(props: UserMenuProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    // Leave either way: a failed request still means this session is done.
    await authClient.signOut().catch(() => null);
    router.replace("/signed-out");
  };

  return (
    <>
      <DropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
          <UserSummary {...props} showEmail />
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onSelect={() => {
          void handleSignOut();
        }}
      >
        <LogOutIcon />
        Log out
      </DropdownMenuItem>
    </>
  );
}
