// These mocks stand in for whole services and are shaped by what each test needs,
// so the strict mock-typing and test-layout style rules add noise without catching bugs.
/* oxlint-disable vitest/require-mock-type-parameters, vitest/require-top-level-describe, unicorn/consistent-function-scoping, unicorn/no-await-expression-member, typescript/promise-function-async */
import type { MemberPayment } from "@alice/payments";
import { beforeEach, describe, expect, it, vi } from "vitest";

import createApp from "@/lib/create-app";
import type { GetSession } from "@/middlewares/require-session";
import connectWebhook from "@/routes/webhooks/connect-webhook";
import { ConnectNotConfiguredError } from "@/services/connect-error";

import router from "./payments.index";

const USER = "11111111-1111-4111-8111-111111111111";
const ORG = "22222222-2222-4222-8222-222222222222";
const CHARGE = "44444444-4444-4444-8444-444444444444";
const ACCOUNT = "acct_club1";
const OWED_MINOR = 2500;

// The services read env and open real connections, so the tests replace them.
const mocks = vi.hoisted(() => ({
  amountOwedMinor: vi.fn<(id: string, amount: number) => Promise<number>>(),
  chargeFindFirst: vi.fn(),
  createClubAccount: vi.fn(),
  createMemberCheckout: vi.fn(),
  createOnboardingLink: vi.fn(),
  findClubAccount: vi.fn(),
  getCardPaymentsStatus: vi.fn(),
  getConnect: vi.fn(),
  getSession: vi.fn<GetSession>(),
  insertValues: vi.fn(),
  isBillingManager: vi.fn<() => Promise<boolean>>(),
  recordMemberPayment: vi.fn(),
  verifyEvent: vi.fn(),
}));

// Only what the handlers call is replaced, so string paths avoid typing whole modules.
// oxlint-disable-next-line vitest/prefer-import-in-mock
vi.mock("@/services/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
// oxlint-disable-next-line vitest/prefer-import-in-mock
vi.mock("@alice/authentication", () => ({
  isBillingManager: mocks.isBillingManager,
}));
// oxlint-disable-next-line vitest/prefer-import-in-mock
vi.mock("@/services/connect", () => ({ getConnect: mocks.getConnect }));
// oxlint-disable-next-line vitest/prefer-import-in-mock
vi.mock("@/services/member-payments", () => ({
  amountOwedMinor: mocks.amountOwedMinor,
  findClubAccount: mocks.findClubAccount,
  recordMemberPayment: mocks.recordMemberPayment,
}));
// oxlint-disable-next-line vitest/prefer-import-in-mock
vi.mock("@/services/database", () => ({
  db: {
    insert: () => ({
      values: (value: unknown) => {
        mocks.insertValues(value);
        return {
          onConflictDoNothing: async () => {
            await Promise.resolve();
          },
        };
      },
    }),
    query: {
      feeCharges: { findFirst: mocks.chargeFindFirst },
      organizations: {
        findFirst: async () => await Promise.resolve({ name: "Rovers FC" }),
      },
      users: {
        findFirst: async () =>
          await Promise.resolve({ email: "manager@example.com" }),
      },
    },
    update: () => ({
      set: () => ({
        where: async () => {
          await Promise.resolve();
        },
      }),
    }),
  },
}));
// oxlint-disable-next-line vitest/prefer-import-in-mock
vi.mock("@alice/database", () => ({ clubStripeAccounts: {} }));

const session = (activeOrganizationId: string | null = ORG) => ({
  session: { activeOrganizationId },
  user: { id: USER },
});

const app = createApp().route("/", router).route("/", connectWebhook);

const club = {
  cardPaymentsStatus: "active",
  organizationId: ORG,
  stripeAccountId: ACCOUNT,
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getSession.mockResolvedValue(session());
  mocks.isBillingManager.mockResolvedValue(true);
  mocks.getConnect.mockReturnValue({
    createClubAccount: mocks.createClubAccount,
    createMemberCheckout: mocks.createMemberCheckout,
    createOnboardingLink: mocks.createOnboardingLink,
    getCardPaymentsStatus: mocks.getCardPaymentsStatus,
    verifyEvent: mocks.verifyEvent,
  });
  mocks.createClubAccount.mockResolvedValue(ACCOUNT);
  mocks.createOnboardingLink.mockResolvedValue("https://connect.stripe.test/o");
  mocks.createMemberCheckout.mockResolvedValue(
    "https://checkout.stripe.test/c"
  );
  mocks.getCardPaymentsStatus.mockResolvedValue("active");
  mocks.amountOwedMinor.mockResolvedValue(OWED_MINOR);
});

describe("payments routes: who is calling", () => {
  it("returns 401 without a session", async () => {
    mocks.getSession.mockResolvedValue(null);
    const response = await app.request("/payments/connect/account");

    expect(response.status).toBe(401);
  });

  it("returns 403 when the caller is not an owner or admin", async () => {
    mocks.isBillingManager.mockResolvedValue(false);
    const response = await app.request("/payments/connect/account");

    expect(response.status).toBe(403);
    expect(mocks.getConnect).not.toHaveBeenCalled();
  });

  it("returns 503 until Connect keys are set", async () => {
    mocks.findClubAccount.mockResolvedValue(club);
    mocks.getConnect.mockImplementation(() => {
      throw new ConnectNotConfiguredError();
    });
    const response = await app.request("/payments/connect/account");

    expect(response.status).toBe(503);
  });
});

describe("payments routes: onboarding", () => {
  it("reports a club with no Stripe account as not connected", async () => {
    mocks.findClubAccount.mockResolvedValue(undefined);
    const response = await app.request("/payments/connect/account");

    await expect(response.json()).resolves.toStrictEqual({
      status: "not_connected",
    });
  });

  it("creates the Stripe account once, then returns an onboarding link", async () => {
    mocks.findClubAccount
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(club);
    const response = await app.request("/payments/connect/onboarding", {
      method: "POST",
    });

    await expect(response.json()).resolves.toStrictEqual({
      url: "https://connect.stripe.test/o",
    });
    expect(mocks.createClubAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        clubName: "Rovers FC",
        organizationId: ORG,
      })
    );
    expect(mocks.insertValues).toHaveBeenCalledWith({
      organizationId: ORG,
      stripeAccountId: ACCOUNT,
    });
  });

  it("reuses an existing Stripe account", async () => {
    mocks.findClubAccount.mockResolvedValue(club);
    await app.request("/payments/connect/onboarding", { method: "POST" });

    expect(mocks.createClubAccount).not.toHaveBeenCalled();
    expect(mocks.createOnboardingLink).toHaveBeenCalledWith(
      expect.objectContaining({ accountId: ACCOUNT })
    );
  });
});

describe("payments routes: checkout", () => {
  const checkoutRequest = () =>
    app.request(`/payments/connect/charges/${CHARGE}/checkout`, {
      method: "POST",
    });

  it("gives 404 for a charge outside the club", async () => {
    mocks.chargeFindFirst.mockResolvedValue(undefined);

    expect((await checkoutRequest()).status).toBe(404);
  });

  it("refuses a charge that is not due", async () => {
    mocks.chargeFindFirst.mockResolvedValue({ id: CHARGE, status: "paid" });

    expect((await checkoutRequest()).status).toBe(409);
  });

  it("charges what is still owed, on the club's account", async () => {
    mocks.chargeFindFirst.mockResolvedValue({
      amountMinor: 5000,
      currency: "GBP",
      fee: { name: "Subs" },
      id: CHARGE,
      status: "due",
    });
    mocks.findClubAccount.mockResolvedValue(club);
    const response = await checkoutRequest();

    await expect(response.json()).resolves.toStrictEqual({
      url: "https://checkout.stripe.test/c",
    });
    expect(mocks.createMemberCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: ACCOUNT,
        amountMinor: OWED_MINOR,
        chargeId: CHARGE,
        currency: "GBP",
      })
    );
  });

  it("tells the caller when the club has not finished onboarding", async () => {
    mocks.chargeFindFirst.mockResolvedValue({
      amountMinor: 5000,
      currency: "GBP",
      id: CHARGE,
      status: "due",
    });
    mocks.findClubAccount.mockResolvedValue(club);
    mocks.createMemberCheckout.mockRejectedValue(
      new Error("This club cannot take card payments yet (status: pending).")
    );

    expect((await checkoutRequest()).status).toBe(409);
  });
});

describe("connect webhook", () => {
  const paidEvent = {
    account: ACCOUNT,
    data: {
      object: {
        amount_total: OWED_MINOR,
        client_reference_id: CHARGE,
        currency: "gbp",
        payment_intent: "pi_1",
        payment_status: "paid",
      },
    },
    id: "evt_1",
    type: "checkout.session.completed",
  };

  const deliver = (signature: string | null = "t=1,v1=x") =>
    app.request("/webhooks/stripe/connect", {
      body: "{}",
      headers: signature === null ? {} : { "stripe-signature": signature },
      method: "POST",
    });

  it("rejects a request with no signature", async () => {
    expect((await deliver(null)).status).toBe(400);
  });

  it("rejects a bad signature without recording anything", async () => {
    mocks.verifyEvent.mockImplementation(() => {
      throw new Error("No signatures found");
    });

    expect((await deliver()).status).toBe(400);
    expect(mocks.recordMemberPayment).not.toHaveBeenCalled();
  });

  it("records a paid member checkout", async () => {
    mocks.verifyEvent.mockReturnValue(paidEvent);
    mocks.recordMemberPayment.mockResolvedValue("recorded");
    const response = await deliver();

    expect(response.status).toBe(200);
    expect(mocks.recordMemberPayment).toHaveBeenCalledWith({
      accountId: ACCOUNT,
      amountMinor: OWED_MINOR,
      chargeId: CHARGE,
      currency: "GBP",
      paymentIntentId: "pi_1",
    } satisfies MemberPayment);
  });

  it("acknowledges events it does not act on", async () => {
    mocks.verifyEvent.mockReturnValue({ ...paidEvent, type: "invoice.paid" });
    const response = await deliver();

    expect(response.status).toBe(200);
    expect(mocks.recordMemberPayment).not.toHaveBeenCalled();
  });
});
