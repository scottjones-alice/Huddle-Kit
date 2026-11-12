import { describe, expect, it } from "vitest";

import { createStripeBilling } from "../src/index";

describe("@alice/payments", () => {
  it("builds the Stripe plugin and the club-only guard", () => {
    const plugins = createStripeBilling({
      canManageBilling: async () => await Promise.resolve(false),
      clubPriceId: "price_test",
      secretKey: "sk_test_123",
      webhookSecret: "whsec_test",
    });

    expect(plugins.map((plugin) => plugin.id)).toStrictEqual([
      "stripe",
      "club-billing-only",
    ]);
  });
});
