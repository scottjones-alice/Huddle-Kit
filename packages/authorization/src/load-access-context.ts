/**
 * Builds an `AccessContext` for one login in one organization from the
 * database. Run it once per request, after the session says who and where,
 * and hand the result to `authorize`.
 */

import {
  members,
  people,
  personRelationships,
  roleAssignmentTeams,
  roleAssignments,
  teamMemberships,
} from "@alice/database";
import type { Database } from "@alice/database";
import { and, eq, inArray, isNull, or, gte, lte } from "drizzle-orm";

import type { AccessContext, LinkedChild, RoleGrant } from "./context";

export interface LoadAccessContextOptions {
  userId: string;
  organizationId: string;
  now?: Date;
}

const toDateString = (date: Date) => date.toISOString().slice(0, 10);

/** Active player teams for each person, keyed by person id. */
const loadPlayerTeams = async (
  db: Database,
  organizationId: string,
  personIds: string[],
  today: string
) => {
  const teamsByPerson = new Map<string, string[]>();
  if (personIds.length === 0) {
    return teamsByPerson;
  }

  const rows = await db
    .select({
      personId: teamMemberships.personId,
      teamId: teamMemberships.teamId,
    })
    .from(teamMemberships)
    .where(
      and(
        eq(teamMemberships.organizationId, organizationId),
        inArray(teamMemberships.personId, personIds),
        eq(teamMemberships.role, "player"),
        lte(teamMemberships.startsOn, today),
        or(isNull(teamMemberships.endsOn), gte(teamMemberships.endsOn, today))
      )
    );

  for (const row of rows) {
    const teams = teamsByPerson.get(row.personId) ?? [];
    teams.push(row.teamId);
    teamsByPerson.set(row.personId, teams);
  }
  return teamsByPerson;
};

const loadAssignments = async (
  db: Database,
  organizationId: string,
  userId: string
): Promise<RoleGrant[]> => {
  const rows = await db
    .select()
    .from(roleAssignments)
    .where(
      and(
        eq(roleAssignments.organizationId, organizationId),
        eq(roleAssignments.userId, userId)
      )
    );
  if (rows.length === 0) {
    return [];
  }

  const teamRows = await db
    .select({
      roleAssignmentId: roleAssignmentTeams.roleAssignmentId,
      teamId: roleAssignmentTeams.teamId,
    })
    .from(roleAssignmentTeams)
    .where(
      and(
        eq(roleAssignmentTeams.organizationId, organizationId),
        inArray(
          roleAssignmentTeams.roleAssignmentId,
          rows.map((row) => row.id)
        )
      )
    );

  const teamsByAssignment = new Map<string, string[]>();
  for (const { roleAssignmentId, teamId } of teamRows) {
    const teams = teamsByAssignment.get(roleAssignmentId) ?? [];
    teams.push(teamId);
    teamsByAssignment.set(roleAssignmentId, teams);
  }

  return rows.map((row) => ({
    endsAt: row.endsAt,
    role: row.role,
    scope: row.scope,
    startsAt: row.startsAt,
    teamIds: teamsByAssignment.get(row.id) ?? [],
  }));
};

const loadLinkedChildren = async (
  db: Database,
  organizationId: string,
  guardianPersonId: string,
  today: string
): Promise<LinkedChild[]> => {
  const links = await db
    .select({
      hasParentalResponsibility: personRelationships.hasParentalResponsibility,
      personId: personRelationships.personId,
    })
    .from(personRelationships)
    .where(
      and(
        eq(personRelationships.organizationId, organizationId),
        eq(personRelationships.relatedPersonId, guardianPersonId)
      )
    );

  const childIds = [...new Set(links.map((link) => link.personId))];
  const teamsByChild = await loadPlayerTeams(
    db,
    organizationId,
    childIds,
    today
  );

  // Several links to one child (parent and carer) merge; responsibility wins if any has it.
  const children = new Map<string, LinkedChild>();
  for (const link of links) {
    const existing = children.get(link.personId);
    children.set(link.personId, {
      hasParentalResponsibility:
        (existing?.hasParentalResponsibility ?? false) ||
        link.hasParentalResponsibility,
      personId: link.personId,
      teamIds: teamsByChild.get(link.personId) ?? [],
    });
  }
  return [...children.values()];
};

/** A non-member gets a context with a null `memberRole`, which denies everything. */
export const loadAccessContext = async (
  db: Database,
  { userId, organizationId, now = new Date() }: LoadAccessContextOptions
): Promise<AccessContext> => {
  const today = toDateString(now);

  const [membership] = await db
    .select({ role: members.role })
    .from(members)
    .where(
      and(
        eq(members.organizationId, organizationId),
        eq(members.userId, userId)
      )
    )
    .limit(1);

  if (membership === undefined) {
    return {
      assignments: [],
      linkedChildren: [],
      memberRole: null,
      organizationId,
      personId: null,
      player: null,
      userId,
    };
  }

  const [ownPeople, assignments] = await Promise.all([
    db
      .select({ id: people.id })
      .from(people)
      .where(
        and(
          eq(people.organizationId, organizationId),
          eq(people.userId, userId)
        )
      )
      .limit(1),
    loadAssignments(db, organizationId, userId),
  ]);
  const [person] = ownPeople;

  if (person === undefined) {
    return {
      assignments,
      linkedChildren: [],
      memberRole: membership.role,
      organizationId,
      personId: null,
      player: null,
      userId,
    };
  }

  const [ownTeams, linkedChildren] = await Promise.all([
    loadPlayerTeams(db, organizationId, [person.id], today),
    loadLinkedChildren(db, organizationId, person.id, today),
  ]);
  const playerTeams = ownTeams.get(person.id);

  return {
    assignments,
    linkedChildren,
    memberRole: membership.role,
    organizationId,
    personId: person.id,
    player: playerTeams === undefined ? null : { teamIds: playerTeams },
    userId,
  };
};
