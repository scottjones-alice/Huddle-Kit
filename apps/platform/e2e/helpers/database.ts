import { randomUUID } from "node:crypto";

import {
  createDatabase,
  invitations,
  memberJoiningRoles,
  members,
  organizations,
  users,
} from "@alice/database";
import { and, eq, sql } from "drizzle-orm";

import { E2E_DATABASE_URL, PLATFORM_URL } from "../env";

/** A connection to the end-to-end database, for seeding data and checking rows. */
export const db = createDatabase({ url: E2E_DATABASE_URL });

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** How many accounts exist for an address. Compared case-insensitively. */
export const countUsers = async (email: string): Promise<number> => {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${email.toLowerCase()}`);
  return rows.length;
};

export const findUser = async (email: string) => {
  const [row] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${email.toLowerCase()}`);
  return row;
};

/** The person's role in a club, or undefined when they are not a member. */
export const membershipRole = async (
  email: string,
  organizationId: string
): Promise<string | undefined> => {
  const user = await findUser(email);
  if (user === undefined) {
    return undefined;
  }
  const [row] = await db
    .select({ role: members.role })
    .from(members)
    .where(
      and(
        eq(members.userId, user.id),
        eq(members.organizationId, organizationId)
      )
    );
  return row?.role;
};

export const countMemberships = async (
  email: string,
  organizationId: string
): Promise<number> => {
  const user = await findUser(email);
  if (user === undefined) {
    return 0;
  }
  const rows = await db
    .select({ id: members.id })
    .from(members)
    .where(
      and(
        eq(members.userId, user.id),
        eq(members.organizationId, organizationId)
      )
    );
  return rows.length;
};

export interface SeededClub {
  name: string;
  organizationId: string;
  slug: string;
  owner: { email: string; id: string };
}

/** A club with one owner, written straight to the database. */
export const seedClub = async (): Promise<SeededClub> => {
  const runId = randomUUID().slice(0, 8);
  const organizationId = randomUUID();
  const ownerId = randomUUID();
  const ownerEmail = `owner-${runId}@example.com`;
  const name = `E2E FC ${runId}`;
  const slug = `e2e-fc-${runId}`;

  await db.insert(organizations).values({
    createdAt: new Date(),
    id: organizationId,
    name,
    slug,
  });
  await db.insert(users).values({
    email: ownerEmail,
    emailVerified: true,
    id: ownerId,
    name: `Owner ${runId}`,
  });
  await db.insert(members).values({
    createdAt: new Date(),
    organizationId,
    role: "owner",
    userId: ownerId,
  });
  return {
    name,
    organizationId,
    owner: { email: ownerEmail, id: ownerId },
    slug,
  };
};

export interface SeededInvitation {
  id: string;
  /** The page the invite email links to. */
  url: string;
}

/** An invitation row for a club. Status and expiry can be set to test bad invites. */
export const seedInvitation = async (
  club: SeededClub,
  options: {
    email: string;
    expiresAt?: Date;
    role?: string;
    status?: "accepted" | "canceled" | "pending" | "rejected";
  }
): Promise<SeededInvitation> => {
  const [row] = await db
    .insert(invitations)
    .values({
      email: options.email,
      expiresAt: options.expiresAt ?? new Date(Date.now() + ONE_DAY_MS),
      inviterId: club.owner.id,
      organizationId: club.organizationId,
      role: options.role ?? "member",
      status: options.status ?? "pending",
    })
    .returning({ id: invitations.id });
  if (row === undefined) {
    throw new Error("Could not seed the invitation");
  }
  return { id: row.id, url: `${PLATFORM_URL}/accept-invite/${row.id}` };
};

/** The club with this web address, or undefined when there is none. */
export const findOrganizationBySlug = async (slug: string) => {
  const [row] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug));
  return row;
};

export const closeDatabase = async (): Promise<void> => {
  await db.$client.end();
};

/** What a member said they are joining as (staff, player or parent), if saved. */
export const joiningRole = async (
  organizationId: string
): Promise<string | undefined> => {
  const [row] = await db
    .select({ joinedAs: memberJoiningRoles.joinedAs })
    .from(memberJoiningRoles)
    .where(eq(memberJoiningRoles.organizationId, organizationId))
    .limit(1);
  return row?.joinedAs;
};
