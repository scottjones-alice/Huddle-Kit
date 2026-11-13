import {
  CLUB_MEMBER_ROLES,
  invitations,
  members,
  organizations,
  people,
  teamMemberships,
  users,
} from "@alice/database";
import type { ClubMemberRole, Database, TeamMemberRole } from "@alice/database";
import type { InvitationRecord } from "@alice/database/validation";
import { and, asc, count, eq, gt, isNull } from "drizzle-orm";

import { conflict, forbidden, invalid, notFound } from "@/lib/app-error";
import { isForeignKeyViolation, isUniqueViolation } from "@/lib/sql-errors";
import type { Caller } from "@/services/access";
import { requireManager } from "@/services/access";

const INVITATION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const ALREADY_IN_A_CLUB = "This login already belongs to a club";
const SLUG_TAKEN = "That club address is already taken";

/** The login that is acting, as the session reports it. */
export interface SignedInUser {
  email: string;
  emailVerified: boolean;
  id: string;
}

const isClubRole = (value: string): value is ClubMemberRole =>
  CLUB_MEMBER_ROLES.some((role) => role === value);

/** Splits a stored role list ("admin,member") into known roles. */
export const parseRoles = (list: string): ClubMemberRole[] =>
  list
    .split(",")
    .map((role) => role.trim())
    .filter(isClubRole);

/** Stores roles once each, in a fixed order, always including `member`. */
export const joinRoles = (roles: readonly ClubMemberRole[]): string => {
  const wanted = new Set<ClubMemberRole>([...roles, "member"]);
  return CLUB_MEMBER_ROLES.filter((role) => wanted.has(role)).join(",");
};

/** The signed-in user's club and what they are in it, or null if they have none yet. */
export const findMembership = async (db: Database, userId: string) => {
  const [row] = await db
    .select({
      club: {
        id: organizations.id,
        logo: organizations.logo,
        name: organizations.name,
        slug: organizations.slug,
      },
      memberId: members.id,
      role: members.role,
    })
    .from(members)
    .innerJoin(organizations, eq(organizations.id, members.organizationId))
    .where(eq(members.userId, userId));
  if (row === undefined) {
    return null;
  }
  return {
    club: row.club,
    memberId: row.memberId,
    roles: parseRoles(row.role),
  };
};

/** Starts a club with the caller as its owner. A login can only ever have one club. */
export const createClub = async (
  db: Database,
  userId: string,
  input: { name: string; slug: string }
) => {
  if ((await findMembership(db, userId)) !== null) {
    throw conflict(ALREADY_IN_A_CLUB);
  }
  try {
    return await db.transaction(async (tx) => {
      const [club] = await tx
        .insert(organizations)
        .values({ createdAt: new Date(), name: input.name, slug: input.slug })
        .returning({
          id: organizations.id,
          logo: organizations.logo,
          name: organizations.name,
          slug: organizations.slug,
        });
      if (club === undefined) {
        throw new Error("The club was not created");
      }
      await tx.insert(members).values({
        createdAt: new Date(),
        organizationId: club.id,
        role: joinRoles(["owner"]),
        userId,
      });
      return club;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      // Either the slug, or a second club created at the same moment.
      throw conflict(
        (await findMembership(db, userId)) === null
          ? SLUG_TAKEN
          : ALREADY_IN_A_CLUB
      );
    }
    throw error;
  }
};

/** Everyone with a login to the caller's club. */
export const listMembers = async (db: Database, organizationId: string) =>
  await db
    .select({
      email: users.email,
      id: members.id,
      image: users.image,
      joinedAt: members.createdAt,
      name: users.name,
      role: members.role,
      userId: users.id,
    })
    .from(members)
    .innerJoin(users, eq(users.id, members.userId))
    .where(eq(members.organizationId, organizationId))
    .orderBy(asc(users.name));

const ownerCount = async (db: Database, organizationId: string) => {
  const rows = await db
    .select({ role: members.role })
    .from(members)
    .where(eq(members.organizationId, organizationId));
  let owners = 0;
  for (const row of rows) {
    if (new Set(parseRoles(row.role)).has("owner")) {
      owners += 1;
    }
  }
  return owners;
};

const findMember = async (
  db: Database,
  organizationId: string,
  memberId: string
) => {
  const [row] = await db
    .select()
    .from(members)
    .where(
      and(eq(members.id, memberId), eq(members.organizationId, organizationId))
    );
  if (row === undefined) {
    throw notFound("Member");
  }
  return row;
};

/** Only an owner can give or take away the owner role. */
const requireOwnerFor = (caller: Caller, roles: readonly ClubMemberRole[]) => {
  if (roles.includes("owner") && !caller.memberRoles.has("owner")) {
    throw forbidden("Only a club owner can do this");
  }
};

export const changeMemberRoles = async (
  db: Database,
  caller: Caller,
  memberId: string,
  roles: readonly ClubMemberRole[]
) => {
  requireManager(caller);
  const member = await findMember(db, caller.organizationId, memberId);
  const before = new Set(parseRoles(member.role));
  // Changing an owner, or making one, is an owner's job.
  requireOwnerFor(caller, before.has("owner") ? ["owner"] : roles);
  if (
    before.has("owner") &&
    !roles.includes("owner") &&
    (await ownerCount(db, caller.organizationId)) <= 1
  ) {
    throw conflict("A club needs at least one owner");
  }
  const [updated] = await db
    .update(members)
    .set({ role: joinRoles(roles) })
    .where(eq(members.id, member.id))
    .returning({ id: members.id, role: members.role });
  if (updated === undefined) {
    throw notFound("Member");
  }
  return updated;
};

/**
 * Removes a member from the club, or lets someone leave it themselves. The last
 * owner can't go: transfer ownership first.
 */
export const removeMember = async (
  db: Database,
  caller: Caller,
  memberId: string
) => {
  const member = await findMember(db, caller.organizationId, memberId);
  const isSelf = member.userId === caller.userId;
  if (!isSelf) {
    requireManager(caller);
    requireOwnerFor(caller, parseRoles(member.role));
  }
  if (
    parseRoles(member.role).includes("owner") &&
    (await ownerCount(db, caller.organizationId)) <= 1
  ) {
    throw conflict("A club needs at least one owner");
  }
  await db.delete(members).where(eq(members.id, member.id));
};

export interface InvitationInput {
  email: string;
  personId?: string | null;
  role: readonly ClubMemberRole[];
  teamId?: string | null;
  teamRole?: TeamMemberRole | null;
}

export const listInvitations = async (db: Database, caller: Caller) => {
  requireManager(caller);
  return await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.organizationId, caller.organizationId),
        eq(invitations.status, "pending")
      )
    )
    .orderBy(asc(invitations.createdAt));
};

/** Creates an invitation. Sending the email is the caller's job. */
export const createInvitation = async (
  db: Database,
  caller: Caller,
  input: InvitationInput
): Promise<InvitationRecord> => {
  requireManager(caller);
  requireOwnerFor(caller, input.role);
  const email = input.email.trim().toLowerCase();
  const teamId = input.teamId ?? null;
  const teamRole = input.teamRole ?? null;
  const personId = input.personId ?? null;
  if ((teamId === null) !== (teamRole === null)) {
    throw invalid("A team and a team role go together");
  }
  if (teamId !== null && personId === null) {
    throw invalid("Joining a team needs the person's record");
  }
  const [alreadyHere] = await db
    .select({ id: members.id })
    .from(members)
    .innerJoin(users, eq(users.id, members.userId))
    .where(
      and(
        eq(members.organizationId, caller.organizationId),
        eq(users.email, email)
      )
    );
  if (alreadyHere !== undefined) {
    throw conflict("That person is already in your club");
  }
  try {
    const [created] = await db
      .insert(invitations)
      .values({
        email,
        expiresAt: new Date(Date.now() + INVITATION_LIFETIME_MS),
        inviterId: caller.userId,
        organizationId: caller.organizationId,
        personId,
        role: joinRoles(input.role),
        teamId,
        teamRole,
      })
      .returning();
    if (created === undefined) {
      throw new Error("The invitation was not created");
    }
    return created;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflict("That email already has a pending invitation");
    }
    if (isForeignKeyViolation(error)) {
      throw invalid("That person or team is not in your club");
    }
    throw error;
  }
};

export const cancelInvitation = async (
  db: Database,
  caller: Caller,
  invitationId: string
) => {
  requireManager(caller);
  const [canceled] = await db
    .update(invitations)
    .set({ status: "canceled" })
    .where(
      and(
        eq(invitations.id, invitationId),
        eq(invitations.organizationId, caller.organizationId),
        eq(invitations.status, "pending")
      )
    )
    .returning({ id: invitations.id });
  if (canceled === undefined) {
    throw notFound("Invitation");
  }
};

/**
 * The invitation, if this login may see it. Every refusal is the same "not
 * found": someone with a stolen link, or the wrong email, learns nothing about
 * which clubs exist or who they invited.
 */
const findInvitationFor = async (
  db: Database,
  invitationId: string,
  user: SignedInUser
) => {
  const [row] = await db
    .select({
      club: { name: organizations.name, slug: organizations.slug },
      invitation: invitations,
      inviterName: users.name,
    })
    .from(invitations)
    .innerJoin(organizations, eq(organizations.id, invitations.organizationId))
    .innerJoin(users, eq(users.id, invitations.inviterId))
    .where(
      and(
        eq(invitations.id, invitationId),
        eq(invitations.status, "pending"),
        gt(invitations.expiresAt, new Date())
      )
    );
  if (
    row === undefined ||
    !user.emailVerified ||
    row.invitation.email !== user.email.toLowerCase()
  ) {
    throw notFound("Invitation");
  }
  return row;
};

export const previewInvitation = async (
  db: Database,
  invitationId: string,
  user: SignedInUser
) => {
  const { club, invitation, inviterName } = await findInvitationFor(
    db,
    invitationId,
    user
  );
  return {
    clubName: club.name,
    expiresAt: invitation.expiresAt,
    id: invitation.id,
    inviterName,
    roles: parseRoles(invitation.role),
  };
};

/**
 * Joins the club. One transaction: the membership, the link to the person's
 * record, the team place and the invitation being used up all happen together
 * or not at all.
 */
export const acceptInvitation = async (
  db: Database,
  invitationId: string,
  user: SignedInUser
) => {
  const { invitation } = await findInvitationFor(db, invitationId, user);
  if ((await findMembership(db, user.id)) !== null) {
    throw conflict(ALREADY_IN_A_CLUB);
  }
  try {
    await db.transaction(async (tx) => {
      const [used] = await tx
        .update(invitations)
        .set({ status: "accepted" })
        .where(
          and(
            eq(invitations.id, invitation.id),
            eq(invitations.status, "pending")
          )
        )
        .returning({ id: invitations.id });
      if (used === undefined) {
        throw notFound("Invitation");
      }
      await tx.insert(members).values({
        createdAt: new Date(),
        organizationId: invitation.organizationId,
        role: invitation.role,
        userId: user.id,
      });
      if (invitation.personId !== null) {
        const [linked] = await tx
          .update(people)
          .set({ userId: user.id })
          .where(
            and(
              eq(people.id, invitation.personId),
              eq(people.organizationId, invitation.organizationId),
              isNull(people.userId)
            )
          )
          .returning({ id: people.id });
        if (linked === undefined) {
          throw conflict("That person already has a login");
        }
      }
      if (invitation.teamId !== null && invitation.personId !== null) {
        if (invitation.teamRole === null) {
          throw new Error("An invitation with a team always has a team role");
        }
        await tx
          .insert(teamMemberships)
          .values({
            organizationId: invitation.organizationId,
            personId: invitation.personId,
            role: invitation.teamRole,
            startsOn: new Date().toISOString().slice(0, 10),
            teamId: invitation.teamId,
          })
          .onConflictDoNothing();
      }
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflict(ALREADY_IN_A_CLUB);
    }
    throw error;
  }
  return await findMembership(db, user.id);
};

/** How many logins a club has, for plan limits and the settings screen. */
export const countMembers = async (db: Database, organizationId: string) => {
  const [row] = await db
    .select({ total: count() })
    .from(members)
    .where(eq(members.organizationId, organizationId));
  return row?.total ?? 0;
};
