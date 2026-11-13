import { Stripe } from "stripe";

import type { ClubBillingInterval } from "./plans";

/**
 * Clubs paying Huddlekit a subscription, straight through Stripe. No auth
 * library is involved: the caller decides who may bill a club, and this module
 * only talks to Stripe. It never touches the database either; callers store
 * what `readSubscription` returns.
 *
 * The customer is the club, never a person. Everything Stripe creates for a
 * club carries `organizationId` in its metadata, which is how a webhook finds
 * the club again.
 *
 * Money clubs collect from their own members is a different Stripe setup and
 * lives in `connect.ts` with its own keys.
 */

/** Stripe retries failed calls (with idempotency keys it adds itself) and gives up on stalled ones. */
const STRIPE_CLIENT_OPTIONS = {
  maxNetworkRetries: 2,
  timeout: 15_000,
} as const;

// Tags our Checkout Sessions in the Dashboard. Stripe asks for a custom label with 8 random letters.
const INTEGRATION_IDENTIFIER = "huddlekit-club-billing-hkpwmzjc";

const MILLISECONDS_PER_SECOND = 1000;

export type StripeSubscriptionStatus =
  | "active"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "past_due"
  | "paused"
  | "trialing"
  | "unpaid";

export interface CreateClubBillingOptions {
  /** Stripe price id of the monthly club plan. */
  clubPriceId: string;
  /** Annual price on the same Stripe product. */
  clubAnnualPriceId: string;
  secretKey: string;
  /** Signing secret of the billing webhook endpoint (whsec_...). */
  webhookSecret: string;
}

export interface CreateClubCustomerInput {
  clubName: string;
  contactEmail: string;
  organizationId: string;
}

export interface ClubCheckoutInput {
  customerId: string;
  interval: ClubBillingInterval;
  organizationId: string;
  /** Where Stripe sends the payer afterwards. May contain {CHECKOUT_SESSION_ID}. */
  returnUrl: string;
}

export interface ClubPortalInput {
  customerId: string;
  returnUrl: string;
}

/** What we keep about a subscription. Dates are real Dates, not Stripe's seconds. */
export interface ClubSubscriptionState {
  billingInterval: ClubBillingInterval;
  cancelAt: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  currentPeriodEnd: Date | null;
  endedAt: Date | null;
  organizationId: string;
  status: StripeSubscriptionStatus;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
}

const STATUSES: ReadonlySet<string> = new Set<StripeSubscriptionStatus>([
  "active",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "past_due",
  "paused",
  "trialing",
  "unpaid",
]);

const isStatus = (value: string): value is StripeSubscriptionStatus =>
  STATUSES.has(value);

const toDate = (seconds: number | null | undefined): Date | null =>
  typeof seconds === "number"
    ? new Date(seconds * MILLISECONDS_PER_SECOND)
    : null;

const idOf = (value: string | { id: string } | null | undefined) =>
  typeof value === "string" ? value : value?.id;

/**
 * Which subscription a webhook event is about, or null when we do not act on
 * the event. A completed subscription Checkout and any change to a subscription
 * both just say "go and look at this subscription".
 */
export const subscriptionIdFromEvent = (event: Stripe.Event): string | null => {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    return session.mode === "subscription"
      ? (idOf(session.subscription) ?? null)
      : null;
  }
  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.deleted" ||
    event.type === "customer.subscription.paused" ||
    event.type === "customer.subscription.resumed" ||
    event.type === "customer.subscription.updated"
  ) {
    return event.data.object.id;
  }
  return null;
};

export const createClubBilling = ({
  clubAnnualPriceId,
  clubPriceId,
  secretKey,
  webhookSecret,
}: CreateClubBillingOptions) => {
  const client = new Stripe(secretKey, STRIPE_CLIENT_OPTIONS);

  const priceFor = (interval: ClubBillingInterval) =>
    interval === "yearly" ? clubAnnualPriceId : clubPriceId;

  /** Creates the club's Stripe customer. Safe to retry: keyed on the club. */
  const createCustomer = async ({
    clubName,
    contactEmail,
    organizationId,
  }: CreateClubCustomerInput): Promise<string> => {
    const customer = await client.customers.create(
      {
        email: contactEmail,
        metadata: { organizationId },
        name: clubName,
      },
      { idempotencyKey: `club-customer-${organizationId}` }
    );
    return customer.id;
  };

  /**
   * An embedded Checkout Session for the club plan. Returns the client secret
   * the page hands to Stripe.js. Nothing is granted here: access follows the
   * webhook, never the page the payer lands on.
   */
  const createCheckoutSession = async ({
    customerId,
    interval,
    organizationId,
    returnUrl,
  }: ClubCheckoutInput): Promise<string> => {
    const session = await client.checkout.sessions.create({
      client_reference_id: organizationId,
      customer: customerId,
      integration_identifier: INTEGRATION_IDENTIFIER,
      line_items: [{ price: priceFor(interval), quantity: 1 }],
      metadata: { organizationId },
      mode: "subscription",
      return_url: returnUrl,
      subscription_data: { metadata: { organizationId } },
      ui_mode: "embedded_page",
    });
    if (session.client_secret === null) {
      throw new Error("Stripe returned a Checkout Session without a secret");
    }
    return session.client_secret;
  };

  /** Stripe's hosted page for updating a card, reading invoices and cancelling. */
  const createPortalSession = async ({
    customerId,
    returnUrl,
  }: ClubPortalInput): Promise<string> => {
    const session = await client.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return session.url;
  };

  /** Cancels at the end of the paid period, or undoes that. Returns the new state. */
  const setCancelAtPeriodEnd = async (
    subscriptionId: string,
    cancel: boolean
  ): Promise<void> => {
    await client.subscriptions.update(subscriptionId, {
      cancel_at_period_end: cancel,
    });
  };

  /**
   * Reads a subscription fresh from Stripe, so an event that arrives late or
   * twice can't move our copy backwards. Returns null when the subscription
   * does not belong to a club of ours.
   */
  const readSubscription = async (
    subscriptionId: string
  ): Promise<ClubSubscriptionState | null> => {
    const subscription = await client.subscriptions.retrieve(subscriptionId);
    const { organizationId } = subscription.metadata;
    const [item] = subscription.items.data;
    const customerId = idOf(subscription.customer);
    if (
      organizationId === undefined ||
      organizationId === "" ||
      item === undefined ||
      customerId === undefined ||
      !isStatus(subscription.status)
    ) {
      return null;
    }
    return {
      billingInterval:
        item.price.recurring?.interval === "year" ? "yearly" : "monthly",
      cancelAt: toDate(subscription.cancel_at),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: toDate(subscription.canceled_at),
      currentPeriodEnd: toDate(item.current_period_end),
      endedAt: toDate(subscription.ended_at),
      organizationId,
      status: subscription.status,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
    };
  };

  /** Verifies the signature of a webhook. Throws if the payload is not Stripe's. */
  const verifyEvent = (payload: string, signature: string): Stripe.Event =>
    client.webhooks.constructEvent(payload, signature, webhookSecret);

  return {
    createCheckoutSession,
    createCustomer,
    createPortalSession,
    readSubscription,
    setCancelAtPeriodEnd,
    verifyEvent,
  };
};

export type ClubBilling = ReturnType<typeof createClubBilling>;
