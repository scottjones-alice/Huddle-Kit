/**
 * Places the club uses: training grounds, classrooms, the clubhouse and match
 * venues. They share one table and are told apart by `kind`. Where a venue is
 * lives in `addresses`; this row says what the place is and how to find it.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  check,
  foreignKey,
  unique,
} from "drizzle-orm/pg-core";

import { organizations } from "../authentication";
import { addresses } from "../people/addresses";
import { isNonEmptyArrayOf } from "../shared/constraints";

export const VENUE_KINDS = [
  "training_ground",
  "classroom",
  "clubhouse",
  "match_venue",
] as const;
export type VenueKind = (typeof VENUE_KINDS)[number];

export const venues = pgTable(
  "venues",
  {
    // Restrict: an address still used by a venue cannot be deleted from under it.
    addressId: uuid("address_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // How to get in, where to park, which gate to use.
    directions: text("directions"),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    // Retired venues stay for history but are hidden from pickers.
    isActive: boolean("is_active").default(true).notNull(),
    // A venue can be several things at once, e.g. a ground used for training and matches.
    kinds: text("kinds").$type<VenueKind>().array().notNull(),
    name: text("name").notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    // Three-word address of the exact meeting spot, like "filled.count.soap".
    what3words: text("what3words"),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.addressId],
      foreignColumns: [addresses.organizationId, addresses.id],
      name: "venues_address_same_org_fkey",
    }).onDelete("restrict"),
    // Lets pitches reference (organization_id, id) so both must match.
    unique("venues_organization_id_id_uniq").on(table.organizationId, table.id),
    check("venues_kinds_chk", isNonEmptyArrayOf(table.kinds, VENUE_KINDS)),
    index("venues_addressId_idx").on(table.addressId),
    index("venues_organizationId_idx").on(table.organizationId),
    // GIN so "venues whose kinds contain X" can use an index.
    index("venues_kinds_idx").using("gin", table.kinds),
  ]
);

/**
 * Only the venue's own relations are declared. Parts merge per table, so adding
 * `venues` to `addresses` or `organizations` here would replace their relations.
 */
export const venueRelations = defineRelationsPart(
  { addresses, organizations, venues },
  (r) => ({
    venues: {
      address: r.one.addresses({
        from: r.venues.addressId,
        to: r.addresses.id,
      }),
      organization: r.one.organizations({
        from: r.venues.organizationId,
        to: r.organizations.id,
      }),
    },
  })
);
