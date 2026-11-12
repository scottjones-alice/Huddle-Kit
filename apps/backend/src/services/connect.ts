import { createStripeConnect } from "@alice/payments";
import type { StripeConnect } from "@alice/payments";
import { connectKeys } from "@alice/payments/connect-keys";

import { ConnectNotConfiguredError } from "@/services/connect-error";

let connect: StripeConnect | undefined;

/**
 * The Stripe Connect client, created on first use so an app without Connect
 * keys still starts. Throws ConnectNotConfiguredError when they are missing.
 */
export const getConnect = (): StripeConnect => {
  if (connect !== undefined) {
    return connect;
  }
  const { STRIPE_CONNECT_SECRET_KEY, STRIPE_CONNECT_WEBHOOK_SECRET } =
    connectKeys();
  if (
    STRIPE_CONNECT_SECRET_KEY === undefined ||
    STRIPE_CONNECT_WEBHOOK_SECRET === undefined
  ) {
    throw new ConnectNotConfiguredError();
  }
  connect = createStripeConnect({
    secretKey: STRIPE_CONNECT_SECRET_KEY,
    webhookSecret: STRIPE_CONNECT_WEBHOOK_SECRET,
  });
  return connect;
};
