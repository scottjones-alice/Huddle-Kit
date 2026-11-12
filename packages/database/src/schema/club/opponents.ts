/**
 * Other clubs this club plays against. An opponent is just a name and a few
 * details, not an organization of its own: opposing clubs do not use Huddlekit
 * (yet). If one signs up later, `linkedOrganizationId` points at its
 * organization so the two can be connected without losing fixture history.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  foreignKey,
  unique,
} from "drizzle-orm/pg-core";

import { organizations } from "../authentication";
import { addresses } from "../people/addresses";
import { venues } from "./venues";

export const opponents = pgTable(
  "opponents",
  {
    // Their ground's address, if known. Restrict: do not delete one an opponent still uses.
    addressId: uuid("address_id"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // Their home ground, if we have it as a venue. Cleared if that venue is deleted.
    homeVenueId: uuid("home_venue_id").references(() => venues.id, {
      onDelete: "set null",
    }),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    // Retired opponents stay for fixture history but are hidden from pickers.
    isActive: boolean("is_active").default(true).notNull(),
    // Set when this opponent has its own Huddlekit organization. Cleared if that organization is deleted.
    linkedOrganizationId: uuid("linked_organization_id").references(
      () => organizations.id,
      { onDelete: "set null" }
    ),
    name: text("name").notNull(),
    // The club that keeps this opponent in its list.
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    shortName: text("short_name"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    website: text("website"),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.addressId],
      foreignColumns: [addresses.organizationId, addresses.id],
      name: "opponents_address_same_org_fkey",
    }).onDelete("restrict"),
    // Lets fixtures reference (organization_id, id) so both must match.
    unique("opponents_organization_id_id_uniq").on(
      table.organizationId,
      table.id
    ),
    index("opponents_addressId_idx").on(table.addressId),
    index("opponents_homeVenueId_idx").on(table.homeVenueId),
    index("opponents_linkedOrganizationId_idx").on(table.linkedOrganizationId),
    index("opponents_organizationId_idx").on(table.organizationId),
    uniqueIndex("opponents_organizationId_name_uidx").on(
      table.organizationId,
      table.name
    ),
  ]
);

/**
 * Only the opponent's own relations are declared. Parts merge per table, so
 * adding `opponents` to `addresses`, `venues` or `organizations` here would
 * replace theirs.
 */
export const opponentRelations = defineRelationsPart(
  { addresses, opponents, organizations, venues },
  (r) => ({
    opponents: {
      address: r.one.addresses({
        from: r.opponents.addressId,
        to: r.addresses.id,
      }),
      homeVenue: r.one.venues({
        from: r.opponents.homeVenueId,
        to: r.venues.id,
      }),
      linkedOrganization: r.one.organizations({
        from: r.opponents.linkedOrganizationId,
        to: r.organizations.id,
      }),
      organization: r.one.organizations({
        from: r.opponents.organizationId,
        to: r.organizations.id,
      }),
    },
  })
);
