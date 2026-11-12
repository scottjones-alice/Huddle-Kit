import type { Stripe } from "stripe";
import { describe, expect, it } from "vitest";

import { createStripeConnect, toMemberPayment } from "../src/index";

const AMOUNT_MINOR = 2500;

const checkoutEvent = (
  overrides: Partial<Stripe.Checkout.Session> = {},
  type = "checkout.session.completed",
  account: string | null = "acct_club1"
) =>
  // A hand-built event fixture: only the fields toMemberPayment reads.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  ({
    account: account ?? undefined,
    data: {
      object: {
        amount_total: AMOUNT_MINOR,
        client_reference_id: "charge-1",
        currency: "gbp",
        payment_intent: "pi_123",
        payment_status: "paid",
        ...overrides,
      },
    },
    type,
  }) as unknown as Stripe.Event;

describe(toMemberPayment, () => {
  it("reads a paid checkout on a connected account", () => {
    expect(toMemberPayment(checkoutEvent())).toStrictEqual({
      accountId: "acct_club1",
      amountMinor: AMOUNT_MINOR,
      chargeId: "charge-1",
      currency: "GBP",
      paymentIntentId: "pi_123",
    });
  });

  it("accepts a delayed payment that later succeeds", () => {
    expect(
      toMemberPayment(
        checkoutEvent({}, "checkout.session.async_payment_succeeded")
      )
    ).not.toBeNull();
  });

  it("ignores a checkout that is not paid yet", () => {
    expect(
      toMemberPayment(checkoutEvent({ payment_status: "unpaid" }))
    ).toBeNull();
  });

  it("ignores events from the platform account or without our charge id", () => {
    expect(
      toMemberPayment(checkoutEvent({}, "checkout.session.completed", null))
    ).toBeNull();
    expect(
      toMemberPayment(checkoutEvent({ client_reference_id: null }))
    ).toBeNull();
  });

  it("ignores other event types", () => {
    expect(toMemberPayment(checkoutEvent({}, "invoice.paid"))).toBeNull();
  });
});

describe(createStripeConnect, () => {
  it("exposes the club account and payment operations", () => {
    const connect = createStripeConnect({
      secretKey: "sk_test_123",
      webhookSecret: "whsec_test",
    });

    expect(Object.keys(connect)).toStrictEqual(
      expect.arrayContaining([
        "createClubAccount",
        "createMemberCheckout",
        "createOnboardingLink",
        "getCardPaymentsStatus",
        "parseAccountNotification",
        "verifyEvent",
      ])
    );
  });

  it("rejects a webhook that is not signed by Stripe", () => {
    const connect = createStripeConnect({
      secretKey: "sk_test_123",
      webhookSecret: "whsec_test",
    });

    expect(() => connect.verifyEvent("{}", "t=1,v1=bad")).toThrow(
      "No signatures found matching the expected signature"
    );
  });
});
