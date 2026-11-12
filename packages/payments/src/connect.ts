import { Stripe } from "stripe";

/**
 * Stripe Connect for clubs collecting money from their own members.
 *
 * The club is the merchant of record: a direct-charge SaaS setup on an
 * Accounts v2 connected account with the full Stripe Dashboard, where Stripe
 * collects its fees and carries negative balances. Huddlekit's own cut, if any,
 * is `applicationFeeAmount` on the payment.
 *
 * This is deliberately separate from `stripe.ts` (clubs paying Huddlekit
 * through Better Auth) and uses its own keys. The module never touches the
 * database: callers persist the account id and payment records.
 */

export type CardPaymentsStatus =
  | "active"
  | "pending"
  | "restricted"
  | "unsupported";

export interface CreateStripeConnectOptions {
  /** Restricted key (rk_...) for the platform account; falls back to sk_ only if you must. */
  secretKey: string;
  /** Signing secret of the Connect webhook endpoint (whsec_...). */
  webhookSecret: string;
}

export interface CreateClubAccountInput {
  clubName: string;
  contactEmail: string;
  /** ISO 4217, for example "GBP". */
  currency: string;
  /** ISO 3166-1 alpha-2, for example "GB". */
  country: string;
  organizationId: string;
}

export interface OnboardingLinkInput {
  accountId: string;
  /** Where Stripe sends the user if the link expired or was already used. */
  refreshUrl: string;
  returnUrl: string;
}

export interface MemberCheckoutInput {
  accountId: string;
  /** Huddlekit's cut in minor units. Omit for none. */
  applicationFeeAmountMinor?: number;
  amountMinor: number;
  cancelUrl: string;
  /** The fee charge being paid. Comes back on the webhook as client_reference_id. */
  chargeId: string;
  currency: string;
  customerEmail?: string;
  description: string;
  successUrl: string;
}

/** A paid member checkout, resolved from a webhook event. */
export interface MemberPayment {
  /** The connected account (acct_...) the money went to. */
  accountId: string;
  amountMinor: number;
  chargeId: string;
  currency: string;
  /** pi_...; the unique reference stored on the payment. */
  paymentIntentId: string;
}

const DEFAULT_LOCALE = "en-GB";
const MIN_APPLICATION_FEE_MINOR = 0;

// Tags our Checkout Sessions in the Dashboard. Stripe asks for a custom label with 8 random letters.
const INTEGRATION_IDENTIFIER = "huddlekit-member-fees-qvxnrtkd";

const isCardPaymentsStatus = (value: unknown): value is CardPaymentsStatus =>
  value === "active" ||
  value === "pending" ||
  value === "restricted" ||
  value === "unsupported";

const toCardPaymentsStatus = (status: unknown): CardPaymentsStatus =>
  isCardPaymentsStatus(status) ? status : "pending";

/**
 * Pulls a paid member checkout out of a checkout.session.completed or
 * checkout.session.async_payment_succeeded event. Returns null for anything
 * that is not yet paid or is not one of ours, so callers can ignore it.
 * Fulfilment belongs here, never on the success page.
 */
export const toMemberPayment = (event: Stripe.Event): MemberPayment | null => {
  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  ) {
    return null;
  }
  const session = event.data.object;
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;
  if (
    session.payment_status !== "paid" ||
    event.account === undefined ||
    session.client_reference_id === null ||
    session.amount_total === null ||
    session.currency === null ||
    paymentIntentId === undefined
  ) {
    return null;
  }
  return {
    accountId: event.account,
    amountMinor: session.amount_total,
    chargeId: session.client_reference_id,
    currency: session.currency.toUpperCase(),
    paymentIntentId,
  };
};

export const createStripeConnect = ({
  secretKey,
  webhookSecret,
}: CreateStripeConnectOptions) => {
  const client = new Stripe(secretKey, {
    maxNetworkRetries: 2,
    timeout: 15_000,
  });

  /** Creates the club's connected account. Safe to retry: keyed on the club. */
  const createClubAccount = async ({
    clubName,
    contactEmail,
    country,
    currency,
    organizationId,
  }: CreateClubAccountInput): Promise<string> => {
    const account = await client.v2.core.accounts.create(
      {
        configuration: {
          merchant: { capabilities: { card_payments: { requested: true } } },
        },
        contact_email: contactEmail,
        dashboard: "full",
        defaults: {
          currency: currency.toLowerCase(),
          locales: [DEFAULT_LOCALE],
          responsibilities: {
            fees_collector: "stripe",
            losses_collector: "stripe",
          },
        },
        display_name: clubName,
        identity: { country: country.toLowerCase() },
        metadata: { organizationId },
      },
      { idempotencyKey: `club-account-${organizationId}` }
    );
    return account.id;
  };

  /** Stripe-hosted onboarding. Links are single-use, so make one per visit. */
  const createOnboardingLink = async ({
    accountId,
    refreshUrl,
    returnUrl,
  }: OnboardingLinkInput): Promise<string> => {
    const link = await client.v2.core.accountLinks.create({
      account: accountId,
      use_case: {
        account_onboarding: {
          refresh_url: refreshUrl,
          return_url: returnUrl,
        },
        type: "account_onboarding",
      },
    });
    return link.url;
  };

  /** Live status from Stripe. Re-check before taking a payment; webhooks can lag. */
  const getCardPaymentsStatus = async (
    accountId: string
  ): Promise<CardPaymentsStatus> => {
    const account = await client.v2.core.accounts.retrieve(accountId, {
      include: ["configuration.merchant"],
    });
    return toCardPaymentsStatus(
      account.configuration?.merchant?.capabilities?.card_payments?.status
    );
  };

  /**
   * A hosted Checkout page for one member paying one fee charge. Direct charge:
   * created on the club's account, so the club is the merchant of record.
   * Payment methods are left to the Dashboard (no payment_method_types).
   */
  const createMemberCheckout = async ({
    accountId,
    amountMinor,
    applicationFeeAmountMinor,
    cancelUrl,
    chargeId,
    currency,
    customerEmail,
    description,
    successUrl,
  }: MemberCheckoutInput): Promise<string> => {
    const status = await getCardPaymentsStatus(accountId);
    if (status !== "active") {
      throw new Error(
        `This club cannot take card payments yet (status: ${status}). Finish Stripe onboarding first.`
      );
    }
    const session = await client.checkout.sessions.create(
      {
        cancel_url: cancelUrl,
        client_reference_id: chargeId,
        customer_email: customerEmail,
        integration_identifier: INTEGRATION_IDENTIFIER,
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: { name: description },
              unit_amount: amountMinor,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        payment_intent_data:
          applicationFeeAmountMinor !== undefined &&
          applicationFeeAmountMinor > MIN_APPLICATION_FEE_MINOR
            ? { application_fee_amount: applicationFeeAmountMinor }
            : undefined,
        success_url: successUrl,
      },
      // One open checkout per charge; a retry returns the same session.
      {
        idempotencyKey: `member-checkout-${chargeId}-${amountMinor}`,
        stripeAccount: accountId,
      }
    );
    if (session.url === null) {
      throw new Error("Stripe returned a Checkout Session without a URL");
    }
    return session.url;
  };

  /** Verifies the signature of a v1 event on the Connect endpoint. Throws if it is not Stripe's. */
  const verifyEvent = (payload: string, signature: string): Stripe.Event =>
    client.webhooks.constructEvent(payload, signature, webhookSecret);

  /** Verifies and parses a v2 (thin) account notification, e.g. capability status changes. */
  const parseAccountNotification = (payload: string, signature: string) =>
    client.parseEventNotification(payload, signature, webhookSecret);

  return {
    createClubAccount,
    createMemberCheckout,
    createOnboardingLink,
    getCardPaymentsStatus,
    parseAccountNotification,
    verifyEvent,
  };
};

export type StripeConnect = ReturnType<typeof createStripeConnect>;
