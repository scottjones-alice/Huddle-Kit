/**
 * An invitation to join a club. The invitation id is the secret in the emailed
 * link: the accept page looks it up, and only a login whose verified email
 * matches `email` may accept.
 *
 * An invitation can carry what the person will be on arrival: the access
 * `role`, a `person_id` for the club's existing record of them (a coach or
 * parent already in the directory), and a team to join with a `team_role`
 * (joining a team needs the person record, so it needs `person_id` too). The
 * team and person are tied to the same club by composite foreign keys, so an
 * invitation can't point at another club's team or person.
 *
 * At most one invitation per email and club can be pending.
 */

import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "../authentication";
import { TEAM_MEMBER_ROLES } from "../football/team-memberships";
import type { TeamMemberRole } from "../football/team-memberships";
import { teams } from "../football/teams";
import { people } from "../people/people";
import { isOneOf } from "../shared/constraints";
import { organizations } from "./clubs";

export const INVITATION_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "canceled",
] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const invitations = pgTable(
  "invitations",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    // Stored lower-case so one address can't be invited twice by changing its case.
    email: text("email").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    inviterId: uuid("inviter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    // The club's record of this person, if it already has one.
    personId: uuid("person_id"),
    // Access roles the person gets, comma-separated like `members.role`.
    role: text("role").default("member").notNull(),
    status: text("status")
      .$type<InvitationStatus>()
      .default("pending")
      .notNull(),
    // A team to add them to on arrival, and what they are there.
    teamId: uuid("team_id"),
    teamRole: text("team_role").$type<TeamMemberRole>(),
  },
  (table) => [
    check(
      "invitations_role_chk",
      sql`${table.role} ~ '^(owner|admin|member)(,(owner|admin|member))*$'`
    ),
    check("invitations_status_chk", isOneOf(table.status, INVITATION_STATUSES)),
    // A team and a team role come together, and joining a team needs the person record.
    check(
      "invitations_team_chk",
      sql`(${table.teamId} is null) = (${table.teamRole} is null) and (${table.teamId} is null or ${table.personId} is not null)`
    ),
    check(
      "invitations_teamRole_chk",
      sql`${table.teamRole} is null or ${isOneOf(table.teamRole, TEAM_MEMBER_ROLES)}`
    ),
    check("invitations_email_chk", sql`${table.email} = lower(${table.email})`),
    foreignKey({
      columns: [table.organizationId, table.personId],
      foreignColumns: [people.organizationId, people.id],
      name: "invitations_person_same_org_fkey",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.organizationId, table.teamId],
      foreignColumns: [teams.organizationId, teams.id],
      name: "invitations_team_same_org_fkey",
    }).onDelete("restrict"),
    index("invitations_email_idx").on(table.email),
    index("invitations_organizationId_idx").on(table.organizationId),
    uniqueIndex("invitations_organizationId_email_pending_uidx")
      .on(table.organizationId, table.email)
      .where(sql`${table.status} = 'pending'`),
  ]
);
