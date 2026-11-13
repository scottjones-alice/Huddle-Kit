// The database and Stripe are replaced; what is tested is the order of the steps.
/* oxlint-disable vitest/require-mock-type-parameters, vitest/require-top-level-describe, typescript/promise-function-async */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { processBillingEvent } from "./club-subscriptions";
import type { VerifiedEvent } from "./club-subscriptions";

const ORG = "22222222-2222-4222-8222-222222222222";

const mocks = vi.hoisted(() => ({
  completeOnboardingStep: vi.fn(),
  insertEvent: vi.fn(),
  insertSubscription: vi.fn(),
  readSubscription: vi.fn(),
  selectEvent: vi.fn(),
}));

// oxlint-disable-next-line vitest/prefer-import-in-mock
vi.mock("@alice/database", () => ({
  clubSubscriptions: { stripeSubscriptionId: "stripe_subscription_id" },
  completeOnboardingStep: mocks.completeOnboardingStep,
  organizations: {},
  stripeEvents: { id: "id" },
}));
// oxlint-disable-next-line vitest/prefer-import-in-mock
vi.mock("@/services/club-billing", () => ({
  getClubBilling: () => ({ readSubscription: mocks.readSubscription }),
}));
// oxlint-disable-next-line vitest/prefer-import-in-mock
vi.mock("@/services/database", () => {
  const tx = {
    insert: (table: { id?: string }) =>
      table.id === "id"
        ? {
            values: () => ({
              onConflictDoNothing: () => ({ returning: mocks.insertEvent }),
            }),
          }
        : {
            values: () => ({ onConflictDoUpdate: mocks.insertSubscription }),
          },
  };
  return {
    db: {
      ...tx,
      select: () => ({
        from: () => ({ where: () => ({ limit: mocks.selectEvent }) }),
      }),
      transaction: async (run: (t: typeof tx) => Promise<unknown>) =>
        await run(tx),
    },
  };
});

const state = {
  billingInterval: "yearly" as const,
  cancelAt: null,
  cancelAtPeriodEnd: false,
  canceledAt: null,
  currentPeriodEnd: new Date("2027-01-01T00:00:00.000Z"),
  endedAt: null,
  organizationId: ORG,
  status: "active" as const,
  stripeCustomerId: "cus_123",
  stripeSubscriptionId: "sub_123",
};

// A stand-in for a verified Stripe event: only the fields the processor reads.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const asEvent = (value: unknown) => value as VerifiedEvent;

const subscriptionEvent = asEvent({
  data: { object: { id: "sub_123" } },
  id: "evt_1",
  type: "customer.subscription.updated",
});

beforeEach(() => {
  vi.resetAllMocks();
  mocks.selectEvent.mockResolvedValue([]);
  mocks.insertEvent.mockResolvedValue([{ id: "evt_1" }]);
  mocks.readSubscription.mockResolvedValue(state);
});

describe(processBillingEvent, () => {
  it("saves the subscription and ticks the billing step when it is paid", async () => {
    await expect(processBillingEvent(subscriptionEvent)).resolves.toBe(
      "applied"
    );
    expect(mocks.insertSubscription).toHaveBeenCalledOnce();
    expect(mocks.completeOnboardingStep).toHaveBeenCalledWith(
      expect.anything(),
      { organizationId: ORG },
      "billing"
    );
  });

  it("does not tick the billing step while payment is outstanding", async () => {
    mocks.readSubscription.mockResolvedValue({ ...state, status: "past_due" });
    await processBillingEvent(subscriptionEvent);

    expect(mocks.insertSubscription).toHaveBeenCalledOnce();
    expect(mocks.completeOnboardingStep).not.toHaveBeenCalled();
  });

  it("does nothing for an event it has already recorded", async () => {
    mocks.selectEvent.mockResolvedValue([{ id: "evt_1" }]);

    await expect(processBillingEvent(subscriptionEvent)).resolves.toBe(
      "duplicate"
    );
    expect(mocks.readSubscription).not.toHaveBeenCalled();
    expect(mocks.insertSubscription).not.toHaveBeenCalled();
  });

  it("does nothing when two deliveries race and the other one wins", async () => {
    mocks.insertEvent.mockResolvedValue([]);

    await expect(processBillingEvent(subscriptionEvent)).resolves.toBe(
      "duplicate"
    );
    expect(mocks.insertSubscription).not.toHaveBeenCalled();
    expect(mocks.completeOnboardingStep).not.toHaveBeenCalled();
  });

  it("records but ignores events that are not about a subscription", async () => {
    const other = asEvent({
      data: { object: { id: "in_1" } },
      id: "evt_2",
      type: "invoice.paid",
    });

    await expect(processBillingEvent(other)).resolves.toBe("ignored");
    expect(mocks.readSubscription).not.toHaveBeenCalled();
  });

  it("reports a subscription that does not belong to a club", async () => {
    mocks.readSubscription.mockResolvedValue(null);

    await expect(processBillingEvent(subscriptionEvent)).resolves.toBe(
      "unmatched"
    );
    expect(mocks.insertSubscription).not.toHaveBeenCalled();
  });
});
