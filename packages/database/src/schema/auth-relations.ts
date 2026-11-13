/**
 * How logins, sessions and clubs relate. Kept in one place because relation
 * parts replace each other per table: `users` and `organizations` can only be
 * declared once, and they point at tables in several files.
 */

import { defineRelationsPart } from "drizzle-orm";

import { accounts, passkeys, sessions, users } from "./authentication";
import { invitations } from "./club/club-invitations";
import { members, organizations } from "./club/clubs";
import { teams } from "./football/teams";
import { people } from "./people/people";

export const authRelations = defineRelationsPart(
  {
    accounts,
    invitations,
    members,
    organizations,
    passkeys,
    people,
    sessions,
    teams,
    users,
  },
  (r) => ({
    accounts: {
      user: r.one.users({
        from: r.accounts.userId,
        to: r.users.id,
      }),
    },
    invitations: {
      inviter: r.one.users({
        from: r.invitations.inviterId,
        to: r.users.id,
      }),
      organization: r.one.organizations({
        from: r.invitations.organizationId,
        to: r.organizations.id,
      }),
      person: r.one.people({
        from: [r.invitations.organizationId, r.invitations.personId],
        to: [r.people.organizationId, r.people.id],
      }),
      team: r.one.teams({
        from: [r.invitations.organizationId, r.invitations.teamId],
        to: [r.teams.organizationId, r.teams.id],
      }),
    },
    members: {
      organization: r.one.organizations({
        from: r.members.organizationId,
        to: r.organizations.id,
      }),
      user: r.one.users({
        from: r.members.userId,
        to: r.users.id,
      }),
    },
    organizations: {
      invitations: r.many.invitations({
        from: r.organizations.id,
        to: r.invitations.organizationId,
      }),
      members: r.many.members({
        from: r.organizations.id,
        to: r.members.organizationId,
      }),
    },
    passkeys: {
      user: r.one.users({
        from: r.passkeys.userId,
        to: r.users.id,
      }),
    },
    sessions: {
      user: r.one.users({
        from: r.sessions.userId,
        to: r.users.id,
      }),
    },
    users: {
      accounts: r.many.accounts({
        from: r.users.id,
        to: r.accounts.userId,
      }),
      invitations: r.many.invitations({
        from: r.users.id,
        to: r.invitations.inviterId,
      }),
      members: r.many.members({
        from: r.users.id,
        to: r.members.userId,
      }),
      passkeys: r.many.passkeys({
        from: r.users.id,
        to: r.passkeys.userId,
      }),
      sessions: r.many.sessions({
        from: r.users.id,
        to: r.sessions.userId,
      }),
    },
  })
);
