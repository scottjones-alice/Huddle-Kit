/**
 * A football club and the people who belong to it.
 *
 * `organizations` is the club (the table keeps the name Better Auth gave it
 * until the rename to `clubs`). `members` links a login to a club and holds the
 * access role (`owner`, `admin` or `member`). Football jobs such as coach or
 * treasurer are not stored here; they come from `role_assignments`.
 *
 * A login belongs to exactly one club: `members.user_id` is unique, so the
 * database refuses a second membership however the code is written. Someone
 * who needs to be in two clubs needs a second login.
 *
 * Better Auth no longer owns these tables. It handles who you are; we handle
 * which club you are in.
 */

import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "../authentication";

/** Access roles stored on `members.role`, comma-separated when a member holds several. */
export const CLUB_MEMBER_ROLES = ["owner", "admin", "member"] as const;
export type ClubMemberRole = (typeof CLUB_MEMBER_ROLES)[number];

export const organizations = pgTable(
  "organizations",
  {
    createdAt: timestamp("created_at").notNull(),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    logo: text("logo"),
    metadata: text("metadata"),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    // The club's Stripe customer for its Huddlekit subscription (see club_subscriptions).
    stripeCustomerId: text("stripe_customer_id"),
  },
  (table) => [uniqueIndex("organizations_slug_uidx").on(table.slug)]
);

export const members = pgTable(
  "members",
  {
    createdAt: timestamp("created_at").notNull(),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    role: text("role").default("member").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [
    // Every role in the list must be one we know, so a typo can't grant nothing silently.
    check(
      "members_role_chk",
      sql`${table.role} ~ '^(owner|admin|member)(,(owner|admin|member))*$'`
    ),
    index("members_organizationId_idx").on(table.organizationId),
    // One club per login. This is the lock; the API also checks first for a clear error.
    uniqueIndex("members_userId_uidx").on(table.userId),
  ]
);
