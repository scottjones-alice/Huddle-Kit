import { ac, organizationRoles } from "@alice/authorization";
import * as schema from "@alice/database";
import { completeOnboardingStep } from "@alice/database";
import type { Database } from "@alice/database";
import { createStripeBilling } from "@alice/payments";
import type { CreateStripeBillingOptions } from "@alice/payments";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { expo } from "@better-auth/expo";
import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { organization } from "better-auth/plugins";
import { z } from "zod";

import { resolveAppURL } from "./app-url";
import { isBillingManager } from "./billing-access";
import type { AuthMailer } from "./mailer";
import { PASSWORD_LIMITS } from "./password-rules";

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_DAY = 24 * 60 * SECONDS_PER_MINUTE;
const SESSION_LIFETIME_DAYS = 7;
const SESSION_REFRESH_DAYS = 1;
const SESSION_FRESH_MINUTES = 5;
const SESSION_COOKIE_CACHE_SECONDS = 60;
const VERIFICATION_LIFETIME_SECONDS = 60 * SECONDS_PER_MINUTE;
const RESET_LIFETIME_SECONDS = 30 * SECONDS_PER_MINUTE;
const signUpBodySchema = z.object({ email: z.string() });

const SIGN_IN_RATE_LIMIT = { max: 5, window: 60 } as const;

export interface CreateAuthOptions {
  db: Database;
  secret: string;
  /** Public URL of the API, for example http://localhost:9000. */
  baseURL: string;
  /** Browser origins allowed to call the auth endpoints. */
  trustedOrigins: string[];
  /** Parent domain to share the session cookie across subdomains, e.g. "huddlekit.app". */
  cookieDomain?: string;
  /** URL scheme of the native app (app.json "scheme"), e.g. "huddlekit". */
  nativeScheme: string;
  /** Passkey relying party: the domain passkeys are tied to, and its display name. */
  passkey: { rpID: string; rpName: string };
  /** Public URL of the platform web app, e.g. http://localhost:8000. Invite links point here. */
  platformURL: string;
  /** Clubs paying us through Stripe. The membership check is supplied here. */
  billing: Omit<CreateStripeBillingOptions, "canManageBilling">;
  /** Set false only for end-to-end tests. Defaults to true. */
  rateLimitEnabled?: boolean;
  /** Sends the transactional emails. Injected so this package never owns a provider. */
  mailer: AuthMailer;
}

/**
 * Better Auth wired to the app database. The package never logs; callers decide
 * what to record. Tables are the ones in @alice/database's authentication schema.
 *
 * Email addresses are fixed once an account exists: `changeEmail` is off and
 * `updateUser` refuses `email`, so people cannot move an account to another address.
 */
export const createAuth = ({
  baseURL,
  db,
  billing,
  cookieDomain,
  mailer,
  nativeScheme,
  passkey: passkeyOptions,
  platformURL,
  rateLimitEnabled = true,
  secret,
  trustedOrigins,
}: CreateAuthOptions) => {
  // Web origins plus the native app's deep-link scheme (huddlekit://).
  const allTrustedOrigins = [...trustedOrigins, `${nativeScheme}://`];

  return betterAuth({
    advanced: {
      // Cookies are named huddlekit.session_token and so on.
      cookiePrefix: "huddlekit",
      // With a domain set, the website and platform share one session cookie.
      crossSubDomainCookies:
        cookieDomain === undefined
          ? { enabled: false }
          : { domain: cookieDomain, enabled: true },
      database: { generateId: "uuid" },
    },
    baseURL,
    database: drizzleAdapter(db, { provider: "pg", schema, usePlural: true }),
    emailAndPassword: {
      enabled: true,
      maxPasswordLength: PASSWORD_LIMITS.max,
      minPasswordLength: PASSWORD_LIMITS.min,
      onPasswordReset: async ({ user }, request) => {
        const appURL = resolveAppURL(request, allTrustedOrigins, baseURL);
        mailer.sendPasswordChanged({
          name: user.name,
          signInUrl: `${appURL}/sign-in`,
          to: user.email,
        });
        await Promise.resolve();
      },
      requireEmailVerification: true,
      resetPasswordTokenExpiresIn: RESET_LIFETIME_SECONDS,
      revokeSessionsOnPasswordReset: true,
      // Not awaited: waiting on the provider would leak whether the address exists.
      sendResetPassword: async ({ url, user }) => {
        mailer.sendPasswordReset({
          expiresInMinutes: RESET_LIFETIME_SECONDS / SECONDS_PER_MINUTE,
          name: user.name,
          resetUrl: url,
          to: user.email,
        });
        await Promise.resolve();
      },
    },
    emailVerification: {
      afterEmailVerification: async ({ email, id, name }, request) => {
        const appURL = resolveAppURL(request, allTrustedOrigins, baseURL);
        mailer.sendWelcome({
          getStartedUrl: appURL,
          name,
          to: email,
          userId: id,
        });
        await Promise.resolve();
      },
      autoSignInAfterVerification: true,
      expiresIn: VERIFICATION_LIFETIME_SECONDS,
      sendOnSignIn: true,
      sendOnSignUp: true,
      sendVerificationEmail: async ({ url, user }) => {
        mailer.sendVerification({
          expiresInMinutes: VERIFICATION_LIFETIME_SECONDS / SECONDS_PER_MINUTE,
          name: user.name,
          to: user.email,
          verificationUrl: url,
        });
        await Promise.resolve();
      },
    },
    hooks: {
      // With requireEmailVerification on, Better Auth answers a sign-up for an
      // existing address with a fake success, so the form can't say "you already
      // have an account". We choose to tell people, so this checks first and
      // refuses with the same error Better Auth uses when verification is off.
      // The owner is also emailed, so they know someone tried their address.
      // Sign-up is rate limited below, which limits how fast addresses can be probed.
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/sign-up/email") {
          return;
        }
        const body = signUpBodySchema.safeParse(ctx.body);
        if (!body.success) {
          return;
        }
        const existing = await ctx.context.internalAdapter.findUserByEmail(
          body.data.email.toLowerCase()
        );
        if (existing === null) {
          return;
        }
        const appURL = resolveAppURL(ctx.request, allTrustedOrigins, baseURL);
        mailer.sendAccountExists({
          forgotPasswordUrl: `${appURL}/forgot-password`,
          name: existing.user.name,
          signInUrl: `${appURL}/login`,
          to: existing.user.email,
        });
        throw new APIError("UNPROCESSABLE_ENTITY", {
          code: "USER_ALREADY_EXISTS",
          message: "An account with this email already exists.",
        });
      }),
    },
    plugins: [
      organization({
        ac,
        // Inviting someone completes the club's "team" step.
        organizationHooks: {
          afterCreateInvitation: async ({ invitation }) => {
            await completeOnboardingStep(
              db,
              { organizationId: invitation.organizationId },
              "team",
              invitation.inviterId
            );
          },
        },
        roles: organizationRoles,
        // The invitation id in the link is the token: the accept page looks the
        // invitation up with it, and only the invited email can accept.
        sendInvitationEmail: async (data) => {
          mailer.sendInvitation({
            inviteUrl: `${platformURL}/accept-invite/${data.id}`,
            inviterName: data.inviter.user.name,
            teamName: data.organization.name,
            to: data.email,
          });
          await Promise.resolve();
        },
      }),
      // Lets the native app sign in with a bearer-style cookie store and deep links.
      expo(),
      // Origins default to baseURL plus trustedOrigins, so the web app is covered.
      passkey({ rpID: passkeyOptions.rpID, rpName: passkeyOptions.rpName }),
      ...createStripeBilling({
        ...billing,
        canManageBilling: async ({ organizationId, userId }) =>
          await isBillingManager(db, { organizationId, userId }),
        onClubSubscribed: async (organizationId) => {
          await completeOnboardingStep(db, { organizationId }, "billing");
        },
      }),
    ],
    rateLimit: {
      customRules: {
        "/request-password-reset": SIGN_IN_RATE_LIMIT,
        "/sign-in/email": SIGN_IN_RATE_LIMIT,
        "/sign-in/passkey": SIGN_IN_RATE_LIMIT,
        "/sign-up/email": SIGN_IN_RATE_LIMIT,
      },
      enabled: rateLimitEnabled,
    },
    secret,
    session: {
      // Sessions are checked on every API request. The signed cookie answers
      // that without a database query; the price is that a revoked session or a
      // changed active organization is noticed up to this long late.
      cookieCache: { enabled: true, maxAge: SESSION_COOKIE_CACHE_SECONDS },
      expiresIn: SESSION_LIFETIME_DAYS * SECONDS_PER_DAY,
      freshAge: SESSION_FRESH_MINUTES * SECONDS_PER_MINUTE,
      updateAge: SESSION_REFRESH_DAYS * SECONDS_PER_DAY,
    },
    trustedOrigins: allTrustedOrigins,
    user: {
      changeEmail: { enabled: false },
      deleteUser: { enabled: false },
    },
  });
};

export type Auth = ReturnType<typeof createAuth>;

/** The signed-in session: `{ session, user }`, inferred from the server config. */
export type AuthSession = Auth["$Infer"]["Session"];
export type AuthUser = AuthSession["user"];
