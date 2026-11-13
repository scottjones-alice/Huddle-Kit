// These mocks stand in for whole services and are shaped by what each test needs,
// so the strict mock-typing and test-layout style rules add noise without catching bugs.
/* oxlint-disable vitest/require-mock-type-parameters, vitest/require-top-level-describe, unicorn/consistent-function-scoping, unicorn/no-await-expression-member, typescript/promise-function-async */
import { beforeEach, describe, expect, it, vi } from "vitest";

import createApp from "@/lib/create-app";
import type { GetSession } from "@/middlewares/require-session";
import billingWebhook from "@/routes/webhooks/billing-webhook";

import router from "./billing.index";

const USER = "11111111-1111-4111-8111-111111111111";
const ORG = "22222222-2222-4222-8222-222222222222";
const SUBSCRIPTION_ID = "33333333-3333-4333-8333-333333333333";
const PLATFORM = "https://app.huddlekit.test";

const mocks = vi.hoisted(() => ({
  createCheckoutSession: vi.fn(),
  createPortalSession: vi.fn(),
  ensureStripeCustomer: vi.fn(),
  findCurrentSubscription: vi.fn(),
  getSession: vi.fn<GetSession>(),
  isBillingManager: vi.fn<() => Promise<boolean>>(),
  organizationFindFirst: vi.fn(),
  processBillingEvent: vi.fn(),
  setCancelAtPeriodEnd: vi.fn(),
  syncSubscription: vi.fn(),
  verifyEvent: vi.fn(),
}));

// oxlint-disable-next-line vitest/prefer-import-in-mock
vi.mock("@/services/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
// oxlint-disable-next-line vitest/prefer-import-in-mock
vi.mock("@alice/authentication", () => ({
  isBillingManager: mocks.isBillingManager,
}));
// oxlint-disable-next-line vitest/prefer-import-in-mock
vi.mock("@alice/authentication/keys", () => ({
  keys: () => ({ PLATFORM_URL: PLATFORM }),
}));
// oxlint-disable-next-line vitest/prefer-import-in-mock
vi.mock("@/services/club-billing", () => ({
  getClubBilling: () => ({
    createCheckoutSession: mocks.createCheckoutSession,
    createPortalSession: mocks.createPortalSession,
    setCancelAtPeriodEnd: mocks.setCancelAtPeriodEnd,
    verifyEvent: mocks.verifyEvent,
  }),
}));
// oxlint-disable-next-line vitest/prefer-import-in-mock
vi.mock("@/services/club-subscriptions", () => ({
  ensureStripeCustomer: mocks.ensureStripeCustomer,
  findCurrentSubscription: mocks.findCurrentSubscription,
  processBillingEvent: mocks.processBillingEvent,
  syncSubscription: mocks.syncSubscription,
}));
// oxlint-disable-next-line vitest/prefer-import-in-mock
vi.mock("@/services/database", () => ({
  db: {
    query: {
      organizations: { findFirst: mocks.organizationFindFirst },
      users: {
        findFirst: async () =>
          await Promise.resolve({ email: "manager@example.com" }),
      },
    },
  },
}));

const app = createApp().route("/", router).route("/", billingWebhook);

const subscription = {
  billingInterval: "yearly" as const,
  cancelAt: null,
  cancelAtPeriodEnd: false,
  currentPeriodEnd: new Date("2027-01-01T00:00:00.000Z"),
  id: SUBSCRIPTION_ID,
  status: "active" as const,
  stripeSubscriptionId: "sub_123",
};

const post = (path: string, body?: unknown) =>
  app.request(path, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST",
  });

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getSession.mockResolvedValue({
    session: { activeOrganizationId: ORG },
    user: { id: USER },
  });
  mocks.isBillingManager.mockResolvedValue(true);
  mocks.findCurrentSubscription.mockResolvedValue(undefined);
  mocks.ensureStripeCustomer.mockResolvedValue("cus_123");
  mocks.createCheckoutSession.mockResolvedValue("cs_secret_123");
  mocks.createPortalSession.mockResolvedValue("https://billing.stripe.test/p");
});

describe("billing routes: who is calling", () => {
  it("returns 401 without a session", async () => {
    mocks.getSession.mockResolvedValue(null);

    expect((await app.request("/billing")).status).toBe(401);
  });

  it("returns 403 when the caller is not an owner or admin", async () => {
    mocks.isBillingManager.mockResolvedValue(false);

    expect((await app.request("/billing")).status).toBe(403);
    expect(
      (await post("/billing/checkout", { interval: "yearly" })).status
    ).toBe(403);
    expect(mocks.createCheckoutSession).not.toHaveBeenCalled();
  });
});

describe("billing routes: status", () => {
  it("returns null for a club that never subscribed", async () => {
    const response = await app.request("/billing");

    await expect(response.json()).resolves.toStrictEqual({
      subscription: null,
    });
  });

  it("returns the current subscription without Stripe ids", async () => {
    mocks.findCurrentSubscription.mockResolvedValue(subscription);
    const response = await app.request("/billing");

    await expect(response.json()).resolves.toStrictEqual({
      subscription: {
        billingInterval: "yearly",
        cancelAt: null,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: "2027-01-01T00:00:00.000Z",
        id: SUBSCRIPTION_ID,
        status: "active",
      },
    });
  });
});

describe("billing routes: checkout", () => {
  it("returns a client secret for the chosen interval", async () => {
    const response = await post("/billing/checkout", { interval: "monthly" });

    await expect(response.json()).resolves.toStrictEqual({
      clientSecret: "cs_secret_123",
    });
    expect(mocks.createCheckoutSession).toHaveBeenCalledWith({
      customerId: "cus_123",
      interval: "monthly",
      organizationId: ORG,
      returnUrl: `${PLATFORM}/settings/billing?checkout=complete&session_id={CHECKOUT_SESSION_ID}`,
    });
  });

  it("refuses a second subscription for the same club", async () => {
    mocks.findCurrentSubscription.mockResolvedValue(subscription);
    const response = await post("/billing/checkout", { interval: "yearly" });

    expect(response.status).toBe(409);
    expect(mocks.createCheckoutSession).not.toHaveBeenCalled();
  });

  it("rejects an interval that is not offered", async () => {
    const response = await post("/billing/checkout", { interval: "weekly" });

    expect(response.status).toBe(422);
    expect(mocks.createCheckoutSession).not.toHaveBeenCalled();
  });
});

describe("billing routes: portal, cancel and restore", () => {
  it("opens the portal for a club that has a Stripe customer", async () => {
    mocks.organizationFindFirst.mockResolvedValue({
      stripeCustomerId: "cus_1",
    });
    const response = await post("/billing/portal");

    await expect(response.json()).resolves.toStrictEqual({
      url: "https://billing.stripe.test/p",
    });
  });

  it("answers 409 for the portal when the club never subscribed", async () => {
    mocks.organizationFindFirst.mockResolvedValue({ stripeCustomerId: null });

    expect((await post("/billing/portal")).status).toBe(409);
  });

  it("schedules cancellation at period end and returns the new state", async () => {
    mocks.findCurrentSubscription
      .mockResolvedValueOnce(subscription)
      .mockResolvedValueOnce({ ...subscription, cancelAtPeriodEnd: true });
    const response = await post("/billing/cancel");

    expect(mocks.setCancelAtPeriodEnd).toHaveBeenCalledWith("sub_123", true);
    expect(mocks.syncSubscription).toHaveBeenCalledWith("sub_123");
    await expect(response.json()).resolves.toMatchObject({
      subscription: { cancelAtPeriodEnd: true },
    });
  });

  it("answers 409 for cancel when there is nothing to cancel", async () => {
    expect((await post("/billing/cancel")).status).toBe(409);
    expect(mocks.setCancelAtPeriodEnd).not.toHaveBeenCalled();
  });

  it("undoes a scheduled cancellation", async () => {
    mocks.findCurrentSubscription.mockResolvedValue({
      ...subscription,
      cancelAtPeriodEnd: true,
    });
    await post("/billing/restore");

    expect(mocks.setCancelAtPeriodEnd).toHaveBeenCalledWith("sub_123", false);
  });
});

describe("billing webhook", () => {
  const send = (headers: Record<string, string> = {}) =>
    app.request("/webhooks/stripe/billing", {
      body: "{}",
      headers,
      method: "POST",
    });

  it("returns 400 without a signature", async () => {
    expect((await send()).status).toBe(400);
    expect(mocks.processBillingEvent).not.toHaveBeenCalled();
  });

  it("returns 400 and does nothing when the signature is wrong", async () => {
    mocks.verifyEvent.mockImplementation(() => {
      throw new Error("bad signature");
    });

    expect((await send({ "stripe-signature": "t=1,v1=bad" })).status).toBe(400);
    expect(mocks.processBillingEvent).not.toHaveBeenCalled();
  });

  it("hands a verified event to the processor and returns 200", async () => {
    const event = { id: "evt_1", type: "customer.subscription.updated" };
    mocks.verifyEvent.mockReturnValue(event);
    mocks.processBillingEvent.mockResolvedValue("applied");
    const response = await send({ "stripe-signature": "t=1,v1=ok" });

    expect(response.status).toBe(200);
    expect(mocks.processBillingEvent).toHaveBeenCalledWith(event);
  });

  it("returns 200 for a replayed event so Stripe stops resending", async () => {
    mocks.verifyEvent.mockReturnValue({ id: "evt_1", type: "x" });
    mocks.processBillingEvent.mockResolvedValue("duplicate");

    expect((await send({ "stripe-signature": "t=1,v1=ok" })).status).toBe(200);
  });
});
