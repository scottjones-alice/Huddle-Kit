/**
 * Extra details about the club. One organization is one football club, so there
 * is at most one row per organization and its key is `organization_id`. The
 * club's name and logo stay on Better Auth's `organizations` row, so the name
 * is never stored twice.
 *
 * The club's postal address is a row in `addresses`; its home ground is a row in
 * `venues`. Other clubs it plays against live in `opponents`.
 */

import { defineRelationsPart } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  foreignKey,
} from "drizzle-orm/pg-core";

import { organizations } from "../authentication";
import { addresses } from "../people/addresses";
import { venues } from "./venues";

export const clubSettings = pgTable(
  "club_settings",
  {
    // Club office or registered address. Restrict: do not delete one the club still uses.
    addressId: uuid("address_id"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // Where the club plays its home matches. Cleared if that venue is deleted.
    homeVenueId: uuid("home_venue_id").references(() => venues.id, {
      onDelete: "set null",
    }),
    // One row per organization: the organization is the key.
    organizationId: uuid("organization_id")
      .primaryKey()
      .references(() => organizations.id, { onDelete: "cascade" }),
    // Short form for tight spaces, like "Rovers" or "MUFC".
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
      name: "club_settings_address_same_org_fkey",
    }).onDelete("restrict"),
    index("club_settings_addressId_idx").on(table.addressId),
    index("club_settings_homeVenueId_idx").on(table.homeVenueId),
  ]
);

/**
 * Only the settings' own relations are declared. Parts merge per table, so
 * adding `clubSettings` to `addresses`, `venues` or `organizations` here would
 * replace theirs.
 */
export const clubSettingsRelations = defineRelationsPart(
  { addresses, clubSettings, organizations, venues },
  (r) => ({
    clubSettings: {
      address: r.one.addresses({
        from: r.clubSettings.addressId,
        to: r.addresses.id,
      }),
      homeVenue: r.one.venues({
        from: r.clubSettings.homeVenueId,
        to: r.venues.id,
      }),
      organization: r.one.organizations({
        from: r.clubSettings.organizationId,
        to: r.organizations.id,
      }),
    },
  })
);
