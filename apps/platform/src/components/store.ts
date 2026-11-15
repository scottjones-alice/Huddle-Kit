"use client";

import { createContext, useContext } from "react";

import type { PersonFile } from "@/lib/people-files";

/**
 * What the profile components read. The profile page fills it with the real
 * person through `ProfileProvider`; the values below are only what shows if a
 * component is rendered outside a provider.
 */
export interface ProfileState {
  profileCompletion: number;
  user: {
    avatar: string;
    // Empty when the person has no cover photo of their own.
    cover: string;
    department: string;
    email: string;
    // Documents on their record.
    files: number;
    joinedDate: string;
    location: string;
    name: string;
    online: boolean;
    phone: string;
    role: string;
    teams: number;
    verified: boolean;
  };
}

const placeholder: ProfileState = {
  profileCompletion: 82,
  user: {
    avatar: "",
    cover: "",
    department: "No department",
    email: "hi@shadcnuikit.com",
    files: 0,
    joinedDate: "March 2025",
    location: "San Francisco, US",
    name: "Toby Belhome",
    online: true,
    phone: "+1 (609) 972-22-22",
    role: "Developer",
    teams: 7,
    verified: true,
  },
};

const ProfileContext = createContext<ProfileState>(placeholder);

/** Wrap the profile components in this with the person they should show. */
export const ProfileProvider = ProfileContext.Provider;

/** Call with no argument for the whole state, or with a selector for one part. */
export function useProfileStore(): ProfileState;
export function useProfileStore<Selected>(
  select: (value: ProfileState) => Selected
): Selected;
export function useProfileStore<Selected>(
  select?: (value: ProfileState) => Selected
) {
  const value = useContext(ProfileContext);
  return select === undefined ? value : select(value);
}

/* -------------------------------------------------------------------------- */
/*                         Teams, files and what to do                         */
/* -------------------------------------------------------------------------- */

export const TEAM_ROLES = [
  "player",
  "coach",
  "assistant_coach",
  "manager",
  "volunteer",
] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

/** A team this person is on now. */
export interface PersonTeam {
  endsOn: string | null;
  membershipId: string;
  role: TeamRole;
  shirtNumber: number | null;
  startsOn: string;
  teamId: string;
  teamName: string;
}

/** A team in the club, for the "add to team" picker. */
export interface TeamOption {
  id: string;
  name: string;
}

/**
 * The person's teams and documents, and the things the profile can do to them.
 * Each action says why it failed itself, so callers only wait for it.
 */
export interface ProfileTools {
  addDocuments: (files: File[]) => Promise<void>;
  addToTeam: (input: {
    role: TeamRole;
    shirtNumber: number | null;
    startsOn: string;
    teamId: string;
  }) => Promise<boolean>;
  allTeams: TeamOption[];
  documents: PersonFile[];
  leaveTeam: (membershipId: string) => Promise<void>;
  openFile: (fileId: string) => Promise<void>;
  removeFile: (linkId: string) => Promise<void>;
  setImage: (purpose: "avatar" | "cover", file: File) => Promise<void>;
  teams: PersonTeam[];
}

// Outside the profile page there is nothing to change.
const nothing = async () => {
  await Promise.resolve();
};

const noTools: ProfileTools = {
  addDocuments: nothing,
  addToTeam: async () => await Promise.resolve(false),
  allTeams: [],
  documents: [],
  leaveTeam: nothing,
  openFile: nothing,
  removeFile: nothing,
  setImage: nothing,
  teams: [],
};

const ToolsContext = createContext<ProfileTools>(noTools);

export const ProfileToolsProvider = ToolsContext.Provider;

export const useProfileTools = (): ProfileTools => useContext(ToolsContext);
