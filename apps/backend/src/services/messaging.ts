import {
  announcements,
  members,
  notifications,
  people,
  personRelationships,
  teamMemberships,
} from "@alice/database";
import type { Database } from "@alice/database";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  inArray,
  isNotNull,
  isNull,
  or,
} from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import { forbidden, invalid, notFound } from "@/lib/app-error";
import { guardWrite } from "@/lib/guard-write";
import { canCoachTeam } from "@/services/access";
import type { Caller } from "@/services/access";

const today = (): string => new Date().toISOString().slice(0, 10);

const assertCanPost = (caller: Caller, teamId: string | null): void => {
  const allowed =
    teamId === null ? caller.isManager : canCoachTeam(caller, teamId);
  if (!allowed) {
    throw forbidden(
      teamId === null
        ? "Only a club admin can post to the whole club"
        : "You do not coach this team"
    );
  }
};

/** Users in a team: the players and staff who have a login, and the parents of players. */
const teamUserIds = async (
  db: Database,
  organizationId: string,
  teamId: string
): Promise<string[]> => {
  const onTeam = await db
    .select({ personId: teamMemberships.personId })
    .from(teamMemberships)
    .where(
      and(
        eq(teamMemberships.organizationId, organizationId),
        eq(teamMemberships.teamId, teamId),
        or(isNull(teamMemberships.endsOn), gt(teamMemberships.endsOn, today()))
      )
    );
  const personIds = onTeam.map((row) => row.personId);
  if (personIds.length === 0) {
    return [];
  }
  const [own, parents] = await Promise.all([
    db
      .select({ userId: people.userId })
      .from(people)
      .where(and(inArray(people.id, personIds), isNotNull(people.userId))),
    db
      .select({ userId: people.userId })
      .from(personRelationships)
      .innerJoin(people, eq(people.id, personRelationships.relatedPersonId))
      .where(
        and(
          inArray(personRelationships.personId, personIds),
          eq(personRelationships.hasParentalResponsibility, true),
          isNotNull(people.userId)
        )
      ),
  ]);
  const ids = new Set<string>();
  for (const row of [...own, ...parents]) {
    if (row.userId !== null) {
      ids.add(row.userId);
    }
  }
  return [...ids];
};

const clubUserIds = async (
  db: Database,
  organizationId: string
): Promise<string[]> => {
  const rows = await db
    .select({ userId: members.userId })
    .from(members)
    .where(eq(members.organizationId, organizationId));
  return rows.map((row) => row.userId);
};

/** Tells everyone an announcement is for. Each person gets their own inbox row. */
const notifyRecipients = async (
  db: Database,
  caller: Caller,
  announcement: typeof announcements.$inferSelect
): Promise<number> => {
  const recipients =
    announcement.teamId === null
      ? await clubUserIds(db, caller.organizationId)
      : await teamUserIds(db, caller.organizationId, announcement.teamId);
  const others = recipients.filter((userId) => userId !== caller.userId);
  if (others.length === 0) {
    return 0;
  }
  await db.insert(notifications).values(
    others.map((userId) => ({
      body: announcement.body.slice(0, 500),
      entityId: announcement.id,
      entityType: "announcement",
      kind: "announcement" as const,
      organizationId: caller.organizationId,
      title: announcement.title,
      userId,
    }))
  );
  return others.length;
};

export interface AnnouncementInput {
  body: string;
  expiresAt?: Date | null;
  publish?: boolean;
  teamId?: string | null;
  title: string;
}

/** Posts to the whole club (admins) or one team (its coaches). Drafts notify nobody until published. */
export const createAnnouncement = async (
  db: Database,
  caller: Caller,
  input: AnnouncementInput
) => {
  assertCanPost(caller, input.teamId ?? null);
  const { publish = true, ...values } = input;
  const [row] = await guardWrite(
    async () =>
      await db
        .insert(announcements)
        .values({
          ...values,
          authorUserId: caller.userId,
          organizationId: caller.organizationId,
          publishedAt: publish ? new Date() : null,
        })
        .returning(),
    {
      invalid:
        "It needs a title and a message, and must expire after it is published",
      missing: "Team",
    }
  );
  if (row === undefined) {
    throw new Error("Announcement insert returned no row");
  }
  const notified = publish ? await notifyRecipients(db, caller, row) : 0;
  return { announcement: row, notified };
};

const teamIdsInvolving = async (
  db: Database,
  caller: Caller,
  userPersonIds: string[]
): Promise<string[]> => {
  if (userPersonIds.length === 0) {
    return [];
  }
  const rows = await db
    .select({ teamId: teamMemberships.teamId })
    .from(teamMemberships)
    .where(
      and(
        eq(teamMemberships.organizationId, caller.organizationId),
        inArray(teamMemberships.personId, userPersonIds),
        or(isNull(teamMemberships.endsOn), gt(teamMemberships.endsOn, today()))
      )
    );
  return rows.map((row) => row.teamId);
};

/** The person records tied to the caller: themselves, and the children they are responsible for. */
const familyPersonIds = async (
  db: Database,
  caller: Caller
): Promise<string[]> => {
  const [own] = await db
    .select({ id: people.id })
    .from(people)
    .where(
      and(
        eq(people.organizationId, caller.organizationId),
        eq(people.userId, caller.userId)
      )
    );
  if (own === undefined) {
    return [];
  }
  const children = await db
    .select({ id: personRelationships.personId })
    .from(personRelationships)
    .where(
      and(
        eq(personRelationships.relatedPersonId, own.id),
        eq(personRelationships.hasParentalResponsibility, true)
      )
    );
  return [own.id, ...children.map((row) => row.id)];
};

/**
 * What the caller can read: club-wide posts, and posts for teams they play
 * for, coach, or have a child in. Club admins see everything including
 * drafts. Others see published posts that have not expired.
 */
export const listAnnouncements = async (
  db: Database,
  caller: Caller,
  options: { includeDrafts: boolean; limit: number; offset: number }
) => {
  const base: (SQL | undefined)[] = [
    eq(announcements.organizationId, caller.organizationId),
  ];
  if (!(caller.isManager || caller.clubWideCoaching)) {
    const teamIds = await teamIdsInvolving(
      db,
      caller,
      await familyPersonIds(db, caller)
    );
    const mine = [...new Set([...teamIds, ...caller.scopedTeamIds])];
    base.push(
      mine.length === 0
        ? isNull(announcements.teamId)
        : or(isNull(announcements.teamId), inArray(announcements.teamId, mine))
    );
  }
  if (!(caller.isManager && options.includeDrafts)) {
    base.push(
      isNotNull(announcements.publishedAt),
      or(
        isNull(announcements.expiresAt),
        gt(announcements.expiresAt, new Date())
      )
    );
  }
  return await db
    .select()
    .from(announcements)
    .where(and(...base))
    .orderBy(desc(announcements.publishedAt), asc(announcements.title))
    .limit(options.limit)
    .offset(options.offset);
};

export interface AnnouncementChanges {
  body?: string;
  expiresAt?: Date | null;
  publish?: boolean;
  title?: string;
}

/**
 * Edits a post, publishes a draft (which notifies people once), or takes a
 * post down by giving it an expiry. Posts are never deleted.
 */
export const updateAnnouncement = async (
  db: Database,
  caller: Caller,
  id: string,
  changes: AnnouncementChanges
) => {
  const [current] = await db
    .select()
    .from(announcements)
    .where(
      and(
        eq(announcements.organizationId, caller.organizationId),
        eq(announcements.id, id)
      )
    );
  if (current === undefined) {
    throw notFound("Announcement");
  }
  assertCanPost(caller, current.teamId);
  const { publish, ...values } = changes;
  const publishing = publish === true && current.publishedAt === null;
  if (publish === false && current.publishedAt !== null) {
    throw invalid(
      "A published post cannot go back to a draft. Give it an expiry instead"
    );
  }
  const set = {
    ...values,
    ...(publishing ? { publishedAt: new Date() } : {}),
  };
  if (Object.keys(set).length === 0) {
    return { announcement: current, notified: 0 };
  }
  const [row] = await guardWrite(
    async () =>
      await db
        .update(announcements)
        .set(set)
        .where(eq(announcements.id, id))
        .returning(),
    { invalid: "It must expire after it is published" }
  );
  if (row === undefined) {
    throw notFound("Announcement");
  }
  const notified = publishing ? await notifyRecipients(db, caller, row) : 0;
  return { announcement: row, notified };
};

/* ----------------------------------------------------------- inbox ------ */

export const listNotifications = async (
  db: Database,
  caller: Caller,
  options: { limit: number; offset: number; unreadOnly: boolean }
) =>
  await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.organizationId, caller.organizationId),
        eq(notifications.userId, caller.userId),
        options.unreadOnly ? isNull(notifications.readAt) : undefined
      )
    )
    .orderBy(desc(notifications.createdAt))
    .limit(options.limit)
    .offset(options.offset);

export const markRead = async (db: Database, caller: Caller, id: string) => {
  const [row] = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.organizationId, caller.organizationId),
        eq(notifications.userId, caller.userId),
        eq(notifications.id, id)
      )
    )
    .returning();
  if (row === undefined) {
    throw notFound("Notification");
  }
  return row;
};

export const markAllRead = async (db: Database, caller: Caller) => {
  const rows = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.organizationId, caller.organizationId),
        eq(notifications.userId, caller.userId),
        isNull(notifications.readAt)
      )
    )
    .returning({ id: notifications.id });
  return { updated: rows.length };
};
