/**
 * Money received against a charge. One row per payment, so a charge paid in
 * instalments has several. A payment is a financial record: a charge with
 * payments cannot be deleted (restrict). To correct a mistake, record a
 * refund as a payment of the opposite kind in the app, or cancel the charge;
 * do not edit amounts after the fact.
 *
 * No card numbers or bank details are stored here. `reference` holds the
 * payment provider's transaction id or a bank reference.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations, users } from "../authentication";
import { isOneOf } from "../shared/constraints";
import { feeCharges } from "./fee-charges";

export const PAYMENT_METHODS = [
  "cash",
  "card",
  "bank_transfer",
  "cheque",
  "other",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const payments = pgTable(
  "payments",
  {
    // Minor units, always positive.
    amountMinor: integer("amount_minor").notNull(),
    chargeId: uuid("charge_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    currency: text("currency").notNull(),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    method: text("method").$type<PaymentMethod>().notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // Who recorded it. Cleared if that login is deleted.
    recordedByUserId: uuid("recorded_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reference: text("reference"),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.chargeId],
      foreignColumns: [feeCharges.organizationId, feeCharges.id],
      name: "payments_charge_same_org_fkey",
    }).onDelete("restrict"),
    check("payments_amountMinor_chk", sql`${table.amountMinor} > 0`),
    check("payments_currency_chk", sql`${table.currency} ~ '^[A-Z]{3}$'`),
    check("payments_method_chk", isOneOf(table.method, PAYMENT_METHODS)),
    index("payments_chargeId_idx").on(table.chargeId),
    index("payments_organizationId_idx").on(table.organizationId),
    index("payments_recordedByUserId_idx").on(table.recordedByUserId),
    // A Stripe payment is recorded once, even if its webhook is delivered twice.
    uniqueIndex("payments_card_reference_uidx")
      .on(table.organizationId, table.reference)
      .where(sql`${table.method} = 'card' and ${table.reference} is not null`),
  ]
);

export const paymentRelations = defineRelationsPart(
  { feeCharges, organizations, payments, users },
  (r) => ({
    payments: {
      charge: r.one.feeCharges({
        from: r.payments.chargeId,
        to: r.feeCharges.id,
      }),
      organization: r.one.organizations({
        from: r.payments.organizationId,
        to: r.organizations.id,
      }),
      recordedBy: r.one.users({
        from: r.payments.recordedByUserId,
        to: r.users.id,
      }),
    },
  })
);
