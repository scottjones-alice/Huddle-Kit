import { describe, expect, it, vi } from "vitest";

import createApp from "@/lib/create-app";

import router from "./internal.index";

const { sendDue } = vi.hoisted(() => ({
  sendDue: vi.fn<() => Promise<number>>().mockResolvedValue(2),
}));

// oxlint-disable-next-line vitest/prefer-import-in-mock
vi.mock("@alice/authentication/keys", () => ({
  keys: () => ({ PLATFORM_URL: "http://localhost:8000" }),
}));
// oxlint-disable-next-line vitest/prefer-import-in-mock
vi.mock("@/services/database", () => ({ db: {} }));
// oxlint-disable-next-line vitest/prefer-import-in-mock
vi.mock("@/services/resend", () => ({ sendEmail: vi.fn<() => void>() }));
vi.mock(import("@/services/onboarding-reminders"), async (importOriginal) => ({
  ...(await importOriginal()),
  sendDueOnboardingReminders: sendDue,
}));

const app = createApp().route("/", router);
const SECRET = "test-cron-secret-test-cron-secret-1234";

describe("scheduled job endpoints", () => {
  it("refuses a call without the secret", async () => {
    const response = await app.request("/internal/onboarding-reminders", {
      method: "POST",
    });

    expect(response.status).toBe(401);
    expect(sendDue).not.toHaveBeenCalled();
  });

  it("refuses the wrong secret", async () => {
    const response = await app.request("/internal/onboarding-reminders", {
      headers: { "x-cron-secret": "nope" },
      method: "POST",
    });

    expect(response.status).toBe(401);
  });

  it("runs the reminders with the right secret", async () => {
    const response = await app.request("/internal/onboarding-reminders", {
      headers: { "x-cron-secret": SECRET },
      method: "POST",
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toStrictEqual({ sent: 2 });
  });
});
