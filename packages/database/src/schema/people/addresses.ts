/**
 * A postal address, stored once and shared. People, the club and venues (training
 * and match) each point at a row here with their own `address_id` column, so
 * address fields are never copied onto those tables.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  check,
  doublePrecision,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  unique,
} from "drizzle-orm/pg-core";

import { organizations } from "../authentication";

export const addresses = pgTable(
  "addresses",
  {
    // Town or city.
    city: text("city").notNull(),
    // ISO 3166-1 alpha-2, upper case (for example "GB", "US").
    countryCode: text("country_code").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    // Optional: lets us show a venue on a map and work out travel distance.
    latitude: doublePrecision("latitude"),
    // Street and number, or the building name.
    line1: text("line_1").notNull(),
    line2: text("line_2"),
    longitude: doublePrecision("longitude"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    // ZIP / postcode. Formats differ by country, so it is free text.
    postalCode: text("postal_code"),
    // State, county or province.
    region: text("region"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // Lets other tables reference (organization_id, id) so both must match.
    unique("addresses_organization_id_id_uniq").on(
      table.organizationId,
      table.id
    ),
    check(
      "addresses_countryCode_chk",
      sql`${table.countryCode} ~ '^[A-Z]{2}$'`
    ),
    check("addresses_latitude_chk", sql`${table.latitude} between -90 and 90`),
    check(
      "addresses_longitude_chk",
      sql`${table.longitude} between -180 and 180`
    ),
    index("addresses_organizationId_idx").on(table.organizationId),
    index("addresses_organizationId_postalCode_idx").on(
      table.organizationId,
      table.postalCode
    ),
  ]
);

/**
 * Only the owning organization is related here. The tables that point at an
 * address (people, club settings, venues) declare their own relation to `addresses`.
 */
export const addressRelations = defineRelationsPart(
  { addresses, organizations },
  (r) => ({
    addresses: {
      organization: r.one.organizations({
        from: r.addresses.organizationId,
        to: r.organizations.id,
      }),
    },
  })
);
