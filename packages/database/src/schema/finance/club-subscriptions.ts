/**
 * A club's Huddlekit subscription, as Stripe last told us. We bill the club,
 * never a person. Stripe is the source of truth: every column here is copied
 * from the Stripe subscription by the billing webhook, and a row is rewritten
 * from a fresh Stripe read each time, so a late or repeated event can't move
 * the status backwards.
 *
 * A club can subscribe, cancel and subscribe again, so it can have several
 * rows over time; the current one is the newest that has not ended.
 *
 * `stripe_events` records each Stripe event once. The webhook inserts the event
 * id and does its work in the same transaction, so a replay is ignored and a
 * failure is retried.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations } from "../authentication";
import { isOneOf } from "../shared/constraints";

export const SUBSCRIPTION_STATUSES = [
  "active",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "past_due",
  "paused",
  "trialing",
  "unpaid",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const SUBSCRIPTION_INTERVALS = ["monthly", "yearly"] as const;
export type SubscriptionInterval = (typeof SUBSCRIPTION_INTERVALS)[number];

export const clubSubscriptions = pgTable(
  "club_subscriptions",
  {
    billingInterval: text("billing_interval")
      .$type<SubscriptionInterval>()
      .notNull(),
    cancelAt: timestamp("cancel_at", { withTimezone: true }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    status: text("status").$type<SubscriptionStatus>().notNull(),
    stripeCustomerId: text("stripe_customer_id").notNull(),
    stripeSubscriptionId: text("stripe_subscription_id").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    check(
      "clubSubscriptions_status_chk",
      isOneOf(table.status, SUBSCRIPTION_STATUSES)
    ),
    check(
      "clubSubscriptions_billingInterval_chk",
      isOneOf(table.billingInterval, SUBSCRIPTION_INTERVALS)
    ),
    check(
      "clubSubscriptions_stripeSubscriptionId_chk",
      sql`${table.stripeSubscriptionId} like 'sub\\_%'`
    ),
    check(
      "clubSubscriptions_stripeCustomerId_chk",
      sql`${table.stripeCustomerId} like 'cus\\_%'`
    ),
    uniqueIndex("club_subscriptions_stripeSubscriptionId_uidx").on(
      table.stripeSubscriptionId
    ),
    index("club_subscriptions_organizationId_idx").on(table.organizationId),
  ]
);

export const stripeEvents = pgTable(
  "stripe_events",
  {
    // The Stripe event id (evt_...). The primary key is what makes a replay a no-op.
    id: text("id").primaryKey(),
    processedAt: timestamp("processed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    type: text("type").notNull(),
  },
  (table) => [check("stripeEvents_id_chk", sql`${table.id} like 'evt\\_%'`)]
);

export const clubSubscriptionRelations = defineRelationsPart(
  { clubSubscriptions, organizations },
  (r) => ({
    clubSubscriptions: {
      organization: r.one.organizations({
        from: r.clubSubscriptions.organizationId,
        to: r.organizations.id,
      }),
    },
  })
);
