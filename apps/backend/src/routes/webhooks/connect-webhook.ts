import { toMemberPayment } from "@alice/payments";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { createRouter } from "@/lib/create-app";
import { getConnect } from "@/services/connect";
import { ConnectNotConfiguredError } from "@/services/connect-error";
import { recordMemberPayment } from "@/services/member-payments";

/**
 * Stripe Connect webhook. Not behind a session: Stripe calls it, so the only
 * proof of who is calling is the signature, checked against the raw body before
 * anything else happens. Point the Stripe endpoint here, on connected accounts.
 *
 * A bad signature gets 400 and is never retried. Events we do not act on, and
 * ones we cannot match to a club or charge, get 200 so Stripe stops resending.
 * An unexpected failure throws, which answers 500 and lets Stripe retry.
 */
const router = createRouter().post("/webhooks/stripe/connect", async (c) => {
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
    event = getConnect().verifyEvent(payload, signature);
  } catch (error) {
    // Not configured is our problem (503, handled by onError); a bad signature is the caller's.
    if (error instanceof ConnectNotConfiguredError) {
      throw error;
    }
    return c.json(
      { message: "Invalid signature" },
      HttpStatusCodes.BAD_REQUEST
    );
  }

  const payment = toMemberPayment(event);
  if (payment === null) {
    return c.json({ received: true }, HttpStatusCodes.OK);
  }

  const outcome = await recordMemberPayment(payment);
  if (outcome !== "recorded" && outcome !== "duplicate") {
    c.get("logger").warn(
      { chargeId: payment.chargeId, eventId: event.id, outcome },
      "Stripe payment could not be matched"
    );
  }
  return c.json({ received: true }, HttpStatusCodes.OK);
});

export default router;
