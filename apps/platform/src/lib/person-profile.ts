import type { PersonTeam, ProfileState, TeamOption } from "@/components/store";
import type { huddlekit } from "@/lib/huddle-kit";
import { displayName, roleLabel } from "@/lib/people";
import type { PersonFile } from "@/lib/people-files";

/** What the API returns for one person. */
export type PersonDetail = Awaited<
  ReturnType<typeof huddlekit.people.retrievePerson>
>;

const NOT_GIVEN = "Not given";

/** Today as YYYY-MM-DD, to tell a current team place from an ended one. */
export const today = (): string => new Date().toISOString().slice(0, 10);

/** Team places that have not ended. One that ends today has ended, as in the API. Ended ones are history. */
export const currentMemberships = (detail: PersonDetail) =>
  detail.memberships.filter(
    (membership) => membership.endsOn === null || membership.endsOn > today()
  );

/** The teams the person is on now, with names looked up from the club's teams. */
export const personTeams = (
  detail: PersonDetail,
  allTeams: TeamOption[]
): PersonTeam[] => {
  const names = new Map(allTeams.map((team) => [team.id, team.name]));
  return currentMemberships(detail).map((membership) => ({
    endsOn: membership.endsOn,
    membershipId: membership.id,
    role: membership.role,
    shirtNumber: membership.shirtNumber,
    startsOn: membership.startsOn,
    teamId: membership.teamId,
    teamName: names.get(membership.teamId) ?? "Unknown team",
  }));
};

/** The documents on their record. The photo and cover are shown in the header. */
export const documentsOf = (files: PersonFile[]): PersonFile[] =>
  files.filter((entry) => entry.link.purpose === "document");

/**
 * Turns one person into the shape the profile components read. The detail
 * endpoint only knows team roles, so a club job such as treasurer does not
 * show here yet.
 */
export const toProfile = (
  detail: PersonDetail,
  files: PersonFile[]
): ProfileState => {
  const { address, person, playerProfile } = detail;
  const current = currentMemberships(detail);

  const roles = [
    ...new Set(current.map((membership) => roleLabel(membership.role))),
  ];
  const place = address
    ? [address.city, address.region].filter(Boolean).join(", ")
    : "";

  // How much of the contact record is filled in, as a percentage.
  const asked = [
    person.email,
    person.phone,
    person.dateOfBirth,
    person.addressId,
  ];
  const filled = asked.filter((value) => value !== null).length;

  const pictureOf = (purpose: "avatar" | "cover") =>
    files.find((entry) => entry.link.purpose === purpose)?.url ?? "";

  return {
    profileCompletion: Math.round((filled / asked.length) * 100),
    user: {
      avatar: pictureOf("avatar"),
      cover: pictureOf("cover"),
      department: playerProfile?.primaryPosition ?? "No position",
      email: person.email ?? NOT_GIVEN,
      files: documentsOf(files).length,
      joinedDate: new Date(person.createdAt).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      }),
      location: place === "" ? "No address" : place,
      name: displayName(person),
      online: false,
      phone: person.phone ?? NOT_GIVEN,
      role: roles.length === 0 ? "Club member" : roles.join(", "),
      teams: new Set(current.map((membership) => membership.teamId)).size,
      verified: person.userId !== null,
    },
  };
};
