import { createClubBilling } from "@alice/payments";
import type { ClubBilling } from "@alice/payments";
import { keys as paymentKeys } from "@alice/payments/keys";

let billing: ClubBilling | undefined;

/**
 * The Stripe client for clubs paying Huddlekit, created on first use so
 * importing a route never reads the environment.
 */
export const getClubBilling = (): ClubBilling => {
  if (billing !== undefined) {
    return billing;
  }
  const {
    AUTH_STRIPE_CLUB_ANNUAL_PRICE_ID,
    AUTH_STRIPE_CLUB_PRICE_ID,
    AUTH_STRIPE_SECRET_KEY,
    AUTH_STRIPE_WEBHOOK_SECRET,
  } = paymentKeys();
  billing = createClubBilling({
    clubAnnualPriceId: AUTH_STRIPE_CLUB_ANNUAL_PRICE_ID,
    clubPriceId: AUTH_STRIPE_CLUB_PRICE_ID,
    secretKey: AUTH_STRIPE_SECRET_KEY,
    webhookSecret: AUTH_STRIPE_WEBHOOK_SECRET,
  });
  return billing;
};
