import { people, seasons, teamMemberships, teams } from "@alice/database";
import type { Database, TeamMemberRole } from "@alice/database";
import { and, asc, eq, gt, isNull, or } from "drizzle-orm";

import { conflict, forbidden, notFound } from "@/lib/app-error";
import { isForeignKeyViolation, isUniqueViolation } from "@/lib/sql-errors";
import { canCoachTeam } from "@/services/access";
import type { Caller } from "@/services/access";
import { ownPersonId, childIdsOf } from "@/services/people";

const today = (): string => new Date().toISOString().slice(0, 10);

export interface SeasonInput {
  endsOn: string;
  isCurrent?: boolean;
  name: string;
  startsOn: string;
}

/** Making a season current un-currents the old one, in one step, because only one can be current. */
export const createSeason = async (
  db: Database,
  organizationId: string,
  input: SeasonInput
) => {
  try {
    return await db.transaction(async (tx) => {
      if (input.isCurrent === true) {
        await tx
          .update(seasons)
          .set({ isCurrent: false })
          .where(eq(seasons.organizationId, organizationId));
      }
      const [row] = await tx
        .insert(seasons)
        .values({ ...input, organizationId })
        .returning();
      if (row === undefined) {
        throw new Error("Season insert returned no row");
      }
      return row;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflict("A season with that name already exists");
    }
    throw error;
  }
};

export const updateSeason = async (
  db: Database,
  organizationId: string,
  id: string,
  changes: Partial<SeasonInput>
) => {
  try {
    return await db.transaction(async (tx) => {
      if (changes.isCurrent === true) {
        await tx
          .update(seasons)
          .set({ isCurrent: false })
          .where(eq(seasons.organizationId, organizationId));
      }
      const [row] = await tx
        .update(seasons)
        .set(changes)
        .where(
          and(eq(seasons.organizationId, organizationId), eq(seasons.id, id))
        )
        .returning();
      if (row === undefined) {
        throw notFound("Season");
      }
      return row;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflict("A season with that name already exists");
    }
    throw error;
  }
};

export interface TeamInput {
  ageGroup?: number | null;
  name: string;
  seasonId: string;
  trainingVenueId?: string | null;
}

export const createTeam = async (
  db: Database,
  organizationId: string,
  input: TeamInput
) => {
  try {
    const [row] = await db
      .insert(teams)
      .values({ ...input, organizationId })
      .returning();
    if (row === undefined) {
      throw new Error("Team insert returned no row");
    }
    return row;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflict("That season already has a team with that name");
    }
    if (isForeignKeyViolation(error)) {
      throw notFound("Season or venue");
    }
    throw error;
  }
};

export const updateTeam = async (
  db: Database,
  organizationId: string,
  id: string,
  changes: Partial<TeamInput> & { isActive?: boolean }
) => {
  try {
    const [row] = await db
      .update(teams)
      .set(changes)
      .where(and(eq(teams.organizationId, organizationId), eq(teams.id, id)))
      .returning();
    if (row === undefined) {
      throw notFound("Team");
    }
    return row;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflict("That season already has a team with that name");
    }
    if (isForeignKeyViolation(error)) {
      throw notFound("Season or venue");
    }
    throw error;
  }
};

export const getTeam = async (
  db: Database,
  organizationId: string,
  id: string
) => {
  const [row] = await db
    .select()
    .from(teams)
    .where(and(eq(teams.organizationId, organizationId), eq(teams.id, id)));
  if (row === undefined) {
    throw notFound("Team");
  }
  return row;
};

/** People currently on a team, with their names. Ended memberships are history, not the roster. */
const currentRoster = async (db: Database, teamId: string) =>
  await db
    .select({
      endsOn: teamMemberships.endsOn,
      firstName: people.firstName,
      id: teamMemberships.id,
      lastName: people.lastName,
      personId: teamMemberships.personId,
      role: teamMemberships.role,
      shirtNumber: teamMemberships.shirtNumber,
      startsOn: teamMemberships.startsOn,
    })
    .from(teamMemberships)
    .innerJoin(people, eq(people.id, teamMemberships.personId))
    .where(
      and(
        eq(teamMemberships.teamId, teamId),
        or(isNull(teamMemberships.endsOn), gt(teamMemberships.endsOn, today()))
      )
    )
    .orderBy(asc(people.lastName), asc(people.firstName));

/**
 * The roster of a team. Coaches of the team and club admins see everyone.
 * A parent or player on the team sees it too. Anyone else gets 404.
 */
export const getRoster = async (
  db: Database,
  caller: Caller,
  teamId: string
) => {
  await getTeam(db, caller.organizationId, teamId);
  const roster = await currentRoster(db, teamId);
  if (canCoachTeam(caller, teamId)) {
    return roster;
  }
  const own = await ownPersonId(db, caller);
  const children = await childIdsOf(db, caller, own);
  const mine = new Set([...(own === null ? [] : [own]), ...children]);
  if (roster.some((member) => mine.has(member.personId))) {
    return roster;
  }
  throw notFound("Team");
};

export interface MembershipInput {
  personId: string;
  role: TeamMemberRole;
  shirtNumber?: number | null;
  startsOn?: string;
}

export const addToTeam = async (
  db: Database,
  caller: Caller,
  teamId: string,
  input: MembershipInput
) => {
  await getTeam(db, caller.organizationId, teamId);
  if (!canCoachTeam(caller, teamId)) {
    throw forbidden("You do not coach this team");
  }
  try {
    const [row] = await db
      .insert(teamMemberships)
      .values({
        ...input,
        organizationId: caller.organizationId,
        startsOn: input.startsOn ?? today(),
        teamId,
      })
      .returning();
    if (row === undefined) {
      throw new Error("Membership insert returned no row");
    }
    return row;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflict("They are already on that team in that role");
    }
    if (isForeignKeyViolation(error)) {
      throw notFound("Person");
    }
    throw error;
  }
};

/** Ends a membership today. The row stays: it is the record of who played for the team and when. */
export const endMembership = async (
  db: Database,
  caller: Caller,
  id: string
) => {
  const [current] = await db
    .select()
    .from(teamMemberships)
    .where(
      and(
        eq(teamMemberships.organizationId, caller.organizationId),
        eq(teamMemberships.id, id)
      )
    );
  if (current === undefined) {
    throw notFound("Membership");
  }
  if (!canCoachTeam(caller, current.teamId)) {
    throw forbidden("You do not coach this team");
  }
  const endsOn = today() < current.startsOn ? current.startsOn : today();
  const [row] = await db
    .update(teamMemberships)
    .set({ endsOn })
    .where(eq(teamMemberships.id, id))
    .returning();
  if (row === undefined) {
    throw notFound("Membership");
  }
  return row;
};
