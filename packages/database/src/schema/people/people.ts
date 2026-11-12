/**
 * A person the club knows about: a player, coach, parent, volunteer. One row
 * per human. Their role is not stored here, because the same person can coach
 * one team and be a parent in another; roles live on team membership.
 *
 * A person is not a login. Better Auth owns `users`; `userId` links the two
 * only once the person has an account, so a child who never signs in is still
 * a full record.
 *
 * `dateOfBirth` and the address are personal data about children as well as
 * adults. Keep them out of general lists and views.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  foreignKey,
  unique,
} from "drizzle-orm/pg-core";

import { organizations, users } from "../authentication";
import { addresses } from "./addresses";

export const people = pgTable(
  "people",
  {
    // Home address. Restrict: do not delete one a person still uses.
    addressId: uuid("address_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // Calendar date with no time or timezone, kept as "YYYY-MM-DD".
    dateOfBirth: date("date_of_birth", { mode: "string" }),
    email: text("email"),
    firstName: text("first_name").notNull(),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    // Retired people stay for history but are hidden from pickers.
    isActive: boolean("is_active").default(true).notNull(),
    lastName: text("last_name").notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    phone: text("phone"),
    // What they like to be called, if not their first name.
    preferredName: text("preferred_name"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    // Set once this person has a login. Cleared if the login is deleted.
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.addressId],
      foreignColumns: [addresses.organizationId, addresses.id],
      name: "people_address_same_org_fkey",
    }).onDelete("restrict"),
    // Lets other tables reference (organization_id, id) so both must match.
    unique("people_organization_id_id_uniq").on(table.organizationId, table.id),
    index("people_addressId_idx").on(table.addressId),
    index("people_organizationId_idx").on(table.organizationId),
    index("people_organizationId_lastName_firstName_idx").on(
      table.organizationId,
      table.lastName,
      table.firstName
    ),
    // A login maps to at most one person per organization. Null userIds do not collide.
    uniqueIndex("people_organizationId_userId_uidx").on(
      table.organizationId,
      table.userId
    ),
  ]
);

/**
 * Only the person's own relations are declared. Parts merge per table, so
 * adding `people` to `users`, `addresses` or `organizations` here would replace theirs.
 */
export const peopleRelations = defineRelationsPart(
  { addresses, organizations, people, users },
  (r) => ({
    people: {
      address: r.one.addresses({
        from: r.people.addressId,
        to: r.addresses.id,
      }),
      organization: r.one.organizations({
        from: r.people.organizationId,
        to: r.organizations.id,
      }),
      user: r.one.users({
        from: r.people.userId,
        to: r.users.id,
      }),
    },
  })
);
