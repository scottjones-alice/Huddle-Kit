"use client";

import { useEffect, useMemo, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { huddlekit } from "@/lib/huddle-kit";
import { buildNav, filterNav, navPermissions, permissionKey } from "@/lib/nav";
import type { NavGroup, NavPermission } from "@/lib/nav";
import { displayName } from "@/lib/people";

export interface ShellClub {
  id: string;
  logo?: string | null;
  name: string;
  slug: string;
}

export interface ShellUser {
  email: string;
  id: string;
  image?: string | null;
  name: string;
  /** Who they are in this club, when they have a person record here. */
  personId?: string;
}

export type ShellState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "no-access" }
  | {
      club: ShellClub;
      clubs: ShellClub[];
      nav: NavGroup[];
      roleLabel: string;
      status: "ready";
      user: ShellUser;
    };

const capitalise = (value: string): string =>
  value.length === 0 ? value : `${value[0]?.toUpperCase()}${value.slice(1)}`;

interface Answers {
  forOrganization: string;
  map: Map<string, boolean>;
}

/** Asks Better Auth, once per permission, whether the active member holds it. */
const useAllowedPermissions = (
  organizationId: string | undefined,
  permissions: NavPermission[]
): Map<string, boolean> | null => {
  const [answers, setAnswers] = useState<Answers | null>(null);

  useEffect(() => {
    let canceled = false;
    const run = async () => {
      if (organizationId === undefined) {
        return;
      }
      const entries = await Promise.all(
        permissions.map(async (permission) => {
          const { data } = await authClient.organization.hasPermission({
            permissions: permission,
          });
          return [permissionKey(permission), data?.success === true] as const;
        })
      );
      if (!canceled) {
        setAnswers({ forOrganization: organizationId, map: new Map(entries) });
      }
    };
    void run();
    return () => {
      canceled = true;
    };
  }, [organizationId, permissions]);

  return answers !== null && answers.forOrganization === organizationId
    ? answers.map
    : null;
};

interface MyPerson {
  forOrganization: string;
  person: Awaited<
    ReturnType<typeof huddlekit.people.retrieveMyPerson>
  >["person"];
}

/**
 * Who the signed-in login is in the club. The login only says how they got
 * in; their name and photo are kept on their person record, the same one the
 * People page shows. Null while loading, or if the lookup fails.
 */
const useMyPerson = (organizationId: string | undefined): MyPerson | null => {
  const [mine, setMine] = useState<MyPerson | null>(null);

  useEffect(() => {
    let canceled = false;
    const run = async () => {
      if (organizationId === undefined) {
        return;
      }
      try {
        const { person } = await huddlekit.people.retrieveMyPerson();
        if (!canceled) {
          setMine({ forOrganization: organizationId, person });
        }
      } catch {
        // Keep showing the login's own name and photo.
      }
    };
    void run();
    return () => {
      canceled = true;
    };
  }, [organizationId]);

  return mine !== null && mine.forOrganization === organizationId ? mine : null;
};

/**
 * Everything the shell needs, from Better Auth: the signed-in user, the clubs
 * they belong to, the club in the address, their role in it, and the sidebar
 * links that role's permissions allow. It switches the active club to match
 * the address, so the API calls that follow are scoped to the right club.
 */
export const useShell = (slug: string): ShellState => {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const { data: clubs, isPending: clubsPending } =
    authClient.useListOrganizations();
  const { data: active } = authClient.useActiveOrganization();
  const { data: member } = authClient.useActiveMember();

  const club = clubs?.find((candidate) => candidate.slug === slug);
  const activeId = active?.id;
  const clubId = club?.id;

  useEffect(() => {
    if (clubId !== undefined && activeId !== clubId) {
      void authClient.organization.setActive({ organizationId: clubId });
    }
  }, [clubId, activeId]);

  const groups = useMemo(() => buildNav(slug), [slug]);
  const permissions = useMemo(() => navPermissions(groups), [groups]);
  // Only ask once the active club matches, or the answers would be for another.
  const allowed = useAllowedPermissions(
    activeId === clubId ? clubId : undefined,
    permissions
  );
  const mine = useMyPerson(activeId === clubId ? clubId : undefined);

  if (sessionPending || clubsPending) {
    return { status: "loading" };
  }
  if (!session) {
    return { status: "signed-out" };
  }
  if (club === undefined || !clubs) {
    return { status: "no-access" };
  }
  if (allowed === null || activeId !== clubId || !member) {
    return { status: "loading" };
  }

  return {
    club,
    clubs,
    nav: filterNav(
      groups,
      (permission) => allowed.get(permissionKey(permission)) === true
    ),
    roleLabel: capitalise(member.role),
    status: "ready",
    user: mine?.person
      ? {
          ...session.user,
          image: mine.person.avatarUrl ?? session.user.image,
          name: displayName(mine.person),
          personId: mine.person.id,
        }
      : session.user,
  };
};
