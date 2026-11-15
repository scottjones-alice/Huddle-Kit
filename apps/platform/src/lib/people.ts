import { huddlekit } from "@/lib/huddle-kit";

/** One row of the club's people directory, as the API returns it. */
export type Person = Awaited<
  ReturnType<typeof huddlekit.people.list>
>["people"][number];

// The API caps a page at 200 rows.
const PAGE_SIZE = 200;

/**
 * Every person in the signed-in member's active club, archived ones included
 * so the table can filter on them. The API scopes the list to the session's
 * active organization, so call this only once that matches the page's club.
 */
export async function loadEveryone(): Promise<Person[]> {
  const everyone: Person[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    // Pages must be read in order: each one starts where the last ended.
    // oxlint-disable-next-line no-await-in-loop
    const { people } = await huddlekit.people.list({
      includeArchived: "true",
      limit: PAGE_SIZE,
      offset,
    });
    for (const person of people) {
      everyone.push(person);
    }
    if (people.length < PAGE_SIZE) {
      return everyone;
    }
  }
}

/** Archives or restores a person. People are never deleted, so history is kept. */
export async function setPersonActive(
  id: string,
  isActive: boolean
): Promise<void> {
  await huddlekit.people.updatePerson(id, { isActive });
}

/** What the club calls them: preferred name first, then surname. */
export const displayName = (person: {
  firstName: string;
  lastName: string;
  preferredName: string | null;
}): string => `${person.preferredName ?? person.firstName} ${person.lastName}`;

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  assistant_coach: "Assistant coach",
  coach: "Coach",
  first_aider: "First aider",
  head_coach: "Head coach",
  manager: "Manager",
  parent: "Parent",
  player: "Player",
  safeguarding_deputy: "Safeguarding deputy",
  safeguarding_lead: "Safeguarding lead",
  secretary: "Secretary",
  staff: "Staff",
  team_manager: "Team manager",
  treasurer: "Treasurer",
  volunteer: "Volunteer",
  welfare_officer: "Welfare officer",
};

export const roleLabel = (role: string): string => ROLE_LABELS[role] ?? role;

/**
 * Every role a person has, as labels with no repeats: their club jobs first,
 * then what they do on a team, then how they said they joined. "Player" on two
 * teams is still one "Player".
 */
export const rolesOf = (person: Person): string[] => {
  const labels = [
    ...person.roles,
    ...person.teams.map((team) => team.role),
    ...(person.joinedAs === null ? [] : [person.joinedAs]),
  ].map(roleLabel);
  return [...new Set(labels)];
};
