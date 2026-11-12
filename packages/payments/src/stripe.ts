import { stripe } from "@better-auth/stripe";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { Stripe } from "stripe";

/** Stripe retries failed calls (with idempotency keys it adds itself) and gives up on stalled ones. */
const STRIPE_CLIENT_OPTIONS = {
  maxNetworkRetries: 2,
  timeout: 15_000,
} as const;

export interface CreateStripeBillingOptions {
  secretKey: string;
  webhookSecret: string;
  /** Stripe price id of the club subscription. */
  clubPriceId: string;
  /**
   * Whether this user may manage billing for this club. Injected so this package
   * stays free of the database; it should allow only the club's owners and admins.
   */
  canManageBilling: (input: {
    userId: string;
    organizationId: string;
  }) => Promise<boolean>;
  /** Called once a club's subscription checkout completes. Failures are swallowed here. */
  onClubSubscribed?: (organizationId: string) => Promise<void>;
}

/** Subscription endpoints. Each takes `customerType` in the body or query. */
const SUBSCRIPTION_PATHS: ReadonlySet<string> = new Set([
  "/subscription/billing-portal",
  "/subscription/cancel",
  "/subscription/list",
  "/subscription/restore",
  "/subscription/upgrade",
]);

const readCustomerType = (ctx: {
  body?: unknown;
  query?: unknown;
}): unknown => {
  for (const source of [ctx.body, ctx.query]) {
    if (typeof source === "object" && source !== null) {
      const value: unknown = Reflect.get(source, "customerType");
      if (value !== undefined) {
        return value;
      }
    }
  }
  return undefined;
};

/**
 * Billing for clubs paying us through Stripe. The customer is the club (the
 * Better Auth organization): sign-up creates no Stripe customer, every
 * subscription call must say `customerType: "organization"`, and only the
 * club's owners and admins pass `authorizeReference`.
 *
 * Returns Better Auth plugins; spread them into `plugins` in the auth config.
 */
export const createStripeBilling = ({
  canManageBilling,
  clubPriceId,
  onClubSubscribed,
  secretKey,
  webhookSecret,
}: CreateStripeBillingOptions) => [
  stripe({
    createCustomerOnSignUp: false,
    organization: { enabled: true },
    stripeClient: new Stripe(secretKey, STRIPE_CLIENT_OPTIONS),
    stripeWebhookSecret: webhookSecret,
    subscription: {
      authorizeReference: async ({ referenceId, user }) =>
        await canManageBilling({
          organizationId: referenceId,
          userId: user.id,
        }),
      enabled: true,
      onSubscriptionComplete: async ({ subscription }) => {
        await onClubSubscribed?.(subscription.referenceId);
      },
      plans: [{ name: "club", priceId: clubPriceId }],
    },
  }),
  // Individuals never pay. Without this, leaving out customerType would bill the user.
  {
    hooks: {
      before: [
        {
          handler: createAuthMiddleware(async (ctx) => {
            if (readCustomerType(ctx) !== "organization") {
              throw new APIError("BAD_REQUEST", {
                message:
                  'Billing is per club: set customerType to "organization"',
              });
            }
            await Promise.resolve();
          }),
          matcher: (context: { path?: string }) =>
            SUBSCRIPTION_PATHS.has(context.path ?? ""),
        },
      ],
    },
    id: "club-billing-only",
  },
];
