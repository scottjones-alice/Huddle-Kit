import {
  CalendarIcon,
  CreditCardIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  MegaphoneIcon,
  SettingsIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  TrophyIcon,
  UserRoundIcon,
  UsersIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * A permission in Better Auth's organization access control: a resource and the
 * actions needed on it, for example `{ teams: ["read"] }`. The names come from
 * `footballStatement` in @alice/authorization.
 */
export type NavPermission = Record<string, string[]>;

export interface NavLink {
  href: string;
  icon?: LucideIcon;
  isComing?: boolean;
  isDataBadge?: string;
  isNew?: boolean;
  items?: NavLink[];
  newTab?: boolean;
  /** Left out means everyone in the club sees it. */
  require?: NavPermission;
  title: string;
}

export interface NavGroup {
  items: NavLink[];
  title: string;
}

/** The sidebar for one club. Each link names the permission needed to see it. */
export const buildNav = (slug: string): readonly NavGroup[] => {
  const to = (path: string) => `/${slug}/${path}`;
  return [
    {
      items: [
        {
          href: to("dashboard"),
          icon: LayoutDashboardIcon,
          title: "Dashboard",
        },
        {
          href: to("calendar"),
          icon: CalendarIcon,
          require: { training: ["read"] },
          title: "Calendar",
        },
      ],
      title: "Overview",
    },
    {
      items: [
        {
          href: to("teams"),
          icon: UsersIcon,
          require: { teams: ["read"] },
          title: "Teams",
        },
        {
          href: to("people"),
          icon: UserRoundIcon,
          require: { players: ["read"] },
          title: "People",
        },
        {
          href: to("fixtures"),
          icon: TrophyIcon,
          require: { fixtures: ["read"] },
          title: "Fixtures",
        },
        {
          href: to("announcements"),
          icon: MegaphoneIcon,
          require: { communications: ["read"] },
          title: "Announcements",
        },
      ],
      title: "Club",
    },
    {
      items: [
        {
          href: to("payments"),
          icon: CreditCardIcon,
          require: { finance: ["read"] },
          title: "Payments",
        },
      ],
      title: "Money",
    },
    {
      items: [
        {
          href: to("compliance"),
          icon: ShieldCheckIcon,
          require: { credentials: ["read"] },
          title: "Compliance",
        },
        {
          href: to("safeguarding"),
          icon: ShieldAlertIcon,
          require: { safeguarding: ["read_assigned"] },
          title: "Safeguarding",
        },
        {
          href: to("documents"),
          icon: FileTextIcon,
          require: { documents: ["read"] },
          title: "Documents",
        },
      ],
      title: "Compliance",
    },
    {
      items: [
        {
          href: to("settings"),
          icon: SettingsIcon,
          require: { clubs: ["update"] },
          title: "Club settings",
        },
      ],
      title: "Admin",
    },
  ];
};

/** Keeps only the links the person may open, and drops groups left empty. */
export const filterNav = (
  groups: readonly NavGroup[],
  allowed: (permission: NavPermission) => boolean
): NavGroup[] => {
  const kept: NavGroup[] = [];
  for (const group of groups) {
    const items = group.items.filter(
      (item) => item.require === undefined || allowed(item.require)
    );
    if (items.length > 0) {
      kept.push({ ...group, items });
    }
  }
  return kept;
};

/** Every permission the nav asks about, so each is checked once. */
export const navPermissions = (groups: readonly NavGroup[]): NavPermission[] =>
  groups.flatMap((group) =>
    group.items.flatMap((item) =>
      item.require === undefined ? [] : [item.require]
    )
  );

/** A stable key for a permission, used to look up its answer. */
export const permissionKey = (permission: NavPermission): string =>
  JSON.stringify(
    Object.entries(permission).toSorted(([a], [b]) => a.localeCompare(b))
  );
