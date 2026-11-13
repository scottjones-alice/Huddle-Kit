import {
  clubSubscriptions,
  completeOnboardingStep,
  organizations,
  stripeEvents,
} from "@alice/database";
import {
  clubSubscriptionInsertSchema,
  stripeEventInsertSchema,
} from "@alice/database/validation";
import { subscriptionIdFromEvent } from "@alice/payments";
import type { ClubBilling, ClubSubscriptionState } from "@alice/payments";
import { and, desc, eq, notInArray } from "drizzle-orm";

import { getClubBilling } from "@/services/club-billing";
import { db } from "@/services/database";

/** Statuses after which a subscription is over and the club may subscribe again. */
const ENDED_STATUSES = ["canceled", "incomplete_expired"] as const;

/** Statuses that mean the club has paid and has the product. */
const PAID_STATUSES: ReadonlySet<string> = new Set(["active", "trialing"]);

/** A Stripe event that has passed signature verification. */
export type VerifiedEvent = ReturnType<ClubBilling["verifyEvent"]>;

export type BillingEventOutcome =
  | "applied"
  | "duplicate"
  | "ignored"
  | "unmatched";

/** The club's newest subscription that has not ended, if any. */
export const findCurrentSubscription = async (organizationId: string) => {
  const [current] = await db
    .select()
    .from(clubSubscriptions)
    .where(
      and(
        eq(clubSubscriptions.organizationId, organizationId),
        notInArray(clubSubscriptions.status, [...ENDED_STATUSES])
      )
    )
    .orderBy(desc(clubSubscriptions.createdAt))
    .limit(1);
  return current;
};

/**
 * Stripe's customer for the club, created the first time it is needed and
 * reused after. Keyed on the club, so two clicks make one customer.
 */
export const ensureStripeCustomer = async ({
  contactEmail,
  organizationId,
}: {
  contactEmail: string;
  organizationId: string;
}): Promise<string | undefined> => {
  const club = await db.query.organizations.findFirst({
    where: { id: organizationId },
  });
  if (club === undefined) {
    return undefined;
  }
  if (club.stripeCustomerId !== null) {
    return club.stripeCustomerId;
  }
  const customerId = await getClubBilling().createCustomer({
    clubName: club.name,
    contactEmail,
    organizationId,
  });
  await db
    .update(organizations)
    .set({ stripeCustomerId: customerId })
    .where(eq(organizations.id, organizationId));
  return customerId;
};

const toRow = (state: ClubSubscriptionState) =>
  clubSubscriptionInsertSchema.parse(state);

/** Writes Stripe's view of a subscription, inserting or updating by its Stripe id. */
const saveSubscription = async (
  executor: Pick<typeof db, "insert">,
  state: ClubSubscriptionState
): Promise<void> => {
  const row = toRow(state);
  await executor
    .insert(clubSubscriptions)
    .values(row)
    .onConflictDoUpdate({
      set: {
        billingInterval: row.billingInterval,
        cancelAt: row.cancelAt,
        cancelAtPeriodEnd: row.cancelAtPeriodEnd,
        canceledAt: row.canceledAt,
        currentPeriodEnd: row.currentPeriodEnd,
        endedAt: row.endedAt,
        status: row.status,
      },
      target: clubSubscriptions.stripeSubscriptionId,
    });
};

const markBillingStepDone = async (state: ClubSubscriptionState) => {
  if (PAID_STATUSES.has(state.status)) {
    await completeOnboardingStep(
      db,
      { organizationId: state.organizationId },
      "billing"
    );
  }
};

/**
 * Brings our copy of one subscription up to date from Stripe. Used after the
 * club cancels or restores, so the page shows the change straight away; the
 * webhook arrives later and writes the same thing.
 */
export const syncSubscription = async (
  subscriptionId: string
): Promise<boolean> => {
  const state = await getClubBilling().readSubscription(subscriptionId);
  if (state === null) {
    return false;
  }
  await saveSubscription(db, state);
  await markBillingStepDone(state);
  return true;
};

/**
 * Handles one verified Stripe event. The event id is recorded in the same
 * transaction as the change, so a redelivery does nothing and a failure rolls
 * back and is retried by Stripe. The subscription is read fresh from Stripe, so
 * an event that arrives late can't write an older status over a newer one.
 */
export const processBillingEvent = async (
  event: VerifiedEvent
): Promise<BillingEventOutcome> => {
  const [alreadyDone] = await db
    .select({ id: stripeEvents.id })
    .from(stripeEvents)
    .where(eq(stripeEvents.id, event.id))
    .limit(1);
  if (alreadyDone !== undefined) {
    return "duplicate";
  }

  const subscriptionId = subscriptionIdFromEvent(event);
  const state =
    subscriptionId === null
      ? null
      : await getClubBilling().readSubscription(subscriptionId);

  const recorded = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(stripeEvents)
      .values(stripeEventInsertSchema.parse({ id: event.id, type: event.type }))
      .onConflictDoNothing()
      .returning({ id: stripeEvents.id });
    if (inserted.length === 0) {
      return false;
    }
    if (state !== null) {
      await saveSubscription(tx, state);
    }
    return true;
  });

  if (!recorded) {
    return "duplicate";
  }
  if (subscriptionId === null) {
    return "ignored";
  }
  if (state === null) {
    return "unmatched";
  }
  await markBillingStepDone(state);
  return "applied";
};
