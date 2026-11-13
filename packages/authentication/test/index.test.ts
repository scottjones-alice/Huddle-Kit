import { createDatabase } from "@alice/database";
import { describe, expect, it, vi } from "vitest";

import { createAuth } from "../src/index";
import type { AuthMailer } from "../src/index";

const makeMailer = (): AuthMailer => ({
  sendAccountExists: vi.fn<() => void>(),
  sendInvitation: vi.fn<() => void>(),
  sendPasswordChanged: vi.fn<() => void>(),
  sendPasswordReset: vi.fn<() => void>(),
  sendVerification: vi.fn<() => void>(),
  sendWelcome: vi.fn<() => void>(),
});

const makeAuth = (mailer = makeMailer()) =>
  createAuth({
    baseURL: "http://localhost:9000",
    billing: {
      clubPriceId: "price_test",
      secretKey: "sk_test_123",
      webhookSecret: "whsec_test",
    },
    // The pool connects lazily and building the instance never queries.
    db: createDatabase({ url: "postgres://u:p@localhost:5432/none" }),
    mailer,
    nativeScheme: "huddlekit",
    passkey: { rpID: "localhost", rpName: "Test" },
    platformURL: "http://localhost:8000",
    secret: "x".repeat(32),
    trustedOrigins: ["http://localhost:3000"],
  });

describe("@alice/authentication", () => {
  it("exports the auth factory", () => {
    expect(createAuth).toBeTypeOf("function");
  });

  it("does not let users change their email", () => {
    const auth = makeAuth();

    expect(auth.options.user.changeEmail.enabled).toBeFalsy();
    expect(auth.api).not.toHaveProperty("changeEmail.disabled");
    expect(auth.options.user.deleteUser.enabled).toBeFalsy();
  });

  it("requires verified email and strong passwords", () => {
    const { emailAndPassword } = makeAuth().options;

    expect(emailAndPassword.requireEmailVerification).toBeTruthy();
    expect(emailAndPassword.minPasswordLength).toBeGreaterThanOrEqual(12);
    expect(emailAndPassword.revokeSessionsOnPasswordReset).toBeTruthy();
  });

  it("sends the verification email through the injected mailer", async () => {
    const mailer = makeMailer();
    const { emailVerification } = makeAuth(mailer).options;

    await emailVerification.sendVerificationEmail({
      token: "t",
      url: "http://localhost:9000/api/auth/verify-email?token=t",
      user: {
        createdAt: new Date(),
        email: "a@b.co",
        emailVerified: false,
        id: "1",
        name: "Ada",
        updatedAt: new Date(),
      },
    });

    expect(mailer.sendVerification).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Ada", to: "a@b.co" })
    );
  });
});
