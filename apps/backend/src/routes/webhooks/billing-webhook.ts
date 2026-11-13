import * as HttpStatusCodes from "stoker/http-status-codes";

import { createRouter } from "@/lib/create-app";
import { getClubBilling } from "@/services/club-billing";
import { processBillingEvent } from "@/services/club-subscriptions";

/**
 * Stripe webhook for the club subscription. Not behind a session: Stripe calls
 * it, so the only proof of who is calling is the signature, checked against the
 * raw body before anything else happens.
 *
 * A bad signature gets 400 and is never retried. Events we do not act on, and
 * ones we have already handled, get 200 so Stripe stops resending. An
 * unexpected failure throws, which answers 500 and lets Stripe retry.
 */
const router = createRouter().post("/webhooks/stripe/billing", async (c) => {
  const signature = c.req.header("stripe-signature");
  if (signature === undefined) {
    return c.json(
      { message: "Missing signature" },
      HttpStatusCodes.BAD_REQUEST
    );
  }
  const payload = await c.req.text();

  let event;
  try {
    event = getClubBilling().verifyEvent(payload, signature);
  } catch {
    return c.json(
      { message: "Invalid signature" },
      HttpStatusCodes.BAD_REQUEST
    );
  }

  const outcome = await processBillingEvent(event);
  if (outcome === "unmatched") {
    c.get("logger").warn(
      { eventId: event.id, type: event.type },
      "Stripe subscription event could not be matched to a club"
    );
  }
  return c.json({ received: true }, HttpStatusCodes.OK);
});

export default router;
