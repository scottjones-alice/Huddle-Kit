import { createAuth } from "@alice/authentication";
import type { AuthMailer } from "@alice/authentication";
import { keys as authKeys } from "@alice/authentication/keys";
import { keys as paymentKeys } from "@alice/payments/keys";

import { keys } from "@/keys";
import { db } from "@/services/database";
import { notifyWelcome } from "@/services/notifications";
import { sendEmail } from "@/services/resend";

const {
  AUTH_COOKIE_DOMAIN,
  AUTH_RATE_LIMIT_ENABLED,
  AUTH_NATIVE_SCHEME,
  BETTER_AUTH_SECRET,
  BETTER_AUTH_URL,
  PASSKEY_RP_ID,
  PASSKEY_RP_NAME,
  PLATFORM_URL,
} = authKeys();
const { CORS_ORIGINS } = keys();
const {
  AUTH_STRIPE_CLUB_PRICE_ID,
  AUTH_STRIPE_SECRET_KEY,
  AUTH_STRIPE_WEBHOOK_SECRET,
} = paymentKeys();

/** sendEmail never throws and Better Auth never awaits these, so no timing leak. */
const mailer: AuthMailer = {
  sendAccountExists: ({ forgotPasswordUrl, name, signInUrl, to }) => {
    void sendEmail({
      props: { forgotPasswordUrl, name, signInUrl },
      template: "account-exists",
      to,
    });
  },
  sendInvitation: ({ inviteUrl, inviterName, teamName, to }) => {
    void sendEmail({
      props: { inviteUrl, inviterName, teamName },
      template: "accept-invite",
      to,
    });
  },
  sendPasswordChanged: ({ name, signInUrl, to }) => {
    void sendEmail({
      props: { name, signInUrl },
      template: "password-reset",
      to,
    });
  },
  sendPasswordReset: ({ expiresInMinutes, name, resetUrl, to }) => {
    void sendEmail({
      props: { expiresInMinutes, name, resetUrl },
      template: "forgot-password",
      to,
    });
  },
  sendVerification: ({ expiresInMinutes, name, to, verificationUrl }) => {
    void sendEmail({
      props: { expiresInMinutes, name, verificationUrl },
      template: "verify-email",
      to,
    });
  },
  sendWelcome: ({ getStartedUrl, name, to, userId }) => {
    void sendEmail({
      props: { getStartedUrl, name },
      template: "welcome",
      to,
    });
    void notifyWelcome({ email: to, getStartedUrl, name, userId });
  },
};

export const auth = createAuth({
  baseURL: BETTER_AUTH_URL,
  billing: {
    clubPriceId: AUTH_STRIPE_CLUB_PRICE_ID,
    secretKey: AUTH_STRIPE_SECRET_KEY,
    webhookSecret: AUTH_STRIPE_WEBHOOK_SECRET,
  },
  cookieDomain: AUTH_COOKIE_DOMAIN,
  db,
  mailer,
  nativeScheme: AUTH_NATIVE_SCHEME,
  passkey: { rpID: PASSKEY_RP_ID, rpName: PASSKEY_RP_NAME },
  platformURL: PLATFORM_URL,
  rateLimitEnabled: AUTH_RATE_LIMIT_ENABLED,
  secret: BETTER_AUTH_SECRET,
  trustedOrigins: CORS_ORIGINS,
});
