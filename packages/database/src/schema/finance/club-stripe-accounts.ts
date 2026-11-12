/**
 * The Stripe Connect account a club uses to collect money from its own members.
 * One organization is one football club, so there is at most one row per club
 * and its key is `organization_id`. This is separate from the club paying
 * Huddlekit a subscription, which Better Auth keeps on `organizations`.
 *
 * `stripe_account_id` is a v2 account (acct_...). `card_payments_status` mirrors
 * `configuration.merchant.capabilities.card_payments.status` and is refreshed
 * from account webhooks; code that takes a payment must re-check it first.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  check,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations } from "../authentication";
import { isOneOf } from "../shared/constraints";

export const STRIPE_CAPABILITY_STATUSES = [
  "active",
  "pending",
  "restricted",
  "unsupported",
] as const;
export type StripeCapabilityStatus =
  (typeof STRIPE_CAPABILITY_STATUSES)[number];

export const clubStripeAccounts = pgTable(
  "club_stripe_accounts",
  {
    cardPaymentsStatus: text("card_payments_status")
      .$type<StripeCapabilityStatus>()
      .default("pending")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // One row per organization: the organization is the key.
    organizationId: uuid("organization_id")
      .primaryKey()
      .references(() => organizations.id, { onDelete: "cascade" }),
    stripeAccountId: text("stripe_account_id").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    check(
      "clubStripeAccounts_cardPaymentsStatus_chk",
      isOneOf(table.cardPaymentsStatus, STRIPE_CAPABILITY_STATUSES)
    ),
    check(
      "clubStripeAccounts_stripeAccountId_chk",
      sql`${table.stripeAccountId} like 'acct\\_%'`
    ),
    uniqueIndex("club_stripe_accounts_stripeAccountId_uidx").on(
      table.stripeAccountId
    ),
  ]
);

export const clubStripeAccountRelations = defineRelationsPart(
  { clubStripeAccounts, organizations },
  (r) => ({
    clubStripeAccounts: {
      organization: r.one.organizations({
        from: r.clubStripeAccounts.organizationId,
        to: r.organizations.id,
      }),
    },
  })
);
