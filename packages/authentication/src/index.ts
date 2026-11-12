/** Public entry point for @alice/authentication. */

export { createAuth } from "./create-auth";

export { isBillingManager } from "./billing-access";

export type {
  Auth,
  AuthSession,
  AuthUser,
  CreateAuthOptions,
} from "./create-auth";

export type { AuthMailer } from "./mailer";
