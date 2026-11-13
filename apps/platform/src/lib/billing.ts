import { huddlekit } from "@/lib/huddle-kit";

/**
 * The club's Huddlekit subscription, as the billing API returns it.
 *
 * The SDK is generated from the API's OpenAPI document and does not have these
 * routes yet, so they go through its own `get` and `post`, which keep its
 * session handling, retries and errors. When the SDK is regenerated, swap these
 * calls for `huddlekit.billing.*` and delete the types below.
 */
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "past_due"
  | "paused"
  | "trialing"
  | "unpaid";

export interface ClubSubscription {
  billingInterval: "monthly" | "yearly";
  cancelAt: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  id: string;
  status: SubscriptionStatus;
}

interface SubscriptionResponse {
  subscription: ClubSubscription;
}

const BILLING = "/api/v1/billing";

/** The club's current subscription, or null if it has none. Owners and admins only. */
export async function loadSubscription(): Promise<ClubSubscription | null> {
  const { subscription } = await huddlekit.get<{
    subscription: ClubSubscription | null;
  }>(BILLING);
  return subscription;
}

/** Starts an embedded Checkout and returns the secret Stripe.js needs. */
export async function createCheckout(
  interval: "monthly" | "yearly"
): Promise<string> {
  const { clientSecret } = await huddlekit.post<{ clientSecret: string }>(
    `${BILLING}/checkout`,
    { body: { interval } }
  );
  return clientSecret;
}

/** A link to Stripe's billing portal for this club. */
export async function createPortalUrl(): Promise<string> {
  const { url } = await huddlekit.post<{ url: string }>(`${BILLING}/portal`);
  return url;
}

/** Ends the subscription when the period already paid for runs out. */
export async function cancelSubscription(): Promise<ClubSubscription> {
  const { subscription } = await huddlekit.post<SubscriptionResponse>(
    `${BILLING}/cancel`
  );
  return subscription;
}

/** Undoes a scheduled cancellation. */
export async function restoreSubscription(): Promise<ClubSubscription> {
  const { subscription } = await huddlekit.post<SubscriptionResponse>(
    `${BILLING}/restore`
  );
  return subscription;
}
