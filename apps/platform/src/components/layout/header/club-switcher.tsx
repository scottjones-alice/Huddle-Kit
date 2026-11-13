"use client";

import { Button } from "@alice/user-interface/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@alice/user-interface/components/dropdown-menu";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import type { ShellClub } from "@/lib/use-shell";

interface ClubSwitcherProps {
  club: ShellClub;
  clubs: ShellClub[];
}

// Switching club makes it Better Auth's active organization, then opens that
// club's dashboard.
export function ClubSwitcher({ club, clubs }: ClubSwitcherProps) {
  const router = useRouter();

  const handleSwitch = async (target: ShellClub) => {
    if (target.id === club.id) {
      return;
    }
    await authClient.organization.setActive({ organizationId: target.id });
    router.push(`/${target.slug}/dashboard`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <span className="max-w-48 truncate font-medium">{club.name}</span>
          {clubs.length > 1 ? <ChevronsUpDownIcon className="size-4" /> : null}
        </Button>
      </DropdownMenuTrigger>
      {clubs.length > 1 ? (
        <DropdownMenuContent align="start" className="min-w-56">
          <DropdownMenuLabel>Your clubs</DropdownMenuLabel>
          {clubs.map((candidate) => (
            <DropdownMenuItem
              key={candidate.id}
              onSelect={() => {
                void handleSwitch(candidate);
              }}
            >
              <span className="flex-1 truncate">{candidate.name}</span>
              {candidate.id === club.id ? <CheckIcon /> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      ) : null}
    </DropdownMenu>
  );
}
