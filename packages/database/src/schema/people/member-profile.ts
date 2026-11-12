/**
 * What the people wizard collects that the core people tables have no place
 * for: equalities information, when someone can come, kit and collection
 * preferences, and how they like to pay. One row per person in the one-to-one
 * tables. All of it is personal data about members, some of it about children,
 * so keep it out of general lists and views.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations } from "../authentication";
import { isOneOf } from "../shared/constraints";
import { people } from "./people";

export const AVAILABILITY_SLOTS = ["morning", "afternoon", "evening"] as const;
export type AvailabilitySlot = (typeof AVAILABILITY_SLOTS)[number];

export const PICKUP_RULES = ["guardian", "approved", "alone"] as const;
export type PickupRule = (typeof PICKUP_RULES)[number];

export const PAYERS = [
  "me",
  "other-guardian",
  "split",
  "player",
  "club-funded",
] as const;
export type Payer = (typeof PAYERS)[number];

export const PAYMENT_METHODS_PREFERRED = [
  "direct-debit",
  "card",
  "bank-transfer",
  "cash",
] as const;
export type PreferredPaymentMethod = (typeof PAYMENT_METHODS_PREFERRED)[number];

const updatedAtColumn = () =>
  timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull();

const personKey = () => uuid("person_id").notNull();

/** Equalities monitoring. Optional, and "prefer not to say" is a valid answer. */
export const personDemographics = pgTable(
  "person_demographics",
  {
    additionalNeeds: text("additional_needs"),
    ethnicity: text("ethnicity"),
    gender: text("gender"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    personId: uuid("person_id").primaryKey(),
    religion: text("religion"),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.personId],
      foreignColumns: [people.organizationId, people.id],
      name: "person_demographics_person_same_org_fkey",
    }).onDelete("cascade"),
    index("person_demographics_organizationId_idx").on(table.organizationId),
  ]
);

/** When a person can train or play: one row per day and part of the day. */
export const personAvailability = pgTable(
  "person_availability",
  {
    dayOfWeek: smallint("day_of_week").notNull(),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    personId: personKey(),
    slot: text("slot").$type<AvailabilitySlot>().notNull(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.personId],
      foreignColumns: [people.organizationId, people.id],
      name: "person_availability_person_same_org_fkey",
    }).onDelete("cascade"),
    check(
      "person_availability_slot_chk",
      isOneOf(table.slot, AVAILABILITY_SLOTS)
    ),
    check(
      "person_availability_day_chk",
      sql`${table.dayOfWeek} between 1 and 7`
    ),
    uniqueIndex("person_availability_person_day_slot_uidx").on(
      table.personId,
      table.dayOfWeek,
      table.slot
    ),
  ]
);

/** Kit sizes and how a young player gets home. */
export const personKit = pgTable(
  "person_kit",
  {
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    personId: uuid("person_id").primaryKey(),
    pickupRule: text("pickup_rule").$type<PickupRule>(),
    shirtName: text("shirt_name"),
    shirtSize: text("shirt_size"),
    shortsSize: text("shorts_size"),
    squadNumber: smallint("squad_number"),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.personId],
      foreignColumns: [people.organizationId, people.id],
      name: "person_kit_person_same_org_fkey",
    }).onDelete("cascade"),
    check("person_kit_pickup_chk", isOneOf(table.pickupRule, PICKUP_RULES)),
    check(
      "person_kit_squadNumber_chk",
      sql`${table.squadNumber} is null or ${table.squadNumber} between 1 and 99`
    ),
  ]
);

/** Who pays a person's fees, and how. The payer is the signed-in adult. */
export const memberBillingPreferences = pgTable(
  "member_billing_preferences",
  {
    billingEmail: text("billing_email"),
    method: text("method").$type<PreferredPaymentMethod>(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    payer: text("payer").$type<Payer>(),
    personId: uuid("person_id").primaryKey(),
    secondPayerEmail: text("second_payer_email"),
    secondPayerName: text("second_payer_name"),
    sendReminders: boolean("send_reminders").default(true).notNull(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.personId],
      foreignColumns: [people.organizationId, people.id],
      name: "member_billing_preferences_person_same_org_fkey",
    }).onDelete("cascade"),
    check("member_billing_payer_chk", isOneOf(table.payer, PAYERS)),
    check(
      "member_billing_method_chk",
      isOneOf(table.method, PAYMENT_METHODS_PREFERRED)
    ),
  ]
);

export const memberProfileRelations = defineRelationsPart(
  {
    memberBillingPreferences,
    people,
    personAvailability,
    personDemographics,
    personKit,
  },
  (r) => ({
    memberBillingPreferences: {
      person: r.one.people({
        from: r.memberBillingPreferences.personId,
        to: r.people.id,
      }),
    },
    personAvailability: {
      person: r.one.people({
        from: r.personAvailability.personId,
        to: r.people.id,
      }),
    },
    personDemographics: {
      person: r.one.people({
        from: r.personDemographics.personId,
        to: r.people.id,
      }),
    },
    personKit: {
      person: r.one.people({
        from: r.personKit.personId,
        to: r.people.id,
      }),
    },
  })
);
