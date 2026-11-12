import { beforeEach, describe, expect, it, vi } from "vitest";

import createApp from "@/lib/create-app";
import type { GetSession } from "@/middlewares/require-session";
import { SlugTakenError } from "@/services/club-onboarding";
import { NotYourChildError } from "@/services/member-onboarding";

import router from "./onboarding.index";

const USER = "11111111-1111-4111-8111-111111111111";
const ORG = "22222222-2222-4222-8222-222222222222";

const { complete, getProgress, getSession, isManager, save, saveMember } =
  vi.hoisted(() => ({
    complete: vi.fn<(...args: unknown[]) => Promise<void>>(),
    getProgress: vi.fn<
      (...args: unknown[]) => Promise<{
        completed: string[];
        next: string | null;
        steps: string[];
      }>
    >(),
    getSession: vi.fn<GetSession>(),
    isManager: vi.fn<(...args: unknown[]) => Promise<boolean>>(),
    save: vi.fn<(...args: unknown[]) => Promise<void>>(),
    saveMember: vi.fn<(...args: unknown[]) => Promise<void>>(),
  }));

vi.mock(import("@alice/database"), async (importOriginal) => ({
  ...(await importOriginal()),
  completeOnboardingStep: complete,
  getOnboardingProgress: getProgress,
}));
// oxlint-disable-next-line vitest/prefer-import-in-mock
vi.mock("@alice/authentication", () => ({ isBillingManager: isManager }));
// oxlint-disable-next-line vitest/prefer-import-in-mock
vi.mock("@/services/auth", () => ({ auth: { api: { getSession } } }));
// oxlint-disable-next-line vitest/prefer-import-in-mock
vi.mock("@/services/database", () => ({ db: {} }));
// oxlint-disable-next-line vitest/prefer-import-in-mock
vi.mock("@/services/draft-encryptor", () => ({
  draftEncryptor: {
    decrypt: vi.fn<() => string>(),
    encrypt: vi.fn<() => string>(),
  },
}));
vi.mock(import("@/services/member-onboarding"), async (importOriginal) => ({
  ...(await importOriginal()),
  saveMemberStep: saveMember,
}));
vi.mock(import("@/services/club-onboarding"), async (importOriginal) => ({
  ...(await importOriginal()),
  saveClubStep: save,
}));

const app = createApp().route("/", router);

const put = (body: unknown) => ({
  body: JSON.stringify(body),
  headers: { "Content-Type": "application/json" },
  method: "PUT",
});

const validFees = {
  absorbDirectDebitFee: false,
  frequency: "monthly",
  lateReminders: true,
  siblingDiscount: false,
  subscriptionMinor: 2500,
};

describe("onboarding routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getSession.mockResolvedValue({
      session: { activeOrganizationId: ORG },
      user: { id: USER },
    });
    isManager.mockResolvedValue(true);
    getProgress.mockResolvedValue({
      completed: [],
      next: "club",
      steps: ["club"],
    });
  });

  it("returns 401 without a session", async () => {
    getSession.mockResolvedValue(null);

    const response = await app.request("/onboarding");

    expect(response.status).toBe(401);
  });

  it("returns progress for the user and the club", async () => {
    const response = await app.request("/onboarding");

    expect(response.status).toBe(200);
    expect(getProgress).toHaveBeenCalledTimes(2);
  });

  it("saves a club step and marks it done", async () => {
    const response = await app.request("/onboarding/club/fees", put(validFees));

    expect(response.status).toBe(200);
    expect(save).toHaveBeenCalledOnce();
    expect(complete).toHaveBeenCalledExactlyOnceWith(
      {},
      { organizationId: ORG },
      "fees",
      USER
    );
  });

  it("refuses a club step from someone who is not an owner or admin", async () => {
    isManager.mockResolvedValue(false);

    const response = await app.request("/onboarding/club/fees", put(validFees));

    expect(response.status).toBe(403);
    expect(save).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();
  });

  it("returns 422 with the bad fields and saves nothing", async () => {
    const response = await app.request(
      "/onboarding/club/fees",
      put({ ...validFees, subscriptionMinor: -5 })
    );

    expect(response.status).toBe(422);
    expect(save).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();
  });

  it("returns 409 when the club address is taken", async () => {
    save.mockRejectedValue(new SlugTakenError());

    const response = await app.request("/onboarding/club/fees", put(validFees));

    expect(response.status).toBe(409);
    expect(complete).not.toHaveBeenCalled();
  });

  it("refuses to mark an automatic step from a client", async () => {
    const response = await app.request("/onboarding/club/payouts", put({}));

    expect(response.status).toBe(422);
  });

  it("saves a people step for the signed-in person", async () => {
    const response = await app.request(
      "/onboarding/member/address",
      put({ city: "Leeds", countryCode: "GB", line1: "1 High St" })
    );

    expect(response.status).toBe(200);
    expect(saveMember).toHaveBeenCalledOnce();
    expect(complete).toHaveBeenCalledExactlyOnceWith(
      {},
      { userId: USER },
      "address",
      USER
    );
  });

  it("saves the founder's you step with the details rules", async () => {
    const response = await app.request(
      "/onboarding/member/you",
      put({ firstName: "Sam", lastName: "Lee" })
    );

    expect(response.status).toBe(200);
    expect(complete).toHaveBeenCalledExactlyOnceWith(
      {},
      { userId: USER },
      "you",
      USER
    );
  });

  it("returns 422 for a people step with bad fields", async () => {
    const response = await app.request(
      "/onboarding/member/address",
      put({ city: "Leeds", countryCode: "gb" })
    );

    expect(response.status).toBe(422);
    expect(saveMember).not.toHaveBeenCalled();
  });

  it("returns 403 when a child is not the caller's", async () => {
    saveMember.mockRejectedValue(new NotYourChildError());

    const response = await app.request(
      "/onboarding/member/permissions",
      put({ children: [{ consents: { travel: true }, id: USER }] })
    );

    expect(response.status).toBe(403);
    expect(complete).not.toHaveBeenCalled();
  });
});
