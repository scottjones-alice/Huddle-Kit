import type { Stripe } from "stripe";
import { describe, expect, it } from "vitest";

import { createClubBilling, subscriptionIdFromEvent } from "../src/index";

const event = (type: string, object: unknown) =>
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  ({ data: { object }, id: "evt_test", type }) as unknown as Stripe.Event;

describe("@alice/payments club billing", () => {
  it("builds a client without calling Stripe", () => {
    const billing = createClubBilling({
      clubAnnualPriceId: "price_annual_test",
      clubPriceId: "price_test",
      secretKey: "sk_test_123",
      webhookSecret: "whsec_test",
    });

    expect(Object.keys(billing)).toStrictEqual(
      expect.arrayContaining([
        "createCheckoutSession",
        "createCustomer",
        "createPortalSession",
        "readSubscription",
        "setCancelAtPeriodEnd",
        "verifyEvent",
      ])
    );
  });

  it("rejects a webhook with a bad signature", () => {
    const billing = createClubBilling({
      clubAnnualPriceId: "price_annual_test",
      clubPriceId: "price_test",
      secretKey: "sk_test_123",
      webhookSecret: "whsec_test",
    });

    expect(() => billing.verifyEvent("{}", "t=1,v1=bad")).toThrow(
      /signature/iu
    );
  });

  it("finds the subscription in a completed subscription checkout", () => {
    expect(
      subscriptionIdFromEvent(
        event("checkout.session.completed", {
          mode: "subscription",
          subscription: "sub_123",
        })
      )
    ).toBe("sub_123");
  });

  it("ignores a completed checkout that is not a subscription", () => {
    expect(
      subscriptionIdFromEvent(
        event("checkout.session.completed", {
          mode: "payment",
          subscription: null,
        })
      )
    ).toBeNull();
  });

  it("finds the subscription in a subscription change", () => {
    expect(
      subscriptionIdFromEvent(
        event("customer.subscription.updated", { id: "sub_456" })
      )
    ).toBe("sub_456");
  });

  it("ignores events it does not act on", () => {
    expect(
      subscriptionIdFromEvent(event("invoice.paid", { id: "in_1" }))
    ).toBeNull();
  });
});
