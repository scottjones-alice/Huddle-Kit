/**
 * What one person owes for a fee. The amount is copied from the fee when the
 * charge is made, so changing the fee later does not change what was agreed. A
 * charge can be waived (a hardship case) with a reason; it is never silently
 * deleted. A person or fee with charges cannot be deleted (restrict).
 *
 * `status` is set by the app: when the payments on a charge add up to the
 * amount it becomes "paid". The database keeps the amounts honest (never
 * negative); it does not total payments for you.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  check,
  date,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations } from "../authentication";
import { people } from "../people/people";
import { isOneOf } from "../shared/constraints";
import { fees } from "./fees";

export const CHARGE_STATUSES = ["due", "paid", "waived", "cancelled"] as const;
export type ChargeStatus = (typeof CHARGE_STATUSES)[number];

export const feeCharges = pgTable(
  "fee_charges",
  {
    amountMinor: integer("amount_minor").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    currency: text("currency").notNull(),
    dueOn: date("due_on", { mode: "string" }),
    feeId: uuid("fee_id").notNull(),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    // Who owes it. For a child this is still the child; a parent pays.
    personId: uuid("person_id").notNull(),
    status: text("status").$type<ChargeStatus>().default("due").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    // Required when the status is "waived".
    waivedReason: text("waived_reason"),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.feeId],
      foreignColumns: [fees.organizationId, fees.id],
      name: "fee_charges_fee_same_org_fkey",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.organizationId, table.personId],
      foreignColumns: [people.organizationId, people.id],
      name: "fee_charges_person_same_org_fkey",
    }).onDelete("restrict"),
    unique("fee_charges_organization_id_id_uniq").on(
      table.organizationId,
      table.id
    ),
    check("feeCharges_amountMinor_chk", sql`${table.amountMinor} >= 0`),
    check("feeCharges_currency_chk", sql`${table.currency} ~ '^[A-Z]{3}$'`),
    check("feeCharges_status_chk", isOneOf(table.status, CHARGE_STATUSES)),
    check(
      "feeCharges_waived_chk",
      sql`${table.status} <> 'waived' or length(trim(coalesce(${table.waivedReason}, ''))) > 0`
    ),
    index("fee_charges_organizationId_idx").on(table.organizationId),
    index("fee_charges_personId_idx").on(table.personId),
    uniqueIndex("fee_charges_fee_person_uidx").on(table.feeId, table.personId),
  ]
);

export const feeChargeRelations = defineRelationsPart(
  { feeCharges, fees, organizations, people },
  (r) => ({
    feeCharges: {
      fee: r.one.fees({
        from: r.feeCharges.feeId,
        to: r.fees.id,
      }),
      organization: r.one.organizations({
        from: r.feeCharges.organizationId,
        to: r.organizations.id,
      }),
      person: r.one.people({
        from: r.feeCharges.personId,
        to: r.people.id,
      }),
    },
  })
);
